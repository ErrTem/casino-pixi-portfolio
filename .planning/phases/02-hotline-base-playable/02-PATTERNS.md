# Phase 2: HOTLINE Base Playable - Pattern Map

**Mapped:** 2026-10-09
**Files analyzed:** 26
**Analogs found:** 22 / 26

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/games/hotline/session/mountHotlineSession.ts` | controller | event-driven | `src/games/crash/session/mountCrashSession.ts` | exact |
| `src/shell/gameRegistry.ts` | route | request-response | `src/shell/gameRegistry.ts` (crash entry) | exact |
| `src/games/hotline/config/HotlineConfigSchema.ts` | model | transform | — | none (Zod new) |
| `src/games/hotline/config/hotline.config.json` | config | file-I/O | `src/games/crash/logic/config.ts` | role-match |
| `src/games/hotline/config/loadHotlineConfig.ts` | service | request-response | — | none (Zod parse new) |
| `src/games/hotline/logic/Wallet.ts` | service | CRUD | `src/games/crash/logic/Wallet.ts` | exact |
| `src/games/hotline/logic/SpinEngine.ts` | service | transform | `src/games/crash/logic/CrashRng.ts` | role-match |
| `src/games/hotline/logic/evaluatePaylines.ts` | utility | transform | — | none (slot math new) |
| `src/games/hotline/logic/HotlineGame.ts` | service | event-driven | `src/games/crash/logic/CrashGame.ts` | exact |
| `src/games/hotline/logic/index.ts` | utility | transform | `src/games/crash/logic/index.ts` | exact |
| `src/games/hotline/view/mountHotlineView.ts` | component | request-response | `src/games/crash/view/mountCrashView.ts` | exact |
| `src/games/hotline/view/HotlineScene.ts` | component | event-driven | `src/games/crash/view/CrashScene.ts` | exact |
| `src/games/hotline/view/loadHotlineAssets.ts` | utility | file-I/O | `src/games/crash/view/Backdrop.ts` (`loadBackdropTextures`) | exact |
| `src/games/hotline/view/PhonesLayer.ts` | component | request-response | `src/games/crash/view/Backdrop.ts` (sprite layers) | role-match |
| `src/games/hotline/view/reels/*` | component | streaming | `src/games/crash/view/CrashScene.ts` + `altitudePose.ts` | partial |
| `src/games/hotline/view/WinLinesOverlay.ts` | component | event-driven | `src/games/crash/view/CurveGraph.ts` | role-match |
| `src/games/hotline/hud/HotlineHud.ts` | component | event-driven | `src/games/crash/hud/CrashHud.ts` | exact |
| `src/games/hotline/hud/format.ts` | utility | transform | `src/games/crash/hud/format.ts` | exact |
| `src/games/hotline/hud/lastWinTween.ts` | utility | transform | `src/games/crash/hud/balanceTween.ts` | exact |
| `src/shared/audio/AudioPort.ts` | model | pub-sub | `src/shared/audio/AudioPort.ts` | exact |
| `src/shared/audio/createBeepAudioPort.ts` | service | event-driven | `src/shared/audio/createBeepAudioPort.ts` | exact |
| `index.html` (`#hotline-screen-template`) | config | request-response | `index.html` (`#crash-screen-template`) | exact |
| `src/styles/hud.css` | config | request-response | `src/styles/hud.css` | exact |
| `tests/architecture.no-pixi.test.ts` | test | batch | `tests/architecture.no-pixi.test.ts` | exact |
| `tests/hotline.*.test.ts` (config/paylines/wallet/spin) | test | batch | `tests/wallet.test.ts`, `tests/crashRng.test.ts` | role-match |
| `package.json` (add `zod`) | config | file-I/O | `package.json` | exact |
| `public/assets/hotline/*.png` | config | file-I/O | `public/assets/clouds/*.png` (Crash loose PNGs) | role-match |

## Pattern Assignments

### `src/games/hotline/session/mountHotlineSession.ts` (controller, event-driven)

**Analog:** `src/games/crash/session/mountCrashSession.ts`

**Imports pattern** (lines 1-12):
```typescript
import { sfxEventsFromTransition } from "../../../shared/audio/sfxEdges.js";
import type { GameSession, ShellContext } from "../../../shell/types.js";
import { mountCrashHud } from "../hud/CrashHud.js";
import { CRASH_CONFIG } from "../logic/config.js";
import { createGame, type CrashSnapshot } from "../logic/index.js";
import { mountCrashView } from "../view/mountCrashView.js";
```

**Core mount pattern** (lines 16-48): clone `#*-screen-template`, append to `ctx.root`, attach `ctx.app.canvas` to `#game-canvas-host`, set `ctx.app.resizeTo = host`, create game + HUD, wire Menu → `ctx.requestMenu()`.

**Dispose pattern** (lines 59-77) — copy exactly; never destroy shell app/audio:
```typescript
function dispose(): void {
  if (disposed) return;
  disposed = true;
  ctx.signal.removeEventListener("abort", onAbort);
  if (onTick) {
    ctx.app.ticker.remove(onTick);
    onTick = null;
  }
  hud.dispose();
  if (view) {
    view.scene.destroy();
    view.dispose();
    view = null;
  }
  (ctx.app as { resizeTo: Window | HTMLElement | null }).resizeTo = null;
  ctx.app.stop();
  ctx.app.canvas.remove();
  screen.remove();
}
```

**Ticker sync pattern** (lines 94-135): `game.tick` / HOTLINE spin settle → audio play → `hud.render` → `view.scene.sync`. AbortSignal `once` dispose (lines 54-57).

**HOTLINE deltas:** call `loadHotlineConfig()` before game create (throw on bad JSON); unlock + play `"spin"` on Spin (not Crash auto-bet); no dual bet slots / autoplay.

---

### `src/shell/gameRegistry.ts` (route, request-response)

**Analog:** same file, crash entry (lines 9-20)

**Core pattern** — flip HOTLINE stub (lines 22-28) to match crash lazy mount:
```typescript
{
  id: "hotline",
  title: "HOTLINE",
  blurb: "Neon motel slot",
  iconUrl: "/assets/menu/icon-hotline.png",
  enabled: true,
  async mount(ctx) {
    const { mountHotlineSession } = await import(
      "../games/hotline/session/mountHotlineSession.js"
    );
    return mountHotlineSession(ctx);
  },
}
```

**Error handling:** router already catches mount throws → `reportError` → menu (`src/shell/router.ts` lines 84-90). Bad Zod parse relies on this — do not soft-fail in registry.

---

### `src/games/hotline/config/hotline.config.json` + `HotlineConfigSchema.ts` + `loadHotlineConfig.ts`

**Analog for shape only:** `src/games/crash/logic/config.ts` (typed const bag — lines 1-17). No Zod analog in-repo.

**Crash config pattern** (replace with Zod + JSON for HOTLINE):
```typescript
export const CRASH_CONFIG = {
  startingBalanceCents: 500_000,
  minBetCents: 1_000,
  maxBetCents: 100_000,
  // ...
} as const;
export type CrashConfig = typeof CRASH_CONFIG;
```

**Planner:** use RESEARCH.md Zod envelope example (`gameId`, `version`, `math`, `paytable`, `features`). Nested objects must be `z.object({...})`. `loadHotlineConfig()` = `HotlineConfigSchema.parse(raw)` — throw, no DOM panel (D-03).

---

### `src/games/hotline/logic/Wallet.ts` (service, CRUD)

**Analog:** `src/games/crash/logic/Wallet.ts`

**Imports / cents boundary** (lines 1-2):
```typescript
import type { Cents } from "../../../shared/money/cents.js";
import { CRASH_CONFIG } from "./config.js";
```

**Core pattern** (lines 8-56): integer cents balance; `placeBet` validates finite integer + min/max/balance → `{ ok: true } | { ok: false; reason }`; `credit` / `refund` / `reset`.

**HOTLINE deltas:** bet steps from Zod config (`betStepsCents`) instead of Crash min/max range; starting balance from config or per-game demo constant. Keep `PlaceBetResult` union shape.

**Shared money helpers:** `src/shared/money/cents.ts` lines 14-27 (`displayToCents`, `centsToDisplay`, `payoutCents`).

---

### `src/games/hotline/logic/SpinEngine.ts` (service, transform)

**Analog:** `src/games/crash/logic/CrashRng.ts` + `src/shared/rng/createRng.ts`

**RNG seam** (`createRng.ts` lines 8-11):
```typescript
export function createRng(seed: string): Rng {
  const prng = seedrandom(seed);
  return { next: () => prng() };
}
```

**Weighted sample pattern** (`CrashRng.ts` lines 12-20): pure function `(rng, cfg) => outcome`; clamp/sanitize `rng.next()`; no Pixi/DOM.

**HOTLINE:** map `rng.next()` through symbol weights / strip tables from config into a 5×4 window (or strip indices). Seed from `ctx.seed` via `createGame` options like CrashGame line 65.

---

### `src/games/hotline/logic/evaluatePaylines.ts` (utility, transform)

**Analog:** none in-repo (Crash has no paylines). Closest pure-logic style: `CrashRng.ts` / `MultiplierCurve` tests under `tests/`.

**Planner:** implement LTR consecutive + wild dual-track max per RESEARCH skeleton; Vitest-only; no canvas.

---

### `src/games/hotline/logic/HotlineGame.ts` (service, event-driven)

**Analog:** `src/games/crash/logic/CrashGame.ts`

**Imports pattern** (lines 1-24): money helpers, `createRng`, config, Wallet, pure resolvers.

**Facade pattern** (lines 64-148):
```typescript
export function createGame(options: CreateGameOptions): CrashGame {
  const rng: Rng = createRng(options.seed);
  const wallet = new Wallet(CRASH_CONFIG.startingBalanceCents);
  // ...
  return {
    placeBet(/* ... */) { /* wallet + state */ },
    tick(deltaMs: number) { /* or spin() for HOTLINE */ },
    getSnapshot() { /* display units via centsToDisplay */ },
    resetWallet() { wallet.reset(); },
  };
}
```

**HOTLINE deltas:** expose `spin()` / `setBetStep()` / snapshot `{ phase, balance, bet, lastWin, grid, lineWins }` instead of flying/cash-out. Keep display-unit snapshot boundary (logic stores cents).

**Barrel:** mirror `src/games/crash/logic/index.ts` (re-export createGame, types, Wallet, config).

---

### `src/games/hotline/view/mountHotlineView.ts` (component, request-response)

**Analog:** `src/games/crash/view/mountCrashView.ts`

**Core pattern** (lines 12-45): `Promise.all` asset loaders → `create*Scene(app, textures)` → return `{ scene, dispose }`. Dispose only removes window/viewport listeners — not the Application.

**HOTLINE:** call `loadHotlineAssets()` then `createHotlineScene`; keep DPR/orientation refresh if useful for portrait (lines 22-36).

---

### `src/games/hotline/view/HotlineScene.ts` (component, event-driven)

**Analog:** `src/games/crash/view/CrashScene.ts`

**Interface pattern** (lines 34-37, 90-111):
```typescript
export interface CrashScene {
  sync: (snapshot: CrashSnapshot, deltaMS: number) => void;
  destroy: () => void;
}
// stage children: backdrop → world → overlays; NEVER write app.stage.x / y
app.stage.addChild(backdrop.container, world, theater.container, flash);
```

**Layout:** portrait stack title → phones → CRT reels (D-10..D-12). Reuse layer Container + `sync(snapshot, deltaMS)` contract.

**Easing for reel stop:** copy hermite/smoothstep from `src/games/crash/view/altitudePose.ts` lines 21-27:
```typescript
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const span = edge1 - edge0;
  if (!(span > 0) || !Number.isFinite(x)) return x >= edge1 ? 1 : 0;
  const t = clamp01((x - edge0) / span);
  return t * t * (3 - 2 * t);
}
```

---

### `src/games/hotline/view/loadHotlineAssets.ts` + `PhonesLayer.ts`

**Analog:** `src/games/crash/view/Backdrop.ts` URL consts + `loadBackdropTextures` (lines 24-35, 347-363)

```typescript
export const CLOUD_ASSET_URLS = [
  "/assets/clouds/cloud-a.png",
  // ...
] as const;

export async function loadBackdropTextures(): Promise<{...}> {
  const urls = [...CLOUD_ASSET_URLS, ...TREE_ASSET_URLS];
  const textures = await Assets.load(urls);
  const pick = (list: readonly string[]): Texture[] =>
    list.map((url) => {
      const t = textures[url];
      return t instanceof Texture ? t : Texture.EMPTY;
    });
  return { cloudTextures: pick(CLOUD_ASSET_URLS), treeTextures: pick(TREE_ASSET_URLS) };
}
```

**HOTLINE:** declare `/assets/hotline/*.png` URL consts; load once before scene create; phones = inert `Sprite`s from textures (no meter growth). Fail loud if required URLs missing (D-05/D-07).

---

### `src/games/hotline/view/reels/*` (component, streaming)

**Analog:** partial — ticker `deltaMS` from CrashScene sync; no masked strip exists yet.

**Copy from:**
- Session ticker wiring: `mountCrashSession.ts` lines 94-133
- Smooth stop ease: `altitudePose.ts` `smoothstep`
- Masked window: RESEARCH Pattern 4 (Graphics rect mask on strip Container; leaf sprites wrapped in Containers)

**Do not** introduce `pixi-reels` / GSAP.

---

### `src/games/hotline/view/WinLinesOverlay.ts` (component, event-driven)

**Analog:** `src/games/crash/view/CurveGraph.ts` neon stroke stack (lines 168-205)

```typescript
function strokeNeonStack(
  glow: Graphics,
  halo: Graphics,
  core: Graphics,
  points: readonly PlotPoint[],
  color: number,
  faded: boolean,
): void { /* glow → halo → core Graphics strokes */ }

export function createCurveGraph(): CurveGraph {
  const container = new Container();
  const glow = new Graphics();
  const halo = new Graphics();
  const core = new Graphics();
  container.addChild(glow, halo, core);
  // ...
}
```

**HOTLINE:** polyline through winning cells + framed cells; Hotline neon color (discretion); cycle one line at a time (D-15/D-16). Pixi `Text` only for brief “LINE N PAYS” callout if needed — prefer infrequent updates (not per-frame money digits).

**Title text:** prefer Pixi `Text` + Retro Computer (RESEARCH font load), not Crash `BitmapText` theater (`TheaterText.ts`) which is for hot multipliers.

---

### `src/games/hotline/hud/HotlineHud.ts` (component, event-driven)

**Analog:** `src/games/crash/hud/CrashHud.ts`

**Imports pattern** (lines 1-18): `AudioPort`, money format, tween helpers, game facade types.

**Mount contract** (lines 83-126): query `data-action` / `data-field` on cloned screen; throw if required nodes missing; optional `audio` for mute.

**textContent only** (lines 155-158, 495) — never `.innerHTML`:
```typescript
balance.textContent = formatMoney(value);
lastWin.textContent = formatMoney(payout);
```

**Unlock on primary action** (lines 350-351) — Spin maps here:
```typescript
audio.unlock();
audio.play("bet_lock"); // HOTLINE: "spin"
```

**Balance / last-win tween RAF** (lines 148-184): reuse `balanceTweenValue` pattern for last-win count-up (D-15).

**Constraints:** Spin, bet −/+, balance, last win, “40 lines” only (D-13). No monetary controls inside `#game-canvas-host` (`tests/shell.hud-layout.test.ts` lines 81-91).

---

### `src/games/hotline/hud/format.ts` + `lastWinTween.ts`

**Analog:** `src/games/crash/hud/format.ts` lines 1-4; `balanceTween.ts` lines 5-17

```typescript
export function formatMoney(balanceDisplay: number): string {
  if (!Number.isFinite(balanceDisplay)) return "-";
  return balanceDisplay.toFixed(2);
}

export function balanceTweenValue(from: number, to: number, t01: number): number {
  const t = Number.isFinite(t01) ? Math.min(1, Math.max(0, t01)) : 0;
  const e = 1 - (1 - t) ** 3; // ease-out cubic
  return from + (to - from) * e;
}
```

**Tests:** mirror `src/games/crash/hud/balanceTween.test.ts` (describe/it, clamp, non-finite).

---

### `src/shared/audio/AudioPort.ts` + `createBeepAudioPort.ts` (model/service)

**Analog:** same files (widen in place)

**Current union** (`AudioPort.ts` lines 1-9):
```typescript
export type SfxEvent = "bet_lock" | "takeoff" | "cash_out" | "crash";
```

**Pitch map** (`createBeepAudioPort.ts` lines 38-43):
```typescript
const PITCH_HZ: Record<SfxEvent, number> = {
  bet_lock: 440,
  takeoff: 660,
  cash_out: 880,
  crash: 160,
};
```

**HOTLINE (D-17):** add `"spin" | "reel_stop" | "win"` (or equivalent); keep Crash events; map new pitches; mute/unlock/dispose unchanged (lines 93-128). Session plays events on Spin / reel stop / win — Crash still uses `sfxEdges.ts` for phase edges.

---

### `index.html` (`#hotline-screen-template`) + `src/styles/hud.css`

**Analog:** `index.html` lines 14-63 (crash template skeleton)

**Required structure:**
- `#hotline-screen-template` → `.app-shell` with `#top-chrome` (balance, last-win, Menu, mute)
- Empty `#game-canvas-host` (placeholder only; no `data-action` / `data-field`)
- `#hud-bar` with Spin, bet −/+, fixed “40 lines” readout

**Font:** existing `@font-face` Retro Computer (`hud.css` lines 1-5). Add portrait-first HOTLINE layout rules (tall column / letterbox) without breaking Crash shell.

---

### `tests/architecture.no-pixi.test.ts` (test, batch)

**Analog:** same file — extend `LOGIC_DIRS` (lines 5-9):
```typescript
const LOGIC_DIRS = [
  join(ROOT, "src", "games", "crash", "logic"),
  join(ROOT, "src", "shared"),
  // add: join(ROOT, "src", "games", "hotline", "logic"),
];
```

Pitfall 5 from RESEARCH: HOTLINE logic must stay in the scan or Pixi leaks go unnoticed.

---

### `tests/hotline.*.test.ts` (test, batch)

**Analogs:**
- Wallet / bet steps: `tests/wallet.test.ts` (createGame + Wallet + cents boundaries)
- Seeded outcomes: `tests/crashRng.test.ts` (same seed → identical sequence; diverge on different seeds)
- Pure helpers: colocated Crash HUD tests e.g. `balanceTween.test.ts`

**Pattern:** Vitest `describe`/`it`; import from `src/games/hotline/logic/...`; no canvas. Add schema test that malformed fixture throws `ZodError`.

---

### `package.json` (config)

**Analog:** existing deps pin style — `pixi.js` exactly `8.21.0`. Add `zod@^4.6.5` (RESEARCH). Human checkpoint that package is official colinhacks zod (SUS flag on publish date).

---

### `public/assets/hotline/*.png` (config, file-I/O)

**Analog:** Crash loose files under `/assets/clouds/`, `/assets/trees/` referenced as URL consts in `Backdrop.ts`. User places files after agent asset list (D-05); filenames per RESEARCH recommended asset table.

## Shared Patterns

### Session lifecycle (shell-owned Application)
**Source:** `src/games/crash/session/mountCrashSession.ts` lines 16-77, 134-137  
**Apply to:** `mountHotlineSession.ts`  
Clone template → host canvas → ticker add/start → dispose removes ticker/scene/canvas/screen only. Never `app.destroy()` / `audio.dispose()`.

### Pure logic boundary
**Source:** `tests/architecture.no-pixi.test.ts` lines 5-28, 65-82  
**Apply to:** all `src/games/hotline/logic/**`, config schema (no Pixi)  
Ban `pixi.js` imports and `document.` / `window.` in logic. Extend `LOGIC_DIRS`.

### Integer cents money
**Source:** `src/shared/money/cents.ts` lines 14-27; Wallet placeBet validation  
**Apply to:** Wallet, HotlineGame, HUD format  
Logic in cents; snapshot/HUD in display units via `centsToDisplay` / `formatMoney`.

### Seeded RNG
**Source:** `src/shared/rng/createRng.ts` lines 8-11; CrashGame line 65  
**Apply to:** SpinEngine / HotlineGame  
`createRng(ctx.seed)` at session create; never `Math.random` for outcomes.

### AudioPort mute / unlock
**Source:** `AudioPort.ts`, `createBeepAudioPort.ts`, CrashHud lines 350-351 / mute label 186-191  
**Apply to:** HotlineHud Spin + mute; widen `SfxEvent`  
Unlock on first Spin gesture; play new events; keep Crash pitches.

### DOM HUD data attributes + textContent
**Source:** `CrashHud.ts`, `index.html` crash template, `tests/shell.hud-layout.test.ts` lines 81-91  
**Apply to:** HotlineHud + `#hotline-screen-template`  
`data-action` / `data-field` outside `#game-canvas-host`; assign via `textContent` only.

### Assets.load then scene create
**Source:** `mountCrashView.ts` + `Backdrop.loadBackdropTextures`  
**Apply to:** `loadHotlineAssets` → `mountHotlineView` → `HotlineScene`  
URL consts under `/assets/hotline/`; load before mount; Texture.EMPTY fallback optional — prefer fail loud for required pack.

### Neon Graphics overlays
**Source:** `CurveGraph.ts` strokeNeonStack  
**Apply to:** `WinLinesOverlay.ts`  
Multi-layer Graphics (glow/halo/core); clear + redraw on win cycle.

### Router loud fail on mount error
**Source:** `src/shell/router.ts` lines 84-90  
**Apply to:** Zod parse failures in mount  
Throw from `loadHotlineConfig` / session; no soft error panel (D-03).

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/games/hotline/config/HotlineConfigSchema.ts` | model | transform | No Zod usage in repo yet — use RESEARCH Zod envelope |
| `src/games/hotline/config/loadHotlineConfig.ts` | service | request-response | No JSON+Zod load seam; Crash uses TS const config |
| `src/games/hotline/logic/evaluatePaylines.ts` | utility | transform | No slot payline evaluator; Crash is multiplier crash game |
| `src/games/hotline/view/reels/*` (full strip+mask engine) | component | streaming | No reel strips; only partial analogs (ticker + smoothstep) |

## Metadata

**Analog search scope:** `src/games/crash/**`, `src/shell/**`, `src/shared/**`, `src/styles/hud.css`, `index.html`, `tests/**`, `public/assets/**`  
**Files scanned:** ~76 under `src/` + shell/layout/architecture tests  
**Tracked-source gate:** all cited analogs verified via `git ls-files` (non-empty)  
**Pattern extraction date:** 2026-10-09
