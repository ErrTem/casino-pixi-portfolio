# Phase 4: Three Bonuses + Combo Nights - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-11
**Phase:** 4-Three Bonuses + Combo Nights
**Areas discussed:** Green free-spins pace + chrome, Red Hold & Win stage, Purple locker Pick'em shape, Combo nesting during free spins

**Pre-discuss:** User asked to play live 3 Witch Pots demo; comparison informed Hold staging and splash cadence choices.

---

## Green free-spins pace + chrome

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-run all 24 | Continuous FS like Witch Pots | ✓ |
| Tap Spin each free spin | Manual pace | |
| You decide | Claude discretion | |

**User's choice:** Auto-run all 24

| Option | Description | Selected |
|--------|-------------|----------|
| DOM strip | Remaining count with HUD chrome | ✓ |
| Pixi over CRT | On-scene counter | |
| Both | Pixi + DOM echo | |
| You decide | Claude discretion | |

**User's choice:** DOM strip

| Option | Description | Selected |
|--------|-------------|----------|
| Full-screen splash then auto-run | Tap gate then FS | ✓ |
| Soft banner only | No tap gate | |
| No intro | Jump straight in | |
| You decide | Claude discretion | |

**User's choice:** Full-screen splash then auto-run

| Option | Description | Selected |
|--------|-------------|----------|
| Total-win splash then back | Tap exit | ✓ |
| Soft DOM toast | No tap | |
| Silent return | Just clear chrome | |
| You decide | Claude discretion | |

**User's choice:** Total-win splash then back

---

## Red Hold & Win stage

| Option | Description | Selected |
|--------|-------------|----------|
| In-place CRT transform | Same 5×4 window as Witch Pots Hold | ✓ |
| Separate full-screen overlay | Dedicated Hold scene | |
| You decide | Claude discretion | |

**User's choice:** In-place CRT transform

| Option | Description | Selected |
|--------|-------------|----------|
| Full-screen splash then Hold | Match Green cadence | ✓ |
| Soft banner only | Faster entry | |
| You decide | Claude discretion | |

**User's choice:** Full-screen splash then Hold

| Option | Description | Selected |
|--------|-------------|----------|
| Jackpot strip replaces phones | MIN/MID/MAX/ULTRA | ✓ |
| Keep phones + jackpots elsewhere | | |
| Phones dimmed, no jackpot strip | | |
| You decide | Claude discretion | |

**User's choice:** Jackpot strip replaces phones

| Option | Description | Selected |
|--------|-------------|----------|
| Total-win splash with jackpot callout | Tap exit | ✓ |
| Soft DOM total | No tap | |
| Silent settle | | |
| You decide | Claude discretion | |

**User's choice:** Total-win splash with jackpot callout

---

## Purple locker Pick'em shape

| Option | Description | Selected |
|--------|-------------|----------|
| Pick until Collect/end | Classic stopper | |
| Fixed pick count | Predictable demo length | ✓ |
| Clear-all | Open every locker | |
| Witch Pots match jackpots | 3 matching awards | |
| You decide | Claude discretion | |

**User's choice:** Fixed pick count

| Option | Description | Selected |
|--------|-------------|----------|
| Full-screen locker overlay | Dedicated mini-game | ✓ |
| In-place over CRT | Hold-like transform | |
| You decide | Claude discretion | |

**User's choice:** Full-screen locker overlay

| Option | Description | Selected |
|--------|-------------|----------|
| 12 lockers, 5 picks | Compact portrait | ✓ |
| 16 lockers, 5 picks | Closer to 16-cell WP | |
| 16 lockers, 3 picks | Shorter | |
| You decide | Claude discretion | |

**User's choice:** 12 lockers, 5 picks

| Option | Description | Selected |
|--------|-------------|----------|
| Splash both ends with tap | Match Green/Red | ✓ |
| Exit splash only | | |
| Soft banners both ends | | |
| You decide | Claude discretion | |

**User's choice:** Splash both ends with tap

---

## Combo nesting during free spins

| Option | Description | Selected |
|--------|-------------|----------|
| Pause FS → nest Red/Purple → resume FS | True nesting | ✓ |
| Finish all FS then drain | Sequential only | |
| Hybrid same-spin wait | | |
| You decide | Claude discretion | |

**User's choice:** Pause FS → nest → resume

| Option | Description | Selected |
|--------|-------------|----------|
| Full night path + highlight current | Readable nested state | ✓ |
| Only nested feature name | Quieter | |
| Hide combo strip during features | | |
| You decide | Claude discretion | |

**User's choice:** Full night path + highlight current

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — config-driven FS retrigger | Mid-feature adds | ✓ |
| No retrigger in v1 | Fixed 24 | |
| You decide | Claude discretion | |

**User's choice:** Yes retrigger

| Option | Description | Selected |
|--------|-------------|----------|
| One night-total splash | Sum feature wins | ✓ |
| No night total | Per-feature exits only | |
| You decide | Claude discretion | |

**User's choice:** One night-total splash

---

## Claude's Discretion

- Illustrative math numbers in sample JSON
- Splash copy / neon / Hold empty-cell theme / locker layout within 12 cells
- Respin-lives chrome details
- Whether single-feature nights skip the night-total splash

## Deferred Ideas

None new — Phase 5 gamble/paytable/polish and Howler remain roadmap-deferred
