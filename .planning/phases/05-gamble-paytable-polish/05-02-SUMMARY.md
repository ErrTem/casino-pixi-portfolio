---
phase: 05-gamble-paytable-polish
plan: 02
subsystem: hud
tags: [hotline, gamble, dom-overlay, vhs, session, vitest]
status: complete

requires:
  - phase: 05-gamble-paytable-polish
    provides: createGamble, Wallet.debit, HotlineGame clearGambleOffer resolveGamble getGambleSnapshot
provides:
  - mountGambleOverlay DOM VHS panel with CURRENT WIN, GAMBLE TO WIN, SURVIVE and DIE
  - HotlineHud data-action=gamble with setGambleEnabled and onGamble option
  - mountHotlineSession gamble present phase, enterIdle offer gate, Spin clear, seed:gamble rng
affects:
  - 05-03 paytable overlay (Info must stay outside the setBusy disable list)
  - 05-05 VHS art pack (css chrome has png hooks to swap in)

actuals:
  tokens: 12500
  tasks: 2
  commits: 3
plan_head_before: 6609630e9187c884a4ea68178d6c2c0f83f21f19

tech-stack:
  added: []
  patterns:
    - overlay binder with need, textContent only and dispose, same family as FeatureOverlay
    - result beat is driven by tickPresent delta time, no setTimeout to clean up
    - enterIdle is the single place that decides if gamble is offered

key-files:
  created:
    - src/games/hotline/hud/GambleOverlay.ts
    - .planning/phases/05-gamble-paytable-polish/05-02-tdd-red-t1.json
  modified:
    - src/games/hotline/hud/HotlineHud.ts
    - src/games/hotline/hud/HotlineHud.test.ts
    - src/games/hotline/session/mountHotlineSession.ts
    - src/games/hotline/session/collectPresentation.test.ts
    - index.html
    - src/styles/hud.css

key-decisions:
  - "Both SURVIVE and DIE call the same resolveGamble path, the outcome comes from the seeded stream and the labels are the skin (D-06)"
  - "Result beat is 750 ms, inside the 600 to 900 ms window from RESEARCH A1 (D-07)"
  - "Auto close runs enterIdle, which re-offers from getGambleSnapshot, so chaining up to maxRounds needs no extra state and the offer survives a night (RESEARCH Q1)"
  - "setBusy locks Spin, bet and Gamble only, so Info in 05-03 can stay enabled under busy (D-12)"

requirements-completed: [GAMBLE-01, GAMBLE-02]

coverage:
  - id: D1
    description: "HUD gamble button is disabled by default, enabled by setGambleEnabled and locked by busy"
    requirement: GAMBLE-01
    verification:
      - kind: unit
        ref: "src/games/hotline/hud/HotlineHud.test.ts#HotlineHud gamble control (GAMBLE-01, D-01)"
        status: pass
    human_judgment: false
  - id: D2
    description: "enterIdle offers gamble from the settled base line win and never while a night is active, Spin clears the offer first"
    requirement: GAMBLE-02
    verification:
      - kind: unit
        ref: "src/games/hotline/session/collectPresentation.test.ts#mountHotlineSession gamble contracts (GAMBLE-01, GAMBLE-02)"
        status: pass
      - kind: unit
        ref: "src/games/hotline/session/collectPresentation.test.ts#gamble session edges (D-02, D-03, D-04, GAMBLE-02)"
        status: pass
    human_judgment: false
  - id: D3
    description: "VHS overlay markup sits outside #game-canvas-host and has no Collect or Take control"
    requirement: GAMBLE-01
    verification:
      - kind: unit
        ref: "src/games/hotline/session/collectPresentation.test.ts#html has the gamble overlay and hud control outside the canvas host"
        status: pass
    human_judgment: false
  - id: D4
    description: "SURVIVE and DIE round feel, result flash and auto close timing in a real browser"
    requirement: GAMBLE-01
    verification: []
    human_judgment: true
    rationale: "timing and look of the panel are visual, no test asserts the rendered beat"
  - id: D5
    description: "Overlay fits the portrait column at about 360x640 without horizontal scroll"
    requirement: GAMBLE-01
    verification: []
    human_judgment: true
    rationale: "layout backstop, needs a viewport check"

duration: 6min
completed: 2026-10-12
---

# Phase 5 Plan 2: Gamble HUD and VHS overlay Summary

DOM VHS SURVIVE/DIE overlay, a HUD Gamble button and an `enterIdle` offer gate in the HOTLINE session, so a settled base line win can be doubled or lost on the seeded `:gamble` stream and Spin banks whatever is left.

## Accomplishments

- `mountGambleOverlay` binder: `show`, `showResult`, `hide`, `dispose`, textContent only, buttons lock during the result beat
- `index.html` gamble panel (`data-field=gamble-overlay`, CURRENT WIN, GAMBLE TO WIN, SURVIVE, DIE) and a compact `data-action=gamble` HUD control, both outside `#game-canvas-host`
- `hud.css` neon panel classes (`.hotline-gamble-overlay`, survive and die flash variants), css only, no PNG paths added
- `HotlineHud.setGambleEnabled`, `onGamble` option, busy locks Spin, bet and Gamble
- `mountHotlineSession`: `"gamble"` present phase, `openGamble`, one resolve per round (`gambleShowingResult` guard), 750 ms delta-time auto close back through `enterIdle`
- `enterIdle` enables Gamble only when `getGambleSnapshot().offered` and no night is active; Spin calls `clearGambleOffer` and disables Gamble before `game.spin`

## Task Commits

1. Task 1 RED: `d92171f` test(05-02) failing hud control and session offer tests (`RED_EVIDENCE_OK`, record in `05-02-tdd-red-t1.json`)
2. Task 1 GREEN: `7802f14` feat(05-02) overlay, hud control, session offer, css and markup
3. Task 2: `f9e2cb7` test(05-02) die path, spin bank, night gate, seeded die debit

## Verification

- `npx vitest run src/games/hotline/hud src/games/hotline/session tests/architecture.no-pixi.test.ts tests/shell.hud-layout.test.ts tests/hotline.assets.test.ts`: 8 files, 70 passed (Task 1)
- `npx vitest run src/games/hotline/hud src/games/hotline/session`: 5 files, 47 passed (Task 2)
- `npx vitest run` full suite: 54 files, 387 passed
- `npx tsc --noEmit`: exit 0
- `hotline.assets.test.ts` still pins 17 URLs, no new packages

## Deviations from Plan

### Auto-fixed Issues

None.

### Notes

**1. [Task 2 tests passed on first run]** Task 1 already wired the DIE path, Spin clear and night gate because they share the same session code, so the Task 2 tests are a test-only commit that locks the behavior. No production change was needed in Task 2.

**2. [Spin clears before the bet check]** The Spin wrapper calls `clearGambleOffer` before `game.spin`, as the plan says. A spin that fails on balance therefore also drops the offer. The win stays credited, so no money is lost, only the chance to gamble it.

**3. [Uncommitted tuning left alone]** `.planning/config.json` carries an uncommitted change that is not part of this plan, it was not staged. `hotline.config.json` no longer shows as modified.

**Total deviations:** 0 auto-fixed. **Impact:** none on scope.

## TDD Gate Compliance

Plan type is `execute` with `tdd="true"` tasks. Task 1 has a `test(05-02)` RED commit followed by a `feat(05-02)` GREEN commit. Task 2 is test-only (note 1).

## Known Stubs

None. The VHS chrome is css only on purpose, PNG hooks land in 05-05 (D-08).

## Threat Flags

None. T-05-02 is mitigated: present is `gamble` while the panel is open and busy locks Spin, bet and Gamble, one resolve per round via `gambleShowingResult`, and all credit and debit go through integer cents in `HotlineGame.resolveGamble`.

## Next Phase Readiness

05-03 can add the Info control and paytable overlay. `setBusy` does not touch anything beyond Spin, bet and Gamble, so Info can stay enabled while `present` is `gamble`. The 360x640 layout check is a backstop for the browser pass.

## Self-Check: PASSED

- created files exist: GambleOverlay.ts, 05-02-tdd-red-t1.json
- commits d92171f, 7802f14, f9e2cb7 present in git log
- acceptance criteria re-run: index.html has gamble-overlay and gamble control outside the canvas host, session source has enterIdle gamble enable and clearGambleOffer before spin, HotlineHud.test covers setGambleEnabled default false, architecture.no-pixi and hotline.assets (17 URLs) green, tsc exit 0
