---
phase: 06-enhance-and-rework-ui-buttons-behavior
plan: 03
subsystem: logic
tags: [growthRatePerMs, multiplierCurve, FEEL-01, vitest, climb-retune]

requires:
  - phase: 06-01
    provides: shell wave complete; climb retune parallel-safe after Wave 1
provides:
  - growthRatePerMs = Math.LN2 / 3750 (~2× @ 3.75s)
  - multiplierCurve tests locked to 3750 → 2×
  - crash sampler / houseEdge / floor / cap unchanged (D-15)
affects:
  - 06-04 arcade camera feel (slower tip motion)
  - phase UAT for climb pace in 3.5–4s band

actuals:
  tokens: 2800
  tasks: 1
  commits: 3

tech-stack:
  added: []
  patterns:
    - single authoritative climb knob Math.LN2 / half-time-ms
    - resolveTick flying fixtures keyed to growthRate 2× horizon

key-files:
  created: []
  modified:
    - src/games/crash/logic/config.ts
    - tests/multiplierCurve.test.ts
    - tests/resolveTick.test.ts

key-decisions:
  - "growthRatePerMs = Math.LN2 / 3750 mid-band of D-14 3.5–4s (RESEARCH Q1)"
  - "D-15: houseEdge/crashFloor/crashCap/CrashRng untouched — only growth rate"
  - "resolveTick flyingState elapsedMs 3650 so +100ms tick lands at 3750→2×"

patterns-established:
  - "Pattern: retune climb via CRASH_CONFIG.growthRatePerMs only; MultiplierCurve consume-only"
  - "Pattern: settlement fixture elapsed = 2× horizon − maxDeltaMs"

requirements-completed: [FEEL-01]

coverage:
  - id: D1
    description: Authoritative climb ~2× at 3.75s via Math.LN2/3750; curve tests lock 0→1 and 3750→2
    requirement: FEEL-01
    verification:
      - kind: unit
        ref: tests/multiplierCurve.test.ts#equals 1.00 at 0ms and 2.00 near 3750ms (D-14 / FEEL-01)
        status: pass
      - kind: unit
        ref: tests/multiplierCurve.test.ts#growthRatePerMs is the named CRASH_CONFIG constant (D-12 / D-14)
        status: pass
      - kind: other
        ref: npx vitest run tests/architecture.no-pixi.test.ts
        status: pass
      - kind: other
        ref: npm test (126 passed)
        status: pass
    human_judgment: false
  - id: D2
    description: Crash distribution unchanged — houseEdge/crashFloor/crashCap/CrashRng not edited
    requirement: FEEL-01
    verification:
      - kind: unit
        ref: tests/crashRng.test.ts
        status: pass
      - kind: other
        ref: config.ts houseEdge=0.04 crashFloor=1.01 crashCap=100 unchanged vs pre-plan
        status: pass
    human_judgment: false

duration: 2min
completed: 2026-09-29
status: complete
---

# Phase 06 Plan 03: Climb Retune Summary

**Authoritative climb slowed to ~2× at 3.75s via `growthRatePerMs = Math.LN2 / 3750`; crash sampler untouched (FEEL-01 / D-14 / D-15)**

## Performance

- **Duration:** 2 min
- **Started:** 2026-09-29T16:04:21Z
- **Completed:** 2026-09-29T16:06:52Z
- **Tasks:** 1
- **Files modified:** 3

## Accomplishments

- Retuned single climb knob `CRASH_CONFIG.growthRatePerMs` to `Math.LN2 / 3750` (mid-band of 3.5–4s)
- Updated `tests/multiplierCurve.test.ts` so 3750ms → 2×; removed default-config 2500 → 2× assertions
- Kept `houseEdge` / `crashFloor` / `crashCap` / CrashRng unchanged; ARCH-02 logic purity still green

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: multiplierCurve 3750 expectations** - `b1408e9` (test)
2. **Task 1 GREEN: growthRatePerMs + resolveTick fixtures** - `598d73a` (feat)

**Plan metadata:** docs(06-03): complete climb retune plan

_Note: TDD RED → GREEN; no REFACTOR commit (minimal config change)._

## TDD Gate Compliance

| Gate | Commit | Status |
|------|--------|--------|
| RED | `b1408e9` test(06-03): expect 2x at 3750ms | Pass — `RED_EVIDENCE_OK` (target asserted LN2/3750; actual LN2/2500) |
| GREEN | `598d73a` feat(06-03): retune growthRatePerMs | Pass — multiplierCurve + full suite green |
| REFACTOR | — | Skipped (no cleanup needed) |

## Files Created/Modified

- `src/games/crash/logic/config.ts` — `growthRatePerMs: Math.LN2 / 3750` (D-14 comment)
- `tests/multiplierCurve.test.ts` — 3750 / LN2÷3750 assertions (FEEL-01)
- `tests/resolveTick.test.ts` — flying fixture elapsedMs 3650 so +100ms tick hits 2×

## Decisions Made

- Locked RESEARCH Q1 constant `Math.LN2 / 3750` (QA may nudge 3500–4000 without reopening D-14)
- D-15 honored: only growth rate changed in production config
- Shifted resolveTick flying fixtures with the retune so settlement timing tests stay coherent

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Update resolveTick flying fixtures for new 2× horizon**
- **Found during:** Task 1 GREEN (`npm test`)
- **Issue:** `flyingState` used `elapsedMs: 2400` assuming LN2/2500 → 2× after +100ms; under LN2/3750 those ticks never reached crash/cash-out at 2× (6 failures)
- **Fix:** Set `elapsedMs: 3650`, `multiplier: 1.96` so +`maxDeltaMs` lands at 3750 → 2.00
- **Files modified:** `tests/resolveTick.test.ts`
- **Verification:** `npm test` → 126 passed
- **Committed in:** `598d73a` (Task 1 GREEN)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Required for plan `<verify>` `npm test` exit 0; no production settlement logic changed (matches plan “do not edit resolveTick settlement compares”).

## Issues Encountered

None beyond the fixture retune above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Ready for **06-04** arcade camera + soft path + Seed chip removal (Wave 3)
- FEEL-01 complete; FEEL-02 / PLSH-03Δ remain

## Self-Check: PASSED

- [x] `growthRatePerMs = Math.LN2 / 3750`
- [x] multiplierCurve tests use 3750 → 2×; no default 2500 → 2× left
- [x] houseEdge/crashFloor/crashCap/CrashRng untouched
- [x] `npx vitest run tests/multiplierCurve.test.ts` exit 0
- [x] `npx vitest run tests/architecture.no-pixi.test.ts` exit 0
- [x] `npm test` exit 0 (126 passed)
- [x] Commits: `b1408e9` (test), `598d73a` (feat)

---
*Phase: 06-enhance-and-rework-ui-buttons-behavior*
*Completed: 2026-09-29*
