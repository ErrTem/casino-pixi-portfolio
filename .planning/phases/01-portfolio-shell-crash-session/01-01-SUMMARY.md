---
phase: 01-portfolio-shell-crash-session
plan: 01
subsystem: shell
tags: [pixi, router, menu, crash-session, dispose, vitest]

requires: []
provides:
  - shell types GameId ShellContext GameSession GameDefinition
  - createRouter epoch/abort guards and createContextFactory
  - bootShell one-time Application AudioPort seed ownership
  - mountCrashSession adapter on borrowed app
  - CrashHud.dispose and CrashScene.destroy
affects:
  - 01-02 mute key migration
  - 01-03 HOTLINE stub and menu mute
  - 01-04 relaunch leak walkthrough

estimate:
  tokens: 70000
  tasks: 2
  commits: 2

actuals:
  tokens: 14190
  tasks: 2
  commits: 3

plan_head_before: 6e95af01e050466df5082676c3583fb47b099269

tech-stack:
  added: []
  patterns:
    - shell-owned long-lived Application with session borrow
    - pure router with epoch plus AbortSignal
    - crash markup cloned from index.html template

key-files:
  created:
    - src/shell/types.ts
    - src/shell/router.ts
    - src/shell/router.test.ts
    - src/shell/gameRegistry.ts
    - src/shell/menu/mountMenu.ts
    - src/shell/bootShell.ts
    - src/games/crash/session/mountCrashSession.ts
    - tests/architecture.shell.test.ts
  modified:
    - src/main.ts
    - index.html
    - src/games/crash/view/mountCrashView.ts
    - src/games/crash/view/CrashScene.ts
    - src/games/crash/view/Rocket.ts
    - src/games/crash/hud/CrashHud.ts
    - tests/shell.hud-layout.test.ts

key-decisions:
  - "One shell Application; Crash session never destroys app or AudioPort"
  - "Router epoch abort disposes late mounts; requestMenu only acts for current epoch"
  - "Crash HUD keydown registered by name so dispose can remove it"

patterns-established:
  - "GameDefinition.mount is a dynamic import so node tests can load the registry"
  - "Session dispose order: abort off, ticker off, hud.dispose, scene.destroy, view.dispose, resizeTo null, stop, canvas.remove, clone.remove"

requirements-completed: [SHELL-01, SHELL-02, SHELL-03, CFG-02]

coverage:
  - id: D1
    description: Menu launches Crash on the shell-owned Application and Menu returns to the menu
    requirement: SHELL-01
    verification:
      - kind: unit
        ref: src/shell/router.test.ts#createRouter happy path
        status: pass
      - kind: unit
        ref: "npx vitest run src/shell tests"
        status: pass
    human_judgment: true
    rationale: Visual playability of a Crash round still needs a browser pass in 01-04
  - id: D2
    description: Leave cancels enumerated leak sources and never disposes shell audio/app
    requirement: SHELL-02
    verification:
      - kind: unit
        ref: tests/architecture.shell.test.ts#Gate B
        status: pass
      - kind: unit
        ref: src/shell/router.test.ts#createRouter launch races
        status: pass
    human_judgment: false
  - id: D3
    description: Shell AudioPort survives leave; session never calls audio.dispose
    requirement: SHELL-03
    verification:
      - kind: unit
        ref: tests/architecture.shell.test.ts#Gate B negative audio.dispose
        status: pass
      - kind: unit
        ref: src/shell/router.test.ts#second launch reuses same audio
        status: pass
    human_judgment: false
  - id: D4
    description: Boot seed string reused on every Crash launch
    requirement: CFG-02
    verification:
      - kind: unit
        ref: src/shell/router.test.ts#second launch reuses seed string
        status: pass
    human_judgment: false

duration: 7min
completed: 2026-10-09
status: complete
---

# Phase 01 Plan 01: Portfolio shell Crash walking skeleton Summary

**Menu ↔ Crash on one shell-owned Pixi Application with epoch-guarded teardown and architecture gates for leak-free leave.**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-10-09T13:26:33Z
- **Completed:** 2026-10-09T13:33:00Z
- **Tasks:** 2
- **Files modified:** 17 (plus pre-staged menu icons that landed in Task 1)

## Accomplishments

- Shell boot owns Application, AudioPort, and boot seed once; Crash borrows them per launch
- Pure router with epoch + AbortSignal; node tests cover happy path and launch races
- Session dispose cancels ticker, HUD keydown/tween, scene AnimatedSprites, resize listeners, and removes the canvas from the DOM without touching shell resources

## Task Commits

1. **Task 1: End-to-end menu to Crash and back** - `f122a36` (feat)
2. **Task 2 RED: failing leak-free leave tests** - `3ae710f` (test)
3. **Task 2 GREEN: CrashHud.dispose + session teardown** - `5ee9651` (feat)

**Plan metadata:** (docs commit follows)

## TDD Gate Compliance

- Task 2 `tdd="true"`: RED commit `3ae710f`, GREEN commit `5ee9651`
- RED evidence: Gate B asserted missing `hud.dispose()`; `check tdd-red-evidence` → `RED_EVIDENCE_OK`
- Gate B teeth check: temporary `ctx.audio.dispose()` failed the architecture test; reverted before GREEN commit

## Files Created/Modified

- `src/shell/*` - types, registry, router, menu, boot
- `src/games/crash/session/mountCrashSession.ts` - Crash adapter
- `src/games/crash/view/mountCrashView.ts` - borrows Application
- `src/games/crash/view/CrashScene.ts` - `destroy()`
- `src/games/crash/hud/CrashHud.ts` - `dispose()`
- `index.html` - empty `#app`, `crash-screen-template`, Menu button
- `tests/architecture.shell.test.ts` - SHELL-02 / D-12 source gates

## Decisions Made

- Followed plan contracts and dispose order exactly
- Tracer feedback gate: automated verifies passed under `human_verify_mode=end-of-phase`; expanded into Task 2 without a human checkpoint

## Deviations from Plan

### Auto-fixed Issues

None - implementation matched the plan.

### Other

**1. Pre-staged menu icons included in Task 1 commit**
- **Found during:** Task 1 commit
- **Issue:** `public/assets/menu/icon-*.png` were already staged; `git commit` included them even though 01-04 owns icon wiring
- **Fix:** Left in place (harmless assets); no uncommit
- **Files:** `public/assets/menu/icon-crash.png`, `public/assets/menu/icon-hotline.png`
- **Commit:** `f122a36`

## Threat Flags

None beyond the plan register (T-01-01..04 mitigated by createElement menu + architecture gates).

## Known Stubs

None that block this plan's goal. HOTLINE registry entry and menu mute/icons remain for 01-03.

## Self-Check: PASSED

- FOUND: src/shell/types.ts, router.ts, bootShell.ts, mountCrashSession.ts, architecture.shell.test.ts, crash-screen-template in index.html
- FOUND commits: f122a36, 3ae710f, 5ee9651
- VERIFY: `npx tsc --noEmit` 0; `npx vitest run src/shell tests` 86 passed; `npx vite build` emits `mountCrashSession-*.js` chunk
