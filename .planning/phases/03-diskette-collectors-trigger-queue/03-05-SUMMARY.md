---
phase: 03-diskette-collectors-trigger-queue
plan: 05
subsystem: audio
tags: [hotline, collectors, beep, AudioPort, SfxEvent, D-16, COLL-01, COLL-02, COLL-03]

requires:
  - phase: 03-diskette-collectors-trigger-queue
    provides: collector FSM, TokenFlight, meters, combo stub (03-04)
provides:
  - SfxEvent collector IDs token_spawn token_land phone_trigger queue_step
  - createBeepAudioPort PITCH_HZ for collector events (no Howler)
  - mountHotlineSession play wiring at spawn land stub-enter and queue-step
  - Human walkthrough sign-off for Phase 3 COLL-01..03
affects:
  - Phase 4 bonus modules (swap stub for real features)
  - Future Howler sample pack behind AudioPort

actuals:
  tokens: 1584
  tasks: 2
  commits: 2

plan_head_before: b81e047138725f3ad4233692904abcf0ce7f11ac

tech-stack:
  added: []
  patterns:
    - "widen closed SfxEvent + PITCH_HZ; keep shell beep AudioPort (D-16)"
    - "collector play edges: spawn on startCollectors, land on onCollectorLand, phone_trigger on stub enter, queue_step on stub beat pop"

key-files:
  created: []
  modified:
    - src/shared/audio/AudioPort.ts
    - src/shared/audio/createBeepAudioPort.ts
    - src/shared/audio/createBeepAudioPort.test.ts
    - src/games/hotline/session/mountHotlineSession.ts
    - src/games/hotline/session/collectPresentation.test.ts

key-decisions:
  - "Collector beep Hz: token_spawn 700, token_land 840, phone_trigger 560, queue_step 480 (distinct; Claude discretion per CONTEXT)"
  - "Keep beep AudioPort; Howler deferred (D-16)"
  - "Walkthrough approved 2026-10-10 for COLL-01 COLL-02 COLL-03"

patterns-established:
  - "Session source contracts assert play(\"token_*\") ids beside busy/FSM contracts"
  - "Nested Vitest TAP flattened in tdd-red-evidence JSON for RED_EVIDENCE_OK"

requirements-completed: [COLL-01, COLL-02, COLL-03]

coverage:
  - id: D1
    description: Beep AudioPort covers four distinct collector SfxEvent pitches
    requirement: COLL-01
    verification:
      - kind: unit
        ref: src/shared/audio/createBeepAudioPort.test.ts#plays every sfx event with a finite pitch
        status: pass
      - kind: unit
        ref: src/shared/audio/createBeepAudioPort.test.ts#keeps collector events distinct from each other
        status: pass
    human_judgment: false
  - id: D2
    description: Session plays collector beeps on spawn land trigger and queue-step edges
    requirement: COLL-02
    verification:
      - kind: unit
        ref: src/games/hotline/session/collectPresentation.test.ts#session source plays collector beep events on presentation edges (D-16)
        status: pass
      - kind: other
        ref: npx vitest run src/shared/audio src/games/hotline
        status: pass
    human_judgment: false
  - id: D3
    description: Visitor walkthrough of diskette flight meters combo stub Spin lock and mute
    requirement: COLL-03
    verification:
      - kind: manual_procedural
        ref: human walkthrough http://127.0.0.1:5173/ HOTLINE collector loop
        status: pass
    human_judgment: true
    rationale: Audible beeps, neon arcs, meter growth, combo stub order, and mute need a human ear and eye

duration: 15min
completed: 2026-10-10
status: complete
---

# Phase 3 Plan 05: Collector Beep SFX + Walkthrough Summary

**Shared beep AudioPort widened for diskette spawn/land/trigger/queue-step, wired in HOTLINE session; visitor walkthrough signed off COLL-01..03**

## Performance

- **Duration:** 15 min
- **Started:** 2026-10-10T20:44:00Z
- **Completed:** 2026-10-10T20:58:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Extended `SfxEvent` with `token_spawn`, `token_land`, `phone_trigger`, `queue_step` and distinct `PITCH_HZ` (D-16)
- Wired `mountHotlineSession` play calls at collector presentation edges; unlock still on Spin
- Human walkthrough approved: flights, meters, combo stub, Spin lock, mute, collector beeps
- No Howler / sample pack added

## Task Commits

Each task was committed atomically:

1. **Task 1: Widen beep AudioPort for collector events** — TDD
   - `22e0cb1` test(03-05): add failing tests for collector beep events
   - `3a56f9b` feat(03-05): widen beep AudioPort for collector events
2. **Task 2: Walkthrough diskette collectors and combo stub** — human-verify approved (no code commit)

**Plan metadata:** (docs commit after this SUMMARY)

_Note: TDD tasks may have multiple commits (test → feat → refactor)_

## TDD Gate Compliance

| Task | RED commit | GREEN commit | Evidence |
|------|------------|--------------|----------|
| Task 1 collector AudioPort | `22e0cb1` test(03-05) | `3a56f9b` feat(03-05) | `03-05-tdd-red-evidence.json` → RED_EVIDENCE_OK |

## Files Created/Modified

- `src/shared/audio/AudioPort.ts` — widened SfxEvent union
- `src/shared/audio/createBeepAudioPort.ts` — PITCH_HZ for four collector events
- `src/shared/audio/createBeepAudioPort.test.ts` — ALL_EVENTS + distinct collector pitches
- `src/games/hotline/session/mountHotlineSession.ts` — play at spawn/land/trigger/queue-step
- `src/games/hotline/session/collectPresentation.test.ts` — D-16 session source contract

## Decisions Made

- Collector beep Hz chosen for distinctness vs existing Crash/HOTLINE pitches (700/840/560/480)
- Kept beep AudioPort per D-16; Howler stays deferred
- Walkthrough gate blocking-human; user replied approved 2026-10-10

## Deviations from Plan

### Auto-fixed Issues

None - plan executed exactly as written.

Nested Vitest TAP required flattened evidence JSON for `check tdd-red-evidence` (same pattern as 03-03/03-04) — documentation-only, not a code deviation.

---

**Total deviations:** 0 auto-fixed
**Impact on plan:** None

## Issues Encountered

None

## Known Stubs

| File | Note | Reason |
|------|------|--------|
| `mountHotlineSession.ts` combo stub | Glow + strip + `resetPhoneMeter` beats only | Intentional Phase 3 stub; real bonuses in Phase 4 (plan prohibition) |

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 3 visitor-facing collector loop complete with audible feedback
- Phase 4 can replace combo stub with real Green/Red/Purple bonus modules
- Sample Howler pack remains optional polish behind the same AudioPort

---
*Phase: 03-diskette-collectors-trigger-queue*
*Completed: 2026-10-10*

## Self-Check: PASSED

- FOUND: `.planning/phases/03-diskette-collectors-trigger-queue/03-05-SUMMARY.md`
- FOUND: `22e0cb1` test RED commit
- FOUND: `3a56f9b` feat GREEN commit
- FOUND: collector SfxEvent ids in AudioPort + session play wiring
