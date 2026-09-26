---
phase: 02-vite-shell-html-hud
plan: 01
subsystem: ui
tags: [vite, html-hud, raf, composition-root, crash-game]

requires:
  - phase: 01-gamelogic-core
    provides: createGame facade, CrashSnapshot, ARCH-02 purity gate
provides:
  - Vite 6.4.3 shell with npm run dev/build/preview
  - Empty reserved #game-canvas-host (D-04) above three-zone #hud-bar
  - Composition root wiring createGame → mountCrashHud → startRafClock
  - Thin CrashHud placeBet/cashOut + balance/phase/live-mult render
affects:
  - 02-02 enablement/auto-CO expansion
  - 02-03 chips + history strip
  - 03 Pixi mount into #game-canvas-host

actuals:
  tokens: 12000
  tasks: 2
  commits: 2

tech-stack:
  added: [vite@6.4.3]
  patterns:
    - command-snapshot-binder (HUD → facade commands, render from getSnapshot)
    - stoppable-raf-clock (startRafClock → stop for Phase 3 ticker handoff)
    - reserved-empty-canvas-host (D-04)

key-files:
  created:
    - index.html
    - vite.config.ts
    - src/main.ts
    - src/app/rafClock.ts
    - src/styles/hud.css
    - src/games/crash/hud/CrashHud.ts
    - src/games/crash/hud/format.ts
  modified:
    - package.json
    - package-lock.json
    - tsconfig.json
    - tests/architecture.no-pixi.test.ts

key-decisions:
  - "D-04 locked option-empty-slot: #game-canvas-host empty reserved mount (quiet Game view label only); no HTML theater/monetary controls in host"
  - "Phase 2 installs vite@6.4.3 only; pixi.js deferred to Phase 3"
  - "Tracer HUD is thin (bet/cash-out/status + live mult); chips/history/auto-CO expand in 02-02/02-03"

patterns-established:
  - "Composition root owns createGame + HUD mount + single clock"
  - "ARCH-02 allows vite in package.json; still forbids pixi.js until Phase 3; logic/shared stay DOM-free"

requirements-completed: [VIS-02]

coverage:
  - id: D1
    description: Vite shell boots with bottom HUD chrome and empty #game-canvas-host (D-01, D-04)
    requirement: VIS-02
    verification:
      - kind: unit
        ref: "tests/architecture.no-pixi.test.ts#package.json must not list pixi.js"
        status: pass
      - kind: other
        ref: "npm run build"
        status: pass
    human_judgment: false
  - id: D2
    description: Composition root createGame + mountCrashHud + startRafClock drives tick → snapshot → balance/live-mult without Pixi
    requirement: VIS-02
    verification:
      - kind: unit
        ref: "npx vitest run (37 tests)"
        status: pass
      - kind: other
        ref: "npm run build"
        status: pass
    human_judgment: false
  - id: D3
    description: Player can place free-form bet and cash out via HTML; monetary controls only in #hud-bar
    requirement: VIS-02
    verification: []
    human_judgment: true
    rationale: "Tracer verify human-check requires browser play of bet→fly→cash-out/crash; deferred to end-of-phase UAT (human_verify_mode=end-of-phase)"

duration: 3min
completed: 2026-09-26
status: complete
---

# Phase 02 Plan 01: Vite Shell + HTML HUD Tracer Summary

**Vite 6.4.3 shell with empty D-04 canvas host, thin CrashHud bet/cash-out binder, and stoppable rAF clock driving createGame.tick → snapshot render**

## Performance

- **Duration:** 3 min
- **Started:** 2026-09-26T18:48:57Z
- **Completed:** 2026-09-26T18:51:00Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments

- Locked D-04 as empty reserved `#game-canvas-host` (option-empty-slot) — quiet "Game view" label only
- Installed vite@6.4.3; added `dev` / `build` / `preview`; DOM lib in tsconfig
- Composition root wires `createGame({ seed: "portfolio-demo" })` → `mountCrashHud` → `startRafClock` with HMR dispose stop
- ARCH-02 updated: vite allowed; pixi.js still banned from package.json; logic/shared remain pure

## Task Commits

Each task was committed atomically:

1. **Task 1: Confirm D-04 empty canvas slot (one-way door)** - decision only — `option-empty-slot` (no code commit)
2. **Task 2: End-to-end Vite shell → createGame → HUD bet/cash-out → rAF tick** - `034bc85` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified

- `index.html` - App shell: empty canvas host + three-zone hud-bar
- `vite.config.ts` - Vite root `.`, port 5173, outDir dist
- `src/main.ts` - Composition root
- `src/app/rafClock.ts` - Stoppable rAF clock
- `src/styles/hud.css` - Flex shell + three-zone chrome
- `src/games/crash/hud/CrashHud.ts` - mountCrashHud + render
- `src/games/crash/hud/format.ts` - formatMoney / formatMult
- `package.json` / `package-lock.json` - vite + scripts
- `tsconfig.json` - ES2022+DOM + vite/client
- `tests/architecture.no-pixi.test.ts` - allow vite; keep pixi.js ban

## Decisions Made

- **D-04 option-empty-slot** — empty reserved mount for Phase 3 Pixi; live mult stays in bottom bar
- **Thin tracer HUD** — free-form bet + cash-out + status only; chips/history/auto-CO deferred to 02-02/02-03 per plan
- **vite@6.4.3 pin** — mature 6.x; no pixi.js this plan

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Ready for **02-02** (enablement matrix, auto CO, Reset demo)
- `#game-canvas-host` clean for Phase 3 Pixi mount
- Human UAT of bet→fly→cash-out loop deferred to end-of-phase (`npm run dev`)

## Self-Check: PASSED

- key-files.created exist on disk
- `git log --grep="02-01"` includes feat commit `034bc85`
- Acceptance criteria: vite 6.4.3 present, no pixi.js, scripts ok, host/hud ids, exports, ARCH-02 updated
- `npx vitest run` → 37 passed; `npm run build` → exit 0

---
*Phase: 02-vite-shell-html-hud*
*Completed: 2026-09-26*
