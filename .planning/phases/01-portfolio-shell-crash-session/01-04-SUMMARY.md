---
phase: 01-portfolio-shell-crash-session
plan: 04
subsystem: shell
tags: [menu-icons, walkthrough, human-verify, SHELL-01, SHELL-02, SHELL-03, SHELL-04, CFG-02]

requires:
  - phase: 01-portfolio-shell-crash-session
    provides: menu tiles with iconUrl paths and Coming soon stub
  - phase: 01-portfolio-shell-crash-session
    provides: Crash session adapter, __shellDebug, seed reuse, mute key
provides:
  - User-supplied Crash and HOTLINE menu tile icons (D-07)
  - Visitor walkthrough sign-off for Phase 1 success criteria
affects:
  - Phase 2 HOTLINE launch visuals (HOTLINE icon already on disk)
  - Phase 1 verify-work / UAT

estimate:
  tokens: 15000
  tasks: 2
  commits: 1

actuals:
  tokens: 2500
  tasks: 2
  commits: 1

plan_head_before: e17180be56810953ecf0966158706241285bea5e

tech-stack:
  added: []
  patterns:
    - Art pipeline: user places PNGs under public/assets/menu; executor verifies signature and square size before commit
    - Walkthrough gate signs off rendering, tickers, WebGL, and font glyphs that node tests cannot see

key-files:
  created: []
  modified:
    - public/assets/menu/icon-crash.png
    - public/assets/menu/icon-hotline.png

key-decisions:
  - "Icons already committed in 01-01; walkthrough found them swapped and a correction commit fixed binary contents only"
  - "Registry iconUrl paths were correct; no code change required for the swap"

patterns-established:
  - "PNG signature + square >=128 px check before committing user art"
  - "Human walkthrough checklist maps 1:1 to Phase 1 roadmap success criteria"

requirements-completed: [SHELL-01, SHELL-02, SHELL-03, SHELL-04, CFG-02]

coverage:
  - id: D1
    description: Crash and HOTLINE menu tile icons exist as square PNGs at least 128 px and render on the menu
    requirement: SHELL-01
    verification:
      - kind: other
        ref: node PNG signature/dimension check on public/assets/menu/icon-*.png
        status: pass
      - kind: manual_procedural
        ref: walkthrough step 1 (icons after swap correction)
        status: pass
    human_judgment: true
    rationale: Motif correctness and tile readability need a person on the running menu
  - id: D2
    description: Visitor walkthrough confirms menu launch, leak-free leave, mute, demo voice, and seed replay
    requirement: SHELL-02
    verification:
      - kind: unit
        ref: npm test (191 tests)
        status: pass
      - kind: other
        ref: npm run build
        status: pass
      - kind: manual_procedural
        ref: walkthrough steps 2-9
        status: pass
    human_judgment: true
    rationale: Ticker leaks, WebGL context, mute UX, and glyph coverage need a browser person

duration: 15min
completed: 2026-10-09
status: complete
---

# Phase 1 Plan 04: Menu Icons + Walkthrough Summary

**User tile icons delivered and Phase 1 walking skeleton signed off after correcting a Crash/HOTLINE icon swap found in walkthrough.**

## Performance

- **Duration:** ~15 min active (+ human walkthrough wait)
- **Started:** 2026-10-09T13:49:00Z
- **Completed:** 2026-10-09T17:05:00Z
- **Tasks:** 2
- **Files modified:** 2 (icon binaries; SUMMARY/state via docs commit)

## Accomplishments

- Verified `icon-crash.png` and `icon-hotline.png` as 256×256 PNGs; both already tracked from 01-01
- After walkthrough feedback, swapped binary contents so Crash shows Crash art and HOTLINE shows HOTLINE art
- `npm test` (191) and `npm run build` green before walkthrough
- User approved walkthrough steps 2–9; step 1 approved after the icon swap fix

## Task Commits

Each task was committed atomically:

1. **Task 1: User generates and places the two menu tile icons** - `f122a36` (prior 01-01 commit; no duplicate assets commit). PNG verify passed on continuation.
2. **Task 2: Visitor walkthrough + icon swap fix** - `e4a0672` (assets: swap crash and hotline menu icons)

**Plan metadata:** `3749fda` (docs: complete plan)

## Files Created/Modified

- `public/assets/menu/icon-crash.png` - Crash tile icon (corrected binary after walkthrough)
- `public/assets/menu/icon-hotline.png` - HOTLINE tile icon (corrected binary after walkthrough)

## Decisions Made

- Icons shipped in 01-01; 01-04 owns verification, walkthrough sign-off, and the swap correction
- Registry `iconUrl` paths stayed `/assets/menu/icon-crash.png` and `/assets/menu/icon-hotline.png` — only file bytes swapped

## Deviations from Plan

### User feedback during walkthrough

**1. [Rule 1 - Bug] Crash and HOTLINE menu icons were swapped**
- **Found during:** Task 2 (visitor walkthrough, step 1)
- **Issue:** Crash tile showed HOTLINE motif art and HOTLINE tile showed Crash motif art; registry paths were already correct
- **Fix:** Swapped PNG binary contents on disk; re-ran PNG verify; committed as `assets(01-04): swap crash and hotline menu icons`
- **Files modified:** `public/assets/menu/icon-crash.png`, `public/assets/menu/icon-hotline.png`
- **Commit:** `e4a0672`

### Notes

- Task 1 did not create a new `assets(01): add menu tile icons` commit because both files were already committed in `f122a36` during 01-01

## Walkthrough Results

| Step | Result | Notes |
|------|--------|-------|
| 1 Menu chrome + icons | Pass (after swap) | Retro Computer title, play-money subtitle, no canvas/banner; icons corrected |
| 2 HOTLINE disabled | Pass | Click/Tab skip |
| 3 Mid-round Menu + fresh relaunch | Pass | D-09 / D-10 |
| 4 Space/Enter on menu | Pass | No sound / no errors |
| 5 Five launch/leave leak check | Pass | `__shellDebug` tickers/stage stable |
| 6 Mute across menu/Crash/reload | Pass | `portfolio-demo:mute` |
| 7 `?seed=abc` replay | Pass | Same first two history points |
| 8 Idle 60s then launch | Pass | No context lost |
| 9 Phone-width tile stack | Pass | Single column |

## Known Stubs

| File | Stub | Reason |
|------|------|--------|
| `src/shell/gameRegistry.ts` | HOTLINE `enabled: false`, no mount, "Coming soon" chip | Intentional Phase 1 stub; Phase 2 flips launch |

## Threat Flags

None beyond plan T-01-11 (user PNGs checked for signature/dimensions; used as img src only).

## Self-Check: PASSED

- FOUND: `public/assets/menu/icon-crash.png`
- FOUND: `public/assets/menu/icon-hotline.png`
- FOUND: `.planning/phases/01-portfolio-shell-crash-session/01-04-SUMMARY.md`
- FOUND: commit `e4a0672` (icon swap)
- FOUND: prior icons commit `f122a36` (01-01)
