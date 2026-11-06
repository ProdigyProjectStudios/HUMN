import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import {
  CHAPTER_COPY,
  FILM_VH,
  AWAKENING_XFADE_VH,
  chapterWindow,
  FLOOD,
  clamp,
  easeOut,
} from './config';
import type { World } from './gl/world';
import { emitProgress, stageState } from './progressBus';

gsap.registerPlugin(ScrollTrigger);
/* phones: the address bar showing/hiding resizes the window; recomputing
   every trigger then makes the page jump mid-scroll */
ScrollTrigger.config({ ignoreMobileResize: true });

export default function Film() {
  const driverRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const grainRef = useRef<HTMLDivElement>(null);
  const seamRef = useRef<HTMLDivElement>(null);
  const vignetteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const driver = driverRef.current!;
    const canvas = canvasRef.current!;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    /* touch: the finger already moves the page natively, so the film follows it
       closely (heavy easing there feels like the page is lagging the finger) */
    const touch = window.matchMedia('(pointer: coarse)').matches;
    const params = new URLSearchParams(window.location.search);
    const jump = params.get('jump');
    if (jump !== null) window.history.scrollRestoration = 'manual';

    // Keep the scroll geometry and chapter copy mounted; load the renderer only
    // as the visitor approaches the handoff. Three.js is not in the entry bundle.
    let disposed = false;
    let loading = false;
    let world: World | null = null;
    let painter: { paint: (p: number, t: number) => void; resize: () => void } | null = null;
    const prepareWorld = async () => {
      if (loading || painter || disposed) return;
      loading = true;
      try {
        const module = await import('./gl/world');
        if (disposed) return;
        world = module.createWorld(canvas, reduced);
        if (world) painter = world;
        else {
          const fallback = await import('./render');
          if (disposed) return;
          painter = fallback.createPainter(canvas, reduced);
        }
        painter.resize();
        renderFrame(smooth, gsap.ticker.time);
      } catch (error) {
        // Chapter copy remains readable even when a renderer chunk cannot load.
        if (import.meta.env.DEV) console.warn('[humn] Renderer unavailable', error);
      }
    };
    const onMove = (e: PointerEvent) => {
      world?.setMouse(
        (e.clientX / window.innerWidth) * 2 - 1,
        1 - (e.clientY / window.innerHeight) * 2,
      );
      /* hover response on the strand: real mice only, never touch */
      if (e.pointerType === 'mouse') {
        world?.setPointer(e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight);
      }
    };
    const onLeave = () => world?.setPointer(null);
    if (!reduced && !touch) {
      window.addEventListener('pointermove', onMove, { passive: true });
      document.documentElement.addEventListener('mouseleave', onLeave);
      window.addEventListener('blur', onLeave);
    }

    /* — Lenis smooth scroll wired into GSAP's ticker — */
    let lenis: Lenis | null = null;
    const lenisTick = (time: number) => lenis?.raf(time * 1000);
    if (!reduced && !touch && jump === null) {
      lenis = new Lenis({
        lerp: 0.1,
        smoothWheel: true,
        // Native touch momentum avoids competing scroll controllers on iOS.
        syncTouch: false,
        anchors: true,
      });
      (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(lenisTick);
      gsap.ticker.lagSmoothing(0);
    }

    /* — master progress (sticky stage, no pin spacers) — */
    let target = 0;
    let smooth = 0;
    let active = true;
    /* only render while the stage is on or near screen, so the WebGL world
       never competes with the awakening film playing above it */
    let onScreen = false;
    const io = new IntersectionObserver(
      (es) => {
        onScreen = es[0].isIntersecting;
        if (onScreen && !document.hidden && window.scrollY > 0) void prepareWorld();
      },
      { rootMargin: '100% 0px 100% 0px' },
    );
    io.observe(driver);
    const st = ScrollTrigger.create({
      trigger: driver,
      /* the first AWAKENING_XFADE_VH of this driver sits under the dissolving
         awakening film, and the strand's timeline runs from its very top:
         the strand is already travelling and the first chapter already
         arriving as the video dissolves, so the handoff is one continuous
         motion with no dead beat */
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        target = self.progress;
      },
      onToggle: (self) => {
        active = self.isActive || self.progress === 0 || self.progress === 1;
      },
    });

    /* — cached DOM for per-frame envelopes — */
    const grainEl = grainRef.current!;
    const seamEl = seamRef.current!;
    const vignetteEl = vignetteRef.current!;
    const chapters = Array.from(driver.querySelectorAll<HTMLElement>('.chap')).map((el, i) => ({
      el,
      w: chapterWindow(i),
      final: el.classList.contains('chap--final'),
      kicker: el.querySelector<HTMLElement>('.chap-kicker')!,
      lines: Array.from(el.querySelectorAll<HTMLElement>('.chap-line > span')),
      rule: el.querySelector<HTMLElement>('.chap-rule')!,
      facts: Array.from(el.querySelectorAll<HTMLElement>('.fact, .chap-sub')),
      shown: false,
    }));

    let domP = NaN;
    let domT = NaN;
    function renderFrame(p: number, t: number) {
      if (!document.hidden) painter?.paint(p, t);
      /* the WebGL world animates every frame; the page copy only changes when
         the scroll does, so skip all style writes while the visitor is still */
      if (p === domP && target === domT) return;
      domP = p;
      domT = target;

      /* chapters: a slow, staggered arrival (kicker, headline line by line,
         rule, facts), a held read with a slight drift, then a soft exit */
      for (const c of chapters) {
        const { a, b, c: hold, d } = c.w;
        const on = p > a && p < d;
        if (on !== c.shown) {
          c.shown = on;
          c.el.style.visibility = on ? 'visible' : 'hidden';
        }
        if (!on) continue;
        const u = clamp((p - a) / (b - a));
        const part = (t0: number, t1: number) => easeOut(clamp((u - t0) / (t1 - t0)));
        const out = hold > 1.5 ? 0 : clamp((p - hold) / (d - hold));
        const outE = out * out * (3 - 2 * out);

        const k = part(0, 0.45);
        c.kicker.style.opacity = String(k);
        c.kicker.style.transform = `translateY(${(1 - k) * 14}px)`;
        c.lines.forEach((ln, j) => {
          const l = part(0.06 + 0.13 * j, 0.6 + 0.13 * j);
          ln.style.opacity = String(l);
          ln.style.transform = `translateY(${(1 - l) * 108}%)`;
        });
        const r = part(0.36, 0.86);
        c.rule.style.transform = `scaleX(${r})`;
        c.rule.style.opacity = String(r);
        const step = Math.min(0.12, 0.26 / Math.max(1, c.facts.length - 1));
        c.facts.forEach((f, j) => {
          const v = part(0.44 + step * j, 0.74 + step * j);
          f.style.opacity = String(v);
          f.style.transform = `translateY(${(1 - v) * 18}px)`;
        });

        /* gentle upward drift across the whole window, quicker on the way out */
        const drift = (p - a) * -90 - outE * 46;
        const x = c.final ? '-50%' : '0px';
        /* --chap-ty: vertical anchor; phones pin some chapters by an edge (film.css) */
        c.el.style.transform = `translate3d(${x}, calc(var(--chap-ty, -50%) + ${drift.toFixed(1)}px), 0)`;
        c.el.style.opacity = String(1 - outE);
        /* blur is costly to repaint every frame on phones; there they just fade */
        const bl = touch ? 0 : outE * 7;
        c.el.style.filter = bl > 0.3 ? `blur(${bl.toFixed(1)}px)` : 'none';
      }

      /* finishing: after the flood peaks, the light settles to ink. Driven by the
         further of film and scroll, so a fast flick never lets the dark stage
         leave with a hard edge against the dark sections below. */
      const seam = clamp((Math.max(p, target) - 0.988) / 0.012);
      seamEl.style.opacity = String(seam);
      grainEl.style.opacity = String(0.05 * (1 - seam));
      vignetteEl.style.opacity = String(1 - clamp((p - FLOOD.from) / 0.04));

      emitProgress(p);
    }

    /* — jank meter: judge p95/max, never average fps — */
    let last = performance.now();
    let maxDelta = 0;
    let meterAt = performance.now();
    const jankTick = () => {
      const now = performance.now();
      maxDelta = Math.max(maxDelta, now - last);
      last = now;
      if (now - meterAt > 2000) {
        if (import.meta.env.DEV && maxDelta > 34)
          console.log(`[humn] rAF max ${maxDelta.toFixed(1)}ms (target < 50ms)`);
        maxDelta = 0;
        meterAt = now;
      }
    };

    const tick = (time: number) => {
      if (document.hidden) return;
      if (onScreen && window.scrollY > 0) void prepareWorld();
      if (import.meta.env.DEV) jankTick();
      smooth += (target - smooth) * (reduced ? 1 : touch ? 0.34 : 0.14);
      if (Math.abs(target - smooth) < 1e-6) smooth = target;
      if (
        onScreen &&
        !stageState.awakeningOpaque &&
        (active || Math.abs(target - smooth) > 1e-5)
      ) {
        if (!reduced || smooth !== domP || target !== domT) renderFrame(smooth, time);
      }
    };
    gsap.ticker.add(tick);

    /* resize */
    const ro = new ResizeObserver(() => {
      painter?.resize();
      domP = NaN;
    });
    ro.observe(canvas);

    /* — dev contract: ?jump=<y> lands pre-scrolled and force-settled — */
    const ready = () => {
      if (disposed) return;
      if (jump !== null) {
        window.scrollTo(0, Number(jump) || 0);
        ScrollTrigger.refresh();
        target = st.progress;
        smooth = target;
        renderFrame(smooth, 0);
      } else {
        renderFrame(0, 0);
      }
      (window as unknown as { __ready?: boolean }).__ready = true;
    };
    if (document.fonts?.ready) document.fonts.ready.then(() => ready());
    else ready();

    return () => {
      disposed = true;
      ro.disconnect();
      io.disconnect();
      gsap.ticker.remove(tick);
      gsap.ticker.remove(lenisTick);
      st.kill();
      lenis?.destroy();
      if (!reduced && !touch) {
        window.removeEventListener('pointermove', onMove);
        document.documentElement.removeEventListener('mouseleave', onLeave);
        window.removeEventListener('blur', onLeave);
      }
      world?.dispose();
      delete (window as unknown as { __lenis?: Lenis }).__lenis;
    };
  }, []);

  return (
    <div
      ref={driverRef}
      className="film-driver"
      style={{ height: `${FILM_VH + AWAKENING_XFADE_VH}vh` }}
      aria-label="HUMN Thread — evolve human intelligence"
      id="layer-film"
    >
      <div className="film-stage">
        <canvas ref={canvasRef} className="film-canvas" aria-hidden="true" />
        <div ref={vignetteRef} className="film-vignette" />
        <div ref={grainRef} className="film-grain" />

        {CHAPTER_COPY.map((c, i) => (
          <section
            key={i}
            className={`chap${c.final ? ' chap--final' : i % 2 ? ' chap--right' : ''}`}
            data-chap={i}
            aria-label={c.kicker}
          >
            <div className="chap-kicker">{c.kicker}</div>
            <h2 className="chap-head">
              {c.lines.map((l, j) => (
                <span key={j} className="chap-line">
                  <span dangerouslySetInnerHTML={{ __html: l }} />
                </span>
              ))}
            </h2>
            {c.sub && <p className="chap-sub">{c.sub}</p>}
            <div className="chap-rule" />
            <div className="chap-facts">
              {c.facts.map((f, j) => (
                <div key={j} className="fact">
                  <div className="fact-value">{f.value}</div>
                  <div className="fact-label">{f.label}</div>
                </div>
              ))}
            </div>
          </section>
        ))}

        <div ref={seamRef} className="film-seam" style={{ zIndex: 8 }} />
      </div>
    </div>
  );
}
