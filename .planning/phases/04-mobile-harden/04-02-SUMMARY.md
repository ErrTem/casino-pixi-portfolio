---
phase: 04-mobile-harden
plan: 02
subsystem: ui
tags: [css, touch, safe-area, chromeMode, resize, visualViewport, mobile]

requires:
  - phase: 04-mobile-harden
    provides: Fixed chrome budget and pointer-events isolation (04-01)
  - phase: 03-pixi-hybrid-view
    provides: mountCrashView resizeTo host + DPR cap 2
provides:
  - chromeModeFrom(phase) → normal | promote-cashout
  - hud-bar--promote-cashout full-width Cash out during flying|cashed_out
  - ≥44px waiting tap targets + touch-action manipulation
  - viewport-fit=cover + env(safe-area-inset-*) bar padding
  - orientationchange / visualViewport → capped resolution refresh + app.resize()
affects: [04-03-mobile-qa, ARCH-03]

actuals:
  tokens: 1829
  tasks: 3
  commits: 5

tech-stack:
  added: []
  patterns:
    - "phase-promote-chrome: chromeModeFrom(phase) toggles hud-bar--promote-cashout; enablement stays separate"
    - "host-resize-harden: orientationchange + visualViewport.resize refresh capped resolution then app.resize()"

key-files:
  created:
    - src/games/crash/hud/chromeMode.ts
    - src/games/crash/hud/chromeMode.test.ts
  modified:
    - src/games/crash/hud/CrashHud.ts
    - src/styles/hud.css
    - index.html
    - src/games/crash/view/mountCrashView.ts
    - src/main.ts

key-decisions:
  - "Promote chrome from snapshot.phase (flying|cashed_out), never from canCashOut (D-08)"
  - "dispose() returned from mountCrashView removes resize listeners before HMR app.destroy"
  - "Waiting defaults min-height 2.75rem; promoted Cash out 2.875rem full-width; de-emphasized controls stay visible at 2rem"

patterns-established:
  - "chromeMode is pure and decoupled from enablementFrom"
  - "Safe-area pads .hud-bar only; canvas host is not padded for home indicator"
  - "resizeTo stays host; DPR cap 2 on init and refresh"

requirements-completed: [ARCH-03]

coverage:
  - id: D1
    description: "chromeModeFrom maps flying|cashed_out → promote-cashout and waiting|crashed → normal"
    requirement: ARCH-03
    verification:
      - kind: unit
        ref: "src/games/crash/hud/chromeMode.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "CrashHud toggles hud-bar--promote-cashout from phase; cashOut.disabled still from canCashOut only"
    requirement: ARCH-03
    verification:
      - kind: other
        ref: "rg chromeModeFrom + hud-bar--promote-cashout + canCashOut in CrashHud.ts"
        status: pass
      - kind: unit
        ref: "src/games/crash/hud/enablement.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "Promote CSS full-width Cash out 2.875rem; waiting ≥44px targets; touch-action manipulation; safe-area pads; viewport-fit=cover"
    requirement: ARCH-03
    verification:
      - kind: other
        ref: "rg promote/touch-action/safe-area in hud.css; viewport-fit=cover in index.html"
        status: pass
    human_judgment: true
    rationale: "Thumb reach and notch clearance need device/DevTools visual check in 04-03"
  - id: D4
    description: "mountCrashView keeps resizeTo host + DPR cap 2; orientation/visualViewport refresh with dispose cleanup"
    requirement: ARCH-03
    verification:
      - kind: other
        ref: "rg resizeTo host + Math.min(...,2) + orientationchange + dispose in mountCrashView.ts"
        status: pass
      - kind: unit
        ref: "tests/architecture.no-pixi.test.ts"
        status: pass
      - kind: unit
        ref: "npm test (77 tests)"
        status: pass
    human_judgment: true
    rationale: "Rotate/reflow on real iOS chrome show-hide is plan 04-03 manual QA"

duration: 2min
completed: 2026-09-27
status: complete
---

# Phase 04 Plan 02: Touch + Safe-Area + Resize Harden Summary

**Phase-promoted full-width Cash out on flying|cashed_out, ≥44px waiting tap targets with safe-area padding, and host-sized Pixi refresh on orientation/visualViewport**

## Performance

- **Duration:** 2 min
- **Started:** 2026-09-27T15:18:25Z
- **Completed:** 2026-09-27T15:20:13Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- Pure `chromeModeFrom` maps `flying`/`cashed_out` → `promote-cashout` (D-08 keeps promote when Cash out is disabled)
- `CrashHud` toggles `hud-bar--promote-cashout`; CSS promotes Cash out to full-width 2.875rem while bet/chips/auto-CO stay smaller but visible
- Waiting controls get `touch-action: manipulation` and `min-height: 2.75rem`; bar pads with `env(safe-area-inset-*)`; viewport meta includes `viewport-fit=cover`
- `mountCrashView` refreshes capped DPR then `app.resize()` on orientation/visualViewport; `dispose()` cleans listeners for HMR

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): chromeModeFrom failing tests** - `c81ba14` (test)
2. **Task 1 (GREEN): chromeModeFrom implementation** - `a34a749` (feat)
3. **Task 2: Promote Cash out CSS, tap targets, safe-area, CrashHud toggle** - `b9a4fd9` (feat)
4. **Task 3: Harden mountCrashView orientation and visualViewport resize** - `a184cf8` (feat)

**Plan metadata:** `c2bd91e` (docs: complete plan)

_Note: TDD Task 1 used test → feat commit sequence_

## Files Created/Modified

- `src/games/crash/hud/chromeMode.ts` - Pure phase → chrome mode helper
- `src/games/crash/hud/chromeMode.test.ts` - Phase table unit tests
- `src/games/crash/hud/CrashHud.ts` - Class toggle from chromeModeFrom
- `src/styles/hud.css` - Promote rules, tap targets, touch-action, safe-area
- `index.html` - `viewport-fit=cover` on viewport meta
- `src/games/crash/view/mountCrashView.ts` - Orientation/visualViewport refresh + dispose
- `src/main.ts` - HMR dispose calls mount dispose before app.destroy

## Decisions Made

- Promote from `snapshot.phase` only — never fold into `enablementFrom` / `canCashOut` (D-08)
- Prefer `dispose` on `MountedCrashView` over main-only listeners so mount owns listener lifecycle
- Kept 04-01 fixed chrome budget and pointer-events isolation unchanged

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Ready for 04-03 mobile QA (mash-test Cash out, safe-area/notch, rotate reflow)
- ARCH-03 still shared with 04-03 — do not mark REQUIREMENTS Complete until QA plan SUMMARY exists
- No GameLogic edits; enablement matrix unchanged

## Self-Check: PASSED

- [x] Key files exist on disk (`chromeMode.ts`, `chromeMode.test.ts`, modified HUD/CSS/mount)
- [x] `git log --oneline --all --grep="04-02"` includes test + feat commits
- [x] `npx vitest run src/games/crash/hud/chromeMode.test.ts src/games/crash/hud/enablement.test.ts` exit 0
- [x] `npx vitest run tests/architecture.no-pixi.test.ts` exit 0
- [x] `npx tsc --noEmit` exit 0
- [x] `npm test` exit 0 (77 passed)

---
*Phase: 04-mobile-harden*
*Completed: 2026-09-27*
