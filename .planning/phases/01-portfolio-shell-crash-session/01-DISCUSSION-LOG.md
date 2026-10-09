# Phase 1: Portfolio Shell + Crash Session - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-09
**Phase:** 1-Portfolio Shell + Crash Session
**Areas discussed:** Menu composition, HOTLINE stub, Crash session on leave, Shell chrome

---

## Menu composition

| Option | Description | Selected |
|--------|-------------|----------|
| Full-bleed brand menu | Big title, atmosphere, games secondary | |
| Minimal game list | Dark shell, short title, Crash/HOTLINE picks | ✓ |
| You decide | Claude picks tone | |

**User's choice:** Minimal game list

| Option | Description | Selected |
|--------|-------------|----------|
| Text rows | Title + blurb | |
| Compact tiles | Short name + chip | |
| You decide | Simplest extensible pattern | |

**User's choice:** Compact tiles + game icon (freeform on option 3)
**Notes:** User asked for icons on compact tiles, not plain tiles alone

| Option | Description | Selected |
|--------|-------------|----------|
| Quiet header | Small/no title | |
| Named header | Retro Computer portfolio title then tiles | ✓ |
| You decide | | |

**User's choice:** Named header

| Option | Description | Selected |
|--------|-------------|----------|
| Empty dark shell | No Pixi on menu | ✓ |
| Idle canvas backdrop | Ambient Pixi behind DOM menu | |
| You decide | | |

**User's choice:** Empty dark shell

---

## HOTLINE stub

| Option | Description | Selected |
|--------|-------------|----------|
| Visible, disabled | Coming soon, not clickable | ✓ |
| Clickable placeholder | Short coming-soon screen | |
| Hidden | Crash only until Phase 2 | |

**User's choice:** Visible, disabled

| Option | Description | Selected |
|--------|-------------|----------|
| Coming soon | Status chip | ✓ |
| HOTLINE + locked | Title only, muted/lock styling | |
| You decide | | |

**User's choice:** Coming soon

| Option | Description | Selected |
|--------|-------------|----------|
| Placeholder marks | Letter/geometry stand-ins | |
| Request art now | User generates icons for Phase 1 | ✓ |
| You decide | | |

**User's choice:** Request art now — user will generate after asset list

| Option | Description | Selected |
|--------|-------------|----------|
| Crash first, HOTLINE second | | ✓ |
| HOTLINE first, Crash second | | |
| You decide | | |

**User's choice:** Crash first, HOTLINE second

---

## Crash session on leave

| Option | Description | Selected |
|--------|-------------|----------|
| Fresh every launch | Tear down; reset balance/history | ✓ |
| Keep until reload | Resume in-memory | |
| You decide | | |

**User's choice:** Fresh every launch

| Option | Description | Selected |
|--------|-------------|----------|
| Abandon cleanly | No settle; stop tickers | ✓ |
| Force settle first | Auto cash/crash before leave | |
| You decide | | |

**User's choice:** Abandon cleanly

| Option | Description | Selected |
|--------|-------------|----------|
| Same boot seed again | Reuse page-boot `?seed=` | ✓ |
| New seed each launch | Random after first boot | |
| You decide | | |

**User's choice:** Same boot seed again

| Option | Description | Selected |
|--------|-------------|----------|
| Shell-owned audio | One AudioPort for menu + Crash | ✓ |
| Recreate with Crash | New port each launch | |
| You decide | | |

**User's choice:** Shell-owned audio

---

## Shell chrome

| Option | Description | Selected |
|--------|-------------|----------|
| Always visible demo label | Persistent on menu + Crash | (initially picked, then revised) |
| Menu only | Label on menu only | |
| Skip dedicated label | Existing demo voice covers SHELL-04 | ✓ |
| Menu-only one-liner | Explicit no-real-money on menu | |
| Defer SHELL-04 | Later polish | |

**User's choice:** Skip dedicated label
**Notes:** User asked why a DEMO label is needed when Crash has none. Clarified SHELL-04 intent; chose option 1 — rely on title / Reset demo / menu copy.

| Option | Description | Selected |
|--------|-------------|----------|
| Top chrome Menu button | Next to mute / Reset demo | ✓ |
| Keyboard only | Esc (+ maybe tiny control) | |
| You decide | | |

**User's choice:** Top chrome Menu button

| Option | Description | Selected |
|--------|-------------|----------|
| Mute on menu | Same pref as Crash | ✓ |
| Crash only | Mute after launch | |
| You decide | | |

**User's choice:** Mute on menu

| Option | Description | Selected |
|--------|-------------|----------|
| Rename to portfolio-demo:mute | Migrate old key once | ✓ |
| Keep crash-demo:mute | | |
| You decide | | |

**User's choice:** Rename to `portfolio-demo:mute` with one-time migrate

---

## Claude's Discretion

- Exact menu title string and tile microcopy
- Coming soon chip styling details
- Mute-key migration helper shape

## Deferred Ideas

None from discussion. v2 deep-link / shared wallet already deferred in REQUIREMENTS.md.
