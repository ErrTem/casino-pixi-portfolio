---
phase: 03-pixi-hybrid-view
plan: 03
subsystem: ui
tags: [pixi.js, rocket, backdrop, flash, idle-bob, FillGradient]

requires:
  - phase: 03-pixi-hybrid-view
    provides: "CrashScene climb/sever trail, viewMode hold/fade, TheaterText dual-read"
provides:
  - "createRocket with setBodyTexture seam and 8-dot streak"
  - "createBackdrop sky→cosmos rebuild-on-resize"
  - "crash flash, ghost origin, idle bob wired in CrashScene"
affects: [04-mobile-touch, 05-polish]

actuals:
  tokens: 3100
  tasks: 2
  commits: 3

tech-stack:
  added: []
  patterns: [tangent-parent, texture-swap-seam, idle-atmosphere, resize-only-backdrop]

key-files:
  created:
    - src/games/crash/view/Rocket.ts
    - src/games/crash/view/Backdrop.ts
  modified:
    - src/games/crash/view/CrashScene.ts

key-decisions:
  - "Streak dots live in rocket local -X so parent tangent rotation carries them (no world-space offsets)"
  - "Flash is alpha on a full-canvas Graphics rect; stage.x/stage.y never written (D-10)"
  - "Backdrop rebuilds only on screen size change via rebuildIfNeeded — never cleared each sync frame"

patterns-established:
  - "Pattern tangent-parent: plotPoint + pathTangentRadians drive container pose; body is a child"
  - "Pattern texture-swap-seam: setBodyTexture toggles bodySprite vs bodyGraphics without moving path math"
  - "Pattern idle-atmosphere: ghost ring + sin bob + IDLE_CRASH_ALPHA theater while mode idle"

requirements-completed: [VIS-01]

coverage:
  - id: D1
    description: "Rocket Container at plotPoint with tangent rotation, geometric body, setBodyTexture, 8-dot streak while climbing"
    requirement: VIS-01
    verification:
      - kind: other
        ref: "npx tsc --noEmit"
        status: pass
      - kind: unit
        ref: "tests/architecture.no-pixi.test.ts"
        status: pass
      - kind: unit
        ref: "tests/pathMapping.test.ts"
        status: pass
    human_judgment: true
    rationale: "Tangent nose and streak appearance need a live WebGL round; Node Vitest has no canvas pixels"
  - id: D2
    description: "Crash plays full-canvas red flash without moving stage; hold/fade from existing reduceViewMode"
    requirement: VIS-01
    verification:
      - kind: unit
        ref: "tests/viewMode.test.ts"
        status: pass
      - kind: other
        ref: "npx tsc --noEmit"
        status: pass
    human_judgment: true
    rationale: "Flash intensity and sever timing are visual; automation covers reducer clocks only"
  - id: D3
    description: "Waiting shows sky-to-cosmos backdrop, ghost at origin, bobbing rocket, dim last crash ×"
    requirement: VIS-01
    verification:
      - kind: other
        ref: "npm test"
        status: pass
    human_judgment: true
    rationale: "Backdrop gradient, ghost ring, and bob amplitude are pixel checks deferred to end-of-phase UAT"

duration: 2min
completed: 2026-09-27
status: complete
---

# Phase 03 Plan 03: Rocket Seam + Idle Atmosphere Summary

**Tangent-parent rocket with texture-swap seam and 8-dot streak, plus resize-only sky backdrop, crash flash, ghost origin, and idle bob wired through existing viewMode timers**

## Performance

- **Duration:** 2 min
- **Started:** 2026-09-26T22:30:32Z
- **Completed:** 2026-09-26T22:32:50Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Replaced the inline polygon rocket with `createRocket()` — parent pose follows path tangent; `setBodyTexture` swaps geometric body for a future Texture without rewriting path math
- Climb shows an 8-dot local -X streak; crash_hold hides the rocket on the sever frame (D-11)
- Added `createBackdrop` (sky→cloud→cosmos FillGradient, clouds, ~40 stars, dim plot grid) rebuilt only on resize
- Crash flash decays from `FLASH_PEAK_ALPHA` over `FLASH_MS` on the hold clock; idle shows ghost ring, `BOB_PERIOD_MS` bob, and dim latched crash ×

## Task Commits

Each task was committed atomically:

1. **Task 1: Tangent rocket with texture-swap seam and tail streak** - `b5dd836` (feat)
2. **Task 2: Backdrop, crash flash, ghost origin, and idle bob** - `3d2078c` (feat)

**Plan metadata:** _(pending this commit)_

## Files Created/Modified

- `src/games/crash/view/Rocket.ts` - createRocket, setBodyTexture, syncPose + streak
- `src/games/crash/view/Backdrop.ts` - createBackdrop rebuild-on-resize layers
- `src/games/crash/view/CrashScene.ts` - wires Rocket, Backdrop, flash, ghost, idle bob

## Decisions Made

- Streak dots use local -X so parent rotation carries them along -tangent
- Flash is Graphics alpha only — no stage.x/stage.y (D-10 / T-03-09)
- Backdrop never cleared each frame; `rebuildIfNeeded` on screen size change only

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 03 plans 01–03 complete on disk; ready for `/gsd-verify-work 03` (harvests human-check neon/tangent/sever/flash/bob)
- Mobile stacking and pointer-events remain Phase 4; countdown digits remain Phase 5
- VIS-01 edge probe still unclassified per plan flagged_assumptions — review in verify-work, not dropped

## Self-Check: PASSED

- [x] `src/games/crash/view/Rocket.ts` exists
- [x] `src/games/crash/view/Backdrop.ts` exists
- [x] `git log --oneline --grep="03-03"` returns task commits
- [x] `npx tsc --noEmit` exits 0
- [x] `npx vitest run tests/viewMode.test.ts tests/pathMapping.test.ts tests/architecture.no-pixi.test.ts` exits 0
- [x] `npm test` exits 0 (64 tests)
- [x] Task acceptance criteria greps pass (createRocket/setBodyTexture, no Assets.load/ParticleContainer, BOB_PERIOD_MS/FLASH_PEAK_ALPHA, no stage.x/y)

---
*Phase: 03-pixi-hybrid-view*
*Completed: 2026-09-27*
