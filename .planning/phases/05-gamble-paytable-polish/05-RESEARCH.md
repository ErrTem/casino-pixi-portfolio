# Phase 5: Gamble + Paytable + Polish - Research

**Researched:** 2026-10-11
**Domain:** Client-only HOTLINE VHS gamble (double-or-nothing), DOM paytable/rules overlay, responsive HUD polish
**Confidence:** HIGH for in-repo integration (session busy FSM, FeatureOverlay, Wallet credit-on-settle, Zod paytable); MEDIUM for exact auto-close timing and VHS PNG list granularity (discretion)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### Gamble offer timing
- **D-01:** Add a **Gamble** control on the HOTLINE HUD (with Spin / bet). Disabled by default; enabled only when a **base line win** is available after win cycle + collectors/night settle — never mid-feature — **Reversibility:** costly — session busy FSM and Spin enable rules must treat gamble-offer as a settled-base state
- **D-02:** While Gamble is offered, **Spin keeps the win and clears the offer** (classic take-and-spin)
- **D-03:** After a successful SURVIVE, **return to base HUD**; Gamble stays enabled for the new amount until Spin (chain up to 10 rounds via repeated HUD entry, not a sticky VHS screen)
- **D-04:** **No explicit Collect / Take** button — Spin (or equivalent move-on) banks and clears Gamble

### VHS SURVIVE/DIE presentation
- **D-05:** Round plays in a **full-screen DOM overlay** (same family as `FeatureOverlay` / locker) — CURRENT WIN / GAMBLE TO WIN style chrome; not Pixi-on-CRT
- **D-06:** Player chooses with **two big buttons: SURVIVE / DIE** (equal-chance double-or-nothing; labels are the skin)
- **D-07:** On resolve: **instant result** on the overlay (amount update / DIE flash) then **auto-close** back to HUD — no Continue tap, no long result beat
- **D-08:** **Request a small PNG pack** for VHS frame / button art via the usual user art pipeline (`public/assets/hotline/`) — **Reversibility:** reversible — CSS-only fallback possible if art is late, but pack is the intended v1 look

### Paytable / rules overlay
- **D-09:** **Info / Paytable** button on the HOTLINE DOM strip (not shell-menu-only)
- **D-10:** Content is **one scrollable sheet** — sections stacked: symbols → phones & bonuses → gamble
- **D-11:** Symbol **payout numbers live from** the Zod-parsed `paytable` in config — **Reversibility:** costly — overlay becomes a consumer of the backend-shaped paytable contract
- **D-12:** Info may open **anytime**; opening **pauses play** until closed (X / dismiss)

### Responsive polish
- **D-13:** Desktop strip: **compact icon row** for Gamble / Info; Spin stays large
- **D-14:** Hard QA floor: **phone portrait ~360×640** — CRT + HUD usable, no horizontal scroll — **Reversibility:** costly — layout/CSS and touch targets are planned against this floor
- **D-15:** Must **adapt for desktop and mobile** (not desktop-only). Landscape: keep **portrait column + letterbox** (Phase 2 D-11) — no landscape redesign
- **D-16:** Mobile HUD is **spin-centric** like Witch Pots mobile — large center Spin; bet ±, Gamble, Info as compact icons around it — **Reversibility:** costly — diverges from current strip-only HUD; desktop may keep strip, mobile uses spin hub

### Carried from prior phases (do not reopen)
- Gamble skin is VHS SURVIVE/DIE, not card compare (PROJECT.md)
- GAMBLE-02: line wins only; not bonus feature totals
- DOM overlays for feature chrome; money controls out of `#game-canvas-host`
- Portrait-first composition; Retro Computer font; shell `AudioPort` beeps (Howler deferred)
- Busy/Spin lock through features and presentation (Phases 3–4)

### Claude's Discretion
- Exact busy-FSM edge cases for enabling Gamble after collectors/night (D-01 timing details)
- Landscape: letterbox only, no rotate-to-play nag unless height makes controls unusable
- Gamble beep event IDs and minor overlay copy tone
- Asset list granularity for VHS PNGs (planner drafts; user generates)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope. Howler sample packs and shell deep-link remain prior backlog / v2.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GAMBLE-01 | After a line win, user can play VHS SURVIVE/DIE to double or lose the win, up to 10 rounds | Pure `createGamble` + session DOM overlay (Patterns 1–3); config `features.gamble.maxRounds`; chain via HUD re-offer after SURVIVE (D-03) |
| GAMBLE-02 | Gamble applies to line wins only (not bonus feature totals) | Track `baseLineWinCents` at base `spin()` settle; never offer from `night.totalCents` / FS wins (Pitfall 1) |
| BASE-04 | Paytable/rules overlay explaining symbols, phones, bonuses, and gamble | DOM Info overlay + pure `paytableSheetModel(config)` consuming Zod `paytable` (Pattern 4, D-09..D-12) |
| PRES-02 | Layout remains playable on desktop and mobile viewport sizes | Portrait column + mobile spin hub CSS (Pattern 5); QA floor 360×640 (D-14..D-16) |
</phase_requirements>

## Project Constraints (from .cursor/rules/)

No `.cursor/rules/` directory in this repo. Enforce AGENTS.md / PROJECT constraints already in force: PixiJS v8 + TypeScript + Vite + Vitest; client-only JSON configs; art via user asset pipeline; lowercase comments without trailing periods or special symbols; Retro Computer font; no GSAP / `pixi-reels` / Howler in this phase; Witch Pots feature set only.

## Summary

Phase 4 left HOTLINE with a working night presenter: base spin settles line wins into the wallet immediately, collectors fly, then `createNight` drains features under a `busy` lock and `FeatureOverlay` splashes/lockers. Phase 5 adds three visitor-facing surfaces on top of that idle/busy seam — (1) a **Gamble** offer for **base line wins only**, (2) a **VHS SURVIVE/DIE** DOM overlay for each risk round, and (3) an **Info** scroll sheet that reads live `paytable` multipliers — plus a **responsive HUD** split (desktop icon strip vs mobile spin hub).

The dominant math hazard is that `HotlineGame.spin()` already credits `lastWinCents`, and free-spin settles overwrite `lastWinCents` / `lineWins` while a night is active. Gamble must therefore remember a separate **base-line stake** captured at base settle, offer only after presentation returns to idle (post-flights and post-night), and never treat feature/night totals as gambleable. Wallet needs a **debit** path for DIE because credit-only cannot reverse a credited win. Presentation must stay DOM (canvas host is `pointer-events: none`); VHS PNGs should load via CSS/`<img>` under `public/assets/hotline/`, **not** by extending the Pixi `HOTLINE_ASSET_URLS` list (pinned to 17 files).

**Primary recommendation:** Build pure `logic/gamble/createGamble.ts` + Wallet `debit` + Zod `features.gamble` first (seeded, Vitest), then session offer gating in `enterIdle` / Spin clear, then DOM VHS + Info overlays (sibling to `FeatureOverlay`), then HUD buttons + mobile spin-hub CSS. No new npm packages. Ship a small `05-ASSET-LIST` for VHS PNGs with CSS neon fallback.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Gamble pot, 50/50 resolve, max rounds, offer clear | Browser logic (`logic/gamble`, pure) | Session (when to open overlay) | Seedable + Vitest; architecture bans Pixi/document in logic |
| Capture base line win vs feature totals (GAMBLE-02) | Browser logic (`HotlineGame`) | Session (offer enable) | Base `spin()` is the only place that knows pre-night line win |
| Wallet credit/debit for SURVIVE/DIE | Browser logic (`Wallet`) | — | Money stays in cents; DIE needs debit |
| Config `features.gamble` + live paytable numbers | Config (Zod + JSON) | Info overlay consumes | CFG-01 backend-shaped; D-11 live payouts |
| VHS SURVIVE/DIE chrome + Info scroll sheet | DOM overlay (outside `#game-canvas-host`) | — | Canvas is non-interactive; layout tests forbid controls in host |
| Gamble / Info / Spin enable rules | DOM HUD + session busy FSM | — | D-01..D-04, D-12, D-13, D-16 |
| Responsive desktop strip vs mobile spin hub | CSS (`hud.css`) + `index.html` template | — | PRES-02 / D-14..D-16 |
| Gamble / Info beeps | Shared `AudioPort` (beep) | Session emits | Howler deferred; widen `SfxEvent` |
| VHS PNG art | Static CDN/public files | CSS fallback | User art pipeline; not Pixi Assets list |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `pixi.js` | `8.21.0` (pinned in package.json; npm latest `8.22.0`) | Existing CRT scene only — no Pixi gamble UI | Stay on pin; do not bump mid-phase |
| TypeScript | `~5.8.3` | Typed gamble/offer APIs | Existing |
| `zod` | `^4.6.5` (registry latest `4.6.6`) | Add required `features.gamble` object | Existing config boundary |
| `seedrandom` via `createRng` | `^3.0.5` | `${seed}:gamble` stream for SURVIVE/DIE | Existing RNG seam |
| Vitest | `^3.2.7` (installed; npm latest major `5.0.3` out of scope) | Pure gamble + paytable model + HUD enable tests | Existing node env |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| none | — | — | No new dependency for this phase |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| DOM VHS overlay | Pixi sprites on CRT + `pointer-events: auto` on canvas | Breaks VIS-02 layout tests and Phase 2 canvas-noninteractive contract. Use DOM |
| Pixi `DOMContainer` for gamble | Sibling HTML overlay (FeatureOverlay family) | `DOMContainer` couples to scene transforms; repo already has a working overlay binder. Stay sibling DOM |
| Howler sample pack | Keep beep `AudioPort` | CONTEXT / PROJECT defer Howler. Widen `SfxEvent` only |
| Optional Zod `gamble?` | Required `features.gamble` | Optional soft-fails CFG-01 loud-parse culture. Require the object |

**Installation:** none.

**Version verification (this session):** `package.json` pins `pixi.js` `8.21.0`, `zod` `^4.6.5`, `seedrandom` `^3.0.5`, `vitest` `^3.2.7`; `npx vitest --version` → `vitest/3.2.7`; `node` `v24.18.0`; `npm view` latest: pixi `8.22.0`, zod `4.6.6`. [VERIFIED: package.json:14-24]

## Package Legitimacy Audit

No external packages are installed by this phase. Legitimacy check was run on already-pinned stack packages only; registry “too-new” SUS on latest publish dates for `pixi.js` / `zod` / `vitest` is **ignored for disposition** because this phase does not install or bump them.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| *(none new)* | — | — | — | — | — | No install |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none for planned installs (planner must not add GSAP, Howler, or `pixi-reels`)

## Architecture Patterns

### System Architecture Diagram

```
base SPIN (settled)
   |
   v
HotlineGame.spin()
   | credit line wins to Wallet
   | baseLineWinCents = sum(lineWins)   <--- gamble pot source (GAMBLE-02)
   | resolveCollectors -> maybe createNight
   v
session present: reels -> win_gate -> flights
   |
   +-- night active? --yes--> night presenter (busy) --> enterIdle
   |                                                    |
   +-- no ---------------------------------------------+
                                                       v
                                              offerGamble if baseLineWinCents > 0
                                              HUD: Gamble enabled, Spin enabled
                                                       |
              +---------------- Spin click ------------+---------------- Gamble click
              | clears offer, starts next spin         |
              v                                        v
            (normal spin)                    DOM VHS overlay (present=gamble, busy)
                                             CURRENT WIN / GAMBLE TO WIN
                                             SURVIVE | DIE
                                                       |
                                             createGamble.resolve(rng)
                                             SURVIVE: credit stake, stake*=2, rounds++
                                             DIE: debit stake, clear offer
                                             flash result -> auto-close (~0.6-0.9s)
                                                       |
                                             SURVIVE & rounds < max -> re-enable Gamble
                                             else clear offer -> idle HUD

Info button (anytime):
   open scroll sheet -> setBusy(true) / pause -> dismiss -> resume
   body from paytableSheetModel(config) + static phones/gamble copy
```

### Recommended Project Structure
```
src/games/hotline/
├── config/
│   ├── HotlineConfigSchema.ts    # + features.gamble { maxRounds, surviveChance }
│   └── hotline.config.json       # + gamble: { maxRounds: 10, surviveChance: 0.5 }
├── logic/
│   ├── gamble/
│   │   ├── createGamble.ts       # pure pot / resolve / rounds
│   │   └── createGamble.test.ts
│   ├── Wallet.ts                 # + debit(cents)
│   ├── HotlineGame.ts            # baseLineWinCents, offer/clear/resolveGamble APIs
│   └── index.ts
├── hud/
│   ├── FeatureOverlay.ts         # keep splash/lockers
│   ├── GambleOverlay.ts          # VHS SURVIVE/DIE binder (or extend FeatureOverlay)
│   ├── PaytableOverlay.ts        # scroll sheet + dismiss
│   ├── paytableSheetModel.ts     # pure rows from HotlineConfig
│   └── HotlineHud.ts             # Gamble/Info buttons, setGambleEnabled, setInfoOpen wiring
├── session/
│   └── mountHotlineSession.ts    # offer after enterIdle; Spin clears; Info pause
└── ...
public/assets/hotline/            # + vhs-*.png (DOM/CSS; not HOTLINE_ASSET_URLS)
index.html                        # hud buttons + overlay markup in template
src/styles/hud.css                # overlay + desktop icons + mobile spin hub
src/shared/audio/AudioPort.ts     # + gamble_open / gamble_survive / gamble_die (discretion names)
.planning/phases/05-.../05-ASSET-LIST.md
```

### Pattern 1: Pure gamble pot machine
**What:** `createGamble({ maxRounds, surviveChance })` with `offer(stake)`, `resolve(rng)`, `clear()`, snapshot `{ stakeCents, roundsDone, offered }`.
**When to use:** All SURVIVE/DIE math and round caps.
**Example:**
```typescript
// Source: in-repo pattern mirrored from createPickEm / createHoldAndWin
export type GambleResolve = {
  survived: boolean;
  stakeCents: number;
  roundsDone: number;
  offered: boolean;
};

export function createGamble(args: {
  maxRounds: number;
  surviveChance: number;
}): {
  offer(stakeCents: number): void;
  clear(): void;
  resolve(rng: { next(): number }): GambleResolve | null;
  snapshot(): { stakeCents: number; roundsDone: number; offered: boolean };
};
```

### Pattern 2: Base-line stake capture (GAMBLE-02)
**What:** On base `spin()` only, store `baseLineWinCents` from the line-win sum before any night/FS overwrites `lastWinCents`. Offer uses that pot (or the live gamble stake after SURVIVE doublings), never `night.totalCents`.
**When to use:** Every base settle path.

Verbatim settle credit today:
```164:165:src/games/hotline/logic/HotlineGame.ts
      lastWinCents = lineWins.reduce((sum, w) => sum + w.payoutCents, 0);
      wallet.credit(lastWinCents);
```
[VERIFIED: src/games/hotline/logic/HotlineGame.ts:164-165]

### Pattern 3: Session offer gate in `enterIdle`
**What:** After flights and night complete, `enterIdle` calls offer enable when `baseLineWinCents > 0` (or gamble still offered after SURVIVE). Mid-feature / splash / hold / pick keep Gamble disabled. Spin wrapper clears offer then spins (D-02).
**When to use:** Single place for D-01 timing (discretion: after collectors+night, not after win_gate alone).

### Pattern 4: Paytable sheet model from Zod config
**What:** Pure function maps `config.paytable` + symbol labels → section rows; overlay binder only does `textContent` / `createElement` (no `innerHTML`).
**When to use:** BASE-04 / D-11.

Verbatim paytable schema:
```120:120:src/games/hotline/config/HotlineConfigSchema.ts
    paytable: z.record(z.string(), payoutRow),
```
[VERIFIED: src/games/hotline/config/HotlineConfigSchema.ts:120]

Verbatim sample rows:
```61:69:src/games/hotline/config/hotline.config.json
  "paytable": {
    "pistol": { "3": 5, "4": 20, "5": 100 },
    "cassette": { "3": 4, "4": 15, "5": 60 },
    "car": { "3": 3, "4": 10, "5": 40 },
    "ace": { "3": 2, "4": 6, "5": 20 },
    "king": { "3": 1.5, "4": 5, "5": 15 },
    "queen": { "3": 1, "4": 4, "5": 10 },
    "jack": { "3": 0.8, "4": 3, "5": 8 },
    "ten": { "3": 0.5, "4": 2, "5": 6 }
  },
```
[VERIFIED: src/games/hotline/config/hotline.config.json:61-69]

### Pattern 5: Desktop strip vs mobile spin hub
**What:** Keep `.hotline-screen { max-width: 34rem }` letterbox; at a narrow breakpoint (~`max-width: 480px` or similar) reflow `.hotline-bar` into a spin-centric hub (large center Spin; bet ± / Gamble / Info as icon buttons ≥44px targets).
**When to use:** PRES-02 / D-13 / D-16.

Verbatim portrait column:
```943:947:src/styles/hud.css
.hotline-screen {
  position: relative;
  width: 100%;
  max-width: 34rem;
  margin-inline: auto;
}
```
[VERIFIED: src/styles/hud.css:943-947]

### Anti-Patterns to Avoid
- **Gamble on night/FS totals:** Violates GAMBLE-02; FS overwrites `lastWinCents`.
- **Pixi gamble buttons:** Canvas host is non-interactive.
- **Adding VHS files to `HOTLINE_ASSET_URLS`:** Asset test pins length to the Pixi pack (17 files).
- **Sticky full-screen VHS between rounds:** D-03 returns to HUD after each resolve.
- **Collect button:** D-04 — Spin banks.
- **`innerHTML` for paytable:** Follow FeatureOverlay `textContent` / `createElement` only.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Seeded U(0,1) for SURVIVE/DIE | `Math.random` | `createRng(\`${seed}:gamble\`)` | Demo seed parity with Crash/HOTLINE |
| Money formatting | ad-hoc strings | existing `formatMoney` / `centsToDisplay` | Cent integer safety |
| Overlay tap chrome | new Pixi UI kit | `FeatureOverlay`-family DOM binder | Proven busy + dispose path |
| Config validation | hand guards | Zod `features.gamble` object | CFG-01 fail-loud |
| Touch-target inventing | random icon sizes | min 44×44 CSS px targets [CITED: https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced] | Mobile QA floor |

**Key insight:** The hard part is offer eligibility and wallet debit around already-credited base wins — not the 50/50 coin flip.

## Common Pitfalls

### Pitfall 1: Offering gamble from overwritten `lastWinCents`
**What goes wrong:** After a combo night, HUD offers gamble on an FS line win or night total.
**Why it happens:** `spinFree()` overwrites `lastWinCents` and credits again.
**How to avoid:** Capture `baseLineWinCents` only in base `spin()`; clear it on next base spin or when offer clears without SURVIVE chain; never read `night.totalCents` for offer.
**Warning signs:** Tests that spin into green then enable Gamble with FS win amount.

### Pitfall 2: DIE without Wallet debit
**What goes wrong:** Player loses VHS round but balance stays inflated.
**Why it happens:** `Wallet.credit` ignores non-positive amounts; no debit API today.
**How to avoid:** Add `debit(amountCents)` used only by gamble DIE (and unit-test balance math).
**Warning signs:** SURVIVE then DIE leaves balance ≥ pre-gamble + original win.

Verbatim credit guard:
```34:37:src/games/hotline/logic/Wallet.ts
  credit(amountCents: Cents): void {
    if (!Number.isFinite(amountCents) || amountCents <= 0) return;
    this.balanceCents += Math.floor(amountCents);
  }
```
[VERIFIED: src/games/hotline/logic/Wallet.ts:34-37]

### Pitfall 3: Enabling Gamble mid-feature / mid-flights
**What goes wrong:** Player opens VHS during token flights or locker picks.
**Why it happens:** Offer tied only to `lineWins.length` at reel settle.
**How to avoid:** Gate on `present === "idle"` (post-`enterIdle`) and `!game.isNightActive()`.
**Warning signs:** `setGambleEnabled(true)` called from `onReelsSettled`.

### Pitfall 4: Extending Pixi asset URL list for VHS art
**What goes wrong:** `tests/hotline.assets.test.ts` fails length/signature checks; mount blocks on missing textures.
**Why it happens:** VHS chrome is mistaken for scene textures.
**How to avoid:** DOM/CSS/`<img src="/assets/hotline/vhs-...">`; keep `HOTLINE_ASSET_URLS` unchanged; CSS neon fallback if PNGs late (D-08).
**Warning signs:** Diff adding `vhs-` URLs inside `loadHotlineAssets.ts`.

### Pitfall 5: Info open does not pause Spin
**What goes wrong:** Player spins under an open rules sheet (D-12).
**Why it happens:** Info treated as decorative.
**How to avoid:** Info open → `hud.setBusy(true)` (and block Gamble entry); dismiss restores prior idle offer state.
**Warning signs:** Spin click works while paytable `hidden` is false.

### Pitfall 6: Horizontal scroll at 360×640
**What goes wrong:** PRES-02 fails on phone portrait.
**Why it happens:** Desktop strip widths / overlay min-widths exceed viewport.
**How to avoid:** QA against ~360×640; `min-width: 0` grids; overlay `width: min(100%, …)`; icon buttons not a wide flex row that overflows.
**Warning signs:** `overflow-x` on `body` / `.hotline-screen` in DevTools.

## Code Examples

### Zod `features.gamble` (required)
```typescript
// Source: Zod 4 object fields required by default — https://zod.dev/api?id=objects
// Mirror freeSpinsSchema / pickEmSchema style in HotlineConfigSchema.ts
const gambleSchema = z.object({
  maxRounds: positiveInt, // 10
  surviveChance: chance01, // 0.5 equal chance
});

const featuresSchema = z.object({
  tokenOdds: tokenOddsSchema,
  bonusPrizes: z.array(bonusPrizeSchema).min(1),
  jackpotMultipliers: jackpotMultipliersSchema,
  freeSpins: freeSpinsSchema,
  holdAndWin: holdAndWinSchema,
  pickEm: pickEmSchema,
  gamble: gambleSchema,
});
```

### Wallet debit for DIE
```typescript
// Source: extend src/games/hotline/logic/Wallet.ts (read this session)
debit(amountCents: Cents): boolean {
  if (!Number.isInteger(amountCents) || amountCents <= 0) return false;
  if (amountCents > this.balanceCents) return false;
  this.balanceCents -= amountCents;
  return true;
}
```

### Session Spin clears offer (D-02)
```typescript
// Source: wrap pattern from mountHotlineSession hudGame.spin (read this session)
spin(): SpinResult {
  if (busy || view?.scene.isSpinning()) return { ok: false, reason: "" };
  game.clearGambleOffer(); // bank: win already credited
  hud.setGambleEnabled(false);
  const result = game.spin();
  if (result.ok && view) startReels(true);
  return result;
}
```

### CURRENT WIN / GAMBLE TO WIN labels
```typescript
// Source: Witch Pots chrome language from 05-CONTEXT specifics (skin is SURVIVE/DIE)
// current = stake; gambleToWin = stake * 2
overlay.showGamble({
  currentWin: formatCents(stake),
  gambleToWin: formatCents(stake * 2),
  onSurvive: () => resolvePick("survive"),
  onDie: () => resolvePick("die"),
});
```

### Existing SfxEvent union to widen
```1:19:src/shared/audio/AudioPort.ts
/** key SFX demo events, one closed union shared by every game */
export type SfxEvent =
  | "bet_lock"
  | "takeoff"
  | "cash_out"
  | "crash"
  | "spin"
  | "reel_stop"
  | "win"
  | "token_spawn"
  | "token_land"
  | "phone_trigger"
  | "queue_step"
  | "feature_start"
  | "feature_end"
  | "hold_land"
  | "hold_respin"
  | "pick_reveal"
  | "jackpot";
```
[VERIFIED: src/shared/audio/AudioPort.ts:1-19]

Recommend adding (discretion names): `"gamble_open" | "gamble_survive" | "gamble_die"` with pitches in `PITCH_HZ` and tests in `createBeepAudioPort.test.ts`.

### Canvas non-interactive (must stay)
```137:145:src/styles/hud.css
  pointer-events: none;
}

.canvas-host canvas {
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
```
[VERIFIED: src/styles/hud.css:137-145]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Architecture draft Collect + sticky gamble phase | CONTEXT: Spin banks; HUD re-entry chain; no Collect | Phase 5 discuss 2026-10-11 | Do not implement Collect CTA from ARCHITECTURE.md |
| Research SUMMARY “Phase 7 gamble” | Roadmap Phase 5 bundles gamble + paytable + polish | Milestone roadmap | One phase, three surfaces |
| Pixi-interactive canvas | DOM overlays + `pointer-events: none` canvas | Phases 2–4 | Keep for VHS + Info |

**Deprecated/outdated:**
- ARCHITECTURE.md “Collect” control and sticky gamble phase naming — superseded by 05-CONTEXT D-02..D-04
- Howler for this phase — deferred

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Auto-close result beat ~600–900ms is acceptable under D-07 “no long result beat” | Claude's Discretion | Feels snappy or too abrupt; easy CSS/timer tweak |
| A2 | Narrow breakpoint ~480px is enough to switch desktop strip → mobile spin hub | Pattern 5 | May need 720px alignment with existing Crash media query |
| A3 | VHS PNGs as DOM/CSS assets need not update `HOTLINE_ASSET_URLS` | Pitfall 4 | If planner wrongly extends Pixi list, asset tests break |
| A4 | After base win + night, gamble stake is the original base line win (not remaining after feature credits) | Pattern 2 / GAMBLE-02 | User may expect “last shown win”; CONTEXT says base line win |
| A5 | Equal chance means `surviveChance: 0.5` in config (still illustrative RTP) | Standard Stack | Can retune JSON without code change if weighted later |

**If this table is empty:** N/A — five assumptions listed for discuss/planner confirmation.

## Open Questions

1. **Gamble after base win that also starts a night**
   - What we know: D-01 says after win cycle + collectors/night settle; GAMBLE-02 excludes bonus totals.
   - What's unclear: Whether players expect no gamble when a phone triggered (some live games skip risk after feature).
   - Recommendation: **Still offer** on the captured base line win after night returns to idle (matches literal D-01 + GAMBLE-02).

2. **Info during gamble overlay**
   - What we know: Info may open anytime and pauses play (D-12).
   - What's unclear: Stacking Info above an open VHS round.
   - Recommendation: Allow Info to open; keep gamble overlay underneath paused (no SURVIVE/DIE until Info closes), or disable Info while `present === "gamble"` — pick one in plan; prefer **disable Info during open VHS** for simpler FSM.

3. **Exact VHS PNG filenames / count**
   - What we know: D-08 wants a small pack; CSS fallback OK.
   - What's unclear: Frame vs button vs noise layers.
   - Recommendation: Planner drafts `05-ASSET-LIST.md` with 3 files: `vhs-gamble-panel.png`, `vhs-btn-survive.png`, `vhs-btn-die.png`.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vitest / Vite | ✓ | v24.18.0 | — |
| npm | scripts | ✓ | 11.16.0 | — |
| Vitest | unit tests | ✓ | 3.2.7 | — |
| Browser DevTools device mode | PRES-02 QA 360×640 | ✓ (local) | — | Manual resize |
| User-supplied VHS PNGs | D-08 intended look | ✗ until handoff | — | CSS neon fallback |

**Missing dependencies with no fallback:** none blocking code (art has CSS fallback).

**Missing dependencies with fallback:** VHS PNG pack → CSS-only overlay chrome.

Step 2.6 note: Phase is code/config/CSS plus optional static PNGs; no new external services.

## Security Domain

> `security_enforcement` not set to `false` in `.planning/config.json` — section required. Client-only portfolio demo (no auth backend).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | N/A — no accounts |
| V3 Session Management | no | Shell session dispose only |
| V4 Access Control | no | N/A |
| V5 Input Validation | yes | Zod parse of HOTLINE JSON at mount; gamble overlay indexes clamped; paytable render via `textContent` not `innerHTML` |
| V6 Cryptography | no | Demo RNG only (`seedrandom`); not fair/certified |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via paytable/rules copy | Tampering | `textContent` / `createElement` only (FeatureOverlay pattern) |
| Prototype pollution / bad config | Tampering | Zod `HotlineConfigSchema.parse` fail-loud; no soft defaults |
| Balance desync via gamble spam | Tampering | Busy lock while overlay open; pure resolve once per click; debit/credit integer cents |
| Clickjacking portfolio iframe | Info disclosure | Out of scope for v1; no secrets in client |

## Sources

### Primary (HIGH confidence)
- `src/games/hotline/session/mountHotlineSession.ts` — busy / present / `enterIdle` / FeatureOverlay wiring (read this session)
- `src/games/hotline/logic/HotlineGame.ts` — base credit + night overwrite of `lastWinCents` (read this session)
- `src/games/hotline/logic/Wallet.ts` — credit-only today (read this session)
- `src/games/hotline/hud/FeatureOverlay.ts` — DOM overlay binder pattern (read this session)
- `src/games/hotline/config/HotlineConfigSchema.ts` + `hotline.config.json` — paytable contract (read this session)
- `src/styles/hud.css` — portrait column + pointer-events none (read this session)
- `src/shared/audio/AudioPort.ts` — closed `SfxEvent` union (read this session)
- `tests/hotline.assets.test.ts` — 17-file Pixi pack pin (read this session)
- `.planning/phases/05-gamble-paytable-polish/05-CONTEXT.md` — locked decisions (read this session)

### Secondary (MEDIUM confidence)
- [PixiJS v8 Events guide](https://pixijs.com/8.x/guides/components/events) — canvas federated events; reinforces DOM overlays when canvas is non-interactive [CITED]
- [Zod 4 objects / optionals](https://zod.dev/api?id=objects) — required-by-default object fields [CITED]
- [WCAG 2.5.5 Target Size (Enhanced)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced) — 44×44 CSS px [CITED]
- `.planning/research/ARCHITECTURE.md` — gamble module placement (partially superseded by CONTEXT on Collect)

### Tertiary (LOW confidence)
- WebSearch digests on slot risk-game UX — used only to confirm double-or-nothing / max-rounds tropes; CONTEXT overrides Collect [ASSUMED community practice]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — reuse pinned packages; no installs
- Architecture: HIGH — seams read in-repo; CONTEXT locks presentation
- Pitfalls: HIGH — wallet debit + base-line capture are concrete failure modes from current code

**Research date:** 2026-10-11
**Valid until:** 2026-11-10 (stable stack; re-check if HUD template diverges)

## Validation Architecture

Skipped — `.planning/config.json` has `workflow.nyquist_validation: false`.
