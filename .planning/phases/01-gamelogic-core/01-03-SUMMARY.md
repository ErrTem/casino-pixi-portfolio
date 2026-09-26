---
phase: 01-gamelogic-core
plan: 03
subsystem: gamelogic
tags: [wallet, cents, spectator, cadence, vitest, hard-stop]

requires:
  - phase: 01-gamelogic-core
    provides: Walking Skeleton createGame + resolveTick continuous cadence
provides:
  - Wallet D-01..D-04 bounds, hard-stop broke, resetWallet coverage
  - Spectator D-15 + PLAY-01/05 cadence edge suite
  - History non-finite crashAt guard
affects:
  - 01-04 resolveTick auto CO table tests
  - Phase 2 HUD wallet reset + bet validation UI

actuals:
  tokens: 6000
  tasks: 2
  commits: 5

tech-stack:
  added: []
  patterns:
    - "Wallet hard-stop reason broke when balance < minBetCents (D-03)"
    - "CrashGame rejects non-finite placeBet display at command boundary"
    - "History.push ignores non-finite crashAt"

key-files:
  created:
    - tests/wallet.test.ts
    - tests/roundCadence.test.ts
  modified:
    - src/games/crash/logic/Wallet.ts
    - src/games/crash/logic/CrashGame.ts
    - src/games/crash/logic/History.ts

key-decisions:
  - "Hard-stop returns reason broke before insufficient_balance when balance < min bet"
  - "Non-finite placeBet amounts rejected at CrashGame boundary (ASVS V5)"
  - "History ring drops non-finite crashAt to protect spectator history consumers"

patterns-established:
  - "Dedicated wallet.test.ts / roundCadence.test.ts suites expand Walking Skeleton contracts"
  - "TDD RED targets stable reason codes and integrity guards, not re-proving 01-02 paths"

requirements-completed: [WALT-01, WALT-02, PLAY-01, PLAY-05]

coverage:
  - id: D1
    description: "Demo wallet min/max/balance validation, hard-stop when broke, resetWallet to 500000 cents"
    requirement: WALT-02
    verification:
      - kind: unit
        ref: "tests/wallet.test.ts#accepts min bet 10 and max bet 1000 when balance allows (WALT-02 boundary)"
        status: pass
      - kind: unit
        ref: "tests/wallet.test.ts#hard-stops with broke when balance is below min bet (D-03)"
        status: pass
      - kind: unit
        ref: "tests/wallet.test.ts#resetWallet restores startingBalanceCents 500000 (D-04)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Win/loss balance deltas via stake deduct and payoutCents credit (WALT-01)"
    requirement: WALT-01
    verification:
      - kind: unit
        ref: "tests/wallet.test.ts#loss settle decreases balance by stake; win increases by payoutCents (WALT-01)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Spectator round leaves wallet unchanged and records crashAt; wait returns with waitRemainingMs 5000"
    requirement: PLAY-05
    verification:
      - kind: unit
        ref: "tests/roundCadence.test.ts#spectator round (no bet) still flies and crashes; balance unchanged; history gains crashAt (D-15)"
        status: pass
      - kind: unit
        ref: "tests/roundCadence.test.ts#after terminal settle, waiting opens with waitRemainingMs exactly 5000 (PLAY-05 / D-13)"
        status: pass
    human_judgment: false
  - id: D4
    description: "placeBet only in waiting; auto-launch after 5000ms with locked bet; history ring size 20"
    requirement: PLAY-01
    verification:
      - kind: unit
        ref: "tests/roundCadence.test.ts#tick totaling 5000ms in waiting with a locked bet enters flying (PLAY-01)"
        status: pass
      - kind: unit
        ref: "tests/roundCadence.test.ts#placeBet while flying is rejected (PLAY-01)"
        status: pass
      - kind: unit
        ref: "tests/roundCadence.test.ts#history ring keeps at most historySize (20) entries"
        status: pass
    human_judgment: false

duration: 6min
completed: 2026-09-26
status: complete
---

# Phase 01 Plan 03: Wallet Bounds + Spectator Cadence Summary

**Demo wallet enforces min/max/balance hard-stop with `broke` + `resetWallet`, and spectator/5s cadence edges are covered with History non-finite guards**

## Performance

- **Duration:** 6 min
- **Started:** 2026-09-26T17:26:54Z
- **Completed:** 2026-09-26T17:32:17Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Wallet D-01..D-04 / WALT-01/02: min 10 / max 1000 / ≤ balance, hard-stop `broke`, `resetWallet` to 5000 display, non-finite reject
- Spectator D-15 + PLAY-01/05: auto-launch with/without bet, `waitRemainingMs === 5000` after terminal, flying `placeBet` reject, history ring 20
- History ignores non-finite `crashAt` so spectator history stays clean

## Task Commits

Each task was committed atomically (TDD RED → GREEN):

1. **Task 1 RED:** `98a0655` — `test(01-03): add failing wallet hard-stop and bounds tests`
2. **Task 1 GREEN:** `b2896ca` — `feat(01-03): enforce wallet hard-stop broke and command-boundary reject`
3. **Task 2 RED:** `0f6e4b5` — `test(01-03): add failing spectator cadence and history integrity tests`
4. **Task 2 GREEN:** `8607347` — `feat(01-03): ignore non-finite crashAt in history ring`

**Plan metadata:** (this commit)

## Files Created/Modified

- `tests/wallet.test.ts` — WALT-01/02 + D-01..D-04 coverage
- `tests/roundCadence.test.ts` — PLAY-01/05 + D-13..D-15 + history integrity
- `src/games/crash/logic/Wallet.ts` — `broke` hard-stop before other rejects
- `src/games/crash/logic/CrashGame.ts` — non-finite display reject at `placeBet`
- `src/games/crash/logic/History.ts` — skip non-finite `push`

## Decisions Made

- Prefer stable reason `broke` when balance &lt; min bet (D-03) even if the requested stake also exceeds balance
- Reject non-finite bet display amounts at the CrashGame command boundary before cents conversion
- Drop non-finite values from History rather than storing them for HUD consumers

## Deviations from Plan

None - plan executed exactly as written.

Cadence/spectator settlement paths already existed from 01-02; Task 2 TDD RED targeted History non-finite integrity plus dedicated suite coverage of those contracts.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Ready for `01-04` resolveTick auto cash-out table tests
- Walking skeleton + wallet + cadence suites green (20 tests)

## Self-Check: PASSED

- [x] `tests/wallet.test.ts` and `tests/roundCadence.test.ts` exist on disk
- [x] `git log --grep=01-03` returns RED/GREEN commits
- [x] Task acceptance criteria verified (min/max/resetWallet; spectator/5000; history.push path)
- [x] `npx vitest run` exits 0 (20 passed)
- [x] Prior walking skeleton still green

---
*Phase: 01-gamelogic-core*
*Completed: 2026-09-26*
