# Phase 2: HOTLINE Base Playable - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-09
**Phase:** 2-HOTLINE Base Playable
**Areas discussed:** Config schema scope, Scene art handoff, Rooftop + HUD layout, Reel stop + win feedback

---

## Config schema scope

### How complete should the Zod JSON be in Phase 2?

| Option | Description | Selected |
|--------|-------------|----------|
| Full Witch Pots–shaped config now | Tables for tokens/bonuses/jackpots present; Phase 2 uses base only | ✓ |
| Base-only schema now | Expand in Phases 3–4 | |
| You decide | | |

**User's choice:** Full Witch Pots–shaped config now

### Unused Phase 3–4 table numbers?

| Option | Description | Selected |
|--------|-------------|----------|
| Illustrative but runnable | Plausible studio values | ✓ |
| Obvious placeholders | Joke / TODO values | |
| You decide | | |

**User's choice:** Illustrative but runnable

### Where JSON lives / bad config fail?

| Option | Description | Selected |
|--------|-------------|----------|
| Bundled `src/games/hotline/config/` + throw | | ✓ |
| `public/config` fetch + DOM error | | |
| Bundled + short DOM error | | |

**User's choice:** Bundled + throw loud

### Top-level JSON shape?

| Option | Description | Selected |
|--------|-------------|----------|
| Backend-ish sections (`gameId`, `version`, `math`, `features`, `paytable`, …) | | ✓ |
| Flat game math file | | |
| You decide | | |

**User's choice:** Backend-ish sections

---

## Scene art handoff

### When do real assets arrive?

| Option | Description | Selected |
|--------|-------------|----------|
| Request asset list now | Ship with real/near-real art | ✓ |
| Procedural placeholders first | | |
| Hybrid backdrop+CRT now, symbols later | | |

**User's choice:** Request asset list now

### First pack scope?

| Option | Description | Selected |
|--------|-------------|----------|
| Must-have pack only | | |
| Must-have + phone silhouettes | Inert phones on roof | ✓ |
| You decide | | |

**User's choice:** Must-have + phone silhouettes

### Delivery format?

| Option | Description | Selected |
|--------|-------------|----------|
| Loose PNGs under `public/assets/hotline/` | | ✓ |
| Spritesheet + atlas JSON | | |
| You decide | | |

**User's choice:** Loose PNGs

### Who owns CRT/VHS look?

| Option | Description | Selected |
|--------|-------------|----------|
| Baked into frame art | | ✓ |
| Clean art + code overlays | | |
| Both light touches | | |

**User's choice:** Baked into frame art

---

## Rooftop + HUD layout

### Pixi vs DOM split?

| Option | Description | Selected |
|--------|-------------|----------|
| Crash-like split | Pixi scene; DOM spin/bet/balance/win | ✓ |
| Mostly on canvas | | |
| Hybrid Spin in Pixi | | |

**User's choice:** Crash-like split

### Phone placement?

| Option | Description | Selected |
|--------|-------------|----------|
| Above the monitor | Witch Pots style | ✓ |
| Flanking the monitor | | |
| You decide | | |

**User's choice:** Above the monitor
**Notes:** User supplied 3 Witch Pots screenshot as layout reference (`witch-pots-layout-ref.jpg`)

### Primary framing?

| Option | Description | Selected |
|--------|-------------|----------|
| Desktop-first landscape | | |
| Portrait-first like screenshot | Desktop letterbox / tall column | ✓ |
| Desktop default, portrait-aware | | |

**User's choice:** Portrait-first

### HOTLINE title location?

| Option | Description | Selected |
|--------|-------------|----------|
| In the Pixi scene | Above phones | ✓ |
| DOM only | | |
| Both | | |

**User's choice:** In the Pixi scene

### DOM control strip?

| Option | Description | Selected |
|--------|-------------|----------|
| Core only | Spin, bet −/+, balance, last win, 40 lines | ✓ |
| Core + bet amount chip | | |
| You decide | | |

**User's choice:** Core only

---

## Reel stop + win feedback

### Spin motion?

| Option | Description | Selected |
|--------|-------------|----------|
| Readable stagger | Left-to-right clear stops | ✓ |
| Snappy casino | | |
| You decide | | |

**User's choice:** Readable stagger

### Win presentation?

| Option | Description | Selected |
|--------|-------------|----------|
| Line highlight + win amount | | |
| Line highlight + brief count-up | Plus Witch Pots-style path | ✓ |
| Full celebration | | |

**User's choice:** Line highlight + brief count-up
**Notes:** User supplied Witch Pots win screenshot showing neon payline path + framed cells (`witch-pots-winline-ref.jpg`)

### Multiple winning lines?

| Option | Description | Selected |
|--------|-------------|----------|
| Cycle lines | One path at a time + line pay callout | ✓ |
| All paths at once | | |
| You decide | | |

**User's choice:** Cycle lines

### Phase 2 audio?

| Option | Description | Selected |
|--------|-------------|----------|
| Beeps via shell AudioPort | Extend events; no Howler yet | ✓ |
| Mute-friendly silence | | |
| You decide | | |

**User's choice:** Beeps via shell AudioPort

---

## Claude's Discretion

- Exact Zod field names within envelope sections
- Stagger timings and neon win-line color
- Beep pitch mapping for new events
- Desktop letterbox vs tall-column sizing details
- Symbol set naming in the asset list

## Deferred Ideas

None — discussion stayed within phase scope. Turbo/auto, collectors, bonuses, gamble, paytable overlay, and full responsive polish remain later phases / v2.
