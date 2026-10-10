---
phase: 03-diskette-collectors-trigger-queue
reviewed: 2026-10-10T21:00:00Z
depth: standard
files_reviewed: 28
files_reviewed_list:
  - src/games/hotline/logic/collectors/TokenColors.ts
  - src/games/hotline/logic/collectors/resolveCollectors.ts
  - src/games/hotline/logic/collectors/PhoneMeters.ts
  - src/games/hotline/logic/collectors/ComboQueue.ts
  - src/games/hotline/config/HotlineConfigSchema.ts
  - src/games/hotline/config/hotline.config.json
  - src/games/hotline/logic/HotlineGame.ts
  - src/games/hotline/logic/index.ts
  - src/games/hotline/view/TokenFlight.ts
  - src/games/hotline/view/winCycle.ts
  - src/games/hotline/view/WinLinesOverlay.ts
  - src/games/hotline/view/PhonesLayer.ts
  - src/games/hotline/view/loadHotlineAssets.ts
  - src/games/hotline/view/HotlineScene.ts
  - src/games/hotline/session/collectPresentation.ts
  - src/games/hotline/session/mountHotlineSession.ts
  - src/games/hotline/hud/HotlineHud.ts
  - index.html
  - src/styles/hud.css
  - src/shared/audio/AudioPort.ts
  - src/shared/audio/createBeepAudioPort.ts
  - src/games/hotline/logic/collectors/resolveCollectors.test.ts
  - src/games/hotline/logic/HotlineGame.test.ts
  - src/games/hotline/view/winCycle.test.ts
  - src/games/hotline/session/collectPresentation.test.ts
  - src/games/hotline/hud/HotlineHud.test.ts
  - src/shared/audio/createBeepAudioPort.test.ts
  - tests/hotline.assets.test.ts
findings:
  critical: 1
  warning: 2
  info: 2
  total: 5
status: issues_found
---

# Phase 3: Code Review Report

**Reviewed:** 2026-10-10T21:00:00Z
**Depth:** standard
**Files Reviewed:** 28
**Status:** issues_found

## Summary

Phase 03 collector logic, TokenFlight/PhonesLayer presentation, busy FSM, and beep SFX wiring are mostly coherent: separate collectors RNG, settle-time meter booking, progressive display helpers, textContent combo strip, and no Howler. One critical session race remains: Spin is live while `mountHotlineView` awaits assets, so `game.spin()` can settle bets and book collectors with no presentation and no busy lock.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: Spin settles while Pixi view is still null during asset load

**File:** `src/games/hotline/session/mountHotlineSession.ts:134-155` (mount order `174-178` then `266-268`)
**Issue:** `mountHotlineHud` attaches Spin before `await mountHotlineView(...)`. `hudGame.spin()` always calls `game.spin()` first, and only starts reels / `setBusy(true)` when `view` is non-null. During the asset-load gap a click takes the bet, books `collectorOutcome` / meter fills, returns `{ ok: true }`, leaves `busy` false, and skips flights/stub entirely. Repeat clicks can drain balance with no collect presentation.
**Fix:** Reject spin until the view exists (and optionally keep Spin disabled until then):

```typescript
spin(): SpinResult {
  if (!view || busy || view.scene.isSpinning()) {
    return { ok: false, reason: "" };
  }
  baseline = baselineFromMeterFills(game.getSnapshot().meterFills);
  const result = game.spin();
  if (result.ok) {
    ctx.audio.unlock();
    ctx.audio.play("spin");
    busy = true;
    hud.setBusy(true);
    present = "reels";
    settleArmed = true;
    // ... reset collect presentation state, startSpin
  }
  return result;
}
```

Also call `hud.setBusy(true)` (or disable Spin) immediately after mounting the HUD until `view` is assigned.

## Warnings

### WR-01: Win overlay can restart during collect path on resize

**File:** `src/games/hotline/view/HotlineScene.ts:186-220`
**Issue:** `sync` re-invokes `showWins` whenever the canvas resizes (or snapshot key / spinning flag changes). After a winning spin, `snapshot.lineWins` stays populated through win_gate, flights, stub, and idle. A resize during win_gate restarts `createWinCycle` (extends busy). A resize during flights/stub/idle can put the neon line cycle back on screen over collector presentation.
**Fix:** Gate win presentation to the session phase, or only call `showCycle` once per settle (e.g. from `startSpin` clear + explicit `showWins` when reels finish), and ignore resize-driven restarts unless `present === "win_gate"` and the cycle is still active—or clear `lineWins` from the scene input after the finite pass.

### WR-02: HotlineGame comboQueue is write-only and drifts from resets

**File:** `src/games/hotline/logic/HotlineGame.ts:71-107,119-121`
**Issue:** `createComboQueue()` is updated with `comboQueue.set(collectorOutcome.queue)` on settle but never read. Session drain uses `pendingOutcome.queue` and `resetPhoneMeter` only touches `PhoneMeters`. Phase 4 code that later peeks `comboQueue` would see stale entries after stub pops.
**Fix:** Either remove the unused queue from `HotlineGame` until a consumer exists, or expose pop/peek APIs and keep them in sync with `resetPhoneMeter` / stub drain:

```typescript
// until phase 4 needs it, drop the dead instance:
// const comboQueue = createComboQueue();
// comboQueue.set(collectorOutcome.queue);
```

## Info

### IN-01: Beep port keeps empty catch around oscillator setup

**File:** `src/shared/audio/createBeepAudioPort.ts:83-97`
**Issue:** `play` swallows all Web Audio failures silently (pre-existing pattern, still present after collector pitch wiring). Failures are hard to diagnose in demos.
**Fix:** Optional debug-only log or count; not required for portfolio mute/unlock behavior.

### IN-02: Collect-path contracts are source-string regex tests

**File:** `src/games/hotline/session/collectPresentation.test.ts:59-84`
**Issue:** Busy FSM and D-16 beep wiring are asserted via `readFileSync` + regex on `mountHotlineSession.ts`. Refactors that preserve behavior can fail CI without exercising runtime.
**Fix:** Prefer a thin injectable session harness later; acceptable as a phase gate for now.

---

_Reviewed: 2026-10-10T21:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
