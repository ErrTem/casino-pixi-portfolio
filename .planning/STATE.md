---
gsd_state_version: "1.0"
current_phase: 06
current_phase_name: enhance and rework UI/buttons/behavior
status: verifying
stopped_at: Completed 06-04-PLAN.md
last_updated: "2026-09-29T16:15:04.539Z"
last_activity: 2026-09-29
last_activity_desc: Phase 06 execution started
state_head: 49a10fe47dd83b3605f244ee6f0ccadf6ff9656a
progress:
  total_phases: 6
  completed_phases: 6
  total_plans: 22
  completed_plans: 22
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-09-27 after Phase 4)

**Core value:** A recruiter can open the demo, place a bet, watch the round play, cash out or crash, and see the demo balance update.
**Current focus:** Phase 06 — enhance and rework UI/buttons/behavior

## Current Position

Phase: 06 (enhance and rework UI/buttons/behavior) — VERIFYING
Plan: 4 of 4
Status: Phase complete — ready for verification
Last activity: 2026-09-30 - Completed quick task 260930-h4h: Crash theater polish (parallax, tip trail/glow/camera, × pulse/gold)
Progress: [██████████] 100%

## Performance Metrics

**Velocity:**

- Total plans completed: 18
- Average duration: —
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 5 | - | - |
| 02 | 3 | - | - |
| 03 | 3 | - | - |
| 04 | 3 | - | - |
| 05 | 4 | - | - |
| 06 | 0/4 planned | - | - |

**Recent Trend:**

- Last 5 plans: —
- Trend: —

*Updated after each plan completion*
**Per-Plan Metrics:**

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 01-gamelogic-core P01 | 8 min | 2 tasks | 4 files |
| Phase 01-gamelogic-core P02 | 4 min | 1 tasks | 13 files |
| Phase 01-gamelogic-core P03 | 6 min | 2 tasks | 5 files |
| Phase 01 P04 | 4 min | 2 tasks | 2 files |
| Phase 01-gamelogic-core P05 | 5 min | 2 tasks | 3 files |
| Phase 02-vite-shell-html-hud P01 | 3 min | 2 tasks | 11 files |
| Phase 02 P02 | 2 min | 2 tasks | 5 files |
| Phase 02-vite-shell-html-hud P03 | 2 min | 2 tasks | 7 files |
| Phase 03 P01 | 5 | 2 tasks | 14 files |
| Phase 03-pixi-hybrid-view P02 | 5 min | 3 tasks | 10 files |
| Phase 03 P03 | 2 min | 2 tasks | 3 files |
| Phase 04-mobile-harden P01 | 1min | 1 tasks | 1 files |
| Phase 04-mobile-harden P02 | 2min | 3 tasks | 7 files |
| Phase 04 P03 | 5min | 2 tasks | 1 files |
| Phase 05 P01 | 4min | 2 tasks | 3 files |
| Phase 05 P02 | 7min | 3 tasks | 10 files |
| Phase 05 P03 | 4min | 2 tasks | 7 files |
| Phase 05 P04 | 3min | 2 tasks | 5 files |
| Phase 06 P01 | 7 min | 3 tasks | 11 files |
| Phase 06 P02 | 4 min | 3 tasks | 4 files |
| Phase 06 P03 | 2 min | 1 tasks | 3 files |
| Phase 06 P04 | 5 min | 3 tasks | 9 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- v1: HTML + Pixi only (no React/Angular); hybrid curve + rocket visual
- v1: No DEMO badge UI — portfolio framing via README/title only if needed
- Roadmap: Logic → HUD → Pixi → mobile → polish; WALT-03/WALT-05 mapped to Phase 2 (UI)
- Phase 1 D-01..D-15 locked in 01-CONTEXT.md (wallet, crash feel, 5s auto-launch, spectator)
- D-14 continuous auto-launch is one-way — checkpoint:decision in 01-01 before 01-02 tracer
- [Phase 01]: D-14 locked as option-continuous: waiting waitRemainingMs hits zero always calls startRound (spectator rounds allowed); PLAY-01 reinterpreted as timed waiting not idle-until-click — User confirmed checkpoint Task 2 with option-continuous before 01-02 tracer implements WAIT_MS expiry startRound; one-way door per CONTEXT
- [Phase 01]: placeBet accepts display units (e.g. 100 to 10000 cents); snapshot balance/bet expose display — Plan allowed display or cents; display matches HUD-facing API and walking skeleton placeBet(100)
- [Phase 01]: CrashGame.tick sub-steps at maxDeltaMs so large deltas advance waiting/flight correctly — resolveTick clamps each step to maxDeltaMs; without facade sub-stepping tick(5000) would only consume 100ms of waiting
- [Phase 01]: History always records round crashAt (including cash-out and spectator) — D-15 and plan require push crashAt to History on terminal settle for every completed round
- [Phase 01]: Hard-stop returns reason broke before insufficient_balance when balance < min bet — D-03 HUD needs a stable broke code distinct from insufficient_balance
- [Phase 01]: Non-finite placeBet amounts rejected at CrashGame boundary (ASVS V5) — Command-boundary validation before displayToCents keeps wallet integer cents
- [Phase 01]: History ring drops non-finite crashAt to protect spectator history consumers — D-15 history must stay usable for HUD strip
- [Phase 01]: Settlement compares use roundedMult on live m, crashAt, and autoCashOutAt (D-11) — Float edges like crashAt 2.004 at m=2.00 must settle; PITFALLS + plan ACs require hundredths compares
- [Phase 01]: setAutoCashOut stores rounded 2dp targets on state — Snapshot and resolveTick share hundredths precision for WALT-04
- [Phase 01]: ARCH-02 enforced via fs read + import/DOM regex deny-list, not browser execution — Phase 1 quality gate must fail closed before Vite/Pixi land in Phase 2
- [Phase 01]: package.json must not list pixi.js or vite in Phase 1 (Phase 2 adds them) — Supply-chain boundary for ARCH-02 until shell phase
- [Phase 02]: D-04 locked option-empty-slot: empty reserved #game-canvas-host (quiet Game view label only); no HTML theater/monetary controls in host — User confirmed checkpoint Task 1 with option-empty-slot; one-way door per CONTEXT for Phase 3 Pixi mount
- [Phase 02]: Phase 2 installs vite@6.4.3 only; pixi.js deferred to Phase 3 — Plan/RESEARCH pin mature Vite 6.x for shell; Application/spectacle remain Phase 3
- [Phase 02]: Enablement drives from waiting|flying only; terminal phases not durable chrome — RESEARCH A2: settle returns via enterWaiting; enablement matrix is waiting|flying + bet/balance
- [Phase 02]: canEditAuto always true; auto CO syncs from snapshot when input not focused — setAutoCashOut persists across rounds per Phase 1 enterWaiting; avoid clobbering while typing
- [Phase 02]: Broke UX emphasizes Reset demo; never auto-calls resetWallet — Phase 1 D-03/D-04: explicit user Reset only; HUD must not auto-refill
- [Phase 02]: PRESET_CHIPS omit 1000; free-form still allows max via facade — Reduce all-in mis-taps; placeBet still accepts up to 1000
- [Phase 02]: Chip click fills input only — Place bet sole placeBet path — Pitfall 4 double-place; WALT-03 fill-only contract
- [Phase 02]: History from snapshot.history only; createElement + textContent (no innerHTML) — WALT-05 single source; XSS mitigate T-02-10
- [Phase 03]: Task 1 human-approved pixi.js@8.21.0 from github.com/pixijs/pixijs before install — T-03-SC supply-chain gate; registry identity matched RESEARCH pin
- [Phase 03]: D-01 two-stroke halo/core Graphics without pixi-filters; D-03 log2-x linear-y plot; cashOutAt null until 03-02 — Plan 03-01 view contract for climb trail and sever; durable cashOutAt is Wave 2
- [Phase 03]: D-16 durable cashed_out: credit once, climb until crashAt, history on crash only — CONTEXT one-way lock; settleOnce enterWaiting wiped the flight before snapshots could feed the theater dual-read
- [Phase 03]: Streak dots live in rocket local -X so parent tangent rotation carries them — Keeps pathTangentRadians on parent only; streak does not need world-space offsets
- [Phase 03]: Flash is alpha on full-canvas Graphics; stage.x/stage.y never written — D-10 and T-03-09: flash must not move HUD hit targets
- [Phase 03]: Backdrop rebuilds only on screen size change via rebuildIfNeeded — Avoid clear() retessellation every sync frame per RESEARCH Pattern 4
- [Phase 04]: 15.5rem fixed bar height inside max-width 720px only (D-02/D-04); desktop stays content-sized — Same rem budget in portrait and landscape when width is <=720px; desktop three-column may stay auto-height
- [Phase 04]: touch-action pan-x on .history-strip so horizontal swipe coexists with bar vertical scroll — Plan discretionary; display-only history stays; no tap handlers
- [Phase 04]: Promote chrome from snapshot.phase (flying|cashed_out), never from canCashOut (D-08) — Disabled Cash out stays full-width through spectator finish
- [Phase 04]: dispose() returned from mountCrashView removes resize listeners before HMR app.destroy — Prefer mount-owned cleanup over main-only listeners
- [Phase 04]: Waiting defaults min-height 2.75rem; promoted Cash out 2.875rem full-width; de-emphasized controls stay visible at 2rem — D-05–D-07 tap contract
- [Phase 04]: Human approved ARCH-03 mobile QA gate green without --hud-bar-height tweak — blocking-human checkpoint resume signal approved; DevTools/device matrix recorded in 04-03-QA-CHECKLIST.md
- [Phase 05]: Countdown gated on phase===waiting && mode===idle (RESEARCH A1) — Avoids tenths flashing over red crash × during hold/fade while logic already returned to waiting
- [Phase 05]: Reuse existing TheaterText live BitmapText for countdown — D-01/D-04; no third text node; BitmapText for per-frame tenths
- [Phase 05]: Web Audio oscillators behind AudioPort — no Howler in Phase 5 — D-08 synthetic beeps; RESEARCH A2; keep port for future file adapter
- [Phase 05]: SFX edges in main ticker; bet_lock from HUD placeBet ok only — Composition-root edge detect keeps GameLogic pure; RESEARCH Pattern 2
- [Phase 05]: Mute preference key crash-demo:mute only (1|0) — T-5-02 — never persist wallet or seed under mute key
- [Phase 05]: Seed retained at composition root for chip (not CrashSnapshot) — RESEARCH A4 — avoid logic surface; composition root passes seed into mountCrashHud
- [Phase 05]: Invalid ?seed= quiet using default note on Seed chip — RESEARCH Q4 discretion — silent fallback plus brief expanded-chip note
- [Phase 05]: Avg divides by finite count after skipping non-finite — Matches skip-non-finite contract; RESEARCH history.length would skew mixed arrays
- [Phase 05]: Keyboard cash-out gates on enablementFrom.canCashOut — Same path as Cash out button; ignore spectator/no-bet (RESEARCH Q3 / D-15)
- Phase 6 D-01..D-24 locked in 06-CONTEXT.md (100dvh shell, dual-line primary, Auto bet one-way, climb retune, arcade camera, Seed chip removal)
- Phase 6 planned: 06-01 tracer shell/primary → 06-02 Auto bet (checkpoint D-10) ∥ 06-03 growthRate → 06-04 camera + PLSH-03Δ
- [Phase 06]: D-10 confirmed option-auto-bet-on-waiting — Auto bet places at each waiting start (D-10..D-13) — Human checkpoint Select: option-auto-bet-on-waiting; one-way product door before waiting-edge placeBet wiring
- [Phase 06]: Composition-root single Auto bet placeBet site; HUD owns flag + getStake + stopAutoBet — RESEARCH Pattern 3 preference; mirrors sfxEdges; avoids double placeBet from HUD render
- [Phase 06]: growthRatePerMs = Math.LN2 / 3750 mid-band of D-14 3.5-4s (RESEARCH Q1) — FEEL-01 single-knob climb retune; QA may nudge 3500-4000 without reopening D-14
- [Phase 06]: D-15: houseEdge/crashFloor/crashCap/CrashRng untouched — only growth rate — Crash distribution unchanged; only climb pace retuned
- [Phase 06]: Arcade camera via world Container only (never stage.x/y); freeze on crash — D-17/D-19 FEEL-02 Pattern 5
- [Phase 06]: Soft path blend 0.55 + headroom 1.1; gentle tilt clamp ±15° — D-16/D-18 RESEARCH discretionary
- [Phase 06]: Seed chip removed; silent ?seed= boot only (PLSH-03Δ) — D-21..D-24

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260930-h4h | Crash theater polish: parallax + speed lines; tip-follow neon trail; × pulse/gold after 10× | 2026-09-30 | 72d4d4a | [260930-h4h-crash-theater-polish-1-parallax-star-dus](./quick/260930-h4h-crash-theater-polish-1-parallax-star-dus/) |

### Roadmap Evolution

- Phase 6 added: enhance and rework UI/buttons/behavior
- Phase 6 planned: UI-01/02/03, WALT-03Δ/04Δ, FEEL-01/02, PLSH-03Δ, VIS-01Δ; Auto-bet promoted from v2

## Deferred Items

| Category | Item | Status | Deferred At | Milestone |
|----------|------|--------|-------------|-----------|
| *(none)* | | | | |

## Session Continuity

Last session: 2026-09-29T16:15:03.047Z
Stopped at: Completed 06-04-PLAN.md
Resume file: None
Next: `/gsd-execute-phase 6` (D-10 checkpoint in 06-02 before Auto bet wire)
