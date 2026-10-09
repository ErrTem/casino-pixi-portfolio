---
phase: 02-hotline-base-playable
plan: 04
subsystem: reels-audio
tags: [hotline, reels, audio, pixi, ticker]
status: complete

requires:
  - phase: 02-03
    provides: mountHotlineSession, HotlineScene, mountHotlineHud
provides:
  - first party masked reel strips with left to right stagger stop
  - SfxEvent widened with spin, reel_stop, win and mapped beep pitches
  - session spin and reel_stop beeps, last win held until the last reel lands
affects:
  - 02-05 win overlay and win beep call site
  - phase 2 presentation plans replace placeholder cells

estimate:
  tokens: 40000
  tasks: 2

actuals:
  tokens: 14000
  tasks: 2
  commits: 3

plan_head_before: 76d840b52d4644f6c959f638301045f3500c77cf

tech-stack:
  added: []
  patterns:
    - reel timing and hermite landing live in a pure module, strips only render
    - landing keeps spin speed as the start tangent so the stop has no hitch
    - session hands the hud a wrapper game that starts the reels and hides last win during motion

key-files:
  created:
    - src/games/hotline/view/reels/reelMotion.ts
    - src/games/hotline/view/reels/reelMotion.test.ts
    - src/games/hotline/view/reels/ReelStrip.ts
    - src/games/hotline/view/reels/createReelWindow.ts
    - src/shared/audio/createBeepAudioPort.test.ts
  modified:
    - src/shared/audio/AudioPort.ts
    - src/shared/audio/createBeepAudioPort.ts
    - src/games/hotline/view/HotlineScene.ts
    - src/games/hotline/view/mountHotlineView.ts
    - src/games/hotline/session/mountHotlineSession.ts
    - tests/architecture.shell.test.ts

key-decisions:
  - "reels play back an already settled spin, the math resolves in one call and the view only animates it"
  - "a spin pressed during motion is ignored with an empty reason so the status line stays clean"
  - "hud.css left unchanged, the 02-03 portrait layout already fits the reel column"

requirements-completed: [BASE-01, BASE-02]

completed: 2026-10-09
---

# Phase 2 Plan 04: Staggered Reels and Spin Beeps Summary

Five ticker driven masked reel strips spin and land left to right with a hermite ease, and the shared AudioPort now carries spin, reel_stop and win beeps without touching Crash.

## Accomplishments

- reelMotion holds the stagger (650 ms plus 240 ms per reel), landing ease and spin speed as pure functions
- ReelStrip scrolls filler symbols under a rect mask, then slides the target column in and fires a stop callback
- createReelWindow builds five strips with per reel filler shift and reports each stop in order
- HotlineScene uses the reel window, draws win outlines only when the reels are at rest, and takes deltaMS from the session ticker
- session plays spin on a good spin and reel_stop per landed reel, balance, bet and 40 lines stay live, last win shows after the last reel
- SfxEvent union and the PITCH_HZ record are exhaustive, so Crash callers still compile
- manual smoke on the dev server: masked scrolling reels mid spin, settled grid matched the snapshot, balance 999.90 and last win 0.00 after landing

## Task Commits

1. Task 1 RED: `9f92c48` test(02-04): failing tests for reel motion, beep events and reel wiring gate
2. Task 1 GREEN: `07518b1` feat(02-04): staggered masked reels with spin and reel stop beeps
3. Task 1 fix: `80b8f4e` fix(02-04): shift filler per reel so spinning columns differ
4. Task 2: no commit, hud.css needed no change

## TDD Gate Compliance

- RED: 3 test files failed on assertions (missing reelMotion module, undefined beep pitches, missing reel gate wiring)
- GREEN: full suite 250 of 250, tsc exit 0, vite build ok
- REFACTOR: not needed

## Verification

- `npx vitest run src/shared/audio src/games/hotline` green, `npm test` 250 of 250
- `npx tsc --noEmit` exit 0, `npm run build` exit 0
- package.json has no pixi-reels, gsap or howler

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Every spinning column showed the same filler**
- **Found during:** manual smoke after Task 1 GREEN
- **Issue:** all five strips used the same filler sequence, so the spin looked like one repeated column
- **Fix:** per reel fillerShift option on ReelStrip
- **Files modified:** ReelStrip.ts, createReelWindow.ts
- **Commit:** 80b8f4e

**2. [Rule 2 - Missing critical] Reel wiring gate**
- **Found during:** Task 1
- **Issue:** the no pixi-reels, gsap or howler prohibition and the session beep wiring had no test
- **Fix:** Gate B3 in tests/architecture.shell.test.ts
- **Commit:** 9f92c48

Task 2 was a no-op by design: hud.css left unchanged, hud layout tests and build pass.

## Known Stubs

Reel cells are still the colored rect and system font label placeholders from 02-03, real symbol art comes with the presentation plans. The balance readout includes a win before the reels land, only last win is held back. 02-05 can hold the balance too if it wants a cleaner reveal. Not logged in WINDOWS.md since both are planned follow ups.

## Self-Check: PASSED

- all created files exist
- commits `9f92c48`, `07518b1`, `80b8f4e` exist in git log
- `npm test`, `npx tsc --noEmit`, `npm run build` exit 0
