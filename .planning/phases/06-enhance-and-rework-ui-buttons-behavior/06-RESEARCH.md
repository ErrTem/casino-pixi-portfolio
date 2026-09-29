# Phase 6: enhance and rework UI/buttons/behavior - Research

**Researched:** 2026-09-29
**Domain:** Compact JetX-like chrome shell, BET↔CASH OUT dual-line primary, Auto bet loop, mild climb slowdown, arcade-centered craft camera, Seed chip removal (silent `?seed=` only)
**Confidence:** HIGH (CONTEXT D-01..D-24 + live code seams); MEDIUM (exact zone rem budgets / soft path-mapping constants — discretionary)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Shell / chrome layout
- **D-01:** Full-viewport **100dvh** column: top chrome (money icon + balance, Reset demo, mute) → history strip → canvas (flex grow) → Auto cash out + Auto bet switches → large primary BET/CASH OUT + stake ± input + presets. No page scroll; history may swipe horizontally. — **Reversibility:** costly — reverses Phase 2/4 bottom-bar-only chrome.
- **D-02:** English labels (BET, CASH OUT, Auto bet, Auto cash out). JetX screenshot is layout/reference only (not Russian copy, not dual-bet / X2).
- **D-03:** Preset chips: **20 / 50 / 100 / ALL** plus free-form via ± input (replace `10/25/50/100/250/500`). ALL = max allowed vs balance/rules.
- **D-04:** Auto cash out UI = **toggle + ± multiplier field** (WALT-04 remains editable).
- **D-05:** Keep Phase 5 polish in compact shell: waiting countdown (canvas), session avg/max near history, Space/Enter cash-out with input-focus guard.

#### Primary button / win amount
- **D-06:** Live win amount (stake × current ×) shows **on the CASH OUT button only** (JetX dual-line). — **Reversibility:** costly
- **D-07:** Waiting: primary shows **BET + stake amount** (dual-line).
- **D-08:** After personal cash-out (spectator finish): **frozen cashed amount + disabled “CASHED OUT”** until crash → waiting.
- **D-09:** Crash with no cash-out: **snap back to BET + stake** as soon as waiting — no CRASHED button state.

#### Auto bet
- **D-10:** Auto bet ON → **auto-place the same stake every waiting round** as soon as waiting allows a bet. — **Reversibility:** one-way — new product behavior.
- **D-11:** Place next stake **immediately when waiting starts** (not after countdown ends).
- **D-12:** On insufficient balance / broke: **stop Auto bet** and emphasize Reset demo.
- **D-13:** While Auto bet ON, player may still edit stake / presets / Auto CO; edits apply to the **next** auto-place.

#### Climb feel (GameLogic)
- **D-14:** Mild authoritative slowdown: retune `growthRatePerMs` so ~**2× at ~3.5–4s** (was ~2.5s). — **Reversibility:** costly
- **D-15:** Crash distribution unchanged (house edge / floor / cap / RNG) — only growth rate changes.
- **D-16:** Soften Phase 3 path mapping as part of arcade camera (not keep steeper-after-~2× as-is).

#### Arcade camera / craft
- **D-17:** Craft stays **near screen center**; graph/trail **scrolls under** it (camera follows tip mid-frame). — **Reversibility:** costly — replaces path-tip-follow view contract from Phase 3.
- **D-18:** Craft orientation: **mostly level / gentle tilt** (not hard path-tangent).
- **D-19:** Crash FX unchanged: trail severs red, craft vanishes, brief flash, hold, idle; camera freezes at crash frame.
- **D-20:** Theater × stays **upper third**, clear of the craft.

#### Seed surface
- **D-21:** Remove **Seed chip** and on-screen seed UX; keep **silent `?seed=`** boot for QA/replay. — **Reversibility:** costly — adjusts PLSH-03 product contract.
- **D-22:** Missing/invalid `?seed=` → quiet fallback to `"portfolio-demo"` (no on-screen note).
- **D-23:** Adjust PLSH-03 wording to “optional silent `?seed=` boot only; no Seed chip / on-screen seed.”
- **D-24:** Keep `parseBootSeed` helper + tests; delete/stop wiring `seedChip` HUD only.

### Carried forward (do not reopen)
- Continuous 5s waiting → auto-launch / spectator rounds (Phase 1 D-13–D-15).
- Wallet economy + `resetWallet()`; broke never auto-refills (Phase 1 D-01–D-04; Phase 2).
- Durable `cashed_out` spectator finish + dual theater × (Phase 3 D-16).
- GameLogic pure — no Pixi/DOM in `logic/` (ARCH-02).
- Canvas `pointer-events: none`; monetary controls stay HTML (Phase 2–4).
- Mute / AudioPort / SFX edges / keyboard cash-out / countdown / session stats (Phase 5) — relocate chrome, do not rip out.
- No dual-bet / X2 panel; no lobby/shell framework; no real-money; no DEMO badge UI.
- Chip click fills input only (no `placeBet` on chip) — ALL fills max affordable only.
- Flash / crash FX must not write `app.stage.x` / `app.stage.y` (Phase 3 D-10) — camera offset belongs on a **world Container**, not the stage.

### Claude's Discretion (researcher resolves below)
- Exact `growthRatePerMs` that lands ~2× in the 3.5–4s band.
- Exact soft path-mapping params for arcade scroll camera within D-16/D-17.
- Exact 100dvh zone height budget (top / history / bottom) so canvas stays playable on small phones.
- Auto-bet implementation site (composition root vs HUD binder) as long as D-10–D-13 hold and GameLogic stays pure.
- ALL chip semantics edge cases (rounding to max affordable within min/max).
- Whether Auto cash-out ± field is disabled/dimmed when Auto cash-out toggle is OFF (recommend dimmed/disabled when OFF).

### Deferred Ideas (OUT OF SCOPE)
- Dual simultaneous bets / X2 panel
- Full removal of `?seed=` boot path (UI-only removal)
- Stronger arcade crash FX (eject/explode)
- Retuning crash RNG distribution
</user_constraints>

<phase_requirements>
## Phase Requirements

**Status:** ROADMAP lists `Requirements: TBD`; REQUIREMENTS.md has **no Phase 6 IDs** and still lists Auto-bet under **v2 Deferred**. Planner must promote Auto-bet into Active/v1 for this phase and refine ROADMAP goal/success criteria. Research proposes temporary phase-local IDs below (planner may rename when mapping REQUIREMENTS.md).

| ID (proposed) | Description | Research Support |
|---------------|-------------|------------------|
| **UI-01** | Compact no-scroll 100dvh shell (top chrome → history → canvas → autos → primary/stake/presets) | Rebuild `index.html` + `hud.css` zones per D-01/D-02/D-05; supersede Phase 2/4 bottom-bar-only model while keeping touch targets ≥44px and safe-area padding. |
| **UI-02** | Single primary BET↔CASH OUT with dual-line stake / live win / frozen CASHED OUT | Retarget `chromeMode` + enablement; one primary button; win = `bet × multiplier` while flying; frozen from `cashOutAt` while `cashed_out` (D-06–D-09). |
| **UI-03** | Auto bet places the current stake at each waiting start; stops on broke | Session UI flag + waiting-edge `placeBet`; GameLogic unchanged; stop + Reset emphasis on fail (D-10–D-13). |
| **WALT-03Δ** | Presets become 20 / 50 / 100 / ALL (+ ± free-form) | Replace `PRESET_CHIPS`; ALL = `min(maxBet, balance)` floored; fill-only contract preserved. |
| **WALT-04Δ** | Auto cash out = toggle + ± multiplier field | Keep `setAutoCashOut`; chrome becomes switch + field; dim/disable field when OFF. |
| **FEEL-01** | Mild climb slowdown: ~2× at ~3.5–4s | Retune `CRASH_CONFIG.growthRatePerMs` only; crash sampler untouched (D-14/D-15). Update `tests/multiplierCurve.test.ts`. |
| **FEEL-02** | Arcade camera: craft near center; graph scrolls; gentle tilt | World-container camera offset in `CrashScene`; soften `pathMapping`; clamp rotation (D-16–D-20). |
| **PLSH-03Δ** | Silent `?seed=` boot only; no Seed chip / on-screen seed | Keep `parseBootSeed` + `createGame({ seed })`; remove `seedChip` wiring / DOM (D-21–D-24). Amend REQUIREMENTS PLSH-03 wording per D-23. |
| **VIS-01Δ / ARCH-03Δ** | Hybrid visual + mobile still true under new chrome/camera | Re-verify canvas flex-grow + no page scroll + no canvas tap steal on phone after shell rebuild. |

### ROADMAP goal refinement (planner must write)

Suggested goal (replace `[To be planned]`):

> As a recruiter on phone or desktop, I want a compact JetX-like Crash chrome with a dual-line BET/CASH OUT, Auto bet, a milder climb, and a centered craft over a scrolling graph — so the demo feels finished before milestone close without dual-bet or lobby scope.

Suggested success criteria (planner drafts exact list):

1. Viewport is 100dvh with no page scroll; layout matches D-01 zones on phone/tablet/desktop.
2. Primary control cycles BET+stake → CASH OUT+live win → CASHED OUT frozen → BET on next wait (D-06–D-09).
3. Auto bet ON auto-places at waiting start; stops and emphasizes Reset when broke (D-10–D-12).
4. Authoritative ~2× lands in 3.5–4s band; crash distribution unchanged (D-14/D-15).
5. Craft stays near center with scrolling trail + gentle tilt; crash FX unchanged (D-17–D-19).
6. Seed chip gone; `?seed=` still boots quietly (D-21–D-24); Phase 5 polish (countdown, mute, stats, keyboard) still works.
</phase_requirements>

## Project Constraints (from PROJECT.md / prior phases)

- Stack lock: PixiJS v8 + TypeScript + Vite. No React/Angular.
- Client-side only; GameLogic pure (ARCH-02).
- Monetary controls stay HTML; Pixi is spectacle-only.
- No DEMO badge UI; no real money; no dual-bet / lobby in this phase.
- Vitest on Node remains the automated gate; layout/camera feel need browser QA.
- Phase 3: never drive outcomes from sprite position; ticker → `game.tick` only.
- Phase 4 touch / safe-area / `pointer-events` contracts still apply under new zone geometry.
- FEATURES.md previously deferred Auto-bet to v2 — **Phase 6 explicitly pulls it in** via D-10..D-13; update REQUIREMENTS/FEATURES when planning.

## Summary

Phase 6 is a **product-feel rework** on a complete playable loop: rebuild the HTML shell into a JetX-like 100dvh column, collapse Place bet / Cash out into one dual-line primary, add session Auto bet, mildly slow the authoritative climb, replace tip-follow with an arcade-centered scrolling camera, and strip the Seed chip while keeping silent `?seed=` boot. GameLogic stays pure except the single `growthRatePerMs` retune; Auto bet is composition/HUD automation over existing `placeBet`, not a new FSM phase.

**Primary recommendation:** Ship in four waves — (1) shell + primary dual-line + presets/Auto CO chrome, (2) Auto bet waiting-edge loop, (3) growthRate + curve tests, (4) arcade camera + Seed chip removal / PLSH-03Δ docs. Prefer a **world Camera Container** for D-17 (not `stage` transforms). Prefer Auto bet edge-detect in **composition root or HUD render** mirroring Phase 5 `sfxEdges` (GameLogic untouched).

**Walking skeleton (MVP):** Open demo → top balance/mute/reset + history above canvas → toggle Auto bet → stake auto-places at wait start → primary shows BET 100 → flight → CASH OUT with live win → cash out → CASHED OUT frozen → wait → BET again; craft stays mid-frame; `?seed=` still works with no Seed chip.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Round FSM / wallet / settle / crash sampler | GameLogic (unchanged except growth) | — | D-15; ARCH-02 |
| `growthRatePerMs` retune | `config.ts` + `MultiplierCurve` tests | — | D-14 single knob |
| Shell zones / 100dvh / no page scroll | `index.html` + `hud.css` | CrashHud selectors | D-01 supersedes Phase 2/4 bar model |
| Primary dual-line BET/CASH OUT | CrashHud + chromeMode/enablement | snapshot `bet`/`multiplier`/`cashOutAt` | D-06–D-09 |
| Auto bet session flag + auto `placeBet` | Composition root and/or HUD | `enablementFrom` | D-10–D-13; outside logic |
| Presets 20/50/100/ALL | `chips.ts` + max-affordable helper | fill bet input only | D-03; WALT-03 fill contract |
| Auto CO toggle + ± field | HUD chrome | `setAutoCashOut` | D-04; WALT-04 |
| Arcade camera / soft path / gentle tilt | `CrashScene` + `pathMapping` + world Container | Rocket pose | D-16–D-20; Pixi skill: Container transforms |
| Theater countdown / × | TheaterText (unchanged placement rules) | — | D-05 / D-20 |
| Mute / SFX / keyboard / session stats | Existing Phase 5 paths; relocate DOM | — | D-05 |
| Silent `?seed=` | `parseBootSeed` + `main.ts` | delete seedChip wiring | D-21–D-24 |
| Crash FX sever/flash/hold | CurveGraph + viewMode (unchanged choreography) | freeze camera at crash | D-19 |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Existing Vite + TS + Pixi | vite 6.4.3 / pixi.js 8.21.0 | Shell + view | No new renderer. `[VERIFIED: prior phases]` |
| Existing GameLogic + Vitest | vitest 3.2.7 | growthRate tests; pure helpers | Node gate. `[VERIFIED]` |
| Existing HTML HUD binders | — | Chrome rebuild | Thin binder pattern from Phase 2–5 |
| Pixi `Container` world/camera | pixi.js 8 | Camera offset under craft | Skill: group transforms on Container; avoid stage.x/y |

### Supporting

| Piece | Role | Notes |
|-------|------|-------|
| `CRASH_CONFIG.growthRatePerMs` | Climb pace | Recommend `Math.LN2 / 3750` (~2× @ 3.75s, mid-band) |
| Pure `maxAffordableStake(balance)` | ALL chip | `Math.min(maxBetDisplay, floor(balance))` clamped ≥ min when affordable |
| Pure `primaryChromeFrom(snap)` (optional) | Dual-line label/amount | Testable without DOM |
| Pure `shouldAutoPlaceBet(...)` | Auto bet gate | Waiting + no bet + flag + not broke |
| `parseBootSeed` | Silent boot | Keep; stop passing seed into HUD for chip |

### Out of scope installs

- No Howler, no GSAP, no React, no new UI framework.

## Current Code Baseline (verified this session)

| Area | Today | Phase 6 delta |
|------|-------|---------------|
| Shell | Canvas above; `#hud-bar` bottom three-zone grid; ≤720px `--hud-bar-height: 15.5rem` with internal scroll | Full-column zones; **no page scroll**; bottom controls stay content-sized within dvh budget |
| Primary | Separate Place bet + Cash out; promote Cash out full-width when flying/cashed_out | **One** dual-line primary; CASHED OUT disabled state |
| Presets | `[10,25,50,100,250,500]` | `[20,50,100]` + ALL |
| Auto CO | Always-on number input + Clear | Toggle + ± field (dim when OFF) |
| Auto bet | None (v2 deferred) | New session toggle + waiting-edge place |
| Climb | `growthRatePerMs = Math.LN2/2500` (~2× @ 2.5s) | `Math.LN2/3750` (~2× @ 3.75s) |
| Camera | Rocket at tip; log2-x / linear-y; hard tangent rotation | Tip locked near center via world offset; softer mapping; gentle tilt |
| Seed | `parseBootSeed` + Seed chip in HUD | Parse only; remove chip mount/DOM |
| Composition | `main.ts`: tick → SFX edges → hud.render → scene.sync | Add Auto bet edge (or HUD-owned) |

Key files: `index.html`, `src/styles/hud.css`, `CrashHud.ts`, `chromeMode.ts`, `enablement.ts`, `chips.ts`, `seedChip.ts`, `main.ts`, `config.ts`, `MultiplierCurve.ts`, `CrashScene.ts`, `pathMapping.ts`, `Rocket.ts`, `CurveGraph.ts`, `parseBootSeed.ts`, `tests/multiplierCurve.test.ts`.

## Discretion Resolutions

| Topic | Resolution | Rationale |
|-------|------------|-----------|
| `growthRatePerMs` | **`Math.LN2 / 3750`** | Midpoint of 3.5–4s band; still `e^(r·t)`; single config edit. Optional micro-tune in QA if feel drifts. |
| Soft path mapping | Reduce mid-flight “shoot up” emphasis: blend toward more linear X (less pure `log2`) and/or lower `SCALE_HEADROOM` aggressiveness so tip motion is smoother under a fixed craft. Keep origin at m=1. Export tunables in `VIEW_CONFIG` / `pathMapping`. | D-16 + arcade scroll readability |
| Gentle tilt | `rotation = clamp(pathTangentRadians(...), ±~12–18°)` or `lerp(0, tangent, 0.25)` | D-18; streak still local −X |
| Zone budget | Target: top chrome ~2.5–3rem; history+stats ~2–2.5rem; bottom autos ~2.5rem; primary+stake+presets ~5.5–7rem; **canvas = leftover**; `overflow: hidden` on `html/body/.app-shell`; history `pan-x` only | Small-phone canvas survivability |
| Auto bet site | **Prefer composition-root waiting-edge** (like `sfxEdges`) calling `game.placeBet` with stake from HUD getter **or** HUD `render` detecting edge — either OK. Recommend: HUD owns toggle + stake read; **pure helper** decides; call site in `main` ticker after snap for one place. | Keeps GameLogic pure; avoids double-place |
| ALL chip | `maxAffordable = Math.min(DISPLAY_MAX, Math.floor(balance))`; if `maxAffordable < DISPLAY_MIN` disable ALL / treat as broke path; fill input only | Matches wallet rules |
| Auto CO field when OFF | **Disabled + dimmed** when toggle OFF; clearing toggle calls `setAutoCashOut(null)` | Prevents accidental targets; WALT-04 still available when ON |

## Patterns

### Pattern 1 — 100dvh column shell (D-01)

```
.app-shell (100dvh, column, overflow:hidden)
  #top-chrome      — balance · Reset · mute
  #history-band    — session stats + history strip (pan-x)
  #game-canvas-host — flex:1; min-height:0; pointer-events:none
  #controls-band
    auto-row       — Auto cash out (toggle+±) · Auto bet (toggle)
    action-row     — primary BET/CASH OUT · stake ± · presets
```

- Drop Phase 4 fixed `--hud-bar-height` **as the sole canvas budget model**; canvas flex-grow is the leftover after chrome bands.
- Keep `env(safe-area-inset-*)` on top and bottom bands.
- Preserve `touch-action: manipulation` on buttons; `pan-x` on history.
- Do **not** put monetary controls inside `#game-canvas-host`.

### Pattern 2 — Primary dual-line chrome (D-06–D-09)

Derive mode from phase (not only `canCashOut`):

| Snapshot | Primary label | Amount line | Enabled |
|----------|---------------|-------------|---------|
| `waiting` (or post-crash wait) | BET | stake from bet input | `canPlaceBet` |
| `flying` + has bet | CASH OUT | `formatMoney(bet × multiplier)` | `canCashOut` |
| `cashed_out` | CASHED OUT | frozen `formatMoney(bet × cashOutAt)` or paid amount | disabled |
| `flying` spectator (no bet) | BET or neutral | — | disabled place; do not show fake CASH OUT win |

Implementation notes:

- Prefer **one** `<button data-action="primary">` with two `<span>` lines (or `::` CSS) instead of two separate buttons — simplifies promote CSS.
- Retire or narrow `chromeModeFrom` “promote-cashout” full-width dual-button rules; primary is always the large CTA.
- Click: waiting → `placeBet`; flying+canCashOut → `requestCashOut`; else no-op.
- Keyboard Space/Enter still gate on `enablementFrom(...).canCashOut` (D-05).

### Pattern 3 — Auto bet waiting-edge (D-10–D-13)

```ts
// Pure helper (unit-testable)
function shouldAutoPlaceBet(args: {
  autoBetOn: boolean;
  phase: Phase;
  prevPhase: Phase | null;
  hasBet: boolean;
  broke: boolean;
}): boolean {
  if (!args.autoBetOn || args.broke || args.hasBet) return false;
  if (args.phase !== "waiting") return false;
  // Edge: entered waiting this frame, OR first frame with flag already on
  return args.prevPhase !== "waiting";
}
```

Also handle: user turns Auto bet **ON during waiting** with no bet → place immediately (treat as synthetic edge).

On `placeBet` result `broke` / `insufficient_balance`: set `autoBetOn = false`, emphasize Reset (existing broke UX). Do **not** call `resetWallet` automatically.

Stake source: current bet-input value (after chip/± edits). Edits do not re-place mid-wait if a bet already locked (D-13 = next round).

SFX: successful auto-place should fire `bet_lock` like manual place (reuse HUD path or call audio from the same place helper).

### Pattern 4 — Climb retune (D-14/D-15)

```ts
// config.ts
growthRatePerMs: Math.LN2 / 3750, // ~2× @ 3.75s (Phase 6 D-14)
```

Update `tests/multiplierCurve.test.ts` assertions from 2500 → 3750. Do **not** change `houseEdge`, `crashFloor`, `crashCap`, or `CrashRng`. Settlement still uses `roundedMult` / hundredths.

### Pattern 5 — Arcade camera (D-16–D-20)

```
stage
  backdrop          (screen-fixed)
  world (Container) ← position = screenCenter - tipLocal
    curve
    ghost
    rocket          ← stays near center via world offset
  theater           (screen-fixed, upper third)
  flash             (screen-fixed)
```

- Climb: compute tip in plot space; set `world.position` so tip maps to ~center (slightly below theater).
- Crash hold/fade: **freeze** last world offset (D-19).
- Idle: world identity or origin-centered park + bob (existing idle).
- Soften `plotPoint` mapping (D-16) so early climb does not stick left and late climb does not vertical-spike as hard.
- Rotation: gentle tilt only (D-18); update Rocket streak assumption still local −X.
- Never set `app.stage.x/y` (Phase 3 flash contract).

Pixi skill note: use a dedicated `Container` for the scrolling world; `position`/`pivot` on that container — see `.agents/skills/pixijs-scene-container`.

### Pattern 6 — Seed chip removal (D-21–D-24)

- Keep `parseBootSeed` + tests + `main.ts` `createGame({ seed })`.
- Stop passing `{ seed, invalid }` into `mountCrashHud` for chip mounting (or make options ignore seed).
- Remove `#`/`data-field=seed-chip` from `index.html`; delete or orphan `seedChip.ts` (prefer delete file + CSS once unreferenced).
- Invalid seed: quiet fallback only — no on-screen “using default” (D-22 reverses Phase 5 chip note).
- Update REQUIREMENTS PLSH-03 text per D-23 during planning/docs wave.

## Pitfalls

| Pitfall | Why it bites | Mitigation |
|---------|--------------|------------|
| Double `placeBet` on waiting edge | Ticker + HUD both auto-place | Single call site; guard `hasBet` / `bet_already_placed` |
| Auto bet after broke keeps trying | Spam status / SFX | D-12 stop flag on fail; broke emphasize Reset |
| Page scroll returns on small phones | Chrome taller than dvh | `100dvh` + `overflow:hidden` + measure bands; shrink presets wrapping |
| Canvas steals taps | Host stacking regression | Keep `pointer-events: none` on host/canvas |
| Camera via `stage.x/y` | Breaks flash / hit assumptions | World Container only |
| Hard tangent under arcade camera | Nose spins; fights “level craft” | Clamp/lerp rotation |
| Growth retune without test update | CI red / wrong feel locked | Update multiplierCurve tests in same plan |
| ALL chip calls `placeBet` | Pitfall 4 double-place / WALT-03 | Fill-only |
| Seed chip half-removed | Dead DOM / options throw | Remove host requirement when seed not for chip |
| Treating Auto bet as GameLogic phase | Pollutes ARCH-02 / tests | Session UI flag only |
| Dual-bet scope creep | Screenshot X2 | Explicitly out (CONTEXT deferred) |
| Promoting Cash out CSS for two buttons | Orphan styles | Rewrite promote rules for single primary |

## Open Questions (RESOLVED)

### Q1: Exact growthRate constant?
- **RESOLVED:** `Math.LN2 / 3750` (~2× @ 3.75s). QA may nudge within 3500–4000 without reopening D-14.

### Q2: Auto bet ownership?
- **RESOLVED:** Session flag in HUD; place decision via pure helper; invoke from composition ticker or HUD once per edge. GameLogic unchanged.

### Q3: Primary = one button or two restyled?
- **RESOLVED:** Prefer **one** primary button with dual-line content for JetX parity and simpler enablement.

### Q4: Soft path-mapping formula?
- **RESOLVED (direction):** Soften log2-X dominance / headroom so tip motion is smoother under fixed craft; keep named VIEW_CONFIG tunables; exact coefficients discretionary in camera plan.

### Q5: Requirement IDs?
- **RESOLVED for research:** Use proposed UI-01..03 / FEEL-01..02 / Δ markers; planner maps into REQUIREMENTS.md + ROADMAP (promote Auto-bet out of v2 Deferred; amend PLSH-03).

## Environment Availability

| Dependency | Required By | Available | Fallback |
|------------|-------------|-----------|----------|
| Node / Vitest / Vite / Pixi | build + tests + view | ✓ (existing) | — |
| `100dvh` | shell | ✓ modern browsers | `100vh` fallback in CSS |
| Existing AudioPort / mute | D-05 | ✓ | — |
| `parseBootSeed` | silent seed | ✓ | — |
| JetX screenshot (layout ref) | visual QA | user-attached / workspace | English labels only |

**Missing dependencies with no fallback:** none.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.7 (existing) |
| Config | `vitest.config.ts` node env |
| Quick run | `npx vitest run tests/multiplierCurve.test.ts src/games/crash/hud src/shared/boot` |
| Full suite | `npm test` |
| Typecheck | `npx tsc --noEmit` |

### Phase Requirements → Test Map (Nyquist)

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| FEEL-01 | `multiplierAt(0)===1`; `multiplierAt(3750)===2` with `LN2/3750`; config constant matches | unit | `vitest tests/multiplierCurve.test.ts` | ✅ update existing |
| FEEL-01 | Crash sampler / houseEdge unchanged | unit | existing crash RNG / settlement tests | ✅ no change expected |
| UI-03 | `shouldAutoPlaceBet` true only on waiting edge + flag + !hasBet + !broke | unit | new `autoBet.test.ts` (or hud helper) | ❌ Wave 0 |
| UI-03 | Toggle ON mid-wait with no bet → place once | unit | helper + optional HUD harness | ❌ Wave 0 |
| UI-03 | Broke / insufficient → flag clears (logic of stop) | unit | helper / small state fn | ❌ Wave 0 |
| UI-02 | `primaryChromeFrom(snap, stake)` → BET / CASH OUT / CASHED OUT labels + amounts | unit | new pure helper test | ❌ Wave 0 |
| WALT-03Δ | `PRESET_CHIPS` / ALL max-affordable helper | unit | update `chips.test.ts` + `maxAffordableStake` | ✅ update / extend |
| WALT-04Δ | Toggle OFF → `setAutoCashOut(null)` contract (binder) | unit/manual | prefer thin pure “effective target” if extracted | ❌ optional |
| PLSH-03Δ | `parseBootSeed` still valid/invalid/missing | unit | `parseBootSeed.test.ts` | ✅ keep |
| PLSH-03Δ | No Seed chip mount requirement in HUD | unit/static | HUD throws only on remaining required fields; grep seed-chip absent | ❌ assert in plan |
| FEEL-02 | Soft `plotPoint` / tilt clamp pure math | unit | `pathMapping` / tilt helper tests | ❌ Wave 0 recommended |
| UI-01 | 100dvh no page scroll; zones; canvas leftover | manual | DevTools phone + desktop | manual |
| UI-02 | Dual-line live win updates mid-flight; CASHED OUT freeze | manual | play round | manual |
| UI-03 | Auto bet consecutive rounds; stop on broke | manual | drain wallet | manual |
| FEEL-02 | Craft centered; trail scrolls; crash freeze | manual | watch climb/crash | manual |
| D-05 | Countdown / mute / stats / Space-Enter still work | manual | regression | manual |
| ARCH-02 | logic/ still pixi-free after growth edit | unit | `tests/architecture.no-pixi.test.ts` | ✅ |

Manual-only justification: 100dvh layout, camera centering, dual-line visual chrome, and Auto bet cadence feel are not meaningful in Node Vitest. Nyquist sampling = pure helpers + growth curve + ARCH-02 automated every commit; layout/camera/autobet UAT at wave/phase gates.

### Sampling Rate

- **Per task commit:** `npm test` after TS touches; `tsc --noEmit` when HUD/view signatures change.
- **Per wave merge:** full `npm test` + `tsc` + focused manual checklist for that wave’s ACs.
- **Phase gate:** Manual pass against refined ROADMAP success criteria; `/gsd-verify-work`; update PLSH-03 / Auto-bet in REQUIREMENTS.md.

### Wave 0 Gaps

- [ ] Update `tests/multiplierCurve.test.ts` for 3.5–4s band (paired with config change)
- [ ] Pure `maxAffordableStake` / ALL chip tests (replace old PRESET list expectations)
- [ ] Pure `shouldAutoPlaceBet` (+ optional primary chrome helper) tests
- [ ] Soft path / tilt helper tests (recommended for FEEL-02)
- [ ] Remove Seed chip DOM + wiring; keep `parseBootSeed` tests green
- [ ] Manual QA checklist: phone 100dvh, Auto bet loop, dual-line amounts, arcade camera, silent `?seed=`
- [ ] REQUIREMENTS.md / ROADMAP.md / FEATURES.md: promote Auto-bet; amend PLSH-03; set Phase 6 goal + req IDs

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V5 Input Validation | yes | Existing placeBet finite checks; Auto bet uses same path; `?seed=` still bounded by `parseBootSeed` |
| V2/V3/V4/V6 | no | Demo only; mute localStorage preference unchanged |

### Known Threat Patterns

| Pattern | Mitigation |
|---------|------------|
| XSS via seed UI | Seed chip removed — less surface; keep `textContent` if any residual display |
| Auto bet draining wallet | Expected demo behavior; stop on broke; Reset explicit |
| Clipboard / seed copy orphan | Remove copy UI with chip |

## Plan Mapping (for planner)

| Plan | Research focus | Primary files |
|------|----------------|---------------|
| **06-01** Compact shell + primary dual-line + presets/Auto CO chrome | Patterns 1–2; WALT-03Δ/04Δ; relocate mute/stats/history | `index.html`, `hud.css`, `CrashHud.ts`, `chromeMode.ts`, `chips.ts`, enablement/css |
| **06-02** Auto bet toggle + waiting-edge place + broke stop | Pattern 3; UI-03 | `CrashHud.ts` and/or `main.ts`, new helper+tests |
| **06-03** Climb slowdown | Pattern 4; FEEL-01 | `config.ts`, `tests/multiplierCurve.test.ts` |
| **06-04** Arcade camera + soft path + gentle tilt; Seed chip removal + PLSH-03Δ docs | Patterns 5–6; FEEL-02; D-21–D-24 | `CrashScene.ts`, `pathMapping.ts`, `Rocket.ts`, `viewConfig.ts`, remove `seedChip`, REQUIREMENTS/ROADMAP notes |

**MVP / tracer-first hint:** 06-01 should make the new shell + primary button playable end-to-end before Auto bet. 06-02 adds consecutive-round automation. 06-03 is a one-knob logic/feel change (can parallel after 06-01). 06-04 is the Pixi camera + seed cleanup wave.

**UI hint:** Phase has strong visual/layout risk — planner should budget CSS zone QA on ≤390px width; avoid card chrome / purple glow; English JetX-like density without cloning commercial assets/IP.

**Requirement mapping note:** Before execute, update `.planning/REQUIREMENTS.md` (PLSH-03Δ, add Auto-bet / UI reqs or map proposed IDs) and `.planning/ROADMAP.md` Phase 6 Goal/Requirements/Success Criteria — currently placeholders.

## Sources

### Primary (HIGH confidence)

- `.planning/phases/06-enhance-and-rework-ui-buttons-behavior/06-CONTEXT.md` — D-01..D-24
- `.planning/phases/06-enhance-and-rework-ui-buttons-behavior/06-DISCUSSION-LOG.md` — choice matrix
- `.planning/REQUIREMENTS.md` — v1 complete; Auto-bet still v2; PLSH-03 to amend
- `.planning/ROADMAP.md` — Phase 6 placeholder goal/reqs
- `.planning/STATE.md` — Phase 6 context gathered
- `.planning/PROJECT.md` — stack / HTML+Pixi / no DEMO badge
- Prior CONTEXT 01–05 — cadence, bottom-bar (superseded), path/tangent, mobile bar, polish seed chip (reversed)
- `src/main.ts`, `index.html`, `src/styles/hud.css`
- `src/games/crash/hud/*` — CrashHud, enablement, chromeMode, chips, seedChip, sessionStats
- `src/games/crash/logic/config.ts`, `MultiplierCurve.ts`, `CrashGame.ts`, `RoundState.ts`
- `src/games/crash/view/CrashScene.ts`, `pathMapping.ts`, `Rocket.ts`, `viewConfig.ts`
- `src/shared/boot/parseBootSeed.ts`
- `tests/multiplierCurve.test.ts`
- `.agents/skills/pixijs-scene-container/SKILL.md` — world Container camera
- `.planning/research/FEATURES.md` — Auto-bet previously differentiator/deferred

### Secondary (MEDIUM confidence)

- JetX layout reference (user screenshot) — chrome topology only; English labels; no X2
- Exact rem band splits on notched phones — verify in 06-01 QA

### Tertiary (LOW confidence)

- Precise soft-mapping coefficients and tilt radians — tune during 06-04
- Whether primary win line uses `formatMoney` vs raw × string — prefer money for JetX-like “amount” read

## Metadata

**Research scope:**

- Core technology: existing Vite/Pixi/HTML HUD + one GameLogic constant
- Ecosystem: no new libraries
- Patterns: 100dvh shell, dual-line primary, Auto bet edge, growth retune, world camera, seed UI removal
- Pitfalls: double-place, dvh overflow, stage transforms, requirement doc drift

**Confidence breakdown:**

- Architecture / file seams: HIGH — verified against live `src/`
- Discretion constants (3750ms, tilt clamp, zone rem): MEDIUM — locked direction, tunable in plans
- Requirement ID final names: MEDIUM — proposed; planner owns REQUIREMENTS mapping

**Research date:** 2026-09-29
**Valid until:** 2026-10-29 (30 days; layout/Pixi Container APIs stable)

---

*Phase: 06-enhance-and-rework-ui-buttons-behavior*
*Research completed: 2026-09-29*
*Ready for planning: yes*
