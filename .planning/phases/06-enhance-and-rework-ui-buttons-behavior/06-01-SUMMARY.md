---
phase: 06-enhance-and-rework-ui-buttons-behavior
plan: 01
subsystem: ui
tags: [pixi, hud, 100dvh, dual-line-primary, presets, auto-cash-out, vitest]

requires:
  - phase: 05-polish
    provides: countdown, mute, session stats, keyboard cash-out, shell HUD binders
provides:
  - 100dvh no-scroll column shell (top chrome → history → canvas → controls)
  - primaryChromeFrom dual-line BET / CASH OUT / CASHED OUT helper
  - PRESET_CHIPS 20/50/100 + ALL maxAffordableStake fill-only
  - Auto CO toggle + ± field chrome (dim when OFF)
  - CrashHud single-primary binder with Phase 5 polish relocated
affects:
  - 06-02 Auto bet waiting-edge
  - 06-04 Seed chip removal / arcade camera

actuals:
  tokens: 10011
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - primary-dual-line via pure primaryChromeFrom
    - 100dvh column shell with canvas flex leftover
    - ALL chip fill-only via maxAffordableStake

key-files:
  created:
    - src/games/crash/hud/primaryChrome.ts
    - src/games/crash/hud/primaryChrome.test.ts
  modified:
    - src/games/crash/hud/chips.ts
    - src/games/crash/hud/chips.test.ts
    - index.html
    - src/styles/hud.css
    - tests/shell.hud-layout.test.ts
    - src/games/crash/hud/CrashHud.ts
    - src/games/crash/hud/chromeMode.ts
    - src/games/crash/hud/enablement.ts
    - src/main.ts

key-decisions:
  - "Mount CrashHud on #app so top-chrome / history-band / hud-bar share one binder root"
  - "Auto bet toggle is session UI only — placeBet loop deferred to 06-02"
  - "chromeModeFrom kept for tests; CrashHud uses primaryChromeFrom only"

patterns-established:
  - "Pattern: primaryChromeFrom(snap, stake) → { label, amountLine, enabled, kind }"
  - "Pattern: PRESET_CHIPS [20,50,100] + ALL_CHIP fill maxAffordableStake — never placeBet"
  - "Pattern: Auto CO toggle OFF → setAutoCashOut(null) + dim/disable ± field"

requirements-completed: [UI-01, UI-02, WALT-03Δ, WALT-04Δ]

coverage:
  - id: D1
    description: Pure primaryChromeFrom BET / CASH OUT / CASHED OUT / spectator cases
    requirement: UI-02
    verification:
      - kind: unit
        ref: src/games/crash/hud/primaryChrome.test.ts
        status: pass
    human_judgment: false
  - id: D2
    description: PRESET_CHIPS 20/50/100 + maxAffordableStake ALL helper
    requirement: WALT-03Δ
    verification:
      - kind: unit
        ref: src/games/crash/hud/chips.test.ts
        status: pass
    human_judgment: false
  - id: D3
    description: 100dvh shell zones + primary selector + canvas monetary ban
    requirement: UI-01
    verification:
      - kind: unit
        ref: tests/shell.hud-layout.test.ts
        status: pass
    human_judgment: false
  - id: D4
    description: CrashHud dual-line primary + Auto CO toggle + presets wired end-to-end
    requirement: WALT-04Δ
    verification:
      - kind: unit
        ref: npm test (117 passed)
        status: pass
      - kind: other
        ref: npx tsc --noEmit
        status: pass
    human_judgment: true
    rationale: Visual 100dvh no-scroll feel and dual-line live amounts need browser QA at phase UAT

duration: 7min
completed: 2026-09-29
status: complete
---

# Phase 06 Plan 01: Tracer shell + dual-line primary Summary

**100dvh no-scroll JetX-like shell with one dual-line BET/CASH OUT primary, 20/50/100/ALL fill-only presets, and Auto CO toggle/± chrome**

## Performance

- **Duration:** 7 min
- **Started:** 2026-09-29T18:48:05Z
- **Completed:** 2026-09-29T18:52:39Z
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments

- Pure `primaryChromeFrom` + Vitest for waiting BET, flying live win, cashed_out freeze, spectator no fake win
- Shell rebuilt: `#top-chrome` → `#history-band` → `#game-canvas-host` → `#hud-bar` with overflow hidden / 100dvh
- CrashHud single primary click path, Auto CO toggle dims field, ALL fills max affordable only; mute/reset/history/stats/keyboard relocated

## Task Commits

1. **Task 1: primaryChromeFrom + PRESET_CHIPS/ALL** - `9a4fee3` (feat)
2. **Task 2: 100dvh shell markup + CSS** - `3b2ab49` (feat)
3. **Task 3: CrashHud primary + Auto CO + presets** - `937ad7a` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified

- `src/games/crash/hud/primaryChrome.ts` — dual-line chrome helper
- `src/games/crash/hud/primaryChrome.test.ts` — D-06..D-09 cases
- `src/games/crash/hud/chips.ts` — 20/50/100 + ALL + maxAffordableStake
- `src/games/crash/hud/chips.test.ts` — updated presets + ALL clamp/broke
- `index.html` — 100dvh zone markup; data-action=primary; no seed-chip
- `src/styles/hud.css` — column bands; dual-line CTA; Auto CO dim-off
- `tests/shell.hud-layout.test.ts` — new selectors + nested innerById fix
- `src/games/crash/hud/CrashHud.ts` — single primary binder + relocate polish
- `src/games/crash/hud/chromeMode.ts` — legacy promote kept; unused by CrashHud
- `src/games/crash/hud/enablement.ts` — Auto CO toggle note
- `src/main.ts` — mount HUD on `#app`

## Decisions Made

- Mount CrashHud on `#app` so top/history/controls share one query root (shell split zones)
- Auto bet toggle exposed via `isAutoBetOn` / `getStake` stubs — no auto-place yet (06-02)
- Seed options accepted but ignored (chip host gone); file delete remains 06-04

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Mount CrashHud on `#app` instead of `#hud-bar` only**
- **Found during:** Task 3 (CrashHud retarget)
- **Issue:** Balance/mute/reset/history/stats moved outside `#hud-bar`; mounting on bar alone would throw missing fields
- **Fix:** `main.ts` queries `#app`; CrashHud resolves `.app-shell` for broke emphasize
- **Files modified:** `src/main.ts`, `src/games/crash/hud/CrashHud.ts`
- **Verification:** `npx tsc --noEmit` + `npm test` green
- **Committed in:** `937ad7a` (Task 3)

**2. [Rule 1 - Bug] Nested `innerById` depth counting for history-band**
- **Found during:** Task 2 (shell layout test)
- **Issue:** Naive first-`</div>` parse missed `data-field=history` inside nested band
- **Fix:** Depth-aware tag matching in `tests/shell.hud-layout.test.ts`
- **Files modified:** `tests/shell.hud-layout.test.ts`
- **Verification:** shell layout suite 7/7 pass
- **Committed in:** `3b2ab49` (Task 2)

---

**Total deviations:** 2 auto-fixed (1 blocking mount root, 1 test parser)
**Impact on plan:** Required for shell zone split; no scope creep.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Ready for **06-02** Auto bet waiting-edge (D-10 checkpoint) — toggle + stake getters already exposed
- Manual UAT deferred to end-of-phase: 100dvh no-scroll, live dual-line amounts, countdown/mute/stats/keyboard smoke

## Self-Check: PASSED

- key-files.created exist on disk
- `git log --grep="06-01"` shows 3 feat commits
- Plan verification: primaryChrome+chips vitest, shell.hud-layout vitest, `tsc --noEmit`, `npm test` (117) all exit 0
- No `src/games/crash/logic/` modifications

---
*Phase: 06-enhance-and-rework-ui-buttons-behavior*
*Completed: 2026-09-29*
