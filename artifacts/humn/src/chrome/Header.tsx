import { useEffect, useRef } from 'react';
import { LogoMark } from '../components/LogoMark';
import { CHAPTERS, FLOOD, chapterAt } from '../film/config';
import { subscribeProgress } from '../film/progressBus';

export default function Header() {
  const rootRef = useRef<HTMLElement>(null);
  const chapterRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let lastIdx = -1;
    let footerVisible = false;
    let lastP = 0;

    const apply = () => {
      const el = rootRef.current;
      if (!el) return;
      el.classList.toggle('on-light', lastP > FLOOD.from + 0.012 && lastP < 0.985 && !footerVisible);
    };

    const unsub = subscribeProgress((p) => {
      lastP = p;
      const { idx, local } = chapterAt(p);
      if (idx !== lastIdx && chapterRef.current) {
        lastIdx = idx;
        chapterRef.current.textContent = `0${idx + 1} \u2014 ${CHAPTERS[idx].label}`;
      }
      if (barRef.current) barRef.current.style.transform = `scaleX(${local})`;
      apply();
    });

    const footer = document.getElementById('footer');
    const io = footer
      ? new IntersectionObserver(
          (es) => {
            footerVisible = es[0].isIntersecting;
            apply();
          },
          { threshold: 0.08 },
        )
      : null;
    if (footer && io) io.observe(footer);

    return () => {
      unsub();
      io?.disconnect();
    };
  }, []);

  const goAccess = (e: React.MouseEvent) => {
    e.preventDefault();
    const lenis = (window as unknown as { __lenis?: { scrollTo: (t: string, o?: object) => void } })
      .__lenis;
    if (lenis) lenis.scrollTo('#access', { duration: 1.8 });
    else document.getElementById('access')?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
    document.getElementById('access')?.focus({ preventScroll: true });
  };

  return (
    <header ref={rootRef} className="site-header">
      <a className="brand" href="#top" aria-label="HUMN — home">
        <LogoMark tone="dark" />
        <span className="word">HUMN</span>
      </a>
      <div className="header-readout" aria-hidden="true">
        <span ref={chapterRef}>01 — ORIGIN</span>
        <span className="bar">
          <i ref={barRef as React.RefObject<HTMLElement>} />
        </span>
      </div>
      <div className="header-right">
        <a className="cta-pill" href="#access" onClick={goAccess}>
          REQUEST ACCESS
        </a>
      </div>
    </header>
  );
}
