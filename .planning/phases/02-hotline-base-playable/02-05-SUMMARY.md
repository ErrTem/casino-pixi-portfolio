---
phase: 02-hotline-base-playable
plan: 05
subsystem: win-feedback
tags: [hotline, win-lines, overlay, hud, audio, pixi]
status: complete

requires:
  - phase: 02-04
    provides: reel window with settle detection, widened SfxEvent with win
provides:
  - WinLinesOverlay cycling one neon payline at a time with framed cells and a LINE N PAYS callout
  - DOM last win count up from zero after the reels land
  - win beep fired once on settle when the spin paid
affects:
  - phase 2 presentation plans swap placeholder fonts and symbol art

estimate:
  tokens: 35000
  tasks: 2

actuals:
  tokens: 15000
  tasks: 2
  commits: 3

plan_head_before: f0c27c4

tech-stack:
  added: []
  patterns:
    - pure win cycle scheduler steps one line per interval, the overlay redraws only on a step
    - hud count up takes a clock option so tests drive time without timers
    - session arms a settle flag on spin and fires win once when the reels are at rest

key-files:
  created:
    - src/games/hotline/hud/lastWinTween.ts
    - src/games/hotline/hud/lastWinTween.test.ts
    - src/games/hotline/view/winCycle.ts
    - src/games/hotline/view/winCycle.test.ts
    - src/games/hotline/view/WinLinesOverlay.ts
  modified:
    - src/games/hotline/hud/HotlineHud.ts
    - src/games/hotline/hud/HotlineHud.test.ts
    - src/games/hotline/view/HotlineScene.ts
    - src/games/hotline/session/mountHotlineSession.ts
    - tests/architecture.shell.test.ts

key-decisions:
  - "win neon is hotline pink with a pale core, not the witch pots green"
  - "hud count up is opt in through lastWinTweenMs so existing hud tests keep exact text"
  - "the session holds the win part of the balance until the last reel lands, closing the 02-04 gap"

requirements-completed: [BASE-02, BASE-03]

completed: 2026-10-09
---

# Phase 2 Plan 05: Win Line Cycle and Last Win Count Up Summary

Wins now show one glowing payline at a time with framed cells and a LINE N PAYS callout, the last win counts up in the DOM, and the win beep fires once the reels settle.

## Accomplishments

- lastWinTweenValue is the ease out cubic from Crash balanceTween, wrapped by createLastWinTween so the hud only passes timestamps
- HotlineHud counts last win from zero once per settled spin (900 ms from the session), "-" while reels move
- winCycle is a pure scheduler, one line per 1100 ms, a long frame moves a single step
- WinLinesOverlay draws glow, halo and core strokes through the cell centers plus two framed outlines per winning cell, then a dark pill callout with the line number and payout
- HotlineScene replaces the old white outlines with the overlay, clears it on spin and while reels move, and destroys it with the scene (T-02-06)
- session plays win once when the reels settle on a payout above zero (D-17), balance no longer shows the win before the reels land

## Task Commits

1. Task 1 RED: `210609c` test(02-05): failing tests for last win tween, win cycle and win wiring gate
2. Task 1 GREEN: `c409ca8` feat(02-05): last win count up helper wired into the hotline hud
3. Task 2: `bb52ad7` feat(02-05): neon payline cycle overlay and win beep after settle

## TDD Gate Compliance

- RED: lastWinTween and winCycle test files failed on missing modules, Gate B4 failed on the missing win wiring
- GREEN: hotline suite 63 of 63, full suite 265 of 265, tsc exit 0, vite build ok
- REFACTOR: not needed

## Verification

- `npx vitest run src/games/hotline` green, `npm test` 265 of 265
- `npx tsc --noEmit` exit 0, `npm run build` exit 0
- manual browser smoke of a forced win was not run in this pass, the overlay draw path is covered by tsc and build only

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] Extracted the win cycle scheduler**
- **Found during:** Task 2
- **Issue:** the plan allowed a pure scheduler but listed no file, and the cycle rule (D-16, one line at a time) had no test
- **Fix:** winCycle.ts plus winCycle.test.ts
- **Commit:** c409ca8

**2. [Rule 2 - Missing critical] Win wiring gate**
- **Found during:** Task 1 RED
- **Issue:** win beep, overlay teardown and hud tween wiring had no automated check
- **Fix:** Gate B4 in tests/architecture.shell.test.ts
- **Commit:** 210609c

**3. [Plan note] HUD uses the tween through a wrapper**
- HotlineHud calls createLastWinTween, which calls lastWinTweenValue, instead of calling lastWinTweenValue directly. Same curve, the gate accepts either name.

Balance hold was optional in the brief and was done in the session, not in the hud.

## Known Stubs

Callout and cell label text still use the `sans-serif` placeholder font, the Retro Computer font loads with the presentation plans. Not logged in WINDOWS.md since it is the same planned follow up as 02-04.

## Self-Check: PASSED

- created files exist: lastWinTween.ts, lastWinTween.test.ts, winCycle.ts, winCycle.test.ts, WinLinesOverlay.ts
- commits `210609c`, `c409ca8`, `bb52ad7` exist in git log
- `npm test`, `npx tsc --noEmit`, `npm run build` exit 0
