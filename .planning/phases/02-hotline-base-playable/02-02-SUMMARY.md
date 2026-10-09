---
phase: 02-hotline-base-playable
plan: 02
subsystem: logic
tags: [hotline, paylines, wallet, vitest]
status: complete

requires:
  - phase: 02-01
    provides: HotlineConfig, loadHotlineConfig
provides:
  - createHotlineGame facade (spin, setBetStepIndex, getSnapshot)
  - evaluatePaylines with ltr wild dual track
  - Wallet clamped to config bet steps, seeded SpinEngine
affects:
  - 02-03 session and hud read HotlineSnapshot
  - phase 3 adds collectors on top of the settled spin

estimate:
  tokens: 35000
  tasks: 2

actuals:
  tokens: 14000
  tasks: 2
  commits: 4

plan_head_before: 6cea886dd654d9cdcf73707aa1aca018121838b1

tech-stack:
  added: []
  patterns:
    - reel-major grid, grid[reel][row]
    - payouts as multiplier hundredths of total bet via shared cents helper

key-files:
  created:
    - src/games/hotline/logic/Wallet.ts
    - src/games/hotline/logic/SpinEngine.ts
    - src/games/hotline/logic/evaluatePaylines.ts
    - src/games/hotline/logic/evaluatePaylines.test.ts
    - src/games/hotline/logic/HotlineGame.ts
    - src/games/hotline/logic/HotlineGame.test.ts
    - src/games/hotline/logic/index.ts
  modified:
    - tests/architecture.no-pixi.test.ts

key-decisions:
  - "line pays the higher of wild-only run and substituted run, ties go to the substituted run"
  - "wild-only run pays only if the paytable has a row for the wild id, the bundled table has none so leading wilds just extend the substituted run"
  - "setBetStepIndex floors fractions and ignores non finite input, default step is index 0"
  - "pre-spin grid is a static window of plain symbols so no wild or win shows before the first spin"

requirements-completed: [BASE-01, BASE-02, BASE-03]

completed: 2026-10-09
---

# Phase 2 Plan 02: HOTLINE Spin Math Facade Summary

Pure logic spin on the 02-01 config: bet step deduct, seeded 5x4 grid, 40 left to right paylines with wild dual track, wins credited into the snapshot.

## Accomplishments

- evaluatePaylines pays consecutive runs from reel 0 only, wild substitutes, takes max of wild-only vs substituted per line, sums lines
- Wallet only accepts amounts that are members of math.betStepsCents and fit the balance
- createHotlineGame settles through evaluatePaylines and exposes display strings from integer cents
- spin settlement never reads config.features, covered by a source scan and by a test that swaps the feature tables and expects identical snapshots
- tests/architecture.no-pixi.test.ts now scans src/games/hotline/logic

## Task Commits

1. Task 1 RED: `bc84fa7` test(02-02): failing tests for payline eval and hotline game
2. Task 1 GREEN: `aa7966e` feat(02-02): hotline spin math facade with payline wild dual track
3. Task 2 RED: `7be87aa` test(02-02): failing tests for bet step hardening
4. Task 2 GREEN: `49c1dec` feat(02-02): lock hotline bet steps to real config indexes

## TDD Gate Compliance

- Task 1 RED: stub evaluatePaylines and createHotlineGame, 17 of 20 tests failed on assertions
- Task 1 GREEN: all pass, tsc exit 0, architecture suite green
- Task 2 RED: 2 failing tests (fractional index gives 2.7, NaN index poisons the step); the other new tests lock behavior Task 1 already delivered, so they passed from the start
- Task 2 GREEN: full suite 226 of 226, tsc exit 0
- REFACTOR: not needed
- RED evidence json not persisted, plan is type execute

## Deviations from Plan

None. Bet step clamping was written in Task 1 (it is in that task's behavior list), so Task 2 only added the fraction and non finite hardening plus the isolation tests.

## Known Stubs

None.

## Issues Encountered

None.

## Self-Check: PASSED

- all created files exist under src/games/hotline/logic
- commits `bc84fa7`, `aa7966e`, `7be87aa`, `49c1dec` exist in git log
- `npx vitest run src/games/hotline`, `npm test`, `npx tsc --noEmit` all exit 0
