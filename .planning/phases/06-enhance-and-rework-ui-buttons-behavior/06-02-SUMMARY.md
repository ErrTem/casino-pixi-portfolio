---
phase: 06-enhance-and-rework-ui-buttons-behavior
plan: 02
subsystem: ui
tags: [auto-bet, waiting-edge, vitest, composition-root, hud]

requires:
  - phase: 06-01
    provides: dual-line primary shell; isAutoBetOn/getStake stubs; Auto bet toggle chrome
provides:
  - shouldAutoPlaceBet pure waiting-edge / toggle-ON gate
  - session Auto bet placeBet loop at composition root
  - broke/insufficient stop + Reset emphasize (no auto resetWallet)
affects:
  - 06-03 climb retune (parallel)
  - 06-04 arcade camera + Seed chip removal
  - phase UAT for consecutive-round Auto bet feel

actuals:
  tokens: 4910
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - shouldAutoPlaceBet waiting-edge + prevAutoBetOn synthetic mid-wait ON
    - single composition-root auto placeBet (mirrors sfxEdges)
    - stopAutoBet clears flag + emphasizes Reset without resetWallet

key-files:
  created:
    - src/games/crash/hud/autoBet.ts
    - src/games/crash/hud/autoBet.test.ts
  modified:
    - src/games/crash/hud/CrashHud.ts
    - src/main.ts

key-decisions:
  - "D-10 confirmed option-auto-bet-on-waiting — Auto bet places at each waiting start (D-10..D-13)"
  - "Composition-root single placeBet site (main.ts ticker); HUD owns flag + getStake + stopAutoBet"
  - "prevAutoBetOn rising edge covers mid-wait toggle ON place-once"

patterns-established:
  - "Pattern: shouldAutoPlaceBet({ autoBetOn, prevAutoBetOn, phase, prevPhase, hasBet, broke })"
  - "Pattern: auto place → bet_lock on ok; stopAutoBet(reason) on broke/insufficient_balance"
  - "Pattern: stake edits apply next auto-place via hud.getStake() at edge time (D-13)"

requirements-completed: [UI-03]

coverage:
  - id: D1
    description: Pure shouldAutoPlaceBet waiting-edge / broke / hasBet / mid-wait toggle ON cases
    requirement: UI-03
    verification:
      - kind: unit
        ref: src/games/crash/hud/autoBet.test.ts
        status: pass
    human_judgment: false
  - id: D2
    description: Composition-root Auto bet placeBet + bet_lock + broke stop wiring
    requirement: UI-03
    verification:
      - kind: unit
        ref: src/games/crash/hud/autoBet.test.ts
        status: pass
      - kind: other
        ref: npx tsc --noEmit
        status: pass
      - kind: other
        ref: npm test (126 passed)
        status: pass
      - kind: other
        ref: tests/architecture.no-pixi.test.ts
        status: pass
    human_judgment: true
    rationale: Consecutive-round cadence, mid-flight stake edits, and Reset emphasize feel need browser UAT

duration: 4min
completed: 2026-09-29
status: complete
---

# Phase 06 Plan 02: Auto bet waiting-edge Summary

**Session Auto bet places current stake on each waiting edge via pure shouldAutoPlaceBet + composition-root placeBet; stops and emphasizes Reset on broke**

## Performance

- **Duration:** 4 min
- **Started:** 2026-09-29T15:58:56Z
- **Completed:** 2026-09-29T16:02:12Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- D-10 checkpoint locked as option-auto-bet-on-waiting (one-way Auto bet product loop)
- TDD `shouldAutoPlaceBet` with waiting-edge, same-phase skip, broke/hasBet/flag-off, mid-wait toggle ON
- `main.ts` single auto placeBet site; `CrashHud.stopAutoBet` clears flag + Reset emphasize; `bet_lock` on success

## Task Commits

Each task was committed atomically:

1. **Task 1: Confirm D-10 Auto bet product behavior** - (decision-only — no code commit; human selected `option-auto-bet-on-waiting`)
2. **Task 2 RED: shouldAutoPlaceBet failing tests** - `228dc2b` (test)
3. **Task 2 GREEN: shouldAutoPlaceBet implementation** - `7bfc3d5` (feat)
4. **Task 3: Wire Auto bet + waiting-edge placeBet + broke stop** - `128352e` (feat)

**Plan metadata:** (this commit)

_Note: TDD Task 2 produced RED + GREEN commits; no REFACTOR needed._

## Files Created/Modified

- `src/games/crash/hud/autoBet.ts` — pure waiting-edge / synthetic toggle-ON gate
- `src/games/crash/hud/autoBet.test.ts` — 9 Vitest cases for D-10..D-13 helpers
- `src/games/crash/hud/CrashHud.ts` — `stopAutoBet(reason)`; toggle sync; Reset emphasize
- `src/main.ts` — single composition-root auto placeBet + bet_lock + broke stop

## Decisions Made

- D-10 confirmed: Auto bet ON places the same stake every waiting round as soon as waiting allows a bet (not after countdown)
- Call site: composition root (mirrors sfxEdges) with HUD-owned session flag / stake / stop
- Mid-wait toggle ON uses `prevAutoBetOn` rising edge for place-once without double-place

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Ready for **06-03** growthRate retune (parallel Wave 2) and/or **06-04** arcade camera + Seed chip removal
- Manual UAT deferred to end-of-phase: consecutive Auto bet rounds, broke stop + Reset emphasize, stake edits next round

## TDD Gate Compliance

| Gate | Commit | Status |
|------|--------|--------|
| RED | `228dc2b` test(06-02) | Pass — target waiting-edge assertion fail; `RED_EVIDENCE_OK` |
| GREEN | `7bfc3d5` feat(06-02) | Pass — 9/9 autoBet tests |
| REFACTOR | — | Skipped — implementation already minimal |

## Self-Check: PASSED

- key-files.created exist on disk
- `git log --grep="06-02"` shows test + feat commits
- Plan verification: autoBet vitest, `tsc --noEmit`, `npm test` (126), architecture.no-pixi all exit 0
- No `src/games/crash/logic/` modifications
- Single auto placeBet path in `main.ts` (manual path remains in CrashHud primary)

---
*Phase: 06-enhance-and-rework-ui-buttons-behavior*
*Completed: 2026-09-29*
