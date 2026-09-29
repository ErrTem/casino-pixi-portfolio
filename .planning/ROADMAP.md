# Roadmap: Casino Crash Portfolio (PixiJS)

## Overview

Ship a recruiter-ready Crash demo in six vertical slices: pure GameLogic (FSM, wallet, seeded RNG, settlement) first, then a headless-playable HTML HUD, then the hybrid Pixi curve/rocket view, mobile hardening, polish (countdown, SFX, seed replay, session stats, keyboard cash-out), and a final UI/feel rework (compact JetX-like chrome, dual-line BET/CASH OUT, Auto bet, milder climb, arcade camera). Every phase ends with something demoable — without React/Angular or a DEMO badge UI.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: GameLogic Core** - Pure TS round FSM, wallet, seeded RNG, settlement, auto cash-out, Vitest (completed 2026-09-26)
- [x] **Phase 2: Vite Shell + HTML HUD** - Composition root + thin overlay controls wired to GameLogic (completed 2026-09-26)
- [x] **Phase 3: Pixi Hybrid View** - Rising curve + rocket on path + crash break from snapshots (completed 2026-09-27)
- [x] **Phase 4: Mobile Harden** - Responsive canvas and touch-usable HTML controls (completed 2026-09-27)
- [x] **Phase 5: Polish** - Countdown, SFX/mute, seed replay, session stats, keyboard cash-out (completed 2026-09-27)
- [ ] **Phase 6: enhance and rework UI/buttons/behavior** - Compact JetX-like chrome, Auto bet, climb feel, arcade camera before milestone close

## Phase Details

### Phase 1: GameLogic Core

**Goal:** As a GameLogic caller, I want to place a demo bet, advance a continuous round through flight and cash-out or crash, and see the wallet settle, so that the authoritative Crash loop is proven before any Pixi UI.
**Mode:** mvp
**Depends on:** Nothing (first phase)
**Requirements:** PLAY-01, PLAY-02, PLAY-03, PLAY-04, PLAY-05, WALT-01, WALT-02, WALT-04, ARCH-01, ARCH-02, ARCH-04
**Success Criteria** (what must be TRUE):

  1. Caller can place a valid bet from waiting and start a flying round that advances a live multiplier from elapsed time
  2. Caller can cash out mid-flight and receive stake × multiplier, or the round crashes at the seeded crash point when not cashed out
  3. After cashed-out or crashed, the round returns to waiting and the demo wallet balance reflects win or loss
  4. Same seed always yields the same crash point; auto cash-out settles in `resolveTick` when the target is reached
  5. Vitest covers settlement, auto cash-out, and wallet rules with no `pixi.js` imports in GameLogic

**Plans:** 5/5 plans complete

Plans:
**Wave 1**

- [x] 01-01-PLAN.md — Wave 0 scaffold (package/tsconfig/vitest) + D-14 checkpoint

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-02-PLAN.md — Walking Skeleton tracer (createGame → bet→fly→settle)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 01-03-PLAN.md — Wallet bounds / hard-stop / resetWallet + spectator cadence

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 01-04-PLAN.md — resolveTick manual CO, crash, auto CO (crash-before-auto)

**Wave 5** *(blocked on Wave 4 completion)*

- [x] 01-05-PLAN.md — ARCH-02 no-Pixi gate + multiplier curve + full Vitest suite

### Phase 2: Vite Shell + HTML HUD

**Goal:** Vite app shell with a thin HTML overlay so a recruiter can play the full bet → fly → cash-out/crash → balance loop using numbers before art.
**Mode:** mvp
**Depends on:** Phase 1
**Requirements:** VIS-02, WALT-03, WALT-05
**UI hint**: yes
**Success Criteria** (what must be TRUE):

  1. Player can enter a free-form bet or tap preset chips, see balance, and start/cash out via HTML controls
  2. Player can set an auto cash-out target in the overlay and see it applied when flying
  3. History strip shows the last N crash multipliers after rounds complete
  4. Pixi does not own monetary controls — HTML overlay drives GameLogic commands; canvas region is reserved

**Plans:** 3/3 plans complete

Plans:

**Wave 1**

- [x] 02-01-PLAN.md — D-04 empty-slot checkpoint + Vite tracer (createGame ↔ HUD ↔ rAF)

**Wave 2** *(blocked on Wave 1)*

- [x] 02-02-PLAN.md — Enablement matrix, auto CO, Reset demo, phase-aware controls

**Wave 3** *(blocked on Wave 2)*

- [x] 02-03-PLAN.md — Preset chips (WALT-03) + history strip (WALT-05)

### Phase 3: Pixi Hybrid View

**Goal:** PixiJS v8 hybrid spectacle — rising curve/graph with a small rocket on the path and a clear crash break — driven only by GameLogic snapshots.
**Mode:** mvp
**Depends on:** Phase 2
**Requirements:** VIS-01
**UI hint**: yes
**Success Criteria** (what must be TRUE):

  1. While flying, player sees a rising curve with a rocket traveling the path synced to the live multiplier
  2. On crash, player sees a clear visual break (path/rocket interrupt) matching the logic crash event
  3. Ticker feeds `GameLogic.update(deltaMS)` only; outcome never driven by sprite position

**Plans:** 3/3 plans complete

Plans:

**Wave 1**

- [x] 03-01-PLAN.md — Legitimacy checkpoint, then ticker + neon trail + rocket + crash sever

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 03-02-PLAN.md — Durable cashed_out spectator finish + theater dual ×

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 03-03-PLAN.md — Rocket texture seam, backdrop, flash, idle bob

### Phase 4: Mobile Harden

**Goal:** Playable on phones — responsive canvas layout and touch-usable HTML controls without overlay hit conflicts.
**Mode:** mvp
**Depends on:** Phase 3
**Requirements:** ARCH-03
**UI hint**: yes
**Success Criteria** (what must be TRUE):

  1. On a phone-sized viewport, canvas fills the game region without clipping critical HUD controls
  2. Player can place bet, cash out, and use presets/auto CO with touch (adequate tap targets)
  3. Canvas does not steal taps from monetary controls (stacking / pointer-events correct)

**Plans:** 3/3 plans complete

Plans:

- [x] 04-01-PLAN.md
- [x] 04-02-PLAN.md
- [x] 04-03-PLAN.md

**Wave 1**

- [x] 04-01: Responsive layout CSS — canvas + overlay stacking for narrow viewports

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 04-02: Touch-sized controls, safe areas, DPR-capped resize hardening

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 04-03: Mobile QA pass — overlay hit conflicts, history strip readability

### Phase 5: Polish

**Goal:** Shareable polish — waiting countdown, SFX placeholders + mute, seed URL/display, soft session stats, desktop keyboard cash-out.
**Mode:** mvp
**Depends on:** Phase 4
**Requirements:** PLSH-01, PLSH-02, PLSH-03, PLSH-04, PLSH-05
**UI hint**: yes
**Success Criteria** (what must be TRUE):

  1. Player sees a waiting-phase countdown before the next flight starts
  2. Key events play SFX placeholders with a working mute toggle
  3. Player can reproduce a round via `?seed=` and/or read the active seed on screen
  4. Soft session stats (e.g. average / max crash) appear from history; desktop keyboard shortcut cashes out mid-flight

**Plans:** 4/4 plans complete

Plans:

- [x] 05-01-PLAN.md
- [x] 05-02-PLAN.md
- [x] 05-03-PLAN.md
- [x] 05-04-PLAN.md

**Wave 1**

- [x] 05-01: Waiting-phase countdown UX wired to round timing

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 05-02: AudioPort + SFX placeholders + mute toggle

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 05-03: `?seed=` parse + on-screen seed display for round replay

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 05-04: Session stats from history + desktop keyboard cash-out shortcut

### Phase 6: enhance and rework UI/buttons/behavior

**Goal:** As a recruiter on phone or desktop, I want a compact JetX-like Crash chrome with a dual-line BET/CASH OUT, Auto bet, a milder climb, and a centered craft over a scrolling graph — so the demo feels finished before milestone close without dual-bet or lobby scope.
**Mode:** standard
**Depends on:** Phase 5
**Requirements:** UI-01, UI-02, UI-03, WALT-03Δ, WALT-04Δ, FEEL-01, FEEL-02, PLSH-03Δ, VIS-01Δ
**UI hint:** yes
**Success Criteria** (what must be TRUE):

  1. Viewport is 100dvh with no page scroll; layout matches D-01 zones on phone/tablet/desktop
  2. Primary control cycles BET+stake → CASH OUT+live win → CASHED OUT frozen → BET on next wait (D-06–D-09)
  3. Auto bet ON auto-places at waiting start; stops and emphasizes Reset when broke (D-10–D-12)
  4. Authoritative ~2× lands in 3.5–4s band; crash distribution unchanged (D-14/D-15)
  5. Craft stays near center with scrolling trail + gentle tilt; crash FX unchanged (D-17–D-19)
  6. Seed chip gone; `?seed=` still boots quietly (D-21–D-24); Phase 5 polish (countdown, mute, stats, keyboard) still works

**Plans:** 3/4 plans executed

Plans:

**Wave 1**

- [x] 06-01-PLAN.md — Tracer: 100dvh shell + dual-line primary + presets/Auto CO chrome (D-01..D-09)

**Wave 2** *(blocked on Wave 1; 06-02 and 06-03 parallel)*

- [x] 06-02-PLAN.md — Auto bet toggle + waiting-edge place + broke stop (D-10 checkpoint + D-11..D-13)
- [x] 06-03-PLAN.md — Climb slowdown `growthRatePerMs = LN2/3750` (D-14/D-15)

**Wave 3** *(blocked on Wave 2)*

- [ ] 06-04-PLAN.md — Arcade camera + soft path + gentle tilt; Seed chip removal + PLSH-03Δ docs (D-16..D-24)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. GameLogic Core | 5/5 | Complete    | 2026-09-26 |
| 2. Vite Shell + HTML HUD | 3/3 | Complete    | 2026-09-26 |
| 3. Pixi Hybrid View | 3/3 | Complete    | 2026-09-27 |
| 4. Mobile Harden | 3/3 | Complete    | 2026-09-27 |
| 5. Polish | 4/4 | Complete    | 2026-09-27 |
| 6. enhance and rework UI/buttons/behavior | 3/4 | In Progress|  |
