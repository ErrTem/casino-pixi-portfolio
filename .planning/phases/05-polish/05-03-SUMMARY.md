---
phase: 05-polish
plan: 03
subsystem: boot
tags: [seed, URLSearchParams, clipboard, textContent, vitest, HUD]

requires:
  - phase: 05-polish
    provides: AudioPort options bag on mountCrashHud (05-02)
  - phase: 01-gamelogic-core
    provides: createGame({ seed }) seeded RNG stream
provides:
  - parseBootSeed + DEFAULT_DEMO_SEED (PLSH-03 / D-12)
  - Boot wire: location.search → createGame({ seed })
  - Collapsible Seed chip reveal + clipboard copy (D-09, D-11)
affects: [05-04-stats-keyboard]

actuals:
  tokens: 2200
  tasks: 2
  commits: 4

tech-stack:
  added: []
  patterns:
    - "boot-seed-session: parseBootSeed(search) → createGame({ seed }) at load only"
    - "seed-chip-reveal-copy: textContent + clipboard.writeText(seed)"

key-files:
  created:
    - src/shared/boot/parseBootSeed.ts
    - src/shared/boot/parseBootSeed.test.ts
    - src/games/crash/hud/seedChip.ts
  modified:
    - src/main.ts
    - src/games/crash/hud/CrashHud.ts
    - index.html
    - src/styles/hud.css

key-decisions:
  - "Seed retained at composition root — not on CrashSnapshot (RESEARCH A4)"
  - "Invalid ?seed= quiet 'using default' note on expanded chip (RESEARCH Q4)"
  - "Boot-only parse — no popstate/hashchange mid-session watch (D-10 deferred)"

patterns-established:
  - "boot-seed-session: parseBootSeed at main → createGame({ seed })"
  - "seed-chip-reveal-copy: mountSeedChip textContent + clipboard seed string"

requirements-completed: [PLSH-03]

coverage:
  - id: D1
    description: "parseBootSeed missing/empty/whitespace/control/overlong → portfolio-demo; valid opaque string accepted"
    requirement: PLSH-03
    verification:
      - kind: unit
        ref: "src/shared/boot/parseBootSeed.test.ts#missing seed param falls back with fromQuery false"
        status: pass
      - kind: unit
        ref: "src/shared/boot/parseBootSeed.test.ts#whitespace-only seed falls back as invalid"
        status: pass
      - kind: unit
        ref: "src/shared/boot/parseBootSeed.test.ts#control chars set invalid true and use fallback"
        status: pass
      - kind: unit
        ref: "src/shared/boot/parseBootSeed.test.ts#valid non-empty trimmed seed is returned unchanged (opaque string)"
        status: pass
    human_judgment: false
  - id: D2
    description: "main.ts parseBootSeed → createGame({ seed }); mountCrashHud receives seed/invalid; Seed chip textContent + copy seed string"
    requirement: PLSH-03
    verification:
      - kind: unit
        ref: "npx vitest run src/shared/boot"
        status: pass
      - kind: unit
        ref: "tests/architecture.no-pixi.test.ts"
        status: pass
      - kind: other
        ref: "npx tsc --noEmit"
        status: pass
      - kind: unit
        ref: "npm test (99 passed)"
        status: pass
    human_judgment: true
    rationale: "Chip expand/copy and ?seed=demo-a visual boot need browser gesture — suite proves parse + wiring + no XSS paths only"

duration: 4min
completed: 2026-09-27
status: complete
---

# Phase 5 Plan 03: Boot Seed + Seed Chip Summary

**URL `?seed=` bootstraps the session RNG via `parseBootSeed`, and a collapsible HUD Seed chip reveals/copies the seed string with `textContent` only (PLSH-03 / D-09–D-12)**

## Performance

- **Duration:** 4 min
- **Started:** 2026-09-27T14:00:33Z
- **Completed:** 2026-09-27T14:04:10Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Pure `parseBootSeed` with Vitest boundaries (missing/empty/whitespace/control/overlong/valid opaque)
- Composition root: `parseBootSeed(window.location.search)` → `createGame({ seed })`; seed retained at root for the chip
- Collapsible Seed chip in right HUD zone — reveal via `textContent`, Copy writes seed string (not share URL); quiet `using default` when invalid

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: parseBootSeed failing tests** - `92c740e` (test)
2. **Task 1 GREEN: parseBootSeed implementation** - `eb57e17` (feat)
3. **Task 2: main boot wire + Seed chip** - `0d161cd` (feat)

**Plan metadata:** _(this commit)_

_Note: TDD Task 1 produced RED → GREEN commits; no REFACTOR needed._

## Files Created/Modified

| File | Action | Purpose |
|------|--------|---------|
| `src/shared/boot/parseBootSeed.ts` | Created | `DEFAULT_DEMO_SEED` + `parseBootSeed` |
| `src/shared/boot/parseBootSeed.test.ts` | Created | Boundary / invalid / valid cases |
| `src/games/crash/hud/seedChip.ts` | Created | Collapsible chip DOM helper |
| `src/games/crash/hud/CrashHud.ts` | Modified | `options.seed` / `invalid`; mount chip |
| `src/main.ts` | Modified | Boot parse → createGame; pass seed into HUD |
| `index.html` | Modified | `data-field="seed-chip"` host |
| `src/styles/hud.css` | Modified | Compact chip styles (bar height unchanged) |

## Decisions Made

- Seed retained at composition root — not on `CrashSnapshot` (RESEARCH A4)
- Invalid `?seed=` shows quiet `using default` on expanded chip (RESEARCH Q4)
- Boot-only — no `popstate` / `hashchange` seed watch (D-10 deferred)

## Deviations from Plan

None - plan executed exactly as written.

## TDD Gate Compliance

| Gate | Commit | Status |
|------|--------|--------|
| RED | `92c740e` test(05-03) | Pass — target `missing seed param falls back with fromQuery false` assertion fail; `RED_EVIDENCE_OK` |
| GREEN | `eb57e17` feat(05-03) | Pass — 8/8 parseBootSeed tests green |
| REFACTOR | — | Skipped (no cleanup needed) |

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for **05-04** (session stats + keyboard cash-out). Seed chip and mute already share the fixed HUD bar budget; stats should stay thin near the history strip.

## Verification Results

- `npx vitest run src/shared/boot` — 8 passed
- `npx vitest run tests/architecture.no-pixi.test.ts` — 7 passed
- `npx tsc --noEmit` — exit 0
- `npm test` — 99 passed
- Manual `?seed=demo-a` / copy / invalid fallback — deferred to end-of-phase UAT (`human_verify_mode: end-of-phase`)

## Self-Check: PASSED

- [x] key-files.created exist on disk
- [x] `git log --grep=05-03` shows task commits
- [x] All task acceptance_criteria re-verified
- [x] Plan-level verification commands green
