---
phase: quick
plan: 01
quick_id: 260930-h4h
subsystem: ui
tags: [pixi, crash, parallax, neon, particles, theater]
requires: []
provides:
  - Three-layer parallax star/dust backdrop with multiplier-driven speed lines
  - Tip-follow world camera (no right-edge bob)
  - Neon triple-stroke graph + capped tip spark/smoke trail
  - Live × whole-number scale pulse + white→gold/fire tint after 10×
affects: []
actuals:
  tokens: ~
  tasks: 3
  commits: 3
tech-stack:
  added: []
  patterns:
    - multiplier-driven backdrop intensity
    - world.position tip-follow camera
    - Graphics-only neon stack (no filters package)
key-files:
  created:
    - src/games/crash/view/theaterTint.test.ts
  modified:
    - src/games/crash/view/Backdrop.ts
    - src/games/crash/view/CrashScene.ts
    - src/games/crash/view/CurveGraph.ts
    - src/games/crash/view/Rocket.ts
    - src/games/crash/view/TheaterText.ts
    - src/games/crash/view/viewConfig.ts
key-decisions:
  - "Camera follow uses world.position lerp only — never stage.x/y"
  - "Neon glow via three Graphics strokes (outer/halo/core), no pixi-filters"
  - "Gold/fire tint starts strictly after 10.0x; crash red remains CrashScene-owned"
coverage:
  - id: D1
    description: Parallax star/dust layers + intensifying speed lines on climb
    verification:
      - kind: other
        ref: manual climb smoke
        status: unknown
    human_judgment: true
    rationale: Visual parallax/speed-line feel needs eyes on the canvas
  - id: D2
    description: Tip-follow camera, neon curve, fading tip trail
    verification:
      - kind: unit
        ref: tests/pathMapping.test.ts + tests/viewMode.test.ts
        status: pass
    human_judgment: true
    rationale: Endless-flight camera feel is visual
  - id: D3
    description: Whole-number × pulse + gold/fire tint after 10×
    verification:
      - kind: unit
        ref: src/games/crash/view/theaterTint.test.ts
        status: pass
    human_judgment: true
    rationale: Pulse timing/scale feel needs visual check
duration: ~35min
completed: 2026-09-30
status: complete
---

# Quick 260930-h4h: Crash theater polish Summary

**Climb spectacle now has parallax starfield + speed lines, tip-locked neon flight with a fading trail, and a pulsing × that warms to gold after 10×.**

## Accomplishments

- Replaced right-edge world rotation bob with smooth tip-follow on `world.position`
- Three parallax star/dust layers + clouds; speed-line alpha/density scales with climb intensity
- Curve draws outer glow + halo + core; rocket tip uses capped spark/smoke trail (≤20 nodes)
- `theaterTintForMult` stays near-white through 10× then lerps gold→fire; whole-number scale pulse on climb only

## Commits

- `fa1aae4` — tip-follow camera replaces edge bob
- `9710140` — parallax starfield, neon curve, tip trail
- `72d4d4a` — live × whole-number pulse and gold tint after 10×

## Verification

- `npx tsc --noEmit` — pass
- `npx vitest run src/games/crash/view/theaterTint.test.ts` — pass
- `npm test` — 132 tests pass

## Deviations

- None material; view-layer only, no logic/ or new packages.
