---
phase: 04-three-bonuses-combo-nights
plan: 04
subsystem: logic
tags: [hotline, hold-and-win, red, jackpot-strip, seed-hold, respin]

requires:
  - phase: 04-three-bonuses-combo-nights
    provides: createNight settleFeature and FeatureOverlay splash from 04-01
  - phase: 04-three-bonuses-combo-nights
    provides: purple pickEm and shared prizeTable from 04-03
provides:
  - createHoldAndWin pure sticky-grid stepper on seed:hold
  - HotlineGame stepHoldRespin and holdSnapshot with settle once when done
  - HoldLayer procedural 5x4 overlay and JackpotStrip MIN MID MAX ULTRA
  - HotlineScene setHoldMode syncHold with phones swap and restore
  - session hold_respin loop replacing red FEATURE_BEAT stub
affects:
  - 04-05 hold beep ids and combo night polish
  - nested red during free spins presentation

actuals:
  tokens: 10276
  tasks: 2
  commits: 3

plan_head_before: 1b683de903649bb730bb29d0811807bcc347d6b9

tech-stack:
  added: []
  patterns:
    - hold randomness isolated on seed:hold
    - wallet credit once at feature_exit via settleFeature when hold done
    - jackpot strip labels map config mini minor major grand in view only

key-files:
  created:
    - src/games/hotline/logic/features/holdAndWin.ts
    - src/games/hotline/logic/features/holdAndWin.test.ts
    - src/games/hotline/view/HoldLayer.ts
    - src/games/hotline/view/JackpotStrip.ts
  modified:
    - src/games/hotline/logic/HotlineGame.ts
    - src/games/hotline/logic/HotlineGame.test.ts
    - src/games/hotline/logic/index.ts
    - src/games/hotline/view/HotlineScene.ts
    - src/games/hotline/session/mountHotlineSession.ts
    - src/games/hotline/session/collectPresentation.test.ts

key-decisions:
  - "Hold respin cadence HOLD_RESPIN_MS=320 for ticker-driven empty-cell flicker"
  - "Start cells are cash-only; jackpot tiers can land on later respins"
  - "setHoldMode(false) on enterIdle dispose destroy and hold exit paths"

patterns-established:
  - "createHoldAndWin + stepHoldRespin mirrors pickEm settle-once contract"
  - "JackpotStrip.layout shares the phones band; toggle visibility in setHoldMode"
  - "session present hold_respin ticks then advanceNight for feature_exit splash"

requirements-completed: [BONUS-02]

coverage:
  - id: D1
    description: Pure seeded Hold and Win with respin lives reset grand full-grid and integer cents
    requirement: BONUS-02
    verification:
      - kind: unit
        ref: src/games/hotline/logic/features/holdAndWin.test.ts#seeds startCells distinct cash prizes and lives equal respins
        status: pass
      - kind: unit
        ref: src/games/hotline/logic/features/holdAndWin.test.ts#landChance 0 burns exactly three respins then done with no new cells
        status: pass
      - kind: unit
        ref: src/games/hotline/logic/features/holdAndWin.test.ts#landChance 1 fills the grid in one respin and awards grand on top
        status: pass
      - kind: unit
        ref: src/games/hotline/logic/HotlineGame.test.ts#forced red night drives hold respins then credits wallet once at feature_exit
        status: pass
      - kind: unit
        ref: tests/architecture.no-pixi.test.ts
        status: pass
    human_judgment: false
  - id: D2
    description: In-place CRT HoldLayer jackpot strip swap and session hold_respin until exit splash
    requirement: BONUS-02
    verification:
      - kind: unit
        ref: src/games/hotline/session/collectPresentation.test.ts#session source locks busy through flights and stub without double booking
        status: pass
      - kind: unit
        ref: tests/hotline.assets.test.ts
        status: pass
      - kind: other
        ref: npm run build
        status: pass
    human_judgment: true
    rationale: Sticky board neon and MIN MID MAX ULTRA strip need a quick browser look during phase walkthrough

duration: 8min
completed: 2026-10-11
status: complete
---

# Phase 04 Plan 04: Hold and Win Summary

**Red phone runs seeded Hold and Win on the CRT with respin lives, jackpot strip swap, and a single wallet credit at feature_exit.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-10-10T22:55:26Z
- **Completed:** 2026-10-10T23:00:00Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- Pure `createHoldAndWin` stepper with landChance extremes, lives reset, grand on full grid, and integer cent math
- `HotlineGame` red driver on `seed:hold` with `stepHoldRespin` settling once when done
- Procedural `HoldLayer` + `JackpotStrip`, scene hold mode, and session `hold_respin` replacing the zero-cent red beat stub

## TDD Gate Compliance

| Task | RED commit | GREEN commit | Evidence |
|------|------------|--------------|----------|
| 1 tracer | ✓ `925d249` test(04-04) | ✓ `5692330` feat(04-04) | `04-04-tdd-red-evidence-t1.json` → RED_EVIDENCE_OK |
| 2 view/session | — | ✓ `d1e5242` feat(04-04) | not `tdd="true"`; source asserts with implementation |

- Tracer feedback gate: re-ran automated verify after Task 1; all green; continued under `human_verify_mode=end-of-phase`

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: Pure Hold and Win tests** - `925d249` (test)
2. **Task 1 GREEN: implement seeded hold and win math** - `5692330` (feat)
3. **Task 2: HoldLayer, jackpot strip, scene mode, session respin loop** - `d1e5242` (feat)

**Plan metadata:** `b2817f9` (docs: complete plan)

## Files Created/Modified

- `src/games/hotline/logic/features/holdAndWin.ts` — sticky grid stepper
- `src/games/hotline/logic/features/holdAndWin.test.ts` — termination and payout coverage
- `src/games/hotline/logic/HotlineGame.ts` — red feature driver + stepHoldRespin
- `src/games/hotline/logic/index.ts` — export hold types
- `src/games/hotline/view/HoldLayer.ts` — procedural sticky overlay
- `src/games/hotline/view/JackpotStrip.ts` — MIN MID MAX ULTRA band
- `src/games/hotline/view/HotlineScene.ts` — setHoldMode / syncHold
- `src/games/hotline/session/mountHotlineSession.ts` — hold_respin presenter
- `src/games/hotline/session/collectPresentation.test.ts` — source contracts

## Decisions Made

- Tuned `HOLD_RESPIN_MS=320` for empty-cell flicker pacing
- Start cells cash-only so the board opens readable; jackpot symbols on later landings
- Exit splash note uses MIN/MID/MAX/ULTRA callout when a tier or grand was won

## Deviations from Plan

### Auto-fixed Issues

None - plan executed exactly as written.

Nested Vitest TAP flattened in `04-04-tdd-red-evidence-t1.json` for `RED_EVIDENCE_OK` (same pattern as 04-01/04-03) — documentation-only, not a code deviation.

---

**Total deviations:** 0 auto-fixed
**Impact on plan:** None

## Issues Encountered

None.

## Known Stubs

None - red zero-cent stub removed; purple and green paths unchanged.

## Threat Flags

None beyond plan register (T-04-13 termination tests, T-04-14 setHoldMode restore, T-04-15 settle once).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Ready for 04-05 combo polish / feature beep ids
- Red Hold can nest during free spins through existing createNight pause/resume

## Self-Check: PASSED

- `src/games/hotline/logic/features/holdAndWin.ts` FOUND
- `src/games/hotline/view/HoldLayer.ts` FOUND
- `src/games/hotline/view/JackpotStrip.ts` FOUND
- Commits `925d249` `5692330` `d1e5242` FOUND in `git log`
- Plan verification commands passed (holdAndWin + HotlineGame + view/session + assets + build)

---
*Phase: 04-three-bonuses-combo-nights*
*Completed: 2026-10-11*
