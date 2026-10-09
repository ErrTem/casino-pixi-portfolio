# Feature Research

**Domain:** Browser portfolio casino — Witch Pots–style feature slot (HOTLINE) + multi-game shell
**Researched:** 2026-10-09
**Confidence:** MEDIUM

## Feature Landscape

### Table Stakes (Users Expect These)

Features hiring managers and slot players assume exist. Missing these = HOTLINE or the shell feels incomplete as a demo.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Multi-game menu / lobby | Portfolio has Crash + HOTLINE; visitors need one entry to pick a demo | MEDIUM | Tile/list with title, thumb, short blurb, launch; leave room for future games. Return-to-menu from each game. |
| Shared demo wallet / balance | Casino UX always shows credits; Crash already has client wallet | LOW–MEDIUM | Reuse shared money helpers; optional shared balance across games vs per-game reset — pick one and document. |
| Shared mute / audio chrome | Crash already ships mute pref; shell should not re-teach audio | LOW | Lift mute key to portfolio scope; persist across game switches. |
| 5×4 grid, 40 fixed paylines, L→R wins | Core Witch Pots identity; locked product | MEDIUM | Official Endorphina: 5 reels × 4 rows, 40 fixed lines, adjacent from reel 1. |
| Spin / bet / balance HUD | Every slot demo needs spin, bet step, balance, last win | MEDIUM | Match Crash pattern: logic / view / hud. Bet range from JSON config. |
| Line-win evaluation + win presentation | Without clear line wins, bonuses feel bolted on | HIGH | Highlight paying lines; tally; credit wallet. Wild substitutes (not tokens). |
| Wild on reels 2–5 | Table-stakes for this title family | LOW–MEDIUM | Animal-mask Wild (locked skin); present in base + FS. |
| Colored diskette tokens → three rotary phones | Signature collector loop; every spin needs purpose | HIGH | Tokens overlay symbols, fly to color-matched phone meters, may randomly trigger that phone’s bonus on land. |
| Green: 24 Free Spins + extra Wild masks | Primary volume bonus | HIGH | 24 FS at same bet; extra Wild presence on reels 2–5 (masks); can retrigger / nest other bonuses during FS (per reference). |
| Red: Hold & Win respins | Expected modern feature-slot beat | HIGH | 5×4 sticky cash grid; start with locked bonus symbols (ref: 5 transferred); 3 respins, reset on new cash; jackpot path + full-grid ultra prize. |
| Purple: locker Pick’em | Interactive third path; expected in this triad | MEDIUM–HIGH | Pick until three matching award tiers (ref: 16 picks); skin as lockers. Cash prizes from JSON. |
| Bonus combo nights | Witch Pots differentiator that becomes table-stakes for a 1:1 remake | HIGH | Multiple phones can fire together; FS can open Red/Purple mid-feature. Queue / stack presentation carefully. |
| VHS SURVIVE/DIE gamble | Endorphina Risk Game equivalent after wins | MEDIUM | Optional double-or-nothing up to 10 rounds; replace card compare with SURVIVE/DIE. |
| Paytable / rules overlay | Reviewers check “does it explain itself?” | MEDIUM | Symbol pays, phones, bonuses, gamble rules; Retro Computer font. |
| JSON backend-shaped game config | Shows production-aware iGaming thinking without a server | MEDIUM | Weights, prizes, bet steps, feature odds as example “config from server”; not live API. |
| Seeded RNG / reproducible boot | Crash already has `?seed=`; portfolio demos need replayability | LOW–MEDIUM | Shared boot seed parsing; HOTLINE consumes same seam. |
| Demo-only framing | Avoid looking like real-money product | LOW | Short “portfolio demo / no real money” in menu or HUD; no deposit UX. |
| Responsive / playable desktop + mobile | Portfolio opens on phones in interviews | MEDIUM | CRT frame + rooftop must scale; HUD not clipped. |
| Hotline Miami presentation polish | Brand test: motel roof + CRT/VHS + Retro Computer | MEDIUM–HIGH | Atmosphere is part of “complete”; art from user asset drops. |

### Differentiators (Competitive Advantage)

Features that set this portfolio apart from generic one-reel demos and shallow multi-game indexes.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Full three-bonus collector loop (not one FS only) | Proves you can ship a real feature slot, not a spin toy | HIGH | Phones + tokens + FS + H&W + Pick’em is the Core Value. |
| Combo bonus nights | Rare in portfolio demos; matches reference signature | HIGH | Visible queue, clear UI for “two phones ringing.” |
| Themed gamble (VHS SURVIVE/DIE) | Brand-fit risk game; memorable in a 60s review | MEDIUM | Simpler than 4-card compare; still feels authored. |
| Backend-shaped JSON configs | Signals studio/backend literacy without claiming certification | MEDIUM | Example payloads only; weights illustrative but runnable. |
| Multi-game shell with Crash intact | Shows portfolio architecture, not a single throwaway scene | MEDIUM | Game registry + mount/unmount; Crash gameplay untouched. |
| Token flight + meter growth anticipation | Production feel: every spin telegraphs progress | MEDIUM | Animation polish > more math systems. |
| Skin coherence (diskette / phones / masks / lockers / VHS) | Hiring manager remembers the world, not “another 5×4” | MEDIUM | Depends on user-supplied art pack. |
| Shared audio + money + seed seams | Clean brownfield reuse; less “two unrelated demos glued” | LOW–MEDIUM | Already partially validated in Crash. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Megaways / ways-to-win | “Modern slots do this” | Breaks Witch Pots 1:1; new eval engine | Keep 40 fixed lines |
| Cascades / tumble | Popular mechanic | Different product; inflates scope | Fixed-spin resolve only |
| Buy Feature / bonus buy | Demo convenience / studio common | Math + UI + regulation optics; out of scope v1 | Natural token triggers; optional debug seed later |
| Live backend / real money / KYC | “Looks more real” | Wrong product; legal/compliance noise | Client wallet + JSON config |
| Certified RNG / RTP certification | Portfolio credibility theater | Months of work; configs are illustrative | Seeded client RNG + honest demo label |
| Full casino lobby (search, providers, jackpots, banners) | Matches aggregator demos | Overbuilt for 2–3 games | Simple extensible game menu |
| Rewriting Crash | “Unify everything” | Crash is validated; regression risk | Menu wire-in only |
| Progressive network jackpots | H&W has jackpot *tiers* | Needs server/session; not client-demo | Local fixed jackpot multipliers in config |
| Bonus Pop / side-bet extras | Feature creep | Reference explicitly lacks Bonus Pop | Stick to three phones + gamble |
| Autoplay with complex stop conditions | Pro HUD parity | Regulation-heavy UX; low demo value | Optional simple autoplay later (v1.x) |
| Multi-language / i18n suite | “Production ready” | Copy + art layout cost | English-only v1 |
| Social / multiplayer lobby | Portfolio wow | Out of domain | Single-player demos |
| Extra slot engines in same milestone | More games faster | Dilutes HOTLINE quality | One slot + shell; Crash stays |

## Feature Dependencies

```
Game menu / shell
    └──requires──> Game registry + mount lifecycle
                       └──enhances──> Crash (existing) + HOTLINE

HOTLINE base spin loop
    └──requires──> 5×4 reel model + 40-line eval + Wild rules
                       └──requires──> Bet / balance wallet
                       └──requires──> JSON config (strips / pays / bets)

Token collection (diskettes → phones)
    └──requires──> Base spin loop (tokens land on symbols)
    └──requires──> Phone meter UI + flight VFX
                       └──triggers──> Bonus trigger resolver (random on land)

Green Free Spins
    └──requires──> Token/phone trigger (green)
    └──requires──> Base spin loop + Wild mask density rules
    └──enhances──> Can open Red / Purple mid-FS (combo)

Red Hold & Win
    └──requires──> Token/phone trigger (red) OR nested from FS
    └──requires──> Sticky grid state + respin counter + cash/jackpot table

Purple Pick’em
    └──requires──> Token/phone trigger (purple) OR nested from FS
    └──requires──> Pick UI (lockers) + award matching end condition

Combo nights
    └──requires──> All three bonus modules + trigger queue / FSM

VHS Gamble
    └──requires──> Line win (or bonus win policy — define) credited but not yet banked
    └──conflicts──> Auto-bank wins without opt-in (kills risk UX)

Paytable / rules
    └──enhances──> All bonuses (discoverability)

Shared mute + seed
    └──enhances──> Menu + both games

Presentation (rooftop / CRT / font)
    └──enhances──> Perceived completeness of all HOTLINE features
```

### Dependency Notes

- **Bonuses require token/phone pipeline:** Without diskette collection and phone meters, FS / H&W / Pick’em are orphan screens.
- **Combo nights require a feature FSM:** Do not ship three bonuses as mutually exclusive forever if Core Value promises combos; queue presentation early.
- **Gamble requires a clear win-lock handoff:** Define whether gamble applies to line wins only (Endorphina Classic Risk pattern) or also bonus totals; document in config/rules.
- **Menu requires mount/unmount:** Switching Crash ↔ HOTLINE must tear down tickers/audio listeners to avoid leaked state.
- **JSON config enhances but does not replace logic:** Config supplies weights/prizes; evaluation code remains typed and tested.
- **Megaways / cascades / buy-feature conflict** with locked Witch Pots scope — do not schedule in same milestone.

## MVP Definition

### Launch With (v1)

Minimum for Core Value: menu → HOTLINE → feel the full Witch Pots loop in Hotline Miami dress.

- [ ] Multi-game menu (Crash + HOTLINE + placeholder slot for future)
- [ ] HOTLINE base: 5×4, 40 lines, L→R, Wild masks, bet/balance/spin HUD
- [ ] Diskette tokens → three rotary phone meters + random trigger
- [ ] Green 24 FS with elevated Wild masks
- [ ] Red Hold & Win (sticky cash, 3 respins reset, jackpot path)
- [ ] Purple locker Pick’em
- [ ] Combo triggers allowed (at least dual-phone / FS-nested)
- [ ] VHS SURVIVE/DIE gamble (up to 10)
- [ ] JSON config for math/feature weights (backend-shaped example)
- [ ] Motel rooftop + CRT/VHS chrome + Retro Computer font
- [ ] Shared mute; seeded boot; demo-only label
- [ ] Crash wired into menu without gameplay rewrite

### Add After Validation (v1.x)

- [ ] Simple autoplay / turbo — after core FSM is stable
- [ ] Richer paytable art / animated how-to — after art pack lands
- [ ] Per-feature debug overlays / forced-trigger tools — for demos & tests
- [ ] Shared vs per-game wallet polish — once menu UX is settled
- [ ] Third game tile stub with “coming soon” — when roadmap adds next title

### Future Consideration (v2+)

- [ ] Buy Feature — only if product decision changes; not Witch Pots 1:1
- [ ] Extra engines (Megaways, cascades) — separate titles, not HOTLINE v1
- [ ] Live config API — if portfolio ever gains a fake “ops” story
- [ ] Full lobby aggregator UX — only if game count grows large
- [ ] Accessibility deep pass (WCAG) — valuable, not Core Value blocker
- [ ] Monte Carlo RTP report — nice for resumes; not certification

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Game menu + Crash wire-in | HIGH | MEDIUM | P1 |
| Base 5×4 / 40 lines / Wild / HUD | HIGH | HIGH | P1 |
| Token → phone collectors | HIGH | HIGH | P1 |
| Green 24 FS + Wild masks | HIGH | HIGH | P1 |
| Red Hold & Win | HIGH | HIGH | P1 |
| Purple Pick’em | HIGH | MEDIUM–HIGH | P1 |
| Combo nights | HIGH | HIGH | P1 |
| VHS gamble | MEDIUM–HIGH | MEDIUM | P1 |
| JSON config shape | HIGH | MEDIUM | P1 |
| Rooftop / CRT presentation | HIGH | MEDIUM | P1 |
| Shared mute + seed | MEDIUM | LOW | P1 |
| Paytable / rules | MEDIUM | MEDIUM | P2 |
| Turbo / simple autoplay | MEDIUM | MEDIUM | P2 |
| Forced-trigger debug | MEDIUM (dev) | LOW–MEDIUM | P2 |
| Buy feature / Megaways / cascades | LOW (wrong product) | HIGH | P3 / never in v1 |
| Full lobby search & filters | LOW | HIGH | P3 |
| Certified RTP | LOW for demo | VERY HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration (or explicit never for v1)

## Competitor Feature Analysis

| Feature | 3 Witch Pots (Endorphina) | Typical portfolio slot demo | Our Approach (HOTLINE + shell) |
|---------|---------------------------|-----------------------------|--------------------------------|
| Grid / lines | 5×4, 40 fixed | Often 5×3 / few lines | Match reference: 5×4 / 40 |
| Collectors | 3 potion pots + elixirs | Rare / absent | 3 rotary phones + diskettes |
| Free spins | 24 FS; nest other bonuses | Single FS or none | Green 24 FS + Wild masks; combos |
| Hold & Win | Pumpkin sticky + jackpots | Often skipped | Red H&W full loop |
| Pick’em | 16 bats, 3-of-a-kind end | Rare | Purple lockers |
| Gamble | Classic card Risk ×10 | Often omitted | VHS SURVIVE/DIE ×10 |
| Multi-game | N/A (single title) | Single page or heavy lobby | Lean menu: Crash + HOTLINE |
| Config | Server-driven (prod) | Hardcoded | JSON backend-shaped, client-only |
| Scope extras | No Bonus Pop (official FAQ) | Sometimes buy-feature | No Megaways / cascades / buy in v1 |

## Sources

- Endorphina official news: [3 Witch Pots multi-bonus Halloween special](https://endorphina.com/news/3-witch-pots-endorphinas-multi-bonus-halloween-special) (5×4, 40 lines; FS / Hold / Pick’em / Risk ×10) — MEDIUM confidence (verified web + official fetch)
- Endorphina game page: [3 Witch Pots](https://endorphina.com/games/3-witch-pots) (Wild reels 2–5; tokens; scatter/H&W notes; no Bonus Pop) — MEDIUM; marketing prize figures sometimes disagree with news (Ultra 500× vs 1000×) — treat news mechanics as primary, tune prizes in JSON
- Third-party reviews (Respinix, Bonkku, GambleNexus, NetBet how-to) — MEDIUM; confirm collector + random trigger + bonus triad; some wrongly list 5×3
- Portfolio / HUD references: open-slot-ui, typical Pixi slot demos (spin/bet/auto/turbo/paytable patterns) — MEDIUM for shell table stakes
- Multi-game lobby demos (aggregator showcases) — LOW–MEDIUM for production lobbies; deliberately **not** copied — lean portfolio menu instead
- Locked product + `.planning/PROJECT.md` — authoritative for HOTLINE skin and v1 exclusions

---
*Feature research for: HOTLINE Witch Pots–style slot + multi-game casino portfolio shell*
*Researched: 2026-10-09*
