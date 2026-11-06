# HUMN — scroll-film brief (do not lose)

**Concept:** STRATA × THE CORRECTION (user-approved 2026-10-03). One continuous upward
ascent — `BEDROCK → CONTEXT → TONE → NUANCE → TRUST → SURFACE` — and the visitor watches
ONE machine answer visibly transform from raw model output into a trustworthy,
context-aware, human-grade answer. Transformation, not architectural sightseeing.
TRUST = accountable judgment (a claim is corrected on screen), never safety theater.
SURFACE resolves calm, warm, premium.

**Brand:** HUMN — MAKE AI HUMAN. Fictional but credible AI interaction layer between
foundation models and end users. Audience: AI product teams, tech companies, studios.
Must read as a real venture-backed AI infrastructure company. NOT a generic AI launch site.
Merlin.studio is a quality bar only — clone nothing from it.

**Lane B planned (2026-10-03, user-directed):** footage film "CONFLUENCE" — see
`lane-b/PLAN.md` + `lane-b/storyboard.desktop.json`. Not generated/integrated yet; Lane A
below stays live and becomes the poster/fallback world.

**Lane:** A — pure-code motion. GSAP + ScrollTrigger + Lenis + Three.js (all in this
package). No video footage, no frames/, no FRAME_COUNT. Escalation pass 2026-10-03:
the world is now WebGL — `src/film/gl/world.ts` (GLSL strata environment + perspective
particle field, cursor light, adaptive quality tiers) behind the same `{paint,resize}`
contract as the 2D painter, which remains as the no-WebGL fallback (`render.ts`).
Ghost chapter numerals, blur-reveal beats, hero char drift, difference-blend cursor.
Evolution arc 2026-10-03 (user-directed): BEDROCK = DNA double helix (machine ice
strand + human amber strand, base-pair rungs) → CONTEXT = helix unwinds, rungs
release → TONE = strands converge and are absorbed into the single thread.
NUANCE has NO fan/refraction burst — the living point gathers light, brighter
and brighter (gather ramp p 0.46→0.88) into the SURFACE bloom. TRUST = one soft
breath of light at the head (p≈0.745), no rings/shockwave/lattice.
"No seams" pass 2026-10-03: NOTHING may draw a straight full-width/rect edge across
the film. Answer card is an edgeless radial shade (fades as world warms), hairlines
are fading gradients, TONE striae + companion filament removed, rungs are a fine
dense ladder (27/π pitch), particles capped ~5px (star dust, no bokeh), faint
nebula fbm. Second transition: integrated-phase helix (freq 4.6→2.2), strands draw
INWARD into the thread (amp 0.14→0). Seam ramp uses max(film p, scroll p) so a
fast flick never exits the dark stage with a hard edge. Card states hand off
staggered (no text ghosting); paper arrives fast + scale-settle. Hero wordmark: Inter Tight 300,
scaleY(1.18), gap-spaced — narrow premium title.
Luxury refinement pass 2026-10-03 (user brief): calmer opening — sparser/slower
BEDROCK lattice (no grid overlay), dimmer CONTEXT motes, softer striae, slower
thread sway + gentler filament shimmer, calmer particles. Wide bandW crossfade
feathers (i-0.14 → i+1.14) make chapter boundaries imperceptible. Softer beat
backdrop/shadows, subtler ghost numerals + grain (0.05), Lenis lerp 0.065.
LogoMark redesigned: fine-line hairline construction, sharp butt caps.

**Art direction (committed):**
- Ink `#05070B`, deep `#0A0F16`, machine ice `#8FB8DC` / signal `#BFE0F5`,
  ember `#E09A5F`, amber `#F0BE82`, surface cream `#F5EEE3`, paper `#FBF6EC`, soil `#17130C`.
- Type: Fraunces (display, italic accents) / Inter Tight (body) / IBM Plex Mono (technical).
- Logo: inline SVG — vertical thread rising through five strata ticks, dot at apex.
- Motion feel: heavy, deliberate. Lenis lerp 0.08. One sticky stage, canvas-painted world,
  scrub-driven. World moves DOWN on screen as you scroll (camera only ever rises).

**Film structure:** sticky 100vh stage inside a 760vh driver. One rAF tick reads
ScrollTrigger progress → lerped p (0.14) → paints canvas + drives DOM envelopes
(beats `data-in/peak/out`, answer-card state windows). Chapter readout + elevation
meter (−2,400 M → 0 M) in the header. Header flips `.on-light` at p > 0.88.

**Dev contract (must keep working):** `?jump=<scrollY>` lands pre-scrolled and
force-settled; `window.__ready = true` only after fonts + first paint. Jank meter logs
rAF max every 2s. `prefers-reduced-motion`: no Lenis smoothing, no auto anims, static world.

**Verification before ship:**
1. `node .agents/skills/scroll-film-studio/scripts/copy-gate.js <dump.html>` — must exit 0
   (dump rendered copy, not source).
2. Screenshots at p = 0 / each chapter / surface / first content section, desktop 1440×900
   AND mobile 390×844 (use `?jump=` fractions × driver height).
3. Grade the transformation: 0% and 100% must read as the same journey's start and end —
   the same answer, transformed.

**Do-nots:** no narrating the scroll mechanic in copy (copy-gate enforced); no fake/
hand-drawn third-party logos; no dissolving into unrelated sections; no placeholder text;
grain + vignette fade with the seam ramp; header chrome stays legible at both extremes.

## Footage side plate (2026-10-04)
`public/film/plate-opening.{webm,mp4,jpg}` is the user's Artlist/Seedance take (480p), with the black point crushed, a light blur, and a crossfaded 3.8s seamless loop. Film.tsx screen-blends it over the WebGL world. A CSS mask keeps the centre strand clear and fades the outer edges, and the video is dimmed to 0.6. It's visible from p 0 to 0.4, gone by 0.56, and paused while hidden. To re-tune: video opacity and mask stops in film.css, the scroll envelope in renderFrame.
