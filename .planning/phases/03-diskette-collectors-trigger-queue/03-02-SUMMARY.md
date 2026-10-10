---
phase: 03-diskette-collectors-trigger-queue
plan: 02
subsystem: logic
tags: [hotline, collectors, zod, seedrandom, vitest, COLL-01, COLL-02, COLL-03]

requires:
  - phase: 02-hotline-base-playable
    provides: HotlineGame spin, HotlineConfigSchema tokenOdds, createRng
  - phase: 03-diskette-collectors-trigger-queue
    provides: diskette PNG pack from 03-01 (presentation later)
provides:
  - TokenColor green/red/purple + TOKEN_COLOR_ORDER
  - resolveCollectors spawn/trigger/cell outcomes
  - PhoneMeters soft-cap + per-color reset
  - ComboQueue fixed Green→Red→Purple order
  - HotlineSnapshot.collectorOutcome + meterFills booked at spin settle
  - createRng(`${seed}:collectors`) stream split from SpinEngine
affects:
  - 03-03 TokenFlight / PhonesLayer presentation
  - 03-04 session busy FSM + progressive meter display
  - Phase 4 real bonus engines (consume queue stub API)

actuals:
  tokens: 8150
  tasks: 2
  commits: 3

plan_head_before: 2e4159d75195c233c0b1989d17acaa5dc0aa9a67

tech-stack:
  added: []
  patterns:
    - "collectors rng suffix createRng(`${seed}:collectors`) keeps strip grids seed-stable"
    - "spin settle books every spawn into PhoneMeters once; presentation fills later"
    - "tokenOdds.perSpinChance + triggerChance as green/red/purple Zod chance01"

key-files:
  created:
    - src/games/hotline/logic/collectors/TokenColors.ts
    - src/games/hotline/logic/collectors/resolveCollectors.ts
    - src/games/hotline/logic/collectors/PhoneMeters.ts
    - src/games/hotline/logic/collectors/ComboQueue.ts
    - src/games/hotline/logic/collectors/resolveCollectors.test.ts
    - src/games/hotline/logic/collectors/PhoneMeters.test.ts
    - src/games/hotline/logic/collectors/ComboQueue.test.ts
  modified:
    - src/games/hotline/config/HotlineConfigSchema.ts
    - src/games/hotline/config/hotline.config.json
    - src/games/hotline/config/HotlineConfigSchema.test.ts
    - src/games/hotline/logic/HotlineGame.ts
    - src/games/hotline/logic/HotlineGame.test.ts
    - src/games/hotline/logic/index.ts

key-decisions:
  - "Separate collectors RNG stream via seed suffix so feature chance edits cannot steal strip draws"
  - "Meter increments book only at HotlineGame.spin settle; 03-04 animates display from pre-spin baseline"
  - "PhoneMeters.reset stays on the meters API for 03-04 stub pop, not on HotlineGame yet"

patterns-established:
  - "CollectorOutcome { spawns, queue } attached on every settled snapshot"
  - "Fixed TOKEN_COLOR_ORDER drives spawn loop and combo queue filter"
  - "Illustrative triggerChance ~0.08–0.12 independent of meter fill"

requirements-completed: [COLL-01, COLL-02, COLL-03]

coverage:
  - id: D1
    description: Zod + bundled JSON use green/red/purple perSpinChance and triggerChance with 0..1 reject paths
    requirement: COLL-01
    verification:
      - kind: unit
        ref: src/games/hotline/config/HotlineConfigSchema.test.ts#uses green red purple perSpinChance and triggerChance keys
        status: pass
      - kind: unit
        ref: src/games/hotline/config/HotlineConfigSchema.test.ts#throws ZodError when triggerChance is missing
        status: pass
    human_judgment: false
  - id: D2
    description: resolveCollectors returns distinct-cell spawns and fixed Green→Red→Purple queue
    requirement: COLL-01
    verification:
      - kind: unit
        ref: src/games/hotline/logic/collectors/resolveCollectors.test.ts#spawns three colors on distinct cells when all chances are 1
        status: pass
      - kind: unit
        ref: src/games/hotline/logic/collectors/resolveCollectors.test.ts#never lists purple before green when both fire
        status: pass
    human_judgment: false
  - id: D3
    description: PhoneMeters soft-cap display and per-color reset; HotlineGame books fills at settle
    requirement: COLL-02
    verification:
      - kind: unit
        ref: src/games/hotline/logic/collectors/PhoneMeters.test.ts#soft caps display at meterTarget while counts may exceed
        status: pass
      - kind: unit
        ref: src/games/hotline/logic/HotlineGame.test.ts#attaches collectorOutcome and books meter fills at settle
        status: pass
    human_judgment: false
  - id: D4
    description: Combo queue order Green→Red→Purple; strip grids stable under feature-table edits
    requirement: COLL-03
    verification:
      - kind: unit
        ref: src/games/hotline/logic/collectors/ComboQueue.test.ts#orders fired colors green then red then purple
        status: pass
      - kind: unit
        ref: src/games/hotline/logic/HotlineGame.test.ts#keeps strip grids stable when only feature chances change
        status: pass
    human_judgment: false

duration: 8min
completed: 2026-10-10
status: complete
---

# Phase 3 Plan 02: Collector Logic Tracer Summary

**Config colors + triggerChance, pure collectors math, and HotlineGame.spin booking collectorOutcome / meter fills on a separate RNG stream**

## Performance

- **Duration:** 8 min
- **Started:** 2026-10-10T20:28:00Z
- **Completed:** 2026-10-10T20:33:00Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments

- Renamed `tokenOdds` colors to green/red/purple and added Zod-validated `triggerChance`
- Shipped `resolveCollectors`, `PhoneMeters`, and `ComboQueue` with Vitest coverage
- `HotlineGame.spin` attaches `collectorOutcome` + authoritative `meterFills` using `createRng(\`${seed}:collectors\`)`
- Locked strip seed parity under feature-table edits; removed Phase 2 feature-isolation forbid

## TDD Gate Compliance

| Task | RED | GREEN | Notes |
|------|-----|-------|-------|
| 1 tracer | ✓ `432036b` | ✓ `d38aeb7` | `RED_EVIDENCE_OK` on color-key assertion |
| 2 harden | — | ✓ `f457540` (test) | Coverage-only against Task 1 GREEN; no new production behavior |

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: End-to-end spin attaches collectorOutcome** - `432036b` (test)
2. **Task 1 GREEN: wire collector outcome on spin settle** - `d38aeb7` (feat)
3. **Task 2: Harden seed parity and queue order coverage** - `f457540` (test)

**Plan metadata:** `31b4a55` (docs: complete plan)

## Files Created/Modified

- `src/games/hotline/logic/collectors/TokenColors.ts` - TOKEN_COLOR_ORDER + TokenColor
- `src/games/hotline/logic/collectors/resolveCollectors.ts` - spawn/trigger/cell resolve
- `src/games/hotline/logic/collectors/PhoneMeters.ts` - soft-cap meters + reset
- `src/games/hotline/logic/collectors/ComboQueue.ts` - fixed-order queue helpers
- `src/games/hotline/config/HotlineConfigSchema.ts` / `hotline.config.json` - D-01 D-09 contract
- `src/games/hotline/logic/HotlineGame.ts` - settle booking + snapshot fields
- Collector + HotlineGame + schema tests

## Decisions Made

- Collectors RNG uses `${seed}:collectors` so strip grids stay Phase-2-compatible when feature chances change
- Meter increments book only at spin settle; progressive display is owned by 03-04
- Kept `PhoneMeters.reset` off `HotlineGame` until 03-04 wires stub pop (avoids session wrapper churn)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Dropped HotlineGame.resetPhoneMeter from public API**
- **Found during:** Task 1 GREEN (`tsc --noEmit`)
- **Issue:** Adding `resetPhoneMeter` to `HotlineGame` broke `mountHotlineSession` hudGame typing; session is out of this plan's file list
- **Fix:** Keep reset on `PhoneMeters` only; 03-04 can wrap when stub pop lands
- **Files modified:** `src/games/hotline/logic/HotlineGame.ts`
- **Verification:** `npx tsc --noEmit` exit 0
- **Committed in:** `d38aeb7`

---

**Total deviations:** 1 auto-fixed (Rule 3)
**Impact on plan:** Correctness only; reset API still available for later stub drain via PhoneMeters

## Issues Encountered

None beyond the tsc wrapper mismatch above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Logic half of COLL-01..03 ready for 03-03 TokenFlight / PhonesLayer and 03-04 session busy + progressive fills
- Do not implement Green/Red/Purple bonus engines here (D-12 stub only in later plans)
- Diskette PNGs from 03-01 are available for Assets.load

## Self-Check: PASSED

- FOUND: collector modules, schema/json, HotlineGame, SUMMARY path
- FOUND commits: `432036b`, `d38aeb7`, `f457540`

---
*Phase: 03-diskette-collectors-trigger-queue*
*Completed: 2026-10-10*
