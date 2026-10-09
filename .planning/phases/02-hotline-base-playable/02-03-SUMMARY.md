---
phase: 02-hotline-base-playable
plan: 03
subsystem: session-hud
tags: [hotline, hud, session, pixi, shell]
status: complete

requires:
  - phase: 02-01
    provides: loadHotlineConfig
  - phase: 02-02
    provides: createHotlineGame, HotlineSnapshot
provides:
  - HOTLINE tile enabled, dynamic import of mountHotlineSession
  - hotline-screen-template with spin, bet steppers, balance, last win, fixed 40 lines
  - mountHotlineHud, placeholder 5x4 Graphics scene, mountHotlineSession on the shared Application
affects:
  - phase 2 presentation plans replace placeholder cells and phones with art
  - phase 3 collectors hook into the same session tick

estimate:
  tokens: 45000
  tasks: 2

actuals:
  tokens: 17000
  tasks: 2
  commits: 3

plan_head_before: 888e467689637a9f04590d974c85e5cf748106e2

tech-stack:
  added: []
  patterns:
    - session loads config then builds the game before touching the dom, so a Zod throw fails mount loud with no residue
    - hud binder throws on missing nodes, writes textContent only
    - session teardown mirrors crash, never destroys app or audio

key-files:
  created:
    - src/games/hotline/hud/HotlineHud.ts
    - src/games/hotline/hud/HotlineHud.test.ts
    - src/games/hotline/hud/format.test.ts
    - src/games/hotline/view/HotlineScene.ts
    - src/games/hotline/view/mountHotlineView.ts
    - src/games/hotline/session/mountHotlineSession.ts
  modified:
    - index.html
    - src/shell/gameRegistry.ts
    - src/games/hotline/hud/format.ts
    - src/styles/hud.css
    - src/shell/gameRegistry.test.ts
    - tests/shell.hud-layout.test.ts
    - tests/architecture.shell.test.ts

key-decisions:
  - "spin button uses data-action=spin, not primary, so the crash layout test that counts two primaries stays valid"
  - "hud takes betStepCount from config to disable bet inc and dec at the ends, stepping still goes only through setBetStepIndex"
  - "audio on spin is unlock only, no new SfxEvent until the audio plan"
  - "last win reads dash until the first settled spin"

requirements-completed: [BASE-01, BASE-02]

completed: 2026-10-09
---

# Phase 2 Plan 03: HOTLINE Launch, HUD and Session Summary

HOTLINE launches from the menu on the shared Pixi Application with a DOM spin and bet HUD and a placeholder 5x4 Graphics grid driven by the 02-02 snapshot.

## Accomplishments

- hotline-screen-template reuses the shared zone ids and classes, canvas host has no data-action or data-field nodes
- mountHotlineHud binds spin, bet dec and inc, balance, last win, 40 lines readout and mute, textContent only
- HotlineScene draws colored rect cells with symbol id labels, win outlines from lineWins, and three phone circles above the reels
- mountHotlineSession matches the crash dispose order and leaves app and audio alone
- manual smoke on the dev server: menu to HOTLINE, spin took balance from 1000.00 to 999.90 at bet 0.10, last win 0.00, Menu returned to the menu cleanly

## Task Commits

1. Task 1 RED: `0859de4` test(02-03): failing tests for hotline template, registry and hud format
2. Task 1 GREEN: `1bfae69` feat(02-03): launch hotline from menu with spin hud on the shell
3. Task 2: `e6beb96` test(02-03): lock hotline hud bet steps to config steps

## TDD Gate Compliance

- Task 1 RED: 9 tests failed on assertions (layout template, registry enabled, session architecture gate, stubbed formatMoney)
- Task 1 GREEN: full suite 234 of 234, tsc exit 0, vite build ok
- Task 2: bet step wiring through setBetStepIndex was already written in Task 1, so Task 2 only added the fake element tests that lock it, they passed from the start. Full suite 240 of 240
- REFACTOR: not needed

## Verification

- `npx vitest run tests/shell.hud-layout.test.ts src/games/hotline` green
- `npm test` 240 of 240, `npx tsc --noEmit` exit 0, `npx vite build` exit 0

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Registry test asserted hotline disabled**
- **Found during:** Task 1
- **Issue:** src/shell/gameRegistry.test.ts expected the old stub, enabling the tile would fail it
- **Fix:** updated the test to expect enabled with a mount function
- **Files modified:** src/shell/gameRegistry.test.ts
- **Commit:** 0859de4

**2. [Rule 3 - Blocking] hud.css needed hotline bar styles**
- **Found during:** Task 1
- **Issue:** no existing class laid out a single spin button next to the bet stepper
- **Fix:** appended .hotline-bar, .hotline-bet, .hotline-lines to src/styles/hud.css, not in the plan files list
- **Files modified:** src/styles/hud.css
- **Commit:** 1bfae69

**3. [Rule 2 - Missing critical] Architecture gate for the hotline session**
- **Found during:** Task 1
- **Issue:** threat T-02-04 mitigation had no test
- **Fix:** added Gate B2 in tests/architecture.shell.test.ts (config before game, teardown order, no app or audio dispose, no innerHTML)
- **Commit:** 0859de4

## Known Stubs

Placeholder Graphics cells with system font labels and plain circles for phones are intentional tracer art (PRES-01 comes in later presentation plans). Not recorded in WINDOWS.md as defects since the plan lists them as a backstop truth.

## Issues Encountered

None.

## Self-Check: PASSED

- all created files exist
- commits `0859de4`, `1bfae69`, `e6beb96` exist in git log
- `npm test`, `npx tsc --noEmit`, `npx vite build` exit 0
