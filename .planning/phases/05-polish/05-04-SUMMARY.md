---
phase: 05-polish
plan: 04
subsystem: hud
tags: [session-stats, keyboard, cash-out, vitest, history, PLSH-04, PLSH-05]

requires:
  - phase: 05-polish
    provides: Seed chip + mute chrome in fixed HUD bar (05-03 / 05-02)
  - phase: 02-vite-shell-html-hud
    provides: enablementFrom.canCashOut + history strip binding
provides:
  - sessionStatsFrom avg/max with — / n/a placeholders (PLSH-04 / D-13 / D-16)
  - Session stats row near history strip (D-14)
  - Space/Enter → requestCashOut with isEditableTarget + canCashOut (PLSH-05 / D-15)
affects: [verify-work, milestone-complete]

actuals:
  tokens: 2800
  tasks: 2
  commits: 4

tech-stack:
  added: []
  patterns:
    - "session-stats-from-history: sessionStatsFrom(snap.history) → textContent"
    - "keyboard-cash-out: Space|Enter + isEditableTarget + enablementFrom.canCashOut → requestCashOut"

key-files:
  created:
    - src/games/crash/hud/sessionStats.ts
    - src/games/crash/hud/sessionStats.test.ts
  modified:
    - src/games/crash/hud/CrashHud.ts
    - index.html
    - src/styles/hud.css

key-decisions:
  - "Avg divides by finite count after skipping non-finite (not history.length) — matches skip-non-finite contract"
  - "Keyboard gates on enablementFrom.canCashOut — same as Cash out button (RESEARCH Q3)"
  - "Window keydown without HUD dispose — SPA demo HMR note acceptable (Pattern 5)"

patterns-established:
  - "session-stats-from-history: pure helper + textContent bind near strip"
  - "keyboard-cash-out: dual-key Space/Enter with focus guard + canCashOut"

requirements-completed: [PLSH-04, PLSH-05]

coverage:
  - id: D1
    description: "sessionStatsFrom empty → — / n/a; single/multi toFixed(2)×; skip non-finite"
    requirement: PLSH-04
    verification:
      - kind: unit
        ref: "src/games/crash/hud/sessionStats.test.ts#empty history returns placeholders — and n/a, never 0.00×"
        status: pass
      - kind: unit
        ref: "src/games/crash/hud/sessionStats.test.ts#single-element history formats that value for both avg and max"
        status: pass
      - kind: unit
        ref: "src/games/crash/hud/sessionStats.test.ts#multi-element history computes avg and max to 2dp ×"
        status: pass
      - kind: unit
        ref: "src/games/crash/hud/sessionStats.test.ts#skips non-finite entries; all non-finite → placeholders"
        status: pass
    human_judgment: false
  - id: D2
    description: "Stats row above history bound from snap.history; Space/Enter cash-out with focus guard + canCashOut"
    requirement: PLSH-05
    verification:
      - kind: unit
        ref: "src/games/crash/hud/sessionStats.test.ts"
        status: pass
      - kind: unit
        ref: "src/games/crash/hud/enablement.test.ts"
        status: pass
      - kind: other
        ref: "npx tsc --noEmit"
        status: pass
      - kind: unit
        ref: "npm test (104 passed)"
        status: pass
    human_judgment: true
    rationale: "Empty —/n/a visibility, mid-flight Space/Enter cash-out, and typing-in-input ignore need desktop keyboard/browser observation — suite proves helper + enablement gate only"

duration: 3min
completed: 2026-09-27
status: complete
---

# Phase 5 Plan 04: Session Stats + Keyboard Cash-Out Summary

**Soft avg/max crash stats from `snapshot.history` sit above the history strip with —/n/a placeholders, and desktop Space/Enter cash out via the same `requestCashOut` path when `canCashOut` and focus is not in an editable field (PLSH-04 / PLSH-05 / D-13–D-16)**

## Performance

- **Duration:** 3 min
- **Started:** 2026-09-27T14:05:59Z
- **Completed:** 2026-09-27T14:09:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Pure `sessionStatsFrom` with Vitest coverage (empty placeholders, single, multi, non-finite skip)
- HUD bind: `session-stats` / `stat-avg` / `stat-max` above history via `textContent` only
- Window `keydown` Space/Enter → `game.requestCashOut()` gated by `isEditableTarget` + `enablementFrom(lastSnap).canCashOut`

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: sessionStatsFrom failing tests** - `f5300eb` (test)
2. **Task 1 GREEN: sessionStatsFrom implementation** - `d8d148e` (feat)
3. **Task 2: stats bind + Space/Enter cash-out** - `2931cf3` (feat)

**Plan metadata:** _(this commit)_

_Note: TDD Task 1 produced RED → GREEN commits; no REFACTOR needed._

## Files Created/Modified

| File | Action | Purpose |
|------|--------|---------|
| `src/games/crash/hud/sessionStats.ts` | Created | `SessionStats` + `sessionStatsFrom` |
| `src/games/crash/hud/sessionStats.test.ts` | Created | Empty / single / multi / non-finite cases |
| `src/games/crash/hud/CrashHud.ts` | Modified | Stats bind + keyboard cash-out listener |
| `index.html` | Modified | `session-stats` host above history |
| `src/styles/hud.css` | Modified | Thin `.session-stats` row (bar height unchanged) |

## Decisions Made

- Avg divides by **finite count** after skipping non-finite (correcter than RESEARCH snippet’s `history.length`)
- Keyboard uses `enablementFrom(...).canCashOut` — matches Cash out button; ignore spectator / no-bet (RESEARCH Q3)
- Window listener without HUD `dispose` — acceptable for SPA demo (Pattern 5 HMR note)

## Deviations from Plan

None - plan executed exactly as written.

## TDD Gate Compliance

| Gate | Commit | Status |
|------|--------|--------|
| RED | `f5300eb` test(05-04) | Pass — target `empty history returns placeholders — and n/a, never 0.00×` assertion fail; `RED_EVIDENCE_OK` |
| GREEN | `d8d148e` feat(05-04) | Pass — 5/5 sessionStats tests green |
| REFACTOR | — | Skipped (no cleanup needed) |

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 5 polish plans complete (05-01..05-04). Ready for `/gsd-verify-work` / milestone close-out. Manual UAT: empty —/n/a; stats update after rounds; Space/Enter mid-flight; ignored while typing in bet/auto.

## Verification Results

- `npx vitest run src/games/crash/hud/sessionStats.test.ts src/games/crash/hud/enablement.test.ts` — 11 passed
- `npx tsc --noEmit` — exit 0
- `npm test` — 104 passed
- Manual empty —/n/a; Space/Enter mid-flight; ignore in inputs — deferred to end-of-phase UAT (`human_verify_mode: end-of-phase`)

## Self-Check: PASSED

- [x] key-files.created exist on disk
- [x] `git log --grep=05-04` shows task commits
- [x] All task acceptance_criteria re-verified
- [x] Plan-level verification commands green
