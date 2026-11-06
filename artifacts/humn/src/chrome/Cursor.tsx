import { useEffect, useRef } from 'react';

/* The cursor is the strand's living point of light.
   - core: a cream point drawn exactly at the pointer every frame (no easing)
   - thread: a soft gold ribbon that follows the point with a gentle, eased
     lag (a short chain of nodes, each easing toward the one ahead, never
     the raw jittery mouse samples) and glides back into the point when the
     hand stops, like the film's ending
   - over links the glow opens into a soft gold ring; a click sends out one
     soft ripple (the Evolve ripples)
   One canvas, only the dirty area is cleared, and the loop sleeps when idle.
   The system cursor is hidden while this runs (html.has-cursor). */

const RIPPLE_MS = 720;
const NODES = 18;
const FOLLOW = 13; // per second; lower = lazier, calmer ribbon
const MAX_SEG = 9; // css px between nodes, caps the ribbon length
const HOT = 'a, button, [role="button"], input, textarea, select, label';

type Pt = { x: number; y: number; t: number };
type Node = { x: number; y: number };

export default function Cursor() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cv = ref.current!;
    const context = cv.getContext('2d');
    if (!context) return;
    const ctx = context;
    const html = document.documentElement;
    html.classList.add('has-cursor');

    let dpr = 1;
    let x = -100;
    let y = -100;
    let visible = false;
    let hot = 0;
    let hotTarget = 0;
    let press = 0;
    let pressTarget = 0;
    const nodes: Node[] = Array.from({ length: NODES }, () => ({ x: -100, y: -100 }));
    let fresh = true;
    let lastT = 0;
    let ribbon = 0;
    let ripples: Pt[] = [];
    let raf = 0;
    let prev: [number, number, number, number] | null = null;

    const size = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      /* clientWidth excludes the scrollbar, so canvas px map 1:1 to clientX */
      const w = html.clientWidth;
      const h = html.clientHeight;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      cv.style.width = `${w}px`;
      cv.style.height = `${h}px`;
      prev = null;
      wake();
    };

    function wake() {
      if (!raf) raf = requestAnimationFrame(frame);
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      x = e.clientX;
      y = e.clientY;
      if (fresh) {
        for (const n of nodes) {
          n.x = e.clientX;
          n.y = e.clientY;
        }
        fresh = false;
      }
      visible = true;
      wake();
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      ripples.push({ x: e.clientX, y: e.clientY, t: performance.now() });
      pressTarget = 1;
      wake();
    };
    const onUp = () => {
      pressTarget = 0;
      wake();
    };
    const onOver = (e: PointerEvent) => {
      hotTarget = (e.target as Element | null)?.closest?.(HOT) ? 1 : 0;
      wake();
    };
    const onLeave = () => {
      visible = false;
      fresh = true;
      wake();
    };

    function frame(now: number) {
      raf = 0;
      const dt = lastT ? Math.min(0.05, (now - lastT) / 1000) : 1 / 60;
      lastT = now;
      /* ribbon: head on the pointer, each node eases toward the one ahead,
         held within MAX_SEG of it */
      nodes[0].x = x;
      nodes[0].y = y;
      const f = 1 - Math.exp(-FOLLOW * dt);
      ribbon = 0;
      for (let i = 1; i < NODES; i++) {
        const a = nodes[i - 1];
        const n = nodes[i];
        n.x += (a.x - n.x) * f;
        n.y += (a.y - n.y) * f;
        const dx = n.x - a.x;
        const dy = n.y - a.y;
        const d = Math.hypot(dx, dy);
        if (d > MAX_SEG) {
          n.x = a.x + (dx / d) * MAX_SEG;
          n.y = a.y + (dy / d) * MAX_SEG;
        }
        ribbon += Math.min(d, MAX_SEG);
      }
      ripples = ripples.filter((r) => now - r.t < RIPPLE_MS);
      hot += (hotTarget - hot) * 0.24;
      if (Math.abs(hotTarget - hot) < 0.003) hot = hotTarget;
      press += (pressTarget - press) * 0.35;
      if (Math.abs(pressTarget - press) < 0.003) press = pressTarget;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (prev) ctx.clearRect(prev[0], prev[1], prev[2] - prev[0], prev[3] - prev[1]);
      let x0 = Infinity;
      let y0 = Infinity;
      let x1 = -Infinity;
      let y1 = -Infinity;
      const grow = (px: number, py: number, r: number) => {
        x0 = Math.min(x0, px - r);
        y0 = Math.min(y0, py - r);
        x1 = Math.max(x1, px + r);
        y1 = Math.max(y1, py + r);
      };

      if (visible) {
        /* ribbon: a smooth curve through the nodes (midpoint quadratics),
           tapering and fading toward the tail; fades out as it shortens */
        const len = Math.min(1, ribbon / 40);
        if (len > 0.02) {
          ctx.lineCap = 'butt'; // round caps overlap at each joint and bead the line
          let px = nodes[0].x;
          let py = nodes[0].y;
          for (let i = 1; i < NODES - 1; i++) {
            const n = nodes[i];
            const mx = (n.x + nodes[i + 1].x) / 2;
            const my = (n.y + nodes[i + 1].y) / 2;
            const k = 1 - i / (NODES - 1);
            const kk = k * k * len;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.quadraticCurveTo(n.x, n.y, mx, my);
            ctx.strokeStyle = `rgba(240, 190, 130, ${0.07 * kk})`;
            ctx.lineWidth = 6 * k + 1;
            ctx.stroke();
            ctx.strokeStyle = `rgba(246, 214, 168, ${0.5 * kk})`;
            ctx.lineWidth = 0.4 + 1.5 * k;
            ctx.stroke();
            px = mx;
            py = my;
          }
        }
        for (const n of nodes) grow(n.x, n.y, 6);

        /* glow: warm, edgeless */
        const gr = 18 + 12 * hot;
        const g = ctx.createRadialGradient(x, y, 0, x, y, gr);
        g.addColorStop(0, `rgba(255, 238, 210, ${0.34 + 0.1 * hot})`);
        g.addColorStop(0.3, `rgba(240, 190, 130, ${0.16 + 0.06 * hot})`);
        g.addColorStop(0.65, 'rgba(240, 190, 130, 0.04)');
        g.addColorStop(1, 'rgba(240, 190, 130, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, gr, 0, Math.PI * 2);
        ctx.fill();
        grow(x, y, gr + 2);

        /* over links: the glow opens into a soft ring of light */
        if (hot > 0.01) {
          const rr = 7 + 13 * hot - 3 * press;
          ctx.lineWidth = 5;
          ctx.strokeStyle = `rgba(240, 190, 130, ${0.1 * hot})`;
          ctx.beginPath();
          ctx.arc(x, y, rr, 0, Math.PI * 2);
          ctx.stroke();
          ctx.lineWidth = 1;
          ctx.strokeStyle = `rgba(246, 214, 168, ${0.8 * hot})`;
          ctx.stroke();
        }

        /* core: cream point, a faint dark rim so it holds on bright frames */
        const cr = (3.2 - 1.1 * hot) * (1 - 0.25 * press);
        ctx.fillStyle = 'rgba(5, 7, 11, 0.35)';
        ctx.beginPath();
        ctx.arc(x, y, cr + 1.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff6e8';
        ctx.beginPath();
        ctx.arc(x, y, cr, 0, Math.PI * 2);
        ctx.fill();
      }

      /* click ripples */
      for (const r of ripples) {
        const a = (now - r.t) / RIPPLE_MS;
        const e = 1 - Math.pow(1 - a, 3);
        const rad = 6 + 46 * e;
        const al = (1 - a) * (1 - a);
        ctx.lineWidth = 6;
        ctx.strokeStyle = `rgba(240, 190, 130, ${0.08 * al})`;
        ctx.beginPath();
        ctx.arc(r.x, r.y, rad, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.strokeStyle = `rgba(246, 214, 168, ${0.55 * al})`;
        ctx.stroke();
        grow(r.x, r.y, rad + 6);
      }

      prev = x0 < x1 ? [Math.floor(x0 - 2), Math.floor(y0 - 2), Math.ceil(x1 + 2), Math.ceil(y1 + 2)] : null;

      const busy = ribbon > 0.3 || ripples.length > 0 || hot !== hotTarget || press !== pressTarget;
      if (busy) wake();
      else lastT = 0; // the next wake starts from a normal frame step
    }

    size();
    window.addEventListener('resize', size);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    document.addEventListener('pointerover', onOver, { passive: true });
    html.addEventListener('pointerleave', onLeave);
    window.addEventListener('blur', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      html.classList.remove('has-cursor');
      window.removeEventListener('resize', size);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointerover', onOver);
      html.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('blur', onLeave);
    };
  }, []);

  return <canvas ref={ref} className="cursor" aria-hidden="true" />;
}
