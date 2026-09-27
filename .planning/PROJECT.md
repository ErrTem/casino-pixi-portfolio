# Casino Crash Portfolio (PixiJS)

## What This Is

A browser-based demo Crash game (Aviator-like) built as a frontend portfolio piece for employers. Players place a demo bet, watch a rising multiplier with a hybrid curve + rocket visual, and cash out before the crash — or lose the stake. Client-side only: no real money, no accounts, no multiplayer.

## Core Value

A recruiter can open the demo, place a bet, watch the round play, cash out or crash, and see the demo balance update.

## Requirements

### Validated

- ✓ Playable Crash round loop: waiting → flying → cashed out / crashed — Phase 1 (GameLogic)
- ✓ Demo wallet with start balance, bet amount, win/loss settlement — Phase 1
- ✓ Auto cash-out at a target multiplier — Phase 1 (logic) + Phase 2 (HUD chrome)
- ✓ Seeded/demo RNG so rounds are testable and reproducible — Phase 1
- ✓ Clean architecture: pure TS GameLogic separate from Pixi view — Phase 1 (ARCH-02 gate)
- ✓ Vite shell + thin HTML overlay (bet, cash-out, balance, presets, auto CO, history) — Phase 2 (VIS-02)
- ✓ Bet amount presets (chips) fill-only + free-form input — Phase 2 (WALT-03)
- ✓ Round history strip from snapshot.history newest-first — Phase 2 (WALT-05)
- ✓ Empty reserved `#game-canvas-host` for Phase 3 Pixi mount (D-04)
- ✓ Live multiplier display with hybrid visual (rising curve + small rocket on path) — Phase 3 (VIS-01)
- ✓ Mobile-friendly canvas layout and touch-usable HTML controls — Phase 4 (ARCH-03)
- ✓ Waiting theater countdown (continuous tenths) — Phase 5 (PLSH-01)
- ✓ Oscillator SFX + mute preference — Phase 5 (PLSH-02)
- ✓ Boot `?seed=` + Seed chip reveal/copy — Phase 5 (PLSH-03)
- ✓ Soft session avg/max stats + Space/Enter cash-out — Phase 5 (PLSH-04 / PLSH-05)

### Active

- [ ] Ready to extend later with more casino games (shell optional later)

### Out of Scope

- Persistent DEMO / portfolio badge UI — declined by product owner (README/page title framing OK)
- Real-money gambling, payments, KYC — portfolio demo only
- User accounts / auth — not needed for v1 demo
- Live multiplayer / shared rounds — client-only single player
- Provably fair crypto / certified RNG — seeded demo RNG is enough
- Admin panel — no backend in v1
- Multi-game lobby / casino shell — single Crash page for v1; React/Angular deferred
- Slot / wheel / roulette — later milestones
- Copying assets/IP from commercial providers (e.g. Endorphina) — original or user-provided assets only

## Context

- Audience: hiring managers / recruiters evaluating frontend + PixiJS game skill
- Stack locked: PixiJS v8 + TypeScript + Vite
- UI approach: Pixi owns the game canvas; thin HTML/CSS bar for wallet and controls (no React/Angular in v1)
- Visual direction: hybrid — rising multiplier curve/graph with a small rocket sprite traveling the path; crash = visual break
- Assets: ask the user when textures/images/SFX are needed; placeholders OK for SFX
- Installed PixiJS skills available for rendering/animation guidance during implementation
- English for code and technical docs; keep GSD phases small and shippable
- Light research on PixiJS crash-game patterns expected before requirements/roadmap lock

## Constraints

- **Tech stack**: PixiJS v8 + TypeScript + Vite — locked for portfolio coherence
- **No SPA framework in v1**: HTML + Pixi only; React/Angular only if a multi-game shell is added later
- **Client-side only**: no backend required for v1
- **Legal/branding**: must be clearly labeled DEMO / portfolio; not real gambling
- **IP**: no commercial casino game assets or lookalike branding
- **Architecture**: GameLogic (pure TS) must stay separate from Pixi view for testability and future games
- **Phases**: keep small and shippable

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| PixiJS v8 + TS + Vite | Portfolio stack already chosen; Pixi skills available | ✓ Phase 2 — Vite 6.4.3 shell; Pixi deferred to Phase 3 |
| HTML controls + Pixi canvas (no React/Angular v1) | Fastest path to a playable single-game demo; shell deferred | ✓ Phase 2 — full HUD overlay; canvas host empty for Pixi |
| Hybrid visual (curve + rocket on path) | Polished Crash look without heavy art dependency | ✓ Phase 3 — Graphics climb trail + rocket on path |
| Seeded/demo RNG | Testable rounds without backend or certification | ✓ Phase 1 — seedrandom behind Rng; ARCH-01 |
| D-14 continuous auto-launch | Live Crash cadence + spectator rounds | ✓ Phase 1 — option-continuous locked |
| Single-authority resolveTick | Crash before auto before manual; idempotent settle | ✓ Phase 1 |
| v1 includes history, auto cash-out, bet presets | Table-stakes Crash UX for a credible portfolio demo | ✓ Phase 2 — HUD presets + history + auto CO chrome |
| Fixed HUD chrome + leftover canvas on ≤720px | Phone playability without bar stealing curve space | ✓ Phase 4 — 15.5rem budget; pointer-events isolation |
| Phase-promoted Cash out through cashed_out | Mid-flight / spectator finish touch target (D-08) | ✓ Phase 4 — chromeModeFrom(flying\|cashed_out) |
| v1 includes polish (countdown, SFX, seed, stats, keyboard) | Differentiator polish after core loop | ✓ Phase 5 — PLSH-01..05 shipped + UAT |
| No DEMO badge UI | Product owner preference; avoid badge chrome | ✓ Confirmed Phase 4–5 — no DEMO badge |
| Single game page only | Ship Crash first; lobby/multi-game later | — Pending (next milestone) |
| Vertical MVP phases | Playable slices: logic → HUD → Pixi → mobile → polish | ✓ Phase 5 complete — milestone MVP done |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-09-27 after Phase 5*
