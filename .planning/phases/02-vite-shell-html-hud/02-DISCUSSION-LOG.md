# Phase 2: Vite Shell + HTML HUD - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-26
**Phase:** 2-Vite Shell + HTML HUD
**Areas discussed:** Overlay chrome layout

---

## Overlay chrome layout

### Q1 — First viewport structure

| Option | Description | Selected |
|--------|-------------|----------|
| Bottom control bar | Canvas/placeholder on top; monetary controls along the bottom | ✓ |
| History top + controls bottom | History strip top; canvas middle; controls bottom | |
| Side rail | Canvas dominant; controls in a side column | |
| You decide | Claude picks layout for demos + Phase 3 mount | |

**User's choice:** Bottom control bar
**Notes:** —

### Q2 — History strip placement

| Option | Description | Selected |
|--------|-------------|----------|
| Inside the bottom bar | Compact history with chips in the same control band | ✓ |
| Above the canvas | Thin strip over top edge; bottom bar action-only | |
| Floating over canvas | Overlay on reserved canvas area | |
| You decide | Place for readability without fighting Phase 3 view | |

**User's choice:** Inside the bottom bar
**Notes:** —

### Q3 — Bottom bar internal layout

| Option | Description | Selected |
|--------|-------------|----------|
| Balance left · actions center · chips+history right | Classic Crash three-zone chrome | ✓ |
| Stacked bands | History band above actions band (taller chrome) | |
| Actions-first compact row | Single dense row + history under it | |
| You decide | Optimize for desktop recruiter readability | |

**User's choice:** Balance left · actions center · chips+history right
**Notes:** —

### Q4 — Phase 2 canvas region

| Option | Description | Selected |
|--------|-------------|----------|
| Empty reserved slot | Neutral game region; Phase 3 drop-in | ✓ |
| Big HTML multiplier in the slot | Large live × until Pixi replaces it | |
| Minimal stub only | Bare host; all feedback in bottom bar | |
| You decide | Best headless loop without boxing Phase 3 | |

**User's choice:** Empty reserved slot
**Notes:** User declined big HTML multiplier theater in the canvas slot.

---

## Areas offered but not selected

- Bet preset chip set
- History strip presentation (density / color / order)
- Headless flight feedback (live × placement beyond empty slot)

User chose **I'm ready for context** after layout only — remaining topics left to Claude's Discretion in CONTEXT.md.

## Claude's Discretion

- Chip values / chip↔input behavior
- History strip styling details within the right zone
- Small bar-level multiplier/phase readout (not in canvas slot)
- Auto CO control chrome details
- Broke/`resetWallet()` affordance placement
- Phase 2 tick source until Pixi ticker
- Vite bootstrap / HUD folder seams

## Deferred Ideas

None — discussion stayed within phase scope.
