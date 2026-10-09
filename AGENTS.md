<!-- gsd-project-start source:PROJECT.md -->

## Project

**casino-pixi-portfolio (HOTLINE + Crash)**

Client-only PixiJS v8 portfolio of casino-style game demos. Crash (Aviator-like) already ships. Next focus is **HOTLINE** — a 5x4 / 40-line slot whose math and feature flow mirror Endorphina's **3 Witch Pots**, reskinned as Hotline Miami (motel rooftop at sunset, CRT/VHS monitor frame, neon 80s). A shared game menu lets the player pick Crash, HOTLINE, and later other demos.

**Core Value:** A portfolio visitor can open the menu, launch **HOTLINE**, and feel the full Witch Pots loop (base spins, colored diskette tokens into three rotary phones, three bonuses including combos, VHS gamble) in a Hotline Miami look — with working JSON configs shaped like backend-driven game config.

### Constraints

- **Tech stack**: PixiJS v8, TypeScript, Vite, Vitest — match existing Crash patterns (`logic` / `view` / `hud`, shared audio/rng/money)
- **Client-only**: no real backend; JSON config files stand in for "config from server"
- **Art pipeline**: when graphics are needed, ask the user with a clear asset list; user generates and places files
- **Code comments**: lowercase; no trailing period; no special symbols (arrows, em dashes, etc.)
- **Portfolio voice**: minimize AI fingerprints in code, copy, commit messages, and README tone — prefer short human phrasing
- **Font**: use the Retro Computer TTF already in `src/shared/fonts/`
- **Scope discipline**: Witch Pots feature set only for HOTLINE v1; menu must leave room for more games later

<!-- gsd-project-end -->

<!-- gsd-stack-start source:research/STACK.md -->

## Technology Stack

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `pixi.js` | `8.21.0` (pin; latest npm `8.22.0`) | WebGL scene, Assets, Text, masks, ticker | Already shipping Crash; stay on v8. Prefer intentional bump to `8.22.0` later, not mid-feature. |
| TypeScript | `~5.8.3` | Typed logic/view separation | Matches repo; do not jump to TS 7 while Vite 6 + existing Crash code is stable. |
| Vite | `^6.4.3` (verify `6.4.4`) | Dev server, ESM, JSON/asset imports | Existing toolchain; Vite 7/8 exist on npm but are out of scope for this milestone. |
| Vitest | `^3.2.7` | Unit tests for math, config, HUD pure helpers | Already used heavily under `src/games/crash/**/*.test.ts` and `src/shared/**`. |
| `seedrandom` | `^3.0.5` | Seeded U(0,1) via `src/shared/rng/createRng.ts` | Reuse for HOTLINE outcomes + `?seed=` boot parity with Crash. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zod` | `^4.6.5` | Runtime-parse backend-shaped game JSON | Load HOTLINE (and later games) config once at boot; fail loud on bad weights/paytables. |
| `howler` | `^2.2.4` | Sample SFX / short loops | New `AudioPort` adapter for HOTLINE (spin, land, token fly, bonus, VHS gamble). Keep Crash beeps. |
| `@types/howler` | `^2.2.13` | Howler typings | DevDependency only. |
| PixiJS `Assets` (built-in) | (via `pixi.js`) | Textures, JSON, web fonts | Load symbol sheets, backdrop, Retro Computer TTF, optional spritesheets. |
| PixiJS `Text` / `BitmapText` | (via `pixi.js`) | Titles vs per-frame counters | `Text` + loaded TTF for brand chrome; `BitmapText` only for hot numbers (Crash already does this). |
| Custom reel view | — (first-party) | 5×4 strip scroll, mask, stagger stop | Prefer over third-party reel engines for portfolio control and Crash-aligned ticker motion. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Vitest (`npm test`) | Logic + config schema tests | Test paylines, token meters, Hold & Win, pick'em, gamble, Zod schemas without canvas. |
| Vite HMR | Fast iterate Crash + HOTLINE mounts | Keep `import.meta.hot.dispose` teardown pattern from `main.ts`. |
| TypeScript `tsc --noEmit` | Build gate | Already in `npm run build`. |
| Browser DevTools | Visual QA | No Playwright/Cypress in stack for v1 unless a smoke phase is added later. |

## Installation

# Already present — keep pinned

# pixi.js@8.21.0 seedrandom typescript vite vitest

# Add for HOTLINE + menu milestone

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Custom reel engine (ticker + mask) | `pixi-reels@4.x` | Only if you want Hold & Win / cascades recipes and accept mandatory `gsap` peer + different motion stack than Crash. |
| `howler` behind `AudioPort` | `@pixi/sound@6.x` | If you want audio registered through `Assets` and are fine coupling SFX lifecycle to Pixi. |
| `howler` / samples | Stay on beep-only Web Audio | Fine for Crash; insufficient for HOTLINE presentation once art/SFX land. |
| Zod 4 parse of static JSON | Hand-written type guards / `as const` only | Tiny configs with no weights; not enough for portfolio “backend-shaped” claim. |
| Zod 4 | Valibot / ArkType | Bundle-obsessed apps; Zod is the readable default and has `z.toJSONSchema()` for docs. |
| DOM menu + game mount | React/Vue shell | Never for this repo — Crash HUD is plain DOM; keep the same voice. |
| Pin `pixi.js@8.21.0` | Jump to `8.22.0` immediately | After HOTLINE green; treat as a chore bump with visual regression check. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `pixi-reels` + `gsap` | Peer `gsap@^3.15` (and optional Spine / `pixi-silk`) fights the Crash ticker-tween style and adds a second animation runtime for one portfolio slot. | First-party `hotline/view/reels` (strip Container + Graphics mask + stagger stop). |
| `@esotericsoftware/spine-pixi-v8` | Skeleton pipeline + art export complexity; user supplies PNG/WebP packs. | Sprites / spritesheets via `Assets`. |
| Phaser / Three.js / Babylon | Parallel engines; portfolio already Pixi-native. | Stay on PixiJS v8. |
| React / Preact / Solid for menu | Overkill; diverges from Crash `#app` HUD. | Shared DOM shell + CSS (extend `styles/hud.css` or sibling). |
| Live REST/WebSocket “config API” | Out of scope; client demo only. | Static JSON under `src/games/hotline/config/` (or `public/config/`) parsed with Zod. |
| Fair/certified RNG packages | Not a regulated product. | Existing `seedrandom` + `createRng`. |
| GSAP for reel/UI motion | New global tween dependency; Crash already uses deltaMS + hermite/easing helpers. | Ticker-driven motion in view modules. |
| `@pixi/sound` *and* Howler together | Two unlock/mute systems. | One sample backend behind `AudioPort`. |
| Inter / system UI fonts for HOTLINE brand | Creative direction locks Retro Computer. | `src/shared/fonts/retrocomputerrusbydaymarius.ttf` via `Assets.load` + CSS `@font-face` for DOM. |

## Stack Patterns by Variant

- Keep `createBeepAudioPort`
- Because demo beeps already prove mute/unlock; no Howler needed until HOTLINE SFX exist
- Add `createHowlerAudioPort` (or sample WebAudio adapter) implementing `AudioPort`
- Widen event IDs per game (do not hard-code Crash-only `SfxEvent` forever — game-local event unions mapped at the shell)
- Because mute preference + unlock must stay shared across menu / Crash / HOTLINE
- Pack a spritesheet JSON + atlas; load via `Assets` spritesheet parser
- Because fewer HTTP requests and cheaper reel redraws
- Use `BitmapText` (Crash `TheaterText` pattern) or DOM text for HUD
- Because `Text` re-rasterizes on every string change
- Shape JSON like `{ gameId, version, math, features, paytable, audio }` and `GameConfigSchema.parse(raw)`
- Optionally expose `z.toJSONSchema(GameConfigSchema)` in a comment or docs file for hiring reviewers
- Because Zod parse at the boundary mirrors production config ingestion without a live API

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `pixi.js@8.21.0` | Vite 6, TS 5.8, Vitest 3 | Verified in-repo today. |
| `pixi.js@^8.18` | `pixi-reels@4` + `gsap@^3.15` | Compatible but **not adopted** — see What NOT to Use. |
| `@pixi/sound@6.x` | `pixi.js@^8` | Peer-compatible; superseded here by Howler + `AudioPort`. |
| `zod@4.6.x` | Vite ESM / Vitest | Parse once at load; avoid `z.compile()` if CSP forbids `new Function` (portfolio default Vite has no strict CSP). |
| `howler@2.2.4` | Modern Chromium/Firefox/Safari | Unlock on first user gesture; call `audio.unlock()` on Spin like Crash does on bet. |
| Vite `6.4.x` | Vitest `3.2.x` | Keep majors paired; do not mix Vite 8 + Vitest 3 casually. |

## Prescriptive layout (extend existing modules)

### Font loading (Pixi + DOM)

### Config boundary

### Audio boundary

## Sources

- npm registry (`npm view`) — `pixi.js@8.21.0` / latest `8.22.0`, `zod@4.6.5`, `howler@2.2.4`, `pixi-reels@4.1.0` peers — **confidence: HIGH**
- [PixiJS v8 Assets guide](https://pixijs.com/8.x/guides/components/assets) — web fonts, JSON, spritesheets — **confidence: MEDIUM** (official docs + cross-check)
- [PixiJS loadWebFont / fonts skill](https://pixijs.download/v8.10.2/docs/assets.loadWebFont.html) — TTF → FontFace + `data.family` — **confidence: MEDIUM**
- [npm `pixi-reels`](https://www.npmjs.com/package/pixi-reels) — GSAP peer, Spine optional — **confidence: HIGH** (reject for this repo)
- [Zod v4 release notes](https://zod.dev/v4) — stable Zod 4, JSON Schema export — **confidence: HIGH**
- In-repo Crash patterns — `logic` / `view` / `hud`, `Assets.load`, `AudioPort`, `createRng`, Vitest — **confidence: HIGH**

<!-- gsd-stack-end -->

<!-- gsd-conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- gsd-conventions-end -->

<!-- gsd-architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- gsd-architecture-end -->

<!-- gsd-skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.cursor/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- gsd-skills-end -->

<!-- gsd-workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- gsd-workflow-end -->

<!-- gsd-profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- gsd-profile-end -->
