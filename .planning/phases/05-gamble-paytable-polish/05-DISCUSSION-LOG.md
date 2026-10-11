# Phase 5: Gamble + Paytable + Polish - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-11
**Phase:** 5-Gamble + Paytable + Polish
**Areas discussed:** Gamble offer timing, VHS SURVIVE/DIE presentation, Paytable / rules overlay, Responsive polish bar

---

## Gamble offer timing

| Option | Description | Selected |
|--------|-------------|----------|
| After win cycle, before diskette flights | Gamble first; tokens wait | |
| After tokens settle, only if no phone triggered | Flights first; gamble only on pure base | |
| Always after full settle, never mid-night | Tokens/night finish first | |
| You decide + HUD Gamble button | Opt-in button disabled until line win | ✓ |

**User's choice:** You decide for FSM timing; add Gamble button below, disabled by default, enabled after win available. Clarified VHS = double-or-nothing. Ref: Witch Pots gamble panel screenshot.
**Notes:** Spin keeps win and clears offer. After SURVIVE return to HUD with Gamble still enabled. No Collect button — Spin only.

---

## VHS SURVIVE/DIE presentation

| Option | Description | Selected |
|--------|-------------|----------|
| Full-screen DOM overlay | FeatureOverlay family | ✓ |
| Pixi panel over CRT | In-scene tape | |
| Hybrid | DOM chrome + Pixi sting | |
| You decide | | |

**User's choice:** DOM overlay; two SURVIVE/DIE buttons; instant result auto-close; request PNG pack.
**Notes:** Not card pick; skin replaces Witch Pots cards.

---

## Paytable / rules overlay

| Option | Description | Selected |
|--------|-------------|----------|
| Info on HOTLINE strip | Always when allowed | ✓ |
| Shell menu only | | |
| Tabs vs one scroll sheet | User asked what “content” meant; chose scroll | ✓ (scroll) |
| Live config payouts vs static | Live from paytable | ✓ |
| Idle-only vs anytime (pauses) | Anytime, pauses play | ✓ |

**User's choice:** Info button; one scroll sheet (symbols → phones → gamble); live numbers; open anytime pauses play.
**Notes:** Clarified BASE-04 content before layout choice.

---

## Responsive polish bar

| Option | Description | Selected |
|--------|-------------|----------|
| Compact icon row for Gamble/Info | Desktop strip | ✓ |
| Phone ~360×640 hard floor | | ✓ |
| Landscape letterbox / rotate hint / you decide | You decide + must adapt desktop and mobile | ✓ |
| Spin-centric mobile vs keep strip | Spin-centric like Witch Pots mobile | ✓ |

**User's choice:** Adapt for desktop and mobile; provided mobile screenshot; spin-centric phone HUD.
**Notes:** Live demo checked at newslotgames.net Endorphina 3 Witch Pots. Refs saved under phase dir.

---

## Claude's Discretion

- Exact enable timing after collectors/night settle (within D-01)
- Landscape: portrait column + letterbox, no redesign
- Gamble SFX event IDs / minor copy
- VHS asset list detail for planner

## Deferred Ideas

None in-scope creep captured.
