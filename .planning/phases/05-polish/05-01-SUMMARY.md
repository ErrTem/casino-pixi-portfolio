---
phase: 05-polish
plan: 01
subsystem: ui
tags: [pixi, bitmaptext, countdown, theater, vitest]

requires:
  - phase: 03-pixi-hybrid-view
    provides: TheaterText live BitmapText + CrashScene dual-read idle/climb/crash
  - phase: 01-gamelogic-core
    provides: waitRemainingMs on waiting snapshot (cadence authoritative)
provides:
  - formatWaitCountdown continuous tenths helper
  - Waiting+idle theater countdown on live BitmapText (PLSH-01)
affects: [05-02-sfx, 05-03-seed, 05-04-stats-keyboard]

actuals:
  tokens: 1200
  tasks: 2
  commits: 3

tech-stack:
  added: []
  patterns:
    - "waiting+idle gate → formatWaitCountdown on TheaterText live node"
    - "pure view formatter next to scene (no × suffix)"

key-files:
  created:
    - src/games/crash/view/formatWaitCountdown.ts
    - src/games/crash/view/formatWaitCountdown.test.ts
  modified:
    - src/games/crash/view/CrashScene.ts

key-decisions:
  - "Countdown gated on phase===waiting && mode===idle (RESEARCH A1) to avoid tenths over crash hold/fade"
  - "Reuse existing TheaterText live BitmapText — no third text node, no Text/HTMLText"

patterns-established:
  - "theater-wait-countdown: formatWaitCountdown(waitRemainingMs) → liveText white/full-alpha while waiting idle"
  - "countdown-clears-on-flight: climb branch still formatMult(live ×)"

requirements-completed: [PLSH-01]

coverage:
  - id: D1
    description: "formatWaitCountdown maps waitRemainingMs to continuous tenths (5000→5.0, 4900→4.9, ≤0→0.0) without ×"
    requirement: PLSH-01
    verification:
      - kind: unit
        ref: "src/games/crash/view/formatWaitCountdown.test.ts#formats 5000 ms as 5.0"
        status: pass
      - kind: unit
        ref: "src/games/crash/view/formatWaitCountdown.test.ts#formats 4900 ms as 4.9"
        status: pass
      - kind: unit
        ref: "src/games/crash/view/formatWaitCountdown.test.ts#clamps 0 and negative values to 0.0"
        status: pass
    human_judgment: false
  - id: D2
    description: "CrashScene waiting+idle theater shows countdown; climb clears to live ×; crash hold/fade unchanged"
    requirement: PLSH-01
    verification:
      - kind: other
        ref: "npx tsc --noEmit"
        status: pass
      - kind: unit
        ref: "npm test (81 passed incl. formatWaitCountdown)"
        status: pass
    human_judgment: true
    rationale: "Visible tenths → flight clear is canvas spectacle; automated suite proves wiring compiles and formatter green, but pixel/readability needs end-of-phase UAT"

duration: 4min
completed: 2026-09-27
status: complete
---

# Phase 5 Plan 01: Waiting Theater Countdown Summary

**Continuous tenths countdown on TheaterText live BitmapText during waiting idle, driven by existing `waitRemainingMs` (PLSH-01)**

## Performance

- **Duration:** 4 min
- **Started:** 2026-09-27T13:45:38Z
- **Completed:** 2026-09-27T13:49:31Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Pure `formatWaitCountdown` helper: clamp ≥0, `(ms/1000).toFixed(1)`, no × suffix
- Vitest RED→GREEN for 5000→5.0 / 4900→4.9 / ≤0→0.0
- `CrashScene.sync` waiting+idle branch drives theater countdown (white, full alpha); climb/crash paths unchanged

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: failing formatWaitCountdown tests** - `a40eea2` (test)
2. **Task 1 GREEN: implement formatWaitCountdown** - `37d4407` (feat)
3. **Task 2: CrashScene waiting+idle countdown** - `f2b3170` (feat)

**Plan metadata:** _(this commit)_

_Note: TDD tasks produce RED + GREEN commits_

## Files Created/Modified

- `src/games/crash/view/formatWaitCountdown.ts` - Pure tenths formatter from waitRemainingMs
- `src/games/crash/view/formatWaitCountdown.test.ts` - Unit cases for tenths / clamp / no ×
- `src/games/crash/view/CrashScene.ts` - waiting+idle theater countdown branch

## Decisions Made

- Gated countdown on `phase === "waiting" && mode === "idle"` (RESEARCH A1 / D-03) so tenths never flash over red crash × during hold/fade
- Reused existing TheaterText live BitmapText (D-01/D-04); TheaterText API and GameLogic untouched

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- PLSH-01 tracer complete; ready for 05-02 (AudioPort + mute)
- Manual smoke deferred to end-of-phase UAT: waiting shows 5.0→4.9… then clears on flight

## Self-Check: PASSED

- [x] `formatWaitCountdown.ts` / `.test.ts` exist on disk
- [x] `git log --grep=05-01` shows ≥1 commit (3 production commits)
- [x] Task ACs: formatter cases green; CrashScene imports/calls helper; logic/ and TheaterText unmodified
- [x] Plan verification: `npx vitest run …formatWaitCountdown.test.ts` exit 0; `npx tsc --noEmit` exit 0; `npm test` 81 passed

## TDD Gate Compliance

| Gate | Commit | Status |
|------|--------|--------|
| RED | `a40eea2` test(05-01) | Pass — RED_EVIDENCE_OK for formats 5000→5.0 |
| GREEN | `37d4407` feat(05-01) | Pass — 4/4 tests green |
| REFACTOR | — | Skipped (no cleanup needed) |

---
*Phase: 05-polish*
*Completed: 2026-09-27*
