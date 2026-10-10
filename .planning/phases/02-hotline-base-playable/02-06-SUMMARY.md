---
phase: 02-hotline-base-playable
plan: 06
subsystem: presentation-assets
tags: [assets, png, hotline, pres-01]
requires:
  - phase: 02-hotline-base-playable
    provides: "02-05 win line cycle (base loop ready for art wiring)"
provides:
  - "02-ASSET-LIST.md with filenames, roles, sizes"
  - "14 user-supplied loose PNGs under public/assets/hotline/"
affects: [02-07]
tech-stack:
  added: []
  patterns: ["loose png files, no atlas (D-07)"]
key-files:
  created:
    - .planning/phases/02-hotline-base-playable/02-ASSET-LIST.md
    - public/assets/hotline/backdrop-rooftop.png
    - public/assets/hotline/frame-crt.png
    - public/assets/hotline/phone-green.png
    - public/assets/hotline/phone-red.png
    - public/assets/hotline/phone-purple.png
    - public/assets/hotline/sym-wild-mask.png
    - public/assets/hotline/sym-hi-pistol.png
    - public/assets/hotline/sym-hi-cassette.png
    - public/assets/hotline/sym-hi-car.png
    - public/assets/hotline/sym-lo-ace.png
    - public/assets/hotline/sym-lo-king.png
    - public/assets/hotline/sym-lo-queen.png
    - public/assets/hotline/sym-lo-jack.png
    - public/assets/hotline/sym-lo-ten.png
  modified: []
key-decisions:
  - "user placed art; agent invented no binaries"
  - "typo filename bakcdrop-rooftop.png renamed to backdrop-rooftop.png before commit"
requirements-completed: [PRES-01]
status: complete
plan_head_before: 730806f75e1fff01ffe0891ff1b5871126f45d72
commits: 2
actuals:
  tokens: 4000
  tasks: 2
  commits: 2
---

# Phase 2 Plan 06: HOTLINE asset pack Summary

Asset list published and the full 14 file HOTLINE PNG pack (rooftop, CRT frame, three phones, wild mask, hi and lo symbols) is committed under `public/assets/hotline/`, ready for wiring in 02-07.

## Tasks

| Task | Name | Commit |
|------|------|--------|
| 1 | Publish concrete HOTLINE asset list | 70c47bb |
| 2 | User places HOTLINE PNG pack (human-action, approved "done") | 1d76308 |

## Verification

All 14 files from 02-ASSET-LIST.md checked with the PNG signature script (0x89504e47): all ok. No diskette or meter art, no atlas.

## Deviations from Plan

None. Orchestrator renamed the typo file `bakcdrop-rooftop.png` to `backdrop-rooftop.png` before commit; the plan only listed 6 must-haves, the pack has 14 per the asset list.

## Known Stubs

None.

## Threat Flags

None. T-02-08 mitigated by the PNG signature check.

## Notes

`frame-crt.png` and `backdrop-rooftop.png` are large (backdrop about 3.2 MB); consider compression later, out of scope here.

## Self-Check: PASSED

- all 14 PNGs found on disk and in commit 1d76308
- commits 70c47bb and 1d76308 exist
