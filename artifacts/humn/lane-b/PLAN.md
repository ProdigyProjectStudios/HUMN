# HUMN — Lane B production plan: "CONFLUENCE"

Status: PLAN ONLY. Nothing generated, nothing integrated. Storyboard prompts live in
`storyboard.desktop.json` (vector-check: PASS).

## 0. The film in one sentence

One unbroken 25-second ascent along a vertical DNA-like intelligence strand. Organic
intelligence flows on the left and machine intelligence on the right; as the camera
rises they move to the centre, exchange colour, braid around the strand, and fuse into one
enriched form whose light becomes the cream surface of the page.

**Vector (the one rule):** the camera only ever rises. It never cuts, pans, orbits or
pulls back. That keeps the current site's grammar: scroll down, the world moves down,
the camera climbs.

| Spec | Value |
|---|---|
| Shape | 5 clips × 5 s = 25 s, 6 keyframes, both ends of every clip pinned |
| Frames | ~600 @ 24 fps (native rate, nothing dropped) |
| Desktop | 16:9, mastered at 720p, shipped as 1024 px JPEG (q6), ~30–40 MB |
| Mobile | separate 9:16 pass, same journey and frame count, 576×1024 JPEG |
| Engine | Seedance 2.0 (Higgsfield `seedance_2_0` or Kie `bytedance/seedance-2`), audio OFF |
| Keyframes | chained stills (each generated with the previous one as reference) |

## 1. Storyboard: 5 film chapters over HUMN's 6 story chapters

The DOM story (beats, answer card, chapter readout, elevation meter) stays exactly as it
is. The film supplies the world behind it.

| # | Film chapter | Story chapters | Scroll p | Keyframes | Answer card state |
|---|---|---|---|---|---|
| I | **Two Origins** | BEDROCK | 0.00 → 0.19 | kf0 → kf1 | raw machine answer |
| II | **Reach** | CONTEXT → TONE | 0.19 → 0.43 | kf1 → kf2 | context binds |
| III | **Braid** | NUANCE → TRUST | 0.43 → 0.68 | kf2 → kf3 | honest answer wins |
| IV | **Fusion** | TRUST → SURFACE | 0.68 → 0.85 | kf3 → kf4 | correction lands |
| V | **Light** | SURFACE | 0.85 → 0.97 | kf4 → kf5 | warm paper answer |

### I — Two Origins (BEDROCK)
Deep space, mostly black. At the exact centre is a slender double helix running the
full height of the frame: one ice strand and one amber strand, turning slowly, joined by
a dense ladder of hair-thin rungs (no isolated rungs that could read as ruled lines). Far
left: an organic stream of luminous amber and ember fluid, like ink in still water or a
bioluminescent current. Far right: a machine stream of thousands of ice-blue points in
precise parallel filaments. Wide, calm dark gaps. The hero wordmark sits over this frame.

### II — Reach (CONTEXT → TONE)
The streams gain memory. The organic side grows dendritic tributaries, like a river delta
seen from orbit. The machine side organises into braided filaments with small glowing
nodes. Hair-fine tendrils reach from both sides and touch the helix, which is the visual
for persistent context. Both streams drift towards the centre, the gaps halve, and the
colours start to cross: ice threads appear in the amber stream and amber motes in the blue.

### III — Braid (NUANCE → TRUST)
The helix relaxes until its strands run almost parallel. The two streams reach it and
wrap around it in one slow braid, forming a single column about 20% of the frame wide. A
soft node of warm white light gathers on the core thread and brightens steadily. The
outer thirds go darker and quieter. This replaces Lane A's "orb gathers light".

### IV — Fusion (TRUST → SURFACE)
The braid tightens and the two materials dissolve through each other. The result is one
seamless, iridescent column: a white-gold core with ice and amber veins flowing inside
it, an enriched material rather than two colours side by side. The node swells into a
broad soft radiance, and the nebula at the frame edges warms to dusk amber. TRUST's
correction moment in the DOM lines up with the start of the fusion.

### V — Light (SURFACE)
The camera slows and comes to rest. The column's radiance swells evenly, with no flash,
burst or rays, until cream light (#F5EEE3) fills most of the frame and the column's
silhouette dissolves into it. Code then completes the existing seam to the cream content
section, so there is no visible edge.

## 2. How the left and right streams evolve

| Chapter | Organic stream (left) | Machine stream (right) | Width position (L / R) | Central strand |
|---|---|---|---|---|
| I | smoky amber/ember laminar fluid | ice-blue point filaments, ordered | 8–28% / 72–92% | tight double helix, twisting |
| II | grows dendritic tributaries (memory), sends tendrils | braids with glowing nodes (memory), sends tendrils | 14–32% / 68–86% → 26–42% / 58–74% | twist loosens |
| II→III | takes in ice filaments | takes in amber motes | 26–42% / 58–74% | strands almost parallel |
| III | wraps around the strand | wraps around the strand | one column, ~20% wide | bright core thread + light node |
| IV | dissolves through the machine stream | dissolves through the organic stream | one column, ~10% wide | the unified form |
| V | — | — | column dissolves into light | bloom → cream |

Texture rule: each stream keeps its own texture (fluid on the left, discrete points on
the right) until Chapter IV. Colour crosses over before texture does, so the visitor
reads the exchange before the merge.

## 3. When and how they merge

- **First contact, p ≈ 0.12–0.19 (late I):** tendrils touch the helix. The streams are linked but still separate.
- **Exchange, p ≈ 0.30–0.43 (II):** the colours cross over. This is the TONE beat: each side adopts the other's register.
- **Embrace, p ≈ 0.50–0.68 (III):** the streams wrap the strand. Three elements become one braided structure, with the parts still visible.
- **Fusion, p ≈ 0.68–0.85 (IV):** the parts stop being distinguishable and become one material. This is the brand promise.
- **Resolution, p ≈ 0.85–1.00 (V):** the unified form's light becomes the page surface.

The merge is gradual and continuous across about 70% of the film. There is never a
"collision" moment, so there are no shockwaves, flashes or particle bursts.

## 4. Transitions between chapters (the junctions)

Every junction is the **literal last frame** of the previous clip, extracted with
ffmpeg and used as the next clip's start image. The far end is pinned to the next
keyframe. There are no crossfades over seams (the scrub lets a visitor stop on a seam).

| Junction | Frame state at the seam | What must be identical either side |
|---|---|---|
| I → II (kf1) | tendrils just touching the helix, streams at 14–32 / 68–86% | helix x-position, stream widths, black level |
| II → III (kf2) | colours crossed, helix nearly parallel | stream positions, haze level |
| III → IV (kf3) | braid formed, light node lit below centre | node position and size, column width |
| IV → V (kf4) | unified column, broad radiance | radiance centre, nebula warmth |
| V → page (code) | cream bloom | the final-frame colour is sampled and becomes the seam colour |

Each clip prompt opens with *"Continue the exact same shot from the reference frame,
identical framing, identical colour grade"* and states only the upward rise plus the
change for that chapter. Gates per junction: SSIM ≥ 0.88 passes; 0.80–0.88 must be
watched in motion; regenerate anything structural (grade drift, a new horizon, the
strand moving off centre).

The scroll position of each chapter is set by a **keyframe→scroll map**, not by
splitting the 25 s evenly. The anchors are kf0 0.00, kf1 0.19, kf2 0.43, kf3 0.68,
kf4 0.85 and kf5 0.97. A monotone cubic curve through them keeps the scrub speed
smooth, and the chapter readout, beats and card states stay where they are now.

## 5. Integration plan for Replit (hybrid: footage world + existing DOM film)

The film replaces only the **world painter**. Everything the user has approved stays:
the one rAF tick, lerped p, beats, answer card, header readouts, grain, vignette, seam,
`?jump` and `__ready`.

1. **Assets:** frames go in `artifacts/humn/public/film/desktop/f_0001.jpg…` and
   `…/mobile/…`. They are served statically by the existing react-vite deployment, so no
   new service, object storage or database is needed. Source clips, keyframes and the
   master stay in `lane-b/work/`, which is git-ignored and never shipped.
2. **`FrameScrub` module** (new, same `{paint(p), resize()}` contract as `world.ts`):
   - It holds an ImageBitmap sliding window sized in seconds (about 2 s ahead and 1.3 s
     behind, roughly 80 bitmaps), never a full preload.
   - A concurrency-capped loader (10–12 requests in flight) decodes with
     `createImageBitmap`, and `nearestFrame()` fills gaps so the canvas never blanks.
   - It draws with cover-fit and the strand locked to the horizontal centre. The DPR is
     capped.
3. **Boot sequence:** the WebGL world paints instantly (poster). The first ~2 s of frames
   are prefetched. When frame 1 is decoded, a short opacity hand-off (one time only, at
   p≈0 and never at a seam) switches to footage. The rest streams in afterwards.
4. **Fallbacks (keep Lane A, don't delete it):**
   - Mobile ≤ 768 px uses the 9:16 frame set, swapped on `matchMedia`. Old bitmaps are
     closed on the swap.
   - `prefers-reduced-motion`: one still per chapter, crossfaded and not scrubbed.
   - `navigator.connection.saveData` or a slow first batch keeps the WebGL world.
   - With no WebGL either, the 2D painter is the last fallback.
5. **Overlay tuning:**
   - The answer card stays centred over the strand. The card's radial shade is retuned
     against real footage brightness.
   - Beats (bottom-left) get a soft radial scrim, because the organic stream passes
     through that area in Chapters I–II.
   - Header contrast is driven by the luminance of the frame's top band instead of a
     fixed p threshold.
6. **Seam:** `assemble.sh` samples the final frame colour. The seam overlay and the
   cream section use it, so the film ends with no edge on the existing max(p, target)
   ramp.
7. **Verification:**
   - `continuity-gate.sh frames 8` PASS, plus every junction SSIM.
   - Head trim (the film must open already moving), then set `FRAME_COUNT`.
   - SwiftShader captures at every chapter on desktop 1440×900 and mobile 390×844.
   - Jank test (judge p95 and max, never the average).
   - copy-gate is unchanged.

Estimated build effort after the footage is approved: about one focused session for the
scrub engine and wiring, plus one tuning pass.

## 6. Budget plan (target $10–20 total video spend)

Prices are public list rates for Seedance 2.0 as of Oct 2026, from Kie's site and an
independent price reference. They are approximate, and **a live quote from the
provider is taken before every spend**.

Approximate Seedance 2.0 rates (audio off):

| Resolution | Rate | Per 5 s clip |
|---|---|---|
| 480p | ≈ $0.06–0.09/s | ≈ $0.30–0.46 |
| 720p | ≈ $0.12–0.20/s | ≈ $0.60–1.00 |
| 1080p | ≈ $0.30–0.50/s | ≈ $1.50–2.50 |

| Step | What | Est. cost |
|---|---|---|
| 0 | Engine preflight: one 480p clip plus one junction test (does it honour the start pin?) | $0.30–0.50 |
| 1 | 6 desktop keyframes plus about 6 rerolls (still images) | $0.50–1.00 |
| 2 | **Draft chain** of 5 clips at 480p, to validate motion, merge pacing and seams | $1.50–2.30 |
| 3 | Draft regenerations (budget for 3) | $0.90–1.40 |
| 4 | **Desktop master** of 5 clips at 720p | $3.00–5.00 |
| 5 | Mobile 9:16: 6 keyframes (derived from desktop) plus 5 clips at 720p | $3.50–5.50 |
| 6 | Master regeneration reserve (2 clips at 720p) | $1.20–2.00 |
| | **Total** | **≈ $11–18** |

Why 720p and not 1080p: the site ships 1024 px frames to stay smooth at 24 fps, so
1080p pixels would be thrown away. Soft glows on black upscale cleanly. A 1080p desktop
master adds about $5–7 and is optional.

Spend controls:
- Audio is always off (audio on roughly triples the bill).
- Nothing at 720p is generated until the 480p draft passes every gate and you have seen it.
- Generation is resumable, so a crash never pays twice. Clips run strictly in order.

**Cheaper option (≈ $7–11):** skip the mobile video pass and keep the current WebGL
world on phones. Phones would get a different, lighter film.

## 7. Engine choice

**DECIDED (2026-10-03): Higgsfield Seedance 2.0, plus a full 9:16 mobile film.** Keyframes
are also made on Higgsfield (Nano Banana 2, each still referencing the previous one), so
one account covers everything. Sign-in uses Higgsfield's browser login (OAuth). Its
tokens are short-lived, so each generation session starts with a fresh login. Mobile
clips need `--aspect_ratio 9:16`, which `chain-step.sh` doesn't pass yet. Add it before
the mobile pass.

- **Higgsfield Seedance 2.0 is the preferred engine.** It natively pins the start and
  end images and our chain script supports it. It needs your Higgsfield account and CLI
  login.
- **Kie.ai Seedance 2.0 is the fallback.** It is the cheapest per second. It needs a Kie
  API key stored in Replit Secrets. The included chain script currently calls Veo, so it
  needs a small adaptation to the Seedance 2 endpoint, which is planned.
- Replit's built-in video generation accepts only a first frame, not an end frame. It
  can't pin both ends, so it isn't suitable for a chained film.

## 8. Risks and mitigations

| Risk | Mitigation |
|---|---|
| The strand drifts off centre between clips | Every prompt states "perfectly vertical at exact horizontal centre". The junction gate checks the x-position. Any drift is regenerated. |
| Chapter V's lighting change teleports | It is the only clip with a lighting change, so it is drafted first among the risky clips. Fallback: end the footage at kf4 and let the existing code bloom do the white-out. |
| Clichéd sci-fi look (sparks, HUD, circuitry) | The style line forbids it explicitly, and keyframes are reviewed by you before any clip is generated. |
| Horizontal "page break" artefacts | "No horizontal lines or bands, no hard edges" is in every prompt. Captures are checked chapter by chapter. |
| Payload | ~600 frames at 1024 px is about 30–40 MB, loaded in a streamed window and never preloaded. The first paint is the WebGL world. |
