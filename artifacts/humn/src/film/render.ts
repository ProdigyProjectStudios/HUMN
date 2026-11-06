/* HUMN — procedural world painter. One canvas, one continuous ascent.
   The world scrolls DOWN past the camera as p rises: camera only ever rises. */

import { clamp, easeInOut, easeOut } from './config';

function smoothstep(a: number, b: number, x: number) {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}

interface P {
  x: number;
  y: number;
  s: number;
  ph: number;
  sp: number;
}

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Band top colours: world position i..i+1 blends into the next. */
const BAND_TOP = [
  '#04050A',
  '#070A10',
  '#0C0E12',
  '#14110D',
  '#1D1610',
  '#302215',
];
const BAND_BOT = [
  '#070A10',
  '#0C0E12',
  '#14110D',
  '#1D1610',
  '#302215',
  '#F5EEE3',
];

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mixHex(a: string, b: string, t: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const m = ca.map((v, i) => Math.round(v + (cb[i] - v) * t));
  return `rgb(${m[0]},${m[1]},${m[2]})`;
}

/* Thread colour journey: cold white-blue → silver → champagne → gold → warm white. */
const THREAD_STOPS: Array<[number, string]> = [
  [0, '#D9E8F4'],
  [0.35, '#E7E4DC'],
  [0.6, '#F2DDBA'],
  [0.8, '#F6CFA0'],
  [0.92, '#FFF3DF'],
];

function threadColor(p: number): string {
  for (let i = 1; i < THREAD_STOPS.length; i++) {
    if (p <= THREAD_STOPS[i][0]) {
      const [p0, c0] = THREAD_STOPS[i - 1];
      const [p1, c1] = THREAD_STOPS[i];
      return mixHex(c0, c1, (p - p0) / Math.max(1e-4, p1 - p0));
    }
  }
  return '#FFF3DF';
}

export interface Painter {
  paint: (p: number, t: number) => void;
  resize: () => void;
}

export function createPainter(canvas: HTMLCanvasElement, reduced: boolean): Painter {
  const ctx = canvas.getContext('2d')!;
  let w = 0;
  let h = 0;

  const rnd = mulberry32(1379);

  /* Bedrock: the double helix is drawn procedurally — no node state needed. */

  /* Surface dust. */
  const dust: P[] = Array.from({ length: 46 }, () => ({
    x: rnd(),
    y: rnd(),
    s: 0.5 + rnd() * 1.3,
    ph: rnd() * Math.PI * 2,
    sp: 0.4 + rnd() * 0.8,
  }));

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const r = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(r.width * dpr));
    canvas.height = Math.max(1, Math.round(r.height * dpr));
    w = canvas.width;
    h = canvas.height;
  }
  resize();

  function paint(p: number, tRaw: number) {
    const t = reduced ? 0 : tRaw;
    if (w === 0 || h === 0) return;
    const d = p * 5;

    /* — strata field — */
    for (let i = 0; i < 6; i++) {
      const top = (i - d) * h;
      if (top > h || top + h < 0) continue;
      const g = ctx.createLinearGradient(0, top, 0, top + h);
      g.addColorStop(0, BAND_TOP[i]);
      g.addColorStop(1, BAND_BOT[i]);
      ctx.fillStyle = g;
      ctx.fillRect(0, top, w, h);
    }

    /* — per-band textures, crossfaded at the seams — */
    for (let i = 0; i < 6; i++) {
      const top = (i - d) * h;
      if (top > h || top + h < 0) continue;
      const a = clamp(1 - Math.abs(i - d), 0, 1);
      if (a <= 0.004) continue;
      ctx.save();
      ctx.translate(0, top);
      if (i <= 2) paintHelix(a, t, p, i);
      else if (i === 5) paintSurfaceDust(a, t);
      ctx.restore();
    }

    /* warmth leaking in — one shared pool of ambient light that grows with p */
    const warm = clamp((p - 0.04) / 0.8);
    if (warm > 0.001) {
      const g = ctx.createRadialGradient(w / 2, h * 0.55, 0, w / 2, h * 0.55, Math.max(w, h) * 0.65);
      g.addColorStop(0, `rgba(240,203,150,${0.1 * warm})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';
    }

    paintThread(p, t);
  }

  function paintHelix(a: number, t: number, p: number, band: number) {
    /* the helix, evolving: tight DNA in BEDROCK → unwinding in CONTEXT →
       converging into the single thread by TONE */
    const cx = w / 2;
    const ph0 = t * 0.1;
    const warm = clamp((p - 0.04) / 0.8);
    const mixC = (
      c: [number, number, number],
      t2: [number, number, number],
      k: number,
    ) => c.map((v, j) => Math.round(v + (t2[j] - v) * k));
    const ice = mixC([159, 180, 200], [217, 184, 128], warm * 0.35);
    const hum = mixC([240, 191, 128], [245, 209, 153], warm * 0.35);
    /* phase = integral of a linearly falling frequency (4.6 → 2.2 over
       wy 0.6–2.2): the coil relaxes smoothly, never folds */
    const at = (y: number) => {
      const wy = band + y / h;
      const u = clamp(wy - 0.6, 0, 1.6);
      const ph = 4.6 * wy - 2.4 * ((u * u) / 3.2 + Math.max(0, wy - 2.2)) + ph0;
      const draw = smoothstep(1.3, 2.6, wy);
      const amp = 0.14 * (1 - draw) * w;
      const quiet = 1 - 0.78 * smoothstep(1.5, 2.6, wy);
      const fade = 1 - smoothstep(2.3, 2.95, wy);
      return { wy, ph, amp, quiet: quiet * fade };
    };

    /* strands — dimming as they dissolve into the thread */
    ctx.lineWidth = Math.max(1, w / 1600);
    const midQuiet = at(h / 2).quiet;
    for (const [sign, c] of [
      [1, ice],
      [-1, hum],
    ] as Array<[number, number[]]>) {
      ctx.beginPath();
      for (let y = -8; y <= h + 8; y += 6) {
        const { ph, amp } = at(y);
        const x = cx + sign * Math.sin(ph) * amp;
        if (y === -8) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${0.4 * a * midQuiet})`;
      ctx.stroke();
    }

    /* base pairs — evenly spaced (matches the WebGL shader), two
       halves meeting with a hairline gap; they let go as the coil relaxes */
    const PITCH = 0.062;
    ctx.lineWidth = Math.max(0.8, w / 2000);
    for (let i = Math.ceil(band / PITCH); i * PITCH < band + 1; i++) {
      const y = (i * PITCH - band) * h;
      const { wy, ph, amp } = at(y);
      const rungW = 1 - smoothstep(1.15, 2.05, wy);
      if (rungW <= 0.02) continue;
      const xa = cx + Math.sin(ph) * amp;
      const xb = cx - Math.sin(ph) * amp;
      const mid = (xa + xb) / 2;
      const gap = Math.min(3, Math.abs(xb - xa) * 0.06) * Math.sign(xb - xa);
      const al = 0.1 * a * rungW * Math.min(1, Math.abs(xb - xa) / (0.05 * h));
      for (const [x0, x1, c] of [
        [xa, mid - gap, ice],
        [mid + gap, xb, hum],
      ] as Array<[number, number, number[]]>) {
        ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${al})`;
        ctx.beginPath();
        ctx.moveTo(x0, y);
        ctx.lineTo(x1, y);
        ctx.stroke();
      }
    }
  }

  function paintSurfaceDust(a: number, t: number) {
    for (const m of dust) {
      const y = (((m.y + t * 0.006 * m.sp) % 1) + 1) % 1;
      const tw = 0.5 + 0.5 * Math.sin(t * m.sp + m.ph);
      ctx.fillStyle = `rgba(122,92,55,${(0.03 + 0.05 * tw) * a})`;
      ctx.beginPath();
      ctx.arc(m.x * w, y * h, m.s * (w / 1300), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* — the thread: the request, rising — screen space — */
  function paintThread(p: number, t: number) {
    const cx = w / 2;
    const headY = h * (0.68 - 0.38 * easeInOut(p));
    const col = threadColor(p);
    const swayAmp = (w / 110) * (1 - 0.55 * p) + 2;

    const xAt = (y: number, ph: number, amp: number) =>
      cx + Math.sin(y * (8 / h) + ph) * amp;

    const drawPath = (ph: number, amp: number) => {
      ctx.beginPath();
      const y0 = h + 40;
      const steps = 46;
      for (let s = 0; s <= steps; s++) {
        const y = y0 - ((y0 - headY) * s) / steps;
        const x = xAt(y, ph - t * 0.7, amp);
        if (s === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
    };

    const dim = p < 0.015 ? 0.55 : 1;

    /* main thread — layered strokes, never shadowBlur */
    drawPath(0, swayAmp);
    ctx.strokeStyle = `rgba(255,255,255,${0.05 * dim})`;
    ctx.lineWidth = Math.max(6, w / 130);
    ctx.stroke();
    ctx.strokeStyle = col.replace('rgb', 'rgba').replace(')', `,${0.22 * dim})`);
    ctx.lineWidth = Math.max(2.4, w / 520);
    ctx.stroke();
    ctx.strokeStyle = col.replace('rgb', 'rgba').replace(')', `,${0.92 * dim})`);
    ctx.lineWidth = Math.max(1, w / 1400);
    ctx.stroke();

    /* head — the living point. It gathers light from NUANCE onward, brighter
       and brighter, until it breaks the surface. */
    const hx = xAt(headY, -t * 0.7, swayAmp);
    const gather = clamp((p - 0.46) / 0.42);
    const glowR = Math.max(14, w / 60) * (1 + 0.9 * gather);
    const gg = ctx.createRadialGradient(hx, headY, 0, hx, headY, glowR);
    gg.addColorStop(
      0,
      col.replace('rgb', 'rgba').replace(')', `,${Math.min(1, 0.5 * dim * (1 + 1.4 * gather))})`),
    );
    gg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gg;
    ctx.beginPath();
    ctx.arc(hx, headY, glowR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(hx, headY, Math.max(2, w / 700) * (1 + 0.8 * gather), 0, Math.PI * 2);
    ctx.fill();

    /* TRUST — the correction lands as one soft breath of light */
    const pulse = Math.exp(-Math.pow((p - 0.745) / 0.018, 2));
    if (pulse > 0.01) {
      const pr = Math.min(w, h) * 0.16;
      const pg = ctx.createRadialGradient(hx, headY, 0, hx, headY, pr);
      pg.addColorStop(0, `rgba(240,190,130,${0.22 * pulse})`);
      pg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = pg;
      ctx.fillRect(hx - pr, headY - pr, pr * 2, pr * 2);
      ctx.globalCompositeOperation = 'source-over';
    }

    /* bloom — breaking the surface */
    const bloom = clamp((p - 0.84) / 0.16);
    if (bloom > 0.001) {
      const r = easeOut(bloom) * Math.max(w, h) * 1.5;
      const g = ctx.createRadialGradient(hx, headY, 0, hx, headY, r);
      g.addColorStop(0, `rgba(246,238,227,${0.85 * bloom})`);
      g.addColorStop(0.5, `rgba(240,220,190,${0.35 * bloom})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(hx, headY, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  return { paint, resize };
}
