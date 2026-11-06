/* HUMN mark — fine-line construction. Five strata hairlines taper with precise
   geometry; a single hairline thread rises through them to a small apex point.
   Sharp butt caps, no rounding — a luxury-tech mark, not an icon. */
export function LogoMark({ tone = 'dark', live = false }: { tone?: 'dark' | 'light'; live?: boolean }) {
  const strata = tone === 'dark' ? '#F0BE82' : '#17130C';
  const thread = tone === 'dark' ? '#E9F2F9' : '#17130C';
  const dot = tone === 'dark' ? '#F5EEE3' : '#17130C';
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={live ? 'logo-live' : undefined}>
      <g stroke={strata} strokeWidth="0.85">
        <line x1="3.2" y1="18.6" x2="20.8" y2="18.6" />
        <line x1="5.9" y1="14.7" x2="18.1" y2="14.7" />
        <line x1="8.6" y1="10.8" x2="15.4" y2="10.8" />
        <line x1="10.7" y1="6.9" x2="13.3" y2="6.9" />
      </g>
      <line x1="12" y1="20.8" x2="12" y2="4.5" stroke={thread} strokeWidth="0.85" />
      {/* live: a pulse of light climbs the thread to the apex */}
      {live && (
        <line className="logo-pulse" x1="12" y1="20.8" x2="12" y2="4.5" stroke="#fff" strokeWidth="1.3" />
      )}
      <circle className={live ? 'logo-apex' : undefined} cx="12" cy="3" r="1.05" fill={dot} />
    </svg>
  );
}
