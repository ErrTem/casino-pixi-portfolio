# Research Summary — Crash Pixi Portfolio

**Researched:** 2026-09-26  
**Domain:** Browser crash-game demo (Aviator-like) as a PixiJS v8 portfolio piece  
**Confidence:** HIGH for architecture separation and crash-round math; MEDIUM for exact visual polish without reference textures

## Executive Take

Real crash products are **server-authoritative**: crash point is fixed before the fly animation, streamed over WebSockets, with provably-fair seed commit/reveal. This portfolio demo **deliberately inverts** that — pure client `GameLogic` owns seeded outcomes so rounds are reproducible in tests and demos, with no backend for v1.

PixiJS v8 is a strong fit: `Application` + `Ticker` for the fly loop, `Graphics` for a multiplier curve (no commercial assets), `Text` for live multiplier / DEMO labeling. Keep **all money and round rules out of Pixi**; the view only observes logic and renders.

## Key Findings

1. **Crash point is decided up front** — animation is presentation of a predetermined `crashPoint`, not a live RNG tick. Cash-out success = player action time < crash time.
2. **House-edge distribution is standard math** — map uniform `h ∈ [0,1)` to crash via something like `(1 - edge) / (1 - h)`, clamp at `1.00x` for the edge mass. Demo RTP ~97% (3% edge) is fine and familiar; label it as demo math, not certified RNG.
3. **Seeded PRNG > `Math.random()`** — mulberry32 / xorshift + explicit seed string enables “replay this round” for QA and portfolio demos.
4. **Pixi view = thin adapter** — `app.ticker` advances logic with `deltaMS`; Graphics redraws path from logic’s multiplier history; DOM or Pixi UI for bet/cash-out.
5. **No textures required for v1** — graph + big number + DEMO badge is the simplest polished look. Ask the user before adding plane/rocket sprites.

## Implications for Roadmap

| Finding | Roadmap impact |
|---------|----------------|
| Logic must be pure TS | Early phase: `GameLogic` + unit tests before Pixi polish |
| Crash decided at round start | Round model: `waiting → flying → crashed \| cashed_out` with precomputed `crashPoint` |
| Graphics-only visual | Phase for curve + number; defer sprite assets |
| Mobile canvas | Explicit resize/`resolution` phase or bake into scaffold |
| Extend later to more games | Shared `Wallet` + `Game` interface in architecture from day one |

## Risks

| Risk | Mitigation |
|------|------------|
| Looking like real gambling | Persistent DEMO / portfolio labeling; no payment UI; fake currency name (e.g. “credits”) |
| IP / asset copying | Original Graphics/Text only; user supplies any textures |
| Coupling Pixi into logic | Lint/convention: `src/game/**` must not import `pixi.js` |
| Non-deterministic demos | Seeded RNG + optional seed display in UI for v1 or soon after |

## Open Questions (non-blocking)

- Exact starting balance / bet presets (defaults: 1000 credits, bets 10/25/50/100).
- Whether HTML overlay UI (buttons) vs full-Pixi UI — recommend **HTML overlay for controls**, Pixi for game surface (faster to ship, better a11y).
- User said: **ask before needing textures** — v1 ships without; plane/rocket is a later optional milestone.

## Sources

- PixiJS v8 Architecture, Ticker, Graphics docs
- Public crash/Aviator architecture writeups (commit-reveal, WebSocket multiplier stream) — inverted for this demo
- Crash point formula references (house-edge mapping from hash/uniform)

---
*Research completed: 2026-09-26*
