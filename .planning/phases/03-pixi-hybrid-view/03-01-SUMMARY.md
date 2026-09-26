---
phase: 03-pixi-hybrid-view
plan: 01
subsystem: ui
tags: [pixi.js, ticker, graphics, crash, neon-trail, view-mode]

requires:
  - phase: 02-vite-shell-html-hud
    provides: "#game-canvas-host mount, HUD render site, rafClock handoff comment"
provides:
  - "pixi.js@8.21.0 pinned dependency"
  - "mountCrashView + createCrashScene neon trail / rocket / sever"
  - "pure pathMapping + viewMode reducers with Vitest"
  - "single app.ticker clock (minFPS 10) replacing rafClock"
affects: [03-pixi-hybrid-view, 04-mobile-touch]

actuals:
  tokens: 12000
  tasks: 2
  commits: 2

tech-stack:
  added: [pixi.js@8.21.0]
  patterns: [single-capped-ticker, snapshot-plot, climb-waiting-edge, two-stroke-neon]

key-files:
  created:
    - src/games/crash/view/mountCrashView.ts
    - src/games/crash/view/CrashScene.ts
    - src/games/crash/view/pathMapping.ts
    - src/games/crash/view/viewConfig.ts
    - src/games/crash/view/viewMode.ts
    - src/games/crash/view/CurveGraph.ts
    - tests/pathMapping.test.ts
    - tests/viewMode.test.ts
  modified:
    - package.json
    - package-lock.json
    - src/main.ts
    - src/styles/hud.css
    - tests/architecture.no-pixi.test.ts
  deleted:
    - src/app/rafClock.ts

key-decisions:
  - "Task 1 human-approved: pixi.js@8.21.0 from github.com/pixijs/pixijs before install"
  - "D-01 two-stroke halo/core Graphics (no pixi-filters)"
  - "D-03 log2-x / linear-y plot; cashed_out counts as climb (D-16 view side)"
  - "cashOutAt passed null from CrashScene until plan 03-02"

patterns-established:
  - "Pattern single-capped-ticker: app.ticker.minFPS=10 → tick(deltaMS) → getSnapshot → hud.render → scene.sync"
  - "Pattern snapshot-plot: multiplier → plotPoint / pathTangentRadians → CurveGraph + rocket"
  - "Pattern climb-waiting-edge: reduceViewMode idle|climb|crash_hold|crash_fade"

requirements-completed: [VIS-01]

coverage:
  - id: D1
    description: "While flying, canvas shows rising neon trail and rocket from snapshot.multiplier"
    requirement: VIS-01
    verification:
      - kind: unit
        ref: "tests/pathMapping.test.ts"
        status: pass
      - kind: other
        ref: "npx tsc --noEmit"
        status: pass
    human_judgment: true
    rationale: "Spectacle appearance needs a live round visual check in the browser"
  - id: D2
    description: "Climb-to-waiting severs path in red and hides rocket; boot waiting stays idle"
    requirement: VIS-01
    verification:
      - kind: unit
        ref: "tests/viewMode.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "One ticker callback; rafClock deleted; pixi.js@8.21.0 only new dep; ARCH-02 holds"
    requirement: VIS-01
    verification:
      - kind: unit
        ref: "tests/architecture.no-pixi.test.ts"
        status: pass
    human_judgment: false

duration: 5min
completed: 2026-09-27
status: complete
---

# Phase 03: Pixi Hybrid View — Plan 01 Summary

**PixiJS v8 mounts in `#game-canvas-host` with a capped ticker driving a neon climb trail, path-tangent rocket, and climb→waiting red sever.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-09-26T22:18:32Z
- **Completed:** 2026-09-26T22:21:00Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments

- Human-approved registry identity for `pixi.js@8.21.0` (github.com/pixijs/pixijs) before install
- Replaced `rafClock` with one `app.ticker` callback (`minFPS` 10): `tick` → HUD → `scene.sync`
- Pure `pathMapping` / `viewMode` + two-stroke `CurveGraph` deliver VIS-01 climb and crash sever

## Task Commits

1. **Task 1: Confirm pixi.js@8.21.0 registry identity** - (checkpoint:human-verify, approved — no code commit)
2. **Task 2: Ticker-driven neon trail, rocket on the path, and crash sever** - `da82ea4` (feat)

**Plan metadata:** `0c391cd` (docs: complete plan)

## Deviations

None.

## Threats Mitigated

| Threat ID | Disposition | Notes |
|-----------|-------------|-------|
| T-03-SC | mitigate | Task 1 blocking-human gate before exact pin install |
| T-03-01 | mitigate | sync read-only; ARCH-02 scan unchanged for logic/shared |
| T-03-02 | mitigate | non-finite multipliers return origin; Vitest asserts finite |
| T-03-03 | mitigate | `ticker.minFPS = 10`; pass `deltaMS` only |
| T-03-04 | mitigate | host `position: relative; overflow: hidden`; no fixed canvas |

## Next Phase Preview

Plan 03-02: durable `cashed_out` + `cashOutAt` snapshot field and spectator-finish latch display.
Plan 03-03: backdrop, theater ×, flash, idle bob, rocket texture seam.

---
*Phase: 03-pixi-hybrid-view*
*Plan: 01*
*Completed: 2026-09-27*
