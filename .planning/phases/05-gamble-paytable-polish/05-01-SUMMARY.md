---
phase: 05-gamble-paytable-polish
plan: 01
subsystem: logic
tags: [hotline, gamble, zod, wallet, vitest, seeded-rng]
status: complete

requires:
  - phase: 04-three-bonuses-combo-nights
    provides: HotlineGame base spin settle, night drain and wallet credit paths
provides:
  - required features.gamble (maxRounds 10, surviveChance 0.5) in Zod schema and bundled json
  - pure createGamble pot machine with offer clear resolve snapshot
  - Wallet.debit for the die path
  - HotlineGame base line win stake capture and clearGambleOffer resolveGamble getGambleSnapshot facade
affects:
  - 05-02 gamble session and HUD overlay
  - 05-03 paytable overlay

actuals:
  tokens: 9800
  tasks: 2
  commits: 3
plan_head_before: 70315f06cfcdee4d523d0708be28e02a3c9ecd41

tech-stack:
  added: []
  patterns:
    - gamble pot already sits in the wallet, survive credits it once more and die debits it
    - gamble math takes an injected rng so the session owns the seed:gamble stream

key-files:
  created:
    - src/games/hotline/logic/gamble/createGamble.ts
    - src/games/hotline/logic/gamble/createGamble.test.ts
    - src/games/hotline/logic/Wallet.test.ts
  modified:
    - src/games/hotline/config/HotlineConfigSchema.ts
    - src/games/hotline/config/hotline.config.json
    - src/games/hotline/config/HotlineConfigSchema.test.ts
    - src/games/hotline/logic/Wallet.ts
    - src/games/hotline/logic/HotlineGame.ts
    - src/games/hotline/logic/HotlineGame.test.ts
    - src/games/hotline/logic/index.ts

key-decisions:
  - "GambleResolve.stakeCents is the pot after the resolve (doubled on survive, 0 on die); HotlineGame reads the prior pot from the snapshot before resolving to know what to credit or debit"
  - "baseLineWinCents is set only in base spin settle and cleared when a new base spin is paid for; spinFree and night totals never touch it, so the offer survives a night (RESEARCH Q1)"
  - "resolveGamble takes an rng argument instead of owning a stream, so 05-02 can pass createRng(seed:gamble)"
  - "HotlineSnapshot is left unchanged, gamble state is read through getGambleSnapshot"

patterns-established:
  - "Gamble math stays pure (no wallet, no view) and HotlineGame glues it to Wallet"

requirements-completed: [GAMBLE-01, GAMBLE-02]

coverage:
  - id: D1
    description: "features.gamble is required in the Zod schema and bundled json with maxRounds 10 and surviveChance 0.5"
    requirement: GAMBLE-01
    verification:
      - kind: unit
        ref: "src/games/hotline/config/HotlineConfigSchema.test.ts#throws ZodError when features.gamble is missing"
        status: pass
    human_judgment: false
  - id: D2
    description: "createGamble resolves equal chance double or nothing with a ten round cap and seeded replay"
    requirement: GAMBLE-01
    verification:
      - kind: unit
        ref: "src/games/hotline/logic/gamble/createGamble.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "Wallet.debit guards integer positive in-balance amounts for the die path"
    requirement: GAMBLE-01
    verification:
      - kind: unit
        ref: "src/games/hotline/logic/Wallet.test.ts"
        status: pass
    human_judgment: false
  - id: D4
    description: "HotlineGame stakes only the base line win, never free spin wins or night totals, and keeps it across a night"
    requirement: GAMBLE-02
    verification:
      - kind: unit
        ref: "src/games/hotline/logic/HotlineGame.test.ts#gamble stake capture (GAMBLE-01, GAMBLE-02)"
        status: pass
    human_judgment: false

duration: 7min
completed: 2026-10-12
---

# Phase 5 Plan 1: Gamble math and stake capture Summary

Seeded double-or-nothing gamble logic (Zod `features.gamble`, pure `createGamble`, `Wallet.debit`) wired into `HotlineGame` so the base line win is the only stake, with no DOM or session code.

## Accomplishments

- `features.gamble` is required in `HotlineConfigSchema` (positive integer `maxRounds`, 0..1 `surviveChance`); bundled json uses 10 and 0.5; a missing object fails Zod parse
- `createGamble({ maxRounds, surviveChance })` offers a stake, resolves with `rng.next() < surviveChance`, doubles on survive, zeroes on die, stops offering after `maxRounds`
- `Wallet.debit` rejects non-integer, non-positive and over-balance amounts
- `HotlineGame` captures `baseLineWinCents` in base spin settle only and exposes `clearGambleOffer`, `resolveGamble(rng)`, `getGambleSnapshot`
- survive credits the pot once more, die debits the pot, clear never debits; the offer persists through a night and the stake is never the night total

## Task Commits

1. Task 1 RED: `39b366a` test(05-01) failing tests for pot, debit and stake capture
2. Task 1 GREEN: `5cddd4f` feat(05-01) config, createGamble, Wallet.debit, HotlineGame facade
3. Task 2: `819dd59` test(05-01) die debit, ten round cap, seeded stream, post night stake

## Verification

- `npx vitest run src/games/hotline/config src/games/hotline/logic`: 13 files, 113 passed after Task 1; logic suite 95 passed after Task 2
- `npx vitest run` full suite: 54 files, 376 passed
- `npx tsc --noEmit`: exit 0
- RED evidence for Task 1 recorded in `05-01-tdd-red-t1.json`, verdict `RED_EVIDENCE_OK`

## Deviations from Plan

### Auto-fixed Issues

None.

### Notes

**1. [Task 2 tests passed on first run]** Task 1 already implemented DIE debit, the round cap, clear-without-debit and base-pot persistence, so the Task 2 tests went green immediately and no separate RED could be shown. They were added as a test-only commit that locks the behavior. No production change was needed in Task 2.

**2. [Uncommitted tuning left alone]** `hotline.config.json` carried an uncommitted edit raising `tokenOdds.perSpinChance` to 0.9, 0.8, 0.7. Only the gamble field was staged into the task commit; the odds edit is still an uncommitted working tree change. All new tests use explicit odds so they do not depend on it.

**Total deviations:** 0 auto-fixed. **Impact:** none on scope.

## TDD Gate Compliance

Plan type is `execute` with `tdd="true"` tasks. Task 1 has a `test(05-01)` RED commit followed by a `feat(05-01)` GREEN commit. Task 2 is test-only (see note 1).

## Known Stubs

None.

## Threat Flags

None. T-05-01 (Zod gate on features.gamble) and T-05-03 (Wallet.debit input guards) are mitigated and tested.

## Next Phase Readiness

05-02 can build the session timer and HUD on `getGambleSnapshot`, `resolveGamble(createRng(seed:gamble))` and `clearGambleOffer`. `HotlineSnapshot` does not carry gamble fields.

## Self-Check: PASSED

- created files exist: createGamble.ts, createGamble.test.ts, Wallet.test.ts
- commits 39b366a, 5cddd4f, 819dd59 present in git log
- acceptance criteria re-run: schema and JSON gamble, ZodError on missing fixture, createGamble tests (offer, survive, die, clear, maxRounds), Wallet.debit true and false cases, HotlineGame base-only stake, index exports, tsc exit 0
