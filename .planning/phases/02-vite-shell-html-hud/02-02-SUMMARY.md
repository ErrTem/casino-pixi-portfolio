---
phase: 02-vite-shell-html-hud
plan: 02
subsystem: ui
tags: [html-hud, enablement, auto-cash-out, reset-wallet, vitest]

requires:
  - phase: 02-vite-shell-html-hud
    provides: Vite shell, mountCrashHud tracer, empty #game-canvas-host, rAF clock
provides:
  - Pure enablementFrom waiting|flying|broke matrix
  - Auto cash-out chrome wired to setAutoCashOut
  - Reset demo + broke emphasis in left balance zone
  - Phase-aware disabled attrs on place-bet / cash-out / bet-input
affects:
  - 02-03 chips + history strip
  - Phase 3 Pixi mount (host stays empty of controls)

actuals:
  tokens: 2912
  tasks: 2
  commits: 3

tech-stack:
  added: []
  patterns:
    - phase-aware-enablement (enablementFrom → disabled attrs)
    - command-snapshot-binder (auto CO + reset via facade)
    - broke-reset-path (emphasize reset; never auto-refill)

key-files:
  created:
    - src/games/crash/hud/enablement.ts
    - src/games/crash/hud/enablement.test.ts
  modified:
    - src/games/crash/hud/CrashHud.ts
    - index.html
    - src/styles/hud.css

key-decisions:
  - "Enablement drives from waiting|flying only; terminal phases not durable chrome"
  - "canEditAuto always true; auto CO syncs from snapshot when input not focused"
  - "Broke UX emphasizes Reset demo; never auto-calls resetWallet"

patterns-established:
  - "enablementFrom is pure Node-testable UX flags; GameLogic remains command authority"
  - "Auto CO / reset stay in #hud-bar zones (center / left); never in #game-canvas-host"

requirements-completed: [VIS-02]

coverage:
  - id: D1
    description: Phase-aware enablement disables Place bet / bet input when not waiting-without-bet or broke; Cash out only when flying with locked bet
    requirement: VIS-02
    verification:
      - kind: unit
        ref: "src/games/crash/hud/enablement.test.ts#waiting/flying/broke matrix"
        status: pass
    human_judgment: false
  - id: D2
    description: Auto cash-out always-visible input + Clear call setAutoCashOut; snapshot.autoCashOutAt mirrored when unfocused
    requirement: VIS-02
    verification:
      - kind: unit
        ref: "npx vitest run (42 tests)"
        status: pass
    human_judgment: true
    rationale: "Browser play of set Auto CO → place bet → auto settle needs human check; deferred to end-of-phase UAT"
  - id: D3
    description: Reset demo calls resetWallet; broke / placeBet reason broke emphasizes reset without auto-refill
    requirement: VIS-02
    verification:
      - kind: unit
        ref: "npx vitest run (42 tests)"
        status: pass
    human_judgment: true
    rationale: "Drain-below-min + Reset demo restores 5000 requires browser play; deferred to end-of-phase UAT"

duration: 2min
completed: 2026-09-26
status: complete
---

# Phase 02 Plan 02: Enablement + Auto CO + Reset Summary

**Pure enablementFrom matrix plus HUD auto cash-out chrome and Reset demo broke path — GameLogic stays authority**

## Performance

- **Duration:** 2 min
- **Started:** 2026-09-26T18:53:10Z
- **Completed:** 2026-09-26T18:54:37Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- `enablementFrom` returns canPlaceBet / canCashOut / canEditBet / canEditAuto / chipsEnabled / showBroke from waiting|flying + bet/balance
- Auto CO number input + Clear wired to `setAutoCashOut`; sync from snapshot when unfocused
- Left-zone Reset demo → `resetWallet()`; broke CSS/status emphasis; no auto-refill
- Place bet / cash out / bet input disabled from enablement flags (chips flag exported for 02-03)

## Task Commits

Each task was committed atomically:

1. **Task 1: Pure enablementFrom matrix + Vitest** - `a9ddb84` (feat)
2. **Task 2: Auto CO + Reset demo + wire enablement into CrashHud** - `36fa3dc` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified

- `src/games/crash/hud/enablement.ts` - Pure enablementFrom helper
- `src/games/crash/hud/enablement.test.ts` - waiting/flying/spectator/broke matrix
- `src/games/crash/hud/CrashHud.ts` - auto CO + reset listeners; enablement disabled wiring
- `index.html` - auto-co, clear-auto-co, reset-wallet in hud-bar
- `src/styles/hud.css` - broke / reset emphasis styles

## Decisions Made

- Enablement from durable waiting|flying only (RESEARCH A2) — no cashed_out/crashed chrome dependency
- `canEditAuto` always true; setAutoCashOut persists across rounds
- Broke path emphasizes Reset demo; never auto-calls resetWallet

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Ready for **02-03** (preset chips WALT-03 + history strip WALT-05)
- `#game-canvas-host` still empty of monetary controls
- Human UAT of auto CO + broke→Reset deferred to end-of-phase (`npm run dev`)

## Self-Check: PASSED

- key-files.created exist on disk
- `git log --grep="02-02"` includes feat commits `a9ddb84`, `36fa3dc`
- Acceptance: enablement exports/flags; index data-field/action attrs; CrashHud setAutoCashOut/resetWallet/enablementFrom; unfocused auto-co sync
- `npx vitest run src/games/crash/hud/enablement.test.ts` → 5 passed; `npx vitest run` → 42 passed

---
*Phase: 02-vite-shell-html-hud*
*Completed: 2026-09-26*
