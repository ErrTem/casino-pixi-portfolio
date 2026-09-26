---
phase: 02-vite-shell-html-hud
plan: 03
subsystem: ui
tags: [html-hud, preset-chips, history-strip, vitest]

requires:
  - phase: 02-vite-shell-html-hud
    provides: Enablement matrix, auto CO, Reset demo, empty canvas host, CrashHud binder
provides:
  - PRESET_CHIPS fill-only bet presets in bottom-bar right zone
  - History strip bound to snapshot.history newest-first
  - Complete VIS-02 HTML overlay surface (presets + history)
affects:
  - Phase 3 Pixi mount (host stays empty of controls)
  - Phase 4 touch grouping of chips/history chrome

actuals:
  tokens: 3448
  tasks: 2
  commits: 3

tech-stack:
  added: []
  patterns:
    - chips-fill-input (preset → bet-input.value only; no auto-placeBet)
    - history-from-snapshot (renderHistoryStrip newest-first; no HUD-local store)
    - phase-aware-enablement (chipsEnabled → chip button.disabled)

key-files:
  created:
    - src/games/crash/hud/chips.ts
    - src/games/crash/hud/chips.test.ts
    - src/games/crash/hud/historyStrip.ts
    - src/games/crash/hud/historyStrip.test.ts
  modified:
    - src/games/crash/hud/CrashHud.ts
    - index.html
    - src/styles/hud.css

key-decisions:
  - "PRESET_CHIPS omit 1000; free-form still allows max via facade"
  - "Chip click fills input only — Place bet sole placeBet path"
  - "History from snapshot.history only; createElement + textContent (no innerHTML)"

patterns-established:
  - "chips-fill-input: PRESET_CHIPS data-only; CrashHud fills bet-input"
  - "history-from-snapshot: orderNewestFirst + historyClass; render each frame from snap"

requirements-completed: [WALT-03, WALT-05, VIS-02]

coverage:
  - id: D1
    description: PRESET_CHIPS [10,25,50,100,250,500] within 10–1000; chip click fills bet-input only (no auto-placeBet); chips disabled via chipsEnabled
    requirement: WALT-03
    verification:
      - kind: unit
        ref: "src/games/crash/hud/chips.test.ts#PRESET_CHIPS (WALT-03)"
        status: pass
    human_judgment: false
  - id: D2
    description: History strip renders snapshot.history newest-first with class thresholds &lt;2 / 2–10 / &gt;10 via safe DOM
    requirement: WALT-05
    verification:
      - kind: unit
        ref: "src/games/crash/hud/historyStrip.test.ts#orderNewestFirst + historyClass"
        status: pass
    human_judgment: false
  - id: D3
    description: Full VIS-02 overlay — bet, cash-out, balance, presets, auto CO, history in #hud-bar; #game-canvas-host empty of controls
    requirement: VIS-02
    verification:
      - kind: unit
        ref: "npx vitest run (50 tests)"
        status: pass
    human_judgment: true
    rationale: "Browser play of chip fill + history pills after rounds deferred to end-of-phase UAT (human-check in plan verify)"

duration: 2min
completed: 2026-09-26
status: complete
---

# Phase 02 Plan 03: Preset Chips + History Strip Summary

**Preset chips fill bet-input only and history strip binds newest-first to snapshot.history in the bottom-bar right zone — VIS-02 / WALT-03 / WALT-05 closed without Pixi**

## Performance

- **Duration:** 2 min
- **Started:** 2026-09-26T18:56:24Z
- **Completed:** 2026-09-26T18:58:09Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- `PRESET_CHIPS = [10, 25, 50, 100, 250, 500]` with bounds tests; omit 1000 all-in chip
- Chip buttons in right zone fill `bet-input` only; Place bet remains sole `placeBet` path; disabled via `chipsEnabled`
- `renderHistoryStrip` + `historyClass` + `orderNewestFirst`; safe DOM; horizontal scroll for ≤20 pills
- CrashHud renders history from `snap.history` every frame — no parallel HUD store / no innerHTML

## Task Commits

Each task was committed atomically:

1. **Task 1: PRESET_CHIPS + fill-input wiring (WALT-03)** - `8eb2d64` (feat)
2. **Task 2: History strip from snapshot.history (WALT-05)** - `528b879` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified

- `src/games/crash/hud/chips.ts` - PRESET_CHIPS constant
- `src/games/crash/hud/chips.test.ts` - bounds + data-only contract
- `src/games/crash/hud/historyStrip.ts` - orderNewestFirst, historyClass, renderHistoryStrip
- `src/games/crash/hud/historyStrip.test.ts` - newest-first + threshold tests
- `src/games/crash/hud/CrashHud.ts` - mount chips; renderHistoryStrip each snapshot
- `index.html` - data-field=chips + data-field=history in right zone
- `src/styles/hud.css` - chip row + history-strip overflow-x

## Decisions Made

- Omit 1000 chip; free-form still allows max 1000 via placeBet
- Chip click never auto-calls placeBet (Pitfall 4)
- History from GameLogic snapshot only; createElement + textContent

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 2 plans complete — ready for `/gsd-verify-work` then Phase 3 Pixi hybrid view
- `#game-canvas-host` still empty of monetary controls
- Human UAT of chips fill + history newest-first deferred to end-of-phase (`npm run dev`)

## Self-Check: PASSED

- key-files.created exist on disk
- `git log --grep="02-03"` includes feat commits `8eb2d64`, `528b879`
- Acceptance: PRESET_CHIPS bounds; fill-only chip handlers; renderHistoryStrip(snap.history); no innerHTML; chips/history in #hud-bar right zone
- `npx vitest run src/games/crash/hud/chips.test.ts` → 3 passed
- `npx vitest run src/games/crash/hud/historyStrip.test.ts` → 5 passed
- `npx vitest run` → 50 passed

---
*Phase: 02-vite-shell-html-hud*
*Completed: 2026-09-26*
