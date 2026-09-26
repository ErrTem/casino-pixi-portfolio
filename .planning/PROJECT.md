# Casino Crash Portfolio (PixiJS)

## What This Is

A browser-based demo Crash game (Aviator-like) built as a frontend portfolio piece for employers. Players place a demo bet, watch a rising multiplier with a hybrid curve + rocket visual, and cash out before the crash — or lose the stake. Client-side only: no real money, no accounts, no multiplayer.

## Core Value

A recruiter can open the demo, place a bet, watch the round play, cash out or crash, and see the demo balance update — with clear DEMO / portfolio labeling.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Playable Crash round loop: waiting → flying → cashed out / crashed
- [ ] Demo wallet with start balance, bet amount, win/loss settlement
- [ ] Live multiplier display with hybrid visual (rising curve + small rocket on path)
- [ ] Thin HTML controls overlay: bet, cash out, balance, DEMO badge
- [ ] Round history strip (last N crash multipliers)
- [ ] Auto cash-out at a target multiplier
- [ ] Bet amount presets (chips) plus free amount input
- [ ] Seeded/demo RNG so rounds are testable and reproducible
- [ ] Mobile-friendly canvas layout
- [ ] Clean architecture: pure TS GameLogic separate from Pixi view
- [ ] Ready to extend later with more casino games (shell optional later)

### Out of Scope

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
| PixiJS v8 + TS + Vite | Portfolio stack already chosen; Pixi skills available | — Pending |
| HTML controls + Pixi canvas (no React/Angular v1) | Fastest path to a playable single-game demo; shell deferred | — Pending |
| Hybrid visual (curve + rocket on path) | Polished Crash look without heavy art dependency | — Pending |
| Seeded/demo RNG | Testable rounds without backend or certification | — Pending |
| v1 includes history, auto cash-out, bet presets | Table-stakes Crash UX for a credible portfolio demo | — Pending |
| Single game page only | Ship Crash first; lobby/multi-game later | — Pending |

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
*Last updated: 2026-09-26 after initialization*
