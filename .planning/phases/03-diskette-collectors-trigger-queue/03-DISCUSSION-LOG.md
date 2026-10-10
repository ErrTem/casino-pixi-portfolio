# Phase 3: Diskette Collectors + Trigger Queue - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-10
**Phase:** 3-Diskette Collectors + Trigger Queue
**Areas discussed:** Token spawn + flight, Phone meter growth, Trigger + combo queue, Spin timing vs tokens

---

## Token spawn + flight

### Color mapping

| Option | Description | Selected |
|--------|-------------|----------|
| Rename config to phone colors | green/red/purple in Zod + JSON | ✓ |
| Keep pink/cyan/yellow + code map | map to phones in code | |
| You decide | | |

**User's choice:** Rename config to green/red/purple
**Notes:** —

### Pre-flight appearance

| Option | Description | Selected |
|--------|-------------|----------|
| Overlay on a random cell | diskette on top of symbol, then fly | ✓ |
| Replace a cell's symbol | cell becomes diskette | |
| You decide | | |

**User's choice:** Overlay on a random cell
**Notes:** —

### Flight motion

| Option | Description | Selected |
|--------|-------------|----------|
| Short neon arc | bezier hop, ticker easing | ✓ |
| Straight zip | linear dash | |
| You decide | | |

**User's choice:** Short neon arc
**Notes:** —

### Multi-color same spin

| Option | Description | Selected |
|--------|-------------|----------|
| One at a time | sequential arcs | |
| All at once | parallel arcs | ✓ |
| You decide | | |

**User's choice:** All at once — parallel arcs
**Notes:** —

---

## Phone meter growth

### Fill visual

| Option | Description | Selected |
|--------|-------------|----------|
| Signal bars under each phone | discrete 0–N bars | ✓ |
| Neon intensity on the phone | glow scales with count | |
| Both | bars + neon pulse | |
| You decide | | |

**User's choice:** Signal bars under each phone
**Notes:** —

### meterTarget meaning

| Option | Description | Selected |
|--------|-------------|----------|
| Soft cap only | bars full; more tokens still land; trigger from land odds | ✓ |
| Hard fill → must trigger | reaching N guarantees trigger | |
| Progress only, trigger independent | bars cosmetic vs odds | |
| You decide | | |

**User's choice:** Soft cap only
**Notes:** Trigger remains land-odds based (later locked as config `triggerChance`)

### Meter reset

| Option | Description | Selected |
|--------|-------------|----------|
| On that phone's bonus trigger | clear that phone only | ✓ |
| After whole combo night finishes | clear all fired together | |
| Never mid-session | clear on leave only | |
| You decide | | |

**User's choice:** On that phone's bonus trigger
**Notes:** —

### Bar art

| Option | Description | Selected |
|--------|-------------|----------|
| Procedural bars in Pixi | Graphics; no meter PNGs | ✓ |
| Dedicated bar/segment art | PNG pack | |
| You decide | | |

**User's choice:** Procedural bars in Pixi
**Notes:** —

---

## Trigger + combo queue

### Trigger decision

| Option | Description | Selected |
|--------|-------------|----------|
| Config `triggerChance` per color | roll on each land | ✓ |
| Fixed portfolio demo rate in code | hard-coded chance | |
| Higher chance when meter full | soft-cap boosts odds | |
| You decide | | |

**User's choice:** Config `triggerChance` per color
**Notes:** —

### Combo presentation (pre–Phase 4)

| Option | Description | Selected |
|--------|-------------|----------|
| Phone glow + DOM queue strip | e.g. COMBO: Green → Red | ✓ |
| Phone glow only | no DOM queue text | |
| Modal / banner | full-screen combo card | |
| You decide | | |

**User's choice:** Phone glow + DOM queue strip
**Notes:** —

### Queue order

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed Green → Red → Purple | only phones that fired | ✓ |
| Left-to-right visual | follow scene slots | |
| Trigger order | order arcs/rolls finished | |
| You decide | | |

**User's choice:** Fixed Green → Red → Purple
**Notes:** —

### Queue stub behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Highlight + short beat per entry | then return to base | ✓ |
| Instant enqueue toast | no per-bonus pause | |
| Block until dismiss | Continue between steps | |
| You decide | | |

**User's choice:** Highlight + short beat per entry
**Notes:** Meter reset tied to each entry pop (matches phone-trigger reset)

---

## Spin timing vs tokens

### Tokens vs win cycle

| Option | Description | Selected |
|--------|-------------|----------|
| After win cycle finishes | or after stop if no wins | ✓ |
| In parallel with win cycle | overlays at reel stop | |
| Before win cycle | tokens first | |
| You decide | | |

**User's choice:** After win cycle finishes
**Notes:** —

### Spin during flights / stub

| Option | Description | Selected |
|--------|-------------|----------|
| Locked until settle | Spin disabled through flights + stub | ✓ |
| Queue next spin | click queues next spin | |
| Interrupt / skip | cancel remaining presentation | |
| You decide | | |

**User's choice:** Locked until settle
**Notes:** —

### Diskette art

| Option | Description | Selected |
|--------|-------------|----------|
| Request PNG pack | three diskettes; user places files | ✓ |
| Procedural tokens for now | shapes until art later | |
| You decide | | |

**User's choice:** Request PNG pack
**Notes:** —

### Collector audio

| Option | Description | Selected |
|--------|-------------|----------|
| Extend beeps | spawn / land / trigger / queue step | ✓ |
| Silent collectors | wait for Howler | |
| You decide | | |

**User's choice:** Extend beeps
**Notes:** —

---

## Claude's Discretion

User did not pick "You decide" on any prompt. Discretion left for planner/executor: exact `triggerChance` sample values, arc/bar timing and neon color, combo-strip copy, stub beat lengths, overlay cell-pick details.

## Deferred Ideas

None — discussion stayed within phase scope. Phase 4 bonuses and Phase 5 gamble/paytable remain roadmap-deferred.
