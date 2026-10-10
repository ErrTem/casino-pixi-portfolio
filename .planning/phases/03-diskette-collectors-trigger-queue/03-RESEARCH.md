# Phase 3: Diskette Collectors + Trigger Queue - Research

**Researched:** 2026-10-10
**Domain:** Client-only PixiJS v8 HOTLINE collectors (token flight, phone meters, combo queue stub)
**Confidence:** HIGH (brownfield HOTLINE Phase 2 code + locked CONTEXT); MEDIUM (exact stub beat timings / illustrative `triggerChance` values — discretionary)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Rename `tokenOdds.perSpinChance` keys from pink/cyan/yellow to **green / red / purple** in Zod + `hotline.config.json` so config colors match phone art — **Reversibility:** costly — schema, sample JSON, and any fixtures/tests that assert the old color names must migrate together
- **D-02:** On a successful per-color spawn roll, show the diskette as an **overlay on a random cell** (does not replace the reel symbol), then fly to the matching phone
- **D-03:** Flight motion is a **short neon arc** (bezier hop with ticker easing — same motion stack as Crash/HOTLINE reels, no GSAP)
- **D-04:** If multiple colors hit on the same spin, fly **in parallel** (all arcs at once)
- **D-05:** Fill feedback is **discrete signal bars under each phone** (0…`meterTarget` steps)
- **D-06:** `meterTarget` is a **soft cap** — bars fill to N and stay full; more tokens can still land/fly; trigger odds are **not** raised by fill level
- **D-07:** Reset **that phone's** meter when **that phone's** bonus triggers (other phones keep their counts)
- **D-08:** Draw bars with **procedural Pixi Graphics** — no dedicated meter PNG pack for v1
- **D-09:** Add per-color **`triggerChance`** under features/`tokenOdds` (Zod + JSON); independent roll **on each token land** after the arc completes — **Reversibility:** costly — becomes part of the backend-shaped config contract Phase 4 expects
- **D-10:** Combo presentation = **phone glow + DOM queue strip** (e.g. `COMBO: Green → Red`) — keep monetary controls out of `#game-canvas-host`
- **D-11:** Queue order is **fixed Green → Red → Purple**, including only phones that fired that spin
- **D-12:** Phase 3 stub **highlights + short beat per queue entry**, pops the entry, resets that phone's meter as it pops, then returns to base play — no fake mini-games and no Continue taps between steps
- **D-13:** Run token overlays/flights **after the win cycle finishes** (or immediately after reel stop when there are no wins)
- **D-14:** **Lock Spin** through token flights and the combo stub; re-enable only when settled — no queue-next-spin and no skip/interrupt in v1
- **D-15:** **Request a PNG asset list** for three diskette tokens (green/red/purple); user generates and places under `public/assets/hotline/` — same art pipeline as Phase 2
- **D-16:** Extend shell **beep** `AudioPort` events for token spawn / fly land / phone trigger / queue step (no Howler sample pack yet)

### Carried from prior phases (do not reopen)
- Phones above CRT; Pixi scene / DOM HUD split; portrait-first stack
- Full Witch Pots–shaped config already validated; Phase 3 consumes `tokenOdds` (+ new `triggerChance`)
- Custom first-party reel/ticker motion; Retro Computer font; portfolio comment/voice rules
- Real bonuses (FS / Hold & Win / Pick'em) and nesting are Phase 4

### Claude's Discretion
- Exact illustrative `triggerChance` numbers in sample JSON (plausible studio-looking, not certified RTP)
- Exact arc duration, easing curve, and neon stroke color
- Exact bar segment size/gap/neon under phones
- Exact DOM combo-strip copy and stub beat lengths
- Which random cell is chosen for an overlay (uniform among 20 cells; avoid stacking two overlays on the same cell when multiple colors hit)

### Deferred Ideas (OUT OF SCOPE)
None new from discussion — stayed in phase scope.

Already roadmap-deferred (do not pull into Phase 3):
- Phase 4: Green free spins, Red Hold & Win, Purple locker Pick'em, nested combo nights
- Phase 5: VHS gamble, paytable overlay (BASE-04), responsive polish (PRES-02)
- Howler sample pack (keep beeps until then)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| COLL-01 | Colored diskette tokens can appear on reel symbols and fly into the matching rotary phone meter | Config color rename + `perSpinChance` rolls in logic; overlay-on-random-cell (D-02); `TokenFlight` layer with ticker bezier hop (D-03/D-04); diskette PNG load via `loadHotlineAssets` (D-15) |
| COLL-02 | Phone meters visibly grow (signal bars / neon intensity) as tokens accumulate | Soft-cap counters in logic; `PhonesLayer` procedural bar Graphics 0…`meterTarget` (D-05/D-06/D-08); per-phone reset on trigger/stub pop (D-07/D-12) |
| COLL-03 | Landing a token can randomly trigger that phone's bonus; multiple phones can queue as combo nights | `triggerChance` Zod+JSON (D-09); land-time rolls; fixed Green→Red→Purple queue; Phase 3 stub beats + DOM strip + phone glow (D-10..D-12); Spin lock across presentation (D-14) |
</phase_requirements>

## Summary

Phase 3 turns Phase 2's inert phones and unused `tokenOdds` into the Witch Pots–style collector loop: after each base spin settles (and after a **finite** win presentation when there are line wins), logic rolls up to three colored diskette spawns, picks distinct random cells, and pre-rolls land triggers. The view overlays diskette sprites on those cells, flies them in parallel neon arcs to the matching phones, grows discrete signal bars, and — when triggers fire — drains a Green→Red→Purple combo stub with DOM strip + phone glow. Real bonus features stay Phase 4; the queue API must be shaped so Phase 4 swaps stub beats for feature modules without redoing collectors.

Critical brownfield gaps the planner must close: (1) today's `createWinCycle` / `WinLinesOverlay` loop **forever**, so D-13 has no "finished" signal yet; (2) `HotlineGame.test.ts` currently forbids logic from reading `config.features` — that isolation test must be replaced once collectors consume `tokenOdds`; (3) SpinEngine owns the seeded RNG stream — collector rolls need a **separate** seeded stream so base grid/`?seed=` parity for strips is not scrambled by conditional feature rolls; (4) diskette PNGs are not in `public/assets/hotline/` yet — plan an asset-list checkpoint like Phase 2.

**Primary recommendation:** Plan Wave 0 as Zod color rename + `triggerChance` + pure collector math/queue tests; Wave 1 as session presentation FSM (win gate → flights → stub) with Spin lock + DOM combo strip; Wave 2 as PhonesLayer meters/glow + TokenFlight Pixi; Wave 3 as diskette art handoff + beep SFX events — no new npm packages.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| `tokenOdds` / `triggerChance` config contract | Browser / Client | CDN / Static (bundled JSON) | Client-only Zod parse at mount; no API |
| Per-spin spawn + land trigger rolls | Browser / Client | — | Pure logic + seeded RNG; Vitest without canvas |
| Persistent phone meter counts | Browser / Client | — | Session logic state across spins |
| Combo queue order + stub drain | Browser / Client | — | Logic owns queue; session/view play beats |
| Diskette overlay + arc flight | Browser / Client | CDN / Static (PNG) | Pixi view on shell `Application` |
| Signal bars + phone glow | Browser / Client | — | Procedural Graphics in `PhonesLayer` |
| DOM combo strip + Spin lock | Browser / Client | — | HUD outside `#game-canvas-host` (D-10/D-14) |
| Beep SFX for collector events | Browser / Client | — | Shared `AudioPort` widen (D-16) |
| Backend / DB | — | — | Out of scope |

## Project Constraints (from .cursor/rules/)

No `.cursor/rules/` directory in this repo. Actionable constraints come from `AGENTS.md` / PROJECT.md:

- PixiJS v8, TypeScript, Vite, Vitest; Crash/HOTLINE `logic` / `view` / `hud` split
- Client-only JSON configs; Zod for backend-shaped parse
- Custom reels / motion — no `pixi-reels` / GSAP
- Retro Computer TTF from `src/shared/fonts/`
- Art: request clear asset list; user generates and places files
- Comments: lowercase; no trailing period; no special symbols
- Portfolio voice: short human phrasing; minimize AI fingerprints
- Howler deferred; keep beep `AudioPort` until sample pack exists
- GSD: start work via GSD commands before file-changing tools (planner/executor)

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `pixi.js` | `8.21.0` (pinned; npm latest `8.22.0`) | Sprites, Graphics arcs/bars, ticker | Already shipping HOTLINE/Crash; do not bump mid-feature [VERIFIED: package.json + `npm view pixi.js version` → `8.22.0`] |
| TypeScript | `~5.8.3` | Typed logic/view split | Matches toolchain [VERIFIED: package.json] |
| Vite | `^6.4.3` | Dev/build, `public/assets/hotline/` | Existing [VERIFIED: package.json] |
| Vitest | `^3.2.7` | Collector math, schema, HUD helpers | Existing node env [VERIFIED: package.json] |
| `seedrandom` via `createRng` | `^3.0.5` | Seeded U(0,1) for spawn/trigger/cell picks | Repo seam [VERIFIED: src/shared/rng/createRng.ts:1-11] — quote: `export function createRng(seed: string): Rng {` / `return { next: () => prng() };` |
| `zod` | `^4.6.5` (installed) | Extend `tokenOdds` schema | Already CFG-01; no new install [VERIFIED: package.json + HotlineConfigSchema.ts] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| PixiJS `Assets` / `Sprite` / `Graphics` | (via pixi.js) | Diskette textures, neon arc stroke, bar rects | Flight + meters [CITED: pixijs.com/8.x graphics; Agents skill pixijs-scene-graphics] |
| Shell `AudioPort` + `createBeepAudioPort` | in-repo | Collector beeps | D-16 — widen `SfxEvent` [VERIFIED: src/shared/audio/AudioPort.ts:1-9] — quote: `\| "spin" \| "reel_stop" \| "win";` |
| `smoothstep` / ticker `deltaMS` | in-repo | Arc easing | Reuse reel motion helpers [VERIFIED: src/games/hotline/view/reels/reelMotion.ts:12-17] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Ticker bezier hop | GSAP / `pixi-reels` | Forbidden by stack / CONTEXT |
| Procedural bar Graphics | Meter PNG pack | Contradicts D-08 |
| Beep `AudioPort` | Howler samples | Deferred (D-16 / roadmap) |
| Tokens as reel symbols | Overlay sprites | CONTEXT D-02 locks overlay (does not replace symbol) |
| Soft-cap meters | Hard gate until full | Contradicts D-06 (fill is feedback, not second RNG) |

**Installation:**

```bash
# no new packages — zod / pixi / seedrandom already present
```

**Version verification (this session):** `pixi.js` latest `8.22.0` (repo pin `8.21.0`), `zod@4.6.5`, Node `v24.18.0`, npm `11.16.0`, `tsc` `5.8.3`. Diskette PNGs absent under `public/assets/hotline/` (phones + symbols present).

## Package Legitimacy Audit

> Phase 3 installs **no** new external packages. Audit covers stack packages already in use for legitimacy protocol completeness.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `zod` | npm | Latest publish 2026-09-13 (v4.6.5) | ~326M/wk | github.com/colinhacks/zod | SUS (`too-new`) | Already installed Phase 2 — no new install task; no `postinstall` |
| `pixi.js` | npm | Latest publish 2026-10-01 | ~1.4M/wk | github.com/pixijs/pixijs | SUS (`too-new`) | Already pinned `8.21.0` — do not reinstall/bump |
| `seedrandom` | npm | 2019-09-17 | ~9.6M/wk | github.com/davidbau/seedrandom | OK | Approved — already in repo |

**Packages removed due to [SLOP] verdict:** none

**Packages flagged as suspicious [SUS]:** `zod`, `pixi.js` — false-positive risk on latest-publish age; both already in tree with clean `postinstall: null`. No planner install checkpoint required unless a future plan re-adds them.

## Architecture Patterns

### System Architecture Diagram

```text
[Spin click] → audio.unlock → game.spin()
        │           settles grid + lineWins + collectorOutcome (logic)
        ▼
[HotlineScene.startSpin] ──reel stagger──► reels stop
        │
        ├─ lineWins.length > 0 ──► finite win present (one pass) ──┐
        └─ else ───────────────────────────────────────────────────┤
                                                                   ▼
                    [busy: Spin locked]
                    overlays on cells → parallel neon arcs → land
                         │                    │
                         │                    ├ meter++ (soft cap bars)
                         │                    └ triggerChance roll → enqueue color
                         ▼
                    [combo stub if queue non-empty]
                    DOM strip "COMBO: Green → Red → …"
                    per entry: phone glow + short beat + pop + meter reset
                         │
                         ▼
                    clear busy → idle (ready for next spin)
```

### Recommended Project Structure

```
src/games/hotline/
├── config/
│   ├── HotlineConfigSchema.ts   # green/red/purple + triggerChance
│   └── hotline.config.json
├── logic/
│   ├── HotlineGame.ts           # persist meters; attach collector outcome on spin
│   ├── collectors/
│   │   ├── TokenColors.ts       # "green" | "red" | "purple"
│   │   ├── resolveCollectors.ts # spawn + cell pick + trigger rolls (pure)
│   │   ├── PhoneMeters.ts       # soft-cap counts + reset one phone
│   │   └── ComboQueue.ts        # order filter Green→Red→Purple + stub pop API
│   └── *.test.ts
├── view/
│   ├── PhonesLayer.ts           # bars + glow + phoneCenters()
│   ├── TokenFlight.ts           # overlays + parallel arcs + neon stroke
│   ├── HotlineScene.ts          # wire collectors after win gate
│   ├── winCycle.ts              # add done / one-pass API for D-13
│   └── loadHotlineAssets.ts     # DISKETTE_URLS
├── hud/
│   └── HotlineHud.ts            # combo strip + setBusy / Spin disabled
└── session/
    └── mountHotlineSession.ts   # presentation FSM + SFX + busy lock
```

### Pattern 1: Logic resolves, view plays the book
**What:** `spin()` mutates meters and returns a structured `collectorOutcome` (spawns, cells, which colors triggered). View never rolls RNG. [CITED: .planning/research/ARCHITECTURE.md Pattern 2/3]
**When to use:** Every base spin with collectors.
**Example:**

```typescript
// Source: in-repo architecture research + CONTEXT D-02/D-09/D-11
export type TokenColor = "green" | "red" | "purple";

export type CollectorSpawn = {
  color: TokenColor;
  cell: { reel: number; row: number }; // 0..4 x 0..3
  triggers: boolean; // pre-rolled for land; view fires after arc
};

export type CollectorOutcome = {
  spawns: CollectorSpawn[]; // 0..3, parallel flights
  queue: TokenColor[]; // subset that triggered, sorted Green→Red→Purple
};
```

### Pattern 2: Separate collector RNG stream
**What:** Keep `SpinEngine`'s `createRng(seed)` untouched for strip samples. Create `createRng(\`${seed}:collectors\`)` (or equivalent suffix) for spawn/trigger/cell picks so base grid sequences for a seed stay Phase-2-compatible when feature tables change. [VERIFIED: SpinEngine.ts:9-17 uses one `createRng(seed)` for strip picks only]
**When to use:** Always for Phase 3+ feature rolls.
**Why:** Conditional trigger rolls would otherwise consume a variable number of U(0,1) draws from the strip stream and desync subsequent grids.

### Pattern 3: Session presentation FSM + Spin busy
**What:** `mountHotlineSession` owns `busy` across reels → win present → flights → stub; HUD disables Spin while busy (D-14). Today Spin is only soft-ignored mid-reel (`isSpinning`), not disabled, and there is no post-stop collector phase. [VERIFIED: mountHotlineSession.ts:45-54,138-142; HotlineHud.ts:90-98 does not set `spinBtn.disabled`]
**When to use:** Every successful spin path.

### Pattern 4: Finite win gate before tokens
**What:** Extend win presentation so D-13 can fire. Current `createWinCycle` wraps forever (`index = (index + 1) % count`). [VERIFIED: src/games/hotline/view/winCycle.ts:28-35] — quote: `index = (index + 1) % count;`
**When to use:** Spins with `lineWins.length > 0`.
**Recommendation (discretion):** One full pass of each winning line at `CYCLE_MS` (1100ms today in `WinLinesOverlay`), then `overlay.clear()` and start tokens; if no wins, start tokens immediately after reel stop. Optionally await `LAST_WIN_TWEEN_MS` (900) in parallel so DOM count-up finishes.

### Anti-Patterns to Avoid
- **Tokens as paytable symbols:** D-02 overlays; do not mutate `grid` cells to diskette ids
- **Meter-full gate for triggers:** D-06/D-09 — trigger is land `triggerChance` only
- **Fake mini-games in the stub:** D-12 — highlight + beat + pop only
- **GSAP / Howler this phase:** stack + D-16
- **Leaving Phase 2 feature-isolation test intact:** it will fail the moment logic reads `tokenOdds` [VERIFIED: HotlineGame.test.ts:163-176]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Seeded U(0,1) | `Math.random` / custom LCG | `createRng` | Seed parity / CFG-02 culture |
| Config chance bounds | Ad-hoc clamps | Zod `z.number().min(0).max(1)` | Fail loud at mount [VERIFIED: HotlineConfigSchema.ts:48-52] |
| Neon arc / bars | Canvas2D side channel | Pixi `Graphics` path + `stroke`/`rect`/`fill` | Same scene graph as reels [CITED: Pixi v8 Graphics docs] |
| Flight easing | New tween library | `smoothstep` + `deltaMS` (reelMotion) | Matches Crash/HOTLINE motion stack |
| Coordinate hops every frame | Nested `toGlobal` chains | Scene-local start/end from existing `geometry()` cell centers + `PhonesLayer` centers | HotlineScene already computes centers [VERIFIED: HotlineScene.ts:148-164] |
| Queue ordering bugs | Ad-hoc if/else | Small `ComboQueue` with fixed color order | Phase 4 will hang real bonuses off the same queue |

**Key insight:** Collectors are a **presentation pipeline over a pure outcome**, not a second spin engine. Keep rolls in logic; keep arcs/bars/glow/stub in view/session.

## Common Pitfalls

### Pitfall 1: Infinite win cycle blocks tokens forever
**What goes wrong:** D-13 waits for win cycle to finish; current cycle never finishes.
**Why it happens:** `% count` looping in `createWinCycle` with no `done()`.
**How to avoid:** Add one-pass / `isDone()` API; session advances to collectors only when done or when there are zero wins.
**Warning signs:** Tokens never appear after winning spins; Spin stays locked.

### Pitfall 2: Feature RNG pollutes strip seed stream
**What goes wrong:** Same seed yields different grids after collectors land because trigger rolls steal U(0,1) draws.
**Why it happens:** Single `SpinEngine` RNG shared with conditional feature rolls.
**How to avoid:** Separate `createRng(\`${seed}:collectors\`)`; update tests to assert grid equality under feature-table changes, not full snapshot equality including meters.
**Warning signs:** `HotlineGame` seed tests flake when `triggerChance` changes.

### Pitfall 3: Color rename leaves pink/cyan/yellow fixtures
**What goes wrong:** Zod parse throws at mount; Vitest fixtures fail.
**Why it happens:** Schema, JSON, and `HotlineGame.test` altered odds still use old keys [VERIFIED: hotline.config.json:72-74; HotlineGame.test.ts:184-186].
**How to avoid:** Migrate schema + JSON + all tests in one plan/wave; grep for `pink|cyan|yellow` under `src/games/hotline`.
**Warning signs:** `ZodError` on `perSpinChance.green`.

### Pitfall 4: Soft-cap vs trigger odds confusion
**What goes wrong:** Implementation raises trigger chance when bars are full.
**Why it happens:** Soft-cap meters look like progress-to-bonus games.
**How to avoid:** Meter only drives bar Graphics; `triggerChance` is independent per land (D-06/D-09).
**Warning signs:** Full meters trigger every time.

### Pitfall 5: Spin re-enabled mid-flight
**What goes wrong:** Player starts another spin during arcs/stub; outcomes overlap.
**Why it happens:** Today only `isSpinning()` is checked; flights are not spinning.
**How to avoid:** Explicit session `busy` covering reels + win + flights + stub; `spinBtn.disabled = busy` (D-14).
**Warning signs:** Double collector outcomes; overlapping arcs.

### Pitfall 6: Missing diskette art breaks mount
**What goes wrong:** `loadHotlineAssets` throws on missing required textures (same pattern as symbols).
**Why it happens:** Art pipeline is user-supplied; files not present yet.
**How to avoid:** Asset-list checkpoint early; gate flight sprites behind art drop-in; keep logic/tests green without art.
**Warning signs:** Session mount error `hotline assets: missing or empty texture`.

### Pitfall 7: Queue order not Green→Red→Purple
**What goes wrong:** Combo strip shows trigger order instead of fixed phone order.
**Why it happens:** Enqueueing in land-completion order (parallel arcs finish same frame, but color iteration order may differ).
**How to avoid:** After all land rolls, filter `["green","red","purple"]` to those that triggered (D-11).
**Warning signs:** `COMBO: Purple → Green` when both fire.

## Code Examples

### tokenOdds schema target (D-01, D-09)

```typescript
// Source: extend HotlineConfigSchema.ts:46-53 (current pink/cyan/yellow)
// [VERIFIED current keys: HotlineConfigSchema.ts:48-52]
// quote: perSpinChance: z.object({ pink: …, cyan: …, yellow: … })
const chance01 = z.number().min(0).max(1);

const tokenOddsSchema = z.object({
  meterTarget: positiveInt,
  perSpinChance: z.object({
    green: chance01,
    red: chance01,
    purple: chance01,
  }),
  triggerChance: z.object({
    green: chance01,
    red: chance01,
    purple: chance01,
  }),
});
```

Illustrative sample JSON (discretion — not certified RTP):

```json
"tokenOdds": {
  "meterTarget": 6,
  "perSpinChance": { "green": 0.06, "red": 0.05, "purple": 0.04 },
  "triggerChance": { "green": 0.12, "red": 0.10, "purple": 0.08 }
}
```

### Pure collector resolve (skeleton)

```typescript
// Source: CONTEXT D-02/D-04/D-09/D-11 + createRng pattern
function resolveCollectors(args: {
  rng: Rng;
  tokenOdds: HotlineConfig["features"]["tokenOdds"];
  reels: number; // 5
  rows: number; // 4
}): CollectorOutcome {
  const colors = ["green", "red", "purple"] as const;
  const used = new Set<number>(); // reel*rows+row
  const spawns: CollectorSpawn[] = [];
  for (const color of colors) {
    if (args.rng.next() >= args.tokenOdds.perSpinChance[color]) continue;
    // pick uniform free cell among 20; if none free skip (edge)
    const cell = pickFreeCell(args.rng, args.reels, args.rows, used);
    if (!cell) continue;
    used.add(cell.reel * args.rows + cell.row);
    const triggers = args.rng.next() < args.tokenOdds.triggerChance[color];
    spawns.push({ color, cell, triggers });
  }
  const fired = new Set(spawns.filter((s) => s.triggers).map((s) => s.color));
  const queue = colors.filter((c) => fired.has(c));
  return { spawns, queue };
}
```

### Neon arc hop (view)

```typescript
// Source: Pixi v8 Graphics path API [CITED: pixijs.com/8.x/guides/.../graphics]
// + reelMotion.smoothstep [VERIFIED: reelMotion.ts:12-17]
import { Graphics, Sprite } from "pixi.js";
import { smoothstep } from "./reels/reelMotion.js";

// position sprite along quadratic bezier; optional trail Graphics stroke
function pointOnQuad(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  t: number,
) {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  };
}

// each frame: t = smoothstep(0, 1, elapsed / ARC_MS); control point above midpoint
```

### Phone meter bars (D-05/D-08)

```typescript
// Source: PhonesLayer extension; Graphics leaf under Container
// [CITED: Agents skill pixijs-scene-graphics — rect then fill]
bars.clear();
for (let i = 0; i < meterTarget; i++) {
  const on = i < filled; // filled = min(count, meterTarget)
  bars
    .rect(x + i * (segW + gap), y, segW, segH)
    .fill({ color: neon, alpha: on ? 1 : 0.2 });
}
```

### SfxEvent widen (D-16)

```typescript
// Source: AudioPort.ts:1-9 — extend the closed union + PITCH_HZ + tests ALL_EVENTS
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
  | "queue_step";
```

### Recommended diskette asset list (D-15)

| File | Role | Suggested size |
|------|------|----------------|
| `diskette-green.png` | Green token overlay / flight | 128×128 |
| `diskette-red.png` | Red token overlay / flight | 128×128 |
| `diskette-purple.png` | Purple token overlay / flight | 128×128 |

Place under `public/assets/hotline/` beside existing `phone-*.png`. No meter PNGs (D-08).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Feature tables validated but ignored | Logic consumes `tokenOdds` + `triggerChance` | Phase 3 | COLL-01..03 |
| Inert phone sprites | Phones + bars + glow API | Phase 3 | COLL-02 / stub |
| Infinite win-line cycle | Finite one-pass gate before tokens | Phase 3 (required by D-13) | Presentation FSM |
| pink/cyan/yellow config keys | green/red/purple | Phase 3 (D-01) | Align with phone art |
| Soft Spin ignore while reels move | Explicit busy lock through collectors/stub | Phase 3 (D-14) | No overlap spins |

**Deprecated/outdated:**
- Phase 2 test "no logic source touches config.features" — replace with collector unit tests
- Treating meter fill as the bonus gate — contradicted by D-06/D-09

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Illustrative `triggerChance` ~0.08–0.12 is acceptable portfolio demo density | Standard Stack / Code Examples | Triggers feel too rare/spammy; tune JSON only |
| A2 | "Win cycle finishes" = one full pass of each line win then clear | Pattern 4 / Pitfall 1 | User may want fixed wall-clock instead; adjust interval |
| A3 | Suffix seed `createRng(\`${seed}:collectors\`)` is the right stream split | Pattern 2 | Alternate fixed-budget draws on main stream; document choice |
| A4 | Diskette art at 128×128 matches symbol pack | Asset list | User may deliver different size; view scales to ~0.7 cell |
| A5 | Locking bet −/+ while busy is OK even though D-14 names only Spin | Pattern 3 | If user wants bet change mid-stub, unlock steppers only |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

## Open Questions (RESOLVED)

1. **Win-gate exact duration** (RESOLVED)
   - What we know: D-13 requires tokens after win cycle finishes; cycle is infinite today.
   - What's unclear: One pass vs fixed ms vs "until last-win tween done".
   - Recommendation: One pass at existing `CYCLE_MS` (1100), plus clear overlay; do not block on Continue. Flag A2.
   - **Resolution:** Adopt one-pass `CYCLE_MS` win gate then clear; plans use `WinCycle.isDone()` after one full pass (A2). No fixed wall-clock gate and no Continue tap.

2. **Meter reset timing: trigger land vs stub pop** (RESOLVED)
   - What we know: D-07 resets on bonus trigger; D-12 resets as stub pops.
   - What's unclear: Whether bars should empty at enqueue (land) or at stub beat.
   - Recommendation: Empty on stub pop (D-12 presentation); treat stub as Phase 3 stand-in for bonus start so D-07 holds. Phase 4 keeps the same reset-on-feature-start semantics.
   - **Resolution:** Meter bars empty on stub pop per D-12 (not at land enqueue). Stub stands in for bonus start so D-07 holds.

3. **Forced-trigger debug for demos** (RESOLVED)
   - What we know: FEATURES.md lists forced-trigger tools as P2.
   - What's unclear: Whether Phase 3 needs a `?forceTokens=` seam.
   - Recommendation: Out of scope unless discuss-phase reopens; use high `perSpinChance`/`triggerChance` in a temporary fixture for manual QA.
   - **Resolution:** Out of Phase 3 scope. No `?forceTokens=` seam. Manual QA may temporarily raise `perSpinChance`/`triggerChance` in local JSON, then restore.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Toolchain | ✓ | v24.18.0 | — |
| npm | Scripts | ✓ | 11.16.0 | — |
| TypeScript (`tsc`) | Build gate | ✓ | 5.8.3 | — |
| Vitest / Vite | Tests / HMR | ✓ | package.json | — |
| Diskette PNG pack (3 files) | COLL-01 presentation | ✗ until handoff | — | Logic/tests first; block visual COLL-01 sign-off |
| Howler samples | — | n/a | — | Not used (D-16) |

**Missing dependencies with no fallback:**
- User-supplied `diskette-{green,red,purple}.png` — blocks polished COLL-01 flight art (procedural placeholder sprites are out of creative direction; prefer wait on handoff after asset-list task)

**Missing dependencies with fallback:**
- None for code path (no new packages)

Step 2.6: External services not required — client-only.

## Security Domain

> `security_enforcement` absent in `.planning/config.json` → treat as enabled. Client-only portfolio demo.  
> Note: `workflow.nyquist_validation` is **false** — Validation Architecture section omitted per protocol.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No accounts |
| V3 Session Management | no | In-memory session only |
| V4 Access Control | no | No privileged APIs |
| V5 Input Validation | yes | Zod parse of `perSpinChance` / `triggerChance` in `[0,1]`; bet steps still clamped |
| V6 Cryptography | no | Demo RNG — not fairness-critical |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malformed feature chances | Tampering | Zod `.min(0).max(1)`; mount throws |
| XSS via combo strip copy | Tampering | DOM `textContent` only (no `innerHTML`) |
| Balance / meter manipulation | Elevation | Client demo only — keep logic consistent for portfolio honesty |
| Dependency confusion | Tampering | No new installs this phase |

## Sources

### Primary (HIGH confidence)
- In-repo: `03-CONTEXT.md`, `REQUIREMENTS.md`, `ROADMAP.md`, `STATE.md`, HOTLINE sources cited with line ranges
- [VERIFIED: npm registry] `npm view` pixi.js / zod; `package-legitimacy check` on zod / pixi.js / seedrandom
- [VERIFIED: HotlineConfigSchema.ts:46-53] current `tokenOdds` pink/cyan/yellow
- [VERIFIED: hotline.config.json:72-74] sample `perSpinChance`
- [VERIFIED: PhonesLayer.ts:11-48] inert phones L→R green/red/purple
- [VERIFIED: HotlineGame.ts:44-76] feature tables unused in settlement today
- [VERIFIED: winCycle.ts:28-35] infinite modulo advance
- [VERIFIED: AudioPort.ts:1-9] current `SfxEvent` union
- [CITED: PixiJS v8 Graphics guide] bezier/quadratic + stroke/fill
- [CITED: Agents skill pixijs-scene-container] `toGlobal` / `toLocal` / `getGlobalPosition`
- [CITED: Agents skill pixijs-scene-graphics] shape-then-fill Graphics leaf rules
- [CITED: Agents skill pixijs-ticker] `deltaMS` for time-based motion

### Secondary (MEDIUM confidence)
- [CITED: .planning/research/ARCHITECTURE.md] meters + FeatureQueue + event snapshot shape
- [CITED: .planning/research/FEATURES.md] diskette→phone collector loop + combo nights
- [CITED: zod.dev] number schemas / nested objects (Zod 4 docs)
- Vegas Space Heist-style collector→random trigger narrative [CITED: respinix.com review] — analogy only; HOTLINE rules come from CONTEXT

### Tertiary (LOW confidence)
- Cascade-meter queue games (Honey Rush / Sweet Tooth) as general "queue after wins settle" pacing analogues — not Witch Pots 1:1; do not copy their fill-to-threshold rules (conflicts D-06)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; pins verified this session
- Architecture: HIGH — CONTEXT locks + HOTLINE Phase 2 seams read with line citations
- Pitfalls: HIGH — infinite win cycle, RNG stream, and feature-isolation test are concrete repo facts

**Research date:** 2026-10-10
**Valid until:** ~2026-11-09 (30 days; stack stable)

**Nyquist note:** `.planning/config.json` has `workflow.nyquist_validation: false` — Validation Architecture omitted. Prefer Phase 01/02 verify commands: `npx tsc --noEmit`, `npx vitest run`, `npx vite build`.
