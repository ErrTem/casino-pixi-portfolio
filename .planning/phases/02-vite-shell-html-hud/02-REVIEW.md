---
phase: 02-vite-shell-html-hud
reviewed: 2026-09-26T19:05:00Z
depth: standard
files_reviewed: 17
files_reviewed_list:
  - index.html
  - package.json
  - package-lock.json
  - src/app/rafClock.ts
  - src/games/crash/hud/chips.test.ts
  - src/games/crash/hud/chips.ts
  - src/games/crash/hud/CrashHud.ts
  - src/games/crash/hud/enablement.test.ts
  - src/games/crash/hud/enablement.ts
  - src/games/crash/hud/format.ts
  - src/games/crash/hud/historyStrip.test.ts
  - src/games/crash/hud/historyStrip.ts
  - src/main.ts
  - src/styles/hud.css
  - tests/architecture.no-pixi.test.ts
  - tsconfig.json
  - vite.config.ts
findings:
  critical: 1
  warning: 1
  info: 5
  total: 7
status: issues
---

# Phase 02: Code Review Report

**Reviewed:** 2026-09-26T19:05:00Z
**Depth:** standard
**Files Reviewed:** 17
**Status:** issues

## Summary

Vite shell + HTML HUD is structurally sound: commands-in/snapshots-out binder, enablement matrix, chips fill-only (no auto-`placeBet`), history via `createElement`/`textContent`, stoppable rAF clock, ARCH-02 still keeps `pixi.js` out of deps. Unit tests for chips/enablement/history/architecture are green (15). One money-integrity Critical is newly playable through **Reset demo**; auto-CO input lacks a floor.

## Critical Issues

### CR-01: Reset demo exposes free payout (locked bet survives `resetWallet`)

**File:** `src/games/crash/hud/CrashHud.ts:126-130` (wires `game.resetWallet()`; defect in `CrashGame.resetWallet`)
**Issue:** Phase 2 surfaces **Reset demo** in the left zone. `resetWallet()` only restores wallet cents and does **not** clear `lockedBetCents`. Playable path: Place bet → Reset demo (while waiting or mid-flight) → Cash out → balance rises above the 5000.00 starting amount (probed: place 100 → reset → fly → cash-out → **5133**). HUD also keeps Reset enabled whenever a stake is locked, so the control amplifies Phase 1 CR-01 into a one-click demo exploit.
**Fix:** Prefer fixing the facade (clear lock + cash-out intent on reset). Optional HUD mitigation until then: disable Reset while `snap.bet != null` (and/or while `flying`).

```typescript
// CrashGame.resetWallet — clear stake lock with wallet restore
resetWallet(): void {
  wallet.reset();
  state = {
    ...state,
    lockedBetCents: null,
    cashOutRequested: false,
  };
}
```

## Warnings

### WR-01: Auto CO input does not enforce `min="1.01"` / crash floor before `setAutoCashOut`

**File:** `src/games/crash/hud/CrashHud.ts:112-116`
**Issue:** `applyAutoCo` does `game.setAutoCashOut(Number(raw))` with no client-side floor. HTML `min="1.01"` is advisory only (no form submit validation). Values like `0.5` / `0` reach GameLogic (Phase 1 WR-01), which stores them and can auto-settle instantly for a sub-stake payout. Clear/empty → `null` is fine; non-finite is ignored by logic, but sub-1.00 finite values are accepted.
**Fix:** Clamp or reject before the command:

```typescript
const applyAutoCo = () => {
  const raw = auto.value.trim();
  if (raw === "") {
    game.setAutoCashOut(null);
    return;
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1.01) {
    // restore from snapshot on next render, or set status
    return;
  }
  game.setAutoCashOut(n);
};
```

## Info

### IN-01: `renderHistoryStrip` rebuilds the full DOM every rAF tick

**File:** `src/games/crash/hud/CrashHud.ts:155-156`, `src/games/crash/hud/historyStrip.ts:26-33`
**Issue:** `hud.render` runs on every animation frame (~60 Hz) and always calls `renderHistoryStrip` → `replaceChildren()` + up to 20 new nodes, even when `snap.history` / `roundId` are unchanged. Harmless for N=20 in a demo; optional skip when history unchanged.
**Fix:** Skip rebuild when history reference/length/tail unchanged (e.g. compare `snap.roundId` + `history.length` + last mult), or only refresh when `roundId` changes after settle.

### IN-02: HUD CSS loaded twice (HTML link + `main.ts` import)

**File:** `index.html:7`, `src/main.ts:4`
**Issue:** Stylesheet is both `<link href="/src/styles/hud.css">` and `import "./styles/hud.css"`. Vite processes both; rules apply twice (usually idempotent). Prefer a single ownership path (link for no-FOUC **or** JS import for bundling)—not both.

### IN-03: ARCH-02 deny-list still matches only bare `pixi.js`

**File:** `tests/architecture.no-pixi.test.ts:12-13`
**Issue:** Phase 1 IN-03 carry-forward: pattern rejects `pixi.js` / `document.` / `window.` but not `pixi.js/...` or `@pixi/*`. Package test correctly allows Vite and still forbids `pixi.js` in deps. Fine until Phase 3; tighten the import regex before renderer packages land.

### IN-04: No unit/DOM coverage for `CrashHud`, `format`, or `rafClock`

**File:** `src/games/crash/hud/CrashHud.ts`, `src/games/crash/hud/format.ts`, `src/app/rafClock.ts`
**Issue:** Chips/enablement/history helpers are tested; the composition binder (chip→input, reset/auto wiring, broke emphasis) and clock stop behavior rely on manual `npm run dev` play. A happy-dom smoke test for mount + one command round-trip would lock Pitfall 4/6 wiring.

### IN-05: `package.json` description still says “GameLogic Core”

**File:** `package.json:6`
**Issue:** Stale blurb after Phase 2 shell; cosmetic only. Update to mention Vite + HTML HUD demo when convenient.

---

## What looks good

- **Boundary:** HUD never mutates balance/history; chips only set `bet.value` (WALT-03 / Pitfall 4).
- **XSS:** History pills use `createElement` + `textContent` only (T-02-10).
- **Enablement:** Waiting/flying/broke matrix matches durable phases; `canEditAuto: true` matches plan discretion.
- **Clock:** `startRafClock` returns a cancel handle; `main.ts` disposes on HMR — Phase 3 ticker handoff is clear.
- **Shell:** `#game-canvas-host` stays empty; three-zone bottom bar matches D-01..D-03.

---

_Reviewed: 2026-09-26T19:05:00Z_
_Reviewer: Composer (gsd-code-reviewer)_
_Depth: standard_
