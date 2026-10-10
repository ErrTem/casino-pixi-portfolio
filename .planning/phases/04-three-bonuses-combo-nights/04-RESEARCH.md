# Phase 4: Three Bonuses + Combo Nights - Research

**Researched:** 2026-10-11
**Domain:** PixiJS v8 + DOM slot bonus features (free spins, hold and win, pick'em) and a pausable combo-night state machine, inside the existing HOTLINE logic / view / hud / session split
**Confidence:** HIGH for in-repo integration points (all files read this session), MEDIUM for Witch Pots reference numerics (secondary sources disagree, config is illustrative anyway)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Green free spins**
- **D-01:** Auto-run all 24 free spins (no tap-per-spin) — portfolio feature should feel continuous
- **D-02:** Remaining-spins counter lives in the **DOM strip** (with combo / win chrome), not Pixi-over-CRT
- **D-03:** Enter FS via **full-screen splash → tap continue → auto-run** (same cadence as other features)
- **D-04:** Exit FS via **total-win splash → tap → continue** (base or next queue step / night total)
- **D-05:** Green **can retrigger mid-FS** — diskette tokens may add free spins; chance is **config-driven** — **Reversibility:** costly — becomes part of the feature math contract and session FSM

**Red Hold & Win**
- **D-06:** Stage Hold **in-place on the CRT 5×4** (sticky cash on the reel window; empty cells themed) — matches live Witch Pots Pumpkin Hold, not a separate scene — **Reversibility:** costly — reel view must support a Hold mode overlay on the same grid
- **D-07:** Enter via **full-screen splash → tap → Hold board**
- **D-08:** During Hold, **jackpot strip (MIN / MID / MAX / ULTRA)** replaces the three phones above the CRT
- **D-09:** Exit via **total-win splash** (include jackpot callout if won) → tap → base / next queue step
- **D-10:** Mechanics stay Witch Pots–shaped from PROJECT/REQUIREMENTS: 3 respins that reset on new cash symbols; full-grid / jackpot path; prizes from existing `bonusPrizes` / `jackpotMultipliers` config tables (illustrative, not certified RTP)

**Purple locker Pick'em**
- **D-11:** Round ends after a **fixed pick count**, then auto-total (not collect-until-stopper, not clear-all, not 3-match jackpot pick rules)
- **D-12:** Stage as a **full-screen locker overlay** (hide/dim CRT; dedicated pick grid) — unlike Hold's in-place transform
- **D-13:** Board size **12 lockers, 5 picks**; prize ladder from config `bonusPrizes` (`pickEm`)
- **D-14:** Enter/exit chrome matches other features: **splash → tap → board**; after 5th pick **total-win splash → tap → base/queue**
- **D-15:** Creative skin stays **lockers** (not Witch Pots bats) — already locked in PROJECT.md

**Combo queue + nesting**
- **D-16:** Carry Phase 3 **fixed queue order Green → Red → Purple** (only phones that fired)
- **D-17:** Nesting: **pause FS → run nested Red/Purple in queue order → resume remaining FS** — **Reversibility:** costly — session busy FSM must support stack/resume around features
- **D-18:** During nested play, DOM combo strip shows **full night path + highlight current** (e.g. `COMBO: Green → Red → Purple` with active step lit)
- **D-19:** When the whole combo night finishes, show **one night-total splash → tap → base** (sum of feature wins that night)
- **D-20:** Spin stays **locked** through features, splashes, and nesting (extend Phase 3 D-14); no skip/interrupt in v1

**Carried from prior phases (do not reopen)**
- Pixi scene / DOM HUD split; phones above CRT; portrait-first stack
- Queue order Green → Red → Purple; phone glow + DOM combo strip
- Zod backend-shaped config already has `bonusPrizes` + `jackpotMultipliers`; consume and extend as needed
- Shell beep `AudioPort` for feature events; Howler sample pack deferred
- Custom ticker motion (no GSAP); Retro Computer font; art pipeline = request list → user places PNGs

### Claude's Discretion
- Exact illustrative FS wild-weight bumps, Hold cash prize draws, Pick'em prize assignment, and retrigger odds in sample JSON (plausible studio-looking, not certified RTP)
- Exact splash copy, neon colors, Hold empty-cell theme, locker art layout within 12-cell grid
- Exact respin-lives chrome (e.g. three icons) and jackpot strip typography
- Whether night-total splash is skipped when the night was a single non-nested feature (still show that feature's own exit splash)

### Deferred Ideas (OUT OF SCOPE)
None new from discussion — stayed in phase scope.

Already roadmap-deferred (do not pull into Phase 4):
- Phase 5: VHS SURVIVE/DIE gamble, paytable/rules overlay (BASE-04), responsive polish (PRES-02)
- Howler sample pack (keep beeps)
- Turbo / autoplay (BASE-V2)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BONUS-01 | Green phone grants 24 free spins with elevated Wild mask density on reels 2-5 | Second `SpinEngine` on its own rng stream with boosted `wildWeights` for reel indexes 1..4 (Pattern 3); FS spin reuses the base presentation pipeline (Pattern 6); DOM counter (Pattern 7) |
| BONUS-02 | Red phone starts Hold & Win on a 5x4 sticky cash grid with 3 respins that reset on new cash symbols | Pure `createHoldAndWin` stepper with termination bound (Pattern 4); in-place scene overlay + jackpot strip swap (Pattern 8); weighted prizes from `bonusPrizes.holdAndWin` + `jackpotMultipliers` |
| BONUS-03 | Purple phone opens a locker Pick'em where the user reveals cash prizes until the round ends | Pure `createPickEm` with 12 pre-assigned lockers and 5 picks (Pattern 5); DOM locker overlay because canvas is `pointer-events: none` (Pitfall 2) |
| BONUS-04 | Multiple phones trigger, bonuses run in an ordered combo queue (including nesting during free spins where config allows) | Pure night stack machine (Pattern 1) with `freeSpins.nested` config flags; HUD path model with active highlight (Pattern 7); night-total splash |
</phase_requirements>

## Summary

Phase 3 left a clean seam: `HotlineGame.spin()` settles line wins and a `CollectorOutcome` (`spawns` + ordered `queue`), and `mountHotlineSession.ts` drains that queue through a `present === "stub"` beat loop. Phase 4 replaces only that stub. Everything else (reels, win cycle, token flights, phone meters, busy lock, beep port) is reused. The two costly-reversibility decisions (D-05 retrigger odds in the feature math contract, D-17 stack/resume FSM) both land in one place: a new **pure night state machine** under `logic/` that owns a frame stack (suspended Free Spins frame), the pending base queue, the pending nested queue, the dynamic combo path, and per-feature win accounting. The session becomes a thin presenter that asks the machine "what step is next" and maps each step to splash / reels / hold board / locker overlay.

All three features should be built as **pure, seeded, Vitest-testable logic objects** on their **own rng streams** (`${seed}:fs`, `:fs-collectors`, `:hold`, `:pick`). The existing test "keeps strip grids stable when only feature chances change" proves the invariant that feature work must not consume the base grid stream; Phase 4 must preserve it. Free Spins is the base spin pipeline run on a second `SpinEngine` with boosted Wild weights on reel indexes 1..4 and no bet deduction; Hold is a per-cell sticky grid stepper with a provable termination bound; Pick'em is 12 pre-assigned lockers with 5 reveals.

Three repo facts dominate the view and HUD design and are easy to miss: (1) `.canvas-host` and its canvas are `pointer-events: none`, so Pixi tap targets will not receive input; (2) a layout test forbids any `data-action` / `data-field` inside `#game-canvas-host`; (3) `tests/hotline.assets.test.ts` pins `HOTLINE_ASSET_URLS` to exactly 17 files. The consistent answer is: **splash and locker grid are DOM overlays outside the canvas host**, **Hold board and jackpot strip are procedural Pixi Graphics/Text inside the scene**, and **no new PNGs are required** (art stays optional and procedural for this phase).

**Primary recommendation:** Build `logic/features/{freeSpins,holdAndWin,pickEm}.ts` and `logic/night/createNight.ts` first (pure, tested, config extended with Zod), then a DOM `FeatureOverlay` (splash + lockers), then scene Hold mode + jackpot strip, and last rewrite the session stub into a presenter over the night machine. No new npm packages.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| FS / Hold / Pick'em math, prize draws, retrigger rolls | Browser logic (`logic/features`, pure) | — | Must be seedable and testable without canvas; `architecture.no-pixi` test bans pixi/document in logic |
| Combo night ordering, nesting stack, path, win accounting | Browser logic (`logic/night`, pure) | Session (consumes steps) | D-17 is costly to reverse; a pure reducer is the only cheap way to test pause/resume |
| Config shape and validation (`freeSpins`, `holdAndWin`, `pickEm`, weights) | Config (`HotlineConfigSchema` + JSON) | — | CFG-01 backend-shaped contract, Zod fails loud at mount |
| Wallet credit of feature wins | Browser logic (`HotlineGame` + `Wallet`) | Session (decides display timing) | Money stays in cents in logic; session only chooses when the HUD shows it |
| Splash (enter / exit / night total) and locker pick grid | DOM overlay (outside `#game-canvas-host`) | — | Needs real taps; canvas is non-interactive; layout test forbids controls in canvas host |
| FS remaining counter, combo path highlight, feature win readout | DOM HUD strip | — | D-02 and D-18 |
| Hold board (sticky cash, empty cells, respin lives) and jackpot strip | Pixi scene (procedural Graphics + Text) | HUD (lives text optional) | D-06 and D-08, in-place on the CRT grid |
| Presentation sequencing (splash, spin, wins, flights, nested resume) | Session (ticker driven) | — | Matches Phase 3 `present` pattern |
| Feature beeps | Shared `AudioPort` (beep) | Session emits | Howler deferred (D-16 of Phase 3 carries) |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `pixi.js` | 8.21.0 (pinned; architecture test asserts exact pin) | Hold board overlay, jackpot strip, scene mode swap | Already shipped; `tests/architecture.no-pixi.test.ts` asserts `pkg.dependencies["pixi.js"] === "8.21.0"` |
| TypeScript | ~5.8.3 | Typed machine states and config | Existing |
| `zod` | ^4.6.5 | Extend `HotlineConfigSchema` with feature runtime knobs | Existing config boundary; bad config must throw at mount |
| `seedrandom` via `createRng` | ^3.0.5 | Per-feature seeded streams | Existing `src/shared/rng/createRng.ts` |
| Vitest | ^3.2.7 (installed 3.2.7) | Logic, config, HUD model tests | Existing; node environment (no jsdom) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| none | — | — | No new dependency is needed for this phase |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| DOM locker grid | Pixi lockers + `pointer-events: auto` on canvas | Needs CSS and hit-test changes for the whole scene; DOM buttons also give keyboard and screen reader support. Use DOM |
| Hold cells as 20 mini `ReelStrip`s | Procedural overlay with timed flicker | `ReelStrip` is column based with masks and landing math; 20 instances is heavy and unnecessary for sticky cash. Use overlay |
| New splash PNGs / locker PNGs | Procedural CSS and Graphics | `tests/hotline.assets.test.ts` pins asset count to 17; new PNGs force a test and loader change plus user art handoff. Stay procedural, art is a later optional pass |

**Installation:** none.

**Version verification:** `npx vitest --version` returned `vitest/3.2.7 win32-x64 node-v24.18.0` this session; `package.json` pins `pixi.js` `8.21.0`, `zod` `^4.6.5`, `seedrandom` `^3.0.5`. [VERIFIED: package.json dependencies block, read this session]

## Package Legitimacy Audit

No external packages are installed by this phase. **Packages removed due to [SLOP] verdict:** none. **Packages flagged as suspicious [SUS]:** none. The planner must not add any dependency (no GSAP, no Howler, no `pixi-reels`, per AGENTS.md "What NOT to Use").

## Architecture Patterns

### System Architecture Diagram

```
base SPIN click
   |
   v
HotlineGame.spin()  --(bet)--> Wallet
   | grid (base engine) -> evaluatePaylines -> credit line wins
   | resolveCollectors(rng seed:collectors) -> spawns + queue
   v
session: reels -> win_gate -> flights   (existing Phase 3 pipeline)
   |
   | queue empty? -- yes --> idle (unlock Spin)
   | no
   v
Night.begin(queue)  [pure machine: queue, stack, nested, path, wins]
   |
   +--> next() returns a Step:
   |
   |   StartSplash(kind) --tap--> run feature --> ExitSplash(kind, total) --tap--> next()
   |
   |   kind = green:  FsSpin* (loop, auto)
   |                    each FS spin = spinFree() on FS engine
   |                    reels -> wins -> flights (same pipeline)
   |                    retrigger roll (green)  -> spinsLeft += n
   |                    red/purple roll (if config allows) -> nested queue
   |                    nested pending? -> SUSPEND FS (frame stays on stack)
   |                         -> run nested Red/Purple in queue order (own splashes)
   |                         -> RESUME FS with spinsLeft intact
   |                  spinsLeft == 0 -> ExitSplash(green, fsTotal)
   |
   |   kind = red:    Hold.start -> HoldRespin* (scene hold mode, jackpot strip)
   |                  done (lives 0 or grid full) -> ExitSplash(red, total + jackpot)
   |
   |   kind = purple: Pick.start -> 5 user picks (DOM lockers) -> ExitSplash(purple, total)
   |
   v
queue empty and no frame open
   |
   +--> path length >= 2 ? NightTotalSplash --tap--> idle : idle
   v
unlock Spin (hud.setBusy(false), combo cleared)
```

### Recommended Project Structure
```
src/games/hotline/
├── config/
│   ├── HotlineConfigSchema.ts       # + freeSpins, holdAndWin, pickEm, optional prizeWeights, bonusId refine
│   └── hotline.config.json          # + sample knobs (see Code Examples)
├── logic/
│   ├── features/
│   │   ├── prizeTable.ts            # getPrizeTable(config, id), weighted draw helper
│   │   ├── freeSpins.ts             # boostedMath(config), spin counter + retrigger math
│   │   ├── holdAndWin.ts            # createHoldAndWin (pure stepper)
│   │   └── pickEm.ts                # createPickEm (pure)
│   ├── night/
│   │   └── createNight.ts           # frame stack, queue, nested, path, wins (pure reducer style)
│   ├── HotlineGame.ts               # + spinFree(), feature rng streams, credit helpers, bet capture
│   └── index.ts                     # export new modules
├── hud/
│   ├── HotlineHud.ts                # + setComboPath, setFeatureLine
│   ├── comboStripModel.ts           # pure: path + active index -> cells (testable in node)
│   └── FeatureOverlay.ts            # DOM splash + locker grid (no innerHTML, textContent only)
├── view/
│   ├── HoldLayer.ts                 # procedural 5x4 hold overlay on the glass grid
│   ├── JackpotStrip.ts              # MIN MID MAX ULTRA strip, same band as phones
│   └── HotlineScene.ts              # + setHoldMode, hold API, jackpot swap
└── session/
    ├── mountHotlineSession.ts       # stub drain replaced by night presenter
    └── nightPresenter.ts            # optional extraction of the present phases
```

### Pattern 1: Night state machine with a frame stack (D-16..D-20, BONUS-04)
**What:** One pure object owns the whole combo night. The session never decides ordering.
**When to use:** Always for BONUS-04; this is the D-17 "costly" piece.
**State:**
- `queue: TokenColor[]` pending base-level entries (already ordered by `orderComboQueue`)
- `fs: { spinsLeft, spinsDone, retriggers, totalCents } | null` the open Free Spins frame (the suspended frame is the same object while nested features run)
- `nested: TokenColor[]` pending nested entries, only filled while `fs` is open
- `path: { color, nested: boolean, state: "pending" | "active" | "done" }[]` for the strip (D-18)
- `featureWins: { color, nested, cents }[]` and `nightTotalCents` (feature wins only; base line win excluded, D-19)

**`next()` order (prescriptive):**
1. `nested.length > 0` -> pop head, nested feature step (FS stays open and suspended)
2. else `fs` open and `spinsLeft > 0` -> `FsSpin` step
3. else `fs` open and `spinsLeft === 0` -> `FsExit` step, then close frame
4. else `queue.length > 0` -> pop head, begin feature (reset that phone meter here, see Pitfall 8)
5. else -> night end (`NightTotal` if `path.length >= 2`, otherwise `Done`)

Rule 1 before rule 2 gives exactly "pause FS, run nested Red/Purple in queue order, resume remaining FS". Nested entries are appended in `orderComboQueue` order each time an FS spin settles. A nested feature never nests again (Hold and Pick'em do not roll tokens).
**Interpretation to confirm** (Open Question 1): base-queue Red/Purple that fired on the *same base spin as Green* run **after** the Green FS exits (sequential, D-16). Only triggers rolled **inside** FS spins nest. This matches the live game, where Red/Purple during FS are separate token rolls.

**Example:**
```typescript
// pure, no pixi, no document (architecture.no-pixi test scans logic/)
export type NightStep =
  | { kind: "feature_start"; color: TokenColor; nested: boolean }
  | { kind: "fs_spin" }
  | { kind: "feature_exit"; color: TokenColor; nested: boolean; totalCents: number }
  | { kind: "night_total"; totalCents: number }
  | { kind: "done" };
```

### Pattern 2: Separate seeded streams per feature (determinism, CFG-02)
**What:** `createRng(`${seed}:fs`)`, `:fs-collectors`, `:hold`, `:pick`. Never draw from the base `SpinEngine` or the `:collectors` stream inside a feature.
**Why:** `HotlineGame.test.ts` ("keeps strip grids stable when only feature chances change") shows this repo already treats stream isolation as a tested invariant. Sharing a stream would make the next base grid depend on whether a night ran.
**Source:** `HotlineGame.ts` already uses `createRng(`${options.seed}:collectors`)`.

### Pattern 3: Free Spins is the base spin on a boosted engine, no bet
**What:** Build `boostedMath = { ...math, symbolWeights }` where reel index `0` keeps base weights and reel indexes `1..4` replace the `wildSymbolId` weight with `freeSpins.wildWeights[reel - 1]`. Create `createSpinEngine(`${seed}:fs`, boostedMath)`. `spinFree()` calls that engine, runs `evaluatePaylines` with the **captured trigger bet**, credits the win, and runs `resolveCollectors` on the `:fs-collectors` rng.
**Retrigger without touching `resolveCollectors`:** pass `tokenOdds` with `triggerChance.green` overridden by `freeSpins.retriggerChance`; then post-filter the queue: green means retrigger (add `retriggerSpins` if `retriggers < maxRetriggers`), red or purple only if `freeSpins.nested[color]` is true and are pushed to `nested`.
**Bet capture:** the logic must store `featureBetCents` at night start and use it for every FS line evaluation and for Hold / Pick'em multipliers. The HUD lock on bet steppers is UI only; `setBetStepIndex` is still callable on the game object.

### Pattern 4: Hold and Win as a pure stepper with a termination proof
**State:** `cells: Map<cellIndex, { kind: "cash"; mult } | { kind: "jackpot"; tier }>`, `lives`, `done`.
- `start()` seeds `holdAndWin.startCells` (5) distinct random cells with prizes, `lives = respins` (3).
- `respin()` rolls each empty cell with `landChance`; each landing draws a prize from the weighted `bonusPrizes.holdAndWin` ladder, or a jackpot tier with probability `jackpotSymbolChance`. If at least one landed, `lives = respins`; else `lives -= 1`. `done` when `lives === 0` or all 20 cells filled.
- Full grid adds the `jackpotMultipliers.grand` prize (ULTRA) on top of the cell sum.
- Total cents = `payoutCents(bet, toMultHundredths(mult))` per cell summed, plus tier payouts. Payout floors to the cent per prize, as `payoutCents` in `src/shared/money/cents.ts` already does.
**Termination:** each respin either fills at least one of at most 15 empty cells (at most 15 resets) or burns one life (at most 3 between resets), so the loop is bounded by `15 + 3 * 16 = 63` respins. A unit test should assert the bound with `landChance = 0` (exactly 3 respins) and `landChance = 1` (one respin fills the grid, ULTRA awarded).
**Display name mapping:** config keys are `mini`, `minor`, `major`, `grand`; the D-08 strip labels are MIN, MID, MAX, ULTRA. Map labels in the view only; do not rename config keys (Phase 3 D-01 shows how costly a key rename is).

### Pattern 5: Pick'em with all 12 lockers pre-assigned
**State:** `lockers: number[]` of 12 prize multipliers drawn from the weighted `bonusPrizes.pickEm` ladder with the `:pick` rng, `opened: Set<number>`, `picksLeft = picks` (5).
`pick(index)` ignores invalid, repeated, or post-done indexes and returns the revealed multiplier; after the 5th valid pick `done` is true and `totalMult` is the sum of revealed values. Pre-assigning all 12 keeps the demo honest (unrevealed lockers really hold prizes) and keeps seed replay stable for the same pick order. Do not pre-draw a "k-th pick pays k-th prize" sequence; it makes locker choice meaningless.

### Pattern 6: Reuse the base presentation pipeline for each FS spin
Each FS spin runs the existing `reels -> win_gate -> flights` phases, then asks the night machine what is next. In the session this means `present` gets new values (`feature_splash`, `fs_gap`, `hold_*`, `pick`, `night_total`) and the `reels` settle handler reads `game.getSnapshot()` after `spinFree()` exactly like after `spin()`. The scene needs no new spin API: `scene.startSpin(grid)` already takes a grid.
**Pacing:** a base-style cycle (650 ms min spin + 4 x 240 ms stagger + 420 ms land + 1100 ms per winning line + 620 ms flights) is multiple seconds per spin; 24 spins plus retriggers is minutes if many lines win. Add a compact FS cadence (for example only cycle the best few lines, or a shorter `intervalMs` on the win cycle) so D-01 "continuous" holds. `CYCLE_MS = 1100` is a module const in `WinLinesOverlay.ts`; it needs a parameter, not a copy.

### Pattern 7: DOM overlay and HUD strip
- **Overlay mount:** child of `.hotline-screen` (set `position: relative` there), `position: absolute; inset: 0`, sibling of `#game-canvas-host`, never inside it. `mountHotlineSession` does `host.replaceChildren(ctx.app.canvas)`, which would also wipe anything placed inside the host.
- **Splash:** `role="dialog"` with title, total, and a continue `<button data-action="feature-continue">`. Text via `textContent` only. Focus the button when shown; Enter / Space already activate a button.
- **Lockers:** 12 `<button data-action="locker-pick" data-index="n">` in a CSS grid; reveal sets `textContent` to the prize; disabled once opened or after pick 5.
- **Combo strip with highlight (D-18):** `comboEl.textContent` alone cannot light one step. Add a pure `comboStripModel(path)` returning `{ label, state }[]` (testable in node) and a HUD `setComboPath` that builds `<span>` children with `document.createElement` and `textContent`. The existing `FakeEl` double in `HotlineHud.test.ts` only has `textContent`, `disabled`, listeners; extend it with a minimal `replaceChildren` / `append` or test only the pure model plus a source assertion.
- **FS counter (D-02):** add a `data-field="feature"` line next to `[data-field=combo]` in the template (outside the canvas host), for example `FREE SPINS 12/24  WIN 18.40`.
- **Retro Computer** is already loaded for DOM via CSS (`font-family: "Retro Computer", ui-monospace, monospace` in `.hotline-combo`).

### Pattern 8: Scene Hold mode and jackpot strip
- `HotlineScene` already computes `geometry()` (cell centers, `cellSize`). A `HoldLayer` draws 20 cell frames over the glass grid, shows sticky cash as `Text` (cached string per cell, static values so the re-rasterize cost is irrelevant), and animates empty cells with a ticker driven flicker during a respin.
- In Hold mode hide `reelWindow.container` and `overlay.container` (win lines) and show `HoldLayer`; restore both on exit and in `destroy()`. Every exit path (normal exit, nested exit, session dispose) must restore.
- `JackpotStrip` uses the same band `phones.layout(left, top, width, height)` receives; toggle `phones.container.visible` and `jackpot.container.visible` (D-08).
- Procedural only: no new textures (see Pitfall 3).

### Anti-Patterns to Avoid
- **Deciding order or nesting in the session:** the session's boolean / string `present` is already hard to extend; put ordering in the pure machine so Vitest can prove pause / resume.
- **Drawing feature randomness from the base engine or `:collectors` stream:** breaks the stream-stability invariant and seed parity.
- **Pixi tap targets for splash or lockers:** canvas is `pointer-events: none` (Pitfall 2).
- **`innerHTML` for splash or prize text:** repo architecture tests ban `.innerHTML` in view theater files and the Phase 3 HUD pattern is `textContent` only.
- **Crediting Hold / Pick'em wins per reveal:** credit once when the exit splash appears (see Open Question 3) so the HUD balance and the splash total agree.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Seeded randomness | New PRNG | `createRng(seed)` | Seed parity and tests already depend on it |
| Weighted draws | Ad hoc loops per feature | One `weightedPick(rng, values, weights)` helper in `prizeTable.ts` | `SpinEngine.pick` already shows the pattern; reuse for Hold, Pick'em, jackpot tiers |
| Ordered queue | New ordering | `orderComboQueue` / `createComboQueue` | Fixed Green -> Red -> Purple is tested |
| Collector rolls inside FS | A second spawn resolver | `resolveCollectors` with an overridden `triggerChance.green` | Same cell placement and token flight data the view already animates |
| Money math | Float multiplication | `payoutCents(bet, toMultHundredths(m))` | Cent flooring is defined once |
| Config validation | Manual guards | Zod additions in `HotlineConfigSchema` | CFG-01, fail loud at mount |
| Win line presentation in FS | A second overlay | Existing `WinLinesOverlay` with an interval parameter | Already handles one-pass-then-done |
| Meter and glow presentation | New phone visuals | `PhonesLayer.setMeters` / `setGlow` | Already tested by walkthrough |

**Key insight:** Phase 4 is orchestration on top of Phase 2 and 3 parts. The only genuinely new code is three small pure logic objects, one state machine, two DOM modules, and two procedural Pixi layers.

## Common Pitfalls

### Pitfall 1: Source-grep tests pin `mountHotlineSession.ts`
**What goes wrong:** `src/games/hotline/session/collectPresentation.test.ts` reads `mountHotlineSession.ts` as text and asserts `setBusy(true)`, `startCollectors`, `progressiveDisplayFills`, `formatComboStrip`, `resetPhoneMeter`, `play("phone_trigger")`, `play("queue_step")`, `unlock()`, and **forbids** `.increment(`. Moving presentation into `nightPresenter.ts` or removing the stub path breaks these.
**How to avoid:** Decide per assertion: keep the call in the session file, or update the test in the same plan. Do not leave the suite red between tasks. `formatComboStrip` also has a unit test with the `→` joiner; keep it or migrate its test with the new path model.
**Warning signs:** `npx vitest run src/games/hotline/session` fails after the session rewrite.

### Pitfall 2: Canvas is not interactive
**What goes wrong:** `.canvas-host { ... pointer-events: none; }` and `.canvas-host canvas { ... pointer-events: none; }` mean `eventMode = "static"` Pixi objects never receive pointer events.
**How to avoid:** Splash continue and locker picks are DOM controls outside the host (Pattern 7). If a Pixi tap is ever wanted, the plan must also change the CSS and re-check the layout test; avoid.
**Warning signs:** Taps do nothing in the browser while unit tests pass.

### Pitfall 3: Asset count and layout tests
**What goes wrong:** `tests/hotline.assets.test.ts` asserts `HOTLINE_ASSET_URLS` has exactly the 17 listed files and every URL is a real PNG on disk. `tests/shell.hud-layout.test.ts` asserts the hotline canvas host contains no `data-action=` or `data-field=`.
**How to avoid:** Keep Phase 4 art procedural. If a later checkpoint adds user art, the same plan updates the asset test and the loader together. Put overlay markup in the screen template **outside** `#game-canvas-host`.

### Pitfall 4: Stream parity regression
**What goes wrong:** A feature draws from the base grid engine; the next base spin differs depending on whether a night ran, and `?seed=` replays diverge.
**How to avoid:** Pattern 2. Add a test: two games, same seed, different `triggerChance` and feature knobs, base grids over N spins identical when no night is *consumed* (or assert feature streams are separate objects by checking base grids equal when only `freeSpins` knobs change).

### Pitfall 5: HUD bet lock is not a logic lock
**What goes wrong:** FS or Hold multipliers read the current bet step; any code path that calls `setBetStepIndex` during a night changes payouts.
**How to avoid:** Capture `featureBetCents` when the night begins and read only that; reject or ignore `spin()` while a night is active inside `HotlineGame` as well as in the HUD (`busy` is currently session-local).

### Pitfall 6: `visibleSnapshot` balance hold assumes only a spinning reel
**What goes wrong:** The session hides `lastWin` from `balance` only while `view.scene.isSpinning()`. FS credits per spin through the wallet; Hold / Pick'em credit at exit. If crediting is not timed, the balance jumps before the splash shows the total.
**How to avoid:** Credit FS wins per spin at spin settle (the existing hold-until-reels-land logic already handles that), and credit Hold / Pick'em totals when the exit splash appears. Keep `lastWinDisplay` meaning "last spin line win" and show running feature win in the DOM strip.

### Pitfall 7: Unbounded retrigger
**What goes wrong:** Retrigger odds keep adding spins; the night never ends in a demo.
**How to avoid:** `maxRetriggers` (and optionally total spin cap) in config, enforced in `freeSpins.ts`, and a test with `retriggerChance = 1` proving `spinsDone <= spins + maxRetriggers * retriggerSpins`.

### Pitfall 8: Meter reset timing and double booking
**What goes wrong:** Phase 3 resets a phone meter as its stub entry pops. With real features the meter must reset when that feature **starts** (so the player sees the phone empty during the splash), and FS spins book new token counts at `spinFree` settle. A booking path outside `HotlineGame` trips the test that forbids `.increment(` in the session.
**How to avoid:** `HotlineGame` owns all `meters.increment` and `meters.reset` calls; session only calls `resetPhoneMeter(color)` at feature start. Also reset green on FS retrigger.

### Pitfall 9: Hold mode must always restore the scene
**What goes wrong:** Hold hides reels, win overlay, and phones. A nested Hold inside FS, a Menu click mid-Hold, or an exception leaves the scene hidden.
**How to avoid:** One `setHoldMode(false)` called from the exit path, from `enterIdle`, and from `scene.destroy()`. Test with a source assertion plus a manual walkthrough of nested exit and Menu during Hold.

### Pitfall 10: Menu / dispose mid-night
**What goes wrong:** `dispose()` removes the ticker callback and screen, but a pending splash promise or timer could still fire.
**How to avoid:** Keep presentation timers inside the tick (like `stubElapsed`) rather than `setTimeout`; overlay listeners removed in `dispose`. Pending uncredited Hold / Pick'em totals are discarded on Menu (demo only); document it, do not try to persist.

### Pitfall 11: Large `deltaMS` after tab background
**What goes wrong:** `ticker.deltaMS` can be huge after a background tab; FS gap timers and Hold respin timers skip or double fire. Reels clamp to 100 ms inside `ReelStrip.update`, the session tick does not.
**How to avoid:** Clamp `deltaMS` in the new presenter timers (same `Number.isFinite` guard `tickPresent` uses for the stub).

### Pitfall 12: New `SfxEvent` ids are a closed union with a hand list in tests
**What goes wrong:** `PITCH_HZ: Record<SfxEvent, number>` forces every new id to get a pitch (compile error otherwise), and `createBeepAudioPort.test.ts` keeps a hand `ALL_EVENTS` list.
**How to avoid:** Add a small set (for example `feature_start`, `feature_end`, `hold_land`, `hold_respin`, `pick_reveal`, `jackpot`) in `AudioPort.ts`, `createBeepAudioPort.ts`, and `ALL_EVENTS` in one task. Shell `sfxEdges.ts` is Crash only and does not need changes.

### Pitfall 13: Config contract migration
**What goes wrong:** Making new feature keys required breaks any test fixture that rebuilds `features` without them.
**How to avoid:** Existing `HotlineGame.test.ts` builds configs by spreading `...config.features`, which carries new keys through; `HotlineConfigSchema.test.ts` clones the bundled JSON. Update JSON and schema in one task and run `npx vitest run src/games/hotline/config` immediately. Add a refine that `bonusPrizes` contains unique ids `pickEm`, `holdAndWin`, `freeSpins`, and that optional `prizeWeights` length equals `prizeMultipliers` length.

### Pitfall 14: `bonusPrizes.freeSpins` has no runtime meaning
**What goes wrong:** The bundled `freeSpins` ladder `[5, 8, 10, 15]` exists but Witch Pots free games pay line wins at the same bet; a planner may invent a use that changes the math contract.
**How to avoid:** Leave it validated but unused by FS runtime, or use it only if the user confirms (Open Question 2).

## Code Examples

### Zod extension (backend-shaped, fail loud)
```typescript
// source: pattern extends src/games/hotline/config/HotlineConfigSchema.ts
const unit = z.number().min(0).max(1);

const bonusPrizeSchema = z
  .object({
    bonusId: z.string().min(1),
    prizeMultipliers: z.array(z.number().positive()).min(1),
    prizeWeights: z.array(positiveInt).optional(),
  })
  .refine(
    (b) => !b.prizeWeights || b.prizeWeights.length === b.prizeMultipliers.length,
    { message: "prizeWeights must match prizeMultipliers length" },
  );

const freeSpinsSchema = z.object({
  spins: positiveInt,
  // replacement wild weight for reels 2..5, reel 1 keeps the base weights
  wildWeights: z.array(positiveInt).length(4),
  retriggerChance: unit,
  retriggerSpins: positiveInt,
  maxRetriggers: z.number().int().min(0),
  nested: z.object({ red: z.boolean(), purple: z.boolean() }),
});

const holdAndWinSchema = z.object({
  startCells: z.number().int().min(1).max(19),
  respins: positiveInt,
  landChance: unit,
  jackpotSymbolChance: unit,
});

const pickEmSchema = z.object({
  lockers: z.literal(12),
  picks: z.literal(5),
});
```

### Sample JSON additions (illustrative, not certified RTP) [ASSUMED values]
```json
"bonusPrizes": [
  { "bonusId": "pickEm", "prizeMultipliers": [2, 3, 5, 10, 25], "prizeWeights": [40, 28, 18, 10, 4] },
  { "bonusId": "holdAndWin", "prizeMultipliers": [1, 2, 5, 10, 20, 50], "prizeWeights": [40, 28, 16, 9, 5, 2] },
  { "bonusId": "freeSpins", "prizeMultipliers": [5, 8, 10, 15] }
],
"freeSpins": {
  "spins": 24,
  "wildWeights": [9, 9, 9, 9],
  "retriggerChance": 0.04,
  "retriggerSpins": 6,
  "maxRetriggers": 3,
  "nested": { "red": true, "purple": true }
},
"holdAndWin": { "startCells": 5, "respins": 3, "landChance": 0.1, "jackpotSymbolChance": 0.04 },
"pickEm": { "lockers": 12, "picks": 5 }
```
Back-of-envelope with the current weights (`mask` 3 of 88 per reel today): wild density rises to 9 of 94, about 9.6 percent versus 3.4 percent. Mean Pick'em cash is about 4.5x per locker, about 23x per round. Mean Hold cash is about 4.7x per cell. These are plausible demo scales; a Monte Carlo test (see below) is the tuning guard, not a certified RTP.

### Free spins engine from config
```typescript
export function boostedFreeSpinMath(config: HotlineConfig): SpinEngineMath {
  const { math, features } = config;
  const wild = math.wildSymbolId;
  const symbolWeights = math.symbolWeights.map((weights, reel) =>
    reel === 0 ? weights : { ...weights, [wild]: features.freeSpins.wildWeights[reel - 1] },
  );
  return { rows: math.rows, reels: math.reels, symbolWeights };
}
// const fsEngine = createSpinEngine(`${seed}:fs`, boostedFreeSpinMath(config));
```

### Night machine nesting rule
```typescript
next(): NightStep {
  if (nested.length > 0) return beginFeature(nested.shift()!, true);
  if (fs && fs.spinsLeft > 0) return { kind: "fs_spin" };
  if (fs) return closeFrame();          // fs_exit, clears fs
  if (queue.length > 0) return beginFeature(queue.shift()!, false);
  return path.length >= 2 ? { kind: "night_total", totalCents } : { kind: "done" };
}
// onFsSpinSettled(outcome): spinsLeft -= 1; green -> retrigger; red/purple -> nested (ordered) if allowed
```

### Hold respin
```typescript
respin(): { landed: number[]; lives: number; done: boolean; full: boolean } {
  const landed: number[] = [];
  for (let i = 0; i < 20; i++) {
    if (cells.has(i)) continue;
    if (rng.next() < cfg.landChance) { cells.set(i, drawCell()); landed.push(i); }
  }
  lives = landed.length > 0 ? cfg.respins : lives - 1;
  const full = cells.size === 20;
  return { landed, lives, done: full || lives <= 0, full };
}
```

### Testing notes (nyquist_validation is false, so no formal Validation Architecture section)
- Proven commands from Phase 3: `npx vitest run src/games/hotline/logic` and `npx vitest run src/games/hotline/config`. Add `npx vitest run src/games/hotline/hud src/games/hotline/session` and the root `npx vitest run tests` (layout, assets, architecture tests) after template and loader touches.
- Phase gate: `npm test` and `npm run build` (`tsc --noEmit && vite build`).
- Required new unit tests: night machine (order, nesting resume, nested order Red before Purple, no nested green, retrigger cap, night-total skip rule, accounting excludes base line win); Hold (bounds with `landChance` 0 and 1, reset on landing, ULTRA on full grid, jackpot tier payout); Pick'em (invalid and repeat picks ignored, ends after 5, total equals sum of revealed); FS (wild density on reels 2..5 only, reel 1 unchanged, bet captured); stream isolation; config schema negatives.
- A seeded Monte Carlo guard (for example 2000 holds and 2000 pick'ems) asserting finite totals and a sane mean range keeps sample JSON honest.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Phase 3 stub beat per queue entry (`present === "stub"`) | Night machine steps with splash, feature, exit | Phase 4 | Session `PresentPhase` grows; stub tests change |
| Config only validated, runtime ignores feature tables | Runtime reads `freeSpins`, `holdAndWin`, `pickEm`, weights | Phase 4 | New required config keys |
| `setCombo(text)` textContent only | Path model with active highlight | Phase 4 | HUD API and test double grow |

**Reference game facts (Witch Pots), for fidelity only:**
- Green elixir triggers 24 Free Games at the same bet; Hold and Win and Pick Me bonuses and additional free games can be won during the feature. [CITED: https://endorphina.com/news/3-witch-pots-endorphinas-multi-bonus-halloween-special]
- Hold: 5x4 grid, bonus symbols stay, empty cells keep spinning, 3 attempts reset by new symbols, all 20 symbols pays the ULTRA prize; wins are summed and paid at the end. [CITED: https://endorphina.com/news/3-witch-pots-endorphinas-multi-bonus-halloween-special, https://gamblenexus.com/slots/3-witch-pots/]
- Hold starts with 5 bonus symbols transferred from the reels. [CITED: https://gamblenexus.com/slots/3-witch-pots/]
- Jackpot numbers disagree across sources (ULTRA 1000x on the news page and review sites, 500x on the games page; mini / mid / max 50 / 100 / 300 on a review site). [CITED: https://endorphina.com/games/3-witch-pots, https://uk.slotuk.org/free-slots/3-witch-pots/] The repo already ships `jackpotMultipliers` of 20 / 50 / 200 / 1000; keep them, they are illustrative.
- Real Pick'em is 16 bats and match-three awards; HOTLINE deliberately simplifies to 12 lockers and 5 picks (D-11, D-13).

**Deprecated/outdated:** nothing to migrate; PixiJS stays 8.21.0.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Sample numbers (`wildWeights` 9, `retriggerChance` 0.04, `retriggerSpins` 6, `maxRetriggers` 3, Hold `landChance` 0.1, `jackpotSymbolChance` 0.04, prize weights) give a plausible demo feel | Code Examples | Sample JSON feels too stingy or too rich; only a tuning pass, within Claude's discretion |
| A2 | Retrigger adds a config fixed `retriggerSpins`, and real Witch Pots amount is unknown | Pattern 3 | Cosmetic mismatch with live game |
| A3 | Base-queue Red / Purple run sequentially after the Green FS exits; only in-FS triggers nest | Pattern 1, Open Question 1 | If the user meant base-queue Red / Purple to run inside FS, the machine order changes (small change, but the contract is costly) |
| A4 | `bonusPrizes.freeSpins` stays unused at runtime | Pitfall 14 | If the user intended it as a FS prize ladder, extra math is needed |
| A5 | Nested wins are excluded from the FS exit total and included only in the night total | Pattern 1 | Splash totals differ from what the user expects |
| A6 | Night total splash shows when the path has two or more entries | Pattern 1 | Discretion item in CONTEXT.md; trivial to flip |
| A7 | Hold / Pick'em credit at exit splash; FS credits per spin | Pitfall 6 | Balance timing feel; low risk |
| A8 | DOM overlay for splash and lockers satisfies "full-screen" and D-12 | Pattern 7 | If the user wants lockers drawn in Pixi, CSS and hit testing must change |

## Open Questions (RESOLVED)

1. **What exactly nests during Free Spins?** — **RESOLVED**
   - What we know: D-16 fixes queue order for phones that fired on a spin; D-17 says nested Red / Purple pause FS and resume it; REQUIREMENTS says "where config allows".
   - Resolution (RESEARCH A3, adopted in 04-01 flagged_assumptions): Red / Purple already queued on the same base spin as Green run **after** the Green FS exit splash, in fixed Green → Red → Purple order. Only Red / Purple triggers rolled **inside** FS spins nest (pause FS, run nested queue, resume remaining FS), gated by `freeSpins.nested`. Nested features never nest again.
2. **Does `bonusPrizes.freeSpins` do anything?** — **RESOLVED**
   - What we know: FS pays line wins at the trigger bet in the reference game.
   - Resolution (RESEARCH A4, adopted in 04-01): keep the ladder in config and Zod validation; **no runtime use** in free spins math or payouts.
3. **When is Hold / Pick'em money credited?** — **RESOLVED**
   - Resolution (RESEARCH A7, adopted in 04-01 / 04-03 / 04-04): free spin line wins credit **per spin** at reels settle via `spinFree`; Hold and Pick'em credit **once** at `feature_exit` via `settleFeature` when the exit splash total is shown.
4. **FS compact win cycle:** how much of the line-win cycle to show per FS spin (all lines, best N, shorter interval). — **RESOLVED**
   - Resolution (04-02 flagged_assumptions): parameterize the existing win overlay with a shorter per-line interval during FS (do not drop lines or copy the overlay); tune `FS_WIN_CYCLE_MS` and `FS_GAP_MS` during execution (suggested 480 and 220).
5. **Art:** user may later supply locker / cash / splash art. — **RESOLVED**
   - Resolution (Phase 4 scope): ship **procedural** DOM lockers, Graphics/Text Hold cells, and splash chrome; **no new PNGs** in this phase (`HOTLINE_ASSET_URLS` stays at 17). Optional user art remains a later checkpoint with asset test updated in the same change.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vitest, Vite | yes | v24.18.0 | — |
| Vitest | Verify commands | yes | 3.2.7 | — |
| Browser for walkthrough | Visual UAT | not probed | — | User walkthrough as in Phase 3 |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none. No network services or new packages are required.

## Security Domain

`security_enforcement` is not set to false in `.planning/config.json` (the key is absent), so it is treated as enabled.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Client-only demo |
| V3 Session Management | no | No server session |
| V4 Access Control | no | No privileged actions |
| V5 Input Validation | yes | Zod parses the bundled config at mount (`weights`, `chances`, lengths); `pick(index)` ignores invalid indexes |
| V6 Cryptography | no | Demo `seedrandom`, not a fair RNG, as already stated in `createRng.ts` |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| DOM text injection through splash or prize strings | Tampering | `textContent` only, never `innerHTML` (repo already has an `.innerHTML` ban scan for Crash theater files; apply the same discipline) |
| Config tampering or malformed weights causing infinite or NaN math | Denial of service | Zod bounds, positive int weights, `maxRetriggers`, Hold termination bound |
| Listener or timer leak on Menu mid-night | Denial of service | Tick-driven timers, remove overlay listeners in `dispose` (SHELL-02 parity) |
| Double credit of a feature win | Tampering | Single credit call per feature, tested with balance assertions |

## Sources

### Primary (HIGH confidence)
- In-repo files read this session: `mountHotlineSession.ts`, `HotlineGame.ts`, `HotlineConfigSchema.ts`, `hotline.config.json`, `ComboQueue.ts` (+ test), `resolveCollectors.ts`, `PhoneMeters.ts`, `SpinEngine.ts`, `evaluatePaylines.ts`, `HotlineScene.ts`, `PhonesLayer.ts`, `TokenFlight.ts`, `ReelStrip.ts`, `createReelWindow.ts`, `winCycle.ts`, `HotlineHud.ts` (+ test), `collectPresentation.ts` (+ test), `AudioPort.ts`, `createBeepAudioPort.ts` (+ test), `loadHotlineAssets.ts`, `index.html` hotline template, `src/styles/hud.css`, `tests/architecture.no-pixi.test.ts`, `tests/hotline.assets.test.ts`, `tests/shell.hud-layout.test.ts`, `src/shared/money/cents.ts`, `src/shared/rng/createRng.ts`, `package.json`, `vite.config.ts`
- `.planning/phases/04-three-bonuses-combo-nights/04-CONTEXT.md`, `.planning/REQUIREMENTS.md`, `.planning/STATE.md`, `.planning/phases/03-diskette-collectors-trigger-queue/03-CONTEXT.md`

### Secondary (MEDIUM confidence)
- https://endorphina.com/news/3-witch-pots-endorphinas-multi-bonus-halloween-special (Endorphina press page via web search)
- https://gamblenexus.com/slots/3-witch-pots/ (review quoting game rules)

### Tertiary (LOW confidence)
- https://uk.slotuk.org/free-slots/3-witch-pots/ and https://respinix.com/demo/3-witch-pots/ (third party summaries; numbers conflict with official pages)
- https://endorphina.com/games/3-witch-pots (official page but internally inconsistent on ULTRA 500x versus 1000x)

## Project Constraints (from .cursor/rules/)

No `.cursor/rules/` directory exists. Directives come from `AGENTS.md` and are treated as locked:
- PixiJS v8, TypeScript, Vite, Vitest; client-only; JSON config stands in for server config validated with Zod
- Match Crash patterns: `logic` / `view` / `hud` split, shared `audio` / `rng` / `money`
- Code comments lowercase, no trailing period, no special symbols (arrows, em dashes)
- Portfolio voice: short human phrasing, minimal AI fingerprints in code, copy, commit messages
- Font: Retro Computer TTF in `src/shared/fonts/`
- Art: when graphics are needed, ask the user with an asset list; user generates and places files
- Scope: Witch Pots feature set only; no GSAP, no `pixi-reels`, no Howler this phase (Howler is deferred by CONTEXT)
- GSD workflow: file edits happen through a GSD command (execute-phase for this work)
- Note for copy: splash and strip UI copy may use plain ASCII words; the existing `→` joiner in `formatComboStrip` is runtime copy, not a code comment, so the comment rule does not apply to it

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH, no new packages and all pins read from `package.json`
- Architecture: HIGH for integration seams and nesting semantics (Open Questions resolved per A3 in plans)
- Pitfalls: HIGH, each cites a file or test read this session
- Reference game numerics: LOW to MEDIUM, sources disagree; irrelevant to correctness since config is illustrative

**Suggested plan slicing for the planner (waves):**
1. Config + Zod + sample JSON + prize helper + `HotlineGame` stream and bet capture groundwork (BONUS-01..03 contracts)
2. Pure logic: `freeSpins`, `holdAndWin`, `pickEm`, each with tests (parallel inside the wave)
3. Pure night machine + tests (BONUS-04), then `HotlineGame` integration (`spinFree`, credit, meters)
4. HUD and DOM: template overlay and feature line, CSS, `comboStripModel`, `FeatureOverlay`, new `SfxEvent` ids and test updates
5. View: `HoldLayer`, `JackpotStrip`, scene hold mode, win overlay interval parameter
6. Session rewrite: night presenter over the machine, update source-grep tests, then walkthrough checkpoint (including nested FS then Hold then Pick'em, Menu mid-night, seed replay)

**Research date:** 2026-10-11
**Valid until:** 2026-11-10 (stable stack, in-repo findings change only with new commits)
