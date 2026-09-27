# Phase 5: Polish - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-27
**Phase:** 5-polish
**Areas discussed:** Countdown placement & read, SFX events & mute UX, Seed URL & on-screen display, Session stats & keyboard cash-out

---

## Countdown placement & read

| Option | Description | Selected |
|--------|-------------|----------|
| Canvas theater | Big digits in upper game region | ✓ |
| HUD chrome | Compact timer in bottom bar | |
| Both | Subtle HUD + larger canvas | |
| You decide | Claude picks | |

**User's choice:** Canvas theater

| Option | Description | Selected |
|--------|-------------|----------|
| Big seconds only | Large 5…4…3… | ✓ (with tenths clarification) |
| Labeled theater | NEXT / NEXT ROUND label | |
| Fading pulse | Pulsing digits | |
| You decide | Claude picks | |

**User's choice:** Big continuous tenths `5.0 → 4.9 → 4.8 …`
**Notes:** User explicitly rejected whole-second steps.

| Option | Description | Selected |
|--------|-------------|----------|
| Waiting only | Show in waiting; clear on flight start | ✓ |
| Through crash hold | Keep during crashed hold | |
| Waiting + launch flash | GO flash | |
| You decide | Claude picks | |

**User's choice:** Waiting only

| Option | Description | Selected |
|--------|-------------|----------|
| Match theater × | Same scale/weight; white | ✓ |
| Dimmer sibling | Softer than theater × | |
| Accent blue/cyan | Distinct meta timer color | |
| You decide | Claude picks | |

**User's choice:** Match theater ×

---

## SFX events & mute UX

| Option | Description | Selected |
|--------|-------------|----------|
| Core four | Bet lock, launch, cash-out, crash | ✓ |
| Core + tick | Plus countdown tick near 1s | |
| Cash-out + crash only | Minimal | |
| You decide | Claude picks | |

**User's choice:** Core four

| Option | Description | Selected |
|--------|-------------|----------|
| HUD chrome | Mute in bottom bar | ✓ |
| Canvas corner | Icon over game | |
| Keyboard only | e.g. M | |
| You decide | Claude picks | |

**User's choice:** HUD chrome

| Option | Description | Selected |
|--------|-------------|----------|
| Session only | Reset on refresh | |
| localStorage | Persist mute | ✓ |
| Start muted | Default muted | |
| You decide | Claude picks | |

**User's choice:** localStorage

| Option | Description | Selected |
|--------|-------------|----------|
| Short synthetic beeps | Distinct pitches per event | ✓ |
| Silent stubs | Port only, no sound | |
| One shared blip | Same click for all | |
| You decide | Claude picks | |

**User's choice:** Short synthetic beeps

---

## Seed URL & on-screen display

| Option | Description | Selected |
|--------|-------------|----------|
| Always-visible compact | Seed always in HUD | |
| Collapsible / Seed chip | Expand or copy on click | ✓ |
| URL-only + optional debug | Address bar primarily | |
| You decide | Claude picks | |

**User's choice:** Collapsible Seed chip

| Option | Description | Selected |
|--------|-------------|----------|
| Full session bootstrap | createGame from URL seed | ✓ |
| Next-round only | Apply to upcoming round | |
| Replace mid-session | Hard-reset on URL change | |
| You decide | Claude picks | |

**User's choice:** Full session bootstrap

| Option | Description | Selected |
|--------|-------------|----------|
| Reveal + copy | Copy seed string | ✓ |
| Reveal + copy share URL | Copy ?seed= URL | |
| Reveal only | No clipboard | |
| You decide | Claude picks | |

**User's choice:** Reveal + copy seed string

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed demo default | portfolio-demo | ✓ |
| Random each visit | New seed when no query | |
| Fixed default + sanitize | Fallback + rewrite URL | |
| You decide | Claude picks | |

**User's choice:** Fixed demo default `portfolio-demo`

---

## Session stats & keyboard cash-out

| Option | Description | Selected |
|--------|-------------|----------|
| Avg + max crash | From history ring | ✓ |
| Avg + max + count | Plus round count | |
| Max only | Session high only | |
| You decide | Claude picks | |

**User's choice:** Avg + max

| Option | Description | Selected |
|--------|-------------|----------|
| Near history strip | Labels by history pills | ✓ |
| Balance zone | Near balance | |
| Collapsed Stats chip | Expand pattern | |
| You decide | Claude picks | |

**User's choice:** Near history strip

| Option | Description | Selected |
|--------|-------------|----------|
| Space | Classic action key | |
| C | Mnemonic | |
| Enter | Primary mid-flight | |
| You decide | Space when not in input | ✓ (expanded) |

**User's choice:** Space **and** Enter; ignore while inputs focused
**Notes:** User selected option 4 and clarified both Space and Enter.

| Option | Description | Selected |
|--------|-------------|----------|
| Placeholders | — / n/a when empty | ✓ |
| Hide until data | No row until history | |
| Zeros | 0.00× | |
| You decide | Claude picks | |

**User's choice:** Placeholders

---

## Claude's Discretion

- Exact theater countdown typography within match-theater-× rule
- Exact HUD slots for mute + Seed chip within fixed bar budget
- Audio implementation behind AudioPort (Howler vs oscillators)
- Invalid-seed UX messaging beyond silent fallback
- Avg/max label copy; keyboard must respect existing cash-out enablement

## Deferred Ideas

- Copy shareable `?seed=` URL from chip (seed string only for v1)
- Real SFX asset files
- Countdown tick SFX / GO flash / crash-hold countdown
- Mid-session URL seed watching
