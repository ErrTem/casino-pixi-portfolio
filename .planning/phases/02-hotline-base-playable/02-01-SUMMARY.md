---
phase: 02-hotline-base-playable
plan: 01
subsystem: config
tags: [zod, config, hotline, vitest]
status: complete

requires: []
provides:
  - HotlineConfigSchema and HotlineConfig type (full envelope)
  - bundled hotline.config.json with 40 illustrative paylines
  - loadHotlineConfig throw boundary
affects:
  - 02-02 math facade reads math and paytable
  - 02-03 session mount calls loadHotlineConfig
  - phase 3 and 4 read the feature tables

estimate:
  tokens: 28000
  tasks: 2

actuals:
  tokens: 9000
  tasks: 2
  commits: 3

plan_head_before: 3c61c8d5a3ee89fce086c60d3eb9e7b6eca96fae

tech-stack:
  added: [zod@^4.6.5]
  patterns:
    - json imported with attributes and parsed at the boundary
    - z.object for every nested bag, superRefine for cross checks

key-files:
  created:
    - src/games/hotline/config/HotlineConfigSchema.ts
    - src/games/hotline/config/hotline.config.json
    - src/games/hotline/config/loadHotlineConfig.ts
    - src/games/hotline/config/HotlineConfigSchema.test.ts
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "paytable values are multipliers of total bet (A3)"
  - "paylines are an illustrative 40 by 5 row index table with steps of at most one row (A1)"
  - "bonusPrizes is an array keyed by bonusId, tokenOdds holds meterTarget plus per spin chance per color"
  - "wild and paytable symbols are cross checked against reel weights in superRefine"

requirements-completed: [CFG-01]

completed: 2026-10-09
---

# Phase 2 Plan 01: HOTLINE Zod Config Summary

Zod 4 validated HOTLINE config envelope (grid literals, 40 paylines, weights, paytable, token odds, bonus prizes, jackpot multipliers) with a throwing loader.

## Accomplishments

- Task 1 (blocking human verify of the zod package) was approved by the user before this run
- zod@^4.6.5 installed, no howler and no pixi-reels
- schema locks rows 4, reels 5, paylineCount 40, payline rows 0..3, and checks the wild and paytable symbols exist in every reel weight table
- loadHotlineConfig parses the bundled JSON and throws a ZodError on bad input, no soft fallback

## Task Commits

1. Task 2 install: `5b4cdce` chore(02-01): add zod for hotline config
2. Task 2 RED: `4c3a277` test(02-01): failing tests for hotline config schema
3. Task 2 GREEN: `065a5d4` feat(02-01): zod schema for hotline config envelope

## TDD Gate Compliance

- RED: stub schema (`z.object({})`) plus JSON, loader and 8 tests; all 8 failed on assertions for the planned behavior (not import errors)
- GREEN: full schema, 8 of 8 pass, `npx tsc --noEmit` exits 0, full suite 199 of 199 pass
- REFACTOR: not needed
- RED evidence json was not persisted because the plan is `type: execute`, not `type: tdd`

## Deviations from Plan

None. The stub schema in the RED commit is the usual way to get assertion failures instead of an import crash.

## Known Stubs

None. The numbers in the JSON are illustrative and carry no RTP claim (D-02).

## Self-Check: PASSED

- schema, JSON, loader and test files exist
- commits `5b4cdce`, `4c3a277`, `065a5d4` exist in git log
