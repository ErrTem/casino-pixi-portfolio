# Stack Research

**Domain:** Client-only PixiJS v8 multi-game casino portfolio (Crash existing + HOTLINE slot + shared menu)
**Researched:** 2026-10-09
**Confidence:** HIGH (toolchain pinned to brownfield repo + npm registry); MEDIUM (reel/audio library ecosystem tradeoffs)

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

```bash
# Already present — keep pinned
# pixi.js@8.21.0 seedrandom typescript vite vitest

# Add for HOTLINE + menu milestone
npm install zod@^4.6.5 howler@^2.2.4
npm install -D @types/howler@^2.2.13
```

No new framework packages. Extend `src/shared/` and add `src/games/hotline/`.

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

**If extending Crash-only audio forever:**
- Keep `createBeepAudioPort`
- Because demo beeps already prove mute/unlock; no Howler needed until HOTLINE SFX exist

**If shipping HOTLINE with real SFX (default for this milestone):**
- Add `createHowlerAudioPort` (or sample WebAudio adapter) implementing `AudioPort`
- Widen event IDs per game (do not hard-code Crash-only `SfxEvent` forever — game-local event unions mapped at the shell)
- Because mute preference + unlock must stay shared across menu / Crash / HOTLINE

**If symbol art arrives as many loose PNGs:**
- Pack a spritesheet JSON + atlas; load via `Assets` spritesheet parser
- Because fewer HTTP requests and cheaper reel redraws

**If counters update every frame (win rollups):**
- Use `BitmapText` (Crash `TheaterText` pattern) or DOM text for HUD
- Because `Text` re-rasterizes on every string change

**If config must look “from server”:**
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

```
src/
  main.ts                 # boot menu shell → mountCrash | mountHotline
  shared/
    audio/                # AudioPort + beep + howler adapters + mutePref
    boot/parseBootSeed.ts
    fonts/…ttf            # Retro Computer (already present)
    rng/createRng.ts
    money/cents.ts
    shell/                # NEW: game registry, mount/unmount, shared chrome
  games/
    crash/                # unchanged gameplay; menu wires it
    hotline/
      logic/              # pure: spin, lines, tokens, bonuses, gamble + tests
      config/*.json       # backend-shaped; Zod schemas colocated
      view/               # Pixi: reels, phones, tokens, CRT frame
      hud/                # DOM HUD mirroring Crash patterns
```

### Font loading (Pixi + DOM)

```ts
import { Assets, Text } from "pixi.js";
import fontUrl from "../../shared/fonts/retrocomputerrusbydaymarius.ttf?url";

await Assets.load({
  alias: "retro-computer",
  src: fontUrl,
  data: { family: "RetroComputer", weights: ["normal"] },
});

const title = new Text({
  text: "HOTLINE",
  style: { fontFamily: "RetroComputer", fontSize: 48, fill: 0xff2a6d },
});
```

Also register the same family in CSS for the menu / HUD so DOM and canvas match.

### Config boundary

```ts
import { z } from "zod";
import raw from "./config/hotline.game.json";

const HotlineConfigSchema = z.object({
  gameId: z.literal("hotline"),
  version: z.string(),
  // math, paylines, token weights, bonus tables, gamble…
});

export type HotlineConfig = z.infer<typeof HotlineConfigSchema>;
export const HOTLINE_CONFIG = HotlineConfigSchema.parse(raw);
```

### Audio boundary

Keep Crash on beeps. Add Howler adapter for HOTLINE samples; shell owns one mute pref (`loadMutePref` / `AudioPort.setMuted`).

## Sources

- npm registry (`npm view`) — `pixi.js@8.21.0` / latest `8.22.0`, `zod@4.6.5`, `howler@2.2.4`, `pixi-reels@4.1.0` peers — **confidence: HIGH**
- [PixiJS v8 Assets guide](https://pixijs.com/8.x/guides/components/assets) — web fonts, JSON, spritesheets — **confidence: MEDIUM** (official docs + cross-check)
- [PixiJS loadWebFont / fonts skill](https://pixijs.download/v8.10.2/docs/assets.loadWebFont.html) — TTF → FontFace + `data.family` — **confidence: MEDIUM**
- [npm `pixi-reels`](https://www.npmjs.com/package/pixi-reels) — GSAP peer, Spine optional — **confidence: HIGH** (reject for this repo)
- [Zod v4 release notes](https://zod.dev/v4) — stable Zod 4, JSON Schema export — **confidence: HIGH**
- In-repo Crash patterns — `logic` / `view` / `hud`, `Assets.load`, `AudioPort`, `createRng`, Vitest — **confidence: HIGH**

---
*Stack research for: PixiJS v8 casino portfolio (HOTLINE + menu on Crash brownfield)*
*Researched: 2026-10-09*
