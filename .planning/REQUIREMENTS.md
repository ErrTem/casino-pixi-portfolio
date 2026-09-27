# Requirements: Casino Crash Portfolio (PixiJS)

**Defined:** 2026-09-26
**Core Value:** A recruiter can open the demo, place a bet, watch the round play, cash out or crash, and see the demo balance update.

## v1 Requirements

### Core Play

- [x] **PLAY-01**: Player can start a round from waiting phase after placing a valid bet
- [x] **PLAY-02**: Player sees a live rising multiplier while the round is flying
- [x] **PLAY-03**: Player can manually cash out mid-flight and receive stake × current multiplier
- [x] **PLAY-04**: Round ends in a crash when the seeded crash point is reached if the player has not cashed out
- [x] **PLAY-05**: Round returns to waiting after cashed-out or crashed so another bet can be placed

### Wallet & Betting

- [x] **WALT-01**: Player has a demo wallet with a starting balance that updates on win and loss
- [x] **WALT-02**: Player can enter a free-form bet amount within min/max rules against current balance
- [x] **WALT-03**: Player can select bet amount via preset chips in addition to free-form input
- [x] **WALT-04**: Player can set an auto cash-out target multiplier that settles automatically when reached
- [x] **WALT-05**: Player can see a history strip of the last N crash multipliers

### Visual & Controls

- [x] **VIS-01**: Player sees a hybrid visual: rising curve/graph with a small rocket traveling the path, and a clear crash break
- [x] **VIS-02**: Player uses a thin HTML overlay for bet, cash-out, balance, presets, auto cash-out, and history (Pixi owns the canvas)

### Architecture & Quality

- [x] **ARCH-01**: Rounds use seeded/demo RNG so the same seed produces a reproducible crash point
- [x] **ARCH-02**: Game rules (round FSM, wallet, RNG, settlement, auto cash-out) live in pure TypeScript GameLogic with no Pixi imports
- [x] **ARCH-03**: Layout works on mobile: responsive canvas and touch-usable HTML controls
- [x] **ARCH-04**: GameLogic settlement, auto cash-out, and wallet rules are covered by Vitest unit tests

### Polish

- [ ] **PLSH-01**: Player sees a waiting-phase countdown before the next flight
- [ ] **PLSH-02**: Game plays SFX placeholders for key events with a mute toggle
- [ ] **PLSH-03**: Player can reproduce a round via `?seed=` URL and/or an on-screen seed display
- [ ] **PLSH-04**: Player can see soft session stats derived from history (e.g. average / max crash)
- [ ] **PLSH-05**: Player can cash out via a keyboard shortcut on desktop

## v2 Requirements

Deferred after a playable, polished single-game Crash demo.

### Product surface

- Dual simultaneous bets
- Auto-bet / consecutive-round automation
- Multi-game lobby / React|Angular casino shell
- Additional games (slot, wheel, roulette)
- Persistent balance across visits (localStorage or accounts)

### Polish extras

- Stronger crash VFX (particles, screen-shake via optional GSAP)
- Reduced-motion / accessibility mode
- Fake cosmetic “other players” feed (non-authoritative)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Persistent DEMO / portfolio badge UI | Explicitly declined by product owner; portfolio framing stays in README/page title only if needed |
| Real-money gambling / payments / KYC | Portfolio demo only; legal risk |
| User accounts / auth | No backend in v1; not needed for recruiter demo |
| Live multiplayer / shared rounds / chat | Requires servers; hides FE craft |
| Provably fair crypto / certified RNG | Seeded demo RNG is enough; certification is theater client-side |
| Admin panel / RTP operator UI | No backend; not a portfolio signal |
| Copying commercial Crash assets/IP (e.g. Endorphina, Aviator branding) | IP risk; original or user-provided assets only |
| React or Angular app shell in v1 | Locked to HTML + Pixi for speed |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PLAY-01 | 1 | Complete |
| PLAY-02 | 1 | Complete |
| PLAY-03 | 1 | Complete |
| PLAY-04 | 1 | Complete |
| PLAY-05 | 1 | Complete |
| WALT-01 | 1 | Complete |
| WALT-02 | 1 | Complete |
| WALT-03 | 2 | Complete |
| WALT-04 | 1 | Complete |
| WALT-05 | 2 | Complete |
| VIS-01 | 3 | Complete |
| VIS-02 | 2 | Complete |
| ARCH-01 | 1 | Complete |
| ARCH-02 | 1 | Complete |
| ARCH-03 | 4 | Complete |
| ARCH-04 | 1 | Complete |
| PLSH-01 | 5 | Pending |
| PLSH-02 | 5 | Pending |
| PLSH-03 | 5 | Pending |
| PLSH-04 | 5 | Pending |
| PLSH-05 | 5 | Pending |

**Coverage:**

- v1 requirements: 21 total
- Mapped to phases: 21
- Unmapped: 0

---
*Requirements defined: 2026-09-26*
*Last updated: 2026-09-26 after roadmap mapping*
