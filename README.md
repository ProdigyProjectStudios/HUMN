# HUMN

HUMN is a cinematic scroll-film website built with React, Vite, GSAP, Lenis, and Three.js.

## Repository structure

- `artifacts/humn` — HUMN website and film assets
- `artifacts/api-server` — shared API service
- `lib` — shared workspace libraries
- `scripts` — workspace scripts

## Develop

Install with `pnpm install`, then start the website with:

```sh
pnpm --filter @workspace/humn run dev
```

Build with `pnpm --filter @workspace/humn run build`; typecheck with `pnpm --filter @workspace/humn run typecheck`.
