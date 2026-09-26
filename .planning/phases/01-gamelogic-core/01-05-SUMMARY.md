---
phase: 01-gamelogic-core
plan: 05
subsystem: gamelogic
tags: [architecture, arch-02, multiplier, play-02, vitest, no-pixi]

requires:
  - phase: 01-gamelogic-core
    provides: resolveTick settlement + wallet + spectator cadence (01-02..01-04)
provides:
  - architecture.no-pixi Vitest gate (no pixi.js / document / window in logic+shared)
  - package.json deny-list for pixi.js and vite until Phase 2
  - multiplierCurve PLAY-02 exponential 2dp coverage (D-09..D-12)
  - ARCH-04 full Vitest suite green (37 tests)
affects:
  - Phase 2 Vite/Pixi shell (must keep logic import-free)
  - Phase verify-work / UAT for GameLogic Core

actuals:
  tokens: 1000
  tasks: 2
  commits: 5

tech-stack:
  added: []
  patterns:
    - "Filesystem string-scan architecture gate (fail-closed on forbidden imports)"
    - "PLAY-02 multiplierAt covered as e^(r·t) vs linear anti-regression"

key-files:
  created:
    - tests/architecture.no-pixi.test.ts
    - tests/multiplierCurve.test.ts
  modified:
    - src/games/crash/logic/MultiplierCurve.ts

key-decisions:
  - "ARCH-02 enforced via fs read + import/DOM regex deny-list, not browser execution"
  - "package.json must not list pixi.js or vite in Phase 1 (Phase 2 adds them)"

patterns-established:
  - "architecture.no-pixi.test.ts is the Phase 1→2 boundary lock for pure logic"
  - "multiplierCurve.test.ts owns D-09..D-12 curve contracts separately from walking skeleton"

requirements-completed: [ARCH-02, ARCH-04, PLAY-02]

coverage:
  - id: D1
    description: "No pixi.js import or document/window usage under logic/shared; package.json free of pixi.js/vite"
    requirement: ARCH-02
    verification:
      - kind: unit
        ref: "tests/architecture.no-pixi.test.ts#logic and shared sources must not import pixi.js or use document/window"
        status: pass
      - kind: unit
        ref: "tests/architecture.no-pixi.test.ts#package.json must not list pixi.js or vite dependencies"
        status: pass
    human_judgment: false
  - id: D2
    description: "multiplierAt is exponential e^(r·t) with 1.00@0ms and 2.00@2500ms, growthRatePerMs named constant"
    requirement: PLAY-02
    verification:
      - kind: unit
        ref: "tests/multiplierCurve.test.ts#equals 1.00 at 0ms and 2.00 near 2500ms (D-09)"
        status: pass
      - kind: unit
        ref: "tests/multiplierCurve.test.ts#uses smooth exponential e^(r·t), not linear (D-10)"
        status: pass
      - kind: unit
        ref: "tests/multiplierCurve.test.ts#growthRatePerMs is the named CRASH_CONFIG constant (D-12)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Full Vitest suite green covering wallet, crashRng, resolveTick, roundCadence, walkingSkeleton, architecture, multiplierCurve"
    requirement: ARCH-04
    verification:
      - kind: unit
        ref: "npx vitest run (37 passed / 7 files)"
        status: pass
    human_judgment: false

duration: 5min
completed: 2026-09-26
status: complete
---

# Phase 01 Plan 05: Architecture Gate + Multiplier Curve Summary

**ARCH-02 no-renderer/DOM Vitest gate plus PLAY-02 exponential multiplierCurve coverage; full suite 37 green closes Phase 1 quality gate**

## Performance

- **Duration:** 5 min
- **Started:** 2026-09-26T17:40:29Z
- **Completed:** 2026-09-26T17:45:55Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Automated ARCH-02 boundary: logic/shared deny pixi.js imports and document/window; package.json deny pixi.js/vite
- PLAY-02 / D-09..D-12: `multiplierAt` proven exponential (`e^(r·t)`), not linear, with 2dp hundredths rounding
- ARCH-04 phase gate: full `npx vitest run` — 7 files, 37 passed

## Task Commits

Each task was committed atomically (TDD RED → GREEN):

1. **Task 1 RED:** `62326a6` — `test(01-05): add failing architecture no-pixi gate`
2. **Task 1 GREEN:** `d7ed4d5` — `feat(01-05): keep logic free of renderer and DOM imports`
3. **Task 2 RED:** `6fca84a` — `test(01-05): add failing multiplierCurve PLAY-02 tests`
4. **Task 2 GREEN:** `ddd4b3f` — `feat(01-05): restore exponential multiplierAt for PLAY-02`

**Plan metadata:** (this commit)

## Files Created/Modified

- `tests/architecture.no-pixi.test.ts` — ARCH-02 fs scan + package.json deny-list
- `tests/multiplierCurve.test.ts` — PLAY-02 / D-09..D-12 exponential curve suite
- `src/games/crash/logic/MultiplierCurve.ts` — restored `Math.exp(growthRatePerMs · t)` after RED linear stub

## Decisions Made

- Prefer filesystem string checks over executing browser code for the architecture gate
- Assert exponential vs linear at mid-flight (1250ms) so a linear stub cannot fake D-09 endpoints alone

## Deviations from Plan

None - plan executed exactly as written.

TDD RED for both tasks used temporary violations (pixi.js import probe; linear `multiplierAt`) because production already matched the contracts from 01-02; RED evidence verified via `gsd-tools check tdd-red-evidence`.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 01 GameLogic Core plans complete (5/5) — ready for `/gsd-verify-work` then Phase 2 Vite shell + HTML HUD
- Do not add pixi.js/vite until Phase 2; architecture gate must stay green

## Self-Check: PASSED

- [x] `tests/architecture.no-pixi.test.ts` and `tests/multiplierCurve.test.ts` exist on disk
- [x] `git log --grep=01-05` returns RED/GREEN commits
- [x] Task 1 ACs: architecture gate exists; fails closed on forbidden import; no pixi.js in package.json; vitest exit 0
- [x] Task 2 ACs: 1.00@0ms / 2.00@2500ms; exponential form; `growthRatePerMs` exported; all listed test files present
- [x] `npx vitest run tests/architecture.no-pixi.test.ts` exits 0
- [x] `npx vitest run` exits 0 (37 passed)
- [x] No pixi.js / vite in package.json

---
*Phase: 01-gamelogic-core*
*Completed: 2026-09-26*
