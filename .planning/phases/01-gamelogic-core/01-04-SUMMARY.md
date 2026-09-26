---
phase: 01-gamelogic-core
plan: 04
subsystem: gamelogic
tags: [resolveTick, cash-out, auto-cash-out, settlement, vitest, hundredths]

requires:
  - phase: 01-gamelogic-core
    provides: Walking Skeleton createGame + wallet bounds + spectator cadence
provides:
  - resolveTick D-11 rounded crash / auto / manual settle compares
  - Idempotent settleOnce per roundId (PLAY-03/04, WALT-04)
  - setAutoCashOut stores 2dp targets; crash-before-auto table coverage
affects:
  - 01-05 architecture no-pixi + full suite gate
  - Phase 2 HUD cash-out / auto-CO controls

actuals:
  tokens: 5500
  tasks: 2
  commits: 5

tech-stack:
  added: []
  patterns:
    - "roundedMult via toMultHundredths/fromMultHundredths before all settle compares"
    - "Flying tick order: crash → auto CO → manual intent (single resolveTick)"
    - "setAutoCashOut rounds finite targets to 2dp; null clears"

key-files:
  created:
    - tests/resolveTick.test.ts
  modified:
    - src/games/crash/logic/resolveTick.ts

key-decisions:
  - "Settlement compares use roundedMult on live m, crashAt, and autoCashOutAt (D-11) — float edges like crashAt 2.004 settle at 2.00"
  - "setAutoCashOut stores rounded targets on state so snapshot and settle share hundredths precision"

patterns-established:
  - "Dedicated resolveTick.test.ts table suite for PLAY-03/04 and WALT-04 adjacency"
  - "TDD RED targets D-11 rounding gaps that facade happy-paths already covered from 01-02"

requirements-completed: [PLAY-03, PLAY-04, WALT-04]

coverage:
  - id: D1
    description: "Manual cash-out mid-flight pays stake × rounded current multiplier; waiting requestCashOut is no-op"
    requirement: PLAY-03
    verification:
      - kind: unit
        ref: "tests/resolveTick.test.ts#manual cash-out pays stake times rounded current multiplier (PLAY-03)"
        status: pass
      - kind: unit
        ref: "tests/resolveTick.test.ts#requestCashOut while waiting is a no-op"
        status: pass
    human_judgment: false
  - id: D2
    description: "Crash settle loses locked stake with no payout; rounded crash compare (D-11)"
    requirement: PLAY-04
    verification:
      - kind: unit
        ref: "tests/resolveTick.test.ts#crash settle loses locked stake with no payout (PLAY-04)"
        status: pass
      - kind: unit
        ref: "tests/resolveTick.test.ts#crash check compares rounded multipliers versus crashAt (D-11)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Idempotent settle — second settle attempt same roundId does not change balance"
    requirement: PLAY-03
    verification:
      - kind: unit
        ref: "tests/resolveTick.test.ts#idempotent settle does not change balance twice for same roundId"
        status: pass
    human_judgment: false
  - id: D4
    description: "Auto cash-out at target; null disables; crash wins when autoCashOutAt === crashAt; manual loses to crash same tick"
    requirement: WALT-04
    verification:
      - kind: unit
        ref: "tests/resolveTick.test.ts#auto cash-out settles when rounded multiplier reaches target before crash"
        status: pass
      - kind: unit
        ref: "tests/resolveTick.test.ts#setAutoCashOut(null) disables auto settle"
        status: pass
      - kind: unit
        ref: "tests/resolveTick.test.ts#crash-before-auto: when autoCashOutAt equals crashAt, crash wins with no payout"
        status: pass
      - kind: unit
        ref: "tests/resolveTick.test.ts#manual cash-out intent still loses to crash on the same tick"
        status: pass
      - kind: unit
        ref: "tests/resolveTick.test.ts#setAutoCashOut stores target rounded to 2dp"
        status: pass
    human_judgment: false

duration: 4min
completed: 2026-09-26
status: complete
---

# Phase 01 Plan 04: resolveTick Settlement Summary

**resolveTick settles manual cash-out, crash loss, and auto cash-out with D-11 hundredths compares, crash-before-auto ordering, and idempotent wallet updates**

## Performance

- **Duration:** 4 min
- **Started:** 2026-09-26T20:33:50Z
- **Completed:** 2026-09-26T20:38:49Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Manual cash-out (PLAY-03) and crash loss (PLAY-04) covered with idempotent `settledRoundId` wallet guard
- Auto cash-out (WALT-04) with crash-before-auto when targets equal; `setAutoCashOut(null)` disables
- All settle compares go through `roundedMult` (D-11); `setAutoCashOut` stores 2dp targets

## Task Commits

Each task was committed atomically (TDD RED → GREEN):

1. **Task 1 RED:** `1b935e5` — `test(01-04): add failing resolveTick manual cash-out and crash settle tests`
2. **Task 1 GREEN:** `084dbc0` — `feat(01-04): round multipliers before crash and cash-out settle compares`
3. **Task 2 RED:** `993a8e3` — `test(01-04): add failing auto cash-out and crash-before-auto tests`
4. **Task 2 GREEN:** `208dd57` — `feat(01-04): round setAutoCashOut targets to 2dp`

**Plan metadata:** (this commit)

## Files Created/Modified

- `tests/resolveTick.test.ts` — PLAY-03/04 + WALT-04 table suite (10 tests)
- `src/games/crash/logic/resolveTick.ts` — `roundedMult` settle compares; `setAutoCashOutTarget` 2dp store

## Decisions Made

- Compare live multiplier, `crashAt`, and `autoCashOutAt` only after `toMultHundredths`/`fromMultHundredths` so float edges (e.g. crashAt 2.004 at m=2.00) settle correctly
- Round `setAutoCashOut` targets at the facade write so snapshot and resolver share the same 2dp value

## Deviations from Plan

None - plan executed exactly as written.

Manual/crash/auto settle paths already existed from 01-02; TDD RED targeted D-11 rounding gaps (unrounded crashAt compare; unrounded `setAutoCashOut` storage) plus dedicated suite coverage.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Ready for **01-05** architecture no-pixi + full suite gate
- Full suite green: 30 tests (prior 20 + 10 resolveTick)

## Self-Check: PASSED

- [x] `tests/resolveTick.test.ts` exists on disk
- [x] `git log --grep=01-04` returns RED/GREEN commits
- [x] Task acceptance: manual cash-out + crash + rounded compare; setAutoCashOut + crash-before-auto order
- [x] `npx vitest run tests/resolveTick.test.ts` exits 0 (10 passed)
- [x] `npx vitest run` exits 0 (30 passed)
- [x] Crash-before-auto and idempotent settle asserted

---
*Phase: 01-gamelogic-core*
*Completed: 2026-09-26*
