---
name: Verifying WebGL in this workspace
description: The built-in Screenshot tool's capture browser cannot create WebGL contexts; verify GL work with puppeteer-core + SwiftShader flags against the dev server directly.
---

The app-preview Screenshot tool's headless browser fails WebGL context creation ("BindToCurrentSequence failed", VENDOR = 0xffff). A WebGL app will silently fall back or appear broken in those screenshots even when fine.

**Why:** the capture Chromium has no GPU/SwiftShader path enabled.

**How to apply:** for any WebGL/Three.js work, verify with puppeteer-core (installed at `.agents/skills/scroll-film-studio/scripts/node_modules`) launching `/repl/tools/bin/chromium` with `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --no-sandbox`, against `http://localhost:<PORT>/`. WebGL2 works there; WebGL1 does not. A working recipe lives at `/tmp/gl-test.js` in sessions where it was created — recreate from this note if gone. Also: huge rAF-delta spikes in browser console logs (minutes-long) are backgrounded-tab artifacts of capture sessions, not real jank — judge steady-state readings only.

Puppeteer `page.screenshot({ clip })` defaults to captureBeyondViewport, which resizes the page and blanks the WebGL film (an all-black shot that looks like a broken shader). Use `captureBeyondViewport: false`, or skip clip.
