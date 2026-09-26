# Features Research — Crash Pixi Portfolio

**Researched:** 2026-09-26  
**Confidence:** HIGH for v1 scope; MEDIUM for nice-to-haves

## Table Stakes (must ship)

| Feature | Notes |
|---------|-------|
| Single game page | No lobby |
| Demo wallet | Starting balance; deduct on bet; credit on cash-out |
| Bet placement | Amount input + place bet (only in waiting) |
| Round fly | Rising multiplier from 1.00x |
| Cash out | Button during flying; pays bet × current mult |
| Crash | Auto-lose if no cash-out before crash point |
| Live multiplier display | Large readable number |
| Simple visual | Graph curve + number (preferred) |
| Mobile-friendly canvas | Usable on phone viewport |
| DEMO / portfolio labeling | Unmistakable non-gambling framing |
| Seeded RNG | Testable rounds |
| SFX placeholders | Stub API; silent or beep OK |

## Differentiators (portfolio signal)

| Feature | Why it matters to employers |
|---------|------------------------------|
| Pure GameLogic vs Pixi view | Shows architecture discipline |
| Unit tests on crash/wallet math | Shows testability without canvas |
| Seeded reproducibility | Shows intentional demo design |
| Clean Vite+TS+PixiJS v8 setup | Modern FE game stack fluency |

## Anti-Features (explicitly out of v1)

- Real money / payments / auth
- Live multiplayer / chat / “all bets” feed
- Provably fair crypto UI
- Auto-bet / auto-cashout (nice later)
- Plane/rocket sprite unless user provides textures
- Slot / wheel / roulette
- Copying commercial IP (Endorphina et al.)
- Admin panel / RTP configurator UI (constants in code OK)

## Possible Later Milestones (not v1)

1. Auto cash-out at target multiplier
2. Round history strip
3. Optional plane sprite (user-supplied texture)
4. Multi-game shell / lobby
5. Mock “provably fair” explain panel (educational, still demo RNG)

## Confidence

Table stakes: HIGH. Later milestones: MEDIUM (depends on portfolio goals).
