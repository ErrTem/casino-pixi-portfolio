# Phase 4: Three Bonuses + Combo Nights - Pattern Map

**Mapped:** 2026-10-11
**Files analyzed:** 27 (13 new, 14 modified)
**Analogs found:** 25 / 27 (2 partial: DOM overlay, scene hold mode have only role-level matches)

All analog paths were checked with `git ls-files` and are tracked source. Line numbers refer to files as read this session.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/games/hotline/config/HotlineConfigSchema.ts` (mod) | config | transform (parse) | itself (`tokenOddsSchema`, `featuresSchema`) | exact |
| `src/games/hotline/config/hotline.config.json` (mod) | config | static data | itself (`features` block, lines 71-83) | exact |
| `src/games/hotline/config/HotlineConfigSchema.test.ts` (mod) | test | transform | itself (`fixture()` clone + `toThrow(ZodError)`) | exact |
| `src/games/hotline/logic/features/prizeTable.ts` (new) | utility | transform (weighted draw) | `SpinEngine.pick` (SpinEngine.ts 32-41) | exact |
| `src/games/hotline/logic/features/freeSpins.ts` (new) | service | transform | `SpinEngine.ts` + `resolveCollectors.ts` | role-match |
| `src/games/hotline/logic/features/holdAndWin.ts` (new) | service | event-driven stepper | `resolveCollectors.ts` (per-cell roll, rng arg) | role-match |
| `src/games/hotline/logic/features/pickEm.ts` (new) | service | request-response | `PhoneMeters.ts` (closure factory) + `resolveCollectors.ts` | role-match |
| `src/games/hotline/logic/features/*.test.ts` (new) | test | transform | `resolveCollectors.test.ts`, `ComboQueue.test.ts` | exact |
| `src/games/hotline/logic/night/createNight.ts` (new) | service (state machine) | event-driven | `ComboQueue.ts` (closure factory with queue) | role-match |
| `src/games/hotline/logic/night/createNight.test.ts` (new) | test | event-driven | `ComboQueue.test.ts` | exact |
| `src/games/hotline/logic/HotlineGame.ts` (mod) | service | request-response + CRUD (wallet) | itself | exact |
| `src/games/hotline/logic/HotlineGame.test.ts` (mod) | test | request-response | itself (stream parity test lines 196-218) | exact |
| `src/games/hotline/logic/index.ts` (mod) | utility (barrel) | n/a | itself | exact |
| `src/games/hotline/hud/comboStripModel.ts` (new) | utility | transform | `session/collectPresentation.ts` (`formatComboStrip`) | exact |
| `src/games/hotline/hud/comboStripModel.test.ts` (new) | test | transform | `session/collectPresentation.test.ts` | exact |
| `src/games/hotline/hud/HotlineHud.ts` (mod) | component (DOM binder) | request-response | itself | exact |
| `src/games/hotline/hud/HotlineHud.test.ts` (mod) | test | request-response | itself (`FakeEl`, `makeRoot`) | exact |
| `src/games/hotline/hud/FeatureOverlay.ts` (new) | component (DOM) | event-driven | `HotlineHud.ts` (`need()`, listener add/remove, `dispose`) | role-match (partial) |
| `src/games/hotline/view/HoldLayer.ts` (new) | component (Pixi) | streaming (ticker) | `WinLinesOverlay.ts` (Graphics + Text + geometry) | role-match |
| `src/games/hotline/view/JackpotStrip.ts` (new) | component (Pixi) | transform (layout) | `PhonesLayer.ts` (`layout(left, top, w, h)`) | exact |
| `src/games/hotline/view/HotlineScene.ts` (mod) | component (Pixi) | streaming | itself | exact |
| `src/games/hotline/view/WinLinesOverlay.ts` (mod) | component (Pixi) | streaming | itself (`CYCLE_MS` const) | exact |
| `src/games/hotline/session/mountHotlineSession.ts` (mod) | controller (session FSM) | event-driven | itself (`present` phases, stub drain) | exact |
| `src/games/hotline/session/nightPresenter.ts` (new, optional) | controller | event-driven | `mountHotlineSession.ts` `tickPresent` | role-match |
| `src/games/hotline/session/collectPresentation.test.ts` (mod) | test (source grep) | file-I/O | itself (lines 60-84) | exact |
| `src/shared/audio/AudioPort.ts` + `createBeepAudioPort.ts` + `.test.ts` (mod) | config / utility | event-driven | themselves (`COLLECTOR_EVENTS` pattern) | exact |
| `index.html` (hotline template) + `src/styles/hud.css` (mod) | config / markup | n/a | `.hotline-combo` block, template lines 290-362 | exact |

## Pattern Assignments

### `src/games/hotline/config/HotlineConfigSchema.ts` (config, transform)

**Analog:** itself. Extend `featuresSchema`; every nested bag is a `z.object` so bad input fails as `ZodError`.

**Reusable helpers already in file** (lines 5-9, 46-58):
```typescript
const positiveInt = z.number().int().positive();
const chance01 = z.number().min(0).max(1);
const colorChances = z.object({
  green: chance01,
  red: chance01,
  purple: chance01,
});
```

**Current prize and features schema to extend** (lines 60-76):
```typescript
const bonusPrizeSchema = z.object({
  bonusId: z.string().min(1),
  prizeMultipliers: z.array(z.number().positive()).min(1),
});

const jackpotMultipliersSchema = z.object({
  mini: z.number().positive(),
  minor: z.number().positive(),
  major: z.number().positive(),
  grand: z.number().positive(),
});

// features are validated now and only read by the runtime in later phases
const featuresSchema = z.object({
  tokenOdds: tokenOddsSchema,
  bonusPrizes: z.array(bonusPrizeSchema).min(1),
  jackpotMultipliers: jackpotMultipliersSchema,
});
```

**Cross-field validation pattern** (lines 18-43, `mathSchema.superRefine`; and 85-99 top-level): use `.superRefine((v, ctx) => ctx.addIssue({ code: "custom", message, path }))` for rules like `prizeWeights.length === prizeMultipliers.length` and "freeSpins.wildWeights has 4 entries". Research Code Examples already give the exact new schema bodies (`freeSpinsSchema`, `holdAndWinSchema`, `pickEmSchema`). Update the stale comment on line 72 ("only read by the runtime in later phases") when touching this.

**Rules:** keep config keys `mini/minor/major/grand` (display labels MIN/MID/MAX/ULTRA mapped in view only). New keys required means `hotline.config.json` and schema change in one task, then `npx vitest run src/games/hotline/config`.

---

### `src/games/hotline/config/hotline.config.json` (config, static)

**Analog:** itself, `features` block (lines 71-83):
```json
"features": {
  "tokenOdds": {
    "meterTarget": 6,
    "perSpinChance": { "green": 0.06, "red": 0.05, "purple": 0.04 },
    "triggerChance": { "green": 0.12, "red": 0.10, "purple": 0.08 }
  },
  "bonusPrizes": [
    { "bonusId": "pickEm", "prizeMultipliers": [2, 3, 5, 10, 25] },
    { "bonusId": "holdAndWin", "prizeMultipliers": [1, 2, 5, 10, 20, 50] },
    { "bonusId": "freeSpins", "prizeMultipliers": [5, 8, 10, 15] }
  ],
  "jackpotMultipliers": { "mini": 20, "minor": 50, "major": 200, "grand": 1000 }
}
```
Add sibling keys `freeSpins`, `holdAndWin`, `pickEm` inside `features` (values from RESEARCH Sample JSON), plus optional `prizeWeights` per bonus. Two-space indent, inline small objects like above.

---

### `src/games/hotline/logic/features/prizeTable.ts` (utility, transform)

**Analog:** `src/games/hotline/logic/SpinEngine.ts`, `pick` (lines 32-41). Copy the weighted roll, but take an `Rng` argument instead of owning one.
```typescript
private pick(weights: Record<string, number>): string {
  const entries = Object.entries(weights);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let roll = this.rng.next() * total;
  for (const [id, w] of entries) {
    roll -= w;
    if (roll < 0) return id;
  }
  return entries[entries.length - 1][0];
}
```
**Imports pattern** (from `resolveCollectors.ts` lines 1-3; note `.js` suffix on all relative imports, `type` imports separate):
```typescript
import type { Rng } from "../../../../shared/rng/createRng.js";
import type { HotlineConfig } from "../../config/HotlineConfigSchema.js";
```
Note depth: files under `logic/features/` use `../../../../shared/...` (same as `logic/collectors/`). Missing `prizeWeights` should fall back to equal weights. Always return the last entry as a float-safety fallback, as above.

---

### `src/games/hotline/logic/features/freeSpins.ts` (service, transform)

**Analog:** `SpinEngine.ts` for engine inputs, `resolveCollectors.ts` for rng arg style. Build boosted math with the `SpinEngineMath` shape.

**Engine math shape** (SpinEngine.ts 3-7):
```typescript
export interface SpinEngineMath {
  rows: number;
  reels: number;
  symbolWeights: Record<string, number>[];
}
```
Copy RESEARCH `boostedFreeSpinMath` (reel index 0 unchanged, reels 1..4 replace the `wildSymbolId` weight). Retrigger path: reuse `resolveCollectors` with spread-overridden odds, do not fork it:
```typescript
tokenOdds: { ...config.features.tokenOdds, triggerChance: { ...config.features.tokenOdds.triggerChance, green: features.freeSpins.retriggerChance } }
```
Enforce `maxRetriggers` here (Pitfall 7). Pure module: no `document.` / `window.` and no `pixi.js` import (scanned by `tests/architecture.no-pixi.test.ts`, which also scans `src/shared`).

---

### `src/games/hotline/logic/features/holdAndWin.ts` (service, event-driven stepper)

**Analog:** `resolveCollectors.ts` (per-cell loop, rng injected, distinct-cell pick, 20-cell index math `reel * rows + row`).

**Cell pick pattern to copy for `startCells` seeding** (lines 22-39):
```typescript
function pickFreeCell(rng, reels, rows, used: Set<number>) {
  const free: number[] = [];
  const total = reels * rows;
  for (let i = 0; i < total; i++) {
    if (!used.has(i)) free.push(i);
  }
  if (free.length === 0) return null;
  const pick = free[Math.floor(rng.next() * free.length)];
  return { reel: Math.floor(pick / rows), row: pick % rows };
}
```
**Factory shape:** `export function createHoldAndWin(args: { rng: Rng; ... }): HoldAndWin` returning an object of methods over closure state (see `createPhoneMeters` below). Money: `payoutCents(betCents, toMultHundredths(mult))` from `src/shared/money/cents.ts` (lines 7-9, 24-26), never float multiplication.

---

### `src/games/hotline/logic/features/pickEm.ts` (service, request-response)

**Analog:** `PhoneMeters.ts` closure factory (lines 11-43). Closure state, methods in the returned literal, no classes.
```typescript
export function createPhoneMeters(meterTarget: number): PhoneMeters {
  const counts: Record<TokenColor, number> = { green: 0, red: 0, purple: 0 };
  return {
    increment(color) { counts[color] += 1; },
    getCount(color) { return counts[color]; },
    reset(color) { counts[color] = 0; },
    snapshot() { /* build record from TOKEN_COLOR_ORDER */ },
  };
}
```
Export an interface above the factory (`PhoneMeters`) and a `createX` function. `pick(index)` ignores invalid/repeated/post-done indexes (copy the defensive style of `setBetStepIndex`: `if (!Number.isFinite(index)) return;`, HotlineGame.ts 114-117).

---

### `src/games/hotline/logic/night/createNight.ts` (service, state machine)

**Analog:** `src/games/hotline/logic/collectors/ComboQueue.ts` (whole file, 34 lines). Same closure factory with an interface export; ordering must go through `orderComboQueue`.
```typescript
export function orderComboQueue(fired: Iterable<TokenColor>): TokenColor[] {
  const set = new Set(fired);
  return TOKEN_COLOR_ORDER.filter((c) => set.has(c));
}

export function createComboQueue(initial: Iterable<TokenColor> = []): ComboQueue {
  let items: TokenColor[] = orderComboQueue(initial);
  return {
    peek() { return items[0]; },
    pop() { return items.shift(); },
    list() { return items.slice(); },
    set(colors) { items = orderComboQueue(colors); },
  };
}
```
Use `createComboQueue` for the base queue and call `orderComboQueue` when appending nested entries. `next()` rule order and `NightStep` union come from RESEARCH Pattern 1 and "Night machine nesting rule". `TOKEN_COLOR_ORDER` / `TokenColor` import from `../collectors/TokenColors.js`.

---

### Logic tests (`features/*.test.ts`, `night/createNight.test.ts`) (test)

**Analog:** `resolveCollectors.test.ts` and `ComboQueue.test.ts`.

**Imports + rng style** (resolveCollectors.test.ts 1-4, 19-28):
```typescript
import { describe, expect, it } from "vitest";
import { createRng } from "../../../../shared/rng/createRng.js";
...
const out = resolveCollectors({ rng: createRng("collectors-all"), tokenOdds: oddsAll, reels: 5, rows: 4 });
```
Pattern: top-level odds fixtures (`oddsAll`, `oddsNoTrigger`) spread-overridden per case; deterministic seeds named for the case; `chance = 0` and `chance = 1` extremes to prove bounds (Hold termination, retrigger cap). Queue tests use `expect([q.pop(), q.pop(), q.pop()]).toEqual([...])` drain style (ComboQueue.test.ts 29-31). Config-dependent tests use `loadHotlineConfig()` (HotlineGame.test.ts lines 1-8).

---

### `src/games/hotline/logic/HotlineGame.ts` (service, request-response + wallet CRUD)

**Analog:** itself. Add `spinFree()`, feature rng streams, bet capture, credit helpers.

**Stream isolation pattern** (lines 62-70): every extra stream is its own `createRng` keyed by suffix; never draw from `engine` or `collectorsRng` inside a feature.
```typescript
const engine = createSpinEngine(options.seed, math);
const collectorsRng = createRng(`${options.seed}:collectors`);
const wallet = createWallet(math.startingBalanceCents, steps);
const meters: PhoneMeters = createPhoneMeters(config.features.tokenOdds.meterTarget);
const comboQueue = createComboQueue();
```
New: `${seed}:fs`, `${seed}:fs-collectors`, `${seed}:hold`, `${seed}:pick`.

**Spin settle pattern to reuse for `spinFree()`** (lines 80-110):
```typescript
spin(): SpinResult {
  const betCents = steps[betStepIndex];
  const placed = wallet.placeBet(betCents);
  if (!placed.ok) return placed;

  grid = engine.spin();
  lineWins = evaluatePaylines({ grid, paylines: math.paylines, paytable: config.paytable, wildId: math.wildSymbolId, betCents });
  lastWinCents = lineWins.reduce((sum, w) => sum + w.payoutCents, 0);
  wallet.credit(lastWinCents);

  collectorOutcome = resolveCollectors({ rng: collectorsRng, tokenOdds: config.features.tokenOdds, reels: math.reels, rows: math.rows });
  for (const spawn of collectorOutcome.spawns) { meters.increment(spawn.color); }
  comboQueue.set(collectorOutcome.queue);

  phase = "settled";
  return { ok: true };
},
```
`spinFree()` differs: no `placeBet`, uses boosted FS engine, uses captured `featureBetCents` (not `steps[betStepIndex]`), and guard `spin()` with a night-active check returning `{ ok: false, reason: "" }` (the empty reason convention is used by the session wrapper, mountHotlineSession.ts line 136-137).

**Result type + interface style** (lines 14-38, 118-121): `SpinResult = { ok: true } | { ok: false; reason: string }`; `HotlineGame` interface carries JSDoc one-liners in lowercase; `resetPhoneMeter(color)` delegates to `meters.reset(color)`. `HotlineGame` owns all `meters.increment/reset` (session must not call `.increment(`, see session test below).

**Snapshot building:** `money(cents)` helper (line 44-46) formats display strings; extend `HotlineSnapshot` (lines 17-30) only with display-ready fields.

---

### `src/games/hotline/logic/HotlineGame.test.ts` (test)

**Analog:** itself. Stream parity guard to extend (lines 196-218):
```typescript
const aCfg = withOdds({ green: 0, red: 0, purple: 0 }, { green: 0, red: 0, purple: 0 });
const bCfg = withOdds({ green: 1, red: 1, purple: 1 }, { green: 1, red: 1, purple: 1 });
const a = createHotlineGame({ seed: "parity", config: aCfg });
const b = createHotlineGame({ seed: "parity", config: bCfg });
for (let i = 0; i < 10; i++) {
  a.spin(); b.spin();
  expect(sb.grid).toEqual(sa.grid);
}
```
Add the same shape for "only `freeSpins` / hold / pick knobs change". Balance-assertion style (lines 36-41, 60-64): `cents(snap.balanceDisplay)` equals `START - bet + won`. Use it for the single-credit-per-feature test.

---

### `src/games/hotline/logic/index.ts` (barrel)

**Analog:** itself (lines 1-31): named `export { ... , type X } from "./path.js"` blocks, grouped by folder. Add blocks for `features/*` and `night/createNight`.

---

### `src/games/hotline/hud/comboStripModel.ts` (utility, transform) and test

**Analog:** `src/games/hotline/session/collectPresentation.ts`, pure formatter next to a `COLOR_LABEL` record (lines 1-9, 31-35):
```typescript
const COLOR_LABEL: Record<TokenColor, string> = { green: "Green", red: "Red", purple: "Purple" };

export function formatComboStrip(queue: readonly TokenColor[]): string {
  if (queue.length === 0) return "";
  return `COMBO: ${queue.map((c) => COLOR_LABEL[c]).join(" → ")}`;
}
```
Keep `formatComboStrip` exported (or migrate its test, Pitfall 1). New `comboStripModel(path)` returns `{ label, state }[]` and imports labels from the same record (do not duplicate it; export it from `collectPresentation.ts` or move it and re-export).

**Test analog:** `collectPresentation.test.ts` lines 1-12, 40-45: plain `describe/it/expect`, tiny fixture helper (`spawn(color)`), no DOM.

---

### `src/games/hotline/hud/HotlineHud.ts` (component, DOM binder)

**Analog:** itself. Add `setComboPath`, `setFeatureLine`.

**Interface + doc comment style** (lines 8-16):
```typescript
export interface HotlineHud {
  render(snap: HotlineSnapshot): void;
  /** lock spin and bet steppers through flights and combo stub */
  setBusy(busy: boolean): void;
  /** combo strip copy via textContent only */
  setCombo(text: string): void;
  dispose(): void;
}
```
**Required-node pattern** (lines 26-31, 47-52): `need<T>(root, selector)` throws `hotline hud: ${selector} missing`; add `const featureEl = need(root, "[data-field=feature]")`. The "throws loud when a required node is missing" test relies on this.

**Setter guard pattern** (lines 163-167):
```typescript
setCombo(text: string): void {
  if (disposed) return;
  comboEl.textContent = text;
},
```
For path highlight build spans with `document.createElement` + `textContent` only; no `.innerHTML` (HotlineHud.test.ts line 141-146 asserts `not.toMatch(/\.innerHTML\b/)` on this file). Note this file is under `src/games/hotline/hud`, not scanned by the `DOM_API` logic test, so `document.` is allowed here.

**Listener lifecycle** (lines 120-148, 169-175): every `addEventListener` has a named handler and a matching `removeEventListener` in `dispose()`.

---

### `src/games/hotline/hud/HotlineHud.test.ts` (test)

**Analog:** itself. `FakeEl` double and `makeRoot` selector list (lines 8-48):
```typescript
class FakeEl {
  textContent = "";
  disabled = false;
  private listeners = new Map<string, Set<() => void>>();
  addEventListener(...) {...}
  removeEventListener(...) {...}
  setAttribute(): void {}
  click(): void {...}
  count(): number {...}
}
function makeRoot() {
  const names = ["[data-field=balance]", ... "[data-field=combo]", "[data-action=spin]", ...];
  ...
  const root = { querySelector: (sel: string) => els[sel] ?? null } as unknown as Element;
```
Adding `[data-field=feature]` to `need()` means this `names` list must gain the same selector or every HUD test breaks. If `setComboPath` uses `replaceChildren` / `append`, extend `FakeEl` minimally, or test only the pure model plus a source assertion (RESEARCH Pattern 7).

---

### `src/games/hotline/hud/FeatureOverlay.ts` (component, DOM event-driven) - partial analog

**Analog:** `HotlineHud.ts` for the DOM binder conventions; no existing overlay/dialog code exists.

Copy: `need()` helper, `textContent`-only writes, named handlers removed in `dispose()`, `disposed` guard on every method, explicit `throw new Error("hotline ...: ... missing")`. Mount as a child of `.hotline-screen`, never inside `#game-canvas-host` (session does `host.replaceChildren(ctx.app.canvas)`, mountHotlineSession.ts line 55, which would wipe it; layout test `tests/shell.hud-layout.test.ts` lines 145-149 forbids `data-action`/`data-field` inside the host). Create markup in the `index.html` template (see below) and query it with `need()`, rather than building via `innerHTML`.

---

### `src/games/hotline/view/JackpotStrip.ts` (component, Pixi layout)

**Analog:** `src/games/hotline/view/PhonesLayer.ts`. Same `{ container, layout(left, top, width, height), destroy }` shape so the scene can swap the two in the same band.

**Interface + layout + destroy pattern** (PhonesLayer.ts 8-19, 95-108, 130-136):
```typescript
export interface PhonesLayer {
  container: Container;
  layout: (left: number, top: number, width: number, height: number) => void;
  destroy: () => void;
}
...
layout(left, top, width, height): void {
  if (destroyed) return;
  band = { left, top, width, height };
  const slotW = width / sprites.length;
  const size = Math.max(8, Math.min(height, slotW * 0.92));
  ...
},
destroy(): void {
  if (destroyed) return;
  destroyed = true;
  container.removeFromParent();
  container.destroy({ children: true });
},
```
Colors as `const X_NEON = 0x...` module constants (lines 22-23). Text uses `fontFamily: textures.fontFamily` (HotlineScene.ts 69-79) so pass `fontFamily` in as an argument; static strings so re-rasterize cost is irrelevant.

---

### `src/games/hotline/view/HoldLayer.ts` (component, Pixi ticker animation)

**Analog:** `src/games/hotline/view/WinLinesOverlay.ts`. Same geometry input (`WinGeometry`: `centers[reel][row]`, `cellSize`, `gap`), Graphics redraw only on change, `container.visible` toggling, ticker-fed `tick(deltaMS)`.

**Container/children/visibility setup** (lines 37-58):
```typescript
export function createWinLinesOverlay(): WinLinesOverlay {
  const container = new Container();
  const frames = new Graphics();
  ...
  const label = new Text({ text: "", style: { fontFamily: "sans-serif", fontSize: 16, fontWeight: "bold", fill: NEON_CORE } });
  label.anchor.set(0.5);
  container.addChild(frames, glow, halo, core, pill, label);
  container.visible = false;
```
**Framed cell drawing** (lines 102-113): `roundRect(p.x - size / 2, p.y - size / 2, size, size, 6).stroke({ width: 3, color, alpha })` with `size = cellSize - gap`. Reuse for the 20 hold cell frames.

**Tick guard** (lines 142-166): `if (destroyed || ...) return;` then `Number.isFinite(deltaMS) && deltaMS > 0` before accumulating. Apply the same to the flicker clock. Import `WinGeometry` type from `./WinLinesOverlay.js` rather than redefining it.

---

### `src/games/hotline/view/HotlineScene.ts` (component, Pixi, streaming)

**Analog:** itself. Add `setHoldMode`, hold API, jackpot swap, `intervalMs` pass-through.

**Interface growth pattern** (lines 14-34): add members with a lowercase JSDoc line, keep arrow-typed properties.

**Child ordering** (lines 97-108): `root.addChild(backdrop, title, phones.container, screen, reelWindow.container, frame, overlay.container, flight.container)`. Insert `jackpot.container` beside `phones.container` and `hold.container` above `frame` and below `flight.container`.

**Layout band shared by phones and jackpot** (lines 142-146):
```typescript
phones.layout(frameLeft, top + titleH, frameW, phoneH);
frame.position.set(frameLeft, frameTop);
```
Call `jackpot.layout(...)` with the identical args. `geometry()` (lines 167-185) already returns centers/cellSize for the hold layer.

**Destroy chain** (lines 261-271): add `hold.destroy()` and `jackpot.destroy()` here, and have `setHoldMode(false)` restore `reelWindow.container.visible`, `overlay.container.visible`, `phones.container.visible` (Pitfall 9). Scene `sync` already gates on `destroyed` (line 198).

---

### `src/games/hotline/view/WinLinesOverlay.ts` (mod)

**Analog:** itself. `CYCLE_MS = 1100` (line 31) is a module const used once at line 58 (`createWinCycle(CYCLE_MS)`). Turn it into `createWinLinesOverlay(options?: { intervalMs?: number })` defaulting to `CYCLE_MS`, or add `setIntervalMs`. `createWinCycle(intervalMs)` already sanitizes the value (winCycle.ts 13-14), so no change there. Do not copy the file for FS.

---

### `src/games/hotline/session/mountHotlineSession.ts` (controller, event-driven)

**Analog:** itself. Replace the `stub` branch; keep structure.

**Phase union and timing consts** (lines 28-31):
```typescript
const LAST_WIN_TWEEN_MS = 900;
const STUB_BEAT_MS = 700;
type PresentPhase = "idle" | "reels" | "win_gate" | "flights" | "stub";
```
Grow `PresentPhase` with the new phases; timing constants stay module-level.

**Idle reset must restore everything** (lines 78-88): `enterIdle()` sets `present`, `busy`, `hud.setBusy(false)`, `hud.setCombo("")`, `setPhoneGlow(null)`, clears pending state. Add `setHoldMode(false)`, overlay hide, and night reset here.

**Stub entry and drain to replace** (lines 100-111 and 211-224):
```typescript
present = "stub";
stubQueue = queue.slice();
ctx.audio.play("phone_trigger");
showStubHead();
...
if (present === "stub") {
  if (!Number.isFinite(deltaMS) || deltaMS <= 0) return;
  stubElapsed += deltaMS;
  if (stubElapsed < STUB_BEAT_MS) return;
  stubElapsed = 0;
  const color = stubQueue.shift();
  if (color) {
    ctx.audio.play("queue_step");
    game.resetPhoneMeter(color);
    syncMetersFromLogic();
  }
  showStubHead();
}
```
Keep the `Number.isFinite(deltaMS)` guard for every presenter timer (Pitfall 11), tick-driven timers only (no `setTimeout`, Pitfall 10), and meter reset via `game.resetPhoneMeter(color)` followed by `syncMetersFromLogic()` at feature start.

**Presentation pipeline to reuse per FS spin** (lines 133-156, 183-228): `hudGame.spin()` wrapper -> `scene.startSpin(grid)` -> `onReelsSettled` -> `win_gate` -> `beginFlights` -> next. The FS spin should call the same chain with `game.spinFree()` in place of `game.spin()`.

**Busy gate** (line 136): `if (busy || view?.scene.isSpinning()) return { ok: false, reason: "" };`.

**Dispose** (lines 246-264): add overlay listener removal and hold-mode restore; ticker removed first, then hud, then view.

**Balance hold** (lines 164-174, `visibleSnapshot`): subtracts `lastWin` while reels spin; FS credits per spin ride this path, Hold and Pick'em credit once at exit splash.

**Template lookup + loud throws** (lines 40-58, 227-230): `document.querySelector` then `instanceof` check then `throw new Error("hotline session: ... missing")`. Follow the same style for overlay nodes.

---

### `src/games/hotline/session/collectPresentation.test.ts` (test, source grep)

**Analog:** itself (lines 60-84). These read `mountHotlineSession.ts` as text and will fail if the stub path or its calls move:
```typescript
expect(src).toMatch(/setBusy\s*\(\s*true\s*\)/);
expect(src).toMatch(/startCollectors/);
expect(src).toMatch(/progressiveDisplayFills/);
expect(src).toMatch(/formatComboStrip/);
expect(src).toMatch(/resetPhoneMeter/);
expect(src).not.toMatch(/\.increment\s*\(/);
...
expect(src).toMatch(/play\s*\(\s*["']phone_trigger["']\s*\)/);
expect(src).toMatch(/play\s*\(\s*["']queue_step["']\s*\)/);
expect(src).toMatch(/unlock\s*\(\s*\)/);
```
Plan rule: if `formatComboStrip` stops being called from the session (path model replaces it), update this assertion in the same task. If calls move into `nightPresenter.ts`, either keep one literal call site in the session file or point the test at both files. Add new contract assertions in this same style (e.g. `feature_start` beep, `setHoldMode(false)` in `enterIdle`).

---

### Audio: `AudioPort.ts`, `createBeepAudioPort.ts`, `createBeepAudioPort.test.ts` (mod)

**Analog:** the collector event additions from Phase 3 (same three files).

**Closed union** (AudioPort.ts 1-12): append ids like `| "feature_start" | "feature_end" | "hold_land" | "hold_respin" | "pick_reveal" | "jackpot"` after `"queue_step"` (that last member currently ends with `;`).

**Pitch table is a total `Record<SfxEvent, number>`** (createBeepAudioPort.ts 38-50): missing id is a compile error.
```typescript
const PITCH_HZ: Record<SfxEvent, number> = {
  ...
  phone_trigger: 560,
  queue_step: 480,
};
```
Pick distinct frequencies; the test checks finite and positive, and a "distinct from each other" test exists per group (test lines 85-92, 94+).

**Test list** (createBeepAudioPort.test.ts 10-27): add a `const FEATURE_EVENTS: SfxEvent[] = [...]` array next to `COLLECTOR_EVENTS` and spread into `ALL_EVENTS`; add a "keeps feature events distinct" case mirroring lines 94+. Shell `sfxEdges.ts` is Crash only, no change.

---

### `index.html` hotline template and `src/styles/hud.css` (markup/config)

**Analog:** the combo strip. Template (index.html 317-324):
```html
<div id="game-canvas-host" class="canvas-host" aria-label="Game view">
  <p class="canvas-placeholder">Game view</p>
</div>

<div class="hotline-combo" data-field="combo" aria-live="polite"></div>
```
Add `<div class="hotline-feature" data-field="feature" aria-live="polite"></div>` right after the combo div (outside the host), and the overlay root (splash dialog + 12 locker buttons) as a sibling inside `#hotline-screen` after `#hud-bar` or beside the host, never inside it. Every new `data-action` must stay outside `#game-canvas-host` (layout test).

CSS analog (hud.css 943-964): `.hotline-screen` is `width: 100%; max-width: 34rem; margin-inline: auto;` and needs `position: relative` for an `absolute; inset: 0` overlay. `.hotline-combo` shows the type style to match (`font-family: "Retro Computer", ui-monospace, monospace; font-size: 0.8rem; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: #ff4da6; text-align: center;`). Do not remove `pointer-events: none` from `.canvas-host` (hud.css 127-145); overlay buttons need `pointer-events: auto`.

## Shared Patterns

### Seeded stream isolation
**Source:** `src/games/hotline/logic/HotlineGame.ts` lines 64-69 and test lines 196-218
**Apply to:** `HotlineGame.ts`, `freeSpins.ts`, `holdAndWin.ts`, `pickEm.ts`
Each feature uses its own `createRng(`${seed}:<name>`)`; the base `engine` and `:collectors` streams are never consumed by a feature. Guard with a parity test.

### Pure logic boundary
**Source:** `tests/architecture.no-pixi.test.ts` lines 6-14, 28-31, 63-83
**Apply to:** everything under `src/games/hotline/logic/**` (and `src/shared/**`)
No `from "pixi.js"` and no `document.` / `window.` in non-test `.ts` files. `pixi.js` stays pinned at `8.21.0` in `package.json`.

### Factory + interface style, `.js` import suffix
**Source:** `ComboQueue.ts` (lines 7-33), `PhoneMeters.ts` (lines 3-43), `resolveCollectors.ts` (lines 1-3)
**Apply to:** all new logic and view modules
`export interface X {...}` then `export function createX(...): X { ...closure state...; return {...} }`. All relative imports end in `.js`; type-only imports use `import type`.

### Defensive numeric guards
**Source:** `HotlineGame.ts` 114-117, `mountHotlineSession.ts` 213, `winCycle.ts` 13-14, `PhonesLayer.ts` 28-32
**Apply to:** pick/index inputs, all tick/delta consumers, config-derived counts
`Number.isFinite(x)` before use, clamp with `Math.max/Math.min`, ignore (do not throw) bad runtime input; throw only for bad config or missing DOM at mount.

### Destroy and teardown
**Source:** `PhonesLayer.ts` 130-136, `HotlineScene.ts` 261-271, `HotlineHud.ts` 169-175, `mountHotlineSession.ts` 246-264
**Apply to:** `HoldLayer`, `JackpotStrip`, `FeatureOverlay`, session dispose
`destroyed` / `disposed` flag, early return, `container.removeFromParent(); container.destroy({ children: true })`, listeners removed by the same function reference that added them.

### DOM text safety
**Source:** `HotlineHud.ts` 163-167; `HotlineHud.test.ts` 141-146; `tests/architecture.no-pixi.test.ts` 100-130
**Apply to:** `HotlineHud.ts`, `FeatureOverlay.ts`, all new DOM code
`textContent` only, never `.innerHTML`.

### Money in cents
**Source:** `src/shared/money/cents.ts` 7-9, 24-26; `HotlineGame.ts` 44-46
**Apply to:** Hold, Pick'em, night totals, FS credit
Logic holds integer cents; `payoutCents(betCents, toMultHundredths(mult))`; display strings produced only in the snapshot via `money()`.

### Code comment style
**Source:** AGENTS.md constraints; seen throughout (`// spin settles paylines then books collectors on a separate rng stream`)
**Apply to:** all new code
Lowercase, no trailing period, no arrows or em dashes in comments. Runtime copy such as the `→` in `formatComboStrip` is exempt.

### Locked test fixtures that pin existing files
**Source:** `tests/hotline.assets.test.ts` (17 PNG urls pinned), `tests/shell.hud-layout.test.ts` 145-149, `collectPresentation.test.ts` 60-84, `createBeepAudioPort.test.ts` 18-27
**Apply to:** plans touching assets, template, session, audio
Keep art procedural (no new `HOTLINE_ASSET_URLS`), keep controls outside the canvas host, update the grep tests in the same task as the code they scan, update `ALL_EVENTS` with new `SfxEvent` ids.

## No Analog Found

| File / Concern | Role | Data Flow | Reason |
|----------------|------|-----------|--------|
| DOM splash dialog + locker grid (`FeatureOverlay.ts` markup and CSS) | component | event-driven | No existing modal, overlay, or tap-to-continue DOM in HOTLINE; use `HotlineHud.ts` conventions only for binder structure. Menu button wiring (mountHotlineSession.ts 226-237) is the closest tap handler example |
| Nested pause / resume stack inside the night machine | service | event-driven | `ComboQueue` is a flat FIFO; the frame stack, nested list, and path model are new. Follow RESEARCH Pattern 1 for semantics |
| Hold mode swap on the reel grid (hide reels and win overlay, show hold cells) | component | streaming | No existing view-mode swap; the only visibility toggles are `container.visible` on overlay (WinLinesOverlay.ts 56, 98). Follow RESEARCH Pattern 8 and Pitfall 9 |

## Metadata

**Analog search scope:** `src/games/hotline/**`, `src/shared/{audio,money,rng}`, `tests/`, `index.html`, `src/styles/hud.css`
**Files scanned:** about 45 (tracked-source check via `git ls-files`)
**Pattern extraction date:** 2026-10-11
