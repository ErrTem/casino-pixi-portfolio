# Stack Research

**Domain:** Client-only Crash (Aviator-like) browser game — PixiJS v8 portfolio demo
**Researched:** 2026-09-26
**Confidence:** HIGH (architecture / library choices); MEDIUM (exact npm patch versions — live registry checks unavailable in this research pass; confirm with `npm view <pkg> version` at scaffold)

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **PixiJS** (`pixi.js`) | `^8` (latest 8.x) | WebGL/WebGPU 2D canvas: curve, rocket sprite, crash FX | Locked portfolio stack; v8 is the current API (`Application` + async `init`, monolithic `pixi.js` import). Official `create-pixi` + installed Pixi skills cover implementation. | HIGH |
| **TypeScript** | `~5.8` or latest 5.x | Typed GameLogic + view boundaries | Locked; TS 5 keeps WebGPU typings simple (`@webgpu/types` via Pixi). Avoid TS 6/7 for v1 — they need `@types/web` and conflict with `@webgpu/types` (per Pixi create skill). | HIGH |
| **Vite** | `^6.3` or latest 6.x+ (≥ `6.0.7` preferred) | Dev server, HMR, production bundle | Locked; official Pixi template is `bundler-vite`. Fast enough for a single-page demo; no SPA framework required. Prefer ≥6.0.7 or wrap `app.init()` in an async IIFE (top-level await prod bug on ≤6.0.6). | HIGH |
| **Vanilla HTML + CSS** | — | Bet / cash-out / balance / DEMO badge overlay | Locked: thin DOM controls over Pixi canvas. Fastest path to a playable single-game demo; React/Angular deferred to a future multi-game shell. | HIGH |
| **Node.js** | `20 LTS` or `22 LTS` | Tooling runtime | Pixi create skill requires Node 18+; LTS avoids toolchain surprises. | HIGH |

### Supporting Libraries

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| **Built-in `app.ticker`** | (via `pixi.js`) | Frame loop; view sync to GameLogic elapsed time | **Always.** Crash multiplier progress is time/formula-driven in logic — feed `deltaMS` into GameLogic, re-render curve/rocket from state. Do not tween the multiplier itself. | HIGH |
| **seedrandom** | `^3.0.5` | Seeded PRNG for crash points | **v1.** Reproducible rounds for Vitest + recruiter demos. Keep RNG behind a `Rng` interface in GameLogic so the algo can swap later. | HIGH |
| **Vitest** | `^3` (latest 3.x) | Unit tests for pure GameLogic | **v1.** Same Vite ecosystem; test wallet, round FSM, crash sampling, auto cash-out — no canvas needed. | HIGH |
| **Howler** (`howler`) | `^2.2.4` | SFX placeholders (bet, fly, cash-out, crash) | **When adding audio.** Framework-agnostic; works with HTML overlay + Pixi. Until then, an `AudioPort` no-op stub is enough. | MEDIUM |
| **GSAP** (`gsap`) | `^3.12+` | Optional polish tweens (shake, pulse, rocket wobble) | **Optional / later.** Not required for a correct Crash loop. Prefer ticker + state for core motion; add GSAP only if polish cost is justified. | MEDIUM |
| **`@types/seedrandom`** | matching | TS types for seedrandom | With seedrandom. | HIGH |
| **`@types/howler`** | matching | TS types for Howler | If Howler is added. | HIGH |
| **`@webgpu/types`** | (transitive / TS5) | WebGPU DOM types for Pixi | Automatic on TS 5 via Pixi; do **not** force-add on TS 6/7. | HIGH |

### Development Tools

| Tool | Purpose | Notes | Confidence |
|------|---------|-------|------------|
| **`create-pixi` / `npm create pixi.js@latest`** | Scaffold | Use `--template bundler-vite` (not `framework-react`, not `creation-web`). npm 7+: `npm create pixi.js@latest . -- --template bundler-vite` | HIGH |
| **Vitest** | GameLogic tests | `environment: 'node'` for pure logic; no jsdom required for wallet/RNG/FSM | HIGH |
| **TypeScript `moduleResolution: "bundler"`** | Correct Pixi subpath imports | Required for `pixi.js/*` exports; `"node"` / `"node10"` breaks them | HIGH |
| **ESLint + typescript-eslint** | Lint | Optional but useful for portfolio hygiene; keep config light | MEDIUM |
| **Prettier** | Format | Optional; team preference | MEDIUM |
| **Installed PixiJS skills** | Implementation guidance | Use for Application, ticker, Graphics, Sprite, Assets, events — not a runtime dep | HIGH |

## Installation

```bash
# Scaffold (preferred greenfield path)
npm create pixi.js@latest . -- --template bundler-vite
# Requires Node 20+ recommended; confirm template wrote Vite + TS + pixi.js

# Core (if not already from template)
npm install pixi.js
npm install -D typescript vite

# Supporting — RNG + tests (v1)
npm install seedrandom
npm install -D vitest @types/seedrandom

# Supporting — audio placeholders (when ready)
npm install howler
npm install -D @types/howler

# Optional polish only
# npm install gsap
```

**Scaffold tip:** If the directory is non-empty (e.g. already has `.planning/`), scaffold into a temp folder or add packages manually with the same stack — do not fight `create-pixi` over existing files.

**Init tip:** Always wrap boot in an async function (safe across Vite versions):

```ts
async function main() {
  const app = new Application();
  await app.init({
    resizeTo: window,
    antialias: true,
    autoDensity: true,
    resolution: Math.min(window.devicePixelRatio, 2),
    background: "#0b1020",
    preference: "webgl", // WebGPU optional; WebGL is the portable default for demos
  });
  document.querySelector("#game")!.appendChild(app.canvas);
}
main();
```

## Architecture Fit (stack → project locks)

| Layer | Tech | Rule |
|-------|------|------|
| **GameLogic** | Pure TypeScript only | Round FSM, wallet, bet presets, auto cash-out, seeded crash sampling, multiplier-at-time. **No** `pixi.js` imports. |
| **GameView** | `pixi.js` | Reads logic state; draws curve (`Graphics`) + rocket (`Sprite`); listens to `app.ticker`. |
| **HtmlUi** | HTML/CSS + thin TS bindings | Bet, cash out, balance, DEMO badge, history strip. Talks to GameLogic via events/callbacks — not through Pixi. |
| **Audio** | Howler or stub | Behind `AudioPort`; placeholders OK. |

This separation is a stack decision: testability and a future multi-game shell both depend on it.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `pixi.js` v8 | Phaser 3 | Full scene/physics/UI kit — wrong for a **Pixi portfolio** piece; hides the skill you want to show. |
| `pixi.js` v8 | Three.js / R3F | 3D stack; Crash is 2D curve + sprite. Overkill and wrong signal. |
| Vite + vanilla HTML | React / Angular / Vue | Only when adding a multi-game casino shell; locked out of v1. |
| Vite + vanilla HTML | `@pixi/react` / `framework-react` template | Couples Pixi to React lifecycle; slower demo path; conflicts with HTML-overlay lock. |
| `create-pixi` `bundler-vite` | `creation-web` (Creation Engine) | Batteries-included scenes/AssetPack — heavier than a single Crash page needs. |
| `app.ticker` + logic time | GSAP / Tween.js for multiplier | Tweens fight deterministic seeded timing; use ticker/`deltaMS` for core flight. |
| seedrandom | Hand-rolled Mulberry32 | Fine if you want zero RNG deps; seedrandom is clearer for “seeded demo RNG” in a portfolio README. |
| seedrandom | crypto / Web Crypto | Non-seeded / hard to replay; bad for tests. Not “provably fair” either without a backend story. |
| Howler | `@pixi/sound` | Prefer if all audio is loaded via Pixi `Assets` and you want one pipeline; Howler is simpler for HTML-first SFX stubs. |
| Howler | Raw Web Audio API | Only if building custom synthesis; more code for placeholder beeps. |
| Vitest | Jest | Extra config with Vite; Vitest is the default Vite-era choice. |
| Vitest | Playwright-only | E2E later for smoke; does not replace fast pure-logic unit tests. |
| TypeScript 5.x | TypeScript 6/7 | OK later with `@types/web` and no `@webgpu/types`; unnecessary friction for greenfield v1. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **React / Angular / Vue (v1)** | Locked out; slows a single Crash page; recruiters evaluate Pixi + architecture, not SPA wiring | HTML/CSS overlay + thin TS bindings |
| **Phaser / MelonJS / Construct** | Wrong portfolio signal; abstracts away Pixi | `pixi.js` v8 |
| **Backends, Socket.io, Firebase, auth** | Out of scope; client-only demo | Local GameLogic + demo wallet |
| **Provably fair / crypto commit-reveal** | Out of scope; certification theater for a portfolio | seedrandom + DEMO labeling |
| **Physics engines (Matter, Planck)** | Crash is a 1D multiplier curve, not rigid-body physics | Formula + ticker |
| **Legacy `@pixi/*` piecemeal packages / Pixi v7 patterns** | v8 is monolithic `pixi.js`; v7 APIs (`beginFill`, `BaseTexture`) are obsolete | Single `pixi.js` import + v8 skills |
| **Heavy UI kits (MUI, Bootstrap)** | Fight the canvas-first composition; card-heavy look | Minimal custom CSS for the control bar |
| **State libs (Redux, Zustand) for v1** | Round state is a small FSM in GameLogic | Plain TS class/module + events |
| **Real-money / payment SDKs** | Illegal/inappropriate for this demo | DEMO badge + fake balance |
| **Commercial casino assets / lookalike branding** | IP risk | Original or user-provided art; placeholders OK |

## Stack Patterns by Variant

**If shipping the minimal playable Crash (recommended v1):**
- `pixi.js` + Vite + TS + HTML overlay + seedrandom + Vitest
- Ticker-driven view; audio stub; no GSAP
- Because: matches PROJECT.md locks and ships fastest

**If adding SFX before art is ready:**
- Add Howler + short placeholder WAVs/MP3s (or oscillator beeps)
- Keep `AudioPort` so tests stay silent
- Because: audio sells “game feel” without blocking on sprites

**If adding motion polish after the loop works:**
- Optional GSAP for crash camera shake / cash-out pulse only
- Multiplier and rocket path stay logic/ticker-owned
- Because: polish must not break seeded reproducibility

**If later adding a multi-game casino shell:**
- Introduce React/Angular (or similar) **around** existing GameLogic packages
- Keep each game’s view swappable; do not rewrite logic into components
- Because: PROJECT.md explicitly defers the shell

**If targeting WebGPU showcase:**
- Set `preference: "webgpu"` with WebGL fallback; keep TS 5 + Pixi’s types story
- Because: nice portfolio talking point, not required for Crash correctness

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `pixi.js@^8` | Vite `^5` / `^6` / likely `^7` | Use ES modules; `moduleResolution: "bundler"` |
| `pixi.js@^8` | TypeScript 5.x | Default path; `@webgpu/types` OK |
| `pixi.js@^8` | TypeScript 6/7 | Use `@types/web`; remove `@webgpu/types` from `types` |
| Vite `<=6.0.6` | Top-level `await app.init()` | Broken in **production** build — use async IIFE or upgrade Vite |
| `seedrandom@3` | Vitest node env | Deterministic unit tests; pass explicit seeds |
| Howler 2.x | Modern browsers | Needs user gesture to unlock audio — bind first play to bet/cash-out click |
| GSAP 3.x | Pixi display objects | Tween `x`/`y`/`alpha`/`scale`; do not own round timing |

## Recommended Defaults (prescriptive)

1. **Scaffold / deps:** `bundler-vite` + `pixi.js@^8` + TypeScript 5.x + Vite 6.x+
2. **UI:** Pixi owns `#game` canvas; HTML bar for wallet/controls/DEMO — **no React in v1**
3. **Timebase:** `app.ticker` → GameLogic `update(deltaMS)` → view reads state
4. **RNG:** `seedrandom` behind `createRng(seed: string)`
5. **Tests:** Vitest on GameLogic only (FSM, payouts, crash samples, auto cash-out)
6. **Audio:** stub first; Howler when adding placeholders
7. **Tween lib:** skip for v1 core; GSAP optional later for FX only
8. **Implementation help:** installed PixiJS skills (application, ticker, graphics, sprite, assets, events)

## Sources

- `D:/pixi/casino-pixi-portfolio/.planning/PROJECT.md` — locked stack, HTML overlay, seeded RNG, GameLogic/view split, out-of-scope list (HIGH)
- PixiJS skill collection (`pixijs`, `pixijs-create`, `pixijs-application`, `pixijs-ticker`) — v8 Application/init, `bundler-vite`, ticker semantics, TS 5/6/7 typing, Vite ≤6.0.6 top-level await pitfall (HIGH)
- Official Pixi create guidance: `npm create pixi.js@latest` + template `bundler-vite` (HIGH)
- Domain practice: Crash multiplier = server/logic clock + formula; canvas is presentation — matches ticker + pure TS logic (HIGH)
- npm exact patches: **not live-verified this pass** (shell/registry tools unavailable) — confirm at install with `npm view pixi.js version` etc. (MEDIUM)

---
*Stack research for: PixiJS v8 Crash portfolio demo (client-only)*
*Researched: 2026-09-26*
