---
phase: 01-portfolio-shell-crash-session
plan: 02
subsystem: audio
tags: [mute, seed, sessionStats, vitest, localStorage, CFG-02, SHELL-03]

requires:
  - phase: 01-portfolio-shell-crash-session
    provides: shell boot calling loadMutePref once; Crash createGame seed wiring
provides:
  - sessionStats labels via formatMult multiplication sign
  - shell.seedReuse.test.ts CFG-02 seed replay proof
  - mutePref portfolio-demo:mute with one-shot legacy migrate
affects:
  - 01-03 menu mute control
  - visitors with crash-demo:mute in localStorage

estimate:
  tokens: 28000
  tasks: 2
  commits: 2

actuals:
  tokens: 2020
  tasks: 2
  commits: 4

plan_head_before: 4c9219b39e17d5305fe04f14a60230623b579d37

tech-stack:
  added: []
  patterns:
    - portfolio mute key with injectable MuteStore and one-shot legacy migrate
    - logic-level seed replay via fixed maxDeltaMs ticks without bets

key-files:
  created:
    - tests/shell.seedReuse.test.ts
  modified:
    - src/games/crash/hud/sessionStats.ts
    - src/shared/audio/mutePref.ts
    - src/shared/audio/mutePref.test.ts

key-decisions:
  - "Mute lives under portfolio-demo:mute; legacy crash-demo:mute copied once when new key absent"
  - "CFG-02 proven as identical crash history for same seed under fixed ticks, not pixel replay"

patterns-established:
  - "Only exact 1/0 migrate from either mute key; malformed values ignored"
  - "Seed reuse tests drive createGame with CRASH_CONFIG.maxDeltaMs until history length N"

requirements-completed: [CFG-02, SHELL-03]

coverage:
  - id: D1
    description: sessionStats avg/max labels use the multiplication sign via formatMult
    requirement: SHELL-03
    verification:
      - kind: unit
        ref: src/games/crash/hud/sessionStats.test.ts#single-element history formats that value for both avg and max
        status: pass
    human_judgment: false
  - id: D2
    description: Same boot seed replays the same Crash history over three rounds; different seed diverges
    requirement: CFG-02
    verification:
      - kind: unit
        ref: tests/shell.seedReuse.test.ts#same boot seed produces identical crash history over three rounds
        status: pass
    human_judgment: false
  - id: D3
    description: Mute preference stored under portfolio-demo:mute with one-shot migrate from crash-demo:mute
    requirement: SHELL-03
    verification:
      - kind: unit
        ref: src/shared/audio/mutePref.test.ts#migrates legacy muted=1 into portfolio-demo:mute
        status: pass
      - kind: unit
        ref: tests/architecture.no-pixi.test.ts
        status: pass
    human_judgment: false

duration: 8min
completed: 2026-10-09
status: complete
---

# Phase 01 Plan 02: Shared boot seams Summary

**sessionStats × labels, CFG-02 seed-replay test, and portfolio-demo:mute with legacy migrate — full suite green (176 tests).**

## Performance

- **Duration:** 8min
- **Started:** 2026-10-09T13:34:00Z
- **Completed:** 2026-10-09T13:38:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Fixed sessionStats to use `formatMult` so avg/max match theater × (existing tests green, unchanged)
- Pinned CFG-02 / D-11: same `parseBootSeed` seed → identical three-round crash history; other seed differs
- Moved mute storage to `portfolio-demo:mute` with one-shot copy from `crash-demo:mute`; architecture DOM-free check still green

## Task Commits

Each task was committed atomically (TDD RED → GREEN per task):

1. **Task 1 RED:** `96f0029` — `test(01-02): add seed reuse test for CFG-02`
2. **Task 1 GREEN:** `25b50b9` — `feat(01-02): use formatMult for sessionStats labels`
3. **Task 2 RED:** `045ad48` — `test(01-02): add mute pref portfolio key and migrate cases`
4. **Task 2 GREEN:** `359514a` — `feat(01-02): portfolio mute key with legacy migrate`

**Plan metadata:** (pending docs commit)

## TDD Gate Compliance

| Task | RED | GREEN | REFACTOR | Notes |
|------|-----|-------|----------|-------|
| 1 sessionStats + seed reuse | ✓ `96f0029` | ✓ `25b50b9` | — | Seed tests pinned existing createGame behavior; sessionStats tests were already red on ASCII x vs × |
| 2 mutePref migrate | ✓ `045ad48` | ✓ `359514a` | — | Assertion failures on constant + migrate before impl |

## Files Created/Modified

- `tests/shell.seedReuse.test.ts` — CFG-02 / D-11 seed replay cases
- `src/games/crash/hud/sessionStats.ts` — labels via `formatMult`
- `src/shared/audio/mutePref.ts` — `portfolio-demo:mute` + `LEGACY_MUTE_STORAGE_KEY` migrate
- `src/shared/audio/mutePref.test.ts` — round-trip + migrate cases

## Decisions Made

- Prefer new mute key when both exist; leave legacy key in place (MuteStore has no remove)
- Only exact `"1"` / `"0"` accepted from either key (T-01-05)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Boot seed replay and portfolio mute key are ready for 01-03 menu mute wiring
- No blockers for remaining Phase 01 plans

## Self-Check: PASSED

- FOUND: `src/games/crash/hud/sessionStats.ts`
- FOUND: `tests/shell.seedReuse.test.ts`
- FOUND: `src/shared/audio/mutePref.ts`
- FOUND: `src/shared/audio/mutePref.test.ts`
- FOUND: commits `96f0029`, `25b50b9`, `045ad48`, `359514a`
- FOUND: `npx vitest run` — 30 files, 176 tests, 0 failed

---
*Phase: 01-portfolio-shell-crash-session*
*Completed: 2026-10-09*
