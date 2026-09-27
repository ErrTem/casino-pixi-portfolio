---
phase: 04-mobile-harden
plan: 01
subsystem: ui
tags: [css, responsive, hud, pointer-events, flexbox, mobile]

requires:
  - phase: 03-pixi-hybrid-view
    provides: Pixi canvas in #game-canvas-host with resizeTo host
  - phase: 02-vite-shell-html-hud
    provides: .app-shell column flex, three-zone #hud-bar, 720px stack
provides:
  - Fixed --hud-bar-height 15.5rem chrome budget on ≤720px
  - Leftover viewport for .canvas-host via flex 1 1 auto
  - One-column stack with history below chips (.hud-zone--right column)
  - Canvas hit isolation via pointer-events none + hud-bar z-index
affects: [04-02-touch-safe-area, 04-03-mobile-qa, ARCH-03]

actuals:
  tokens: 403
  tasks: 1
  commits: 2

tech-stack:
  added: []
  patterns:
    - "fixed-chrome-budget: --hud-bar-height + flex 0 0 on ≤720px; host takes remainder"
    - "hit-isolation: pointer-events none on .canvas-host and canvas; .hud-bar z-index 1"

key-files:
  created: []
  modified:
    - src/styles/hud.css

key-decisions:
  - "15.5rem fixed bar height inside max-width 720px only (D-02/D-04); desktop stays content-sized"
  - "touch-action pan-x on .history-strip so horizontal swipe coexists with bar vertical scroll"

patterns-established:
  - "Narrow chrome locks height with overflow-y auto; never grow bar into canvas region"
  - "Canvas never participates in pointer hit-testing; monetary controls stay HTML"

requirements-completed: [ARCH-03]

coverage:
  - id: D1
    description: "Fixed 15.5rem HUD chrome on ≤720px with leftover space for #game-canvas-host"
    requirement: ARCH-03
    verification:
      - kind: other
        ref: "rg --hud-bar-height: 15.5rem + flex 0 0 var(--hud-bar-height) in src/styles/hud.css @media max-width 720px"
        status: pass
      - kind: unit
        ref: "tests/architecture.no-pixi.test.ts"
        status: pass
      - kind: unit
        ref: "npm test (72 tests)"
        status: pass
    human_judgment: false
  - id: D2
    description: "One-column stack with history below chips via .hud-zone--right flex-direction column"
    requirement: ARCH-03
    verification:
      - kind: other
        ref: "rg flex-direction: column on .hud-zone--right inside @media max-width 720px"
        status: pass
    human_judgment: false
  - id: D3
    description: "Canvas host/canvas pointer-events none and .hud-bar z-index ≥1 so taps reach monetary controls"
    requirement: ARCH-03
    verification:
      - kind: other
        ref: "rg pointer-events: none on .canvas-host and .canvas-host canvas; z-index: 1 on .hud-bar"
        status: pass
    human_judgment: true
    rationale: "Hit isolation is asserted by CSS contract; tactile mash-test that canvas does not steal taps is plan 04-03 manual QA"

duration: 1min
completed: 2026-09-27
status: complete
---

# Phase 04 Plan 01: Responsive Shell Layout Summary

**Fixed 15.5rem HUD chrome on ≤720px, leftover flex host for the curve, stacked chips→history, and pointer-events isolation so the canvas cannot steal monetary taps**

## Performance

- **Duration:** 1 min
- **Started:** 2026-09-27T12:14:11Z
- **Completed:** 2026-09-27T12:15:30Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Locked narrow-viewport HUD bar to `--hud-bar-height: 15.5rem` with internal vertical scroll so stacked chrome cannot steal curve space
- Stacked `.hud-zone--right` as a column so DOM-order chips then history places history below chips
- Set `pointer-events: none` on `.canvas-host` and its canvas; raised `.hud-bar` with `z-index: 1`

## Task Commits

Each task was committed atomically:

1. **Task 1: Fixed chrome budget, stacked zones, and canvas hit isolation** - `a4d03eb` (feat)

**Plan metadata:** `43b47fd` (docs: complete plan); `fd0a3bf` (docs: STATE decisions)

## Files Created/Modified

- `src/styles/hud.css` - Fixed chrome budget ≤720px, stacked right zone, canvas hit isolation, history `touch-action: pan-x`

## Decisions Made

- Applied `--hud-bar-height: 15.5rem` only inside `@media (max-width: 720px)` so desktop three-column bar stays content-sized (`flex: 0 0 auto`)
- Added optional `touch-action: pan-x` on `.history-strip` for swipe vs bar scroll coexistence (plan discretionary)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Shell layout contract ready for 04-02 (Cash out promotion, ≥44px targets, safe-area, resize harden)
- Manual hit mash-test and portrait QA remain in 04-03
- ARCH-03 criteria 1 and 3 foundations in place; promote/safe-area still outstanding

## Self-Check: PASSED

- [x] `src/styles/hud.css` exists with fixed bar, stack, pointer-events
- [x] `git log --oneline --all --grep="04-01"` includes feat commit `a4d03eb`
- [x] Acceptance criteria greps PASS; no logic/ or index.html changes
- [x] `npx vitest run tests/architecture.no-pixi.test.ts` exit 0 (7 passed)
- [x] `npx tsc --noEmit` exit 0
- [x] `npm test` exit 0 (72 passed)

---
*Phase: 04-mobile-harden*
*Completed: 2026-09-27*
