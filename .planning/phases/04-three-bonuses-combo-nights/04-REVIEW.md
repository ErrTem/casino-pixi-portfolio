---
phase: 04-three-bonuses-combo-nights
reviewed: 2026-10-10T23:11:13Z
depth: standard
files_reviewed: 22
files_reviewed_list:
  - src/games/hotline/logic/night/createNight.ts
  - src/games/hotline/logic/features/freeSpins.ts
  - src/games/hotline/logic/features/prizeTable.ts
  - src/games/hotline/logic/features/pickEm.ts
  - src/games/hotline/logic/features/holdAndWin.ts
  - src/games/hotline/logic/HotlineGame.ts
  - src/games/hotline/logic/index.ts
  - src/games/hotline/hud/FeatureOverlay.ts
  - src/games/hotline/hud/HotlineHud.ts
  - src/games/hotline/hud/comboStripModel.ts
  - src/games/hotline/session/mountHotlineSession.ts
  - src/games/hotline/session/collectPresentation.ts
  - src/games/hotline/view/HoldLayer.ts
  - src/games/hotline/view/JackpotStrip.ts
  - src/games/hotline/view/HotlineScene.ts
  - src/games/hotline/view/WinLinesOverlay.ts
  - src/games/hotline/config/HotlineConfigSchema.ts
  - src/games/hotline/config/hotline.config.json
  - src/shared/audio/AudioPort.ts
  - src/shared/audio/createBeepAudioPort.ts
  - index.html
  - src/styles/hud.css
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: issues
---

# Phase 4: Code Review Report

**Reviewed:** 2026-10-10T23:11:13Z
**Depth:** standard
**Files Reviewed:** 22
**Status:** issues

## Summary

Reviewed production sources from all five Phase 04 plan summaries (createNight, free spins / Hold / Pick'em drivers, FeatureOverlay, session presenter, combo strip, audio widen). Math settle-once paths and DOM `textContent` usage look sound for the session happy path. Three warnings remain: Hold state can contaminate a later feature's `settleFeature` if `stepHoldRespin` is called after red exits, Hold board geometry goes stale on resize during hold mode, and paused Green is rendered as done on the combo strip.

## Narrative Findings (AI reviewer)

## Warnings

### WR-01: Stale Hold instance can settle a later open feature

**File:** `src/games/hotline/logic/HotlineGame.ts:121-124,278-287`
**Issue:** `finishHold()` calls `night.settleFeature(hold.totalCents())` but never clears `hold`. After red `feature_exit` closes `open`, the next `feature_start` (purple or another red) creates a new unsettled `open` while the old Hold object remains. A subsequent `stepHoldRespin()` sees `hold.snapshot().done === true`, calls `finishHold()` again, and `settleFeature` writes the previous Hold total onto the new open feature (wallet then credits the wrong amount at that feature's exit). The current session presenter avoids this by only stepping Hold while `present === "hold_respin"`, but the game API is unsafe in isolation and fragile if presentation order changes.
**Fix:** Clear Hold after it has been settled and its exit splash has read jackpot state, and guard `stepHoldRespin` so it cannot settle a non-red open feature:

```typescript
function finishHold(): void {
  if (!night || !hold) return;
  night.settleFeature(hold.totalCents());
}

stepHoldRespin(): { done: boolean } {
  if (!hold) return { done: true };
  const snapBefore = hold.snapshot();
  if (!snapBefore.done) hold.respin();
  const snap = hold.snapshot();
  if (snap.done) {
    finishHold();
    // clear after settle so a later purple/red open cannot inherit this total
    // keep a one-shot jackpotWon cache if exit splash still needs the tier label
  }
  return { done: snap.done };
}
```

Prefer also nulling `hold` in `nextNightStep` on red `feature_exit` after the splash path has copied `jackpotWon`, or store `lastHoldJackpot` separately so `hold` can be cleared immediately in `finishHold`.

### WR-02: Hold board geometry not refreshed on resize during hold mode

**File:** `src/games/hotline/view/HotlineScene.ts:232-246`
**Issue:** `sync` runs `layout()` on resize, then early-returns when `holdMode` is true after only `hold.tick(deltaMS)`. `hold.sync(snapshot, geometry())` is not re-invoked, so sticky cell frames/labels keep the pre-resize centers while the CRT frame and jackpot strip move. Portrait/landscape changes mid-Hold misalign the board.
**Fix:** After layout during hold mode, re-sync Hold with current geometry (session can keep the latest snapshot, or scene can cache the last Hold snapshot):

```typescript
if (holdMode) {
  if (resized && lastHoldSnap) {
    hold.sync(lastHoldSnap, geometry());
  }
  hold.tick(deltaMS);
  return;
}
```

### WR-03: Paused Green rendered as done on combo strip

**File:** `src/games/hotline/hud/comboStripModel.ts:15-24`
**Issue:** `cellState` maps `entry.state === "paused"` to `"done"`. During nested Red/Purple, Green is paused with spins remaining, but the strip shows Green as completed. That fights D-18 (full path with current step lit) and makes nesting look like Green already finished.
**Fix:** Treat paused as pending (or add a distinct class), and only mark done when `entry.state === "done"`:

```typescript
function cellState(
  entry: NightPathEntry,
  index: number,
  activeIndex: number,
): ComboStripCell["state"] {
  if (index === activeIndex || entry.state === "active") return "active";
  if (entry.state === "done") return "done";
  if (activeIndex >= 0 && index < activeIndex && entry.state !== "paused") {
    return "done";
  }
  return "pending";
}
```

## Info

### IN-01: Locker grid size hardcoded to 12

**File:** `src/games/hotline/hud/FeatureOverlay.ts:66-79`
**Issue:** `ensureLockerButtons` always builds 12 buttons. Schema currently locks `pickEm.lockers` to 12, so runtime is consistent, but the overlay ignores config and will drift if the literal ever changes.
**Fix:** Pass `lockers` from config into `showLockerGrid` / `mountFeatureOverlay` and size the button list from that value.

### IN-02: Empty catch in beep `play`

**File:** `src/shared/audio/createBeepAudioPort.ts:102-103`
**Issue:** Oscillator failures are swallowed with an empty `catch`. Fine for fail-soft demo audio; leaves no signal when a new SfxEvent pitch wiring breaks at runtime.
**Fix:** Optional `console.debug` behind a dev flag, or count failures for tests.

### IN-03: Unused `bonusPrizes` row for `freeSpins`

**File:** `src/games/hotline/config/hotline.config.json:80`
**Issue:** `bonusId: "freeSpins"` prize ladder is parsed but never read by Phase 04 feature code (FS uses `features.freeSpins` knobs only). Harmless clutter for reviewers of the backend-shaped config.
**Fix:** Drop the row or document it as reserved for a future FS prize path.

---

_Reviewed: 2026-10-10T23:11:13Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
