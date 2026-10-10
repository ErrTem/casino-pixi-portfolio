---
phase: 02-hotline-base-playable
plan: 07
subsystem: presentation-view
tags: [pixi, assets, hotline, pres-01]
requires:
  - phase: 02-hotline-base-playable
    provides: "02-06 png art pack under public/assets/hotline"
provides:
  - "loadHotlineAssets: fail loud loader for 14 pngs plus the Retro Computer title font"
  - "PhonesLayer: three inert rotary phone sprites"
  - "HotlineScene portrait stack: backdrop, title, phones, crt bezel over masked reels"
  - "reel cells draw symbol pngs, graphics boxes are gone"
affects: [03-feature-meters]
tech-stack:
  added: []
  patterns: ["Assets.load with required texture check", "vite ?url font loaded through Assets web-font parser", "glass rect measured from frame alpha"]
key-files:
  created:
    - src/games/hotline/view/loadHotlineAssets.ts
    - src/games/hotline/view/PhonesLayer.ts
    - tests/hotline.assets.test.ts
  modified:
    - src/games/hotline/view/HotlineScene.ts
    - src/games/hotline/view/mountHotlineView.ts
    - src/games/hotline/view/reels/ReelStrip.ts
    - src/games/hotline/view/reels/createReelWindow.ts
    - src/styles/hud.css
key-decisions:
  - "title font loads from the shared TTF via vite ?url and Assets web-font parser, no public/fonts copy needed"
  - "backdrop is 1920x1080 landscape, scene cover-scales it and crops the sides instead of asking for new art"
  - "glass rect for the 5x4 grid is 698x536 at (100,97) inside the 900x720 bezel, measured from the png alpha"
  - "a dark translucent screen rect sits under the reels so transparent symbols read on the sunset"
  - "wide screens keep a 34rem tall column for HOTLINE only, Crash layout untouched"
requirements-completed: [PRES-01]
status: complete
plan_head_before: 3ca589a
commits: 2
actuals:
  tokens: 11000
  tasks: 2
  commits: 2
---

# Phase 2 Plan 07: HOTLINE presentation wiring Summary

The HOTLINE scene now renders on the real art pack: sunset rooftop backdrop, Retro Computer title, three inert phones, the dirty CRT bezel over the masked 5x4 reels, and symbol PNGs in every cell. A missing asset rejects the mount instead of drawing an empty stage.

## Tasks

| Task | Name | Commit |
|------|------|--------|
| 1 | Load HOTLINE assets and Retro Computer for title (tracer) | de1a663 |
| 2 | Wire rooftop, CRT, phones, title and symbol textures | da855b0 |

## Verification

- PNG signature node check: png ok
- `npx vitest run`: 42 files, 268 tests passed (includes 3 new in `tests/hotline.assets.test.ts`)
- `npx tsc --noEmit` clean, `npm run build` exits 0
- Manual PRES-01 in the browser (vite dev): menu to HOTLINE shows rooftop, CRT bezel, phones above the monitor, Retro Computer title, symbol art; after Spin the strips land on symbol PNGs and balance updates

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Backdrop is landscape, not portrait**
- **Found during:** Task 2
- **Issue:** `backdrop-rooftop.png` is 1920x1080, the asset list asked for 1080x1920
- **Fix:** cover-scale and center in the scene, no new art invented
- **Files modified:** src/games/hotline/view/HotlineScene.ts

**2. [Rule 1 - Bug] Test json import failed tsc under NodeNext**
- **Found during:** Task 1
- **Issue:** bare json import needs an import attribute
- **Fix:** test reads symbol ids through `loadHotlineConfig`
- **Files modified:** tests/hotline.assets.test.ts

Otherwise the plan ran as written. The dark screen rect under the reels is code-drawn but only as a backing panel, the primary presentation is all PNG.

## Known Stubs

None. Phones are inert by design until Phase 3 meters.

## Threat Flags

None. T-02-08 and T-02-09 mitigated by the PNG signature test and the required-texture throw in `loadHotlineAssets`.

## Notes

- `sym-hi-car.png` currently shows a grenade, config id is still `car`. Art content, not a wiring issue; swap the file if a car is wanted.
- Backdrop is about 3.2 MB, compress later.
- Console error check was not run beyond the visual pass.

## Self-Check: PASSED

- loadHotlineAssets.ts, PhonesLayer.ts, tests/hotline.assets.test.ts found on disk
- commits de1a663 and da855b0 exist
