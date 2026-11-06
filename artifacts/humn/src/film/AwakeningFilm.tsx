import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AWAKENING_XFADE_VH, clamp } from './config';
import { stageState } from './progressBus';
import { createSideStrands } from './sideStrands';
import MobileAwakeningAccents from './MobileAwakeningAccents';

gsap.registerPlugin(ScrollTrigger);

/* The awakening shot, scrubbed by scroll from a pre-decoded image sequence
   drawn to a canvas. A <video> seek per frame stutters (seeks are async and
   land unevenly); bitmaps already in memory draw instantly, and adjacent
   frames are cross-blended so slow scrolls stay smooth between source frames. */

const FRAME_COUNT = 479; // 48fps: source 24fps + motion-interpolated in-betweens
/* scroll distance (vh) the video plays over — short, so it feels snappy */
const PLAY_VH = 170;
const RANGE_VH = PLAY_VH + AWAKENING_XFADE_VH;
const AWAKENING_VH = 100 + RANGE_VH;
/* where in the film's progress the dissolve starts, and where the video
   lands its last frame (a little into the dissolve, so it never freezes) */
const XFADE_FROM = PLAY_VH / RANGE_VH;
const VIDEO_END = (PLAY_VH + 0.35 * AWAKENING_XFADE_VH) / RANGE_VH;

/* Scroll speed curve. The opening plays FAST_RATIO x quicker per scroll than
   the ending; the change eases in over [SLOW_FROM, SLOW_TO] of the scroll so
   the slowdown lands just before the nose flash (~66% into the video). */
const FAST_RATIO = 2.6;
const SLOW_FROM = 0.3;
const SLOW_TO = 0.42;

/* progress -> frame position lookup, integrated from the speed curve */
const LUT_STEPS = 1000;
const FRAME_LUT = (() => {
  const lut = new Float32Array(LUT_STEPS + 1);
  let acc = 0;
  for (let k = 1; k <= LUT_STEPS; k++) {
    const t = clamp((k / LUT_STEPS - SLOW_FROM) / (SLOW_TO - SLOW_FROM));
    const ease = t * t * (3 - 2 * t);
    acc += FAST_RATIO * (1 - ease) + ease;
    lut[k] = acc;
  }
  for (let k = 0; k <= LUT_STEPS; k++) lut[k] = (lut[k] / acc) * (FRAME_COUNT - 1);
  return lut;
})();
const framePos = (p: number) => {
  const x = clamp(p) * LUT_STEPS;
  const k = Math.min(LUT_STEPS - 1, Math.floor(x));
  return FRAME_LUT[k] + (FRAME_LUT[k + 1] - FRAME_LUT[k]) * (x - k);
};
/* Screenshot-selected opening: neural branches in place, eyes still closed,
   just before the nose lights up. Desktop retains the complete shot. */
const MOBILE_START_FRAME = 300;
const MOBILE_START_P = (() => {
  for (let i = 1; i <= LUT_STEPS; i++) {
    if (FRAME_LUT[i] >= MOBILE_START_FRAME) {
      return (i - 1 + (MOBILE_START_FRAME - FRAME_LUT[i - 1]) /
        (FRAME_LUT[i] - FRAME_LUT[i - 1])) / LUT_STEPS;
    }
  }
  return 1;
})();
const MOBILE_VIDEO_VH = (PLAY_VH + 0.35 * AWAKENING_XFADE_VH) * (1 - MOBILE_START_P) / 1.5;
const MOBILE_PLAY_VH = MOBILE_VIDEO_VH - 0.35 * AWAKENING_XFADE_VH;
const MOBILE_RANGE_VH = MOBILE_PLAY_VH + AWAKENING_XFADE_VH;
/* The shot is shown near the footage's real size, never blown up to cover
   the screen (the user's source is 1280x718; stretching it is what made it
   muddy). Keep these in step with the .awakening-poster rules in film.css.
   - portrait: the frame spans PORTRAIT_SPAN screen widths (sides run off
     screen), top and bottom dissolve into ink
   - landscape: the frame sits in the middle at up to 1280 css px, all four
     sides dissolve into ink */
const SOURCE_W = 1280;
const SOURCE_H = 718;
const PORTRAIT_RATIO = 0.9;
const PORTRAIT_SPAN = 1.7;
const LANDSCAPE_MAX_W = 0.72; // of the viewport width
const LANDSCAPE_MAX_H = 0.8; // of the viewport height
const frameCssWidth = (w: number, h: number) =>
  w / h < PORTRAIT_RATIO
    ? w * PORTRAIT_SPAN
    : Math.min(SOURCE_W, w * LANDSCAPE_MAX_W, (h * LANDSCAPE_MAX_H * SOURCE_W) / SOURCE_H);
/* dissolve depth at each edge, as a share of the frame */
const EDGE_TOP = 0.3;
const EDGE_BOTTOM = 0.38;
const EDGE_SIDE = 0.24;
/* eased ink → clear, so the dissolve has no visible start or end line */
const FEATHER: Array<[number, number]> = [
  [0, 1],
  [0.15, 0.93],
  [0.32, 0.74],
  [0.5, 0.48],
  [0.68, 0.24],
  [0.84, 0.08],
  [1, 0],
];

/* Two frame sets: the 1280px set (the footage as delivered) whenever the
   frame is drawn at about that size or smaller, the 1920px set (denoised,
   lanczos-upscaled, sharpened) only when it is drawn larger, e.g. on
   high-DPI laptops. */
const pickFrameDir = () => {
  const px =
    frameCssWidth(window.innerWidth, window.innerHeight) * Math.min(window.devicePixelRatio || 1, 2);
  const saveData = (navigator as unknown as { connection?: { saveData?: boolean } }).connection
    ?.saveData;
  return px >= 1400 && !saveData ? 'awakening-hd' : 'awakening';
};
const frameUrl = (dir: string, i: number) =>
  `${import.meta.env.BASE_URL}film/${dir}/f${String(i + 1).padStart(3, '0')}.webp`;

/* coarse-to-fine load order: every 16th frame first, then 8th, 4th, 2nd, rest,
   so the whole shot is scrubbable early and fills in detail as it loads */
const loadOrder = () => {
  const seen = new Uint8Array(FRAME_COUNT);
  const order: number[] = [];
  for (const step of [16, 8, 4, 2, 1]) {
    for (let i = 0; i < FRAME_COUNT; i += step) {
      if (!seen[i]) {
        seen[i] = 1;
        order.push(i);
      }
    }
  }
  if (!seen[FRAME_COUNT - 1]) order.push(FRAME_COUNT - 1);
  return order;
};

export default function AwakeningFilm() {
  const driverRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskRef = useRef<HTMLCanvasElement>(null);
  const posterRef = useRef<HTMLImageElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const strandsRef = useRef<HTMLDivElement>(null);
  const strandLRef = useRef<HTMLCanvasElement>(null);
  const strandRRef = useRef<HTMLCanvasElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const driver = driverRef.current!;
    const canvas = canvasRef.current!;
    /* transparent until the first frame lands, so the poster shows through */
    const ctx = canvas.getContext('2d')!;
    /* static layer over the frame: ink round it, the edge dissolves and the
       vignette. Drawn once per resize, never per frame — a live CSS gradient
       or per-frame gradient fills over a changing canvas is what made
       Firefox choke. */
    const mask = maskRef.current!;
    const mctx = mask.getContext('2d')!;
    const poster = posterRef.current!;
    let shown = false;
    /* Firefox paints canvas 2D far slower than Chrome/Safari (often in
       software), so there the shot skips the in-between cross-blend (one
       draw per frame, not two), uses plain bilinear smoothing (the frame is
       drawn at about 1:1, so it looks the same), and the side strands and
       grain get lighter (sideStrands.ts, film.css .gecko) */
    const gecko = /firefox/i.test(navigator.userAgent);
    document.documentElement.classList.toggle('gecko', gecko);
    const smoothQ: ImageSmoothingQuality = gecko ? 'low' : 'high';
    const strands = createSideStrands(strandLRef.current!, strandRRef.current!, gecko);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = smoothQ;
    const heroEl = heroRef.current!;
    const cueEl = cueRef.current!;
    const stageEl = stageRef.current!;
    const charEls = Array.from(heroEl.querySelectorAll<HTMLElement>('.ch'));
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const jump = new URLSearchParams(window.location.search).get('jump');
    const touch = window.matchMedia('(pointer: coarse)').matches;
    const mobile = window.matchMedia('(max-width: 767px)').matches ||
      window.matchMedia('(max-aspect-ratio: 9/10)').matches;
    const firstFrame = mobile ? MOBILE_START_FRAME : 0;
    const videoEnd = mobile ? MOBILE_VIDEO_VH / MOBILE_RANGE_VH : VIDEO_END;
    const xfadeFrom = mobile ? MOBILE_PLAY_VH / MOBILE_RANGE_VH : XFADE_FROM;
    if (mobile) {
      driver.style.height = `${100 + MOBILE_RANGE_VH}vh`;
      poster.src = frameUrl('awakening', firstFrame);
    }

    /* — frames —
       Decoded 1080p frames are ~8MB each (479 of them would be ~4GB), so the
       browser would keep evicting and re-decoding them on the main thread
       mid-scroll: that was the stutter. Instead the compressed files stay in
       memory as blobs (~30MB), and only a small window of frames around the
       playhead is decoded to ImageBitmaps, off the main thread, biased in the
       scroll direction. Every KEY_STEP-th frame is also kept decoded at half
       size, so a fast flick always has something close to show. */
    const dir = pickFrameDir();
    const hd = dir === 'awakening-hd';
    const WINDOW = hd ? 30 : 24; // full-size decoded frames held at once
    const KEY_STEP = 8;
    const PARALLEL = Math.max(2, Math.min(4, (navigator.hardwareConcurrency || 4) - 2));
    const blobs: (Blob | null)[] = new Array(FRAME_COUNT).fill(null);
    const full = new Map<number, ImageBitmap>();
    const keys = new Map<number, ImageBitmap>();
    const decoding = new Set<number>();
    let disposed = false;
    let dirty = true;
    let srcW = hd ? 1920 : 1280;
    let srcH = hd ? 1078 : 718;
    let center = firstFrame; // playhead frame
    let heading = 1; // scroll direction
    let exact = false; // last draw showed the exact frame
    let keyless = false;

    const decodeKey = (i: number) => {
      const blob = blobs[i];
      if (!blob || keyless || keys.has(i)) return;
      createImageBitmap(blob, {
        resizeWidth: Math.round(srcW / 2),
        resizeHeight: Math.round(srcH / 2),
        resizeQuality: 'medium',
      })
        .then((bmp) => {
          if (disposed) return bmp.close();
          /* browsers that ignore the resize options (older Safari) would hold
             full-size key frames; skip them there to keep memory bounded */
          if (bmp.width > srcW * 0.6) {
            bmp.close();
            keyless = true;
            return;
          }
          keys.set(i, bmp);
          if (!exact) dirty = true;
        })
        .catch(() => {});
    };

    const decodeFull = (i: number) => {
      const blob = blobs[i];
      if (!blob) return;
      decoding.add(i);
      createImageBitmap(blob)
        .then((bmp) => {
          if (disposed) return bmp.close();
          full.set(i, bmp);
          if (Math.abs(i - center) <= 2) dirty = true;
          /* evict the frames furthest from the playhead */
          while (full.size > WINDOW) {
            let far = -1;
            let farD = -1;
            full.forEach((_, k) => {
              const d = Math.abs(k - center);
              if (d > farD) {
                farD = d;
                far = k;
              }
            });
            full.get(far)!.close();
            full.delete(far);
          }
        })
        .catch(() => {})
        .finally(() => {
          decoding.delete(i);
          pump();
        });
    };

    /* next frame to decode: nearest missing one, ahead first */
    const nextWanted = () => {
      const ahead = Math.round(WINDOW * 0.7);
      const behind = WINDOW - ahead;
      for (let d = 0; d <= ahead; d++) {
        const a = center + d * heading;
        if (a >= 0 && a < FRAME_COUNT && blobs[a] && !full.has(a) && !decoding.has(a)) return a;
        if (d > 0 && d <= behind) {
          const b = center - d * heading;
          if (b >= 0 && b < FRAME_COUNT && blobs[b] && !full.has(b) && !decoding.has(b)) return b;
        }
      }
      return -1;
    };
    function pump() {
      while (!disposed && decoding.size < PARALLEL) {
        const i = nextWanted();
        if (i < 0) break;
        decodeFull(i);
      }
    }

    /* fetch the compressed frames: first frame, then coarse-to-fine */
    const fetchFrame = (i: number) =>
      fetch(frameUrl(dir, i))
        .then((r) => (r.ok ? r.blob() : null))
        .then((b) => {
          if (disposed || !b) return;
          blobs[i] = b;
          if (i % KEY_STEP === 0) decodeKey(i);
          if (Math.abs(i - center) <= WINDOW) pump();
        })
        .catch(() => {});
    (async () => {
      await fetchFrame(firstFrame);
      const b0 = blobs[firstFrame];
      if (b0) {
        const bmp = await createImageBitmap(b0).catch(() => null);
        if (bmp && !disposed) {
          srcW = bmp.width;
          srcH = bmp.height;
          full.set(firstFrame, bmp);
          resize();
        }
      }
      const queue = loadOrder().filter((i) => i >= firstFrame && i !== firstFrame);
      const worker = async () => {
        while (queue.length && !disposed) await fetchFrame(queue.shift()!);
      };
      await Promise.all([worker(), worker(), worker(), worker(), worker(), worker()]);
    })();

    /* best available image for frame i */
    const pick = (i: number): ImageBitmap | null => {
      for (let d = 1; d <= 2; d++) {
        const a = full.get(i - d * heading) ?? full.get(i + d * heading);
        if (a) return a;
      }
      const k = Math.round(i / KEY_STEP) * KEY_STEP;
      const key = keys.get(k) ?? keys.get(k - KEY_STEP) ?? keys.get(k + KEY_STEP);
      if (key) return key;
      let best: ImageBitmap | null = null;
      let bestD = Infinity;
      full.forEach((v, j) => {
        if (Math.abs(j - i) < bestD) {
          bestD = Math.abs(j - i);
          best = v;
        }
      });
      keys.forEach((v, j) => {
        if (Math.abs(j - i) < bestD) {
          bestD = Math.abs(j - i);
          best = v;
        }
      });
      return best;
    };

    /* — canvas sizing: the video canvas covers only the on-screen part of
       the frame box (see frameCssWidth), never the whole screen, and never
       holds more pixels than the footage has — */
    let portrait = false;
    let fx = 0; // frame box inside the video canvas (canvas px)
    let fy = 0;
    let fw = 0;
    let fh = 0;
    function resize() {
      const w = stageEl.clientWidth || 1;
      const h = stageEl.clientHeight || 1;
      portrait = w / h < PORTRAIT_RATIO;
      const bw = frameCssWidth(w, h);
      const bh = (bw * srcH) / srcW;
      const bx = (w - bw) / 2;
      const by = (h - bh) / 2;
      const vx = Math.max(0, Math.floor(bx));
      const vy = Math.max(0, Math.floor(by));
      const vw = Math.min(w, Math.ceil(bx + bw)) - vx;
      const vh = Math.min(h, Math.ceil(by + bh)) - vy;
      const scale = bw / srcW; // css px per source px
      const dpr = Math.min(window.devicePixelRatio || 1, 2, Math.max(1, 1.05 / scale));
      canvas.width = Math.round(vw * dpr);
      canvas.height = Math.round(vh * dpr);
      Object.assign(canvas.style, {
        left: `${vx}px`,
        top: `${vy}px`,
        width: `${vw}px`,
        height: `${vh}px`,
      });
      fx = (bx - vx) * dpr;
      fy = (by - vy) * dpr;
      fw = bw * dpr;
      fh = bh * dpr;
      paintMask(w, h, bx, by, bw, bh);
      strands.resize(w, h, bw, portrait);
      /* resizing a canvas resets its context state */
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = smoothQ;
      dirty = true;
    }

    /* the box is computed from the source size, so half-size key frames
       fill the same box */
    const drawCover = (img: ImageBitmap) => {
      ctx.drawImage(img, fx, fy, fw, fh);
    };

    /* the static layer, in css px (it is all soft gradients, so 1x is
       plenty): ink around the frame and eased (edgeless) dissolves at its
       edges — top and bottom always, the sides too when they are on screen;
       the overlapping ramps multiply, so corners round off with no seam —
       then the vignette over everything */
    function paintMask(w: number, h: number, bx: number, by: number, bw: number, bh: number) {
      mask.width = Math.round(w);
      mask.height = Math.round(h);
      const m = mctx;
      const feather = (x0: number, y0: number, x1: number, y1: number) => {
        const g = m.createLinearGradient(x0, y0, x1, y1);
        for (const [t, a] of FEATHER) g.addColorStop(t, `rgba(5, 7, 11, ${a})`);
        m.fillStyle = g;
        if (x0 === x1) m.fillRect(0, Math.min(y0, y1), w, Math.abs(y1 - y0));
        else m.fillRect(Math.min(x0, x1), 0, Math.abs(x1 - x0), h);
      };
      m.fillStyle = '#05070b';
      m.fillRect(0, 0, w, Math.ceil(by) + 1);
      m.fillRect(0, Math.floor(by + bh) - 1, w, h);
      if (!portrait) {
        m.fillRect(0, 0, Math.ceil(bx) + 1, h);
        m.fillRect(Math.floor(bx + bw) - 1, 0, w, h);
        feather(bx, 0, bx + bw * EDGE_SIDE, 0);
        feather(bx + bw, 0, bx + bw * (1 - EDGE_SIDE), 0);
      }
      feather(0, by, 0, by + bh * EDGE_TOP);
      feather(0, by + bh, 0, by + bh * (1 - EDGE_BOTTOM));
      /* vignette: radial-gradient(120% 90% at 50% 46%, transparent 52%,
         rgba(4, 4, 5, 0.5) 100%) */
      const rx = w * 1.2;
      const ry = h * 0.9;
      m.save();
      m.translate(w * 0.5, h * 0.46);
      m.scale(1, ry / rx);
      const v = m.createRadialGradient(0, 0, 0, 0, 0, rx);
      v.addColorStop(0.52, 'rgba(4, 4, 5, 0)');
      v.addColorStop(1, 'rgba(4, 4, 5, 0.5)');
      m.fillStyle = v;
      m.fillRect(-rx, -rx, rx * 2, rx * 2);
      m.restore();
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(stageEl);

    let lastPos = -1;
    const draw = (p: number) => {
      /* A uniform mobile pace avoids the previous slowdown. The remaining
         shot takes exactly two-thirds of its former scroll distance. */
      const pos = mobile
        ? firstFrame + clamp(p / videoEnd) * (FRAME_COUNT - 1 - firstFrame)
        : framePos(p / videoEnd);
      const i0 = Math.floor(pos);
      if (i0 !== center) {
        heading = i0 > center ? 1 : -1;
        center = i0;
        pump();
      }
      if (!dirty && Math.abs(pos - lastPos) < 0.002) return;
      dirty = false;
      lastPos = pos;
      const i1 = Math.min(FRAME_COUNT - 1, i0 + 1);
      const f = pos - i0;
      const a = full.get(i0) ?? pick(i0);
      if (!a) return;
      exact = full.has(i0);
      ctx.globalAlpha = 1;
      drawCover(a);
      const b = exact && !gecko ? full.get(i1) : undefined;
      if (b && f > 0.02) {
        ctx.globalAlpha = f;
        drawCover(b);
        ctx.globalAlpha = 1;
      }
      /* first frame on screen: the poster under it is no longer needed
         (its CSS mask would otherwise be re-composited every frame) */
      if (!shown) {
        shown = true;
        mask.style.visibility = 'visible';
        poster.style.visibility = 'hidden';
      }
    };

    /* — progress — */
    let target = 0;
    let smooth = 0;
    const st = ScrollTrigger.create({
      trigger: driver,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        target = self.progress;
      },
    });

    let lastFade = -1;
    let lastDrift = -1;
    let lastHeroA = 1;
    const render = (p: number) => {
      draw(p);
      /* hero title lifts away over the first stretch */
      const heroA = 1 - clamp(p / 0.12);
      if (heroA > 0 || lastHeroA > 0) {
        heroEl.style.opacity = String(heroA);
        heroEl.style.transform = `translateY(${p * 160}px)`;
      }
      lastHeroA = heroA;
      cueEl.style.opacity = String(clamp(1 - p / 0.05));
      const drift = clamp(p / 0.12);
      if (p > 0.002 && drift !== lastDrift) {
        lastDrift = drift;
        const mid = (charEls.length - 1) / 2;
        charEls.forEach((c, ci) => {
          const off = ci - mid;
          c.style.transform = `translateY(${drift * off * -13}px) rotate(${drift * off * 0.7}deg)`;
        });
      }
      /* dissolve straight into the strand film pinned underneath. Driven by
         the further of film and raw scroll, so a fast flick never carries a
         half-visible stage (and its edge) up the screen. */
      const x = clamp((Math.max(p, target) - xfadeFrom) / (1 - xfadeFrom));
      const fade = 1 - x * x * (3 - 2 * x);
      if (fade !== lastFade) {
        lastFade = fade;
        stageEl.style.opacity = String(fade);
        stageEl.style.visibility = fade < 0.001 ? 'hidden' : 'visible';
        stageEl.classList.toggle('awakening-accent-off', fade < 0.001);
      }
      stageState.awakeningOpaque = fade > 0.999;
    };

    let lastSmooth = NaN;
    let lastTarget = NaN;
    const tick = () => {
      /* light smoothing only — Lenis already eases the scroll; more would lag */
      smooth += (target - smooth) * (reduced || touch ? 1 : 0.42);
      if (Math.abs(target - smooth) < 1e-5) smooth = target;
      /* only touch the page when something actually moved — once the visitor
         is past the opening this costs nothing for the rest of the page */
      if (dirty || smooth !== lastSmooth || target !== lastTarget) {
        lastSmooth = smooth;
        lastTarget = target;
        render(smooth);
      }
      /* side strands: stay put and fade with the head (they sit in the stage) */
      if (strands.on && lastFade > 0.001 && target < 1) {
        strands.draw(reduced ? 0 : performance.now() / 1000, smooth);
      }
    };
    gsap.ticker.add(tick);

    /* the intro (title rising, tagline, cue, strands) is pure CSS in
       film.css: it runs on the compositor from the first paint, so the
       heavy page-load work (frames, WebGL) can never make it stutter */

    const settle = () => {
      if (jump !== null) {
        window.scrollTo(0, Number(jump) || 0);
        ScrollTrigger.refresh();
      }
      target = st.progress;
      smooth = target;
      dirty = true;
      render(smooth);
    };
    if (document.fonts?.ready) document.fonts.ready.then(settle);
    else settle();

    return () => {
      disposed = true;
      full.forEach((b) => b.close());
      keys.forEach((b) => b.close());
      full.clear();
      keys.clear();
      stageState.awakeningOpaque = false;
      ro.disconnect();
      gsap.ticker.remove(tick);
      st.kill();
    };
  }, []);

  return (
    <div
      ref={driverRef}
      className="film-driver awakening"
      style={{ height: `${AWAKENING_VH}vh` }}
      aria-label="HUMN — evolving human intelligence"
    >
      <div ref={stageRef} className="film-stage">
        <picture>
          <source
            media="(max-width: 767px), (max-aspect-ratio: 9/10)"
            srcSet={frameUrl('awakening', MOBILE_START_FRAME)}
          />
        <img
          ref={posterRef}
          className="awakening-poster"
          src={`${import.meta.env.BASE_URL}film/awakening.jpg`}
          alt=""
          aria-hidden="true"
        />
        </picture>
        <canvas ref={canvasRef} className="awakening-canvas" />
        <canvas ref={maskRef} className="awakening-mask" />
        <MobileAwakeningAccents />
        <div className="film-grain" />
        <div ref={strandsRef} className="awakening-strands" aria-hidden="true">
          <canvas ref={strandLRef} />
          <canvas ref={strandRRef} />
        </div>

        <div ref={heroRef} className="hero">
          <h1 className="hero-word" aria-label="HUMN">
            {'HUMN'.split('').map((c, i) => (
              <span key={i} className="ch" aria-hidden="true">
                <i style={{ animationDelay: `${0.1 + i * 0.05}s` }}>{c}</i>
              </span>
            ))}
          </h1>
          <div className="hero-tag">EVOLVING HUMAN INTELLIGENCE</div>
        </div>
        <div ref={cueRef} className="hero-cue">
          <div className="line" />
          <span>SCROLL</span>
        </div>

      </div>
    </div>
  );
}
