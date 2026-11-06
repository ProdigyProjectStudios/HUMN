import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const MANIFESTO =
  'Every tool we ever built sat outside the mind. HUMN Thread is the first to work with it — a band behind the ear that reads intent, remembers what you would lose, and answers at the speed of thought. It doesn’t think for you. It helps you think further.';

const CAPS = [
  {
    name: 'Sense',
    desc: '64 dry neural sensors and optical blood-flow tracking read intent through the skin. No gel, no implant, no calibration ritual.',
  },
  {
    name: 'Understand',
    desc: 'A personal model runs on the band itself and learns how you think — your shorthand, your people, your unfinished ideas.',
  },
  {
    name: 'Answer',
    desc: 'Replies arrive as a bone-conducted whisper only you can hear, or as text on any screen you choose.',
  },
  {
    name: 'Remember',
    desc: 'Conversations, pages and decisions become context you can recall, surfaced the moment they matter.',
  },
  {
    name: 'Protect',
    desc: 'Neural data is encrypted on the band and never leaves without your say. No ads, no resale, no exceptions.',
  },
];

const STATS = [
  { to: 64, prefix: '', suffix: '', decimals: 0, label: 'Dry neural sensors' },
  { to: 180, prefix: '', suffix: ' ms', decimals: 0, label: 'Intent to answer' },
  { to: 14, prefix: '', suffix: ' g', decimals: 0, label: 'Worn behind the ear' },
  { to: 18, prefix: '', suffix: ' h', decimals: 0, label: 'Battery, all-day wear' },
];

export default function AfterFilm() {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    /* arrival motion — after the film's triggers exist (creation order law) */
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        }),
      { rootMargin: '0px 0px -12% 0px', threshold: 0.12 },
    );
    document.querySelectorAll('.section:not(.manifesto)').forEach((s) => io.observe(s));

    /* looping light (aurora drift, halo, sweeps) pauses while off screen,
       so nothing animates that nobody can see */
    const idle = new IntersectionObserver(
      (es) => es.forEach((e) => e.target.classList.toggle('anim-off', !e.isIntersecting)),
      { rootMargin: '25% 0px 25% 0px' },
    );
    document
      .querySelectorAll('.after, .after .section, .site-footer')
      .forEach((el) => idle.observe(el));

    /* counters — once, snapped */
    const triggers: ScrollTrigger[] = [];
    const tweens: gsap.core.Tween[] = [];
    document.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
      const to = Number(el.dataset.count);
      const decimals = Number(el.dataset.decimals || 0);
      const prefix = el.dataset.prefix || '';
      const suffix = el.dataset.suffix || '';
      if (reduced) return;
      const obj = { v: 0 };
      const tween = gsap.to(obj, {
        v: to,
        duration: 1.8,
        ease: 'power3.out',
        paused: true,
        onUpdate: () => {
          el.textContent = `${prefix}${obj.v.toFixed(decimals)}${suffix}`;
        },
      });
      tweens.push(tween);
      const trig = ScrollTrigger.create({
        trigger: el,
        start: 'top 88%',
        once: true,
        onEnter: () => tween.play(),
      });
      triggers.push(trig);
    });

    /* manifesto: revealed the moment the film above has settled to dark */
    const manifesto = document.querySelector('.manifesto');
    const eyebrow = document.querySelector('.manifesto .eyebrow');
    if (manifesto && eyebrow) {
      triggers.push(
        ScrollTrigger.create({
          trigger: eyebrow,
          start: 'top 42%',
          onEnter: () => manifesto.classList.add('in'),
          onLeaveBack: () => manifesto.classList.remove('in'),
        }),
      );
    }

    return () => {
      io.disconnect();
      idle.disconnect();
      triggers.forEach((t) => t.kill());
      tweens.forEach((t) => t.kill());
    };
  }, []);

  return (
    <div className="after">
      <div className="after-aurora" aria-hidden="true">
        <i className="au au--ice" />
        <i className="au au--amber" />
        <i className="au au--deep" />
        <i className="au au--ember" />
      </div>

      <section className="section manifesto" id="manifesto" tabIndex={-1}>
        <div className="wrap">
          <p className="eyebrow">Manifesto</p>
          <p className="lede">
            {MANIFESTO.split(' ').map((w, i) => (
              <span key={i} className="lede-word">
                {w}{' '}
              </span>
            ))}
          </p>
        </div>
      </section>

      <section className="section caps" id="thread">
        <div className="wrap">
          <p className="eyebrow">Inside HUMN Thread</p>
          <h2>
            Five capabilities.
            <br />
            <em>One extended mind.</em>
          </h2>
          <div>
            {CAPS.map((c, i) => (
              <div className="cap-row" key={c.name}>
                <span className="cap-idx">0{i + 1}</span>
                <h3 className="cap-name">{c.name}</h3>
                <p className="cap-desc">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section specs" id="specs">
        <div className="wrap">
          <p className="eyebrow">Engineered for the mind</p>
          <h2>
            Nothing to implant.
            <br />
            <em>Everything to gain.</em>
          </h2>
          <div className="proof-grid">
            {STATS.map((s) => (
              <div className="proof-cell" key={s.label}>
                <div
                  className="num"
                  data-count={s.to}
                  data-decimals={s.decimals}
                  data-prefix={s.prefix}
                  data-suffix={s.suffix}
                >
                  {s.prefix}
                  {s.to.toFixed(s.decimals)}
                  {s.suffix}
                </div>
                <div className="lbl">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section access" id="access" tabIndex={-1}>
        <div className="access-halo" aria-hidden="true" />
        <div className="wrap">
          <p className="eyebrow" style={{ justifyContent: 'center' }}>
            Founding cohort &middot; 2027
          </p>
          <h2>
            Evolve your <em>intelligence.</em>
          </h2>
          <p className="sub">
            The first HUMN Thread units ship in 2027 to a founding group of
            5,000. Reserve a place and help shape what human intelligence
            becomes next.
          </p>
          <a className="cta-main" href="mailto:access@humn.ai">
            Reserve your Thread
            <span aria-hidden="true">&rarr;</span>
          </a>
          <p className="fine">No payment to reserve &middot; Response within 48 hours</p>
        </div>
      </section>
    </div>
  );
}
