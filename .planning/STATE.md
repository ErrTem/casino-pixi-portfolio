---
gsd_state_version: "1.0"
milestone: v1.0
milestone_name: HOTLINE + multi-game menu
current_phase: 04
current_phase_name: Three Bonuses + Combo Nights
status: executing
stopped_at: Phase 4 context gathered
last_updated: "2026-10-10T22:33:58.844Z"
last_activity: 2026-10-11
last_activity_desc: Phase 03 complete, transitioned to Phase 4
state_head: fbf7a71b9dfd36ea153c3e414426e559d631820c
progress:
  total_phases: 5
  completed_phases: 3
  total_plans: 21
  completed_plans: 16
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-10-09)

**Core value:** Portfolio visitor opens the menu, launches HOTLINE, and plays the full Witch Pots-style loop in Hotline Miami dress with backend-shaped JSON configs.
**Current focus:** Phase 4 — Three Bonuses + Combo Nights

## Current Position

Phase: 04 (Three Bonuses + Combo Nights) — READY TO EXECUTE
Plan: Not started
Status: Ready to execute
Last activity: 2026-10-11 — Phase 03 complete, transitioned to Phase 4

Progress: [██████░░░░] 60%

## Performance Metrics

**Velocity:**

- Total plans completed: 16
- Average duration: —
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 4 | - | - |
| 02 | 7 | - | - |
| 03 | 5 | - | - |

**Recent Trend:**

- Last 5 plans: —
- Trend: —

*Updated after each plan completion*
**Per-Plan Metrics:**

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 01 P01 | 7min | 2 tasks | 17 files |
| Phase 01 P02 | 8min | 2 tasks | 4 files |
| Phase 01 P03 | 15min | 2 tasks | 10 files |
| Phase 01 P04 | 15min | 2 tasks | 2 files |
| Phase 02 P01 | 10min | 2 tasks | 6 files |
| Phase 02 P02 | 10min | 2 tasks | 8 files |
| Phase 02 P03 | 10min | 2 tasks | 14 files |
| Phase 02 P04 | 20min | 2 tasks | 11 files |
| Phase 02 P05 | 10min | 2 tasks | 10 files |
| Phase 02 P06 | n/a | 2 tasks | 15 files |
| Phase 02 P07 | 12min | 2 tasks | 8 files |
| Phase 03 P01 | 30 min | 2 tasks | 4 files |
| Phase 03 P02 | 8min | 2 tasks | 13 files |
| Phase 03 P03 | 5min | 2 tasks | 8 files |
| Phase 03 P04 | 7min | 2 tasks | 9 files |
| Phase 03 P05 | 15min | 2 tasks | 5 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Coarse roadmap: 5 vertical MVP slices (shell → base → collectors → bonuses → gamble/polish)
- One long-lived Pixi Application owned by shell; Crash thin adapter only
- Per-game demo balances for v1; gamble = line wins only
- [Phase 01]: One shell Application; Crash session never destroys app or AudioPort
- [Phase 01]: Router epoch abort disposes late mounts; requestMenu only acts for current epoch
- [Phase 01]: Crash HUD keydown registered by name so dispose can remove it
- [Phase 01]: Mute lives under portfolio-demo:mute; legacy crash-demo:mute copied once when new key absent
- [Phase 01]: CFG-02 proven as identical crash history for same seed under fixed ticks, not pixel replay
- [Phase 01]: Menu Sound uses bindMuteButton on the shell AudioPort; CrashHud mute left as-is
- [Phase 01]: HOTLINE stays enabled:false with no mount; Coming soon chip only
- [Phase 01]: Icon error listener hides img so CSS fill remains
- [Phase 01]: Icons already in 01-01; walkthrough swap fixed binary contents only
- [Phase 01]: Phase 1 walkthrough signed off SHELL-01..04 and CFG-02 after icon swap
- [Phase 02]: 02-01: paytable values are multipliers of total bet, illustrative 40x5 payline table
- [Phase 02]: 02-02: line pays max of wild-only and substituted run, ties to substituted
- [Phase 02]: 02-04: reels animate a pre-settled spin, hud last win held until the last reel lands
- [Phase 02]: 02-05: win neon is hotline pink; hud last win count up is opt in; session holds win part of balance until reels land
- [Phase 02]: 02-06: hotline png pack is user supplied loose files, no atlas
- [Phase 03]: Diskette tokens are three loose 128x128 PNGs matching phone colors; no meter-fill pack (D-08)
- [Phase 03]: User places final diskette art; agent only lists and verifies PNG signatures (D-15)
- [Phase 03]: Collectors RNG uses seed:collectors suffix so strip grids stay stable under feature chance edits
- [Phase 03]: Meter increments book only at HotlineGame.spin settle; progressive display owned by 03-04
- [Phase 03]: One full CYCLE_MS pass per line then isDone; no wrap (Q1 RESOLVED)
- [Phase 03]: TokenFlight onLand passes CollectorSpawn for 03-04 progressive setMeters
- [Phase 03]: PhonesLayer meters stay procedural Graphics; DISKETTE_URLS required beside phones
- [Phase 03]: 03-04: progressive meter fills from pre-spin raw counts; stub 700ms beats; bet steppers locked while busy
- [Phase 03]: 03-05: collector beep Hz 700/840/560/480; keep beep AudioPort (D-16)
- [Phase 03]: 03-05: walkthrough approved for COLL-01 COLL-02 COLL-03

### Pending Todos

None yet.

### Blockers/Concerns

- Witch Pots numeric tables (trigger odds, pick grid, jackpot multipliers) lock during Phase 3–4 research
- Final art pack is user-supplied; presentation polish waits on asset handoff

## Deferred Items

| Category | Item | Status | Deferred At | Milestone |
|----------|------|--------|-------------|-----------|
| *(none)* | | | | |

## Session Continuity

Last session: 2026-10-10T22:02:48.967Z
Stopped at: Phase 4 context gathered
Resume file: D:\pixi\casino-pixi-portfolio\.planning\phases\04-three-bonuses-combo-nights\04-CONTEXT.md
