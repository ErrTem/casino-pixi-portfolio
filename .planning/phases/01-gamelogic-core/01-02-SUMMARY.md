---
phase: 01-gamelogic-core
plan: 02
subsystem: gamelogic
tags: [crash, fsm, seedrandom, vitest, wallet, resolveTick]

requires:
  - phase: 01-gamelogic-core
    provides: Wave 0 Node+TS+Vitest scaffold + D-14 continuous auto-launch lock
provides:
  - createGame facade (placeBet / tick / requestCashOut / getSnapshot / resetWallet)
  - resolveTick settlement authority with crash-before-auto-before-manual
  - Seeded sampleCrashAt + exponential multiplierAt
  - Walking skeleton + crashRng Vitest suites green
affects:
  - 01-03 wallet bounds / spectator cadence
  - 01-04 resolveTick auto CO table tests
  - 01-05 architecture no-pixi + full suite
  - Phase 2 HUD command bridge

actuals:
  tokens: 8500
  tasks: 1
  commits: 2

tech-stack:
  added: []
  patterns:
    - "CrashGame facade: commands in / snapshots out"
    - "Integer cents + MultHundredths settlement"
    - "resolveTick single authority; tick sub-steps at maxDeltaMs"
    - "D-14 wait expiry → startRound (spectator OK)"

key-files:
  created:
    - src/shared/money/cents.ts
    - src/shared/rng/createRng.ts
    - src/games/crash/logic/config.ts
    - src/games/crash/logic/RoundState.ts
    - src/games/crash/logic/Wallet.ts
    - src/games/crash/logic/CrashRng.ts
    - src/games/crash/logic/MultiplierCurve.ts
    - src/games/crash/logic/History.ts
    - src/games/crash/logic/resolveTick.ts
    - src/games/crash/logic/CrashGame.ts
    - src/games/crash/logic/index.ts
    - tests/walkingSkeleton.test.ts
    - tests/crashRng.test.ts
  modified: []

key-decisions:
  - "placeBet accepts display units (e.g. 100 → 10000 cents); snapshot balance/bet expose display"
  - "CrashGame.tick sub-steps at maxDeltaMs so large deltas advance waiting/flight correctly"
  - "History always records round crashAt (including cash-out and spectator)"

patterns-established:
  - "Pure logic under src/games/crash/logic + src/shared; .js extensions for NodeNext"
  - "Wallet.placeBet deducts stake up front; cash-out credits payoutCents; crash = no credit"
  - "sampleCrashAt (1−e)/U clamped [1.01, 100] behind Rng"

requirements-completed: [ARCH-01, ARCH-02, ARCH-04, PLAY-01, PLAY-02, PLAY-04, PLAY-05, WALT-01]

coverage:
  - id: D1
    description: "createGame → placeBet → wait expiry → flying → cash-out settle with wallet + history"
    requirement: PLAY-01
    verification:
      - kind: e2e
        ref: "tests/walkingSkeleton.test.ts#seeded bet→fly→settle path with continuous auto-launch (D-14)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Same seed yields identical crashAt across createGame instances and sampleCrashAt sequences (ARCH-01)"
    requirement: ARCH-01
    verification:
      - kind: unit
        ref: "tests/crashRng.test.ts#same seed yields identical sampleCrashAt sequence"
        status: pass
      - kind: unit
        ref: "tests/crashRng.test.ts#two createGame instances with same seed share crashAt on first launch"
        status: pass
    human_judgment: false
  - id: D3
    description: "Spectator round (no bet) leaves wallet unchanged and still records crashAt in history (D-15)"
    requirement: PLAY-05
    verification:
      - kind: e2e
        ref: "tests/walkingSkeleton.test.ts#seeded bet→fly→settle path with continuous auto-launch (D-14)"
        status: pass
    human_judgment: false
  - id: D4
    description: "crashAt floor/cap bounds and (1−e)/U sampler (D-05..D-08)"
    requirement: ARCH-01
    verification:
      - kind: unit
        ref: "tests/crashRng.test.ts#never returns below crashFloor or above crashCap (D-06, D-07)"
        status: pass
    human_judgment: false
  - id: D5
    description: "No pixi.js imports under GameLogic (ARCH-02) — tracer gate; full suite map in 01-05"
    requirement: ARCH-02
    verification:
      - kind: other
        ref: "grep - no import pixi.js under src/games/crash/logic"
        status: pass
    human_judgment: false

duration: 4min
completed: 2026-09-26
status: complete
---

# Phase 01 Plan 02: Walking Skeleton Summary

**Pure TS CrashGame facade with seeded crashAt, exponential climb, resolveTick settlement, and green Vitest walking-skeleton path (bet→wait→fly→cash-out + spectator)**

## Performance

- **Duration:** 4 min
- **Started:** 2026-09-26T17:21:46Z
- **Completed:** 2026-09-26T17:25:00Z
- **Tasks:** 1
- **Files modified:** 13

## Accomplishments

- Implemented `createGame` / `CrashGame` with placeBet (display→cents), tick (sub-stepped), requestCashOut, getSnapshot, resetWallet
- Single `resolveTick` authority: waiting countdown → D-14 auto-launch → crash before auto before manual → settle → 5s waiting
- Seeded `(1−e)/U` crash sampler + exponential `multiplierAt`; walkingSkeleton + crashRng suites green (6 tests)

## Task Commits

Each task was committed atomically:

1. **Task 1: Walking Skeleton — createGame → placeBet → wait → fly → settle** - `065dada` (feat)

**Plan metadata:** *(this commit)*

## Files Created/Modified

- `src/shared/money/cents.ts` - Cents / MultHundredths helpers + payoutCents
- `src/shared/rng/createRng.ts` - seedrandom behind Rng.next()
- `src/games/crash/logic/config.ts` - CRASH_CONFIG (D-01..D-14 tunables)
- `src/games/crash/logic/RoundState.ts` - Phase + RoundState + CrashSnapshot types
- `src/games/crash/logic/Wallet.ts` - Integer-cent wallet with placeBet / credit / reset
- `src/games/crash/logic/CrashRng.ts` - sampleCrashAt house-edge sampler
- `src/games/crash/logic/MultiplierCurve.ts` - exponential multiplierAt
- `src/games/crash/logic/History.ts` - crashAt ring buffer
- `src/games/crash/logic/resolveTick.ts` - settlement FSM
- `src/games/crash/logic/CrashGame.ts` - public facade
- `src/games/crash/logic/index.ts` - barrel
- `tests/walkingSkeleton.test.ts` - E2E tracer
- `tests/crashRng.test.ts` - seed replay + floor/cap

## Decisions Made

- `placeBet` takes display units (document in facade JSDoc); internal money is integer cents
- `tick(deltaMs)` consumes time in `maxDeltaMs` chunks so `tick(5000)` correctly ends waiting
- History always pushes the round's `crashAt` (cash-out and spectator included)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None (spectator assertion initially used a single large `tick(60000)` which overshot into later auto-launched rounds; fixed in-test by ticking until phase returns to waiting — no production change)

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Ready for **01-03** wallet bounds / hard-stop / resetWallet + spectator cadence tables
- Shared requirement IDs (ARCH-*, PLAY-*, WALT-01) remain incomplete until sibling plans finish — walking skeleton is the initial coverage gate
- No blockers

## Self-Check: PASSED

- [x] Key created files exist on disk
- [x] `git log --grep=01-02` includes `065dada`
- [x] Acceptance: CRASH_CONFIG wait/houseEdge/floor/cap; sampleCrashAt bounds; multiplierAt uses Math.exp; createGame + resolveTick exports; vitest green; no pixi.js imports; createRng imports seedrandom
- [x] Plan verification: `npx vitest run tests/walkingSkeleton.test.ts tests/crashRng.test.ts` → 6 passed
- [x] Tracer feedback gate (end-of-phase, automated-only): re-ran verify — PASS; no checkpoint

---
*Phase: 01-gamelogic-core*
*Completed: 2026-09-26*
