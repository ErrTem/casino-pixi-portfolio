# Requirements: casino-pixi-portfolio (HOTLINE)

**Defined:** 2026-10-09
**Core Value:** Portfolio visitor opens the menu, launches HOTLINE, and plays the full Witch Pots-style loop (tokens → three phones → three bonuses including combos → VHS gamble) in Hotline Miami dress, with backend-shaped JSON configs.

## v1 Requirements

### Shell

- [ ] **SHELL-01**: User can open a game menu and launch Crash or HOTLINE
- [ ] **SHELL-02**: User can return from either game to the menu without leaking tickers or audio handlers
- [ ] **SHELL-03**: User mute preference persists across menu and both games
- [ ] **SHELL-04**: Menu/HUD shows a clear portfolio demo / no real money label

### Base

- [ ] **BASE-01**: User plays HOTLINE on a 5x4 grid with 40 fixed paylines, wins left-to-right from reel 1
- [ ] **BASE-02**: User can spin, change bet within config steps, and see balance and last win
- [ ] **BASE-03**: Matching symbols on a payline pay according to the paytable; Wild (animal mask) substitutes for paying symbols
- [ ] **BASE-04**: User can open a paytable/rules overlay explaining symbols, phones, bonuses, and gamble

### Collectors

- [ ] **COLL-01**: Colored diskette tokens can appear on reel symbols and fly into the matching rotary phone meter
- [ ] **COLL-02**: Phone meters visibly grow (signal bars / neon intensity) as tokens accumulate
- [ ] **COLL-03**: Landing a token can randomly trigger that phone's bonus; multiple phones can queue as combo nights

### Bonuses

- [ ] **BONUS-01**: Green phone grants 24 free spins with elevated Wild mask density on reels 2-5
- [ ] **BONUS-02**: Red phone starts Hold & Win on a 5x4 sticky cash grid with 3 respins that reset on new cash symbols
- [ ] **BONUS-03**: Purple phone opens a locker Pick'em where the user reveals cash prizes until the round ends
- [ ] **BONUS-04**: When multiple phones trigger, bonuses run in a clear ordered combo queue (including nesting during free spins where config allows)

### Gamble

- [ ] **GAMBLE-01**: After a line win, user can play VHS SURVIVE/DIE to double or lose the win, up to 10 rounds
- [ ] **GAMBLE-02**: Gamble applies to line wins only (not bonus feature totals)

### Config

- [ ] **CFG-01**: HOTLINE loads bet steps, symbol weights, token odds, bonus prizes, and jackpot multipliers from backend-shaped JSON validated at boot
- [ ] **CFG-02**: User can boot with `?seed=` for reproducible demo sessions (shared boot seam with Crash)

### Presentation

- [ ] **PRES-01**: HOTLINE presents motel rooftop at sunset with CRT/VHS monitor framing and Retro Computer font from `src/shared/fonts/`
- [ ] **PRES-02**: Layout remains playable on desktop and mobile viewport sizes

## v2 Requirements

Deferred — not in current roadmap phases.

### Shell

- **SHELL-V2-01**: Deep-link `?game=hotline` (or crash) opens that game directly
- **SHELL-V2-02**: Optional shared wallet balance across Crash and HOTLINE

### Base

- **BASE-V2-01**: Simple autoplay with basic stop controls

## Out of Scope

| Feature | Reason |
|---------|--------|
| Megaways / cascades / buy-feature | Keep Witch Pots 1:1 for v1 |
| Live backend, real money, KYC | Portfolio client demo only |
| Certified RTP / regulated RNG | Illustrative runnable configs only |
| Rewriting Crash gameplay | Crash is validated; menu adapter only |
| Full aggregator lobby | Simple extensible menu is enough |
| Progressive network jackpots | Local config multipliers only |
| Agent-generated final art | User supplies graphics on request |

## Traceability

Filled during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SHELL-01 | — | Pending |
| SHELL-02 | — | Pending |
| SHELL-03 | — | Pending |
| SHELL-04 | — | Pending |
| BASE-01 | — | Pending |
| BASE-02 | — | Pending |
| BASE-03 | — | Pending |
| BASE-04 | — | Pending |
| COLL-01 | — | Pending |
| COLL-02 | — | Pending |
| COLL-03 | — | Pending |
| BONUS-01 | — | Pending |
| BONUS-02 | — | Pending |
| BONUS-03 | — | Pending |
| BONUS-04 | — | Pending |
| GAMBLE-01 | — | Pending |
| GAMBLE-02 | — | Pending |
| CFG-01 | — | Pending |
| CFG-02 | — | Pending |
| PRES-01 | — | Pending |
| PRES-02 | — | Pending |

**Coverage:**
- v1 requirements: 21 total
- Mapped to phases: 0
- Unmapped: 21

---
*Requirements defined: 2026-10-09*
*Last updated: 2026-10-09 after initialization*
