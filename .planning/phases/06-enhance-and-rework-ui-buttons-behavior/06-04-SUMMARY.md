---
phase: 06-enhance-and-rework-ui-buttons-behavior
plan: 04
subsystem: ui
tags: [pixi, world-camera, pathMapping, gentle-tilt, seed-chip, PLSH-03Δ, FEEL-02]

requires:
  - phase: 06-01
    provides: 100dvh shell; dual-line primary; seed-chip host already omitted
  - phase: 06-02
    provides: Auto bet waiting-edge place (must not regress)
  - phase: 06-03
    provides: climb retune LN2/3750 (softer tip motion under camera)
provides:
  - arcade world Container camera (craft near center; trail scrolls; freeze on crash)
  - softened plotPoint (linear-X blend + milder SCALE_HEADROOM) + gentleTiltRadians clamp
  - Seed chip deleted; silent ?seed= via parseBootSeed + createGame retained
  - PLSH-03Δ / FEEL-02 / VIS-01Δ REQUIREMENTS marked complete
affects:
  - phase UAT for arcade camera feel + silent seed boot
  - milestone close (Phase 6 last plan)

actuals:
  tokens: 13930
  tasks: 3
  commits: 5

tech-stack:
  added: []
  patterns:
    - world-Container camera offset (never stage.x/y)
    - soft plot X = blend(log2, linear) via VIEW_CONFIG.PLOT_X_LINEAR_BLEND
    - gentleTiltRadians clamp to TILT_MAX_RAD (±15°)
    - silent-seed-boot: parseBootSeed → createGame only (no HUD seed surface)

key-files:
  created: []
  modified:
    - src/games/crash/view/pathMapping.ts
    - src/games/crash/view/viewConfig.ts
    - src/games/crash/view/CrashScene.ts
    - tests/pathMapping.test.ts
    - src/games/crash/hud/CrashHud.ts
    - src/main.ts
    - tests/shell.hud-layout.test.ts
    - .planning/REQUIREMENTS.md
    - .planning/research/FEATURES.md
  deleted:
    - src/games/crash/hud/seedChip.ts

key-decisions:
  - "PLOT_X_LINEAR_BLEND=0.55 + SCALE_HEADROOM=1.1 for soft mid/late climb (D-16 discretionary)"
  - "TILT_MAX_RAD = π/12 (±15°) clamp — not lerp — for D-18 gentle tilt"
  - "CAMERA_CENTER_Y_RATIO=0.52 lock point below theater upper third (D-17/D-20)"
  - "Crash freezes latched world.position; idle resets world identity (D-19)"
  - "Seed options removed from MountCrashHudOptions; invalid seed stays quiet (D-22)"

patterns-established:
  - "Pattern: stage → backdrop → world(curve+ghost+rocket) → theater → flash"
  - "Pattern: tip lock via world.position = screenLock - tipLocal (never stage.x/y)"
  - "Pattern: PLSH-03Δ = silent ?seed= boot only; no on-screen seed UX"

requirements-completed: [FEEL-02, PLSH-03Δ, VIS-01Δ]

coverage:
  - id: D1
    description: Softened pathMapping + gentleTiltRadians (±15°) with unit coverage; m=1 origin retained
    requirement: FEEL-02
    verification:
      - kind: unit
        ref: tests/pathMapping.test.ts#mid/late climb tip motion is soft — 2×→4× slope not dramatically steeper than 1×→2× (D-16)
        status: pass
      - kind: unit
        ref: tests/pathMapping.test.ts#gentleTiltRadians clamps path tangent into a small band (D-18)
        status: pass
      - kind: unit
        ref: tests/pathMapping.test.ts#m=1 is the origin (left/bottom)
        status: pass
    human_judgment: false
  - id: D2
    description: World Container camera centers craft; freezes on crash; never writes stage.x/y; theater outside world
    requirement: FEEL-02
    verification:
      - kind: other
        ref: npx tsc --noEmit
        status: pass
      - kind: other
        ref: rg "app.stage.(x|y)\s*=" src/games/crash/view/CrashScene.ts (no matches)
        status: pass
      - kind: other
        ref: CrashScene world Container label crash-world + frozenWorld latch
        status: pass
    human_judgment: true
    rationale: Craft-centering and crash-freeze feel require visual UAT; automated checks cover structure/types only
  - id: D3
    description: Seed chip removed; silent ?seed= boot retained; PLSH-03Δ docs amended
    requirement: PLSH-03Δ
    verification:
      - kind: unit
        ref: src/shared/boot/parseBootSeed.test.ts
        status: pass
      - kind: unit
        ref: tests/shell.hud-layout.test.ts#omits seed-chip host
        status: pass
      - kind: other
        ref: npm test (127 passed)
        status: pass
    human_judgment: false
  - id: D4
    description: Hybrid visual still reads under arcade camera (curve + rocket + crash sever)
    requirement: VIS-01Δ
    verification: []
    human_judgment: true
    rationale: Visual continuity of curve/rocket/crash under new camera needs human judgment in UAT

duration: 5min
completed: 2026-09-29
status: complete
---

# Phase 06 Plan 04: Arcade Camera + Seed Removal Summary

**World-Container arcade camera with softened path + ±15° gentle tilt; Seed chip deleted; silent `?seed=` boot retained (FEEL-02 / PLSH-03Δ / VIS-01Δ)**

## Performance

- **Duration:** 5 min
- **Started:** 2026-09-29T16:09:31Z
- **Completed:** 2026-09-29T16:14:16Z
- **Tasks:** 3
- **Files modified:** 9 (+1 deleted)

## Accomplishments

- Softened `plotPoint` via `PLOT_X_LINEAR_BLEND=0.55` + `SCALE_HEADROOM=1.1`; added `gentleTiltRadians` clamp to `TILT_MAX_RAD` (±15°)
- Arcade camera: `world` Container parents curve/ghost/rocket; tip locked near screen center; crash freezes world offset; theater/flash stay screen-fixed
- Deleted `seedChip.ts`; cleaned HUD/main seed options; REQUIREMENTS PLSH-03Δ / FEEL-02 / VIS-01Δ complete; FEATURES Auto-bet promotion note synced

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: Soft path + tilt tests** - `1aa0d38` (test)
2. **Task 1 GREEN: Soften plotPoint + clamp tilt** - `f94bf2a` (feat)
3. **Task 2: Arcade world Container camera + crash freeze** - `9747fbb` (feat)
4. **Task 3: Remove Seed chip + PLSH-03Δ docs** - `49a10fe` (feat)

**Plan metadata:** _(docs commit follows)_

_Note: TDD Task 1 produced RED → GREEN commits; no REFACTOR needed_

## Files Created/Modified

- `src/games/crash/view/pathMapping.ts` — soft X blend + `gentleTiltRadians`
- `src/games/crash/view/viewConfig.ts` — soft-map / tilt / camera lock tunables
- `src/games/crash/view/CrashScene.ts` — world Container camera; freeze on crash
- `tests/pathMapping.test.ts` — soft-slope + tilt clamp cases
- `src/games/crash/hud/CrashHud.ts` — removed seed/invalid mount options
- `src/main.ts` — silent `parseBootSeed` → `createGame({ seed })` only
- `tests/shell.hud-layout.test.ts` — seed-chip absence assertion wording
- `.planning/REQUIREMENTS.md` — PLSH-03Δ / FEEL-02 / VIS-01Δ complete
- `.planning/research/FEATURES.md` — Seed chip superseded; Auto-bet Phase 6 note
- ~~`src/games/crash/hud/seedChip.ts`~~ — deleted

## Decisions Made

- Soft coefficients: blend 0.55 + headroom 1.1 (RESEARCH discretionary under D-16)
- Gentle tilt via clamp ±15° rather than lerp 0.25
- Craft lock at `CAMERA_CENTER_Y_RATIO=0.52` (below theater at 0.18)
- Invalid/missing `?seed=` stays quiet — no on-screen note (D-22)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 6 plans 06-01..06-04 all have SUMMARYs — phase execution complete
- Ready for `/gsd-verify-work 6` (UAT: arcade camera feel + silent `?seed=`) and milestone close
- Auto bet (06-02) and dual-line primary (06-01) contracts honored — no regression

## Self-Check: PASSED

- [x] key-files exist on disk (`pathMapping.ts`, `CrashScene.ts`, `viewConfig.ts`; `seedChip.ts` absent)
- [x] `git log --grep=06-04` returns ≥1 commit
- [x] Task acceptance criteria re-verified (`vitest pathMapping`, `tsc`, boot+shell, `npm test` 127/127)
- [x] Plan-level verification commands green

---
*Phase: 06-enhance-and-rework-ui-buttons-behavior*
*Completed: 2026-09-29*
