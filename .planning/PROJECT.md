# Crash Pixi Portfolio

## What This Is

A browser-based **demo Crash game** (Aviator-like) built as a frontend portfolio piece. Visitors place a demo bet, watch a rising multiplier, cash out or crash, and see a demo balance update — all client-side, with no real money, accounts, or backend required for v1.

## Core Value

A recruiter can run `npm run dev`, place a bet, watch the multiplier rise, cash out or lose, and see the demo wallet update — in a clean PixiJS + TypeScript architecture.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate)

### Active

- [ ] Vite + TypeScript + PixiJS v8 app boots with a single game page
- [ ] Pure `GameLogic` (seeded/demo RNG, round state machine, wallet settle) separate from Pixi view
- [ ] Demo wallet: start balance, place bet, win/loss updates balance
- [ ] Round loop: waiting → flying → crashed / cashed out
- [ ] Live multiplier display + simple polished visual (graph+number preferred over complex plane art)
- [ ] Cash out before crash pays `bet × multiplier`; crash without cash out loses bet
- [ ] Mobile-friendly canvas
- [ ] Clear "DEMO / portfolio" labeling (not real gambling)
- [ ] Basic SFX placeholders
- [ ] Architecture ready to extend with more casino game demos later

### Out of Scope

- Real money, payments, KYC, accounts — portfolio demo only
- Live multiplayer / WebSocket server — v1 is single-player client-side
- Provably fair crypto / RNG certification — seeded demo RNG for testability instead
- Admin panel, lobby, multi-game shell — single Crash page for v1
- Slot / wheel / roulette — possible later milestones
- Copying assets/IP from commercial providers (e.g. Endorphina) — original or placeholder visuals only

## Context

- Greenfield repo (`crash-pixi-portfolio`); only a stub README today
- Stack is **locked**: PixiJS v8 + TypeScript + Vite
- Domain patterns (real products): server-authoritative crash + commit-reveal RNG; **this demo deliberately inverts that** — FE owns round outcomes via seeded RNG so rounds are reproducible for demos/tests
- Visual preference: **simplest polished look** — graph + big multiplier number over complex plane/rocket sprites unless custom textures are supplied
- User will provide textures/images if needed — ask before inventing asset pipelines
- Technical names and docs in English; keep GSD phases small and shippable
- Light research on PixiJS crash-game patterns before requirements/roadmap

## Constraints

- **Tech stack**: PixiJS v8 + TypeScript + Vite — locked for portfolio narrative
- **No backend for v1**: all game logic and demo wallet on the client
- **Legal/positioning**: must not look like real-money gambling; DEMO labeling required
- **IP**: no commercial casino game assets or trademarks
- **Architecture**: `GameLogic` (pure TS) must not import Pixi; view observes/subscribes to logic
- **Phases**: small, shippable increments (fine granularity)
- **Assets**: do not invent production textures without asking the user

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| PixiJS v8 + TS + Vite | Locked stack for portfolio signal | Adopted |
| Client-side seeded RNG | Testable/demoable without backend; not "provably fair" | Adopted |
| Graph + multiplier visual first | Simplest polished look; plane/rocket optional if textures provided | Adopted — v1 Graphics-only |
| GameLogic separate from Pixi view | Clean architecture; unit-testable; extendable to more games | Adopted |
| Single game page (no lobby) | Ship Crash demo first | Adopted |
| Fine 5-phase roadmap | Each phase ships an observable slice toward playable round | Adopted — see ROADMAP.md |
| Ask user for textures | Avoid placeholder IP risk and wasted asset work | Adopted — no textures needed for v1 |
| HTML overlay controls + Pixi playfield | Faster ship; better mobile inputs; clear DEMO labeling | Adopted in research |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-09-26 after initialization*
