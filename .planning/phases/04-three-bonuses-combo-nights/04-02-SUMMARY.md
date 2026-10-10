---
phase: 04-three-bonuses-combo-nights
plan: 02
subsystem: hud
tags: [hotline, free-spins, feature-line, win-cycle, pacing, dom-hud]

requires:
  - phase: 04-three-bonuses-combo-nights
    provides: createNight night snapshot and session night presenter from 04-01
provides:
  - HotlineHud.setFeatureLine and [data-field=feature] DOM strip
  - formatFeatureLine pure formatter from NightSnapshot.fs
  - WinLinesOverlay.setIntervalMs and DEFAULT_WIN_CYCLE_MS
  - HotlineScene.setWinCycleMs pass-through
  - FS_WIN_CYCLE_MS, FS_GAP_MS, and fs_gap presenter phase
affects:
  - 04-03 pick'em nested during free spins
  - 04-04 hold and win nested during free spins
  - 04-05 combo strip highlight

actuals:
  tokens: 4273
  tasks: 2
  commits: 3

tech-stack:
  added: []
  patterns:
    - free spins counter is DOM textContent outside the canvas host
    - win line cycle interval is parameterized on the existing overlay

key-files:
  created: []
  modified:
    - index.html
    - src/styles/hud.css
    - src/games/hotline/hud/HotlineHud.ts
    - src/games/hotline/hud/HotlineHud.test.ts
    - src/games/hotline/session/collectPresentation.ts
    - src/games/hotline/session/collectPresentation.test.ts
    - src/games/hotline/session/mountHotlineSession.ts
    - src/games/hotline/view/WinLinesOverlay.ts
    - src/games/hotline/view/HotlineScene.ts

key-decisions:
  - "FS_WIN_CYCLE_MS=480 and FS_GAP_MS=220 per RESEARCH Open Question 4 suggestion"
  - "Feature line copy pins FREE SPINS N LEFT  WIN x.xx from night.fs only"

patterns-established:
  - "formatFeatureLine reads NightSnapshot.fs; empty when fs is null"
  - "setWinCycleMs on green enter; DEFAULT_WIN_CYCLE_MS on green exit and idle"
  - "fs_gap ticks with the same deltaMS clamp as beat"

requirements-completed: [BONUS-01]

coverage:
  - id: D1
    description: DOM feature line shows remaining free spins and running win; clears at idle
    requirement: BONUS-01
    verification:
      - kind: unit
        ref: src/games/hotline/hud/HotlineHud.test.ts#setFeatureLine writes [data-field=feature] via textContent
        status: pass
      - kind: unit
        ref: src/games/hotline/session/collectPresentation.test.ts#formatFeatureLine (D-02)
        status: pass
      - kind: unit
        ref: tests/shell.hud-layout.test.ts
        status: pass
    human_judgment: false
  - id: D2
    description: Free spins use compact win cycle and fs_gap pacing; base cycle restored after night
    requirement: BONUS-01
    verification:
      - kind: unit
        ref: src/games/hotline/session/collectPresentation.test.ts#session source locks busy through flights and stub without double booking
        status: pass
      - kind: other
        ref: npm run build
        status: pass
    human_judgment: false

duration: 8min
completed: 2026-10-10
status: complete
plan_head_before: 28392a42fdecb2bbecb76626374aa233d6a030d8
---

# Phase 4 Plan 02: Free Spins Counter and Cadence Summary

**DOM free spins strip plus compact win-line cycle and tick-driven fs_gap so the green night feels continuous and readable**

## Performance

- **Duration:** 8 min
- **Started:** 2026-10-10T22:44:56Z
- **Completed:** 2026-10-10T22:48:30Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- `[data-field=feature]` under the CRT with neon CSS that collapses when empty
- `formatFeatureLine` and `HotlineHud.setFeatureLine` (textContent only; dispose-safe)
- Session syncs the line on night steps and reel settle; clears in `enterIdle`
- `WinLinesOverlay.setIntervalMs` / `DEFAULT_WIN_CYCLE_MS` and scene pass-through
- `FS_WIN_CYCLE_MS` (480), `FS_GAP_MS` (220), and `fs_gap` presenter phase

## Task Commits

Each task was committed atomically:

1. **Task 1 RED:** `805ad31` (test) — failing feature-line / formatFeatureLine / session source tests
2. **Task 1 GREEN:** `6fc9eb7` (feat) — DOM strip, formatter, HUD setter, session sync
3. **Task 2:** `b4d4feb` (feat) — win cycle interval, fs_gap pacing, source assertions

**Plan metadata:** docs commit after STATE/ROADMAP update

## TDD Gate Compliance

- Task 1: RED evidence `04-02-tdd-red-evidence-t1.json` → `RED_EVIDENCE_OK`; GREEN `feat(04-02)` follows
- Task 2: not `tdd="true"`; source assertions added with implementation

## Files Created/Modified

- `index.html` / `src/styles/hud.css` — feature strip markup and neon empty collapse
- `src/games/hotline/hud/HotlineHud.ts` — `setFeatureLine`
- `src/games/hotline/session/collectPresentation.ts` — `formatFeatureLine`
- `src/games/hotline/session/mountHotlineSession.ts` — feature line sync, FS pacing
- `src/games/hotline/view/WinLinesOverlay.ts` — `setIntervalMs`, `DEFAULT_WIN_CYCLE_MS`
- `src/games/hotline/view/HotlineScene.ts` — `setWinCycleMs`

## Decisions Made

- Tuned `FS_WIN_CYCLE_MS=480` and `FS_GAP_MS=220` from RESEARCH Open Question 4 suggestion
- Counter copy is remaining spins plus running free spin win only (CONTEXT discretion)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Ready for 04-03 / 04-04 nested feature drivers; FS counter and pacing stay on night snapshot
- Combo strip highlight remains 04-05

## Self-Check: PASSED

- `src/games/hotline/hud/HotlineHud.ts` FOUND (`setFeatureLine`)
- `src/games/hotline/session/collectPresentation.ts` FOUND (`formatFeatureLine`)
- `src/games/hotline/view/WinLinesOverlay.ts` FOUND (`DEFAULT_WIN_CYCLE_MS`, `setIntervalMs`)
- Commits `805ad31` `6fc9eb7` `b4d4feb` FOUND in `git log`
- Plan verification commands passed (hud/session/layout + view/session + build)

---
*Phase: 04-three-bonuses-combo-nights*
*Completed: 2026-10-10*
