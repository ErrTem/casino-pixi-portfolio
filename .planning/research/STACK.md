# Stack Research — Crash Pixi Portfolio

**Researched:** 2026-09-26  
**Confidence:** HIGH (stack locked by product brief)

## Locked Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Language | TypeScript (strict) | Portfolio signal; enables pure logic tests |
| Bundler / DX | Vite | Fast `npm run dev`; ESM-native |
| Renderer | PixiJS **v8** | Application, Ticker, Graphics, Text |
| Tests | Vitest | Unit-test `GameLogic` without canvas |
| Package manager | npm | Match success criterion `npm run dev` |

## Recommended Versions (at scaffold time)

Pin latest stable at install; do not invent older majors:

- `pixi.js` ^8
- `typescript` ^5
- `vite` ^6 (or current stable)
- `vitest` ^3 (or current stable)

## What We Explicitly Skip (v1)

| Tool | Why skip |
|------|----------|
| Backend / WebSocket | Client-only demo |
| State libs (Redux/Zustand) | Tiny surface; logic owns state + subscribers |
| Physics engines | Multiplier curve is math, not physics |
| Asset packers / Spine | No textures for v1 |
| CSS frameworks | Minimal HTML shell + DEMO badge |

## PixiJS Skills (implementation guidance)

When implementing render/animation phases, prefer official PixiJS skill packs (e.g. scene/graphics, ticker/application patterns) over inventing APIs. Key v8 habits:

- `await app.init({ ... })` then attach `app.canvas`
- Drive gameplay from `app.ticker` using `ticker.deltaMS`
- Draw curves with `Graphics`: `moveTo` / `lineTo` / `stroke({ width, color })` — not deprecated `lineStyle`
- Resize via `app.renderer.resize` + CSS-constrained parent for mobile

## Tooling Checklist at Scaffold

- [ ] `tsconfig` strict, path alias `@/` optional
- [ ] Vite template or manual `index.html` + `src/main.ts`
- [ ] Vitest config with `src/game/**/*.test.ts`
- [ ] ESLint optional; not required for v1 success

## Confidence

| Area | Level | Why |
|------|-------|-----|
| Core stack | HIGH | User-locked |
| Vitest | HIGH | Standard for pure TS |
| HTML overlay UI | MEDIUM | Best DX guess; can move to Pixi later |
