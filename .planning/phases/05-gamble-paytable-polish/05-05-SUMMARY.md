---
phase: 05-gamble-paytable-polish
plan: 05
subsystem: audio-presentation
tags: [hotline, audio, vhs, css-fallback, asset-handoff, vitest]
status: complete

requires:
  - phase: 05-gamble-paytable-polish
    provides: vhs gamble overlay (05-02), info sheet (05-03), spin hub layout (05-04)
provides:
  - gamble_open, gamble_survive and gamble_die beeps wired from the session
  - optional vhs png hooks on the gamble panel and buttons with css neon fallback
  - 05-ASSET-LIST.md for the three vhs pngs
  - human sign-off of the 360 by 640 walkthrough
affects: [future art pass, howler adapter if it lands]

requirements-completed: [PRES-02]

actuals:
  tokens: 8000
  tasks: 2
  commits: 2
plan_head_before: 834e8df

tech-stack:
  added: []
  patterns:
    - optional art is probed with an Image and attached only on load, so a missing file leaves the css look untouched and the pixi loader list is not involved

key-files:
  created:
    - .planning/phases/05-gamble-paytable-polish/05-ASSET-LIST.md
  modified:
    - src/shared/audio/AudioPort.ts
    - src/shared/audio/createBeepAudioPort.ts
    - src/shared/audio/createBeepAudioPort.test.ts
    - src/games/hotline/hud/GambleOverlay.ts
    - src/games/hotline/session/mountHotlineSession.ts
    - src/games/hotline/session/collectPresentation.test.ts
    - src/styles/hud.css

key-decisions:
  - "VHS pngs stay out of HOTLINE_ASSET_URLS, the 17 file pin holds, the browser loads them as plain images from fixed /assets/hotline paths (D-08, T-05-08)"
  - "Art is attached by script only after it loads, so a 404 never swaps the neon panel for an empty box and art can land one file at a time"
  - "Survive no longer reuses the win beep, the three gamble ids get their own pitches 500, 1040 and 140 Hz"

coverage:
  - id: D1
    description: "SfxEvent has gamble_open, gamble_survive, gamble_die with distinct finite pitches"
    requirement: PRES-02
    verification:
      - kind: unit
        ref: "src/shared/audio/createBeepAudioPort.test.ts#keeps gamble events distinct from each other"
        status: pass
    human_judgment: false
  - id: D2
    description: "session plays the beeps on open, survive and die edges"
    requirement: PRES-02
    verification:
      - kind: unit
        ref: "src/games/hotline/session/collectPresentation.test.ts#session plays open survive and die beeps on the matching edges"
        status: pass
    human_judgment: false
  - id: D3
    description: "overlay hooks the three vhs pngs, loader list has no vhs entries, asset list names the files"
    requirement: PRES-02
    verification:
      - kind: unit
        ref: "src/games/hotline/session/collectPresentation.test.ts#overlay hooks the three optional vhs pngs with fixed static paths"
        status: pass
      - kind: unit
        ref: "tests/hotline.assets.test.ts#loader url list covers every asset list file"
        status: pass
    human_judgment: false
  - id: D4
    description: "playable at about 360 by 640 with no horizontal scroll, vhs chrome and info over vhs acceptable"
    requirement: PRES-02
    verification:
      - kind: manual_procedural
        ref: "05-05 task 2 walkthrough, user replied approved with no defects"
        status: pass
    human_judgment: true
    rationale: "real layout, stacking and beep audibility need a browser pass"

duration: 12min
completed: 2026-10-12
---

# Phase 5 Plan 5: VHS art hooks and gamble beeps Summary

Gamble open, survive and die now have their own beeps from the session, the gamble panel and buttons take optional VHS PNGs with the neon css as fallback, and the viewport walkthrough at about 360 by 640 was approved.

## Accomplishments

- `AudioPort.ts` and `createBeepAudioPort.ts`: three new event ids with pitches 500, 1040 and 140 Hz, the exhaustive `Record<SfxEvent, number>` keeps drift a type error
- `mountHotlineSession.ts`: `gamble_open` in `openGamble`, `gamble_survive` or `gamble_die` in `playGambleRound`, replacing the old `win` beep on survive
- `GambleOverlay.ts`: probes `vhs-gamble-panel.png`, `vhs-btn-survive.png` and `vhs-btn-die.png` and attaches each only on load
- `hud.css`: `.hotline-vhs-art` layer plus `--art` modifiers that drop the neon border and fill only when art is present
- `05-ASSET-LIST.md`: three files with sizes, scope rules, placement checklist
- tests: gamble pitch distinctness, session beep edges, overlay path hooks, loader list stays free of vhs, asset list content

## Task Commits

1. Task 1 RED: `17228f9` test(05-05) failing tests for gamble beeps and vhs art hooks (5 failing)
2. Task 1 GREEN: `1730c58` feat(05-05) gamble beeps and optional vhs art with css neon fallback
3. Task 2: human-verify checkpoint, approved, no code change

## Verification

- `npx vitest run src/shared/audio src/games/hotline/session tests/hotline.assets.test.ts`: green
- `npm test`: 55 files, 411 passed
- `npx tsc --noEmit`: exit 0
- `HOTLINE_ASSET_URLS` length still 17
- walkthrough: user approved, no defects reported

## TDD Gate Compliance

RED commit `17228f9` (5 failing tests) precedes GREEN commit `1730c58`. No refactor commit.

## Deviations from Plan

### Auto-fixed Issues

None.

### Notes

**1. [Plan commit ledger]** The `gsd-plan-head-before-05-05` ledger file was never written, so `plan_head_before` is the 05-04 docs commit `834e8df`, which was HEAD before the first 05-05 commit. Commit count 2 was measured from it.

**2. [Project root pin in PowerShell]** Same as 05-04, the pinned toplevel check ran in PowerShell.

**3. [Out of scope requests]** The user raised new UI, turbo and animation requests at the checkpoint. They are not part of this plan and were left for the orchestrator to route.

**4. [Unrelated dirty file]** `.planning/config.json` still modified, not staged.

## Known Stubs

None. The vhs pngs are optional by design, the css neon look is the shipped fallback. The user may drop the art in at any time.

## Threat Flags

None. T-05-08 mitigated with fixed static paths, T-05-10 mitigated by the exhaustive pitch record and tests.

## Next Phase Readiness

Phase 5 plans are all complete. The three VHS pngs are optional art to place in `public/assets/hotline/`.

## Self-Check: PASSED

- 05-ASSET-LIST.md and modified source files exist
- commits 17228f9 and 1730c58 present in git log
- npm test and tsc green
