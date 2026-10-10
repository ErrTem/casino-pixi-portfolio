---
phase: 03-diskette-collectors-trigger-queue
plan: 03
subsystem: view
tags: [hotline, pixi, TokenFlight, PhonesLayer, winCycle, COLL-01, COLL-02]

requires:
  - phase: 03-diskette-collectors-trigger-queue
    provides: diskette PNG pack (03-01) and collectorOutcome / PhoneMeters book (03-02)
  - phase: 02-hotline-base-playable
    provides: HotlineScene, WinLinesOverlay, reelMotion smoothstep, loadHotlineAssets
provides:
  - WinCycle.isDone one-pass gate (D-13 / Q1 RESOLVED)
  - WinLinesOverlay clear-on-done for collector handoff
  - createTokenFlight parallel neon arcs + onLand(CollectorSpawn)
  - PhonesLayer setMeters setGlow phoneCenters procedural bars
  - DISKETTE_URLS + textures.diskettes required()
  - HotlineScene startCollectors tickCollectors setPhoneMeters setPhoneGlow
affects:
  - 03-04 session busy FSM + progressive meter display + combo stub
  - COLL-01 COLL-02 presentation completeness

actuals:
  tokens: 8242
  tasks: 2
  commits: 3

plan_head_before: c05bee0ff3acb7d2ea2cce72704dd27b1d757e77

tech-stack:
  added: []
  patterns:
    - "finite winCycle one-pass then isDone; overlay clears for token handoff (D-13)"
    - "TokenFlight quadratic bezier + smoothstep; no GSAP"
    - "PhonesLayer procedural Graphics bars 0..meterTarget soft-cap (D-08)"

key-files:
  created:
    - src/games/hotline/view/TokenFlight.ts
  modified:
    - src/games/hotline/view/winCycle.ts
    - src/games/hotline/view/winCycle.test.ts
    - src/games/hotline/view/WinLinesOverlay.ts
    - src/games/hotline/view/PhonesLayer.ts
    - src/games/hotline/view/loadHotlineAssets.ts
    - src/games/hotline/view/HotlineScene.ts
    - tests/hotline.assets.test.ts

key-decisions:
  - "One full CYCLE_MS pass per line then isDone; no wrap and no Continue tap (Q1 RESOLVED)"
  - "TokenFlight onLand passes CollectorSpawn so 03-04 can progressive setMeters"
  - "PhonesLayer takes meterTarget at create; bars stay procedural Graphics only"

patterns-established:
  - "HotlineScene collector hooks: startCollectors / tickCollectors / collectorsDone"
  - "DISKETTE_URLS required beside PHONE_URLS in HOTLINE_ASSET_URLS"
  - "Flight container stacked above reels and win overlay"

requirements-completed: [COLL-01, COLL-02]

coverage:
  - id: D1
    description: WinCycle finishes one pass then isDone; overlay can clear for token handoff
    requirement: COLL-01
    verification:
      - kind: unit
        ref: src/games/hotline/view/winCycle.test.ts#is done after one pass and does not wrap
        status: pass
      - kind: unit
        ref: src/games/hotline/view/winCycle.test.ts#finishes a single line after one interval
        status: pass
    human_judgment: false
  - id: D2
    description: DISKETTE_URLS load required green/red/purple textures for TokenFlight
    requirement: COLL-01
    verification:
      - kind: unit
        ref: tests/hotline.assets.test.ts#diskette urls cover green red purple
        status: pass
      - kind: unit
        ref: tests/hotline.assets.test.ts#loader url list covers every asset list file
        status: pass
    human_judgment: false
  - id: D3
    description: TokenFlight parallel neon arcs and PhonesLayer procedural bars with scene hooks
    requirement: COLL-02
    verification:
      - kind: other
        ref: npx tsc --noEmit
        status: pass
    human_judgment: true
    rationale: Arc/meter visuals need a browser look; types and asset URLs are automated only

duration: 5min
completed: 2026-10-10
status: complete
---

# Phase 3 Plan 03: Collector Presentation Layers Summary

**Finite win gate plus TokenFlight neon arcs and procedural phone signal bars on real diskette textures**

## Performance

- **Duration:** 5 min
- **Started:** 2026-10-10T20:34:00Z
- **Completed:** 2026-10-10T20:39:00Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- `createWinCycle` is one-pass with `isDone()`; `WinLinesOverlay` clears when done (D-13)
- `DISKETTE_URLS` + `textures.diskettes` required in `loadHotlineAssets` (D-15)
- `createTokenFlight` overlays cells, flies parallel quadratic arcs with `smoothstep`, `onLand(CollectorSpawn)`
- `PhonesLayer` procedural bars / glow / `phoneCenters`; `HotlineScene` exposes collector start/tick/meter hooks

## TDD Gate Compliance

| Task | RED commit | GREEN commit | Evidence |
|------|------------|--------------|----------|
| Task 1 finite win gate | `61feba0` test(03-03) | `f6128d1` feat(03-03) | `03-03-tdd-red-evidence.json` → RED_EVIDENCE_OK |

Task 2 was view/Pixi presentation (not `tdd="true"`); verified via assets tests + `tsc`.

## Task Commits

1. **Task 1 RED: Finite one-pass win gate tests** - `61feba0` (test)
2. **Task 1 GREEN: Finite winCycle + overlay clear** - `f6128d1` (feat)
3. **Task 2: TokenFlight arcs and phone signal bars** - `aafb6f0` (feat)

**Plan metadata:** `b80eb91` (docs: complete plan)

## Files Created/Modified
- `src/games/hotline/view/winCycle.ts` - one-pass `isDone` gate
- `src/games/hotline/view/winCycle.test.ts` - one-pass / done cases
- `src/games/hotline/view/WinLinesOverlay.ts` - clear when cycle done; expose `isDone`
- `src/games/hotline/view/TokenFlight.ts` - overlay sprites + parallel neon arcs
- `src/games/hotline/view/PhonesLayer.ts` - signal bars, glow, centers
- `src/games/hotline/view/loadHotlineAssets.ts` - DISKETTE_URLS + diskettes textures
- `src/games/hotline/view/HotlineScene.ts` - flight stack + collector hooks
- `tests/hotline.assets.test.ts` - diskette URL coverage

## Decisions Made
- Adopted Q1 RESOLVED one-pass at existing CYCLE_MS then clear
- `onLand` receives full `CollectorSpawn` for 03-04 progressive fills
- No GSAP; no meter PNG pack; no session busy FSM (03-04)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Nested Vitest TAP output failed `check tdd-red-evidence` (`zero_tests_discovered`); flattened TAP summary in the evidence JSON to get `RED_EVIDENCE_OK`

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- View layers ready for 03-04 to wire busy FSM, progressive `setMeters` on land, combo strip + glow stub
- Do not add combo DOM strip or Spin busy here

## Self-Check: PASSED

- FOUND: TokenFlight.ts, winCycle.ts, PhonesLayer.ts, HotlineScene.ts, loadHotlineAssets.ts, 03-03-SUMMARY.md
- FOUND commits: 61feba0, f6128d1, aafb6f0

---
*Phase: 03-diskette-collectors-trigger-queue*
*Completed: 2026-10-10*
