# Phase 1: GameLogic Core - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-26
**Phase:** 1-GameLogic Core
**Areas discussed:** Demo wallet economy, Crash distribution feel, Multiplier climb pace, Post-round settle beat

---

## Demo wallet economy

### Starting balance
| Option | Description | Selected |
|--------|-------------|----------|
| 1,000 | Classic demo chip pile | |
| 5,000 | Room for several bets in a short recruiter session | ✓ |
| 10,000 | Very forgiving | |
| You decide | Claude picks default | |

**User's choice:** 5,000  
**Notes:** —

### Minimum bet
| Option | Description | Selected |
|--------|-------------|----------|
| 1 | Tiny stakes | |
| 10 | Clean chip feel | ✓ |
| 50 | Higher floor | |
| You decide | | |

**User's choice:** 10  
**Notes:** —

### Maximum bet
| Option | Description | Selected |
|--------|-------------|----------|
| Fixed 500 | Hard cap | |
| Fixed 1,000 | Chunk at risk without all-in every time | ✓ |
| 100% of balance | Full all-in | |
| You decide | | |

**User's choice:** Fixed 1,000 (also never above current balance)  
**Notes:** —

### Broke wallet behavior
| Option | Description | Selected |
|--------|-------------|----------|
| Hard stop | Reject bets until external reset | |
| Auto top-up to 5,000 | Never dead-end recruiter | |
| Manual resetWallet() only | Logic exposes reset | |
| You decide | | ✓ (with free-text) |

**User's choice:** Hard stop + expose `resetWallet()` for later HUD (no auto top-up)  
**Notes:** User: “hard stop. Later on UI user can click resetWallet()”

---

## Crash distribution feel

### Outcome mix
| Option | Description | Selected |
|--------|-------------|----------|
| Harsh house | Lots of early busts | |
| Balanced Crash | Early exits + occasional big flyers | ✓ |
| Generous demo | Frequent mid/high multipliers | |
| You decide | | |

**User's choice:** Balanced Crash  
**Notes:** —

### Instant 1.00× busts
| Option | Description | Selected |
|--------|-------------|----------|
| Allow 1.00× | Classic honesty | |
| Floor 1.01× | Always a tiny climb | ✓ |
| Floor ~1.10× | Soften instant busts more | |
| You decide | | |

**User's choice:** Floor 1.01×  
**Notes:** —

### Hard cap
| Option | Description | Selected |
|--------|-------------|----------|
| No hard cap | Extreme moonshots possible | |
| Cap ~100× | Wild but readable | ✓ |
| Cap ~20× | Keep flights short | |
| You decide | | |

**User's choice:** Cap ~100×  
**Notes:** —

### House edge
| Option | Description | Selected |
|--------|-------------|----------|
| Mild ~3–5% | Believable casino vibe | ✓ |
| Near-fair ~0–1% | Almost break-even | |
| Obvious ~10%+ | Faster bankroll drain | |
| You decide | | |

**User's choice:** Mild ~3–5%  
**Notes:** —

---

## Multiplier climb pace

### Tempo
| Option | Description | Selected |
|--------|-------------|----------|
| Slow burn | 2× takes several seconds | |
| Standard Crash | ~2× in ~2–3s | ✓ |
| Arcade fast | Mid multipliers quickly | |
| You decide | | |

**User's choice:** Standard Crash  
**Notes:** —

### Curve shape
| Option | Description | Selected |
|--------|-------------|----------|
| Smooth exponential | Classic Crash acceleration | ✓ |
| Near-linear | Steady rise | |
| Slow start, hard accel | Soft takeoff then steep | |
| You decide | | |

**User's choice:** Smooth exponential  
**Notes:** —

### Precision
| Option | Description | Selected |
|--------|-------------|----------|
| 2 decimal places | Standard Crash UI language | ✓ |
| 3 decimal places | Finer grain | |
| Fixed-point internals only | Display still 2dp | |
| You decide | | |

**User's choice:** 2 decimal places  
**Notes:** Fixed-point money internals left to Claude's discretion in CONTEXT.md

### Climb rate configuration
| Option | Description | Selected |
|--------|-------------|----------|
| Named constant(s) | Tunable config object | ✓ |
| Hardcoded in formula | Less surface area | |
| You decide | | |

**User's choice:** Named tunable constant(s)  
**Notes:** —

---

## Post-round settle beat

### Pause length
| Option | Description | Selected |
|--------|-------------|----------|
| Instant waiting | Next bet ASAP | |
| Short settle ~1–2s | Brief result beat | |
| Longer pause ~3s+ | More breath | |
| You decide | | ✓ (with free-text) |

**User's choice:** 5 second pause before next launch  
**Notes:** User overrode recommended 1–2s with explicit 5s

### Meaning of the 5s window
| Option | Description | Selected |
|--------|-------------|----------|
| Result beat only | Locked then separate waiting | |
| Waiting window = 5s | Bets open; then launch | ✓ |
| 5s locked, then waiting | Betting disabled during result | |
| Other | Free-form | |

**User's choice:** Waiting window = 5s with bets open  
**Notes:** —

### What starts flight
| Option | Description | Selected |
|--------|-------------|----------|
| Manual start only | Matches naive PLAY-01 | |
| Auto-start when 5s ends if bet locked | | |
| Auto-start immediately on bet | | |
| You decide | | ✓ (with free-text) |

**User's choice:** Auto-start when 5s ends; if player doesn't place a bet, round starts anyway (like real online game)  
**Notes:** Continuous live Crash cadence; betting optional

### No-bet rounds
| Option | Description | Selected |
|--------|-------------|----------|
| Full round anyway | crashAt + fly + crash; history; balance untouched | ✓ |
| Skip flying if no bet | Contradicts continuous cadence | |
| You decide | | |

**User's choice:** Full spectator rounds  
**Notes:** —

---

## Claude's Discretion

- Exact RNG/sampling formula for balanced mix + 3–5% edge + 1.01–100× bounds
- Exact exponential growth constants (named) for ~2× in 2–3s
- Money fixed-point internals
- Folder/facade layout per ARCHITECTURE.md
- History buffer `N` size
- Phase 1 seed advancement for tests

## Deferred Ideas

None from discussion (roadmap deferred items unchanged).
