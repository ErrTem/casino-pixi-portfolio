# Feature Research

**Domain:** Browser Crash game (Aviator-like) — portfolio demo, client-side only
**Researched:** 2026-09-26
**Confidence:** HIGH (commercial Crash/Aviator UX patterns + locked PROJECT.md scope; no live competitor scrape this run)

## Feature Landscape

### Table Stakes (Users Expect These)

Features a recruiter/player assumes exist. Missing these = demo feels incomplete or “not a real Crash game.”

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Round state loop (waiting → flying → cashed out / crashed) | Core game identity; without it there is no Crash | MEDIUM | Pure state machine in GameLogic; view only reflects states |
| Place bet before takeoff | Every Crash product gates stake in waiting phase | LOW | Disable bet during flying; validate vs balance |
| Live rising multiplier | Primary tension signal; players stare at this number | MEDIUM | Drive from GameLogic tick; Pixi + optional HTML mirror |
| Manual cash-out mid-flight | Defining player agency moment | LOW–MEDIUM | Settlement = stake × multiplier; lock after crash |
| Crash event + visual break | Without a clear crash, the loop feels unfinished | MEDIUM | Curve break / rocket exit; brief hold then next wait |
| Demo wallet (balance, win/loss) | Proof the loop has stakes; recruiters need to see numbers move | LOW | Start balance, clamp bets, settle on cash-out or crash |
| Bet amount control | Expected control surface next to cash-out | LOW | Free input + validation (min/max/step) |
| Bet presets (chips) | Standard casino UX; faster than typing | LOW | Depends on bet amount control |
| Round history strip (last N crash multipliers) | Instant “this is Crash” recognition; Aviator/JetX all show it | LOW | Append crash point each round; color-code e.g. <2× vs ≥2× |
| Auto cash-out at target multiplier | Table-stakes quality bar for modern Crash UX | MEDIUM | Requires live multiplier + wallet settlement path |
| Mobile-friendly layout | Recruiters often open on phone; canvas + controls must fit | MEDIUM | Responsive canvas resize; touch-sized HTML controls |
| DEMO / portfolio labeling | Legal + honesty signal; without it looks like real gambling | LOW | Persistent badge near wallet/controls |
| Hybrid curve + rocket visual | Project-locked visual language; graph alone feels unfinished for this brief | MEDIUM–HIGH | Pixi path + sprite on path; crash = path break |
| Thin HTML controls overlay | Expected for bet/cash-out/balance; Pixi-only UI is harder to polish in v1 | LOW–MEDIUM | Bet, cash-out, balance, DEMO; Pixi owns spectacle |
| Seeded / reproducible RNG | Demo + testability; “why did it crash?” must be answerable in QA | MEDIUM | Deterministic crash point from seed; not certified RNG |
| GameLogic ↔ Pixi split | Portfolio architecture signal; enables unit tests without canvas | MEDIUM | Pure TS logic; view is adapter only |

### Differentiators (Competitive Advantage)

Not required for a playable demo, but elevate “portfolio polish” vs a minimal prototype. Prioritize only where they reinforce Core Value (recruiter plays one clean round).

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Dual simultaneous bets | Aviator hallmark; shows product literacy | MEDIUM | Two independent stakes/auto-cash-outs; doubles control UI |
| Auto-bet / consecutive rounds | Power-user feel; less critical for demo narrative | MEDIUM | Needs round loop + wallet; careful with “set and forget” UX |
| Waiting-phase countdown / “Next round in…” | Reduces idle confusion between rounds | LOW | Timer or tick-based wait duration |
| Sound cues (bet, takeoff, cash-out, crash) | Presence and game feel | LOW–MEDIUM | Placeholders OK per PROJECT; mute toggle recommended |
| Particle / trail / screen-shake on crash | Spectacle that screenshots well | MEDIUM | Keep tasteful; avoid glow-heavy “AI casino” look |
| Soft stats strip (avg crash, max in session) | Analytical polish without backend | LOW | Derive from history array only |
| Keyboard shortcuts (cash-out, bet) | Signals thoughtful desktop UX | LOW | Document in UI hint; don’t require for play |
| Seed inspector / “round seed” display | Shows engineering rigor for seeded RNG | LOW | Differentiator for technical interviewers |
| Reduced-motion / pause-friendly mode | Accessibility polish | LOW–MEDIUM | Cap animation intensity; still settle correctly |
| Shareable replay URL (`?seed=`) | Memorable demo link for recruiters | LOW–MEDIUM | Depends on seeded RNG + URL parse |
| Clean code structure / tests for GameLogic | Portfolio differentiator vs pretty-but-opaque demos | MEDIUM | Unit-test crash settlement, auto cash-out, wallet |
| Subtle idle attract mode (pre-first-bet) | Makes empty state look alive | LOW–MEDIUM | Optional; don’t delay first bet |

### Anti-Features (Commonly Requested, Often Problematic)

Features that look “more like real Crash” but fight the portfolio-demo brief.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real-money / payments / KYC | “Make it a real product” | Legal, compliance, out of scope; wrong audience | DEMO wallet + clear labeling |
| User accounts / auth | Persist balance across visits | Backend + privacy; no value for 30-second recruiter visit | Session-local balance; optional “reset balance” |
| Live multiplayer / shared crash | Feels like Aviator | Needs servers, sync, cheating surface; hides frontend skill | Single-player client rounds; optional fake “other players” later only if purely cosmetic |
| Live player feed / chat | Social proof like Spribe | Noise, moderation, backend; distracts from your craft | Skip; history strip is enough social cue |
| Provably fair crypto / hash chain | “Fairness” buzzword | Complexity without certification; not table stakes for demo | Seeded demo RNG + optional seed display |
| Copying Aviator/Endorphina assets or branding | Instant recognition | IP risk; PROJECT forbids lookalike commercial IP | Original curve+rocket; generic DEMO naming |
| Multi-game lobby / casino shell | “Full casino portfolio” | Scope explosion; delays Crash quality | Single Crash page v1; shell later milestone |
| Admin panel / RTP config UI | “Operator-ready” | Implies real product ops; no backend | Hardcode or seed-driven parameters in code |
| Free spins / bonuses / VIP | Casino feature checklist | Clutters demo narrative | Skip until multi-game shell |
| Slot / wheel / roulette in same milestone | “More games” | Dilutes Crash polish | Later milestones only |
| Certified / audited RNG | Regulatory theater | Impossible client-side meaningfully | Document as demo RNG in README |
| Heavy React/Angular app shell in v1 | “Modern stack” | Slows ship; PROJECT locks HTML + Pixi | Thin HTML overlay; SPA later if lobby added |

## Feature Dependencies

```
Seeded RNG
    └──requires──> Crash point for round
                       └──requires──> Round state loop
                                          └──requires──> Live multiplier tick
                                          └──requires──> Crash event visual

Demo wallet
    └──requires──> Place bet (waiting)
    └──requires──> Manual cash-out OR crash settlement
Auto cash-out ──requires──> Live multiplier + Demo wallet + Round loop
Bet presets ──enhances──> Bet amount control ──requires──> Demo wallet
History strip ──requires──> Crash event (records crash multiplier)
Hybrid curve+rocket ──requires──> Live multiplier + Round loop
HTML controls ──requires──> Wallet + bet + cash-out actions
Shareable replay URL ──requires──> Seeded RNG
Dual bets ──enhances──> Place bet + Auto cash-out (×2)
Auto-bet ──requires──> Round loop + Demo wallet + Place bet
Sound cues ──enhances──> Round loop transitions
GameLogic/Pixi split ──conflicts──> Logic embedded only in Pixi tick handlers
DEMO labeling ──conflicts──> Real-money framing / casino brand copy
Multiplayer ──conflicts──> Client-only seeded single-player model
```

### Dependency Notes

- **Round loop requires seeded crash point:** Flying phase must know when to crash; seed (or derived crash multiplier) is the source of truth.
- **Auto cash-out requires live multiplier + wallet:** Compare tick value to target; settle once; ignore further ticks.
- **History strip requires crash events:** Only append on crash (not on cash-out); cash-out does not change the round’s crash point.
- **Hybrid visual requires multiplier stream:** Curve Y and rocket position are functions of current multiplier / elapsed flight time.
- **Bet presets enhance bet input:** Same wallet validation path; presets are UX sugar.
- **Shareable replay requires seeded RNG:** URL seed must reproduce the same crash point.
- **GameLogic/Pixi split conflicts with view-owned rules:** Settlement and RNG must not live only in sprites/tick callbacks.
- **DEMO labeling conflicts with real-money framing:** No deposit CTAs, currency that implies withdrawable cash, or “play for real” copy.
- **Multiplayer conflicts with client-only model:** Shared rounds need authoritative server timing; v1 is intentionally solitary.

## MVP Definition

### Launch With (v1)

Aligned with PROJECT.md Active requirements — minimum for Core Value (“recruiter opens, bets, plays, sees balance update”).

- [ ] Round state loop (waiting → flying → cashed out / crashed) — game identity
- [ ] Demo wallet with start balance and win/loss settlement — stakes feel real without money
- [ ] Place bet + bet amount input — entry into the loop
- [ ] Bet presets (chips) — expected Crash control chrome
- [ ] Live multiplier display — primary tension
- [ ] Manual cash-out — player agency
- [ ] Hybrid curve + rocket visual + crash break — portfolio spectacle
- [ ] Thin HTML controls (bet, cash-out, balance, DEMO badge) — usable chrome
- [ ] Round history strip (last N) — instant genre recognition
- [ ] Auto cash-out at target multiplier — modern Crash table stakes
- [ ] Seeded/demo RNG — reproducible QA and honest demo story
- [ ] Mobile-friendly canvas + controls — recruiter phone check
- [ ] GameLogic (pure TS) separate from Pixi view — architecture signal

### Add After Validation (v1.x)

Once one clean round is demo-ready and recorded/shared.

- [ ] Waiting-phase countdown — if inter-round idle confuses testers
- [ ] Sound cues + mute — if silent demo feels flat in walkthroughs
- [ ] Seed display / on-screen Seed chip — superseded by Phase 6 PLSH-03Δ (silent `?seed=` boot only)
- [x] Shareable replay via silent `?seed=` URL — Phase 5 parseBootSeed kept; Seed chip removed in 06-04
- [ ] Soft session stats from history — low cost polish after history exists
- [ ] Keyboard cash-out shortcut — desktop interview demos
- [ ] Crash particles / stronger crash punch — if visual still reads weak on video

### Future Consideration (v2+)

Defer until Crash v1 is shipped and a multi-game milestone is intentional.

- [ ] Dual simultaneous bets — Aviator parity; only after single-bet UX is solid
- [x] Auto-bet / run-N-rounds — **promoted to Phase 6 (UI-03)** and shipped in 06-02; consecutive waiting-edge place + broke stop
- [ ] Cosmetic “other players” feed (fake, client-only) — atmosphere without backend
- [ ] Multi-game lobby / React|Angular shell — new milestone
- [ ] Additional games (slot, wheel, roulette) — separate milestones
- [ ] Accounts, backend, real money — explicitly out of product scope for this portfolio

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Round state loop | HIGH | MEDIUM | P1 |
| Demo wallet + settlement | HIGH | LOW | P1 |
| Place bet + amount input | HIGH | LOW | P1 |
| Live multiplier | HIGH | MEDIUM | P1 |
| Manual cash-out | HIGH | LOW | P1 |
| Hybrid curve + rocket + crash | HIGH | MEDIUM–HIGH | P1 |
| HTML controls + DEMO badge | HIGH | LOW–MEDIUM | P1 |
| History strip | HIGH | LOW | P1 |
| Auto cash-out | HIGH | MEDIUM | P1 |
| Bet presets | MEDIUM–HIGH | LOW | P1 |
| Seeded RNG | HIGH (eng + QA) | MEDIUM | P1 |
| Mobile-friendly layout | HIGH | MEDIUM | P1 |
| GameLogic / Pixi split | HIGH (portfolio) | MEDIUM | P1 |
| Waiting countdown | MEDIUM | LOW | P2 |
| Sound + mute | MEDIUM | LOW–MEDIUM | P2 |
| Seed / replay URL | MEDIUM | LOW–MEDIUM | P2 |
| Session stats | LOW–MEDIUM | LOW | P2 |
| Crash VFX punch-up | MEDIUM | MEDIUM | P2 |
| Keyboard shortcuts | LOW–MEDIUM | LOW | P2 |
| Dual bets | MEDIUM | MEDIUM | P3 |
| Auto-bet | MEDIUM | MEDIUM | P1 (Phase 6 UI-03) |
| Fake player feed | LOW | MEDIUM | P3 |
| Lobby / multi-game shell | MEDIUM (later) | HIGH | P3 |
| Real money / auth / multiplayer / provably fair | — | HIGH | Anti (skip) |

**Priority key:**
- P1: Must have for launch (v1 / Core Value)
- P2: Should have after first playable demo validates
- P3: Nice to have / later milestone
- Anti: Deliberately do not build

## Competitor Feature Analysis

| Feature | Aviator (Spribe) | JetX / Lucky Jet-class | Our Approach (portfolio demo) |
|---------|------------------|------------------------|-------------------------------|
| Round loop + live multiplier | Yes | Yes | Yes — P1 |
| Manual + auto cash-out | Yes | Yes | Yes — P1 |
| History of crash points | Yes (prominent) | Yes | Yes — compact strip |
| Dual bets | Yes (signature) | Often yes | Defer to P3; single bet v1 |
| Live other players / chat | Yes | Often yes | Anti for v1 (no backend) |
| Provably fair | Marketed | Often marketed | Seeded demo RNG instead |
| Real money | Yes | Yes | Anti — DEMO wallet only |
| Plane / rocket spectacle | Plane brand | Jet / character | Original hybrid curve + small rocket |
| Mobile | First-class | First-class | P1 responsive canvas + HTML |
| Auto-bet | Yes | Common | P3 after validation |
| Brand / assets | Proprietary | Proprietary | Original only; no lookalikes |

## Sources

- PROJECT.md — locked v1 Active requirements and Out of Scope (2026-09-26)
- Domain knowledge of commercial Crash UX (Aviator/Spribe-class, JetX/Lucky Jet-class): waiting round, rising multiplier, cash-out, auto cash-out, history rail, dual bet, live player feed, provably-fair marketing
- Portfolio-demo constraints: client-only, DEMO labeling, no IP copying, GameLogic/Pixi separation

---
*Feature research for: browser Crash (Aviator-like) portfolio demo*
*Researched: 2026-09-26*
