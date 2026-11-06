/* Two strands flanking the head on the opening screen (landscape only; on
   phones the face fills the width). Same language as the strand film below:
   a luminous cream thread with a gentle sway, and a pale machine strand and
   an amber human strand coiling round it in one long, slow twist, the one
   crossing behind dimmed, joined by very faint base pairs (ice half + amber
   half, a hairline gap, a faint bead on each strand): enough to read as DNA,
   never enough to pull the eye. They stay where they are and fade with the head (they
   live inside the awakening stage). Top and bottom dissolve into ink. */

const ICE = '159, 180, 200';
const HUMAN = '240, 191, 128';
const THREAD = '255, 238, 212';
const STEP = 4;
const STOP = 24; // px between gradient stops
const PAIRS = 18; // base pairs per full turn

type Strip = { cv: HTMLCanvasElement; ctx: CanvasRenderingContext2D; phase: number };

/* lite (Firefox): drawn at 1x and without the widest, faintest glow
   layers — its canvas 2D is slow enough that the full strands alone
   made the opening stutter */
export function createSideStrands(
  left: HTMLCanvasElement,
  right: HTMLCanvasElement,
  lite = false,
) {
  const strips: Strip[] = [
    { cv: left, ctx: left.getContext('2d')!, phase: 0 },
    { cv: right, ctx: right.getContext('2d')!, phase: Math.PI * 0.62 },
  ];
  let on = false;
  let h = 0;
  let amp = 0;
  let sway = 0;
  let k = 0;
  let sw = 0;
  let dpr = 1;

  /* w,h: stage size; frameW: width of the video frame (css px) */
  const resize = (w: number, hh: number, frameW: number, portrait: boolean) => {
    const gutter = (w - frameW) / 2;
    on = !portrait && gutter >= 110;
    for (const s of strips) s.cv.style.display = on ? 'block' : 'none';
    if (!on) return;
    h = hh;
    amp = Math.max(28, Math.min(72, gutter * 0.3));
    sway = Math.max(3, amp * 0.08);
    k = (Math.PI * 2) / (h * 1.05); // about one full twist per screen height
    sw = Math.ceil(amp * 2 + 44);
    dpr = lite ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    const centre = gutter * 0.5;
    for (const [i, s] of strips.entries()) {
      s.cv.width = Math.round(sw * dpr);
      s.cv.height = Math.round(h * dpr);
      s.cv.style.width = `${sw}px`;
      s.cv.style.height = `${h}px`;
      s.cv.style.left = `${(i === 0 ? centre : w - centre) - sw / 2}px`;
    }
  };

  /* eased ink envelope top and bottom */
  const env = (u: number) => {
    const a = Math.min(1, u / 0.34);
    const b = Math.min(1, (1 - u) / 0.34);
    const e = Math.max(0, Math.min(a, b));
    const s = e * e * (3 - 2 * e);
    return s * s;
  };

  /* one smooth path, its brightness carried by a vertical gradient, stroked
     wide-and-faint to fine-and-bright so the glow falls off softly */
  const stroke = (
    ctx: CanvasRenderingContext2D,
    xAt: (y: number) => number,
    col: string,
    alphaAt: (y: number) => number,
    layers: Array<[number, number]>,
  ) => {
    ctx.beginPath();
    for (let y = 0; y <= h; y += lite ? STEP * 2 : STEP) {
      if (y === 0) ctx.moveTo(xAt(y), y);
      else ctx.lineTo(xAt(y), y);
    }
    const g = ctx.createLinearGradient(0, 0, 0, h);
    for (let y = 0; y <= h; y += STOP) g.addColorStop(y / h, `rgba(${col}, ${alphaAt(y)})`);
    g.addColorStop(1, `rgba(${col}, 0)`);
    ctx.strokeStyle = g;
    for (const [width, alpha] of layers) {
      if (lite && width >= 10) continue;
      ctx.lineWidth = width;
      ctx.globalAlpha = alpha;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };

  const drawStrip = (s: Strip, t: number, p: number) => {
    const { ctx } = s;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, sw, h);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const cx = sw / 2;
    const ph0 = s.phase + t * 0.1 + p * 2.2;
    const sx = (y: number) => cx + Math.sin((y / h) * 8 + s.phase - t * 0.45) * sway;

    /* base pairs, under the strands */
    const turn = Math.PI * 2;
    const i0 = Math.ceil((ph0 * PAIRS) / turn);
    const i1 = Math.floor(((h * k + ph0) * PAIRS) / turn);
    for (let i = i0; i <= i1; i++) {
      const ph = (i * turn) / PAIRS;
      const y = (ph - ph0) / k;
      const e = env(y / h);
      if (e < 0.01) continue;
      const c = sx(y);
      const half = Math.sin(ph) * amp; // ice end at c + half, amber at c - half
      const len = Math.abs(half) * 2;
      const reach = Math.min(1, len / (amp * 0.5));
      if (reach < 0.02) continue;
      const gap = Math.min(2.2, len * 0.05) * Math.sign(half);
      const front = 0.5 + 0.5 * Math.cos(ph);
      const breathe = 0.6 + 0.4 * Math.sin(i * 2.399 + t * 0.35);
      for (const [x0, col, depth] of [
        [c + half, ICE, 0.4 + 0.6 * front],
        [c - half, HUMAN, 1 - 0.6 * front],
      ] as Array<[number, string, number]>) {
        const x1 = x0 === c + half ? c + gap : c - gap;
        ctx.strokeStyle = `rgba(${col}, ${e * reach})`;
        ctx.beginPath();
        ctx.moveTo(x0, y);
        ctx.lineTo(x1, y);
        ctx.lineWidth = 0.8;
        ctx.globalAlpha = 0.055 * breathe;
        ctx.stroke();
        /* a faint bead where the pair meets its strand */
        ctx.fillStyle = `rgba(${col}, ${e * reach * depth})`;
        ctx.globalAlpha = 0.07 * breathe;
        ctx.beginPath();
        ctx.arc(x0, y, 1.1, 0, turn);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    for (let n = 0; n < 2; n++) {
      const sign = n === 0 ? 1 : -1;
      stroke(
        ctx,
        (y) => sx(y) + sign * Math.sin(y * k + ph0) * amp,
        n === 0 ? ICE : HUMAN,
        (y) => {
          const front = 0.5 + 0.5 * Math.cos(y * k + ph0);
          return (n === 0 ? 0.4 + 0.6 * front : 1 - 0.6 * front) * env(y / h);
        },
        [
          [10, 0.05],
          [3.5, 0.13],
          [1.1, 0.55],
        ],
      );
    }
    /* the luminous thread at the centre */
    stroke(ctx, sx, THREAD, (y) => env(y / h), [
      [16, 0.035],
      [6, 0.09],
      [2.2, 0.22],
      [1.1, 0.75],
    ]);
  };

  /* t: seconds; p: awakening progress */
  let tick = 0;
  const draw = (t: number, p: number) => {
    if (!on) return;
    /* lite: every other frame — they move slowly enough that 30fps reads
       the same */
    if (lite && tick++ % 2) return;
    for (const s of strips) drawStrip(s, t, p);
  };

  return { resize, draw, get on() { return on; } };
}
