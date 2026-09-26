---
phase: 03-pixi-hybrid-view
reviewed: 2026-09-26T22:40:00Z
depth: standard
files_reviewed: 24
files_reviewed_list:
  - package.json
  - package-lock.json
  - src/games/crash/hud/enablement.test.ts
  - src/games/crash/hud/enablement.ts
  - src/games/crash/logic/CrashGame.ts
  - src/games/crash/logic/resolveTick.ts
  - src/games/crash/logic/RoundState.ts
  - src/games/crash/view/Backdrop.ts
  - src/games/crash/view/CrashScene.ts
  - src/games/crash/view/CurveGraph.ts
  - src/games/crash/view/mountCrashView.ts
  - src/games/crash/view/pathMapping.ts
  - src/games/crash/view/Rocket.ts
  - src/games/crash/view/TheaterText.ts
  - src/games/crash/view/viewConfig.ts
  - src/games/crash/view/viewMode.ts
  - src/main.ts
  - src/styles/hud.css
  - tests/architecture.no-pixi.test.ts
  - tests/pathMapping.test.ts
  - tests/resolveTick.test.ts
  - tests/roundCadence.test.ts
  - tests/viewMode.test.ts
  - tests/walkingSkeleton.test.ts
findings:
  critical: 1
  warning: 3
  info: 5
  total: 9
status: issues
---

# Phase 03: Code Review Report

**Reviewed:** 2026-09-26T22:40:00Z
**Depth:** standard
**Files Reviewed:** 24
**Status:** issues

## Summary

Phase 03 hybrid view is structurally solid for VIS-01: single capped `app.ticker` drives `tick → HUD → scene.sync`, pure `pathMapping`/`viewMode`, neon trail + tangent rocket + sever/flash/bob, durable D-16 `cashed_out` + `cashOutAt` with history-on-crash-only, and TheaterText dual-read via `BitmapText.text = formatMult` (no XSS surface). ARCH-02 holds (`logic`/`shared` free of pixi/DOM). Vitest suite green (64). One money-integrity Critical remains (`resetWallet`); D-16 also makes bet-less `requestCashOut` a durable lockout, and backdrop rebuild orphans Graphics on resize.

## Critical Issues

### CR-01: `resetWallet` still leaves locked bet — free payout after balance restore

**File:** `src/games/crash/logic/CrashGame.ts:107-109`
**Issue:** Carry-forward from Phase 1/2. `resetWallet()` only calls `wallet.reset()`. With a locked stake (waiting or flying), Reset demo restores 5000.00 while `lockedBetCents` remains. Cash-out credits `payoutCents(lockedBet, mult)` with no matching post-reset deduction — balance climbs above the starting amount. Phase 3 makes this worse for the playable path: durable `cashed_out` still pays once, then spectator-finishes until `crashAt`.
**Fix:**
```typescript
resetWallet(): void {
  wallet.reset();
  state = {
    ...state,
    lockedBetCents: null,
    cashOutRequested: false,
    // optional: clear cashOutAt / force waiting if mid-round is undesirable
  };
}
```

## Warnings

### WR-01: `setAutoCashOut` still accepts targets below 1.00× (instant sub-stake settle)

**File:** `src/games/crash/logic/resolveTick.ts:183-194`
**Issue:** Carry-forward. Finite targets are only rounded to 2dp. Values like `0.5` / `0` store and fire on the first flying tick (`m >= autoAt`), paying a sub-stake credit into durable `cashed_out`. HUD `min="1.01"` is advisory only.
**Fix:** Reject or clamp in `setAutoCashOutTarget` (`!Number.isFinite(target) || target < 1` → no-op or `Math.max(1, roundedMult(target))`).

### WR-02: Bet-less `requestCashOut` enters durable `cashed_out` (D-16 lockout)

**File:** `src/games/crash/logic/resolveTick.ts:178-181`, `77-104`
**Issue:** `markCashOutRequested` only requires `phase === "flying"`. A spectator (or any caller) can set `cashOutRequested` with `lockedBetCents == null`. `cashOutToSpectator` skips the wallet credit but still sets `phase: "cashed_out"`, `cashOutAt`, and `settledRoundId`. Under D-16 the round stays non-waiting until `crashAt`, so place-bet stays blocked for the rest of the climb. HUD `canCashOut: flying && hasBet` hides the button; the facade API does not.
**Fix:**
```typescript
export function markCashOutRequested(state: RoundState): RoundState {
  if (state.phase !== "flying" || state.lockedBetCents == null) return state;
  return { ...state, cashOutRequested: true };
}
```

### WR-03: Backdrop `removeChildren()` on resize orphans Graphics (GPU leak)

**File:** `src/games/crash/view/Backdrop.ts:19-20`, `94-97`
**Issue:** `rebuild` calls `container.removeChildren()` then allocates new sky/clouds/stars/grid Graphics. Removed children are not `destroy()`ed. Repeated host resizes (dev tools, window drag, `resizeTo`) accumulate orphaned GPU resources. Pattern intent (rebuild-on-resize only) is correct; teardown is incomplete.
**Fix:**
```typescript
function rebuild(w: number, h: number): void {
  const old = container.removeChildren();
  for (const child of old) child.destroy({ children: true });
  // ... rebuild layers
}
```

## Info

### IN-01: `crash_hold` / `crash_fade` ignore a new `flying` phase until idle

**File:** `src/games/crash/view/viewMode.ts:74-107`
**Issue:** Hold/fade branches only advance timers; they do not abort into `climb` if `snap.phase` becomes `flying`. Safe today because `waitDurationMs` (5000) ≫ `HOLD_MS + FADE_MS` (1400), so idle is reached before the next launch. If wait is shortened later, early climb frames are skipped until fade completes.
**Fix:** Optional early exit: if `isClimbPhase(snap.phase)` during hold/fade, jump to climb (and clear crash latches as needed).

### IN-02: Climb path reallocates `SAMPLE_COUNT` plot points every sync frame

**File:** `src/games/crash/view/CrashScene.ts:141-147`
**Issue:** Each climb frame builds a 64-point array and fully `redraw`s halo+core Graphics. Fine for a portfolio demo; optional reuse of a scratch buffer or redraw only when multiplier hundredths change.
**Fix:** Cache last tip hundredths; skip `samplePoints`/`redraw` when unchanged.

### IN-03: Production teardown only on HMR; `mountCrashView` has no `destroy`

**File:** `src/main.ts:27-34`, `src/games/crash/view/mountCrashView.ts:14-31`
**Issue:** Ticker remove + `app.destroy` run only under `import.meta.hot.dispose`. Cold loads never unregister the ticker on navigation away. Patterns doc suggested returning `destroy` from mount; composition root owns lifecycle instead — acceptable for a single-page demo, but no explicit unmount API.
**Fix:** Return `{ app, scene, destroy }` from `mountCrashView` and call it from any future shell teardown.

### IN-04: Theater / path / architecture look good; residual hygiene

**Files:** `TheaterText.ts`, `pathMapping.ts`, `tests/architecture.no-pixi.test.ts`, `package.json:6`, `viewMode.ts:4`
**Issue:** XSS mitigated (formatMult → BitmapText.text; no innerHTML). Non-finite plot bails to origin. ARCH-02 deny-list still matches only bare `pixi.js` (not `pixi.js/...` / `@pixi/*`) under logic/shared — adequate while those dirs stay clean. `package.json` description still says “GameLogic Core”. Stale viewMode comment (“cashOutAt until plan 03-02”).
**Fix:** Cosmetic: update description/comment; optionally tighten the import regex before any logic-side renderer creep.

### IN-05: No automated pixel coverage for VIS-01 spectacle

**File:** `src/games/crash/view/CrashScene.ts`, `Rocket.ts`, `Backdrop.ts`
**Issue:** Unit tests lock reducers, path mapping, settle, and architecture. Neon trail, tangent nose, sever gap, flash alpha, idle bob, and dual × layout remain human UAT (plans flag `human_judgment: true`). Expected for Node Vitest without WebGL.
**Fix:** End-of-phase manual `/gsd-verify-work` / UAT; defer browser harness to a later phase if desired.

---

## What looks good

- **VIS-01 wiring:** Curve + rocket on `plotPoint`/`pathTangentRadians`; climb treats `cashed_out` as climb; climb→waiting severs red and hides rocket; flash is Graphics alpha only (no `stage.x`/`stage.y`).
- **D-16 settle:** Single credit into durable `cashed_out`, `cashOutAt` latched, multiplier climbs until `crashAt`, `history.push` only on crash; enablement blocks place/cash-out while spectator-finishing.
- **Clock:** One `app.ticker` callback (`minFPS` 10), `rafClock` deleted from tree, `deltaMS` only into `game.tick`.
- **Boundaries:** View reads snapshots only (no wallet/settle/`multiplierAt`); ARCH-02 scan green; `pixi.js@8.21.0` from registry tarball.
- **Theater XSS:** `formatMult` → `BitmapText.text` + tint ramp; frozen × from latched `cashOutAt`.
- **Tests:** resolveTick / walkingSkeleton / viewMode / pathMapping / enablement / architecture cover the D-16 and VIS-01 contracts that Node can assert (64 passing).

---

_Reviewed: 2026-09-26T22:40:00Z_
_Reviewer: Composer (gsd-code-reviewer)_
_Depth: standard_
