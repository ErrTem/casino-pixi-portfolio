# Roadmap: casino-pixi-portfolio

## Overview

Brownfield portfolio grows from Crash-only boot into a multi-game shell, then ships HOTLINE as a full Witch Pots–style loop: backend-shaped config and base 5×4 play, diskette→phone collectors with combo queue, three bonuses, and VHS gamble with paytable and responsive polish — all client-only PixiJS demos.

## Milestones

- 🚧 **v1.0 HOTLINE + multi-game menu** — Phases 1–5 (in progress)

## Phases

- [ ] **Phase 1: Portfolio Shell + Crash Session** - Menu launches Crash or returns home; shared mute/seed/demo chrome; one long-lived Pixi Application
- [ ] **Phase 2: HOTLINE Base Playable** - Zod JSON config, 5×4 / 40-line math, spin/bet HUD, motel CRT presentation
- [ ] **Phase 3: Diskette Collectors + Trigger Queue** - Colored tokens fly into three phones; meters grow; random triggers enqueue combo nights
- [ ] **Phase 4: Three Bonuses + Combo Nights** - Green free spins, Red Hold & Win, Purple locker Pick'em, ordered combo queue
- [ ] **Phase 5: Gamble + Paytable + Polish** - VHS SURVIVE/DIE, rules overlay, responsive layout

## Phase Details

### Phase 1: Portfolio Shell + Crash Session
**Goal:** Visitor picks a demo from a shared menu, plays Crash, and returns without leaking tickers or audio — portfolio chrome and boot seed work across the shell
**Mode:** mvp
**Depends on:** Nothing (first phase)
**Requirements:** SHELL-01, SHELL-02, SHELL-03, SHELL-04, CFG-02
**Success Criteria** (what must be TRUE):
  1. User opens a game menu and can launch Crash (HOTLINE may be stub/disabled until Phase 2)
  2. User returns from Crash to the menu without leftover ticker ticks, audio handlers, or stuck HUD
  3. Mute preference set in menu or Crash still applies after switching between menu and Crash
  4. Menu/HUD shows a clear portfolio demo / no real money label
  5. Booting with `?seed=` produces a reproducible Crash session via the shared boot seam
**Plans:** TBD
**UI hint**: yes

### Phase 2: HOTLINE Base Playable
**Goal:** Visitor launches HOTLINE and plays base spins on a 5×4 / 40-line game with bet/balance HUD, Wild substitutes, backend-shaped JSON config, and Hotline Miami rooftop + CRT framing
**Mode:** mvp
**Depends on:** Phase 1
**Requirements:** CFG-01, BASE-01, BASE-02, BASE-03, PRES-01
**Success Criteria** (what must be TRUE):
  1. User opens HOTLINE from the menu and plays on a 5×4 grid with 40 fixed paylines, wins left-to-right from reel 1
  2. User can spin, change bet within config steps, and see balance and last win update
  3. Matching payline symbols pay per paytable; Wild (animal mask) substitutes for paying symbols
  4. HOTLINE loads bet steps, symbol weights, and related tables from validated backend-shaped JSON at boot (bad config fails loud)
  5. HOTLINE shows motel rooftop at sunset with CRT/VHS monitor framing and Retro Computer font
**Plans:** TBD
**UI hint**: yes

### Phase 3: Diskette Collectors + Trigger Queue
**Goal:** Base spins collect colored diskettes into three rotary phones; meters grow visibly; token land can trigger bonuses into a clear combo queue
**Mode:** mvp
**Depends on:** Phase 2
**Requirements:** COLL-01, COLL-02, COLL-03
**Success Criteria** (what must be TRUE):
  1. Colored diskette tokens appear on reel symbols and fly into the matching rotary phone meter
  2. Phone meters visibly grow (signal bars / neon intensity) as tokens accumulate
  3. Landing a token can randomly trigger that phone's bonus; multiple phones can enqueue as combo nights (queue stub ready for Phase 4 features)
**Plans:** TBD
**UI hint**: yes

### Phase 4: Three Bonuses + Combo Nights
**Goal:** Each phone delivers its Witch Pots–style feature, and multi-phone triggers run as an ordered combo night (including nesting during free spins where config allows)
**Mode:** mvp
**Depends on:** Phase 3
**Requirements:** BONUS-01, BONUS-02, BONUS-03, BONUS-04
**Success Criteria** (what must be TRUE):
  1. Green phone grants 24 free spins with elevated Wild mask density on reels 2–5
  2. Red phone starts Hold & Win on a 5×4 sticky cash grid with 3 respins that reset on new cash symbols
  3. Purple phone opens a locker Pick'em where the user reveals cash prizes until the round ends
  4. When multiple phones trigger, bonuses run in a clear ordered combo queue (including nesting during free spins where config allows)
**Plans:** TBD
**UI hint**: yes

### Phase 5: Gamble + Paytable + Polish
**Goal:** After line wins the visitor can risk on VHS SURVIVE/DIE, open rules/paytable, and play comfortably on desktop and mobile viewports
**Mode:** mvp
**Depends on:** Phase 4
**Requirements:** GAMBLE-01, GAMBLE-02, BASE-04, PRES-02
**Success Criteria** (what must be TRUE):
  1. After a line win, user can play VHS SURVIVE/DIE to double or lose the win, up to 10 rounds
  2. Gamble applies to line wins only (not bonus feature totals)
  3. User can open a paytable/rules overlay explaining symbols, phones, bonuses, and gamble
  4. Layout remains playable on desktop and mobile viewport sizes
**Plans:** TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Portfolio Shell + Crash Session | 0/TBD | Not started | - |
| 2. HOTLINE Base Playable | 0/TBD | Not started | - |
| 3. Diskette Collectors + Trigger Queue | 0/TBD | Not started | - |
| 4. Three Bonuses + Combo Nights | 0/TBD | Not started | - |
| 5. Gamble + Paytable + Polish | 0/TBD | Not started | - |

## Coverage Map

| Requirement | Phase |
|-------------|-------|
| SHELL-01 | 1 |
| SHELL-02 | 1 |
| SHELL-03 | 1 |
| SHELL-04 | 1 |
| CFG-02 | 1 |
| CFG-01 | 2 |
| BASE-01 | 2 |
| BASE-02 | 2 |
| BASE-03 | 2 |
| PRES-01 | 2 |
| COLL-01 | 3 |
| COLL-02 | 3 |
| COLL-03 | 3 |
| BONUS-01 | 4 |
| BONUS-02 | 4 |
| BONUS-03 | 4 |
| BONUS-04 | 4 |
| GAMBLE-01 | 5 |
| GAMBLE-02 | 5 |
| BASE-04 | 5 |
| PRES-02 | 5 |

**Coverage:** 21/21 v1 requirements mapped ✓
