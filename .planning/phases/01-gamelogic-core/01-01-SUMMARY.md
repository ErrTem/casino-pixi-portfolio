---
phase: 01-gamelogic-core
plan: 01
subsystem: infra
tags: [vitest, typescript, seedrandom, node, scaffold]

requires: []
provides:
  - Node+TS+Vitest Wave 0 package scaffold (no Pixi/Vite)
  - D-14 continuous auto-launch locked (option-continuous)
affects:
  - 01-02 Walking Skeleton tracer
  - Phase 2 HUD cadence
  - Phase 5 countdown chrome

actuals:
  tokens: 4500
  tasks: 2
  commits: 2

tech-stack:
  added: [seedrandom@3.0.5, typescript@~5.8.3, vitest@3.2.7, @types/seedrandom@3.0.8, @types/node]
  patterns: [Wave 0 scaffold before logic modules; Vitest environment node]

key-files:
  created:
    - package.json
    - package-lock.json
    - tsconfig.json
    - vitest.config.ts
  modified: []

key-decisions:
  - "D-14 locked as option-continuous: waiting waitRemainingMs→0 always calls startRound (spectator rounds allowed); PLAY-01 reinterpreted as timed waiting, not idle-until-click"

patterns-established:
  - "Scaffold-before-tracer: pinned Node Vitest package before any GameLogic modules"
  - "No pixi.js/vite in logic-phase package.json (ARCH-02 boundary from Wave 0)"

requirements-completed: [ARCH-04]

coverage:
  - id: D1
    description: "Wave 0 package scaffold with pinned seedrandom/typescript/vitest and Vitest node environment"
    requirement: ARCH-04
    verification:
      - kind: other
        ref: "package.json scripts.test=vitest run; vitest@3.2.7; environment node in vitest.config.ts"
        status: pass
      - kind: other
        ref: "git show bb7b084 — feat(01-01): Wave 0 scaffold package + Vitest node"
        status: pass
    human_judgment: false
  - id: D2
    description: "D-14 continuous auto-launch confirmed (option-continuous) before tracer implements WAIT_MS expiry → startRound"
    verification: []
    human_judgment: true
    rationale: "One-way product cadence decision recorded via checkpoint:decision; no runtime assertion until 01-02 implements startRound on wait expiry"

duration: 8min
completed: 2026-09-26
status: complete
---

# Phase 01 Plan 01: Wave 0 Scaffold + D-14 Summary

**Pinned Node+TS+Vitest Wave 0 package (seedrandom@3.0.5, vitest@3.2.7) with D-14 continuous auto-launch locked as option-continuous**

## Performance

- **Duration:** 8 min
- **Started:** 2026-09-26T17:10:00Z
- **Completed:** 2026-09-26T17:19:07Z
- **Tasks:** 2
- **Files modified:** 4 (scaffold) + planning metadata

## Accomplishments

- Installed Wave 0 Node+TS+Vitest scaffold with pinned deps; no `pixi.js` or `vite` in package.json
- Confirmed D-14 continuous auto-launch (`option-continuous`) — waiting expiry always starts a round, including spectator rounds
- Cleared the one-way door so 01-02 Walking Skeleton can implement WAIT_MS → `startRound`

## Task Commits

Each task was committed atomically:

1. **Task 1: Wave 0 scaffold package + Vitest node** - `bb7b084` (feat)
2. **Task 2: Confirm D-14 continuous auto-launch (one-way door)** - decision recorded in this SUMMARY + STATE (no code commit; checkpoint:decision)

**Plan metadata:** *(this commit)*

## Files Created/Modified

- `package.json` - ESM package; `test`/`test:watch`; seedrandom dep; typescript/vitest/@types (no pixi.js/vite)
- `package-lock.json` - Locked install from pinned versions
- `tsconfig.json` - Strict ES2022 / NodeNext for `src/` + `tests/`
- `vitest.config.ts` - `environment: "node"`; includes `src/**/*.test.ts` and `tests/**/*.test.ts`

## Decisions Made

- **D-14 = option-continuous (locked):** When `waitRemainingMs` hits zero, `startRound` always fires even with no bet (spectator rounds). PLAY-01 means place-bet during timed waiting, not click-to-start. Undo would force HUD, Phase 5 countdown, and cadence tests off timed waiting onto a manual Start command.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Ready for **01-02 Walking Skeleton tracer** (`createGame` → bet→fly→settle with D-14 wait expiry → `startRound`)
- ARCH-04 remains shared with 01-02/01-05 — scaffold is the initial coverage gate only; do not treat Vitest suite as complete until 01-05
- No blockers

## Self-Check: PASSED

- [x] `package.json`, `vitest.config.ts`, `tsconfig.json` exist on disk
- [x] `git log --grep=01-01` includes `bb7b084`
- [x] Task 1 acceptance: scripts.test=`vitest run`; seedrandom present; no pixi.js; vitest 3.2.7; environment node; tsconfig at root
- [x] Plan verification: no pixi.js/vite deps; vitest node env; D-14 resolved as option-continuous
- [x] Success criteria: Wave 0 scaffold + D-14 confirmed before tracer

---
*Phase: 01-gamelogic-core*
*Completed: 2026-09-26*
