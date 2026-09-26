---
phase: 01-gamelogic-core
reviewed: 2026-09-26T17:55:00Z
depth: standard
files_reviewed: 21
files_reviewed_list:
  - package.json
  - tsconfig.json
  - vitest.config.ts
  - src/shared/money/cents.ts
  - src/shared/rng/createRng.ts
  - src/games/crash/logic/config.ts
  - src/games/crash/logic/RoundState.ts
  - src/games/crash/logic/Wallet.ts
  - src/games/crash/logic/CrashRng.ts
  - src/games/crash/logic/MultiplierCurve.ts
  - src/games/crash/logic/History.ts
  - src/games/crash/logic/resolveTick.ts
  - src/games/crash/logic/CrashGame.ts
  - src/games/crash/logic/index.ts
  - tests/walkingSkeleton.test.ts
  - tests/crashRng.test.ts
  - tests/wallet.test.ts
  - tests/roundCadence.test.ts
  - tests/resolveTick.test.ts
  - tests/architecture.no-pixi.test.ts
  - tests/multiplierCurve.test.ts
findings:
  critical: 1
  warning: 1
  info: 3
  total: 5
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-09-26T17:55:00Z
**Depth:** standard
**Files Reviewed:** 21
**Status:** issues_found

## Summary

GameLogic Core is mostly solid: integer-cent settlement, seeded `(1−e)/U` crash sampling, exponential climb with hundredths compares, and a single `resolveTick` authority with crash → auto → manual ordering. Vitest suite is green (37). One money-integrity bug in `resetWallet` must be fixed before HUD wires that control; auto cash-out also lacks a floor bound.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: `resetWallet` leaves locked bet — free payout after balance restore

**File:** `src/games/crash/logic/CrashGame.ts:106-108`
**Issue:** `resetWallet()` only calls `wallet.reset()`. If a bet was already placed (`lockedBetCents` set, stake deducted), reset restores the full starting balance while the lock remains. On cash-out, `settleOnce` credits `payoutCents(lockedBet, mult)` without a matching post-reset deduction — demo balance increases above the starting amount (probed: place 100 → reset → cash-out ≈ 5103 from 5000). Also blocks a new `placeBet` via `bet_already_placed` while still carrying the stale lock.
**Fix:**
```typescript
resetWallet(): void {
  wallet.reset();
  state = {
    ...state,
    lockedBetCents: null,
    cashOutRequested: false,
  };
}
```
Prefer also clearing any in-flight stake semantics explicitly in docs/tests (`tests/wallet.test.ts` should cover placeBet → resetWallet → settle leaves balance at starting).

## Warnings

### WR-01: `setAutoCashOut` accepts targets below 1.00× (instant sub-stake settle)

**File:** `src/games/crash/logic/resolveTick.ts:152-163`
**Issue:** Finite targets are only rounded to 2dp. Values like `0.5` or `0` are stored and, on the first flying tick, `m >= autoAt` fires immediately. Probed: bet 100 + `setAutoCashOut(0.5)` → settle pays 50¢ display units (balance 4950). No floor at `1` / `crashFloor`, so HUD typos or bad bindings can force near-instant partial losses.
**Fix:**
```typescript
export function setAutoCashOutTarget(
  state: RoundState,
  target: number | null,
): RoundState {
  if (target == null) {
    return { ...state, autoCashOutAt: null };
  }
  if (!Number.isFinite(target) || target < 1) {
    return state; // or clamp to Math.max(1, roundedMult(target))
  }
  return { ...state, autoCashOutAt: roundedMult(target) };
}
```

## Info

### IN-01: Terminal phases `cashed_out` / `crashed` are never observable via facade

**File:** `src/games/crash/logic/resolveTick.ts:83-90`
**Issue:** `settleOnce` passes `phase: terminalPhase` into `enterWaiting`, which overwrites `phase` to `"waiting"`. The top-of-`resolveTick` branch for `cashed_out`/`crashed` is effectively dead for `createGame` consumers; snapshots jump flying → waiting. Fine for D-13 continuous cadence, but Phase 2 HUD cannot read a terminal outcome from `phase` alone (must infer from balance/history).
**Fix:** Either emit a one-tick terminal phase before waiting, or add `lastOutcome: { kind, mult, roundId } | null` on `CrashSnapshot`.

### IN-02: `getSnapshot()` exposes live `crashAt` while flying

**File:** `src/games/crash/logic/CrashGame.ts:98`
**Issue:** Snapshot includes the pre-sampled crash point during flight. Useful for tests; any HUD that binds the snapshot wholesale would spoil/cheat the round (client-only demo, so low risk).
**Fix:** Omit `crashAt` from the public snapshot (keep a test-only accessor) or document that view layers must not display it.

### IN-03: ARCH-02 deny-list only matches bare `pixi.js`

**File:** `tests/architecture.no-pixi.test.ts:12-13`
**Issue:** Regex rejects `pixi.js` / `document.` / `window.` but not subpath imports (e.g. `pixi.js/gif`) or `@pixi/*` packages. Adequate for Phase 1 (no renderer deps); tighten before Phase 2 adds the shell.
**Fix:** Extend the pattern to `pixi\\.js(?:/[^'"]*)?` and optionally `@pixi/`.

---

_Reviewed: 2026-09-26T17:55:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
