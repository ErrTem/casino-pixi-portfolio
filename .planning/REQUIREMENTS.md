# Requirements — Crash Pixi Portfolio

**Defined:** 2026-09-26  
**Core value:** Recruiter runs `npm run dev`, places a demo bet, watches multiplier rise, cashes out or crashes, sees balance update — in clean PixiJS + TypeScript architecture.

## v1 Requirements

Requirements are the contract for the first shippable milestone. Each maps to exactly one roadmap phase.

### Scaffold & shell

- [ ] **BOOT-01**: Vite + TypeScript + PixiJS v8 app starts via `npm run dev` and shows a single game page
- [ ] **BOOT-02**: Persistent visible “DEMO / portfolio — no real money” labeling on the page
- [ ] **BOOT-03**: Canvas mounts responsively (usable on a typical mobile viewport width)

### Game logic (pure TS)

- [ ] **LOGIC-01**: `GameLogic` module has zero imports from `pixi.js`
- [ ] **LOGIC-02**: Seeded demo RNG produces a crash point at round start (reproducible given seed)
- [ ] **LOGIC-03**: Round state machine supports `waiting → flying → crashed | cashed_out` (and return to `waiting`)
- [ ] **LOGIC-04**: While flying, multiplier rises over time from `1.00` until crash point
- [ ] **LOGIC-05**: Unit tests cover RNG mapping, cash-out win, crash loss, and invalid actions by phase

### Demo wallet & betting

- [ ] **WALLET-01**: Demo wallet starts with a configurable positive credit balance
- [ ] **WALLET-02**: Placing a bet deducts bet amount from balance (reject if insufficient or not waiting)
- [ ] **WALLET-03**: Cash-out credits `bet × multiplier` (display/settle with stable 2-decimal credits)
- [ ] **WALLET-04**: Crash without cash-out leaves the bet lost (no credit back)

### Playable view

- [ ] **VIEW-01**: Live multiplier displayed prominently during flying / end states
- [ ] **VIEW-02**: Simple polished visual: rising graph/curve + number (no commercial assets)
- [ ] **VIEW-03**: Place Bet control available in `waiting`; Cash Out available in `flying`
- [ ] **VIEW-04**: View/UI observes logic snapshots; does not own money rules

### Polish & extensibility

- [ ] **SFX-01**: SFX placeholder module with hooks for bet / fly / cash-out / crash (silent or stub OK)
- [ ] **ARCH-01**: Folder layout separates `game` / `view` / `ui` (and optional `audio`) for future casino demos

## Out of Scope (v1)

| Item | Reason |
|------|--------|
| Real money, payments, accounts | Portfolio demo only |
| Live multiplayer / WebSockets | Client-only v1 |
| Provably fair crypto / certification | Seeded demo RNG instead |
| Lobby / multi-game shell | Single Crash page first |
| Slot / wheel / roulette | Later milestones |
| Plane/rocket textures | Ask user before adding; Graphics-first |
| Auto-bet / auto-cashout | Defer |
| Copying commercial IP/assets | Legal/portfolio integrity |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BOOT-01 | Phase 1 | Pending |
| BOOT-02 | Phase 1 | Pending |
| BOOT-03 | Phase 1 | Pending |
| LOGIC-01 | Phase 2 | Pending |
| LOGIC-02 | Phase 2 | Pending |
| LOGIC-03 | Phase 2 | Pending |
| LOGIC-04 | Phase 2 | Pending |
| LOGIC-05 | Phase 2 | Pending |
| WALLET-01 | Phase 3 | Pending |
| WALLET-02 | Phase 3 | Pending |
| WALLET-03 | Phase 3 | Pending |
| WALLET-04 | Phase 3 | Pending |
| VIEW-01 | Phase 4 | Pending |
| VIEW-03 | Phase 4 | Pending |
| VIEW-04 | Phase 4 | Pending |
| VIEW-02 | Phase 5 | Pending |
| SFX-01 | Phase 5 | Pending |
| ARCH-01 | Phase 5 | Pending |

## Definition of Done (v1)

1. `npm run dev` → playable bet → fly → cash out or crash → balance updates
2. `npm test` (or equivalent) passes GameLogic unit tests
3. DEMO labeling visible without hunting
4. No `pixi.js` import under `src/game/`
5. No real-money or commercial-IP assets

---
*Requirements defined: 2026-09-26*
