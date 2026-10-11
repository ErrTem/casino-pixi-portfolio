# Phase 5: Gamble + Paytable + Polish - Pattern Map

**Mapped:** 2026-10-11
**Files analyzed:** 19
**Analogs found:** 19 / 19

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/games/hotline/logic/gamble/createGamble.ts` | service | transform | `src/games/hotline/logic/features/pickEm.ts` | exact |
| `src/games/hotline/logic/gamble/createGamble.test.ts` | test | transform | `src/games/hotline/logic/features/pickEm.test.ts` | exact |
| `src/games/hotline/logic/Wallet.ts` | service | CRUD | `src/games/hotline/logic/Wallet.ts` (`placeBet` debit path) | exact |
| `src/games/hotline/logic/HotlineGame.ts` | service | event-driven | `src/games/hotline/logic/HotlineGame.ts` (base `spin` settle) | exact |
| `src/games/hotline/logic/index.ts` | utility | transform | `src/games/hotline/logic/index.ts` (feature re-exports) | exact |
| `src/games/hotline/config/HotlineConfigSchema.ts` | config | transform | `src/games/hotline/config/HotlineConfigSchema.ts` (`pickEm`/`freeSpins`) | exact |
| `src/games/hotline/config/hotline.config.json` | config | file-I/O | `src/games/hotline/config/hotline.config.json` (`features.pickEm`) | exact |
| `src/games/hotline/config/HotlineConfigSchema.test.ts` | test | transform | `src/games/hotline/config/HotlineConfigSchema.test.ts` | exact |
| `src/games/hotline/hud/GambleOverlay.ts` | component | event-driven | `src/games/hotline/hud/FeatureOverlay.ts` | exact |
| `src/games/hotline/hud/PaytableOverlay.ts` | component | request-response | `src/games/hotline/hud/FeatureOverlay.ts` | role-match |
| `src/games/hotline/hud/paytableSheetModel.ts` | utility | transform | `src/games/hotline/hud/comboStripModel.ts` | exact |
| `src/games/hotline/hud/paytableSheetModel.test.ts` | test | transform | `src/games/hotline/hud/comboStripModel.test.ts` | exact |
| `src/games/hotline/hud/HotlineHud.ts` | component | event-driven | `src/games/hotline/hud/HotlineHud.ts` (`setBusy` / binders) | exact |
| `src/games/hotline/hud/HotlineHud.test.ts` | test | event-driven | `src/games/hotline/hud/HotlineHud.test.ts` | exact |
| `src/games/hotline/session/mountHotlineSession.ts` | controller | event-driven | `src/games/hotline/session/mountHotlineSession.ts` (`enterIdle` / `hudGame.spin`) | exact |
| `index.html` | config | file-I/O | `index.html` (`#hotline-screen-template`) | exact |
| `src/styles/hud.css` | config | transform | `src/styles/hud.css` (`.hotline-feature-overlay` / `.hotline-bar`) | exact |
| `src/shared/audio/AudioPort.ts` (+ beep port/tests) | utility | pub-sub | `src/shared/audio/AudioPort.ts` / `createBeepAudioPort.ts` | exact |
| `.planning/phases/05-gamble-paytable-polish/05-ASSET-LIST.md` | config | file-I/O | `.planning/phases/03-diskette-collectors-trigger-queue/03-ASSET-LIST.md` | exact |

## Pattern Assignments

### `src/games/hotline/logic/gamble/createGamble.ts` (service, transform)

**Analog:** `src/games/hotline/logic/features/pickEm.ts`

**Imports pattern** (lines 1-7):
```typescript
import {
  payoutCents,
  toMultHundredths,
} from "../../../../shared/money/cents.js";
import type { Rng } from "../../../../shared/rng/createRng.js";
import type { HotlineConfig } from "../../config/HotlineConfigSchema.js";
```
For gamble: import `Rng` only (no paytable); take `{ maxRounds, surviveChance }` from config/args — do not pull Pixi/document.

**Core factory + snapshot pattern** (lines 22-73):
```typescript
export function createPickEm(args: {
  rng: Rng;
  config: HotlineConfig;
  betCents: number;
}): PickEm {
  // closed over mutable state; return { pick, isDone, totalCents, snapshot }
  snapshot(): PickEmSnapshot {
    return {
      lockers: lockers.slice(),
      opened: [...opened].sort((a, b) => a - b),
      picksLeft,
    };
  }
}
```
Mirror as `createGamble({ maxRounds, surviveChance })` with `offer` / `clear` / `resolve(rng)` / `snapshot`. Guard invalid picks like `pick()` null returns (lines 45-53). Resolve once per click: `rng.next() < surviveChance`.

**Error handling:** return `null` from `resolve` when not offered or rounds exhausted — no throw for player clicks.

---

### `src/games/hotline/logic/gamble/createGamble.test.ts` (test, transform)

**Analog:** `src/games/hotline/logic/features/pickEm.test.ts`

**Imports + seed replay** (lines 1-25, 62-79):
```typescript
import { describe, expect, it } from "vitest";
import { createRng } from "../../../../shared/rng/createRng.js";
import { loadHotlineConfig } from "../../config/loadHotlineConfig.js";
import { createPickEm } from "./pickEm.js";

it("replays identical lockers and total for the same seed and pick order", () => {
  const a = createPickEm({ rng: createRng("pick-replay"), config, betCents });
  const b = createPickEm({ rng: createRng("pick-replay"), config, betCents });
  // assert identical outcomes
});
```
Cover: offer sets stake; SURVIVE doubles + increments rounds; DIE clears; maxRounds caps; same seed → same survive/die sequence via `createRng(\`${seed}:gamble\`)` at session layer.

---

### `src/games/hotline/logic/Wallet.ts` (service, CRUD)

**Analog:** same file — extend beside `placeBet` / `credit`

**Debit mirror of `placeBet` balance check** (lines 20-37):
```typescript
placeBet(amountCents: Cents): PlaceBetResult {
  if (!Number.isInteger(amountCents)) {
    return { ok: false, reason: "invalid_amount" };
  }
  if (amountCents > this.balanceCents) {
    return { ok: false, reason: "insufficient_balance" };
  }
  this.balanceCents -= amountCents;
  return { ok: true };
}

credit(amountCents: Cents): void {
  if (!Number.isFinite(amountCents) || amountCents <= 0) return;
  this.balanceCents += Math.floor(amountCents);
}
```
Add `debit(amountCents): boolean` — integer + positive + fits balance, then subtract (RESEARCH Pitfall 2). Keep `credit` ignore-on-invalid; DIE must use debit return value.

---

### `src/games/hotline/logic/HotlineGame.ts` (service, event-driven)

**Analog:** same file — base settle + interface surface

**Interface extension point** (lines 49-61):
```typescript
export interface HotlineGame {
  spin(): SpinResult;
  setBetStepIndex(index: number): void;
  getSnapshot(): HotlineSnapshot;
  resetPhoneMeter(color: TokenColor): void;
  isNightActive(): boolean;
  nextNightStep(): NightStep;
  spinFree(): SpinResult;
  pickLocker(index: number): number | null;
  stepHoldRespin(): { done: boolean };
  holdSnapshot(): HoldSnapshot | null;
}
```
Add gamble APIs here (`clearGambleOffer`, `offerGamble` / resolve wrappers, snapshot fields) — same facade style as `pickLocker` / `holdSnapshot`.

**Base-line stake capture (GAMBLE-02)** (lines 164-165):
```typescript
lastWinCents = lineWins.reduce((sum, w) => sum + w.payoutCents, 0);
wallet.credit(lastWinCents);
```
Immediately after this in base `spin()` only, set `baseLineWinCents = lastWinCents`. Never capture from `spinFree()` or `night.totalCents`. SURVIVE credits stake again via `wallet.credit`; DIE calls `wallet.debit(stake)`.

---

### `src/games/hotline/logic/index.ts` (utility, transform)

**Analog:** same file — feature barrel exports (lines 34-45):
```typescript
export {
  createPickEm,
  type PickEm,
  type PickEmSnapshot,
} from "./features/pickEm.js";
export {
  createHoldAndWin,
  type HoldAndWin,
  type HoldSnapshot,
  type JackpotTier,
} from "./features/holdAndWin.js";
```
Add matching `createGamble` / type exports from `./gamble/createGamble.js`.

---

### `src/games/hotline/config/HotlineConfigSchema.ts` (config, transform)

**Analog:** same file — required feature object schemas

**Helpers + feature object** (lines 46, 78-113):
```typescript
const chance01 = z.number().min(0).max(1);

const freeSpinsSchema = z.object({
  spins: positiveInt,
  wildWeights: z.array(positiveInt).length(4),
  retriggerChance: chance01,
  // ...
});

const pickEmSchema = z.object({
  lockers: z.literal(12),
  picks: z.literal(5),
});

const featuresSchema = z.object({
  tokenOdds: tokenOddsSchema,
  bonusPrizes: z.array(bonusPrizeSchema).min(1),
  jackpotMultipliers: jackpotMultipliersSchema,
  freeSpins: freeSpinsSchema,
  holdAndWin: holdAndWinSchema,
  pickEm: pickEmSchema,
});
```
Add required `gamble: z.object({ maxRounds: positiveInt, surviveChance: chance01 })` on `featuresSchema` (not optional).

**Paytable contract for Info overlay** (line 120):
```typescript
paytable: z.record(z.string(), payoutRow),
```
`paytableSheetModel` consumes this parsed record — do not re-validate in the overlay.

---

### `src/games/hotline/config/hotline.config.json` (config, file-I/O)

**Analog:** same file — `features` sibling knobs (lines 83-98):
```json
"freeSpins": { "spins": 24, "wildWeights": [9, 9, 9, 9], "retriggerChance": 0.04, "...": "..." },
"holdAndWin": { "startCells": 5, "respins": 3, "landChance": 0.1, "...": "..." },
"pickEm": { "lockers": 12, "picks": 5 }
```
Add `"gamble": { "maxRounds": 10, "surviveChance": 0.5 }` beside `pickEm`. Keep existing `paytable` rows (lines 61-69) unchanged for live Info numbers.

---

### `src/games/hotline/config/HotlineConfigSchema.test.ts` (test, transform)

**Analog:** same file — fail-loud fixture clones (lines 7-20, 49-53):
```typescript
function fixture(): Record<string, any> {
  return structuredClone(raw) as Record<string, any>;
}

it("throws ZodError when triggerChance is missing", () => {
  const bad = fixture();
  delete bad.features.tokenOdds.triggerChance;
  expect(() => HotlineConfigSchema.parse(bad)).toThrow(ZodError);
});
```
Add: envelope includes `features.gamble`; missing `gamble` throws; `surviveChance` outside 0..1 throws.

---

### `src/games/hotline/hud/GambleOverlay.ts` (component, event-driven)

**Analog:** `src/games/hotline/hud/FeatureOverlay.ts`

**`need` + mount binder** (lines 20-50):
```typescript
function need<T extends Element>(root: Element, selector: string): T {
  const el = root.querySelector<T>(selector);
  if (!el) throw new Error(`hotline feature overlay: ${selector} missing`);
  return el;
}

export function mountFeatureOverlay(
  screen: Element,
  options: MountFeatureOverlayOptions,
): FeatureOverlay {
  const root = need<HTMLElement>(screen, "[data-field=feature-overlay]");
  // bind buttons, disposed flag, addEventListener
```

**Safe DOM text (no innerHTML)** (lines 87-96):
```typescript
showSplash(splash): void {
  if (disposed) return;
  titleEl.textContent = splash.title;
  totalEl.textContent = splash.total ?? "";
  noteEl.textContent = splash.note ?? "";
  splashEl.hidden = false;
  root.hidden = false;
}
```

**Dispose removes listeners** (lines 143-152):
```typescript
dispose(): void {
  if (disposed) return;
  disposed = true;
  continueBtn.removeEventListener("click", onContinueClick);
  lockersEl.removeEventListener("click", onLockerClick);
  root.hidden = true;
}
```
Sibling binder: `[data-field=gamble-overlay]`, SURVIVE/DIE `data-action`s, CURRENT WIN / GAMBLE TO WIN via `textContent`. Auto-close timer after resolve (session owns timing); overlay exposes `show` / `showResult` / `hide` / `dispose`.

---

### `src/games/hotline/hud/PaytableOverlay.ts` (component, request-response)

**Analog:** `src/games/hotline/hud/FeatureOverlay.ts` (+ `HotlineHud` createElement for lists)

**CreateElement list building** from `HotlineHud.setComboPath` (lines 175-201):
```typescript
setComboPath(cells: readonly ComboStripCell[]): void {
  if (disposed) return;
  comboEl.replaceChildren();
  // ...
  const span = document.createElement("span");
  span.className = mods.trim();
  span.textContent = cell.label;
  nodes.push(span);
  comboEl.replaceChildren(...nodes);
}
```
Info overlay: open/close/dismiss; build sections from `paytableSheetModel(config)` with `createElement` + `textContent` only. Opening pauses play via session → `hud.setBusy(true)` (D-12). Info may open over paused VHS; SURVIVE/DIE stay inert until dismiss (RESEARCH Q2 RESOLVED, D-12).

---

### `src/games/hotline/hud/paytableSheetModel.ts` (utility, transform)

**Analog:** `src/games/hotline/hud/comboStripModel.ts`

**Pure map, no DOM** (lines 1-39):
```typescript
import type { NightPathEntry } from "../logic/index.js";

export type ComboStripCell = {
  label: string;
  state: "active" | "done" | "pending";
};

export function buildComboStripCells(
  path: readonly NightPathEntry[],
  activeIndex: number,
): ComboStripCell[] {
  return path.map((entry, index) => ({
    label: /* ... */,
    state: cellState(entry, index, activeIndex),
  }));
}
```
`paytableSheetModel(config: HotlineConfig)` → section rows (symbols from `config.paytable`, plus static phones/bonuses/gamble copy). Vitest-only; overlay binds output.

**Money labels:** use `src/games/hotline/hud/format.ts` `formatMoney` or cents helpers — not ad-hoc strings.

---

### `src/games/hotline/hud/paytableSheetModel.test.ts` (test, transform)

**Analog:** `src/games/hotline/hud/comboStripModel.test.ts` (lines 1-17):
```typescript
import { describe, expect, it } from "vitest";
import { buildComboStripCells } from "./comboStripModel.js";

describe("buildComboStripCells (D-18)", () => {
  it("marks activeIndex cell active with prior done and later pending", () => {
    const cells = buildComboStripCells(path, 1);
    expect(cells[1]).toEqual({ label: "Red", state: "active" });
  });
});
```
Assert live multipliers for a known symbol (e.g. `pistol` 3/4/5) match parsed config paytable.

---

### `src/games/hotline/hud/HotlineHud.ts` (component, event-driven)

**Analog:** same file

**Field binding + busy lock** (lines 52-61, 103-113, 159-169):
```typescript
const spinBtn = need<HTMLButtonElement>(root, "[data-action=spin]");
const decBtn = need<HTMLButtonElement>(root, "[data-action=bet-dec]");
const incBtn = need<HTMLButtonElement>(root, "[data-action=bet-inc]");

function syncControls(snap: HotlineSnapshot): void {
  if (busy) {
    spinBtn.disabled = true;
    decBtn.disabled = true;
    incBtn.disabled = true;
    return;
  }
  spinBtn.disabled = false;
  // ...
}

setBusy(next: boolean): void {
  busy = next;
  if (lastSnap) syncControls(lastSnap);
}
```
Add `need` for `[data-action=gamble]` / `[data-action=info]`; expose `setGambleEnabled` / wire Info click to session callback. Include new buttons in busy disable set. Keep Spin click path for take-and-spin (session may wrap game.spin).

---

### `src/games/hotline/hud/HotlineHud.test.ts` (test, event-driven)

**Analog:** same file — FakeEl + `makeRoot` selector list (lines 39-58):
```typescript
const names = [
  "[data-field=balance]",
  "[data-field=last-win]",
  "[data-field=bet]",
  "[data-field=lines]",
  "[data-field=status]",
  "[data-field=combo]",
  "[data-field=feature]",
  "[data-action=spin]",
  "[data-action=bet-dec]",
  "[data-action=bet-inc]",
];
```
Extend `names` with gamble/info actions; assert Gamble disabled by default / enabled via `setGambleEnabled`; busy disables Spin + Gamble.

---

### `src/games/hotline/session/mountHotlineSession.ts` (controller, event-driven)

**Analog:** same file

**PresentPhase + overlay mount** (lines 37-45, 98-118):
```typescript
type PresentPhase =
  | "idle"
  | "reels"
  | "win_gate"
  | "flights"
  | "fs_gap"
  | "splash"
  | "hold_respin"
  | "pick";

const overlay = mountFeatureOverlay(screen, {
  onContinue: () => {
    if (present !== "splash") return;
    // ...
  },
});
```
Extend `PresentPhase` with `"gamble"` (and optionally treat Info as busy overlay without a new phase). Mount `GambleOverlay` / `PaytableOverlay` siblings beside FeatureOverlay.

**Offer gate in `enterIdle`** (lines 147-166):
```typescript
function enterIdle(): void {
  present = "idle";
  busy = false;
  hud.setBusy(false);
  // clear combo/feature chrome...
  overlay.hideLockers();
  overlay.hideSplash();
}
```
After cleanup: if `baseLineWinCents > 0` (or gamble still offered post-SURVIVE) → `hud.setGambleEnabled(true)`; else disable. Never enable from `onReelsSettled` (Pitfall 3).

**Spin clears offer (D-02)** (lines 350-363):
```typescript
const hudGame: HotlineGame = {
  ...game,
  spin(): SpinResult {
    if (busy || view?.scene.isSpinning()) return { ok: false, reason: "" };
    const result = game.spin();
    if (result.ok && view) {
      startReels(true);
    }
    return result;
  },
};
```
Before `game.spin()`: `game.clearGambleOffer()` + `hud.setGambleEnabled(false)`. Gamble click: set `present = "gamble"`, `busy = true`, show VHS overlay; resolve → credit/debit → flash → timer auto-close → re-enter idle offer rules (D-03/D-07).

**Audio emit pattern** (existing in session): `ctx.audio.play("win")` / `"token_spawn"` — use new `gamble_*` events the same way.

---

### `index.html` (config, file-I/O)

**Analog:** same file — `#hotline-screen-template`

**Feature overlay markup family** (lines 321-361):
```html
<div class="hotline-feature-overlay" data-field="feature-overlay" hidden>
  <div class="hotline-feature-splash" data-field="feature-splash" role="dialog" aria-modal="true">
    <!-- title / total / note / continue -->
  </div>
  <div class="hotline-feature-lockers" data-field="feature-lockers" hidden role="group"></div>
</div>
```

**HUD bar controls** (lines 375-407):
```html
<footer id="hud-bar" class="hud-bar">
  <div class="hotline-bar">
    <div class="stake-group">...</div>
    <button type="button" data-action="spin" class="primary-cta primary-cta--bet">
      <span class="primary-cta__label">SPIN</span>
    </button>
  </div>
</footer>
```
Add sibling overlays for gamble + paytable (`data-field=...`, `hidden`); add Gamble/Info buttons with `data-action` inside `.hotline-bar` (compact icons; Spin stays primary). Keep monetary controls outside `#game-canvas-host`.

---

### `src/styles/hud.css` (config, transform)

**Analog:** same file

**Portrait column + canvas non-interactive** (lines 137-145, 943-947 — canvas rules earlier in file):
```css
.hotline-screen {
  position: relative;
  width: 100%;
  max-width: 34rem;
  margin-inline: auto;
}
```
Do not enable `pointer-events` on `.canvas-host` / canvas.

**Overlay chrome** (lines 954-1018):
```css
.hotline-feature-overlay {
  position: absolute;
  inset: 0;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(8, 2, 18, 0.82);
  pointer-events: auto;
}
```
Clone class naming for `.hotline-gamble-overlay` / `.hotline-paytable-overlay` (scrollable sheet: `overflow-y: auto`, `width: min(100%, …)`).

**Desktop bar + mobile breakpoint hints** (lines 879-890, 918-925):
```css
@media (max-width: 720px) {
  .primary-cta { min-height: 4rem; }
}
.hotline-bar {
  display: flex;
  align-items: stretch;
  gap: 0.55rem;
  /* ... */
}
```
Add narrow reflow (~480px or align with 720px) for spin-centric hub: large center Spin; bet ± / Gamble / Info as ≥44×44 icon buttons. QA floor ~360×640 — avoid wide flex overflow (`min-width: 0`).

---

### `src/shared/audio/AudioPort.ts` (+ `createBeepAudioPort.ts` / test) (utility, pub-sub)

**Analog:** closed union + pitch table

**Union** (`AudioPort.ts` lines 1-19):
```typescript
export type SfxEvent =
  | "bet_lock"
  | /* ... */
  | "pick_reveal"
  | "jackpot";
```
Add `"gamble_open" | "gamble_survive" | "gamble_die"` (discretion names from RESEARCH).

**Pitch table** (`createBeepAudioPort.ts` lines 38-56): extend `PITCH_HZ: Record<SfxEvent, number>` for every new event (TypeScript forces completeness).

**Test list** (`createBeepAudioPort.test.ts` lines 18-37): append new events to `FEATURE_EVENTS` / `ALL_EVENTS` so pitch coverage stays exhaustive.

---

### `.planning/phases/05-gamble-paytable-polish/05-ASSET-LIST.md` (config, file-I/O)

**Analog:** `.planning/phases/03-diskette-collectors-trigger-queue/03-ASSET-LIST.md`

**Structure** (lines 1-26):
```markdown
# HOTLINE Phase 3 asset list — diskettes
Drop every file below into `public/assets/hotline/` ...
## Must-have ...
| File | Role | Size (px) | Alpha | Notes |
## Scope rules
## Placement checklist
- [ ] `public/assets/hotline/...`
```
Draft 3 VHS DOM assets (not Pixi pack): `vhs-gamble-panel.png`, `vhs-btn-survive.png`, `vhs-btn-die.png`. Explicitly: do **not** add to `HOTLINE_ASSET_URLS`; CSS neon fallback if late (D-08).

## Shared Patterns

### DOM overlay binder (no innerHTML)
**Source:** `src/games/hotline/hud/FeatureOverlay.ts`
**Apply to:** `GambleOverlay.ts`, `PaytableOverlay.ts`
```typescript
function need<T extends Element>(root: Element, selector: string): T {
  const el = root.querySelector<T>(selector);
  if (!el) throw new Error(`hotline feature overlay: ${selector} missing`);
  return el;
}
// textContent / createElement / replaceChildren only; dispose removes listeners
```

### Session busy / present FSM
**Source:** `src/games/hotline/session/mountHotlineSession.ts` lines 37-45, 147-166, 350-354
**Apply to:** gamble offer, VHS round, Info pause
- Mid-presentation: `busy || view?.scene.isSpinning()` → ignore Spin
- Offer only from `enterIdle` when base-line pot > 0 and `!game.isNightActive()`
- Info open → `hud.setBusy(true)`; dismiss restores idle offer state

### Pure feature machine + Vitest seed replay
**Source:** `src/games/hotline/logic/features/pickEm.ts` + `.test.ts`
**Apply to:** `createGamble.ts`
- No DOM/Pixi in logic
- `createRng` for SURVIVE/DIE
- Snapshot for HUD/tests

### Zod required feature knobs
**Source:** `src/games/hotline/config/HotlineConfigSchema.ts` `featuresSchema`
**Apply to:** `features.gamble`
- Required object fields; fail-loud tests via `structuredClone` fixtures

### Wallet integer cents
**Source:** `src/games/hotline/logic/Wallet.ts`
**Apply to:** SURVIVE credit / DIE debit
- `placeBet` already subtracts; DIE needs symmetric `debit`
- Format via existing display helpers (`formatMoney` / `centsToDisplay`)

### Canvas non-interactive + portrait letterbox
**Source:** `src/styles/hud.css` (canvas `pointer-events: none`, `.hotline-screen` max-width 34rem)
**Apply to:** all VHS/Info chrome and mobile HUD reflow
- Controls stay in DOM template outside `#game-canvas-host`
- VHS PNGs via `/assets/hotline/...` CSS/`<img>`, not Pixi Assets list

### AudioPort closed union
**Source:** `src/shared/audio/AudioPort.ts` + `createBeepAudioPort.ts` `PITCH_HZ`
**Apply to:** gamble SFX events
- Widen union + pitch map + ALL_EVENTS test list together

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| — | — | — | All planned files have in-repo analogs |

## Metadata

**Analog search scope:** `src/games/hotline/**`, `src/shared/audio/**`, `src/styles/hud.css`, `index.html`, `.planning/phases/*/0*-ASSET-LIST.md`
**Files scanned:** ~70 tracked hotline/shared/style/template paths (glob + `git ls-files` gate)
**Pattern extraction date:** 2026-10-11
**Tracked-source gate:** all analog paths verified via `git ls-files` (non-empty)
