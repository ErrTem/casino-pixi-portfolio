---
phase: quick-261012-jg6
plan: 01
subsystem: hotline-hud
tags: [hotline, hud, turbo, auto-spin, info-sheet, pixi]
requires: []
provides:
  - dollar only gold win callout on the reels
  - hotline title pinned 30 to 50 px below the canvas top
  - actions row above the bar (info left, turbo auto gamble right)
  - info sheet font split with symbol icons
  - working turbo and auto spin
affects: [hotline-hud, hotline-session, hotline-scene]
tech-stack:
  added: []
  patterns:
    - pure session helper (autoSpin.ts) in the shape of the crash autoBet helper
    - optional icon resolver on the paytable overlay, urls only from SYMBOL_URLS
key-files:
  created:
    - src/games/hotline/session/autoSpin.ts
    - src/games/hotline/session/autoSpin.test.ts
  modified:
    - index.html
    - src/styles/hud.css
    - src/games/hotline/hud/format.ts
    - src/games/hotline/hud/format.test.ts
    - src/games/hotline/hud/HotlineHud.ts
    - src/games/hotline/hud/HotlineHud.test.ts
    - src/games/hotline/hud/PaytableOverlay.ts
    - src/games/hotline/hud/paytableSheetModel.ts
    - src/games/hotline/hud/paytableSheetModel.test.ts
    - src/games/hotline/session/mountHotlineSession.ts
    - src/games/hotline/view/HotlineScene.ts
    - src/games/hotline/view/WinLinesOverlay.ts
    - src/games/hotline/view/reels/createReelWindow.ts
    - src/games/hotline/view/reels/reelMotion.ts
    - src/games/hotline/view/reels/reelMotion.test.ts
    - tests/shell.hud-layout.test.ts
key-decisions:
  - turbo is 260 ms first stop plus 90 ms stagger, win cycle 450 ms, auto gap 600 ms or 200 ms with turbo
  - turbo and auto are never locked by busy so auto can be stopped mid spin
  - auto only counts idle time while present is idle, features and info pause it instead of ending it
requirements-completed: [BASE-02, BASE-04, GAMBLE-01, PRES-01, PRES-02]
duration: 8 min
completed: 2026-10-12
status: complete
commits: 3
plan_head_before: 25445af5b2c53c784017e5188f89b2046b58b116
actuals:
  tokens: 60000
  tasks: 3
  commits: 3
coverage:
  - deliverable: title near the top of the canvas
    verification:
      - kind: command
        ref: npm run build
        status: pass
    human_judgment: true
    rationale: pixel position under real canvas sizes needs a look in the browser
  - deliverable: gold dollar only win callout
    verification:
      - kind: test
        ref: src/games/hotline/hud/format.test.ts#formats a win callout in dollars from cents
        status: pass
    human_judgment: false
  - deliverable: actions row with I and 2x, no lines readout
    verification:
      - kind: test
        ref: tests/shell.hud-layout.test.ts#keeps info, turbo, auto and gamble in an actions row above the bar, outside the canvas host
        status: pass
    human_judgment: true
    rationale: visual alignment above stake group and SPIN needs a look at 360 by 640 and desktop
  - deliverable: info sheet fonts and symbol icons
    verification:
      - kind: test
        ref: src/games/hotline/hud/paytableSheetModel.test.ts#symbol rows carry their config id in config order
        status: pass
    human_judgment: true
    rationale: font split and icon rendering are visual
  - deliverable: turbo and auto logic
    verification:
      - kind: test
        ref: src/games/hotline/session/autoSpin.test.ts
        status: pass
      - kind: test
        ref: src/games/hotline/view/reels/reelMotion.test.ts#turbo last reel is at most half of the normal time
        status: pass
      - kind: test
        ref: src/games/hotline/hud/HotlineHud.test.ts#turbo click flips aria-pressed and reports on then off
        status: pass
    human_judgment: true
    rationale: session ticker wiring (pause on features, stop on gamble) is not unit tested
---

# Phase quick-261012-jg6 Plan 01: HOTLINE HUD polish 1-5 Summary

Hotline now has a gold dollar win callout, a title pinned near the canvas top, an actions row (I on the left, TURBO AUTO 2x on the right), a readable info sheet with reel art icons, and working turbo and auto spin driven by a pure gate helper.

## Accomplishments

- Win callout shows only `$0.10` style gold text through `formatWinCallout`, line number copy is gone
- Title anchors at the top, 30 to 50 px down (5 percent of canvas height clamped), phones and CRT are centered as one block under it
- Info sits above the stake group, TURBO AUTO and 2x sit above SPIN, the 40 lines readout and word labels are gone
- Info sheet uses Retro Computer only for the sheet title, section titles and symbol names, descriptions use a sans stack at 0.85rem, symbol rows show their PNG from `SYMBOL_URLS`
- Turbo cuts the last reel stop from 1610 ms to 620 ms and the win cycle from 1100 ms to 450 ms
- Auto spins from idle after a gap, waits through features, splashes and the info sheet, stops when gamble opens, when pressed again, or when the wallet refuses the bet

## Task Commits

1. Task 1, title and callout: `fca6157`
2. Task 2, actions row, info sheet fonts and icons: `647ed81`
3. Task 3, turbo and auto: `b104ac2`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Stale shell layout test**
- **Found during:** Task 3 full `npm test`
- **Issue:** `tests/shell.hud-layout.test.ts` still asserted the old layout (40 lines text, `hotline-bar__icons`, `"gamble spin info"` grid area, fixed 2.75rem width on every icon button). The plan did not list this file and the Task 2 verify only ran `src/games/hotline`, so the Task 2 commit left it failing until Task 3
- **Fix:** rewrote the four assertions for the actions row, the two row narrow grid and the width rule that now skips turbo and auto
- **Files modified:** tests/shell.hud-layout.test.ts
- **Commit:** `b104ac2`

**2. [Rule 3 - Blocking] Narrow width rule scoped away from mode buttons**
- **Found during:** Task 3 css
- **Issue:** the 480px breakpoint forced every `.hotline-icon-btn` to 2.75rem wide, which would clip the TURBO and AUTO words
- **Fix:** width now applies through `.hotline-icon-btn:not(.hotline-mode-btn)`, mode buttons get side padding instead
- **Files modified:** src/styles/hud.css
- **Commit:** `b104ac2`

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking). **Impact:** none on scope, no new files beyond the plan except an updated existing test.

## Notes

- `rg "innerHTML" src/games/hotline/hud` still matches two negative assertions inside `HotlineHud.test.ts`, no source file uses innerHTML
- Win image frame animations (item 6) and Phase 5 UAT stay out of scope as planned
- Manual look in `npm run dev` at desktop and 360 by 640 is still open, see coverage rationale

## Known Stubs

None.

## Threat Flags

None. Icon urls only come from the hard coded `SYMBOL_URLS` map, auto waits at least 200 ms between spins and stops on any refusal with a reason, `openGamble` stops auto.

## Verification

- `npm test`: 56 files, 437 tests passed
- `npm run build`: passed (tsc and vite)

## Self-Check: PASSED

- FOUND: src/games/hotline/session/autoSpin.ts
- FOUND: src/games/hotline/session/autoSpin.test.ts
- FOUND commits fca6157, 647ed81, b104ac2
- acceptance greps: no `PAYS`, `formatWinCallout` used, title constants present, no `hotline-lines` or `hotline-bar__icons` or `icon-btn__label`, no `paylineCount` in HotlineHud, `iconFor` in overlay and session, `setTurbo` in reel window, scene and session, `requestSpin`, `stopAuto`, `tickAuto` in session, no `setWinCycleMs(DEFAULT_WIN_CYCLE_MS)` left, no turbo or auto `.disabled`
