---
phase: 05-gamble-paytable-polish
plan: 04
subsystem: hud
tags: [hotline, responsive, css, spin-hub, touch-targets, vitest]
status: complete

requires:
  - phase: 05-gamble-paytable-polish
    provides: gamble control (05-02), info control and paytable sheet (05-03)
provides:
  - desktop hotline bar with a compact gamble and info icon row beside a large spin
  - max-width 480px spin-centric grid hub with 44 by 44 css px controls
  - overflow and min-width guards for the bar and every hotline overlay near 360 by 640
affects:
  - 05-05 VHS art pack (icon glyphs are text only, art can replace them later)

requirements-completed: [PRES-02]

actuals:
  tokens: 9000
  tasks: 2
  commits: 2
plan_head_before: 3c2858386f456d6f39b1d1648a253499de750894

tech-stack:
  added: []
  patterns:
    - one template, css grid areas plus display contents flatten the stake groups into a hub on narrow screens

key-files:
  created: []
  modified:
    - index.html
    - src/styles/hud.css
    - tests/shell.hud-layout.test.ts

key-decisions:
  - "Narrow breakpoint is max-width 480px (RESEARCH A2), separate from the shared 720px Crash query, so tablets and wide phones keep the strip"
  - "Info moved from the top chrome into .hotline-bar__icons beside Gamble so the desktop icon row and the hub share one structure, data-action nodes unchanged so HotlineHud and the session needed no code change"
  - "The hotline hud-bar z-index is auto, only .hotline-icon-btn is raised to 6, so Info and Gamble stay above the feature and gamble overlays (D-12) while spin and bet stay under them"
  - "Hub grid areas are stake / dec spin inc / gamble spin info, spin spans two rows"
  - "Landscape rotate nag omitted, letterbox is the existing 34rem column"

coverage:
  - id: D1
    description: "gamble and info are icon buttons in .hotline-bar__icons inside hud-bar, outside the canvas host, info removed from the top chrome"
    requirement: PRES-02
    verification:
      - kind: unit
        ref: "tests/shell.hud-layout.test.ts#keeps gamble and info as icon buttons in the hotline bar, outside the canvas host"
        status: pass
    human_judgment: false
  - id: D2
    description: "max-width 480px media query turns the bar into a spin-centric grid hub"
    requirement: PRES-02
    verification:
      - kind: unit
        ref: "tests/shell.hud-layout.test.ts#reflows the bar into a spin centered hub at the narrow breakpoint"
        status: pass
    human_judgment: false
  - id: D3
    description: "icon and hub controls are at least 2.75rem square"
    requirement: PRES-02
    verification:
      - kind: unit
        ref: "tests/shell.hud-layout.test.ts#sizes icon and hub controls to at least 44 by 44 css px"
        status: pass
    human_judgment: false
  - id: D4
    description: "34rem column kept, canvas host and canvas keep pointer-events none"
    requirement: PRES-02
    verification:
      - kind: unit
        ref: "tests/shell.hud-layout.test.ts#keeps the 34rem portrait column and never enables pointer events on the canvas host"
        status: pass
    human_judgment: false
  - id: D5
    description: "no horizontal page scroll near 360 by 640, hub looks right and Info rises over a live gamble panel in a real browser"
    requirement: PRES-02
    verification:
      - kind: unit
        ref: "tests/shell.hud-layout.test.ts#guards the bar and every hotline overlay against horizontal overflow (D-14)"
        status: pass
    human_judgment: true
    rationale: "tests pin the css source guards, real layout and stacking need a browser pass at 360 by 640"

duration: 6min
completed: 2026-10-12
---

# Phase 5 Plan 4: Spin hub layout Summary

The hotline bar is now a strip with a compact Gamble and Info icon row beside a large Spin on desktop, and at 480px and below it reflows into a spin-centric grid hub with bet minus and plus, Gamble and Info as 44 by 44 icons around a big center Spin.

## Accomplishments

- `index.html`: Gamble and Info share `.hotline-bar__icons`, each is an icon button with a glyph (`2x`, `i`), a small caption and an `aria-label`; Info left the top chrome
- `hud.css` desktop: stake group, icon row, then Spin growing to fill the strip, min height 4.5rem
- `hud.css` narrow: `@media (max-width: 480px)` makes `.hotline-bar` a grid with areas `stake`, `dec spin inc`, `gamble spin info`; `display: contents` on the stake group, stepper and icon row lets every control take a grid area from one template; captions hide and bet steppers grow to 2.75rem
- overflow guards: `min-width: 0` and `overflow` clipping on `.hotline-screen`, `.hotline-bar` and the feature overlay, `min-width: 0` on the splash, gamble panel, lockers, combo and feature lines
- `tests/shell.hud-layout.test.ts`: 4 new hub tests and 1 overflow guard test

## Task Commits

1. Task 1 (tracer): `aa75e7b` feat(05-04) desktop icon row and narrow spin hub
2. Task 2: `3ef62e4` fix(05-04) overflow and min-width guards for the bar and overlays

## Verification

- `npx vitest run tests/shell.hud-layout.test.ts src/games/hotline/hud/HotlineHud.test.ts src/games/hotline/session`: 3 files, 63 passed (tracer gate, re-run before task 2)
- `npx vitest run tests/shell.hud-layout.test.ts`: 22 passed
- `npx tsc --noEmit`: exit 0
- `npx vitest run` full suite: 55 files, 406 passed
- acceptance criteria: hud.css has the 480px hub query, gamble and info are data-action nodes in hud-bar and absent from the canvas host, `.hotline-screen` still has `max-width: 34rem`, canvas host pointer-events stays none, landscape letterbox untouched (no media query for orientation was added or removed)

## Deviations from Plan

### Auto-fixed Issues

None.

### Notes

**1. [Info relocation]** The plan says to keep Gamble and Info as data-action nodes outside the canvas host. Info was in the top chrome from 05-03, so it moved into the bar icon row to form one cluster. The 05-03 reason for the raised header (reach Info over the VHS panel) is now served by raising the icon buttons. The header z-index 6 was left in place, so Menu and Sound still sit above the overlays as before.

**2. [Project root pin in PowerShell]** The pin script is bash and `bash` on this host is not a Git Bash with the Windows temp path mapped, so the same checks (pinned toplevel equals actual toplevel) ran in PowerShell before edits and commits.

**3. [HotlineHud.ts and HotlineHud.test.ts untouched]** They are listed in the plan files but needed no change because every `data-action` hook kept its name.

**4. [Unrelated dirty file]** `.planning/config.json` is still modified and was not staged.

**Total deviations:** 0 auto-fixed. **Impact:** none on scope.

## Known Stubs

None. The `2x` and `i` glyphs are text stand-ins until the 05-05 art pack, not a stub for missing behavior.

## Threat Flags

None. T-05-08b accepted, markup and css are static, no packages added.

## Next Phase Readiness

05-05 can restyle the icon glyphs and hub with VHS art. A browser pass is still wanted at 360 by 640 for horizontal scroll, hub spacing, and Info above an open gamble panel.

## Self-Check: PASSED

- modified files exist: index.html, src/styles/hud.css, tests/shell.hud-layout.test.ts
- commits aa75e7b and 3ef62e4 present in git log
- plan verification re-run green, tsc exit 0
