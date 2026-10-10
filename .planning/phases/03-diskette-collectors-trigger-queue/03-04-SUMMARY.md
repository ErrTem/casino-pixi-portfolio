---
phase: 03-diskette-collectors-trigger-queue
plan: 04
subsystem: session
tags: [hotline, collectors, busy-fsm, combo-stub, COLL-01, COLL-02, COLL-03]

requires:
  - phase: 03-diskette-collectors-trigger-queue
    provides: collectorOutcome + PhoneMeters book (03-02) and TokenFlight / PhonesLayer / finite winCycle (03-03)
provides:
  - HotlineHud setBusy + setCombo textContent binders (D-10, D-14)
  - index.html data-field=combo outside game-canvas-host
  - mountHotlineSession busy FSM win gate → flights → combo stub → idle
  - progressiveDisplayFills from pre-spin baseline on each TokenFlight onLand (COLL-02)
  - HotlineGame.resetPhoneMeter for stub pop meter clear (D-07, D-12)
affects:
  - 03-05 collector beep SFX (D-16)
  - Phase 4 real bonus modules swap in for stub beats

actuals:
  tokens: 17886
  tasks: 2
  commits: 4

plan_head_before: ae07e02f3d519b869ca8fc3a8ac4bebcb685c632

tech-stack:
  added: []
  patterns:
    - "session busy covers reels + win gate + flights + stub; Spin locked via setBusy"
    - "progressive setMeters from pre-spin baseline + landed spawns; no PhoneMeters.increment on land"
    - "combo stub glow + textContent strip + short beat + resetPhoneMeter per pop"

key-files:
  created:
    - src/games/hotline/session/collectPresentation.ts
    - src/games/hotline/session/collectPresentation.test.ts
  modified:
    - src/games/hotline/hud/HotlineHud.ts
    - src/games/hotline/hud/HotlineHud.test.ts
    - src/games/hotline/session/mountHotlineSession.ts
    - src/games/hotline/view/HotlineScene.ts
    - src/games/hotline/logic/HotlineGame.ts
    - index.html
    - src/styles/hud.css

key-decisions:
  - "Baseline uses raw meter counts before spin so soft-cap display grows one land at a time"
  - "Stub beat 700ms; no Continue taps; no real bonus engines (D-12)"
  - "Bet steppers locked while busy (RESEARCH A5)"

patterns-established:
  - "collectPresentation helpers for progressive fills + combo strip copy"
  - "HotlineScene.winsDone gates collectors after finite win cycle"

requirements-completed: [COLL-01, COLL-02, COLL-03]

coverage:
  - id: D1
    description: HUD setBusy locks Spin and combo strip uses textContent only
    requirement: COLL-03
    verification:
      - kind: unit
        ref: src/games/hotline/hud/HotlineHud.test.ts#setBusy disables spin and bet steppers
        status: pass
      - kind: unit
        ref: src/games/hotline/hud/HotlineHud.test.ts#setCombo writes combo strip via textContent only
        status: pass
    human_judgment: false
  - id: D2
    description: Progressive meter fills grow one land at a time from pre-spin baseline
    requirement: COLL-02
    verification:
      - kind: unit
        ref: src/games/hotline/session/collectPresentation.test.ts#grows one land at a time from a pre-spin baseline
        status: pass
    human_judgment: false
  - id: D3
    description: Session busy FSM wires win gate, flights, stub drain without double-booking meters
    requirement: COLL-01
    verification:
      - kind: unit
        ref: src/games/hotline/session/collectPresentation.test.ts#session source locks busy through flights and stub without double booking
        status: pass
      - kind: other
        ref: npm test
        status: pass
    human_judgment: true
    rationale: End-to-end arc/glow/stub timing needs a browser look; contracts and suite are automated

duration: 7min
completed: 2026-10-10
status: complete
---

# Phase 3 Plan 04: Session Collect Path Busy FSM Summary

**Spin stays locked through finite win present, parallel diskette flights with progressive phone meters, and a Green→Red→Purple combo stub that resets meters on pop**

## Performance

- **Duration:** 7 min
- **Started:** 2026-10-10T20:38:00Z
- **Completed:** 2026-10-10T20:45:00Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- `HotlineHud.setBusy` / `setCombo` with `data-field=combo` outside `#game-canvas-host` (textContent only)
- Session FSM: reels → finite `winsDone` gate → `startCollectors` → progressive `setPhoneMeters` on land → stub beats → idle
- Logic meters booked only at spin settle; stub calls `resetPhoneMeter` + syncs display (no land-side `increment`)
- Stub presentation only — no Green FS / Red Hold&Win / Purple Pick'em engines

## TDD Gate Compliance

| Task | RED commit | GREEN commit | Evidence |
|------|------------|--------------|----------|
| Task 1 HUD busy + combo | `a4f225e` test(03-04) | `0fe0721` feat(03-04) | `03-04-tdd-red-evidence-t1.json` → RED_EVIDENCE_OK |
| Task 2 session collect FSM | `fa6e262` test(03-04) | `a28f478` feat(03-04) | `03-04-tdd-red-evidence-t2.json` → RED_EVIDENCE_OK |

## Task Commits

1. **Task 1 RED: HUD busy and combo strip tests** - `a4f225e` (test)
2. **Task 1 GREEN: setBusy + combo binders + DOM host** - `0fe0721` (feat)
3. **Task 2 RED: collect presentation contracts** - `fa6e262` (test)
4. **Task 2 GREEN: session busy FSM end-to-end** - `a28f478` (feat)

**Plan metadata:** (pending docs commit)

## Files Created/Modified
- `src/games/hotline/hud/HotlineHud.ts` - setBusy / setCombo binders
- `src/games/hotline/hud/HotlineHud.test.ts` - busy + combo coverage
- `index.html` - combo strip host with aria-live
- `src/styles/hud.css` - `.hotline-combo` strip under hotline screen
- `src/games/hotline/session/collectPresentation.ts` - progressive fills + combo format helpers
- `src/games/hotline/session/collectPresentation.test.ts` - COLL-02 helpers + session source contracts
- `src/games/hotline/session/mountHotlineSession.ts` - busy FSM collect path
- `src/games/hotline/view/HotlineScene.ts` - `winsDone` for D-13 gate
- `src/games/hotline/logic/HotlineGame.ts` - `resetPhoneMeter` for stub pop

## Decisions Made
- Pre-spin baseline uses raw counts; display soft-caps via `progressiveDisplayFills`
- Stub beat length 700ms; lock bet steppers while busy
- Extracted pure `collectPresentation` helpers so progressive fills are Vitest-covered without Pixi

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] HotlineGame.resetPhoneMeter + collectPresentation helpers**
- **Found during:** Task 2 (session busy FSM)
- **Issue:** Stub pop must clear logic meters (D-07/D-12) and progressive fills need a pure testable path; plan file list omitted `HotlineGame.ts` / helper module
- **Fix:** Added `resetPhoneMeter` on the game and `collectPresentation.ts` used by the session
- **Files modified:** `src/games/hotline/logic/HotlineGame.ts`, `src/games/hotline/session/collectPresentation.ts`
- **Commit:** `a28f478` / `fa6e262`

## Issues Encountered
- Nested Vitest TAP failed `tdd-red-evidence` with `zero_tests_discovered`; evidence JSON uses flattened TAP summaries (same as 03-03)

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Collect path ready for 03-05 beep SFX event IDs (D-16)
- Phase 4 can replace stub beats with real bonus modules without redoing flights/meters

## Self-Check: PASSED

- FOUND: HotlineHud.ts, mountHotlineSession.ts, collectPresentation.ts, index.html, 03-04-SUMMARY.md
- FOUND commits: a4f225e, 0fe0721, fa6e262, a28f478

---
*Phase: 03-diskette-collectors-trigger-queue*
*Completed: 2026-10-10*
