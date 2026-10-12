---
phase: quick-261012-lr1
plan: 01
subsystem: docs
tags: [hotline, stitch, design-brief, art-direction]
requires: []
provides:
  - docs/hotline/DESIGN.md
  - docs/hotline/stitch-prompts.md
affects: []
tech-stack:
  added: []
  patterns: []
key-files:
  created:
    - docs/hotline/DESIGN.md
    - docs/hotline/stitch-prompts.md
  modified: []
decisions:
  - "Brief lives in docs/hotline/, outside the phase folders, as a reusable doc"
  - "Palette hex taken from shipped scene and hud.css values, uppercased"
metrics:
  tasks: 2
  completed: 2026-10-12
status: complete
commits: 2
plan_head_before: 3f714e4a59fa517a6a7d1e4a977658603f89ea59
actuals:
  tokens: 6500
  tasks: 2
  commits: 2
---

# Phase quick-261012-lr1 Plan 01: Stitch design brief for HOTLINE Summary

A HOTLINE design system page and four paste ready Google Stitch prompts, with palette hex matching the shipped build and an asset table that maps every prompt to an existing filename and size.

## Tasks

| Task | Name | Commit |
|------|------|--------|
| 1 | DESIGN.md core plus Prompt 1 full game screen (tracer) | def1398 |
| 2 | Prompts 2 to 4 and the asset handoff table | f72929b |

## What was built

- `docs/hotline/DESIGN.md`: mood keywords, 16 token palette plus art only sunset stops, typography with VT323 / Press Start 2P stand-in, portrait layout stack matching `index.html` controls, components, do-not list, and the asset handoff table for 20 files.
- `docs/hotline/stitch-prompts.md`: how to use, Prompt 1 full game screen, Prompt 2 symbol sheet, Prompt 3 CRT frame plus rooftop backdrop, Prompt 4 VHS gamble overlay, each with an Avoid line and follow ups. All four blocks are under 2000 characters (1614, 1090, 1106, 1055).

## Verification

- Task 1 and Task 2 node checks both print ok.
- `git status --porcelain -- src public index.html package.json` is clean for this task.
- Asset status confirmed from the directory listing: 17 files placed, 3 VHS files not placed (CSS neon fallback).
- No em dash, en dash, arrow or emoji characters in either file.

## Deviations from Plan

None - plan executed exactly as written. Phase 3 asset list exists and was read, nothing in it conflicted with the plan table.

## Known Stubs

None.

## Threat Flags

None.

## Self-Check: PASSED

- docs/hotline/DESIGN.md found
- docs/hotline/stitch-prompts.md found
- commits def1398 and f72929b found
