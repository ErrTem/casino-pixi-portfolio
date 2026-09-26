# Phase 3: Pixi Hybrid View - Pattern Map

**Mapped:** 2026-09-27
**Files analyzed:** 23
**Analogs found:** 20 / 23

## Status

Phase 2 shipped the Vite shell, HTML HUD, and `rafClock`. Phase 3 is **not** greenfield for the integration contract. Pixi scene modules under `src/games/crash/view/` have **no Pixi analog** in this repo (zero `pixi.js` imports today). Copy lifecycle, snapshot binding, named config, and Vitest shape from the files below. Copy Pixi v8 API only from `03-RESEARCH.md` Patterns 1 and 3–7 (labeled **[ESTABLISH]** here). Do not invent a second orchestrator.

**Consume, do not rewrite:** `src/games/crash/hud/CrashHud.ts` (keep monetary commands), `src/games/crash/hud/enablement.ts` (matrix already treats only `waiting` / `flying` as actionable — add a test, do not “fix” `cashed_out` into `waiting`), `src/games/crash/hud/format.ts` (`formatMult`), `src/games/crash/logic/MultiplierCurve.ts` (logic-only producer of `snapshot.multiplier` — view must not import it), `src/games/crash/logic/index.ts` (barrel already re-exports `CrashSnapshot`), `index.html` (`#game-canvas-host` stays; `replaceChildren` removes the placeholder at runtime), `vitest.config.ts` (keep `environment: "node"`), `tsconfig.json` (do not pre-edit `NodeNext`; switch to `bundler` only if `npx tsc --noEmit` fails after `pixi.js` install).

**Out of phase:** mobile stacking / DPR beyond a cap of 2, countdown digits, SFX, `?seed=`, GSAP, `pixi-filters`, `ParticleContainer`, `@pixi/react`, `Assets.load`.

| Authority | Use for |
|-----------|---------|
| Existing `src/main.ts` + `CrashHud.render` | One tick site: `game.tick` → `getSnapshot` → HUD render, then add `scene.sync` |
| `resolveTick.ts` / `CrashGame.getSnapshot` | Where `cashOutAt` and durable `cashed_out` must land |
| `config.ts` + `enablement.ts` + `format.ts` | Named constants, pure snapshot→flags reducer, 2dp `×` string |
| `03-RESEARCH.md` Patterns 1, 3–7 | Pixi init, ticker `deltaMS`, plot math, strokes, rocket seam, view-mode clock |

Match quality: `exact` = same file to modify; `role-match` = same role and data flow, different file; `partial` = same convention, different layer; `none` = establish from RESEARCH.

All analog paths below are git-tracked (`git ls-files`).

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `package.json` | config | batch | `package.json` | exact |
| `src/main.ts` | service | event-driven | `src/main.ts` | exact |
| `src/styles/hud.css` | view | batch | `src/styles/hud.css` | exact |
| `src/app/rafClock.ts` | utility | event-driven | `src/app/rafClock.ts` | exact (DELETE) |
| `src/games/crash/logic/RoundState.ts` | model | transform | `src/games/crash/logic/RoundState.ts` | exact |
| `src/games/crash/logic/resolveTick.ts` | service | event-driven | `src/games/crash/logic/resolveTick.ts` | exact |
| `src/games/crash/logic/CrashGame.ts` | store | request-response | `src/games/crash/logic/CrashGame.ts` | exact |
| `tests/resolveTick.test.ts` | test | event-driven | `tests/resolveTick.test.ts` | exact |
| `tests/walkingSkeleton.test.ts` | test | request-response | `tests/walkingSkeleton.test.ts` | exact |
| `tests/roundCadence.test.ts` | test | event-driven | `tests/roundCadence.test.ts` | exact (keep loop) |
| `tests/architecture.no-pixi.test.ts` | test | batch | `tests/architecture.no-pixi.test.ts` | exact |
| `src/games/crash/hud/enablement.test.ts` | test | transform | `src/games/crash/hud/enablement.test.ts` | exact |
| `tests/pathMapping.test.ts` | test | transform | `tests/multiplierCurve.test.ts` | role-match |
| `tests/viewMode.test.ts` | test | transform | `src/games/crash/hud/enablement.test.ts` | role-match |
| `src/games/crash/view/mountCrashView.ts` | service | event-driven | `src/main.ts` + `CrashHud.ts` mount | role-match |
| `src/games/crash/view/CrashScene.ts` | component | event-driven | `src/games/crash/hud/CrashHud.ts` `render` | role-match |
| `src/games/crash/view/viewMode.ts` | utility | transform | `src/games/crash/hud/enablement.ts` | role-match |
| `src/games/crash/view/pathMapping.ts` | utility | transform | `src/games/crash/hud/format.ts` finite guard | role-match |
| `src/games/crash/view/viewConfig.ts` | config | batch | `src/games/crash/logic/config.ts` | role-match |
| `src/games/crash/view/TheaterText.ts` | component | transform | `format.ts` + `CrashHud` live × | partial |
| `src/games/crash/view/Backdrop.ts` | component | batch | — | none |
| `src/games/crash/view/CurveGraph.ts` | component | transform | — | none |
| `src/games/crash/view/Rocket.ts` | component | event-driven | — | none |

## Pattern Assignments

### `package.json` (config, batch)

**Analog:** `package.json` lines 7–22 **[EXISTING]**

**Core pattern:**
```json
"scripts": {
  "dev": "vite",
  "build": "tsc --noEmit && vite build",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest"
},
"dependencies": {
  "seedrandom": "^3.0.5"
}
```

**Apply:** `npm install pixi.js@8.21.0` into `dependencies` only. Do not add `gsap`, `pixi-filters`, `@pixi/react`, or `howler`. Same commit must flip `tests/architecture.no-pixi.test.ts` (that test currently requires `pixi.js` absent).

---

### `src/main.ts` (service, event-driven)

**Analog:** `src/main.ts` lines 1–25 **[EXISTING]**

**Imports pattern** (`.js` suffix, composition root only):
```typescript
import { startRafClock } from "./app/rafClock.js";
import { mountCrashHud } from "./games/crash/hud/CrashHud.js";
import { createGame } from "./games/crash/logic/index.js";
import "./styles/hud.css";
```

**Core pattern** — one clock, missing-root throw, HMR dispose:
```typescript
function main(): void {
  const game = createGame({ seed: "portfolio-demo" });
  const root = document.querySelector("#hud-bar");
  if (!root) throw new Error("#hud-bar missing");

  const hud = mountCrashHud(root, game);
  hud.render(game.getSnapshot());

  // Phase 3: stop() then bind app.ticker to the same tick + render site
  const stopClock = startRafClock((deltaMs) => {
    game.tick(deltaMs);
    hud.render(game.getSnapshot());
  });

  if (import.meta.hot) {
    import.meta.hot.dispose(() => stopClock());
  }
}

main();
```

**Apply:** Make `main` async, invoke `void main()`. Query `#game-canvas-host` the same way as `#hud-bar` (throw if missing). `await mountCrashView(host)` **before** any tick. Replace the rAF callback with one `app.ticker.add`. Pass `ticker.deltaMS` (a number), not the `Ticker` and not `deltaTime`. Set `app.ticker.minFPS = 10`. Order inside the callback: `game.tick` → `getSnapshot` → `hud.render` → `scene.sync`. HMR: `ticker.remove`, then `app.destroy({ removeView: true, releaseGlobalResources: true }, { children: true })`. Do not call `startRafClock`.

**Ticker body [ESTABLISH]** from `03-RESEARCH.md` Pattern 1 — not from this repo:
```typescript
app.ticker.minFPS = 10;
app.ticker.add((ticker) => {
  game.tick(ticker.deltaMS);
  const snap = game.getSnapshot();
  hud.render(snap);
  scene.sync(snap, ticker.deltaMS);
});
```

---

### `src/styles/hud.css` (view, batch)

**Analog:** `src/styles/hud.css` lines 23–39 **[EXISTING]**

**Core pattern** (flex centering — this is what breaks `resizeTo`):
```css
.canvas-host {
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  background: #1a222c;
}

.canvas-placeholder {
  margin: 0;
  font-size: 0.875rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #6b7a8a;
  opacity: 0.7;
}
```

**Apply:** Host becomes `display: block; position: relative; overflow: hidden` (keep `flex: 1 1 auto` and `min-height: 0` so the column still fills above `.hud-bar`). Add `canvas { display: block; width: 100%; height: 100%; }`. Do not `position: fixed` the canvas over `#hud-bar`. Leave the rest of the HUD chrome. `.canvas-placeholder` can stay in CSS; runtime `replaceChildren` removes the node.

`index.html` lines 11–14 stay the mount target:
```html
<div id="game-canvas-host" class="canvas-host" aria-label="Game view">
  <p class="canvas-placeholder">Game view</p>
</div>
```

---

### `src/app/rafClock.ts` (utility, event-driven) — DELETE

**Analog:** `src/app/rafClock.ts` lines 5–20 **[EXISTING]**

```typescript
export function startRafClock(
  onFrame: (deltaMs: number) => void,
): () => void {
  let raf = 0;
  let last = performance.now();

  const frame = (now: number): void => {
    const deltaMs = now - last;
    last = now;
    onFrame(deltaMs);
    raf = requestAnimationFrame(frame);
  };

  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
}
```

**Apply:** Delete the file after `src/main.ts` no longer imports it. Do not leave a second clock beside `app.ticker`. The uncapped `now - last` delta is the bug Pattern 1 replaces with `ticker.deltaMS` + `minFPS = 10`. `CrashGame.tick` still sub-steps at `maxDeltaMs` (see CrashGame assignment).

---

### `src/games/crash/logic/RoundState.ts` (model, transform)

**Analog:** `src/games/crash/logic/RoundState.ts` lines 4–48 **[EXISTING]**

**Core pattern:**
```typescript
export type Phase = "waiting" | "flying" | "cashed_out" | "crashed";

export interface RoundState {
  phase: Phase;
  waitRemainingMs: number;
  elapsedMs: number;
  multiplier: number;
  crashAt: number | null;
  roundId: number;
  lockedBetCents: Cents | null;
  cashOutRequested: boolean;
  autoCashOutAt: number | null;
  settledRoundId: number | null;
}

export interface CrashSnapshot {
  phase: Phase;
  multiplier: number;
  balance: number;
  bet: number | null;
  crashAt: number | null;
  waitRemainingMs: number;
  history: readonly number[];
  roundId: number;
  autoCashOutAt: number | null;
}
```

**Apply:** Add `cashOutAt: number | null` to **both** `RoundState` and `CrashSnapshot`. `createInitialRoundState` sets `cashOutAt: null`. Keep `crashed` on the `Phase` union; it stays non-durable. `autoCashOutAt` is the target; `cashOutAt` is the paid multiplier. Every object literal that builds `RoundState` or `CrashSnapshot` must grow this field: `createInitialRoundState`, `flyingState` in `tests/resolveTick.test.ts` (lines 22–36), `snap` in `enablement.test.ts` (lines 8–21).

---

### `src/games/crash/logic/resolveTick.ts` (service, event-driven)

**Analog:** `src/games/crash/logic/resolveTick.ts` **[EXISTING]** — extend this file; do not add a Pixi import.

**Imports** (lines 1–13) stay inside logic/shared. `.js` suffixes. No `pixi.js`.

**Validation** (`clampDt`, lines 26–29) — copy this guard style into `pathMapping` (non-finite → safe value, do not throw on the frame path):
```typescript
function clampDt(dt: number): number {
  if (!Number.isFinite(dt) || dt <= 0) return 0;
  return Math.min(dt, CRASH_CONFIG.maxDeltaMs);
}
```

**Core pattern to change** — `enterWaiting` (lines 31–43) wipes the flight. Add `cashOutAt: null` here:
```typescript
function enterWaiting(state: RoundState): RoundState {
  return {
    ...state,
    phase: "waiting",
    waitRemainingMs: CRASH_CONFIG.waitDurationMs,
    elapsedMs: 0,
    multiplier: 1,
    crashAt: null,
    lockedBetCents: null,
    cashOutRequested: false,
  };
}
```

**Core pattern to split** — `settleOnce` (lines 59–91) credits, pushes history, then `enterWaiting` in the same call. That is what D-16 replaces for cash-out. Crash (`terminalPhase === "crashed"`) may still push `crashAt` and `enterWaiting` immediately. Cash-out must credit once, set `cashOutAt` to the **paid** multiplier, set `phase: "cashed_out"`, keep `crashAt` / `elapsedMs` / `multiplier`, clear `lockedBetCents`, and **not** push history and **not** call `enterWaiting`.

```typescript
if (state.lockedBetCents != null && state.lockedBetCents > 0) {
  if (terminalPhase === "cashed_out") {
    const payout = payoutCents(
      state.lockedBetCents,
      toMultHundredths(settleMult),
    );
    deps.wallet.credit(payout);
  }
}
deps.history.push(crashAt);
return enterWaiting({ /* ... */ });
```

**Idempotent credit** uses `wallet.credit` (`Wallet.ts` lines 44–47) and `settledRoundId`. Credit only on the flying → `cashed_out` transition. Do not reuse the current early return that calls `enterWaiting` when `settledRoundId === roundId` (lines 65–67) as the spectator-finish path — that aborts the climb.

**Phase gate to replace** (lines 105–107) — today any `cashed_out` / `crashed` snapshot is wiped before publish:
```typescript
if (state.phase === "cashed_out" || state.phase === "crashed") {
  return enterWaiting(state);
}
```

**Flying step to reuse for `cashed_out`** (lines 117–139): `elapsedMs + step`, `roundedMult(multiplierAt(...))`, crash check `m >= crashAt` **before** auto, auto **before** manual. `cashed_out` ticks advance multiplier the same way and crash into `enterWaiting` once. No second credit. `markCashOutRequested` (lines 147–150) already no-ops unless `phase === "flying"` — keep that so `cashed_out` cannot cash out again.

`History.push` (lines 12–17) ignores non-finite values. Push `crashAt` only on the actual crash transition, once per `roundId`.

---

### `src/games/crash/logic/CrashGame.ts` (store, request-response)

**Analog:** `src/games/crash/logic/CrashGame.ts` **[EXISTING]**

**Tick sub-step** (lines 80–87) — keep. View cap (`minFPS`) is separate from this logic cap:
```typescript
tick(deltaMs: number): void {
  let remaining = Number.isFinite(deltaMs) ? Math.max(0, deltaMs) : 0;
  while (remaining > 0) {
    const step = Math.min(remaining, CRASH_CONFIG.maxDeltaMs);
    state = resolveTick(state, step, deps);
    remaining -= step;
  }
}
```

**Snapshot copy** (lines 89–104) — add `cashOutAt: state.cashOutAt`. Do not derive it in the view.
```typescript
getSnapshot(): CrashSnapshot {
  return {
    phase: state.phase,
    multiplier: state.multiplier,
    balance: centsToDisplay(wallet.getBalanceCents()),
    bet:
      state.lockedBetCents != null
        ? centsToDisplay(state.lockedBetCents)
        : null,
    crashAt: state.crashAt,
    waitRemainingMs: state.waitRemainingMs,
    history: history.toArray(),
    roundId: state.roundId,
    autoCashOutAt: state.autoCashOutAt,
  };
}
```

**Command guard** (lines 54–57) — `placeBet` already rejects non-waiting. Leave it. Non-finite display is rejected before cents convert (lines 62–64).

File header (lines 41–44): `No pixi.js / DOM.` Keep that.

---

### `tests/resolveTick.test.ts` (test, event-driven)

**Analog:** `tests/resolveTick.test.ts` lines 14–57 **[EXISTING]**

**Fixture** (`flyingState`, lines 22–36) must include `cashOutAt: null` once the field exists.

**Assertion to rewrite** — manual cash-out currently expects immediate `waiting` and a history row of `crashAt` (lines 44–56):
```typescript
const state = resolveTick(
  flyingState({ cashOutRequested: true, crashAt: 10 }),
  CRASH_CONFIG.maxDeltaMs,
  deps,
);
expect(state.phase).toBe("waiting");
expect(state.settledRoundId).toBe(1);
expect(deps.history.toArray()).toEqual([10]);
```

**Apply:** On the cash-out step expect `phase === "cashed_out"`, `cashOutAt` equal to the paid multiplier, wallet credited **once**, `history` unchanged, `crashAt` still set. A later tick with `m >= crashAt` expects one history row and `waiting` with `waitRemainingMs === 5000`. Same split for the auto cash-out test (lines 137–156). Crash-before-auto tests (lines 73–88, 178–216) stay immediate `waiting` with no payout. Idempotent test (lines 90–115) must not treat a second settle as `enterWaiting` that skips spectator finish — balance still changes only once.

**Test import style** (lines 1–12): Vitest `describe` / `it` / `expect`, relative `.js` imports from `../src/...`.

---

### `tests/walkingSkeleton.test.ts` (test, request-response)

**Analog:** `tests/walkingSkeleton.test.ts` lines 36–46 **[EXISTING]**

```typescript
game.requestCashOut();
game.tick(CRASH_CONFIG.maxDeltaMs);
const settled = game.getSnapshot();
expect(settled.phase).toBe("waiting");
expect(settled.history[0]).toBe(crashAt);
expect(settled.balance).toBeGreaterThan(4900);
```

**Apply:** Split that block. After one `maxDeltaMs` step: balance already up, `cashOutAt` set, phase `cashed_out`, history length still 0. Then loop while phase is `cashed_out` (the spectator loop at lines 57–60 already uses `phase === "flying"` — extend the condition so `cashed_out` also counts as in-round). History gains `crashAt` only after that continued flight crashes, then `waiting`.

---

### `tests/roundCadence.test.ts` (test, event-driven) — KEEP the wait-until-waiting loop

**Analog:** `tests/roundCadence.test.ts` lines 42–62 **[EXISTING]**

```typescript
game.requestCashOut();
game.tick(CRASH_CONFIG.maxDeltaMs);
let guard = 0;
while (game.getSnapshot().phase !== "waiting" && guard < 300_000) {
  game.tick(CRASH_CONFIG.maxDeltaMs);
  guard += CRASH_CONFIG.maxDeltaMs;
}
expect(after.phase).toBe("waiting");
expect(after.waitRemainingMs).toBe(5000);
```

**Apply:** This test already waits until `waiting`. It can keep expecting `waitRemainingMs === 5000` **after** the crash, not on the cash-out tick. Spectator loops that check `phase === "flying"` only (lines 30–32 and 90–92) must also treat `cashed_out` as still in the round if a bet cashed out; the no-bet spectator path never enters `cashed_out`, so those loops stay valid for D-15. Do not assert `waiting` on the tick that processes `requestCashOut`.

---

### `tests/architecture.no-pixi.test.ts` (test, batch)

**Analog:** `tests/architecture.no-pixi.test.ts` **[EXISTING]**

**Keep the source scan** (lines 6–16, 29–47). `LOGIC_DIRS` is only `src/games/crash/logic` and `src/shared`. View code may import `pixi.js`. Logic and shared must not. `DOM_API` is `document` / `window` with a dot — view and `main.ts` are outside this scan.

**Flip the package deny** (lines 49–62):
```typescript
it("package.json must not list pixi.js (vite allowed for Phase 2 shell)", () => {
  // ...
  expect(names.has("pixi.js")).toBe(false);
});
```

**Apply:** Expect `pixi.js` **present** in dependencies. Keep the logic/shared import scan unchanged. Do not add `src/games/crash/view` to `LOGIC_DIRS`.

---

### `src/games/crash/hud/enablement.test.ts` (test, transform)

**Analog:** `src/games/crash/hud/enablement.test.ts` lines 8–52 **[EXISTING]**

**Fixture** — `snap()` (lines 8–21) is the pattern `viewMode` tests should copy. Add `cashOutAt: null` to the base object when the snapshot field exists, or every existing case fails to typecheck.

**Apply:** One new case: `phase: "cashed_out"` with a bet → `canPlaceBet` false and `canCashOut` false. Do not change `enablement.ts` booleans. The comment at `enablement.ts` lines 13–16 (“Durable phases are waiting | flying only”) becomes stale; update that comment only, not the matrix.

**Matrix to preserve** (`enablement.ts` lines 18–31):
```typescript
export function enablementFrom(snap: CrashSnapshot): HudEnablement {
  const waiting = snap.phase === "waiting";
  const flying = snap.phase === "flying";
  const broke = snap.balance < CRASH_CONFIG.minBetCents / 100;
  const hasBet = snap.bet != null;
  return {
    canPlaceBet: waiting && !hasBet && !broke,
    canEditBet: waiting && !hasBet && !broke,
    chipsEnabled: waiting && !hasBet && !broke,
    canCashOut: flying && hasBet,
    canEditAuto: true,
    showBroke: broke,
  };
}
```

---

### `src/games/crash/view/viewConfig.ts` (config, batch)

**Analog:** `src/games/crash/logic/config.ts` lines 1–16 **[EXISTING — role-match]**

```typescript
/** Named tunables for Crash GameLogic (D-01..D-14, D-12). */
export const CRASH_CONFIG = {
  startingBalanceCents: 500_000,
  waitDurationMs: 5_000,
  maxDeltaMs: 100,
} as const;

export type CrashConfig = typeof CRASH_CONFIG;
```

**Apply:** One `as const` object for view-only tokens (hex, stroke widths, hold/fade/flash ms, plot pads, bob). Do not put settlement timing here. Do not import this from `logic/`. Lock the RESEARCH discretion numbers in this file rather than scattering them: `SCALE_HEADROOM` 1.25, `SCALE_FLOOR` 2, `PLOT_TOP_RATIO` 0.36, `SAMPLE_COUNT` 64, halo 16 / core 4, climb `0x3dff8a`, crash `0xff3b4e`, hold 1000, fade 400, flash 160 at alpha 0.5.

---

### `src/games/crash/view/viewMode.ts` (utility, transform)

**Analog:** `src/games/crash/hud/enablement.ts` **[EXISTING — role-match]** — pure function of a snapshot, no Pixi, no wallet.

**Apply:** Same shape as `enablementFrom`: import `CrashSnapshot` type only, return a plain object (`mode`, rocket visible, latched cash-out ×, theater alpha/tint inputs). Modes: `idle` | `climb` | `crash_hold` | `crash_fade`. Previous mode in, next mode out. Timers accumulate `deltaMS` passed in; they do not call `tick` and do not read `waitRemainingMs`. Boot `waiting` is `idle`. Only climb → `waiting` enters `crash_hold`. Clear latched cash-out × when fade completes.

**Do not copy** `MultiplierCurve.ts`. View mode does not compute multipliers.

---

### `src/games/crash/view/pathMapping.ts` (utility, transform)

**Analog:** `src/games/crash/hud/format.ts` lines 7–11 **[EXISTING — role-match]** for the non-finite guard. Math style resembles `multiplierAt` but **must not import it**.

```typescript
export function formatMult(m: number): string {
  if (!Number.isFinite(m)) return "—";
  return `${m.toFixed(2)}×`;
}
```

**Anti-pattern — do not call from the view** (`MultiplierCurve.ts` lines 10–16). This is the only producer of `snapshot.multiplier`, inside `resolveTick`:
```typescript
export function multiplierAt(
  elapsedMs: number,
  growthRatePerMs: number = CRASH_CONFIG.growthRatePerMs,
): number {
  const raw = Math.exp(growthRatePerMs * Math.max(0, elapsedMs));
  return fromMultHundredths(toMultHundredths(raw));
}
```

**Apply:** Pixi-free `plotScaleFor` / `plotPoint` / tangent `atan2` as specified in RESEARCH Pattern 3. Non-finite multiplier returns the origin and does not throw. No `pixi.js` import. Vitest asserts the D-03 slope with a finite difference.

---

### `tests/pathMapping.test.ts` (test, transform)

**Analog:** `tests/multiplierCurve.test.ts` lines 1–38 **[EXISTING — role-match]**

```typescript
import { describe, expect, it } from "vitest";
import { multiplierAt } from "../src/games/crash/logic/MultiplierCurve.js";

describe("multiplierCurve — PLAY-02 / D-09..D-12", () => {
  it("equals 1.00 at 0ms and 2.00 near 2500ms (D-09)", () => {
    expect(multiplierAt(0, r)).toBe(1.0);
  });
  it("uses smooth exponential e^(r·t), not linear (D-10)", () => {
    expect(actual).toBe(expected);
    expect(actual).not.toBe(linear);
  });
});
```

**Apply:** Same `describe` / `it` / `expect` and `../src/...js` imports. Assert origin at m=1, steeper slope after 2× than from 1× to 2×, and non-finite does not yield NaN. No canvas, no `pixi.js`.

---

### `tests/viewMode.test.ts` (test, transform)

**Analog:** `src/games/crash/hud/enablement.test.ts` lines 8–21 and 43–52 **[EXISTING — role-match]**

Copy the `snap(partial)` factory. Drive the reducer with hand-built snapshots (`flying` → `waiting`, `cashed_out` with `cashOutAt`, boot `waiting`). Assert mode, hidden-rocket flag, and latch clear. No Pixi.

---

### `src/games/crash/view/mountCrashView.ts` (service, event-driven)

**Analog:** `src/main.ts` missing-root throw + `CrashHud.ts` lines 15–54 **[EXISTING — role-match]** for “mount returns a small API”. Pixi `Application` init is **[ESTABLISH]** (RESEARCH Pattern 7). There is no Application in the repo.

**Mount throw pattern to copy** (`CrashHud.ts` lines 38–54):
```typescript
if (!betInput || !autoInput || /* ... */) {
  throw new Error("CrashHud: required #hud-bar fields missing");
}
```

**Return a narrow API** (`CrashHud.ts` lines 7–9, 166):
```typescript
export interface CrashHud {
  render(snap: CrashSnapshot): void;
}
return { render };
```

**Apply:** `mountCrashView(host)` returns `{ app, scene, destroy }`. `new Application()` with **no** constructor options. `await app.init({ resizeTo: host, background: 0x070b14, antialias: true, autoDensity: true, resolution: Math.min(window.devicePixelRatio || 1, 2), preference: "webgl", autoStart: true, sharedTicker: false })`. `host.replaceChildren(app.canvas)` then `app.resize()`. Import only from `"pixi.js"`.

---

### `src/games/crash/view/CrashScene.ts` (component, event-driven)

**Analog:** `CrashHud.ts` `render` lines 135–166 **[EXISTING — role-match]**

```typescript
function render(snap: CrashSnapshot): void {
  balance.textContent = formatMoney(snap.balance);
  phase.textContent = snap.phase;
  liveMult.textContent = formatMult(snap.multiplier);
  const en = enablementFrom(snap);
  placeBet.disabled = !en.canPlaceBet;
  cashOut.disabled = !en.canCashOut;
  renderHistoryStrip(history, snap.history);
}
```

**Apply:** `sync(snap, deltaMS)` is the Pixi twin of `render`. Read snapshot fields only. No `placeBet`, `requestCashOut`, `wallet.credit`, or `multiplierAt`. Call `viewMode` then tell Backdrop / CurveGraph / Rocket / TheaterText what to draw. Rebuild backdrop on resize only (compare `app.screen` width/height). Resample the trail only in `climb` (and once when entering hold). Fade with `alpha`, not `clear()` on the backdrop.

**DOM safety analog** if any text leaks to HTML — do not. `historyStrip.ts` lines 22–31 uses `textContent` and `replaceChildren`, never `innerHTML`. Theater × stays on `BitmapText.text`.

---

### `src/games/crash/view/TheaterText.ts` (component, transform)

**Analog:** `format.ts` lines 7–11 and `CrashHud.ts` line 138 **[EXISTING — partial]**

```typescript
liveMult.textContent = formatMult(snap.multiplier);
```

**Apply:** Import `formatMult` from `../hud/format.js`. Two `BitmapText` nodes (live ~64, frozen cash-out ~28). Per-frame: assign `.text = formatMult(...)` and `.tint`. Do not change `fontSize` per frame. Do not use `innerHTML`. Position from `viewConfig` (upper third, y ≈ `0.18 * height`; frozen × ~48px below). BitmapText constructor options are **[ESTABLISH]** from RESEARCH Pattern 6 — this repo has no `Text` or `BitmapText`.

---

## Shared Patterns

### ESM imports

**Source:** `src/main.ts` lines 1–4, `src/games/crash/logic/index.ts` lines 1–9
**Apply to:** Every new `.ts` file

Relative imports use a `.js` suffix (`from "./config.js"`, `from "../logic/index.js"`). No path aliases. Barrel `logic/index.ts` re-exports `createGame` and `CrashSnapshot`; view may import the type from `../logic/index.js`. Do not add view exports to that barrel.

### No auth

Client-only demo. No middleware, tokens, or guards. Command authority stays on `CrashGame` (`placeBet` rejects non-waiting and non-finite amounts, `CrashGame.ts` lines 54–64). The scene has no command methods.

### Error handling

**Source:** `src/main.ts` lines 8–9; `CrashHud.ts` lines 38–54; `resolveTick.ts` lines 26–29; `format.ts` lines 2–10; `History.ts` lines 12–13; `Wallet.ts` lines 44–47
**Apply to:** Mount vs pure functions

- Missing DOM root: `throw new Error("...")`.
- Frame path and money/RNG: non-finite input returns a safe value or no-ops. Do not throw from `sync` or `pathMapping`.

### Snapshot is the only view input

**Source:** `CrashHud.ts` lines 11–14 and 135–156; `CrashGame.ts` lines 41–44 and 89–104
**Apply to:** `CrashScene`, `viewMode`, `pathMapping`, `TheaterText`

HUD and Pixi both read `getSnapshot()` after `tick`. View does not settle the wallet, push history, or sample `crashAt`. `formatMult` is the display string for both HUD live × and theater × (2dp + `×`).

### Vitest node

**Source:** `vitest.config.ts` lines 1–8
**Apply to:** `pathMapping.test.ts`, `viewMode.test.ts`, and updated logic tests

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
  },
});
```

Do not add jsdom, Playwright, or `@vitest/browser` for the canvas. Spectacle stays a manual `npm run dev` check.

### ARCH-02 boundary

**Source:** `tests/architecture.no-pixi.test.ts` lines 6–16
**Apply to:** All logic edits and all view files

`pixi.js` and `document.` / `window.` are forbidden under `src/games/crash/logic/` and `src/shared/`. They are allowed in `src/games/crash/view/` and `src/main.ts`.

## No Analog Found

Files with no close match in the codebase (planner should use RESEARCH.md patterns instead):

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/games/crash/view/Backdrop.ts` | component | batch | No Graphics, FillGradient, or sprite scene. Establish from RESEARCH Pattern 7 backdrop paragraph: gradient + clouds + stars + dim grid, rebuild on resize only, no parallax. |
| `src/games/crash/view/CurveGraph.ts` | component | transform | No stroke/polyline code. Establish from RESEARCH Pattern 4: two sibling `Graphics` (halo + core), `clear` / `moveTo` / `lineTo` / `stroke` while climbing, red sever at 94% plus a gap stub. Do not nest children in `Graphics`. v7 `beginFill` / `lineStyle` do not exist here and must not be introduced. |
| `src/games/crash/view/Rocket.ts` | component | event-driven | No Container/Sprite. Establish from RESEARCH Pattern 5: parent `Container` holds position + tangent rotation; geometric body; `setBodyTexture` seam; eight circle `Graphics` for the streak. No `ParticleContainer`, no `Assets.load`. |

`mountCrashView.ts` init options and `TheaterText.ts` `BitmapText` constructors are also **[ESTABLISH]** (Patterns 6 and 7) even though their surrounding lifecycle has a role-match analog.

## Metadata

**Analog search scope:** `src/`, `tests/`, `package.json`, `index.html`, `vitest.config.ts`, `tsconfig.json`
**Files scanned:** 22 tracked TS/CSS sources under `src/` plus 8 tests (pattern extraction stopped after the HUD binder, logic facade, config, and Vitest fixtures)
**Pattern extraction date:** 2026-09-27
**Tracked-source gate:** every analog path in this file is listed by `git ls-files`
