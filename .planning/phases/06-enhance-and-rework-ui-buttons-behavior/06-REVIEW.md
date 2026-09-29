---
phase: 06-enhance-and-rework-ui-buttons-behavior
reviewed: 2026-09-29T16:25:00Z
depth: standard
files_reviewed: 20
files_reviewed_list:
  - index.html
  - src/games/crash/hud/autoBet.test.ts
  - src/games/crash/hud/autoBet.ts
  - src/games/crash/hud/chips.test.ts
  - src/games/crash/hud/chips.ts
  - src/games/crash/hud/chromeMode.ts
  - src/games/crash/hud/CrashHud.ts
  - src/games/crash/hud/enablement.ts
  - src/games/crash/hud/primaryChrome.test.ts
  - src/games/crash/hud/primaryChrome.ts
  - src/games/crash/logic/config.ts
  - src/games/crash/view/CrashScene.ts
  - src/games/crash/view/pathMapping.ts
  - src/games/crash/view/viewConfig.ts
  - src/main.ts
  - src/styles/hud.css
  - tests/multiplierCurve.test.ts
  - tests/pathMapping.test.ts
  - tests/resolveTick.test.ts
  - tests/shell.hud-layout.test.ts
findings:
  critical: 0
  warning: 3
  info: 5
  total: 8
status: issues
---

# Phase 06: Code Review Report

**Reviewed:** 2026-09-29T16:25:00Z
**Depth:** standard
**Files Reviewed:** 20
**Status:** issues

## Summary

Phase 06 lands the JetX-like shell, dual-line primary, Auto bet waiting-edge, climb retune (`LN2/3750`), and arcade world-Container camera with silent `?seed=` — matching plan must_haves and threat mitigations for chips fill-only, spectator no fake win, single auto `placeBet` site, no `stage.x/y`, and textContent binders. No new Critical money/XSS defects in scope. Three warnings: Auto bet `getStake` coerces non-finite input to min bet (manual path rejects), keyboard cash-out still stacks on HMR (carry-forward), and 100dvh `overflow: hidden` can clip controls on short landscape viewports.

## Critical Issues

None in Phase 06 reviewed files.

_Prior open (out of this wave’s implementation, still playable): `resetWallet` / locked-bet free payout (Phases 1–3 CR-01) — `CrashHud` still wires Reset demo to `game.resetWallet()` without clearing `lockedBetCents`. Auto bet (UI-03) can re-place on the next waiting edge after Reset restores balance, which amplifies the oddity but does not newly invent the settle bug. Not re-scored here as a Phase 06 finding._

## Warnings

### WR-01: Auto bet `getStake` places min bet on non-finite input; manual BET rejects

**File:** `src/games/crash/hud/CrashHud.ts:210-212`, `378-381`; `src/main.ts:54`
**Issue:** Manual primary uses `Number(bet.value)` and lets GameLogic return `invalid_amount` when non-finite. Auto bet reads `getStake()`, which maps non-finite values to `DISPLAY_MIN` (10) and successfully `placeBet`s. Garbage / cleared-to-invalid stake text (e.g. pasted non-numeric) therefore drains the demo wallet via Auto bet while the same field value cannot be submitted manually — breaks the “same command boundary” intent of T-6-02-01 / D-13.
**Fix:** Align paths — return the raw finite parse or reject:

```typescript
getStake: () => {
  const n = Number(bet.value);
  return n; // let placeBet reject invalid_amount / below_min
},
```

Optionally call `stopAutoBet` on `invalid_amount` / `below_min` / `above_max` so a bad field does not silently no-op every waiting edge.

### WR-02: Window keydown cash-out listener still stacks on HMR remount

**File:** `src/games/crash/hud/CrashHud.ts:311-320`, `src/main.ts:74-84`
**Issue:** Phase 05 WR-02 remains open. `mountCrashHud` registers a permanent `window` `keydown` listener; `import.meta.hot.dispose` tears down ticker/audio/Pixi but never removes that listener or remounts HUD with cleanup. Each Vite HMR cycle that re-runs `main()` adds another handler — Space/Enter can fire `requestCashOut` N times. Phase 06 retargeted CrashHud / main without closing this footgun.
**Fix:** Return `dispose` from `mountCrashHud` that `removeEventListener`s the same handler reference; call it from `hot.dispose` before remount.

### WR-03: 100dvh `overflow: hidden` can clip bottom controls on short viewports

**File:** `src/styles/hud.css:7-24`, `108-121`; `index.html` shell zones
**Issue:** UI-01 requires no page scroll via `html/body/.app-shell { height: 100dvh; overflow: hidden }`. Top chrome + history band + bottom auto/action rows are `flex: 0 0 auto`; canvas is the only shrinker (`min-height: 0`). On short landscape heights (or when `.action-row` stacks column at ≤390px), intrinsic control height can exceed leftover viewport — content is clipped with no scroll escape, so primary / Auto bet may become unreachable. Shell layout tests check selectors only, not height budget.
**Fix:** Cap or scroll the `#hud-bar` band (`overflow-y: auto; max-height: …`) while keeping page scroll locked, or shrink zone rem budgets further after device QA.

## Info

### IN-01: Auto bet composition wiring has no integration / DOM tests

**File:** `src/main.ts:42-66`, `src/games/crash/hud/autoBet.test.ts`
**Issue:** `shouldAutoPlaceBet` is well table-tested (9 cases). The composition-root path — `hud.getStake()` → `placeBet` → `bet_lock` / `stopAutoBet` on broke — and CrashHud dual-line primary click path rely on code review + manual UAT. Same gap pattern as Phase 05 keyboard/seed binders.
**Fix:** Optional happy-dom or thin harness: toggle Auto bet ON → advance snapshot waiting-edge → assert one `placeBet`; insufficient stake → assert flag cleared and Reset emphasized.

### IN-02: `maxAffordableStake` returns `DISPLAY_MAX` for non-finite balance

**File:** `src/games/crash/hud/chips.ts:20-26`
**Issue:** `!Number.isFinite(balanceDisplay)` returns max bet rather than `0` / broke. Wallet snapshots are always finite today, so production risk is low; a defensive broke path would match `formatMoney`’s non-finite → `"—"` style.
**Fix:** Optional: `if (!Number.isFinite(balanceDisplay)) return 0`.

### IN-03: Crash-hold camera freeze ignores resize after latch

**File:** `src/games/crash/view/CrashScene.ts:106-117`, `169-176`
**Issue:** `ensurePlot` rebuilds plot and clears `holdDrawn` on resize, but `frozenWorld` keeps the pre-resize offset. Sever redraws in new plot space while the world camera stays latched — craft/trail can sit off-center until idle resets identity. D-19 freeze is intentional; rotate/resize during the ~1s hold is uncommon.
**Fix:** Optional: null `frozenWorld` on resize, or recompute lock from latched tip + new `craftLockPoint()`.

### IN-04: Legacy `chromeModeFrom` retained unused by CrashHud

**File:** `src/games/crash/hud/chromeMode.ts`
**Issue:** Promote-cashout helper and CSS rules are retired from the live binder; module kept “for existing unit tests.” Dead API surface for readers of Phase 6 chrome.
**Fix:** Delete with its tests in a cleanup pass, or mark `@deprecated` and point to `primaryChromeFrom`.

### IN-05: Space/Enter on focused primary can double-invoke `requestCashOut`

**File:** `src/games/crash/hud/CrashHud.ts:226-235`, `311-320`
**Issue:** `isEditableTarget` ignores `BUTTON`. With primary focused during flying+bet, native button activation and the window keydown handler can both call `requestCashOut` once. Likely idempotent via `markCashOutRequested`; low user impact.
**Fix:** Optional: skip keydown when `e.target === primary` or when `target.closest("[data-action=primary]")`.

## What looks good

- **UI-01/UI-02 shell + primary:** 100dvh column zones; single `data-action=primary`; `primaryChromeFrom` covers BET / live CASH OUT / frozen CASHED OUT / spectator no fake win; English labels only; no dual-bet; canvas `pointer-events: none` + shell test bans monetary attrs in host.
- **WALT-03Δ/04Δ:** Presets 20/50/100 + ALL fill-only via `maxAffordableStake`; chip handlers never `placeBet`; Auto CO OFF → `setAutoCashOut(null)` + dim/disable ± field.
- **UI-03 Auto bet:** Pure `shouldAutoPlaceBet` waiting-edge + mid-wait toggle ON; single composition-root place in `main.ts`; `bet_lock` on ok; broke/insufficient → `stopAutoBet` without `resetWallet`; GameLogic untouched for Auto bet.
- **FEEL-01:** `growthRatePerMs = Math.LN2 / 3750`; houseEdge/floor/cap untouched; multiplierCurve + resolveTick fixtures aligned to 3750 → 2×.
- **FEEL-02 / PLSH-03Δ:** World Container camera (no `stage.x/y`); soft plot blend + `gentleTiltRadians` clamp; crash freezes `frozenWorld`; theater/flash screen-fixed; `seedChip.ts` deleted; silent `parseBootSeed` → `createGame({ seed })` only; amounts/history/stats via `textContent`.
- **Threat model holds in reviewed code:** T-6-01-01..04, T-6-02-01..03, T-6-04-01..04 mitigations present (validation reuse, textContent, pointer-events, spectator branch, single place site, world camera, silent seed).

---

_Reviewed: 2026-09-29T16:25:00Z_
_Reviewer: Composer (gsd-code-reviewer)_
_Depth: standard_
