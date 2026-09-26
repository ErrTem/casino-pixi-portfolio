# Phase 3: Pixi Hybrid View - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-27
**Phase:** 3-Pixi Hybrid View
**Areas discussed:** Curve / graph look, Rocket representation, Crash break FX, In-canvas live multiplier, Waiting / idle canvas

---

## Curve / graph look

| Option | Description | Selected |
|--------|-------------|----------|
| Thin stroke trail | Classic Crash line | |
| Stroke + soft fill | Line + area fill | |
| Thick neon / glow trail | High-energy casino look | ✓ |
| You decide | Builder picks portfolio default | |

**User's choice:** Thick neon / glow trail
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Cool cyan / electric blue | Tech-portfolio | |
| Warm gold / amber | Casino heat | |
| Green climb → red crash accents | Semantic gain/danger | ✓ |
| You decide | Dark stage + high-contrast accent | |

**User's choice:** Green climb → red crash accents
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Classic rising-right | Aviator-like framing | |
| Steeper mid-flight | Flatten early, shoot up after ~2× | ✓ |
| Mostly vertical climb | Center rise | |
| You decide | Rising-right mapped from multiplier | |

**User's choice:** Steeper mid-flight
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Near-black void | Minimal | |
| Subtle grid / faint axes | Soft chart cues | |
| Soft atmospheric gradient | Dark with depth | |
| You decide | Quiet dark stage | ✓ (refined) |

**User's choice:** You decide → refined by user: **dim grid + sky → clouds → deep cosmos with stars**
**Notes:** Backdrop secondary to neon readability

---

## Rocket representation

| Option | Description | Selected |
|--------|-------------|----------|
| Simple geometric rocket | Procedural only | |
| I will provide a sprite | User texture now | |
| Placeholder now, swap later | Geometry + swap seam | ✓ |
| You decide | Geometric + green glow | |

**User's choice:** Placeholder geometric + texture swap later
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Small accent | Secondary to trail | ✓ |
| Medium hero | Shared attention | |
| Large focal | Rocket dominates | |
| You decide | Small-to-medium | |

**User's choice:** Small accent
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — nose along climb | Tangent follow | ✓ |
| Upright always | Marker | |
| Slight lean only | Soft tilt | |
| You decide | Full tangent + glow | |

**User's choice:** Tangent follow
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Tiny flame / glow | Minimal tail | |
| No flame — body only | Clean marker | |
| Short particle streak | Flashier demo-scale | ✓ |
| You decide | Minimal tail glow | |

**User's choice:** Short particle streak
**Notes:** —

---

## Crash break FX

| Option | Description | Selected |
|--------|-------------|----------|
| Path snaps / severs at tip | Graph metaphor | ✓ |
| Rocket ejects / tumbles | Rocket-primary | |
| Both | Path + rocket exit | |
| You decide | Sever + short kick | |

**User's choice:** Path snaps / severs at tip
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Local only | Red at break | |
| Brief full-canvas flash | Quick pulse | ✓ |
| Shake + flash | Arcade | |
| You decide | Flash without heavy shake | |

**User's choice:** Brief full-canvas flash
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Freeze on tip | Stops in place | |
| Vanish instantly | Disappears with snap | ✓ |
| Fall / tumble briefly | Secondary motion | |
| You decide | Freeze through flash then clear | |

**User's choice:** Vanish instantly
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Beat only (~0.3–0.5s) | Fast turnaround | |
| Readable hold (~0.8–1.2s) | Clear “it crashed” | ✓ |
| Long linger (~2s+) | Emphatic | |
| You decide | ~1s hold | |

**User's choice:** Readable hold (~0.8–1.2s)
**Notes:** —

---

## In-canvas live multiplier

| Option | Description | Selected |
|--------|-------------|----------|
| Big theater × on canvas | Dominant number | ✓ |
| Subtle near-rocket readout | Small tip × | |
| Canvas art only | HUD numbers only | |
| You decide | Medium centered × | |

**User's choice:** Big theater × on canvas
**Notes:** HUD already has liveMult

| Option | Description | Selected |
|--------|-------------|----------|
| Center of game region | Classic stare | |
| Upper third, clear of tip | Large, avoid path climax | ✓ |
| Near climb tip | Tied to action | |
| You decide | Centered with nudge | |

**User's choice:** Upper third, clear of tip
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Match palette green/red | Path-synced colors | |
| Always white / light | Max readability | |
| White climb → red crash | Binary switch | |
| You decide | Green→red reinforce | ✓ (refined) |

**User's choice:** You decide → refined: **starts white, slowly turns red as number increases; red on crash**
**Notes:** Separate from path green climb

| Option | Description | Selected |
|--------|-------------|----------|
| Hold green-tinted / success flash | Win read | |
| Freeze at cash-out value | Stop updating | |
| Same hold language, green/gold | Parallel to crash | |
| You decide | Success pulse then clear | ✓ (refined) |

**User's choice:** You decide → refined: **freeze cashed value below; continue rocket flight and big × increasing until crash**
**Notes:** Dual-read: personal cash-out vs live round

---

## Waiting / idle canvas

| Option | Description | Selected |
|--------|-------------|----------|
| Atmosphere only | No path/rocket/× | |
| Ghost start mark | Faint origin for next climb | ✓ |
| Soft ready pulse | Pulse at origin | |
| You decide | Atmosphere + faint origin | |

**User's choice:** Ghost start mark
**Notes:** No countdown digits (Phase 5)

| Option | Description | Selected |
|--------|-------------|----------|
| Hard clear | Instant wipe | |
| Short fade | ~0.3–0.5s | ✓ |
| Path retracts | Draws back to origin | |
| You decide | Short fade | |

**User's choice:** Short fade
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Hidden | Appears at launch | |
| Parked at origin | Idle, no particles | |
| Subtle idle bob | Parked + tiny motion | ✓ |
| You decide | Hidden until flying | |

**User's choice:** Subtle idle bob
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| All × cleared | Atmosphere + mark + rocket only | |
| Soft 1.00× preview | Dim preview until launch | |
| Keep last crash × dimmed | Previous result until launch | ✓ |
| You decide | Clear all × on idle | |

**User's choice:** Keep last crash × dimmed
**Notes:** Frozen cash-out × clears on fade into idle

---

## Claude's Discretion

Exact glow implementation, color hex/ramp curves, parametric mapping constants, backdrop density, rocket silhouette/particle budget, flash micro-timing, frozen-× layout details, ghost-mark/bob amplitude, Pixi Application bootstrap/resize, view folder seam — see CONTEXT.md Claude's Discretion.

## Deferred Ideas

None new — Phase 4 mobile, Phase 5 polish, texture asset delivery later via D-05 seam.
