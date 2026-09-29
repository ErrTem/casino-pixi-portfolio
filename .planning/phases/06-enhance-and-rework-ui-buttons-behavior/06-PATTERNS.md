# Phase 6: enhance and rework UI/buttons/behavior - Pattern Map

**Mapped:** 2026-09-29
**Files analyzed:** 24
**Analogs found:** 24 / 24

## Status

Phases 1–5 shipped a complete playable Crash loop: pure GameLogic, HTML three-zone bottom HUD, Pixi tip-follow camera, mute/Seed/stats/keyboard polish. Phase 6 is a **product-feel rework** — not greenfield. Shell zones rebuild on `index.html` + `hud.css`; primary dual-line retargets `CrashHud` / `chromeMode` / `enablement`; Auto bet is a session flag + waiting-edge `placeBet` (mirror `sfxEdges`); climb retune is one `CRASH_CONFIG` knob; arcade camera wraps existing curve/rocket in a world `Container`; Seed chip dies while `parseBootSeed` stays.

**Consume, do not rewrite:** `src/games/crash/logic/CrashGame.ts` / `resolveTick.ts` / `CrashRng.ts` (FSM / settle / crash sampler untouched except growth constant), `src/shared/boot/parseBootSeed.ts` (silent `?seed=`), `src/games/crash/view/TheaterText.ts` + countdown path (D-05), `src/shared/audio/**` (mute / SFX edges — relocate DOM only), `src/games/crash/hud/historyStrip.ts` + `sessionStats.ts` (move near top history band), `src/games/crash/hud/format.ts` (`formatMoney` / `formatMult` for dual-line amounts).

**Out of phase:** Dual-bet / X2 panel, lobby/shell framework, Howler/GSAP/React, stronger crash FX, crash RNG retune, full removal of `?seed=` boot, DEMO badge, real money.

| Authority | Use for |
|-----------|---------|
| `index.html` + `hud.css` + Phase 4 safe-area / touch | 100dvh column zones (D-01); canvas leftover; no page scroll |
| `CrashHud` + `enablementFrom` + `chromeModeFrom` | Dual-line primary, Auto CO toggle, Auto bet flag, broke Reset emphasize |
| `main.ts` ticker + `sfxEdges` edge shape | Waiting-edge Auto bet invoke (single call site) |
| `config.ts` + `multiplierCurve` tests | `growthRatePerMs = Math.LN2 / 3750` (D-14) |
| `CrashScene` stage children + `pathMapping` + `Rocket.syncPose` | World Container camera; soft plot; gentle tilt clamp |
| `06-RESEARCH.md` Patterns 1–6 | Shell topology, primary table, Auto bet helper, climb, camera, seed removal |

Match quality: `exact` = same file to modify; `role-match` = same role and data flow, different file; `partial` = same convention, different layer; `none` = establish from RESEARCH.

All analog paths below are present under `src/` / `tests/` / `index.html` / `.planning/` (working tree).

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `index.html` | view | batch | `index.html` | exact |
| `src/styles/hud.css` | view | batch | `src/styles/hud.css` | exact |
| `src/games/crash/hud/CrashHud.ts` | view | event-driven | `src/games/crash/hud/CrashHud.ts` | exact |
| `src/games/crash/hud/chromeMode.ts` | utility | transform | `src/games/crash/hud/chromeMode.ts` | exact |
| `src/games/crash/hud/enablement.ts` | utility | transform | `src/games/crash/hud/enablement.ts` | exact |
| `src/games/crash/hud/chips.ts` | utility | transform | `src/games/crash/hud/chips.ts` | exact |
| `src/games/crash/hud/chips.test.ts` | test | transform | `src/games/crash/hud/chips.test.ts` | exact |
| `src/games/crash/hud/primaryChrome.ts` (optional new) | utility | transform | `src/games/crash/hud/chromeMode.ts` + `format.ts` | role-match |
| `src/games/crash/hud/primaryChrome.test.ts` (optional) | test | transform | `src/games/crash/hud/chromeMode.test.ts` | role-match |
| `src/games/crash/hud/autoBet.ts` (new helper) | utility | transform | `src/shared/audio/sfxEdges.ts` | role-match |
| `src/games/crash/hud/autoBet.test.ts` (new) | test | transform | `src/games/crash/hud/enablement.test.ts` | role-match |
| `src/games/crash/hud/seedChip.ts` | view | event-driven | `src/games/crash/hud/seedChip.ts` | exact (DELETE) |
| `src/main.ts` | service | event-driven | `src/main.ts` | exact |
| `src/games/crash/logic/config.ts` | config | batch | `src/games/crash/logic/config.ts` | exact |
| `src/games/crash/logic/MultiplierCurve.ts` | model | transform | self | exact (KEEP — reads config only) |
| `tests/multiplierCurve.test.ts` | test | transform | `tests/multiplierCurve.test.ts` | exact |
| `src/games/crash/view/CrashScene.ts` | component | event-driven | `src/games/crash/view/CrashScene.ts` | exact |
| `src/games/crash/view/pathMapping.ts` | utility | transform | `src/games/crash/view/pathMapping.ts` | exact |
| `src/games/crash/view/viewConfig.ts` | config | batch | `src/games/crash/view/viewConfig.ts` | exact |
| `src/games/crash/view/Rocket.ts` | component | event-driven | `src/games/crash/view/Rocket.ts` | exact (KEEP API; scene clamps rot) |
| `src/games/crash/view/CurveGraph.ts` | component | transform | self | exact (KEEP — reparent under world) |
| `tests/pathMapping.test.ts` | test | transform | `tests/pathMapping.test.ts` | exact |
| `tests/shell.hud-layout.test.ts` | test | batch | `tests/shell.hud-layout.test.ts` | exact |
| `src/shared/boot/parseBootSeed.ts` | utility | transform | self | exact (KEEP) |
| `.planning/REQUIREMENTS.md` | docs | batch | `.planning/REQUIREMENTS.md` | exact (PLSH-03Δ + Auto-bet) |
| `.planning/ROADMAP.md` / `FEATURES.md` | docs | batch | same | exact (goal / promote Auto-bet) |

## Pattern Assignments

### `index.html` (view, batch)

**Analog:** `index.html` lines 13–83 **[EXISTING]**

**Core pattern** — canvas host above fixed `#hud-bar` three-zone footer:
```html
<div id="app" class="app-shell">
  <div id="game-canvas-host" class="canvas-host" aria-label="Game view">…</div>
  <footer id="hud-bar" class="hud-bar">
    <div class="hud-zone hud-zone--left" data-zone="balance">…</div>
    <div class="hud-zone hud-zone--center" data-zone="actions">
      <!-- place-bet + cash-out separate; Auto CO number + Clear -->
    </div>
    <div class="hud-zone hud-zone--right" data-zone="chips-history">
      <div data-field="chips" …></div>
      <div data-field="seed-chip" class="seed-chip"></div>
      <div data-field="session-stats" …></div>
      <div data-field="history" …></div>
    </div>
  </footer>
</div>
```

**Apply (from `06-RESEARCH.md` Pattern 1 / D-01–D-05):**

1. Rebuild into a **100dvh column** (not canvas-then-footer-only):
   ```
   .app-shell
     #top-chrome      — balance · Reset · mute
     #history-band    — session stats + history (pan-x)
     #game-canvas-host — flex:1; min-height:0; pointer-events:none
     #controls-band / #hud-bar
       auto-row    — Auto cash out (toggle+±) · Auto bet (toggle)
       action-row  — primary BET/CASH OUT · stake ± · presets
   ```
2. Collapse Place bet + Cash out into **one** `<button data-action="primary">` with two lines (label + amount). English labels only (D-02).
3. Remove `data-field="seed-chip"` and any Seed markup (D-21).
4. Replace Auto CO Clear-button chrome with **toggle + ± multiplier field**; add Auto bet toggle host.
5. Preset chips host stays; values come from `PRESET_CHIPS` (20/50/100/ALL).
6. Keep monetary controls **out of** `#game-canvas-host` (VIS-02). Update `tests/shell.hud-layout.test.ts` selectors for new `data-action` / zone ids (e.g. `primary` instead of `place-bet`/`cash-out`).

**Keep:** `viewport-fit=cover`; mute / reset / bet-input / history / session-stats fields; canvas host id for `mountCrashView`.

---

### `src/styles/hud.css` (view, batch)

**Analog:** `src/styles/hud.css` lines 16–63 + 274–308 **[EXISTING]**

**Core pattern** — shell + promote-cashout + phone bar budget:
```css
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: 100dvh;
}
.canvas-host {
  flex: 1 1 auto;
  min-height: 0;
  pointer-events: none;
}
.hud-bar {
  flex: 0 0 auto;
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  /* safe-area insets … */
}
.hud-bar--promote-cashout [data-action="cash-out"] { /* full-width promote */ }
@media (max-width: 720px) {
  .hud-bar {
    --hud-bar-height: 15.5rem;
    overflow-y: auto; /* internal scroll — Phase 6 removes this model */
  }
}
```

**Apply:**

1. `html, body, .app-shell { height: 100%; overflow: hidden; }` with `.app-shell { height: 100dvh; }` — **no page scroll** (D-01).
2. Drop Phase 4 fixed `--hud-bar-height` as the sole canvas budget; canvas = leftover after top/history/bottom bands (RESEARCH zone budget ~2.5–3 / 2–2.5 / autos+primary ~8–9.5 rem).
3. Rewrite promote rules for **single primary** CTA (retire dual-button hide/show). Dual-line primary: stacked spans, large touch target ≥44px.
4. History band: `overflow-x: auto; touch-action: pan-x` only.
5. Safe-area on **top and bottom** bands; keep `touch-action: manipulation` on buttons.
6. Delete `.seed-chip*` rules once unreferenced.
7. Dim/disable Auto CO ± field when toggle OFF (class or `[disabled]` + reduced opacity).

**Keep:** Broke / Reset emphasize classes; chip selected styles; mute compact control; canvas `pointer-events: none`.

---

### `src/games/crash/hud/CrashHud.ts` (view, event-driven)

**Analog:** `src/games/crash/hud/CrashHud.ts` lines 37–266 **[EXISTING]**

**Core pattern** — thin binder: query required fields, chip fill-only, dual buttons, seed mount, render from snapshot:
```typescript
export function mountCrashHud(
  root: Element,
  game: CrashGame,
  options: MountCrashHudOptions = {},
): CrashHud {
  // … query place-bet + cash-out …
  if (bootSeed != null && seedChipHost) {
    mountSeedChip(seedChipHost, { seed: bootSeed, invalid: seedInvalid });
  }
  // chips: bet.value = String(value) — never placeBet
  placeBet.addEventListener("click", () => {
    const result = game.placeBet(Number(bet.value));
    // … bet_lock SFX …
  });
  cashOut.addEventListener("click", () => game.requestCashOut());
  // render: enablementFrom → disabled flags; chromeModeFrom → promote class
}
```

**Apply (Patterns 2–3, 6 / D-06–D-13, D-21):**

1. **One primary button** — click: if `canPlaceBet` → `placeBet`; else if `canCashOut` → `requestCashOut`; else no-op. Dual-line text from pure helper or inline:
   - waiting → `BET` + stake (`formatMoney(stake)`)
   - flying+bet → `CASH OUT` + `formatMoney(bet × multiplier)`
   - `cashed_out` → `CASHED OUT` + frozen `formatMoney(bet × cashOutAt)` (disabled)
   - crash→waiting with no cash-out → snap to BET (no CRASHED state)
2. Remove `seed` / `invalid` options wiring and `mountSeedChip` import (D-24). Stop requiring `data-field=seed-chip`.
3. Auto bet: session boolean on HUD; expose `isAutoBetOn()` / `getStake()` for composition-root edge (or run edge inside `render` — **one** site only). On `placeBet` fail `broke` / `insufficient_balance`: clear Auto bet + existing Reset emphasize (D-12).
4. Auto CO: toggle ON → apply ± field via `setAutoCashOut`; OFF → `setAutoCashOut(null)` and disable/dim field (D-04).
5. Presets: include ALL chip → fill `maxAffordableStake(balance)` only (no `placeBet`).
6. Stake ± buttons fill input (same fill-only contract as chips).
7. Keyboard Space/Enter unchanged — still `enablementFrom(lastSnap).canCashOut` (D-05).
8. Retire `hud-bar--promote-cashout` dual-button toggle; primary is always the large CTA. Narrow or replace `chromeModeFrom` with `primaryChromeFrom`.

**Keep:** Mute / AudioPort / `bet_lock` on successful place (manual **and** Auto bet); broke emphasize; history + sessionStats textContent; `isEditableTarget` guard.

---

### `src/games/crash/hud/chromeMode.ts` → primary chrome (utility, transform)

**Analog:** `src/games/crash/hud/chromeMode.ts` **[EXISTING]** + `format.ts` **[EXISTING]**

**Core pattern:**
```typescript
export type HudChromeMode = "normal" | "promote-cashout";
export function chromeModeFrom(phase: Phase): HudChromeMode {
  if (phase === "flying" || phase === "cashed_out") return "promote-cashout";
  return "normal";
}
```

**Apply [ESTABLISH from RESEARCH Pattern 2]:** Prefer a pure `primaryChromeFrom(snap, stakeDisplay)` returning `{ label, amountLine, enabled, kind }` for BET / CASH OUT / CASHED OUT (see RESEARCH table). Win line = `formatMoney(snap.bet! * snap.multiplier)` while flying; frozen uses `cashOutAt`. Spectator flying (no bet): disabled, no fake win. Unit-test without DOM. May replace or coexist with narrowed `chromeModeFrom`.

---

### `src/games/crash/hud/enablement.ts` (utility, transform)

**Analog:** self lines 19–33 **[EXISTING]**

**Core pattern:**
```typescript
export function enablementFrom(snap: CrashSnapshot): HudEnablement {
  const waiting = snap.phase === "waiting";
  const flying = snap.phase === "flying";
  const broke = snap.balance < CRASH_CONFIG.minBetCents / 100;
  const hasBet = snap.bet != null;
  return {
    canPlaceBet: waiting && !hasBet && !broke,
    canEditBet: waiting && !hasBet && !broke,
    chipsEnabled: waiting && !hasBet && !broke,
    canCashOut: flying && hasBet,
    canEditAuto: true,
    showBroke: broke,
  };
}
```

**Apply:** Keep gates as authority for place/cash-out/keyboard. Extend only if needed for primary disabled (`cashed_out`) and Auto CO field editability when toggle OFF (`canEditAuto` may become toggle-dependent). Do **not** move Auto bet into GameLogic. Broke threshold unchanged (D-12 stops UI flag only).

---

### `src/games/crash/hud/chips.ts` + `chips.test.ts` (utility / test)

**Analog:** `chips.ts` + `chips.test.ts` **[EXISTING]**

**Core pattern:**
```typescript
export const PRESET_CHIPS = [10, 25, 50, 100, 250, 500] as const;
// Fill-only — no placeBet helper in this module.
```

**Apply (WALT-03Δ / D-03):**

```typescript
export const PRESET_CHIPS = [20, 50, 100] as const;
export const ALL_CHIP = "ALL" as const;

/** Max affordable stake in display units (ALL chip). Fill-only. */
export function maxAffordableStake(balanceDisplay: number): number {
  const DISPLAY_MIN = CRASH_CONFIG.minBetCents / 100;
  const DISPLAY_MAX = CRASH_CONFIG.maxBetCents / 100;
  const floorBal = Math.floor(balanceDisplay);
  const maxAffordable = Math.min(DISPLAY_MAX, floorBal);
  // if maxAffordable < DISPLAY_MIN → caller disables ALL / broke path
  return maxAffordable;
}
```

Update `chips.test.ts` expectations; add `maxAffordableStake` cases (clamp, broke). ALL must never call `placeBet`.

---

### `src/games/crash/hud/autoBet.ts` (new utility, transform)

**Analog:** `src/shared/audio/sfxEdges.ts` **[EXISTING]** — pure prev→next edge detector; composition root invokes side effects.

**Core pattern:**
```typescript
export function sfxEventsFromTransition(
  prev: CrashSnapshot | null,
  next: CrashSnapshot,
): SfxEvent[] {
  if (!prev) return [];
  // … phase / cashOutAt / history edges …
  return out;
}
```

**Apply [ESTABLISH from RESEARCH Pattern 3]:**

```typescript
export function shouldAutoPlaceBet(args: {
  autoBetOn: boolean;
  phase: Phase;
  prevPhase: Phase | null;
  hasBet: boolean;
  broke: boolean;
}): boolean {
  if (!args.autoBetOn || args.broke || args.hasBet) return false;
  if (args.phase !== "waiting") return false;
  return args.prevPhase !== "waiting";
}
```

Also: toggle ON mid-wait with no bet → treat as synthetic edge (place once). Invoke from `main.ts` ticker **or** HUD `render` once — never both. On fail: clear flag; do not `resetWallet`. Successful auto-place must fire `bet_lock` like manual.

---

### `src/main.ts` (service, event-driven)

**Analog:** `src/main.ts` lines 13–38 **[EXISTING]**

**Core pattern:**
```typescript
const { seed, invalid } = parseBootSeed(window.location.search);
const game = createGame({ seed });
const hud = mountCrashHud(hudRoot, game, { audio, seed, invalid });
let prevSnap: CrashSnapshot | null = game.getSnapshot();
app.ticker.add((ticker) => {
  game.tick(ticker.deltaMS);
  const snap = game.getSnapshot();
  for (const event of sfxEventsFromTransition(prevSnap, snap)) {
    audio.play(event);
  }
  prevSnap = snap;
  hud.render(snap);
  scene.sync(snap, ticker.deltaMS);
});
```

**Apply:**

1. Keep `parseBootSeed` → `createGame({ seed })` (D-21/D-22). Stop passing `{ seed, invalid }` into HUD for chip (D-24).
2. After snap (and before or after `hud.render` — pick one), if `shouldAutoPlaceBet(...)`: `game.placeBet(hud.getStake())` with broke-stop handling + `bet_lock`. Track `prevPhase` from `prevSnap.phase`.
3. HUD root query may change from `#hud-bar` to shell root / `#controls-band` — update selector to match new markup.
4. Do not put Auto bet state in GameLogic.

---

### `src/games/crash/logic/config.ts` + `tests/multiplierCurve.test.ts` (config / test)

**Analog:** self **[EXISTING]**

**Core pattern:**
```typescript
growthRatePerMs: Math.LN2 / 2500, // ~2× @ 2.5s (D-09)
```
```typescript
expect(multiplierAt(2500, Math.LN2 / 2500)).toBe(2.0);
expect(r).toBe(Math.LN2 / 2500);
expect(multiplierAt(2500)).toBe(2.0);
```

**Apply (Pattern 4 / FEEL-01 / D-14–D-15):**

```typescript
growthRatePerMs: Math.LN2 / 3750, // ~2× @ 3.75s (Phase 6 D-14)
```

Update all 2500 → 3750 assertions; keep exponential / hundredths / monotonic tests. **Do not** change `houseEdge`, `crashFloor`, `crashCap`, or RNG. `MultiplierCurve.ts` stays consume-only.

---

### `src/games/crash/view/CrashScene.ts` (component, event-driven)

**Analog:** `CrashScene.ts` lines 57–184 **[EXISTING]**

**Core pattern** — flat stage children; rocket at tip with hard tangent:
```typescript
app.stage.addChild(
  backdrop.container,
  curve.container,
  ghost,
  rocket.container,
  theater.container,
  flash,
);
// climb:
const pos = plotPoint(tip, plot, scale);
const rot = pathTangentRadians(tip, plot, scale);
rocket.syncPose(pos.x, pos.y, rot, true);
// Flash: never write stage.x / stage.y
```

**Apply (Pattern 5 / D-16–D-20):**

```
stage
  backdrop          (screen-fixed)
  world (Container) ← position = screenCenter - tipLocal
    curve
    ghost
    rocket          ← near center via world offset
  theater           (screen-fixed, upper third)
  flash             (screen-fixed)
```

1. Create `world = new Container()`; add curve/ghost/rocket as children; stage order: backdrop → world → theater → flash.
2. Climb: compute tip in plot space; set `world.position` so tip maps to ~screen center (slightly below theater). Optionally park rocket at local tip coords inside world.
3. Crash hold/fade: **freeze** last world offset (D-19); keep sever/flash choreography.
4. Idle: world identity or origin-centered park + existing bob.
5. Rotation: clamp/lerp tangent to gentle tilt before `syncPose` (D-18) — do not hard-follow path.
6. Theater countdown / dual-read path unchanged (D-05 / D-20).
7. Never set `app.stage.x` / `app.stage.y`.

Pixi: Container group transforms — `.agents/skills/pixijs-scene-container`.

---

### `src/games/crash/view/pathMapping.ts` + `viewConfig.ts` + `tests/pathMapping.test.ts`

**Analog:** `pathMapping.ts` + `VIEW_CONFIG` **[EXISTING]**

**Core pattern:**
```typescript
// X = log2(m)/log2(xMax); Y = linear (m-1)/(yMax-1)
const u = logDenom > 0 ? Math.log2(m) / logDenom : 0;
```
Test today asserts **steeper** slope 2×→4× than 1×→2× (Phase 3 D-03) — Phase 6 **softens** that (D-16).

**Apply:** Soften log2-X dominance and/or `SCALE_HEADROOM` so tip motion is smoother under fixed craft. Export new tunables on `VIEW_CONFIG` (blend weight, headroom). Update `pathMapping.test.ts` expectations (steepness assertion will change/soften). Keep m=1 origin; keep finite guards. Optional pure `gentleTiltRadians(tangent)` helper + tests.

---

### `src/games/crash/view/Rocket.ts` (component) — KEEP API

**Analog:** self `syncPose` **[EXISTING]**

**Core pattern:** parent Container owns position/rotation; streak local −X after parent rotation.

**Apply:** No API change required. Scene passes clamped rotation. Streak assumption (local −X) remains valid under gentle tilt.

---

### `src/games/crash/hud/seedChip.ts` (view) — DELETE

**Analog:** self **[EXISTING]** — DOM helper mount pattern like `historyStrip`.

**Apply (Pattern 6 / D-21–D-24):** Delete file + CSS + `index.html` host + CrashHud import/options. Keep `parseBootSeed` + tests + `createGame({ seed })`. Invalid/missing seed → quiet `"portfolio-demo"` fallback only (no on-screen note). Amend REQUIREMENTS **PLSH-03** wording per D-23.

---

### Docs: `REQUIREMENTS.md` / `ROADMAP.md` / `FEATURES.md`

**Analog:** same files **[EXISTING]**

**Apply:** Promote Auto-bet out of v2 Deferred into Active for Phase 6; set ROADMAP Phase 6 goal/success criteria from RESEARCH; amend PLSH-03 to “optional silent `?seed=` boot only; no Seed chip / on-screen seed.” Map proposed UI-01..03 / FEEL-01..02 / Δ IDs as planner decides.

---

### `tests/shell.hud-layout.test.ts` (test, batch)

**Analog:** self **[EXISTING]** — string-parse `index.html`; monetary selectors must live under HUD, not canvas host.

**Apply:** Update `MONETARY_SELECTORS` for new `data-action="primary"`, Auto bet toggle field, removed `place-bet`/`cash-out`/`clear-auto-co`/`seed-chip` as required. Keep canvas-host ban on monetary attrs. Assert Seed chip absent (`seed-chip` not in HTML).

---

## Cross-Cutting Constraints

| Constraint | Source | Implication |
|------------|--------|-------------|
| GameLogic pure (no Pixi/DOM) | ARCH-02 | Auto bet outside `logic/`; only `growthRatePerMs` edit |
| Chip / ALL fill-only | WALT-03 / Pitfall 4 | Never `placeBet` from chip click |
| Broke never auto-resets | Phase 1 | Auto bet stops; Reset explicit |
| No `stage.x/y` | Phase 3 D-10 | World Container camera only |
| Canvas `pointer-events: none` | Phase 2–4 | Survive shell rebuild |
| Touch ≥44px + safe-area | Phase 4 | New bands must keep budgets |
| Single Auto bet call site | RESEARCH pitfall | Avoid ticker + HUD double-place |
| English JetX-like chrome | D-02 | No Russian copy; no X2 dual-bet |

## Wave → Pattern Map (planner hint)

| Wave | Patterns | Primary files |
|------|----------|---------------|
| **06-01** Shell + dual-line primary + presets/Auto CO | 1–2 | `index.html`, `hud.css`, `CrashHud.ts`, `chromeMode`/`primaryChrome`, `chips.ts`, shell test |
| **06-02** Auto bet waiting-edge | 3 | `autoBet.ts`, `main.ts` and/or `CrashHud.ts`, tests |
| **06-03** Climb slowdown | 4 | `config.ts`, `multiplierCurve.test.ts` |
| **06-04** Arcade camera + Seed removal + docs | 5–6 | `CrashScene.ts`, `pathMapping.ts`, `viewConfig.ts`, delete `seedChip`, REQUIREMENTS/ROADMAP |

---

*Phase: 06-enhance-and-rework-ui-buttons-behavior*
*Pattern mapping completed: 2026-09-29*
