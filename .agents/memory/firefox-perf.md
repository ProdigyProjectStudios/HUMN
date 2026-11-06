---
name: Firefox performance on the opening video
description: Why the opening was choppy only in Firefox, what fixed it, and how to measure Firefox here
---
Firefox paints canvas 2D and composites CSS effects much slower than Chrome/Safari (canvas often in software, at full retina dpr).
The causes were: a live CSS radial-gradient vignette over the scrubbed canvas (the biggest), the poster's CSS mask still being composited under the canvas, the grain's mix-blend overlay, and the side strands' wide gradient strokes redrawn every frame.
**Rule:** never put a CSS gradient, mask or blend layer over a canvas that changes every frame. Bake static overlays into a canvas drawn once per resize. Firefox gets a lighter path (`.gecko` class / `lite` strands: 1x dpr, no widest glow layers, 30fps; no cross-blend; no grain).
**Why:** the user reported "choppy as fuck on Firefox, smooth everywhere else".
**How to measure:** Firefox 140 is in the nix store (/nix/store/*-firefox-140.0.4/bin/firefox). puppeteer-core with browser:'firefox', protocol:'webDriverBiDi' works headless. Use .local/humn-checks/ffperf.js (rAF frame times while scrolling) and ffprof.js (canvas call cost per frame). Try CSS `display:none` injections to find which layer costs the most.
