# Phase 6: enhance and rework UI/buttons/behavior - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-29
**Phase:** 6-enhance-and-rework-ui-buttons-behavior
**Areas discussed:** Auto-bet rules, Win amount placement, Climb slowdown strength, Arcade camera vs graph, Seed removal depth, Compact extras

---

## Auto-bet rules

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-place same stake every round | Place as soon as waiting allows | ✓ |
| Auto-place only if idle | Never override manual mid-wait | |
| You decide | Simplest continuous auto-launch hook | |

**User's choice:** Auto-place same stake every round

| Option | Description | Selected |
|--------|-------------|----------|
| Stop auto-bet + Reset demo | Turn OFF on broke | ✓ (via “You decide” + clarify Stop) |
| Keep ON but skip placing | Until balance recovers | |
| You decide | Safest broke handling | ✓ then clarified Stop |

**User's choice:** Stop Auto bet on broke

| Option | Description | Selected |
|--------|-------------|----------|
| Immediately when waiting starts | Next stake on waiting enter | ✓ |
| After countdown ends | Place near launch | |
| You decide | | |

**User's choice:** Immediately when waiting starts

| Option | Description | Selected |
|--------|-------------|----------|
| Edits apply to next auto-place | Stake/presets/Auto CO editable while ON | ✓ |
| Stake locked while ON | Must turn off to change | |
| You decide | | |

**User's choice:** Edits apply to next auto-place

---

## Win amount placement

| Option | Description | Selected |
|--------|-------------|----------|
| CASH OUT button only | JetX dual-line | ✓ |
| Canvas under theater × only | | |
| Both | | |

**User's choice:** CASH OUT button only

| Option | Description | Selected |
|--------|-------------|----------|
| Frozen amount + disabled CASHED OUT | Spectator finish | ✓ |
| Disabled CASHED OUT no money | | |
| You decide | | |

**User's choice:** Frozen amount + disabled CASHED OUT

| Option | Description | Selected |
|--------|-------------|----------|
| BET only | | |
| BET + stake amount | Dual-line waiting CTA | ✓ |
| You decide | | |

**User's choice:** BET + stake amount

| Option | Description | Selected |
|--------|-------------|----------|
| Snap back to BET on waiting | No CRASHED state | ✓ |
| Brief CRASHED then BET | | |
| You decide | | |

**User's choice:** Snap back to BET as soon as waiting

---

## Climb slowdown strength

| Option | Description | Selected |
|--------|-------------|----------|
| Mild (~2× at 3.5–4s) | | ✓ |
| Medium (~2× at 5s) | | |
| Strong (~2× at 7–8s) | | |
| You decide | | |

**User's choice:** Mild

| Option | Description | Selected |
|--------|-------------|----------|
| Authoritative GameLogic | Change growthRatePerMs | ✓ |
| Visual-only easing | | |
| You decide | | |

**User's choice:** Authoritative

| Option | Description | Selected |
|--------|-------------|----------|
| Keep crash distribution | Only growth rate changes | ✓ |
| Also retune crash feel | | |
| You decide | | |

**User's choice:** Keep crash distribution unchanged

| Option | Description | Selected |
|--------|-------------|----------|
| Keep path shaping | | |
| Soften path for arcade | | ✓ |
| You decide | | |

**User's choice:** Soften path shaping for arcade camera

---

## Arcade camera vs graph

| Option | Description | Selected |
|--------|-------------|----------|
| Craft centered; graph scrolls | JetX-like | ✓ |
| Craft bobbing Y; LTR trail | | |
| You decide | | |

**User's choice:** Craft centered; graph scrolls

| Option | Description | Selected |
|--------|-------------|----------|
| Mostly level / gentle tilt | | ✓ |
| Path-tangent nose | Phase 3 D-07 | |
| You decide | | |

**User's choice:** Mostly level / gentle tilt

| Option | Description | Selected |
|--------|-------------|----------|
| Keep today’s crash read | | ✓ |
| Stronger arcade crash | | |
| You decide | | |

**User's choice:** Keep today’s crash read

| Option | Description | Selected |
|--------|-------------|----------|
| Theater × upper third | | ✓ |
| Beside craft | | |
| You decide | | |

**User's choice:** Upper third, clear of craft

---

## Seed removal depth

| Option | Description | Selected |
|--------|-------------|----------|
| Full product removal | Drop `?seed=` too | |
| UI only; silent `?seed=` | | ✓ |
| You decide | | |

**User's choice:** UI only; keep silent `?seed=`

| Option | Description | Selected |
|--------|-------------|----------|
| Quiet fallback portfolio-demo | | ✓ |
| Fallback + console warn | | |
| You decide | | |

**User's choice:** Quiet fallback

| Option | Description | Selected |
|--------|-------------|----------|
| Adjust PLSH-03 | Silent boot only | ✓ |
| Drop PLSH-03 | | |
| You decide | | |

**User's choice:** Adjust PLSH-03

| Option | Description | Selected |
|--------|-------------|----------|
| Keep parseBootSeed + tests | | ✓ |
| Inline parse in main | | |
| You decide | | |

**User's choice:** Keep parseBootSeed + tests

---

## Compact extras

| Option | Description | Selected |
|--------|-------------|----------|
| Keep countdown + stats + keyboard | | ✓ |
| Drop stats | | |
| Countdown only | | |
| You decide | | |

**User's choice:** Keep all three

| Option | Description | Selected |
|--------|-------------|----------|
| JetX-like 20/50/100/ALL | | ✓ |
| Keep current presets | | |
| Hybrid | | |
| You decide | | |

**User's choice:** 20 / 50 / 100 / ALL

| Option | Description | Selected |
|--------|-------------|----------|
| Toggle + ± × field | | ✓ |
| Toggle only | | |
| You decide | | |

**User's choice:** Toggle + ± multiplier field

| Option | Description | Selected |
|--------|-------------|----------|
| 100dvh shell; canvas flex | | ✓ |
| Shrink canvas first | | |
| You decide | | |

**User's choice:** 100dvh shell

---

## Claude's Discretion

- Exact growthRatePerMs for 3.5–4s band
- Soft path-mapping / camera scroll implementation details
- Exact zone height budget under 100dvh
- Auto-bet wiring site (root vs HUD) keeping GameLogic pure
- ALL chip max-affordable edge cases
- Auto CO field enablement when toggle OFF

## Deferred Ideas

- Dual bets / X2 panel
- Full `?seed=` removal
- Stronger crash FX / crash RNG retune
