---
phase: 04-three-bonuses-combo-nights
plan: 05
subsystem: ui
tags: [hotline, combo-strip, sfx, night-total, bonus-04, beep]

requires:
  - phase: 04-three-bonuses-combo-nights
    provides: createNight path activeIndex and night_total from 04-01
  - phase: 04-three-bonuses-combo-nights
    provides: green free spins session cadence from 04-02
  - phase: 04-three-bonuses-combo-nights
    provides: purple pickLocker session path from 04-03
  - phase: 04-three-bonuses-combo-nights
    provides: red hold_respin session path from 04-04
provides:
  - buildComboStripCells pure path highlight model for DOM combo strip
  - HotlineHud.setComboPath createElement span steps with active done classes
  - widened SfxEvent feature hold pick jackpot beeps on session edges
  - COMBO NIGHT night_total splash polish and multi-phone integration lock
affects:
  - phase 05 VHS gamble audio and presentation
  - portfolio walkthrough of full Witch Pots combo loop

actuals:
  tokens: 13440
  tasks: 3
  commits: 5

plan_head_before: f97df552897c225a2da0c57d09cc6a79afdb974a

tech-stack:
  added: []
  patterns:
    - combo strip highlight via pure model plus createElement textContent spans
    - feature SFX ids stay on shared closed SfxEvent union with beep pitches
    - multi-phone night_total gated by createNight path length D-19

key-files:
  created:
    - src/games/hotline/hud/comboStripModel.ts
    - src/games/hotline/hud/comboStripModel.test.ts
  modified:
    - src/games/hotline/hud/HotlineHud.ts
    - src/games/hotline/hud/HotlineHud.test.ts
    - src/styles/hud.css
    - src/games/hotline/session/mountHotlineSession.ts
    - src/shared/audio/AudioPort.ts
    - src/shared/audio/createBeepAudioPort.ts
    - src/shared/audio/createBeepAudioPort.test.ts
    - src/games/hotline/session/collectPresentation.test.ts
    - src/games/hotline/logic/HotlineGame.test.ts

key-decisions:
  - "Nested path cells append nested suffix while keeping Green Red Purple names"
  - "Arrow joiners are separate DOM spans not one textContent string"
  - "queue_step replaced by feature_start and pick_reveal on bonus edges; collector beeps unchanged"

patterns-established:
  - "syncComboFromSnapshot builds cells from night.path and activeIndex on every advanceNight"
  - "hold_respin plays before stepHoldRespin; hold_land when cell count grows"
  - "seed combo-grp-night documents shortened 3-spin multi-phone integration"

requirements-completed: [BONUS-04]

coverage:
  - id: D1
    description: Combo strip shows full night path with active step highlighted including nested labels
    requirement: BONUS-04
    verification:
      - kind: unit
        ref: src/games/hotline/hud/comboStripModel.test.ts#marks activeIndex cell active with prior done and later pending
        status: pass
      - kind: unit
        ref: src/games/hotline/hud/HotlineHud.test.ts#setComboPath builds span steps with active and done classes (D-18)
        status: pass
      - kind: unit
        ref: tests/shell.hud-layout.test.ts
        status: pass
    human_judgment: true
    rationale: Neon active-step highlight needs a quick browser look during phase walkthrough
  - id: D2
    description: Feature lifecycle beeps for start end hold land respin pick reveal and jackpot
    requirement: BONUS-04
    verification:
      - kind: unit
        ref: src/shared/audio/createBeepAudioPort.test.ts#plays every sfx event with a finite pitch
        status: pass
      - kind: unit
        ref: src/games/hotline/session/collectPresentation.test.ts#session source plays feature beep events on bonus edges (04-05)
        status: pass
    human_judgment: false
  - id: D3
    description: Multi-phone Green Red Purple night emits night_total sum and COMBO NIGHT splash polish
    requirement: BONUS-04
    verification:
      - kind: integration
        ref: src/games/hotline/logic/HotlineGame.test.ts#forced multi-phone night keeps Green Red Purple order and night_total sum
        status: pass
      - kind: unit
        ref: src/games/hotline/session/collectPresentation.test.ts#session source locks busy through flights and stub without double booking
        status: pass
      - kind: unit
        ref: tests/hotline.assets.test.ts
        status: pass
      - kind: other
        ref: npm test
        status: pass
      - kind: other
        ref: npm run build
        status: pass
    human_judgment: false

duration: 6min
completed: 2026-10-11
status: complete
---

# Phase 04 Plan 05: Combo Strip, Feature Audio, Regression Locks Summary

**DOM combo path highlight, widened feature beeps, and a seeded Green→Red→Purple night_total integration lock close BONUS-04.**

## Performance

- **Duration:** 6min
- **Started:** 2026-10-10T23:00:55Z
- **Completed:** 2026-10-10T23:06:30Z
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments
- Pure `buildComboStripCells` plus `HotlineHud.setComboPath` lights the active combo step with neon CSS
- `SfxEvent` gained feature hold pick jackpot ids; session maps them on splash hold and pick edges
- Seeded `combo-grp-night` proves Green→Red→Purple order, non-zero red/purple totals, and night_total sum; asset count stays 17

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: Combo strip failing tests** - `ba4d3a9` (test)
2. **Task 1 GREEN: Combo strip path highlight** - `683f0bc` (feat)
3. **Task 2: Feature SFX ids and session map** - `7b8de46` (feat)
4. **Task 3 RED: Combo night polish gates** - `3aaca45` (test)
5. **Task 3 GREEN: COMBO NIGHT splash** - `3de27b1` (feat)

**Plan metadata:** `b074fa6` (docs: complete plan)

_Note: TDD tasks may have multiple commits (test → feat → refactor)_

## Files Created/Modified
- `src/games/hotline/hud/comboStripModel.ts` - path plus activeIndex to strip cells
- `src/games/hotline/hud/comboStripModel.test.ts` - D-18 active and nested label pins
- `src/games/hotline/hud/HotlineHud.ts` - setComboPath via createElement spans
- `src/games/hotline/hud/HotlineHud.test.ts` - FakeEl replaceChildren and class asserts
- `src/styles/hud.css` - `.hotline-combo-step.active` neon highlight
- `src/games/hotline/session/mountHotlineSession.ts` - syncComboFromSnapshot, feature beeps, COMBO NIGHT splash
- `src/shared/audio/AudioPort.ts` - widened SfxEvent union
- `src/shared/audio/createBeepAudioPort.ts` - distinct feature pitches
- `src/shared/audio/createBeepAudioPort.test.ts` - ALL_EVENTS includes new ids
- `src/games/hotline/session/collectPresentation.test.ts` - setComboPath and feature beep greps
- `src/games/hotline/logic/HotlineGame.test.ts` - multi-phone night_total integration

## Decisions Made
- Nested cells use a `nested` suffix; joiners are separate spans so highlight classes stay per step
- Collector `token_*` / `phone_trigger` beeps kept; bonus edges use the new feature ids
- Night-total splash title is `COMBO NIGHT` with formatted `totalCents`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated collectPresentation beep greps in Task 2**
- **Found during:** Task 2 (Feature SFX ids and session play map)
- **Issue:** Replacing `queue_step` on feature_start and pick edges would fail session source greps still expecting `queue_step`
- **Fix:** Dropped `queue_step` assert from collector beep contract; added feature beep contract in the same commit
- **Files modified:** `src/games/hotline/session/collectPresentation.test.ts`
- **Verification:** `npx vitest run src/shared/audio src/games/hotline/session` and `npx tsc --noEmit`
- **Committed in:** `7b8de46`

---

**Total deviations:** 1 auto-fixed (Rule 3)
**Impact on plan:** Necessary for closed-union audio wiring; no scope creep

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
Phase 4 BONUS-01..04 paths are regression-locked. Next milestone work can add VHS gamble / Howler samples without changing the combo night order contract.

## TDD Gate Compliance

| Task | RED commit | GREEN commit | RED evidence |
|------|------------|--------------|--------------|
| 1 Combo strip | `ba4d3a9` | `683f0bc` | `04-05-tdd-red-evidence-t1.json` RED_EVIDENCE_OK |
| 3 Integration gates | `3aaca45` | `3de27b1` | `04-05-tdd-red-evidence-t3.json` RED_EVIDENCE_OK |

Task 2 was `type=auto` without `tdd=true` and did not require a RED commit.

## Self-Check: PASSED

- Key files present: comboStripModel, HotlineHud setComboPath, AudioPort SfxEvent widen, COMBO NIGHT splash
- Commits present: ba4d3a9, 683f0bc, 7b8de46, 3aaca45, 3de27b1
- Verify: npm test 346 pass; hotline.assets 17; npm run build ok

---
*Phase: 04-three-bonuses-combo-nights*
*Completed: 2026-10-11*
