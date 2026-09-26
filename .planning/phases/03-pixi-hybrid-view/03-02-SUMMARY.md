---
phase: 03-pixi-hybrid-view
plan: 02
subsystem: game-logic
tags: [cashed_out, cashOutAt, BitmapText, resolveTick, D-16, theater]

requires:
  - phase: 03-pixi-hybrid-view
    provides: "viewMode cashOutAt latch + climb treats cashed_out as climb"
provides:
  - "durable cashed_out phase with single wallet credit"
  - "cashOutAt on RoundState and CrashSnapshot"
  - "history.push only on crash transition"
  - "TheaterText live + frozen BitmapText dual-read"
affects: [03-pixi-hybrid-view, 04-mobile-touch]

actuals:
  tokens: 9800
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns: [single-credit-spectator, history-on-crash-only, dual-read-theater]

key-files:
  created:
    - src/games/crash/view/TheaterText.ts
  modified:
    - src/games/crash/logic/RoundState.ts
    - src/games/crash/logic/resolveTick.ts
    - src/games/crash/logic/CrashGame.ts
    - tests/resolveTick.test.ts
    - tests/walkingSkeleton.test.ts
    - src/games/crash/hud/enablement.ts
    - src/games/crash/hud/enablement.test.ts
    - tests/roundCadence.test.ts
    - src/games/crash/view/CrashScene.ts

key-decisions:
  - "D-16 one-way: cash-out credits once and keeps climbing until crashAt; history only on crash"
  - "Theater strings are formatMult to BitmapText.text; tint ramp not fill (D-13 to D-15)"

patterns-established:
  - "Pattern single-credit-spectator: flying to cashed_out credits once; cashed_out ticks advance multiplier only"
  - "Pattern history-on-crash-only: history.push crashAt on flying/cashed_out crash into waiting"
  - "Pattern dual-read: live BitmapText + frozen cash-out BitmapText from latchedCashOut"

requirements-completed: [VIS-01]

coverage:
  - id: D1
    description: "Manual/auto cash-out credits once, sets cashOutAt, stays cashed_out while multiplier climbs; history gains crashAt only when m >= crashAt"
    requirement: VIS-01
    verification:
      - kind: unit
        ref: "tests/resolveTick.test.ts#manual cash-out pays stake times rounded current multiplier (PLAY-03)"
        status: pass
      - kind: unit
        ref: "tests/walkingSkeleton.test.ts#seeded bet fly settle path with continuous auto-launch (D-14)"
        status: pass
    human_judgment: false
  - id: D2
    description: "cashed_out cannot place a bet or cash out again; crash still opens a 5s wait"
    requirement: VIS-01
    verification:
      - kind: unit
        ref: "src/games/crash/hud/enablement.test.ts#cashed_out with a bet"
        status: pass
      - kind: unit
        ref: "tests/roundCadence.test.ts#after terminal settle waitRemainingMs 5000"
        status: pass
    human_judgment: false
  - id: D3
    description: "Canvas shows live theater x and frozen cash-out x from formatMult via BitmapText.text"
    requirement: VIS-01
    verification:
      - kind: unit
        ref: "tests/viewMode.test.ts"
        status: pass
      - kind: other
        ref: "npx tsc --noEmit"
        status: pass
    human_judgment: true
    rationale: "Spectacle layout (upper-third live x, frozen x under it, tint ramp) needs a live browser visual check"

duration: 5min
completed: 2026-09-26
status: complete
---

# Phase 03 Plan 02: Durable cashed_out + theater dual x Summary

**Cash-out credits once into durable cashed_out; multiplier climbs until crashAt with history only then; canvas BitmapText shows live x plus frozen paid x**

## Performance

- **Duration:** 5 min
- **Started:** 2026-09-26T22:23:48Z
- **Completed:** 2026-09-26T22:28:50Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments
- Rewrote settle so flying cash-out stays `cashed_out` with `cashOutAt`, single wallet credit, and no history row until crashAt
- Locked HUD enablement so `cashed_out` cannot place or cash out; cadence still returns to 5000ms wait after the real crash
- Added `TheaterText` dual BitmapText (live + frozen) wired through `CrashScene.sync` from `snapshot.cashOutAt`

## Task Commits

Each task was committed atomically:

1. **Task 1 RED:** `20f2a2d` — `test(03-02): add failing durable cashed_out settle tests`
2. **Task 1 GREEN:** `11314a7` — `feat(03-02): durable cashed_out climb until crashAt`
3. **Task 2:** `af62188` — `test(03-02): lock cashed_out out of place and cash-out`
4. **Task 3:** `0cfa397` — `feat(03-02): theater BitmapText live and frozen cash-out dual-read`

**Plan metadata:** `d270fbe`

_Note: TDD Task 1 used RED then GREEN commits; no separate refactor commit (no cleanup needed)._

## Files Created/Modified
- `src/games/crash/logic/RoundState.ts` — `cashOutAt` on RoundState and CrashSnapshot
- `src/games/crash/logic/resolveTick.ts` — durable cashed_out; history only on crash
- `src/games/crash/logic/CrashGame.ts` — getSnapshot copies cashOutAt
- `tests/resolveTick.test.ts` / `tests/walkingSkeleton.test.ts` — D-16 settle expectations
- `src/games/crash/hud/enablement.ts` / `enablement.test.ts` — spectator lockout regression
- `tests/roundCadence.test.ts` — wait-after-crash comment
- `src/games/crash/view/TheaterText.ts` — live + frozen BitmapText
- `src/games/crash/view/CrashScene.ts` — passes cashOutAt; syncs theater

## Decisions Made
- Honored D-16 one-way lock: no second decision checkpoint; cash-out does not enterWaiting
- Theater uses BitmapText.text = formatMult; tint ramp via log2(m)/log2(8) (D-15)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] enablement.test.ts snap fixture needed cashOutAt for typecheck**
- **Found during:** Task 1 GREEN
- **Issue:** Adding `cashOutAt` to CrashSnapshot broke the enablement snap fixture compile
- **Fix:** Added `cashOutAt: null` to snap() (cashed_out case landed in Task 2)
- **Files modified:** src/games/crash/hud/enablement.test.ts
- **Verification:** npx tsc --noEmit; enablement tests pass
- **Committed in:** 11314a7 (Task 1 GREEN)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Required for TypeScript after snapshot field land; no scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Ready for 03-03 (remaining hybrid view plan)
- Visual UAT still needed for theater layout and tint ramp in the browser

## Self-Check: PASSED

- [x] TheaterText.ts and modified logic files exist on disk
- [x] git log --grep=03-02 returns task commits
- [x] npx vitest run resolveTick/walkingSkeleton/roundCadence/enablement exits 0
- [x] npx tsc --noEmit exits 0
- [x] getSnapshot().cashOutAt set during cashed_out (walkingSkeleton asserts), null after enterWaiting (resolveTick afterCrash)

---
*Phase: 03-pixi-hybrid-view*
*Completed: 2026-09-26*
