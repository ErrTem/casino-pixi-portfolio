---
phase: 01-portfolio-shell-crash-session
plan: 03
subsystem: shell
tags: [menu, mute, hotline-stub, retro-computer, vitest, SHELL-01, SHELL-03, SHELL-04]

requires:
  - phase: 01-portfolio-shell-crash-session
    provides: shell router, mountMenu skeleton, bootShell AudioPort once
  - phase: 01-portfolio-shell-crash-session
    provides: portfolio-demo:mute saveMutePref
provides:
  - GAMES hotline stub and MENU_COPY voice tests
  - icon tiles with Coming soon chip and img error fallback
  - bindMuteButton shared mute binder
  - router mute cycle across two launch/leave cycles
affects:
  - 01-04 relaunch leak walkthrough and visual QA
  - Phase 2 HOTLINE launch (flip enabled + mount)

estimate:
  tokens: 54000
  tasks: 2
  commits: 2

actuals:
  tokens: 15471
  tasks: 2
  commits: 4

plan_head_before: a2710159bbdfa63a7ae45344838c586488364358

tech-stack:
  added: []
  patterns:
    - bindMuteButton for shared AudioPort across menu rebuilds
    - createElement menu tiles with img error hide for missing icons
    - Retro Computer @font-face for menu title only

key-files:
  created:
    - src/shell/gameRegistry.test.ts
    - src/shell/muteBinding.ts
    - src/shell/muteBinding.test.ts
  modified:
    - src/shell/gameRegistry.ts
    - src/shell/menu/mountMenu.ts
    - src/shell/bootShell.ts
    - src/shell/router.test.ts
    - src/styles/hud.css
    - index.html
    - tests/shell.hud-layout.test.ts

key-decisions:
  - "Menu Sound uses bindMuteButton on the shell AudioPort; CrashHud mute left as-is"
  - "HOTLINE stays enabled:false with no mount; Coming soon chip only"
  - "Icon error listener hides img so CSS fill remains"

patterns-established:
  - "MuteButton structural type enables node fakes without document"
  - "Router mute cycle: fake showMenu rebinds a fresh button on every rebuild"

requirements-completed: [SHELL-01, SHELL-03, SHELL-04]

coverage:
  - id: D1
    description: Menu lists Crash then disabled HOTLINE with Coming soon chip and icon fallback
    requirement: SHELL-01
    verification:
      - kind: unit
        ref: src/shell/gameRegistry.test.ts#lists crash then hotline with unique ids
        status: pass
      - kind: unit
        ref: src/shell/gameRegistry.test.ts#hotline is disabled stub with hotline icon path and no mount
        status: pass
    human_judgment: true
    rationale: Visual tile layout and chip placement need a browser pass in 01-04
  - id: D2
    description: Menu mute shares portfolio AudioPort preference with Crash across leave/launch
    requirement: SHELL-03
    verification:
      - kind: unit
        ref: src/shell/muteBinding.test.ts#click unlocks, toggles mute, saves, and updates label
        status: pass
      - kind: unit
        ref: src/shell/router.test.ts#mute holds across two menu launch leave cycles on one AudioPort
        status: pass
    human_judgment: false
  - id: D3
    description: Portfolio page title and play-money menu subtitle with Retro Computer header, no banner
    requirement: SHELL-04
    verification:
      - kind: unit
        ref: tests/shell.hud-layout.test.ts#page title names the portfolio, not Crash Demo
        status: pass
      - kind: unit
        ref: src/shell/gameRegistry.test.ts#MENU_COPY title is non-empty and subtitle mentions play money
        status: pass
    human_judgment: true
    rationale: Retro Computer glyph coverage of the title is eye-checked in 01-04

duration: 15min
completed: 2026-10-09
status: complete
---

# Phase 01 Plan 03: Portfolio menu front door Summary

**Crash + HOTLINE stub tiles under a Retro Computer header, with a Sound toggle that shares one AudioPort preference through two leave/launch cycles — 191 tests green.**

## Performance

- **Duration:** 15min
- **Started:** 2026-10-09T13:40:19Z
- **Completed:** 2026-10-09T13:55:00Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- Registry lists Crash then disabled HOTLINE with icon paths, copy voice checks, and banned real-money/hype wording
- Menu tiles show icon (or CSS fill on error), title, blurb, and Coming soon chip; page title is portfolio-wide
- `bindMuteButton` + router mute cycle prove mute set on menu is what Crash sees and back again

## Task Commits

Each task was committed atomically (TDD RED → GREEN per task):

1. **Task 1 RED:** `a16e59d` — `test(01-03): add failing registry and portfolio chrome tests`
2. **Task 1 GREEN:** `6b3a693` — `feat(01-03): HOTLINE stub tiles, Retro Computer menu, portfolio title`
3. **Task 2 RED:** `82611ca` — `test(01-03): add failing mute binding and router mute cycle tests`
4. **Task 2 GREEN:** `ae50b37` — `feat(01-03): shared mute binder on menu with shell AudioPort`

**Plan metadata:** `a0008e1` (docs: complete plan)

## TDD Gate Compliance

| Task | RED | GREEN | REFACTOR | Notes |
|------|-----|-------|----------|-------|
| 1 registry + chrome | ✓ `a16e59d` | ✓ `6b3a693` | — | RED_EVIDENCE_OK on GAMES order assertion |
| 2 mute binding | ✓ `82611ca` | ✓ `ae50b37` | — | Stub muteBinding for import; RED on muteLabel assertion |

## Files Created/Modified

- `src/shell/gameRegistry.ts` — HOTLINE stub entry after Crash
- `src/shell/gameRegistry.test.ts` — order, stub, copy, banned wording
- `src/shell/menu/mountMenu.ts` — icon tiles, chip, mute bar, `audio` option
- `src/shell/muteBinding.ts` — `muteLabel`, `bindMuteButton`, `MuteButton`
- `src/shell/muteBinding.test.ts` — fake button/port binder cases
- `src/shell/router.test.ts` — mute cycle describe (SHELL-03 / D-12 / D-15)
- `src/shell/bootShell.ts` — passes shell `audio` into `mountMenu`
- `src/styles/hud.css` — Retro Computer `@font-face`, menu layout, `.menu-back` in chrome groups
- `index.html` — title `Casino Demos - Portfolio`
- `tests/shell.hud-layout.test.ts` — SHELL-04 / D-13 chrome asserts

## Decisions Made

- Menu Sound uses `bindMuteButton` on the shell AudioPort; CrashHud mute code left unchanged
- HOTLINE stays `enabled: false` with no `mount`; chip text "Coming soon" only
- Img `error` sets `hidden` so the icon wrap CSS fill shows when assets are missing

## Deviations from Plan

None - plan executed exactly as written.

### Rule 2 note (threat mitigations)

T-01-08 / T-01-09 / T-01-10 covered as planned: createElement/textContent only, banned-wording tests, img error hide + CSS fill.

## Issues Encountered

None

## User Setup Required

None - icons already at `public/assets/menu/icon-crash.png` and `icon-hotline.png`.

## Next Phase Readiness

- Menu mute and HOTLINE stub ready for 01-04 visual/leak walkthrough
- No blockers for remaining Phase 01 plan

## Self-Check: PASSED

- FOUND: `src/shell/gameRegistry.ts` (hotline)
- FOUND: `src/shell/gameRegistry.test.ts`
- FOUND: `src/shell/muteBinding.ts`
- FOUND: `src/shell/muteBinding.test.ts`
- FOUND: `src/shell/menu/mountMenu.ts` (`bindMuteButton`, Coming soon)
- FOUND: `src/styles/hud.css` (`@font-face`, `.menu-tile__chip`, `.menu-back`)
- FOUND: `index.html` title Casino Demos - Portfolio
- FOUND: commits `a16e59d`, `6b3a693`, `82611ca`, `ae50b37`
- FOUND: `npm test` — 32 files, 191 tests, 0 failed; `npm run build` exit 0

---
*Phase: 01-portfolio-shell-crash-session*
*Completed: 2026-10-09*
