---
phase: 05-polish
plan: 02
subsystem: audio
tags: [webaudio, sfx, mute, localStorage, vitest, AudioPort]

requires:
  - phase: 05-polish
    provides: Waiting+idle theater countdown loop (05-01 ticker order)
  - phase: 02-vite-shell-html-hud
    provides: CrashHud mount + #hud-bar chrome
provides:
  - AudioPort + createBeepAudioPort oscillator beeps (PLSH-02)
  - sfxEventsFromTransition pure edge detector
  - mutePref localStorage + HUD Sound: On|Off toggle
affects: [05-03-seed, 05-04-stats-keyboard]

actuals:
  tokens: 2800
  tasks: 3
  commits: 5

tech-stack:
  added: []
  patterns:
    - "AudioPort + injectable AudioContext oscillator adapter (no Howler)"
    - "sfx-edge-detect: prevSnap→nextSnap in main ticker"
    - "mute-pref-persist: crash-demo:mute 1|0 via injectable store"

key-files:
  created:
    - src/shared/audio/AudioPort.ts
    - src/shared/audio/createBeepAudioPort.ts
    - src/shared/audio/sfxEdges.ts
    - src/shared/audio/sfxEdges.test.ts
    - src/shared/audio/mutePref.ts
    - src/shared/audio/mutePref.test.ts
  modified:
    - src/games/crash/hud/CrashHud.ts
    - src/main.ts
    - index.html
    - src/styles/hud.css

key-decisions:
  - "Web Audio oscillators behind AudioPort — no Howler in Phase 5 (D-08 / RESEARCH A2)"
  - "AudioContext via globalThis / optional inject — no window./document. in shared/audio"
  - "bet_lock from HUD placeBet ok only; takeoff/cash_out/crash from sfxEventsFromTransition"
  - "Mute key crash-demo:mute only — never wallet/seed (T-5-02)"

patterns-established:
  - "sfx-edge-detect: sfxEventsFromTransition(prev, next) after game.tick before hud.render"
  - "mute-pref-persist: loadMutePref/saveMutePref + HUD Sound: On|Off"
  - "bet-lock-sfx: result.ok → unlock + play('bet_lock')"

requirements-completed: [PLSH-02]

coverage:
  - id: D1
    description: "sfxEventsFromTransition emits takeoff/cash_out/crash once per transition; never bet_lock; null prev → []"
    requirement: PLSH-02
    verification:
      - kind: unit
        ref: "src/shared/audio/sfxEdges.test.ts#emits takeoff on waiting -> flying"
        status: pass
      - kind: unit
        ref: "src/shared/audio/sfxEdges.test.ts#emits cash_out when cashOutAt latches null -> value"
        status: pass
      - kind: unit
        ref: "src/shared/audio/sfxEdges.test.ts#emits crash when returning to waiting with history growth"
        status: pass
      - kind: unit
        ref: "src/shared/audio/sfxEdges.test.ts#replaying the same prev/next pair is idempotent (same single-event set)"
        status: pass
    human_judgment: false
  - id: D2
    description: "mutePref round-trips muted true/false as crash-demo:mute 1|0 via injectable store"
    requirement: PLSH-02
    verification:
      - kind: unit
        ref: "src/shared/audio/mutePref.test.ts#save then load round-trips muted=true as crash-demo:mute=1"
        status: pass
      - kind: unit
        ref: "src/shared/audio/mutePref.test.ts#last write wins when toggling mute then unmute"
        status: pass
    human_judgment: false
  - id: D3
    description: "createBeepAudioPort + HUD mute + main ticker edges; ARCH-02 green; no Howler; no logic/ edits"
    requirement: PLSH-02
    verification:
      - kind: unit
        ref: "tests/architecture.no-pixi.test.ts"
        status: pass
      - kind: other
        ref: "npx tsc --noEmit"
        status: pass
      - kind: unit
        ref: "npm test (91 passed)"
        status: pass
    human_judgment: true
    rationale: "Audible beeps, mute silence, and reload persistence need browser gesture + ear — automated suite proves wiring and purity only"

duration: 7min
completed: 2026-09-27
status: complete
---

# Phase 5 Plan 02: AudioPort SFX + Mute Summary

**Four distinct Web Audio oscillator beeps (bet_lock / takeoff / cash_out / crash) behind AudioPort, pure edge detection, and a HUD mute toggle persisted as `crash-demo:mute` (PLSH-02 / D-05–D-08)**

## Performance

- **Duration:** 7 min
- **Started:** 2026-09-27T13:51:49Z
- **Completed:** 2026-09-27T13:58:40Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments

- Wave 0 pure helpers: `sfxEventsFromTransition` + `mutePref` with Vitest coverage (idempotency + round-trip)
- `createBeepAudioPort` oscillator adapter (440/660/880/160 Hz) with mute no-op and idempotent `unlock`
- Composition-root wiring: HUD mute + bet_lock on successful placeBet; ticker edges after tick; HMR `audio.dispose`

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: sfxEdges + mutePref failing tests** - `95fcd75` (test)
2. **Task 1 GREEN: sfxEdges + mutePref helpers** - `12df854` (feat)
3. **Task 2: createBeepAudioPort oscillator adapter** - `28e0f5b` (feat)
4. **Task 3: HUD mute + bet_lock + ticker SFX edges** - `6e2dd73` (feat)

**Plan metadata:** `61f5e50` (docs: complete plan), `ea88bd7` (docs: STATE/ROADMAP)

## Files Created/Modified

| File | Action | Purpose |
|------|--------|---------|
| `src/shared/audio/AudioPort.ts` | Created | `SfxEvent` + `AudioPort` interface |
| `src/shared/audio/sfxEdges.ts` | Created | Pure prev→next edge detector |
| `src/shared/audio/sfxEdges.test.ts` | Created | takeoff / cash_out / crash / idempotency |
| `src/shared/audio/mutePref.ts` | Created | `loadMutePref` / `saveMutePref` + key |
| `src/shared/audio/mutePref.test.ts` | Created | Injectable store round-trip |
| `src/shared/audio/createBeepAudioPort.ts` | Created | Web Audio oscillator adapter |
| `src/games/crash/hud/CrashHud.ts` | Modified | `options.audio`; mute; bet_lock; unlock |
| `src/main.ts` | Modified | audio create, edge wire, HMR dispose |
| `index.html` | Modified | `data-action="mute"` control |
| `src/styles/hud.css` | Modified | Compact `.mute-toggle` (bar height unchanged) |

## Decisions Made

- Oscillators only — Howler deferred until real assets (RESEARCH A2 / D-08)
- No `window.` / `document.` in `shared/audio`; lazy `AudioContext` via `globalThis` + optional inject
- `cashOutAt` null→value is the sole cash-out SFX edge (manual + auto)

## Deviations from Plan

None - plan executed exactly as written.

## TDD Gate Compliance

| Gate | Commit | Status |
|------|--------|--------|
| RED | `95fcd75` test(05-02) | Pass — target `emits takeoff on waiting -> flying` assertion fail; `RED_EVIDENCE_OK` |
| GREEN | `12df854` feat(05-02) | Pass — 10/10 audio helper tests green |
| REFACTOR | — | Skipped (no cleanup needed) |

## Issues Encountered

None

## User Setup Required

None

## Next Phase Readiness

Ready for **05-03** (`?seed=` parse + Seed chip). Audio options bag on `mountCrashHud` is ready to extend with seed UI in the same bar budget.

## Verification Results

- `npx vitest run src/shared/audio` — 10 passed
- `npx vitest run tests/architecture.no-pixi.test.ts` — 7 passed
- `npx tsc --noEmit` — exit 0
- `npm test` — 91 passed
- Manual beep/mute/reload — deferred to end-of-phase UAT (`human_verify_mode: end-of-phase`)

## Self-Check: PASSED

- [x] key-files.created exist on disk
- [x] `git log --grep=05-02` shows task commits
- [x] All task acceptance_criteria re-verified
- [x] Plan-level verification commands green
