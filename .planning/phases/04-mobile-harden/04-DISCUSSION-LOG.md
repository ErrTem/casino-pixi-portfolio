# Phase 4: Mobile Harden - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-27
**Phase:** 4-Mobile Harden
**Areas discussed:** Phone bar shape, Cash-out while flying, History on a narrow bar, Portrait vs landscape

---

## Phone bar shape

| Option | Description | Selected |
|--------|-------------|----------|
| Two compact rows | Actions then chips+history | |
| One tall column | Keep today's stacked zones | ✓ |
| One thumb row | Collapse chips/history to thin strip | |
| You decide | | |

**User's choice:** One tall column

| Option | Description | Selected |
|--------|-------------|----------|
| Cap bar, scroll inside | Max height; scroll chrome | |
| Bar grows as needed | Natural height; canvas shrinks | |
| Soft floor for canvas | Min canvas vh; then chrome scrolls | |
| You decide / freeform | | ✓ |

**User's choice:** Fixed height for buttons; leftover space for Pixi canvas (clarified after “You decide”)
**Notes:** Confirmed as fixed HUD bar height; canvas takes remainder — not fixed canvas height.

| Option | Description | Selected |
|--------|-------------|----------|
| Scroll bar contents | Fixed height; overflow scrolls | ✓ |
| Drop density first | Hide/shrink secondary before scroll | |
| You decide | | |

**User's choice:** Scroll the bar contents

| Option | Description | Selected |
|--------|-------------|----------|
| Same fixed height both ways | | ✓ |
| Taller portrait / shorter landscape | | |
| You decide | | |

**User's choice:** Same fixed height both ways

---

## Cash-out while flying

| Option | Description | Selected |
|--------|-------------|----------|
| Promote Cash out | Large thumb target mid-flight | ✓ |
| Same size always | Uniform larger targets only | |
| You decide | | |

**User's choice:** Promote Cash out

| Option | Description | Selected |
|--------|-------------|----------|
| Keep visible but smaller | Bet/chips/Auto CO stay | ✓ |
| Hide Place bet + chips | | |
| Disable and mute visually | | |
| You decide | | |

**User's choice:** Keep them visible but smaller

| Option | Description | Selected |
|--------|-------------|----------|
| Full-width primary (~44–48px) | | ✓ |
| Large but not full-width | | |
| You decide | | |

**User's choice:** Full-width primary button

| Option | Description | Selected |
|--------|-------------|----------|
| Stay full-width disabled until idle | Through spectator finish | ✓ |
| Shrink immediately on cash-out | | |
| You decide | | |

**User's choice:** Stay full-width, disabled until crash → idle

---

## History on a narrow bar

| Option | Description | Selected |
|--------|-------------|----------|
| Horizontal scroll row | All pills via swipe | ✓ |
| Newest few only | | |
| You decide | | |

**User's choice:** Horizontal scroll row

| Option | Description | Selected |
|--------|-------------|----------|
| History below chips | | ✓ |
| History above chips | | |
| You decide | | |

**User's choice:** History below chips

| Option | Description | Selected |
|--------|-------------|----------|
| Keep compact ~0.75rem | | ✓ |
| Bump readable mobile size | | |
| You decide | | |

**User's choice:** Keep compact pills

| Option | Description | Selected |
|--------|-------------|----------|
| Display-only | No tap action | ✓ |
| Highlight on tap | Visual only | |
| You decide | | |

**User's choice:** Display-only

---

## Portrait vs landscape

| Option | Description | Selected |
|--------|-------------|----------|
| Portrait-first | Landscape must not break | ✓ |
| Both first-class | Separate landscape chrome | |
| You decide | | |

**User's choice:** Portrait-first

| Option | Description | Selected |
|--------|-------------|----------|
| Stay stacked on mobile even landscape | | ✓ |
| Width wins → 3-column when ≥720 | | |
| You decide | | |

**User's choice:** Stay stacked whenever mobile (narrow)

| Option | Description | Selected |
|--------|-------------|----------|
| Viewport width only (~720px) | | ✓ |
| Width + coarse pointer / touch | | |
| Raise breakpoint (~900–1024) | | |
| You decide | | |

**User's choice:** Viewport width only (~720px)
**Notes:** Mild tension with “stay stacked on phones in landscape” if a landscape phone exceeds 720px — accepted under portrait-first.

| Option | Description | Selected |
|--------|-------------|----------|
| Pad HUD with safe-area insets | | ✓ |
| Minimal viewport only | | |
| You decide | | |

**User's choice:** Pad fixed HUD bar with `env(safe-area-inset-*)`

---

## Claude's Discretion

- Exact fixed bar height value
- De-emphasized control sizes; pointer-events / touch-action details
- Bar overflow scroll container choice
- DPR remeasure on orientation; safe-area padding split
- Mobile QA device matrix

## Deferred Ideas

None new — Phase 5 polish and landscape-first redesign stayed out of scope
