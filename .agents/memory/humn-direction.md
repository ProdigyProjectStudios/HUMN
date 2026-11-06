---
name: HUMN creative direction
description: User-defined brand, originality constraints, and concept process.
---

The project is HUMN — MAKE AI HUMAN. Use Lane A (pure-code motion) for now. Publish target: Replit Preview for now.

HUMN is a fictional premium AI interaction layer that sits between foundation models and end users (persistent context, adaptive tone, nuanced communication, multimodal interaction, trust/oversight). Audience: AI product teams, ambitious technology companies, digital studios. It must read as a credible venture-backed AI infrastructure company, not a concept invented to justify a website. Full creative freedom on the brand world; no existing assets.

**Why:** Product definition stated by the user in the skill's STEP 0 interview (2026-10-03).

The imported Merlin.studio site is a quality benchmark only: study production value, typography ambition, pacing, motion sophistication, and interaction quality. Do not clone its layout, branding, copy, assets, or distinctive interactions. HUMN must be completely original and aim to feel at least as premium.

**Why:** The user explicitly set these creative constraints.

**How to apply:** Follow the scroll-film-studio interview before pitching 2–3 radically different creative concepts. Do not begin building before this discovery and concept phase.

Concept chosen by the user (2026-10-03): STRATA (upward ascent BEDROCK → CONTEXT → TONE → NUANCE → TRUST → SURFACE) fused with THE CORRECTION — the interaction must visibly transform from raw machine output into a trustworthy, context-aware human answer. User's standing direction: transformation, not architectural sightseeing; the thread/answer evolves at every layer; TRUST is accountable judgment, not safety theater; SURFACE resolves calm and premium; never a generic AI launch site. Site lives in artifacts/humn (scroll-film build details in its BRIEF.md).
## No straight seams (user's "invisible page break" complaint)
Rule: nothing in the film may draw a straight horizontal/rectangular edge — no glass card boxes, full-width bands, large ring arcs, sparse horizontal rungs, or dark stage exiting against cream.
**Why:** the user repeatedly saw these as jarring "invisible page breaks"; root causes were the card's glass rectangle, isolated helix rungs, TONE striae, the TRUST shockwave, and the film lagging scroll at exit.
Root cause found Oct 2026 for the "moving" breaks: square-grid value noise in the strand shader's fbm (nebula, SURFACE sheen, rock grain) showed its cell borders as drifting straight creases. Use simplex noise with rotated octaves plus sub-8-bit dither. Never use grid-based value noise, and never use blurred CSS blobs or linear-falloff radial gradients in dark areas.
**How to apply:** use edgeless radial scrims and fading hairlines; tie end-of-film seams to max(smoothed p, raw scroll p); capture with `?jump=` (plain scrollTo lags under SwiftShader and gives false readings).

## Lane B (footage) adopted 2026-10-03
User moved HUMN to Lane B: one continuous master film, vertical DNA strand at centre, organic (left) + machine (right) streams converging into one unified form; keep deep-space substrate and the 6-chapter story. Budget ~$10–20 total video spend.
**Why:** user decision; plan approval required before any generation.
**How to apply:** plan lives in artifacts/humn/lane-b/; keep Lane A world as poster/fallback; storyboard prompts must avoid in-words ("into", "toward", "inward") — vector is "camera only rises" and vector-check flags them.

## Revised 2026-10-03 (evening): side plates, not a full film
The user now generates video themselves in Artlist (Seedance) and dropped the Higgsfield sign-in. The existing code centre DNA strand stays as the hero and must NOT be replaced. The video is background plates only: amber/organic on the left, ice/machine on the right, converging, with the centre band kept dark. Three plates: opening, convergence, unified. No text/UI/logos in the plates.
**Why:** user's explicit clarification ("do not generate a brand-new center composition").
**How to apply:** the plates go behind or under the WebGL strand; the centre must stay empty so the strand isn't doubled; the grade must warm up over scroll to match the brown-dusk TRUST/SURFACE chapters. The confluence storyboard in lane-b/ is superseded for generation.
Seedance lesson (first Artlist take, 2026-10-04): if a plate prompt says "converge" or "merge", Seedance renders it literally as a horizontal collision with a flash and its own centre beam, which doubles the strand. Keep convergence out of each plate's prompt and let it come from the plate sequence. Also ban purple, flares and grid squares explicitly. Artlist delivers HEVC 10-bit, so it must be re-encoded before browsers can use it.

## Master-shot story (settled 2026-10-04 after three rejected tests)
The main cinematic shot is: ONE amber human head facing camera, eyes closed, alone in near-black space; a NON-humanoid AI (rigid ice-white geometric network, no face/body) enters from above/behind, studies the head, and threads in through crown and temples. The central event is the transformation AT the boundary: machine geometry becomes organic living structure as it enters the human ("the AI is becoming human as it augments human intelligence" — augmentation, never replacement). Climax: one synchronized pulse, eyes slowly open, calm direct gaze, held. Rejected: two facing profile heads (reads as "about to kiss", both read as generic heads — identities not legible), macro neurons/tissue (no story, no protagonist), stock glass brain. Prompting principle learned: abstract forms can't carry the story — "human" needs anatomically anchored features (eyelids, nose, lips, cheekbones) and "AI" needs to be legible through extreme order and deliberate behaviour, not another head.
**Why:** user's explicit direction and rejections; they wrote the final test-04 prompt verbatim.
**How to apply:** keep this exact story spine for the master shot; verify each test against "is it instantly obvious this is human + AI + augmentation, sound off, first second".

## Revised 2026-10-04: footage becomes the main storytelling visual
The user re-added Higgsfield (HF_KEY secret, Higgsfield cloud API with `Authorization: Key $HF_KEY`). The goal now is a cinematic sequence that is the MAIN visual during the pinned scroll (DNA/biology meeting AI superintelligence, transforming into one new intelligence). It is not a side plate. The site must not be redesigned until the user says so.
**Why:** the user's explicit instruction.
**How to apply:** show the exact prompt, cost and settings, and wait for approval before every paid generation. One generation per approval, with no automatic retries or alternatives. Seedance 2.5 text-to-video costs about $0.2056/s at 480p and the estimate endpoint returns only a pricing description; audio doesn't change the price on 2.5.

## Page structure (settled 2026-10-04, after user feedback)
Two pinned films in a row: (1) the awakening video (user's own upscale of test 04), only the HUMN hero title over it, nothing on the face, fades to ink at the end; (2) the code strand film (DNA strand to gold line to light explosion); its visuals stay, but its copy system was redesigned on 2026-10-05 (see below).
**Why:** user hated text and cards over the face and wanted the DNA animation kept exactly as before, at the "models got brilliant" part of the page.
**How to apply:** never scrub a <video> via currentTime (it stutters badly); the awakening film uses a WebP image sequence on canvas with adjacent-frame blending. Never regenerate footage. Keep overlays off the face.
Feel (2026-10-05): the user wants the awakening film SNAPPY and quick — short scroll distance, minimal smoothing lag, a slowdown just before the nose flash but still fast. Its end dissolves directly into the strand film (overlapped pinned stages), never via black.
**Why:** user's explicit direction. **How to apply:** keep scroll distances short; in-between frames come from motion interpolation of the user's own footage (no regeneration).

## Product + strand-film story (2026-10-05, supersedes the "interaction layer" positioning)
Theme: evolving human intelligence with AI. The product is HUMN Thread, a non-invasive neural interface (a 14g band behind the ear, no implant or surgery) whose personal AI extends memory, speed and judgment without replacing them. The user asked what the product was, I proposed this, and they had chosen the "both" story. The strand film has 6 chapters: two lineage chapters (Origin, Leaps), three faculties (Memory, Intuition, Judgment), then the reveal (Evolve).
The user rejected: big ghost chapter numerals; small centred text cards; the launch/failover answer card; copy appearing too quickly; the dev-tool "interaction layer" story.
**Why:** the user said it didn't follow the video or "make AI human". **How to apply:** use large headlines with a row of three concrete facts and slow, staggered scroll fades. The opening frame shows the strand alone. Nothing should read like paragraphs.

## Ending + lower page (Oct 2026)
- Chapters alternate sides (Origin L, Leaps R, Memory L, Intuition R, Judgment L); "Evolve." centred.
- Ending order the user asked for: "Evolve." on a DARK scene with soft light ripples from the ball → bright flood from the ball → light draws back into the point → ink. **Why:** user said the brightness came too early and was too bright. Ripples were explicitly requested (overrides the earlier "no rings" rule) but must stay soft gaussian, no hard edges.
- A flat CSS crossfade from cream to ink reads as grey — settle in the shader instead.
- Everything below the film is one continuous dark "futuristic" field (ink + drifting ice/amber aurora); no cream sections. Footer wordmark has a light sweep (user asked for light animation on the brand).
- Organising message: "Evolving Human Intelligence".
- No faded text anywhere (user, 2026-10-05): every word solid colour — no gradient-clipped text, no dimmed/see-through words or labels, no word-by-word lighting. Accents are solid gold (--amber).
- Custom cursor (Oct 2026): the user rejected both a trailing dot/ring (dot left the ring) and a locked dot+ring ("stiff, doesn't match the site"). Current concept is "point of light": cream core exactly at the pointer, gold glow, a short fading light thread from recent positions, a soft ring over links, a soft ripple on click. Keep the core un-eased; get the fluid feel from secondary motion only.
- Lower-page text is white and gold only, never blue or navy (the user said blue blends into the background). "Manifesto" must already be on screen the moment the film turns dark: the lower page overlaps the film's ink tail.

## Awakening video sharpness (Oct 2026)
- Source the user gave is 1280x718 at a low bitrate (itself upscaled from 480p). Desktop gets a 1920px frame set (denoise → lanczos → unsharp+cas, webp q80, ~31MB); phones keep the 1280 set. Cleaning it up only sharpens edges, it can't add detail; a proper AI upscale from the user is the real fix.
- When the user delivers an upscaled file: rebuild both frame sets with the same pipeline (minterpolate to 48fps, 479 frames) and keep the frame count.

## Awakening smoothness (Oct 2026)
Rule: never hold all awakening frames decoded. Keep compressed blobs, decode a small ImageBitmap window around the playhead (plus half-size key frames), cap canvas pixels to source resolution, and skip strand WebGL rendering while the awakening covers the screen.
**Why:** 479 decoded 1080p frames ≈ 4GB; browsers evicted and re-decoded them mid-scroll, and the hidden WebGL world rendered underneath. The user reported "super choppy" in every browser.
**How to apply:** keep this design when changing frame sets or counts; SwiftShader numbers are only useful for before/after comparison.

## Mobile framing (Oct 2026)
- Mobile opening starts at the screenshot-selected moment with neural branches in place and eyes closed, skipping the earlier footage. Remaining footage should run 50% faster without a slowdown. Add a calm blue-white pulsing orb above the head and solid EVOLVE below; desktop stays unchanged.
  **Why:** user explicitly chose “Start the video at this moment and play 50% faster” and requested an orb that is “epic but calming,” less intense than the later gold orb.
  **How to apply:** keep these accents outside the face and preserve the uninterrupted video-to-strand handoff.
- Mobile opening accents: blue-white light should be brighter with a more noticeable pulse, and the final E in EVOLVE should face backwards.
  **Why:** the user explicitly requested both refinements.
  **How to apply:** preserve the reversed final letter when restyling the opening wordmark. The user clarified: “Only the pulse. I don't want the orb expanding and getting smaller.” Keep the orb core and halo fixed-size; animate only the outward pulse. Keep the emitted glow and pulse compact: the user asked for the light it emits to be less large.
- Awakening video is never stretched to cover the screen: phones show the frame at ~1.7 screen widths (top/bottom dissolve), desktop shows it centred at up to 1280 css px (all edges dissolve). **Why:** the user saw mobile look "proper 1080p" from this alone (no enhancement) and chose the same for desktop over full-screen. Full-screen and sharp needs a higher-res source.
- Phones: the strand's point of light runs down the screen centre (~32% from the top in Origin, ~65% by Judgment), so chapter copy is pinned to the bottom for early chapters and the top for later ones, with facts side by side. Keep that if the head path changes.
- Cursor thread must feel smooth and calming, not "electric": eased follower ribbon, never raw mouse samples. **Why:** the user found the raw-sample trail too fast/jittery (they like the cursor itself).
- Opening screen has a strand on each side of the head (desktop/landscape only), in the exact style of the central strand film (luminous thread + long slow ice/amber coil). They stay put and fade with the head. **Why:** the user found a tight, busy helix jarring and rejected them converging to centre.
- Base pairs (2026-10-05): the user asked for clear base pairs on the side strands AND more on the central helix so they read as DNA. Keep them dense and evenly spaced (ice half + amber half, hairline gap, bead at each strand), fading out as the strands draw into the thread. Then toned right down: the bold version was "too rigid/heavy, draws too much attention". Pairs must be VERY faint on the opening screen and subtle on the central helix, each pair gently breathing so it doesn't feel ruled; obvious it's DNA, never pulling focus. This overrides the old "no sparse rungs" caution, but never let them go sparse: isolated rungs read as seams.
- Mobile scroll: film follows the finger closely on touch (little easing), no per-frame blur/backdrop-blur/blended grain on touch. **Why:** the user said phone scrolling felt weird and unresponsive.
- Mouse response (2026-10-05): near a real mouse (never touch), base pairs glow softly and the helix leans slightly toward it, on the central strand film ONLY. The opening side strands must not react to the mouse (user's explicit call). The response only happens when the mouse is actually ON the helix (over a strand or between them), never from across the screen (the user complained it reacted when nowhere near). User picked this over a light handoff (the light is already on the forehead at the transition) and over sound (they said it could be weird).
- Evolve rings must be born one at a time from the golden point (scroll-started clock), never appear as several rings at once. **Why:** user asked for this explicitly.
- The site is for the user's outreach campaign.
- Page-load intro (title rise, tagline, cue, side-strand fade) must be quick and snappy with zero lag: it's CSS keyframes (compositor), not GSAP, because page-load work (frames, WebGL compile) stalled the GSAP version. Title fonts are preloaded so they never swap mid-intro.
- Link preview image is a capture of the real opening screen (head + HUMN + tagline, no header/cursor); og:image points at the custom domain. Re-capture it if the opening screen changes.
- User will fix the video source later; no more paid video generation for now.
- Smoothness rules (2026-10-05 perf pass): per-frame loops only write styles when scroll actually moved; looping CSS light pauses off screen (`anim-off`); WebGL starts under a pixel budget; no backdrop-filter over the drifting aurora. Keep these when adding motion. SwiftShader can't measure GPU smoothness, so compare main-thread cost before and after.
