# HUMN performance notes

The opening still uses the original 479-frame film, mobile start frame, desktop framing, side strands, and crossfade into the six-chapter DNA scene.

## What changed

- Replaced the eager frame loader with a bounded, demand-driven queue. Arrival decodes one frame. Scrolling prioritizes the current frame and its neighbours; a small set of 480px previews supplies fast-seek fallbacks. The full-resolution cache holds at most 16 standard or 12 HD frames, compressed blobs are capped at 64, and all fetch/decode work shares a concurrency limit of three (two with Save Data).
- Fixed an eviction loop: the original inclusive ahead/behind search requested `WINDOW + 1` frames while retaining only `WINDOW`. Once the playhead reached the middle of the sequence, the cache could continually evict and decode its own working set.
- Abort outstanding requests when the opening leaves the viewport or the tab is hidden. Close evicted bitmaps and late results after disposal. Missing frames cannot cause endless retries. Image-element decoding and small canvas previews support browsers without working ImageBitmap decoding/resizing.
- Load Three.js and the 2D fallback on demand near the film transition. Chapter markup and scroll geometry stay mounted, so loading a renderer does not shift the page.
- Serve the original typefaces locally, with their OFL licenses; preload the two opening fonts and the appropriate desktop/mobile poster. No Google Fonts connection is needed at runtime.
- Keep native touch scrolling, remove the leaked Lenis ticker on cleanup, avoid interpolation draws on touch, and stop decorative motion/sequence downloads in reduced-motion mode.
- Add a keyboard skip link, visible focus treatment, accessible CTA focus transfer, larger touch targets, browser zoom support, and transform-based chapter progress. Reduced-motion visitors see the final specification values immediately.

## Measured comparison

Production builds from the original commit `885521214eb9a690f6580e54be366222a856c3b0` and this change, measured locally:

| Item | Original | Optimized |
| --- | ---: | ---: |
| Initial JavaScript, minified | 895.85 KB | 357.04 KB |
| Initial JavaScript, gzip | 262.47 KB | 124.39 KB |
| Film frame download policy on arrival | All 479 frames (14.34 MB standard / 30.74 MB HD) | One frame plus the responsive poster |
| Observed idle opening film imagery, 1440 × 900 / DPR 1 | Eager sequence still downloading | 93,770 bytes across two resources |
| Additional bitmap decodes during a 3-second stationary interval after scrolling, Chromium | 608 | Queue settles; no recurring decode loop |
| Same baseline interval, Firefox | 171 | 0 in the corresponding optimized capture |

The deferred 3D chunk remains approximately 535 KB minified / 136 KB gzip and downloads when approaching the transition. It is not eliminated. Total film bytes during a complete visit depend on scroll speed and how much of the sequence the visitor views.

Timing and frame rate in a software-rendered cloud browser are not representative of a physical GPU. These measurements demonstrate reduced initial payload and eliminated redundant decoding; they do not claim a production Lighthouse score or guaranteed device FPS.

## Verification

Use Node 24 and the repository's pnpm workspace:

```sh
pnpm --filter @workspace/humn test
pnpm run typecheck
PORT=5174 BASE_PATH=/ pnpm --filter @workspace/humn build
PORT=5174 BASE_PATH=/ pnpm --filter @workspace/humn serve
```

The dependency-free decoder tests cover capacity at both sequence boundaries, idle quiescence, rapid/reverse seeks, suspension/resumption, failed requests, and disposal during an outstanding decode.

Production browser checks cover desktop (1440 × 900), touch/mobile (390 × 844 at DPR 2), reduced motion, ImageBitmap unavailable, and WebGL unavailable. Check the opening, a mid-film seek, the DNA chapters, Request Access, and keyboard Skip cinematic intro. Verify no horizontal overflow or page errors, no renderer download before scrolling, one initial decode (zero under reduced motion), and no continuing decode work after the queue settles. Chromium and Firefox passed these checks.

Retest on physical iOS Safari and Android Chrome before production rollout, particularly fast touch flings and the video-to-DNA transition. Keep the renderer deferred and the decoder window bounded when replacing the footage.
