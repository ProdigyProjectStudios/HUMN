import './mobileAwakeningAccents.css';

/* Mobile-only accents for the awakening stage: a calm blue-white orb above
   the head and a solid EVOLVE word below it. Hidden on desktop by CSS.
   Place inside .film-stage. Pause by adding .awakening-accent-off to any
   ancestor. */
export default function MobileAwakeningAccents() {
  return (
    <div className="mob-accents" aria-hidden="true">
      <div className="mob-orb">
        <span className="mob-orb-pulse" />
        <span className="mob-orb-halo" />
        <span className="mob-orb-core" />
      </div>
      <div className="mob-evolve">EVOLV<span className="mob-evolve-reversed">E</span></div>
    </div>
  );
}
