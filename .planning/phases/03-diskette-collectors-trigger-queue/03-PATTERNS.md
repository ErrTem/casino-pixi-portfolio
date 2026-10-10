# Phase 3: Diskette Collectors + Trigger Queue - Pattern Map

**Mapped:** 2026-10-10
**Files analyzed:** 27
**Analogs found:** 26 / 27

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/games/hotline/config/HotlineConfigSchema.ts` | model | transform | `src/games/hotline/config/HotlineConfigSchema.ts` (`tokenOddsSchema`) | exact |
| `src/games/hotline/config/hotline.config.json` | config | file-I/O | same file `features.tokenOdds` | exact |
| `src/games/hotline/config/HotlineConfigSchema.test.ts` | test | batch | same file fixture + ZodError cases | exact |
| `src/games/hotline/logic/collectors/TokenColors.ts` | model | transform | `src/games/hotline/view/loadHotlineAssets.ts` (`PHONE_URLS` keys) | role-match |
| `src/games/hotline/logic/collectors/resolveCollectors.ts` | utility | transform | `src/games/hotline/logic/evaluatePaylines.ts` | exact |
| `src/games/hotline/logic/collectors/PhoneMeters.ts` | service | CRUD | `src/games/hotline/logic/Wallet.ts` | role-match |
| `src/games/hotline/logic/collectors/ComboQueue.ts` | utility | transform | `src/games/crash/hud/historyStrip.ts` (`orderNewestFirst` filter style) | partial |
| `src/games/hotline/logic/collectors/*.test.ts` | test | batch | `src/games/hotline/logic/evaluatePaylines.test.ts` | exact |
| `src/games/hotline/logic/HotlineGame.ts` | service | event-driven | `src/games/hotline/logic/HotlineGame.ts` + `SpinEngine.ts` / `createRng` | exact |
| `src/games/hotline/logic/HotlineGame.test.ts` | test | batch | same file (replace feature-isolation block) | exact |
| `src/games/hotline/logic/index.ts` | utility | transform | same file barrel exports | exact |
| `src/games/hotline/view/winCycle.ts` | utility | transform | `src/games/hotline/view/winCycle.ts` + `lastWinTween.ts` (`isDone`) | exact |
| `src/games/hotline/view/winCycle.test.ts` | test | batch | same file (add one-pass / done cases) | exact |
| `src/games/hotline/view/WinLinesOverlay.ts` | component | event-driven | same file (consume finite cycle API) | exact |
| `src/games/hotline/view/PhonesLayer.ts` | component | request-response | same file + `WinLinesOverlay.ts` Graphics bars | exact |
| `src/games/hotline/view/TokenFlight.ts` | component | streaming | `WinLinesOverlay.ts` + `reelMotion.ts` (`smoothstep`) | role-match |
| `src/games/hotline/view/HotlineScene.ts` | component | event-driven | same file (`geometry`, phones, overlay stack) | exact |
| `src/games/hotline/view/loadHotlineAssets.ts` | utility | file-I/O | same file (`PHONE_URLS` / `required`) | exact |
| `src/games/hotline/hud/HotlineHud.ts` | component | event-driven | same file + `CrashHud.ts` (`primary.disabled`) | exact |
| `src/games/hotline/hud/HotlineHud.test.ts` | test | batch | same file FakeEl binder | exact |
| `src/games/hotline/session/mountHotlineSession.ts` | controller | event-driven | same file (settleArmed → busy FSM) | exact |
| `src/shared/audio/AudioPort.ts` | model | pub-sub | same file `SfxEvent` union | exact |
| `src/shared/audio/createBeepAudioPort.ts` | service | event-driven | same file `PITCH_HZ` | exact |
| `src/shared/audio/createBeepAudioPort.test.ts` | test | batch | same file `ALL_EVENTS` | exact |
| `index.html` (`#hotline-screen-template`) | config | request-response | same template + Crash `[data-field=history]` | exact |
| `src/styles/hud.css` | config | request-response | `.history-strip` / `.hotline-screen` | role-match |
| `public/assets/hotline/diskette-{green,red,purple}.png` | config | file-I/O | `public/assets/hotline/phone-*.png` (loose PNG pack) | role-match |

## Pattern Assignments

### `src/games/hotline/config/HotlineConfigSchema.ts` (model, transform)

**Analog:** same file — extend `tokenOddsSchema` (lines 45-53)

**Imports pattern** (lines 1-6):
```typescript
import { z } from "zod";

const positiveInt = z.number().int().positive();
```

**Core validation pattern** (lines 45-53) — rename colors + add `triggerChance`:
```typescript
// token meters, one chance per spin for each colored diskette
const tokenOddsSchema = z.object({
  meterTarget: positiveInt,
  perSpinChance: z.object({
    pink: z.number().min(0).max(1),
    cyan: z.number().min(0).max(1),
    yellow: z.number().min(0).max(1),
  }),
});
```

**Target shape** (from RESEARCH — keep `.min(0).max(1)`):
```typescript
const chance01 = z.number().min(0).max(1);
const tokenOddsSchema = z.object({
  meterTarget: positiveInt,
  perSpinChance: z.object({ green: chance01, red: chance01, purple: chance01 }),
  triggerChance: z.object({ green: chance01, red: chance01, purple: chance01 }),
});
```

**Error handling:** Zod throws at `loadHotlineConfig()` / `HotlineConfigSchema.parse` — session mount already fails loud (no soft DOM panel).

**Migrate together:** `hotline.config.json` lines 72-74 + any test fixtures with `pink|cyan|yellow`.

---

### `src/games/hotline/config/hotline.config.json` (config, file-I/O)

**Analog:** same file `features.tokenOdds` (lines 72-74)

```json
"tokenOdds": {
  "meterTarget": 6,
  "perSpinChance": { "pink": 0.06, "cyan": 0.05, "yellow": 0.04 }
}
```

**Planner:** replace keys with green/red/purple; add illustrative `triggerChance` (discretion ~0.08–0.12). Keep `meterTarget: 6`.

---

### `src/games/hotline/config/HotlineConfigSchema.test.ts` (test, batch)

**Analog:** same file (lines 11-27, 53-57)

**Core pattern:**
```typescript
it("exposes the feature tables", () => {
  const cfg = HotlineConfigSchema.parse(fixture());
  expect(cfg.features).toHaveProperty("tokenOdds");
  // ...
});
```

**Add cases:** parse rejects missing `triggerChance`; rejects chance outside `[0,1]`; bundled fixture uses green/red/purple only.

---

### `src/games/hotline/logic/collectors/TokenColors.ts` (model, transform)

**Analog:** `src/games/hotline/view/loadHotlineAssets.ts` phone key order (lines 11-15)

```typescript
export const PHONE_URLS = {
  green: `${BASE}/phone-green.png`,
  red: `${BASE}/phone-red.png`,
  purple: `${BASE}/phone-purple.png`,
} as const;
```

**Core pattern to copy:** fixed L→R order `green | red | purple` as a shared const tuple used by resolve, queue sort, phones, assets, and DOM strip labels.

---

### `src/games/hotline/logic/collectors/resolveCollectors.ts` (utility, transform)

**Analog:** `src/games/hotline/logic/evaluatePaylines.ts` — pure args-in / result-out, no Pixi

**Imports / types pattern** (lines 1-24):
```typescript
export interface EvaluateArgs {
  grid: string[][];
  paylines: number[][];
  paytable: Record<string, PayRow>;
  wildId: string;
  betCents: Cents;
}
```

**RNG pattern** — `src/shared/rng/createRng.ts` (lines 4-11) + **separate stream** from `SpinEngine` (`src/games/hotline/logic/SpinEngine.ts` lines 9-17):
```typescript
export function createRng(seed: string): Rng {
  const prng = seedrandom(seed);
  return { next: () => prng() };
}
// SpinEngine keeps createRng(seed) for strips only
// collectors: createRng(`${seed}:collectors`)
```

**Core resolve pattern** (RESEARCH skeleton — planner implements):
- Independent `perSpinChance` roll per color in fixed green→red→purple order
- Distinct cell pick among 20 (`reel * rows + row` set)
- `triggers = rng.next() < triggerChance[color]` pre-rolled for land
- Queue = `colors.filter(c => fired.has(c))` (D-11), not land-completion order

**Testing analog:** `evaluatePaylines.test.ts` — Vitest node, deterministic inputs, no canvas.

---

### `src/games/hotline/logic/collectors/PhoneMeters.ts` (service, CRUD)

**Analog:** `src/games/hotline/logic/Wallet.ts` (lines 5-42) — small mutable session state with factory

```typescript
export class Wallet {
  private balanceCents: Cents;
  // ...
  credit(amountCents: Cents): void {
    if (!Number.isFinite(amountCents) || amountCents <= 0) return;
    this.balanceCents += Math.floor(amountCents);
  }
  reset(): void {
    this.balanceCents = this.startingBalanceCents;
  }
}
```

**HOTLINE deltas for meters:**
- Three counters keyed by `TokenColor`
- Soft-cap display = `min(count, meterTarget)` — counts may exceed target (D-06)
- `reset(color)` one phone only (D-07 / D-12) — do not reset all
- No trigger-odds coupling

---

### `src/games/hotline/logic/collectors/ComboQueue.ts` (utility, transform)

**Analog (partial):** `src/games/crash/hud/historyStrip.ts` (lines 1-3) — pure order helper

```typescript
export function orderNewestFirst(history: readonly number[]): number[] {
  return [...history].reverse();
}
```

**Core pattern:** fixed order filter over a Set of fired colors; `pop()` / `peek()` for stub drain. No DOM/Pixi. Phase 4 hangs real bonuses off the same queue API.

---

### `src/games/hotline/logic/HotlineGame.ts` (service, event-driven)

**Analog:** same file (lines 44-96) — extend settlement; stop ignoring features

**Imports pattern** (lines 1-5):
```typescript
import type { HotlineConfig } from "../config/HotlineConfigSchema.js";
import { evaluatePaylines, type LineWin } from "./evaluatePaylines.js";
import { createSpinEngine } from "./SpinEngine.js";
import { createWallet } from "./Wallet.js";
```

**Core spin pattern** (lines 59-76) — after paylines/credit, attach collector outcome:
```typescript
spin(): SpinResult {
  const betCents = steps[betStepIndex];
  const placed = wallet.placeBet(betCents);
  if (!placed.ok) return placed;

  grid = engine.spin();
  lineWins = evaluatePaylines({ /* math + paytable */ });
  lastWinCents = lineWins.reduce((sum, w) => sum + w.payoutCents, 0);
  wallet.credit(lastWinCents);
  phase = "settled";
  return { ok: true };
}
```

**Snapshot pattern** (lines 9-18, 84-95): extend `HotlineSnapshot` with `collectorOutcome` / meter fills for view+HUD (or return outcome only from `spin` and keep meters via getters — prefer structured outcome on snapshot for sync).

**Critical delta:** remove comment “feature tables belong to phase 3”; create collector RNG with suffix seed; mutate meters on spawn lands in logic book (view plays presentation only).

---

### `src/games/hotline/logic/HotlineGame.test.ts` (test, batch)

**Analog:** same file feature-isolation block (lines 163-198) — **replace**, do not keep

```typescript
describe("feature tables stay out of base settlement", () => {
  it("no logic source touches config.features or its tables", () => {
    // DELETE once HotlineGame reads tokenOdds
  });
  it("spin outcome does not change when feature tables change", () => {
    // pink/cyan/yellow fixtures — migrate colors
    // assert GRID equality under feature-table changes, not full snapshot
  });
});
```

**Replacement pattern:** seed parity for `grid` when `triggerChance` / `perSpinChance` change; unit tests for meters + queue on forced odds (`perSpinChance: 1`, `triggerChance: 1` / `0`).

---

### `src/games/hotline/logic/index.ts` (utility, transform)

**Analog:** same file (lines 1-15) — re-export collector types used by session/view

```typescript
export {
  createHotlineGame,
  type HotlineGame,
  type HotlineSnapshot,
  type SpinResult,
} from "./HotlineGame.js";
```

---

### `src/games/hotline/view/winCycle.ts` (utility, transform)

**Analog:** same file (lines 10-37) + done API from `lastWinTween.ts` (lines 42-45)

**Current infinite wrap** (lines 28-35) — must change for D-13:
```typescript
advance(deltaMS: number): boolean {
  if (count <= 1 || !Number.isFinite(deltaMS) || deltaMS <= 0) return false;
  elapsed += deltaMS;
  if (elapsed < interval) return false;
  elapsed = 0;
  index = (index + 1) % count; // infinite — blocks tokens forever
  return true;
}
```

**Done pattern to copy** (`lastWinTween.ts`):
```typescript
isDone(nowMs: number): boolean {
  return progress(nowMs) >= 1;
}
```

**Recommendation (RESEARCH A2):** one full pass of each line then `isDone() === true` (no wrap); `WinLinesOverlay` clears when done; session advances to tokens.

**Update `winCycle.test.ts`:** replace “wraps back to the first line” (lines 15-22) with one-pass / done assertions.

---

### `src/games/hotline/view/WinLinesOverlay.ts` (component, event-driven)

**Analog:** same file — Graphics neon + cycle tick (lines 36-147)

**Core tick pattern** (lines 141-147):
```typescript
tick(deltaMS: number): void {
  if (destroyed || !container.visible) return;
  if (cycle.advance(deltaMS)) draw();
  // ...
}
```

**Delta:** expose `isDone()` / call `clear()` when finite cycle completes so `HotlineScene` / session can gate collectors (D-13). Keep `CYCLE_MS = 1100`.

---

### `src/games/hotline/view/PhonesLayer.ts` (component, request-response)

**Analog:** same file (lines 11-48) + bar Graphics from `WinLinesOverlay.ts` (lines 100-109)

**Layer factory pattern:**
```typescript
export function createPhonesLayer(textures: HotlineTextures): PhonesLayer {
  const container = new Container();
  const sprites = [textures.phones.green, textures.phones.red, textures.phones.purple]
    .map((texture) => { /* Sprite, anchor 0.5 */ });
  // layout spreads across band
}
```

**Graphics bar pattern** (`WinLinesOverlay` framed cells / RESEARCH bars):
```typescript
frames
  .roundRect(/* ... */)
  .stroke({ width: 3, color: NEON, alpha: 0.55 });
// meters: bars.clear(); rect + fill alpha on/off per segment
```

**API to add:** `phoneCenters(): {x,y}[]` (scene-local), `setMeters(fills: number[])`, `setGlow(color | null)`, keep destroy guard.

---

### `src/games/hotline/view/TokenFlight.ts` (component, streaming)

**Analog:** `WinLinesOverlay.ts` (Container + Graphics + tick) + `reelMotion.ts` `smoothstep` (lines 12-17)

**Easing pattern:**
```typescript
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const span = edge1 - edge0;
  if (!(span > 0) || !Number.isFinite(x)) return x >= edge1 ? 1 : 0;
  const t = Math.min(1, Math.max(0, (x - edge0) / span));
  return t * t * (3 - 2 * t);
}
```

**Overlay factory pattern** (copy WinLinesOverlay structure):
- `container` with diskette `Sprite`s + optional neon trail `Graphics`
- `start(spawns, cellCenters, phoneCenters)` — parallel arcs (D-04)
- `tick(deltaMS)` — `t = smoothstep(0, 1, elapsed / ARC_MS)`; quadratic bezier hop
- `onLand` / `isDone` callbacks for session SFX + meter bump
- `destroy` with `destroyed` guard like PhonesLayer (lines 41-46)

**Coordinate pattern:** use scene-local centers from `HotlineScene.geometry()` (lines 148-164) — avoid per-frame nested `toGlobal`.

---

### `src/games/hotline/view/HotlineScene.ts` (component, event-driven)

**Analog:** same file

**Child stack pattern** (lines 67-87):
```typescript
const phones = createPhonesLayer(textures);
const overlay = createWinLinesOverlay();
root.addChild(
  backdrop, title, phones.container, screen,
  reelWindow.container, frame, overlay.container,
);
// TokenFlight container: above reels / near overlay so arcs read over CRT
```

**Geometry pattern** (lines 148-164) — reuse for overlay spawn cells:
```typescript
function geometry(): WinGeometry {
  const centers = Array.from({ length: reels }, (_, reel) =>
    Array.from({ length: rows }, (_, row) => ({
      x: gridLeft + reel * cellSize + cellSize / 2,
      y: gridTop + row * cellSize + cellSize / 2,
    })),
  );
  return { centers, cellSize, gap: CELL_GAP, callout: { /* ... */ } };
}
```

**Sync pattern** (lines 176-201): after reels stop, finite win present, then expose hook/API for collectors (or let session drive `startCollectors` / `tickCollectors`). Extend `destroy` to tear down TokenFlight + phones.

---

### `src/games/hotline/view/loadHotlineAssets.ts` (utility, file-I/O)

**Analog:** same file (lines 11-59, 61-102)

**URL table pattern:**
```typescript
export const PHONE_URLS = { green: `...`, red: `...`, purple: `...` } as const;
export const HOTLINE_ASSET_URLS: readonly string[] = [
  BACKDROP_URL, FRAME_URL,
  PHONE_URLS.green, PHONE_URLS.red, PHONE_URLS.purple,
  ...Object.values(SYMBOL_URLS),
];
```

**Required texture guard** (lines 50-58):
```typescript
function required(loaded: Record<string, unknown>, url: string): Texture {
  const tex = loaded[url];
  if (!(tex instanceof Texture) || tex === Texture.EMPTY || tex.width <= 1) {
    throw new Error(`hotline assets: missing or empty texture ${url}`);
  }
  return tex;
}
```

**Delta:** add `DISKETTE_URLS` + include in `HOTLINE_ASSET_URLS` + return `diskettes: { green, red, purple }` on `HotlineTextures`. **Art checkpoint first** — mount throws if PNGs missing (same as symbols).

---

### `src/games/hotline/hud/HotlineHud.ts` (component, event-driven)

**Analog:** same file (lines 29-143) + Crash primary disable (`CrashHud.ts` lines 527-529)

**Binder pattern** — `need()` + `textContent` only (XSS-safe for combo strip):
```typescript
function need<T extends Element>(root: Element, selector: string): T {
  const el = root.querySelector<T>(selector);
  if (!el) throw new Error(`hotline hud: ${selector} missing`);
  return el;
}
```

**Disable pattern to copy** (CrashHud):
```typescript
panel.primary.disabled = !chrome.enabled;
```

**HOTLINE deltas (D-10, D-14):**
- Add `[data-field=combo]` (or similar) — `textContent = "COMBO: Green → Red"`
- `setBusy(busy: boolean)` → `spinBtn.disabled = busy` (and optionally bet ±)
- Keep Spin unlock + `game.spin()` in click handler; session soft-ignore alone is not enough

**Test analog:** `HotlineHud.test.ts` FakeEl (lines 9-39) — extend `makeRoot` with combo field + assert `spinBtn.disabled`.

---

### `src/games/hotline/session/mountHotlineSession.ts` (controller, event-driven)

**Analog:** same file — presentation owner after math settles

**Spin wire pattern** (lines 44-55):
```typescript
spin(): SpinResult {
  if (view?.scene.isSpinning()) return { ok: false, reason: "" };
  const result = game.spin();
  if (result.ok && view) {
    ctx.audio.unlock();
    ctx.audio.play("spin");
    settleArmed = true;
    view.scene.startSpin(game.getSnapshot().grid);
  }
  return result;
}
```

**Ticker pattern** (lines 138-143):
```typescript
onTick = (ticker: Ticker): void => {
  view!.scene.sync(game.getSnapshot(), ticker.deltaMS);
  if (settleArmed && !view!.scene.isSpinning()) onSettled(game.getSnapshot());
  hud.render(hudGame.getSnapshot());
};
```

**Dispose pattern** (lines 105-124) — copy exactly; never destroy shell app/audio.

**Phase 3 FSM delta (D-13/D-14/D-16):**
1. `busy = true` on successful spin → HUD disable Spin
2. reels stop → if wins: wait finite win cycle / `isDone` → else immediately
3. play TokenFlight (parallel) → SFX `token_spawn` / `token_land`
4. if queue: DOM strip + phone glow beats → SFX `phone_trigger` / `queue_step` → pop + meter reset
5. `busy = false` → idle

Expand `onSettled` beyond win beep — do not re-enable Spin until collectors/stub finish.

---

### `src/shared/audio/AudioPort.ts` + `createBeepAudioPort.ts` (model/service)

**Analog:** `AudioPort.ts` (lines 1-9) + `createBeepAudioPort.ts` `PITCH_HZ` (lines 38-46)

```typescript
export type SfxEvent =
  | "bet_lock" | "takeoff" | "cash_out" | "crash"
  | "spin" | "reel_stop" | "win";
```

```typescript
const PITCH_HZ: Record<SfxEvent, number> = {
  bet_lock: 440, takeoff: 660, cash_out: 880, crash: 160,
  spin: 330, reel_stop: 520, win: 990,
};
```

**Widen (D-16):** add `token_spawn` | `token_land` | `phone_trigger` | `queue_step` to union + `PITCH_HZ` (distinct Hz). Update `createBeepAudioPort.test.ts` `ALL_EVENTS` (lines 11-19).

---

### `index.html` + `src/styles/hud.css` (config)

**Analog:** `#hotline-screen-template` footer fields (index.html ~290-355) + Crash history strip CSS

**DOM field pattern:**
```html
<span data-field="status" class="hud-status" aria-live="polite"></span>
```

**Add:** combo strip host outside `#game-canvas-host` (e.g. above footer controls or under top chrome) with `data-field="combo"` and `aria-live="polite"`.

**CSS analog:** `.history-strip` (hud.css ~592-603) for horizontal strip; scope under `.hotline-screen` (~943-951). Prefer `textContent` labels, not pill clusters of cards.

---

### `public/assets/hotline/diskette-*.png` (config, file-I/O)

**Analog:** existing phone pack under `public/assets/hotline/` via `PHONE_URLS`

**Pipeline:** asset-list checkpoint (D-15) → user generates → place `diskette-green.png`, `diskette-red.png`, `diskette-purple.png` → `loadHotlineAssets` requires them. Suggested 128×128 (RESEARCH A4). No meter PNGs (D-08).

---

## Shared Patterns

### Logic resolves, view plays the book
**Source:** `HotlineGame.ts` spin settlement + `mountHotlineSession.ts` reel playback  
**Apply to:** `resolveCollectors`, `TokenFlight`, combo stub  
- RNG and meters live in logic; view never rolls chances  
- Session owns presentation FSM + SFX edges  

### Separate collector RNG stream
**Source:** `SpinEngine.ts` lines 9-17 + `createRng.ts`  
**Apply to:** `HotlineGame` / `resolveCollectors`  
```typescript
createRng(seed)              // strips only — do not share with features
createRng(`${seed}:collectors`) // spawn, cell pick, triggerChance
```

### Zod config boundary
**Source:** `HotlineConfigSchema.ts` + `loadHotlineConfig` at session mount  
**Apply to:** color rename + `triggerChance`  
- Fail loud on bad chances; migrate schema/JSON/tests in one wave  

### Ticker motion (no GSAP)
**Source:** `reelMotion.ts` `smoothstep`; `WinLinesOverlay.tick`; session `ticker.deltaMS`  
**Apply to:** TokenFlight arcs, stub beat timers, finite win gate  

### Procedural Pixi Graphics
**Source:** `WinLinesOverlay.ts` neon stroke / fill  
**Apply to:** phone signal bars, optional flight trail, phone glow  

### DOM HUD outside canvas
**Source:** `HotlineHud.ts` `textContent` binders; Crash `primary.disabled`  
**Apply to:** combo strip + Spin busy lock (D-10/D-14)  

### AudioPort beep widen
**Source:** `AudioPort.ts` + `createBeepAudioPort.ts` + `ALL_EVENTS` test  
**Apply to:** collector SFX (D-16); unlock still on Spin gesture  

### Asset load fail-loud
**Source:** `loadHotlineAssets.ts` `required()`  
**Apply to:** diskette textures after art handoff  

### Dispose / abort
**Source:** `mountHotlineSession.ts` dispose (lines 105-124)  
**Apply to:** any new ticker listeners / flight state — abort once, do not destroy shell app  

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| — | — | — | All Phase 3 files have at least a role-match analog in HOTLINE/Crash/shared. Closest “thin” match: `ComboQueue.ts` (partial — implement as small pure filter/pop helper; RESEARCH skeleton is authoritative). |

## Metadata

**Analog search scope:** `src/games/hotline/**`, `src/games/crash/**`, `src/shared/audio/**`, `src/shared/rng/**`, `index.html`, `src/styles/hud.css`, Phase 02 `02-PATTERNS.md`  
**Files scanned:** ~55 tracked sources in scope  
**Tracked-source gate:** all named analogs verified via `git ls-files`  
**Pattern extraction date:** 2026-10-10
