# Phase 3: Pixi Hybrid View - Research

**Researched:** 2026-09-27
**Domain:** PixiJS v8 hybrid Crash canvas (curve + rocket + crash break) driven only by GameLogic snapshots
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### Curve / graph look
- **D-01:** Rising path is a **thick neon / glow trail** (not a thin chart stroke alone). — **Reversibility:** costly — CurveGraph materials, filters, and crash sever FX assume a glow trail.
- **D-02:** Palette accents: **green while climbing**, **red on crash** for the path/break.
- **D-03:** Path mapping is **steeper mid-flight**: left→right, flatter early, then shoots up hard after ~2× (matches exponential climb feel). — **Reversibility:** costly — coordinate mapping and tip placement depend on this curve shaping.
- **D-04:** Backdrop: **dim grid** over a vertical **sky → clouds → deep cosmos with stars** gradient. Neon trail remains the primary focal; backdrop stays secondary.

### Rocket representation
- **D-05:** Ship a **geometric placeholder rocket** now with a **clean texture-swap seam** for a later user-provided sprite. — **Reversibility:** costly — view API should expose swap without rewriting path-follow.
- **D-06:** Rocket is a **small accent** secondary to the neon trail (classic Crash marker-on-graph scale).
- **D-07:** Rocket **rotates to path tangent** (nose along the climb).
- **D-08:** Tail FX is a **short particle streak** (not flame-only or body-only).

### Crash break FX
- **D-09:** Primary crash read: **path snaps / severs at the tip** with red accent (path-primary, not rocket-eject-primary). — **Reversibility:** costly — crash FX and reset choreography hang on sever semantics.
- **D-10:** Accompany sever with a **brief full-canvas flash** (no heavy camera shake).
- **D-11:** At snap, **rocket vanishes instantly**.
- **D-12:** Hold the crashed frame **~0.8–1.2s**, then transition into waiting idle.

### In-canvas live multiplier
- **D-13:** Canvas shows a **big theater ×** in addition to the existing HUD live multiplier. — **Reversibility:** costly — layout and cash-out dual-read depend on this theater number.
- **D-14:** Theater × sits in the **upper third**, clear of the rocket tip.
- **D-15:** Theater × **starts white and gradually shifts toward red as the multiplier rises**; **solid red on crash**.
- **D-16:** On **player cash-out**: show a **frozen cash-out × below**; **rocket + big live × keep climbing** until the round crashes (spectator finish). — **Reversibility:** one-way — dual-read UX and snapshot binding assume continued flight after personal settle; changing this reworks view state machine.

### Waiting / idle canvas
- **D-17:** Between rounds: atmosphere + **ghost start mark** at the next-climb origin (no countdown digits — Phase 5).
- **D-18:** Leave crashed frame via **short fade (~0.3–0.5s)** into idle (not hard wipe or path retract).
- **D-19:** During waiting, rocket is **parked at origin with a subtle idle bob**.
- **D-20:** During waiting, keep the **last crash × dimmed** until next launch; **clear the frozen cash-out ×** on the fade into idle.

### Carried forward (do not reopen)
- Hybrid curve + rocket; crash = visual break (PROJECT / VIS-01).
- Canvas above bottom HTML chrome; empty `#game-canvas-host` mount (Phase 2 D-01/D-04).
- Ticker feeds `GameLogic.update` / `tick(deltaMS)` only; outcome never from sprite position (ROADMAP success criteria).
- Continuous 5s waiting / auto-launch / spectator rounds (Phase 1 D-13–D-15).
- HUD already mirrors live × — canvas theater × is additive spectacle (Phase 2 HUD).

### Claude's Discretion
- Exact neon glow implementation (filters vs thick stroked Graphics vs mesh) within D-01.
- Exact green/red hex values and white→red ramp curve vs multiplier for D-02/D-15.
- Exact steeper-mid-flight parametric mapping constants for D-03.
- Procedural sky/clouds/stars density and parallax (if any) within D-04 — keep backdrop secondary.
- Geometric rocket silhouette details and particle streak budget within D-05–D-08.
- Flash intensity/duration micro-timing within D-10/D-12 bounds.
- Frozen cash-out × typography/placement under the theater × within D-16.
- Ghost-mark and idle-bob amplitude within D-17/D-19.
- Pixi v8 Application bootstrap, resize-to-host, folder seam under `games/crash/view/` per research ARCHITECTURE.
- Whether crash hold countdown is view-local timer vs driven by phase/snapshot fields — must not invent settlement.

### Deferred Ideas (OUT OF SCOPE)
None new from discussion — stayed in Phase 3 domain. Already-roadmap deferred (not reopened here):
- Mobile / touch stacking / DPR resize hardening → Phase 4
- Waiting countdown digits, SFX/mute, `?seed=`, session stats, keyboard cash-out → Phase 5
- User-supplied rocket texture file — seam reserved (D-05); provide asset when ready
- DEMO badge UI → declined (PROJECT.md)
- Multi-game lobby / React shell → later milestone
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VIS-01 | Player sees a hybrid visual: rising curve/graph with a small rocket traveling the path, and a clear crash break | Pixi scene in `#game-canvas-host`: neon `Graphics` trail + small tangent-aligned rocket from `snapshot.multiplier`; crash sever + flash from the flying/cashed_out → waiting transition. Ticker passes `deltaMS` into `game.tick` only. D-16 requires a logic snapshot change so cash-out does not end the flight before `crashAt`. |
</phase_requirements>

## Project Constraints (from `.claude/.cursor/rules`)

Actionable directives from project rules read this session:

- Stack lock: PixiJS v8 + TypeScript + Vite. Phase 3 is the phase that adds `pixi.js`.
- No SPA framework in v1. No React / `@pixi/react`.
- Client-side only. No backend, no commercial casino assets.
- GameLogic stays pure TypeScript. No `pixi.js` imports and no `document.` / `window.` under `src/games/crash/logic/` or `src/shared/` (existing ARCH-02 gate).
- HTML HUD keeps monetary controls. Pixi does not own bet / cash-out / balance.
- Core flight time is `app.ticker` → `game.tick(deltaMS)` → snapshot. Do not tween the multiplier. Do not drive outcomes from sprite position.
- Vitest on Node remains the automated gate. Canvas spectacle is not a WebGL unit test.
- No DEMO badge UI.

## Summary

Phase 3 mounts a PixiJS v8 `Application` into the existing `#game-canvas-host`, stops the Phase 2 `requestAnimationFrame` clock, and feeds `ticker.deltaMS` into the existing `CrashGame.tick`. The view reads `getSnapshot()` and draws a presentation path. It does not sample crash RNG, credit the wallet, or advance a private multiplier.

The standard stack is the single package `pixi.js` (registry version **8.21.0** this session). Use v8 `Application` + async `init`, `Graphics` shape-then-`stroke` for the trail and backdrop, a `Container` geometric rocket with a texture-swap seam, and `BitmapText` for the theater multiplier. Do not add GSAP, a particle library, `pixi-filters`, or React.

**Blocking integration fact:** current `resolveTick` never leaves a durable `cashed_out` or `crashed` snapshot. `settleOnce` always returns through `enterWaiting`, which forces `phase: "waiting"`, `multiplier: 1`, and `crashAt: null` in the same call. D-16 (one-way) requires the rocket and live theater × to keep climbing after a personal cash-out until the seeded crash. That cannot be faked in the view without inventing settlement. Plan 03-01 must change GameLogic so cash-out credits the wallet once, stores a frozen `cashOutAt`, keeps `phase: "cashed_out"` while `multiplier` advances, and only then crashes into the existing 5s wait. Crash hold (0.8–1.2s) and the fade to idle stay view-local timers. They must not pause `tick` or add a second payout.

**Primary recommendation:** Install `pixi.js@8.21.0`. Update the ARCH-02 package.json deny-list so `pixi.js` is allowed and logic/shared stay pure. Teach `resolveTick` a durable `cashed_out` spectator-finish. Bind one `app.ticker` callback to `game.tick(ticker.deltaMS)` plus HUD render plus `scene.sync`. Draw the trail with two layered round strokes (halo + core), not a filter and not a hand-rolled mesh. Map multiplier → point in a pure, Pixi-free function tested by Vitest.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Round FSM, wallet credit, crash sampling, history push | Browser GameLogic (`src/games/crash/logic`) | — | ARCH-02. View must not settle. D-16 continued flight is still a logic phase, not a sprite tween. |
| Live multiplier value | GameLogic `multiplierAt` via `resolveTick` | Pixi reads snapshot | Outcome clock is `tick(deltaMS)`. Path math only maps the already-published multiplier. |
| Canvas mount, resize, frame clock | Browser Pixi `Application` in composition root | CSS sizes `#game-canvas-host` | Phase 2 left an empty host. `resizeTo` that element, not `window`. |
| Curve, rocket, flash, theater ×, idle bob | Browser Pixi view (`games/crash/view`) | — | VIS-01 spectacle. No monetary controls. |
| Bet, cash-out, balance, chips, history strip | Existing HTML HUD | Reads the same snapshot | Phase 2 chrome stays. `cashed_out` must not enable Place bet. |
| Crash-hold / fade clocks (0.8–1.2s, 0.3–0.5s) | View-local timers | — | Discretion: do not invent a settlement delay. Logic wait stays 5s and starts at crash. |
| Mobile stacking, DPR policy beyond a cap of 2, countdown digits | — | Deferred | Phase 4 / Phase 5. |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `pixi.js` | 8.21.0 (`npm view` 2026-09-27) | Application, ticker, Graphics, BitmapText, Container | Locked portfolio renderer. v8 API is `new Application()` then `await app.init()`. Monolithic import. `[CITED: npm view pixi.js version]` — legitimacy seam returned SUS/`too-new`, so this is not tagged `[VERIFIED: npm registry]`. |
| TypeScript | 5.8.3 (installed) | View + logic types | Already in the repo. Stay on TS 5. `[VERIFIED: npm ls typescript]` |
| Vite | 6.4.3 (installed) | Dev server / bundle | Already boots `src/main.ts`. ≥ 6.0.7, so production top-level await is not the Vite 6.0.6 bug. Still boot Pixi from an async `main()` called normally. `[VERIFIED: npm ls vite]` |
| Vitest | 3.2.7 (installed) | Pure path-mapping and view-mode tests; updated settle tests | Node environment. No WebGL. `[VERIFIED: npm ls vitest]` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none new) | — | Glow, particles, text, resize | All come from `pixi.js`. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Layered `Graphics` strokes for D-01 | `BlurFilter` on the trail | Filter forces an extra render target and padding. Discretion allows it. Do not use it for v1. Two round strokes (wide translucent halo + narrow core) read as a thick neon trail inside one draw path. |
| Layered strokes | Custom `Mesh` | More code for a single polyline. Not justified. |
| `BitmapText` theater × | Canvas `Text` updated every frame | Skill marks per-frame `Text.text` as a high-cost re-raster. One label would survive; `BitmapText` is the v8 pattern for a live multiplier. |
| `BitmapText` | `HTMLText` | Async, one-frame delay, markup we do not need. |
| 8 positioned dot `Graphics` for D-08 | `ParticleContainer` | Built for hundreds to tens of thousands of textured particles. A short streak does not need it. |
| Geometric `Graphics` rocket | Ship a texture file now | D-05 defers the user's art. Swap seam only. |
| `app.ticker` | Keep `rafClock` and also run Pixi | Two clocks double-step `tick` and desync crash visuals. Stop and delete the rAF clock. |
| GSAP / physics | — | Out of stack. D-10 forbids heavy camera shake. Do not install `gsap`. |

**Installation:**

```bash
npm install pixi.js@8.21.0
```

No other packages. Do not install `pixi-filters`, `@pixi/react`, `gsap`, or `howler` (Phase 5).

**Version verification:** `npm view pixi.js version` → `8.21.0`. `time.modified` `2026-09-25T20:42:45.558Z`. Homepage `http://pixijs.com/`. Repository `git+https://github.com/pixijs/pixijs.git`. Package `exports["."].import` points at `./lib/index.mjs` with types `./lib/index.d.ts`. Main entry resolves under the repo's `moduleResolution: "NodeNext"`. Do not switch tsconfig to `bundler` unless `tsc --noEmit` fails after install. Do not import subpaths (`pixi.js/text-bitmap`, `pixi.js/filters`) unless a missing extension shows up; the standard `import { ... } from "pixi.js"` bundle includes BitmapText and filters.

## Package Legitimacy Audit

| Package | Registry | Age signal | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|------------|-----------|-------------|---------|-------------|
| `pixi.js` | npm | Latest publish `2026-09-17` (seam reason `too-new`) | 1,234,217 weekly | `github.com/pixijs/pixijs` | SUS | Flagged — planner adds `checkpoint:human-verify` before install. Package is the locked renderer, not an unknown name. Postinstall script: null. |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** `pixi.js` — seam `too-new` on the latest publish, with official repo and high download count. Planner: one human-verify checkpoint that `npm view pixi.js repository.url` is `git+https://github.com/pixijs/pixijs.git` and version is `8.21.0`, then install that exact version. Do not substitute another graphics library.

`npm view pixi.js scripts` includes a maintainer `prepare: husky install`. The legitimacy payload reported `postinstall: null`. Do not treat `prepare` as a consumer install hook. No extra install scripts are required.

## Architecture Patterns

### System Architecture Diagram

```
HUD click (placeBet / requestCashOut / setAutoCashOut)
        │
        ▼
CrashGame command ──► resolveTick (pure)
        ▲                    │
        │                    ├─ waiting: count 5s, then startRound (crashAt sampled once)
        │                    ├─ flying: m = multiplierAt(elapsed)
        │                    │     m >= crashAt → history.push(crashAt) → enterWaiting
        │                    │     else auto/manual cash-out → credit once, phase cashed_out,
        │                    │       cashOutAt = paid ×, crashAt kept, history NOT pushed
        │                    └─ cashed_out: m keeps climbing (no second credit)
        │                          m >= crashAt → history.push → enterWaiting (5s)
        │
app.ticker (ONLY clock)
        │  deltaMS (capped)
        ▼
game.tick(deltaMS) → getSnapshot()
        │
        ├─► CrashHud.render(snapshot)     monetary chrome, existing
        └─► CrashScene.sync(snapshot, deltaMS)
                 │
                 ├─ climb (flying | cashed_out): neon path + rocket tangent + live theater ×
                 ├─ transition into waiting: latch crash ×, sever path, hide rocket, flash
                 ├─ crash_hold 1000ms (view clock): frozen severed frame, theater solid red
                 ├─ crash_fade 400ms: fade path/flash; clear latched cash-out ×
                 └─ idle: backdrop + ghost origin + bobbing rocket + dim last history ×
```

Wallet, RNG, and history stay inside `resolveTick`. The view never calls `multiplierAt` to invent a future crash. It only maps `snapshot.multiplier` (and, on the crash frame, `history[history.length - 1]`) into pixels.

### Recommended Project Structure

```
src/
├── main.ts                         # composition root: createGame, HUD, mountCrashView, ONE ticker
├── styles/hud.css                  # canvas-host fills the region (stop flex-centering the canvas)
├── app/rafClock.ts                 # DELETE after ticker cutover (no second clock)
└── games/crash/
    ├── logic/                      # EXISTING — no pixi. Add cashOutAt + durable cashed_out
    │   ├── RoundState.ts
    │   ├── resolveTick.ts
    │   └── CrashGame.ts
    ├── hud/                        # EXISTING — enablement stays; add a cashed_out regression test
    │   └── format.ts               # formatMult — view imports this for 2dp ×
    └── view/                       # NEW — only Pixi + pure mapping
        ├── mountCrashView.ts       # async Application init, resizeTo host, destroy
        ├── CrashScene.ts           # sync(snapshot, deltaMS) owns view-mode timer
        ├── viewMode.ts             # PURE reducer: idle | climb | crash_hold | crash_fade
        ├── pathMapping.ts          # PURE multiplier → plot point / tangent
        ├── viewConfig.ts           # named hex, widths, hold/fade ms, plot pads
        ├── Backdrop.ts             # gradient + clouds + stars + dim grid (rebuild on resize)
        ├── CurveGraph.ts           # halo Graphics + core Graphics
        ├── Rocket.ts               # Container, geometric body, setBodyTexture seam, 8-dot streak
        └── TheaterText.ts          # two BitmapTexts
tests/
├── pathMapping.test.ts             # NEW — D-03 shape
├── viewMode.test.ts                # NEW — hold/fade/cash-out latch, no Pixi
├── resolveTick.test.ts             # UPDATE — cashed_out continues until crashAt
├── walkingSkeleton.test.ts         # UPDATE — cash-out is not instant waiting
└── architecture.no-pixi.test.ts    # UPDATE — allow pixi.js in package.json only
```

`main.ts` stays the only composition root. Do not add a second game orchestrator.

### Pattern 1: One ticker, capped milliseconds

**What:** After `await app.init`, register a single callback. Pass `ticker.deltaMS` into `game.tick`. Render HUD and Pixi from the post-tick snapshot. Remove `startRafClock`.

**When to use:** Always. Phase 2 comment already marks this handoff.

**Example:**

```typescript
// Source: pixijs-ticker skill — callback receives the Ticker instance
// https://pixijs.download/release/docs/ticker.Ticker.html.md
app.ticker.minFPS = 10; // explicit; skill states default minFPS is 10
app.ticker.add((ticker) => {
  game.tick(ticker.deltaMS);
  const snap = game.getSnapshot();
  hud.render(snap);
  scene.sync(snap, ticker.deltaMS);
});
```

`deltaTime` is a dimensionless ~1.0 at 60fps, not milliseconds. `elapsedMS` is uncapped. A large uncapped step lets `CrashGame.tick` sub-step through crash, the entire 5s wait, and the next launch before the view syncs, so the sever frame never exists. `minFPS = 10` caps one callback near 100ms, which matches `CRASH_CONFIG.maxDeltaMs` (100). Set it explicitly. Do not set `ticker.speed`.

`CrashGame.tick` already sub-steps at `maxDeltaMs`. Keep that. The view cap is what protects the crash picture; the logic cap is what protects settlement order inside one step.

### Pattern 2: Durable `cashed_out`, immediate crash into waiting

**What:** Personal and auto cash-out credit the wallet once and keep the round flying until `crashAt`. A no-cash-out crash still enters waiting inside the resolving step. History pushes `crashAt` only when the round actually crashes (once).

**When to use:** Required by D-16. Current code does the opposite — see Pitfall 1.

**Rules the planner must implement inside `resolveTick` (no Pixi):**

1. `flying` and `m >= crashAt` → no credit, `history.push(crashAt)`, `enterWaiting`. Unchanged crash-before-auto order.
2. `flying` and auto target hit, or `cashOutRequested` → credit once if `lockedBetCents > 0`, set `settledRoundId`, set `cashOutAt` to the **paid** multiplier (`autoAt` or current `m`), set `phase: "cashed_out"`, keep `crashAt`, keep `elapsedMs` / current `multiplier`, clear `lockedBetCents`. Do **not** push history. Do **not** call `enterWaiting`.
3. `cashed_out` → advance `elapsedMs` and `multiplier` the same way as flying. No second credit. No cash-out commands. When `m >= crashAt`, push history once and `enterWaiting`.
4. `enterWaiting` clears `cashOutAt` to `null`, sets `multiplier: 1`, `crashAt: null`, `phase: "waiting"`, `waitRemainingMs: 5000`.
5. Add `cashOutAt: number | null` to `RoundState` and `CrashSnapshot`. `getSnapshot` copies it. `null` while waiting or during an unsettled flight.

`crashed` stays in the `Phase` union but is not a durable snapshot. Crash hold is view-local (discretion). Do not delay the 5s wait inside logic.

Existing HUD enablement already treats only `waiting` and `flying` as actionable:

```18:28:src/games/crash/hud/enablement.ts
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

`cashed_out` therefore cannot place a bet or cash out again. Add a regression test so nobody "fixes" `cashed_out` to behave like `waiting`. `placeBet` already rejects non-waiting. HUD live × already prints `snap.multiplier`, so it keeps climbing during spectator finish without a second formatter.

Tests that expect `phase === "waiting"` on the tick that processes `requestCashOut` must change. `tests/roundCadence.test.ts` "after terminal settle" loops until `waiting` and can keep expecting `waitRemainingMs === 5000` **after crash**. `tests/walkingSkeleton.test.ts` expects waiting, history, and balance on the cash-out tick — split that assertion: balance up and `cashOutAt` set while still `cashed_out` and history unchanged; history gains `crashAt` only after the continued flight crashes.

### Pattern 3: Pure plot mapping (D-03)

**What:** A Pixi-free function maps a multiplier into a plot rectangle. X is `log2(m)` (time-linear, because logic growth is exponential). Y is linear in `(m - 1)`. Pixi Y grows downward, so multiplier 1 sits on the left/bottom (the origin). The scale grows with the live multiplier so the tip stays on screen and the early segment stays flatter than the segment after 2×.

**When to use:** Every climb frame, and once more to redraw the severed path at the crash multiplier. Never to predict a crash the snapshot has not published.

**Discretionary constants (lock these in `viewConfig.ts`, do not scatter):**

| Constant | Value | Why |
|----------|-------|-----|
| `SCALE_HEADROOM` | 1.25 | Tip sits at about 80% of the current scale, leaving room ahead. |
| `SCALE_FLOOR` | 2 | At 1.00× the axis already covers a doubling, so the launch is not a single pixel. |
| `PLOT_TOP_RATIO` | 0.36 | Plot starts below the upper third. Theater × lives at `0.18 * height`. Tip cannot enter D-14's band. |
| `SAMPLE_COUNT` | 64 | Fixed resample. Do not append a point per frame. |

```typescript
export function plotScaleFor(multiplier: number): { xMax: number; yMax: number } {
  const m = Number.isFinite(multiplier) ? Math.max(1, multiplier) : 1;
  return {
    xMax: Math.max(2, m * 1.25),
    yMax: Math.max(2, m * 1.25),
  };
}
```

`plotPoint(1, plot, scale)` is `(plot.x, plot.y + plot.height)`. As `m` increases, `u = log2(m) / log2(xMax)` moves right and `v = (m - 1) / (yMax - 1)` moves up. Because v is linear in m and u is logarithmic, the pixel slope after 2× is steeper than the slope from 1× to 2×. That is the D-03 shape. Vitest must assert it with a finite difference, not a screenshot.

Tangent for D-07: `Math.atan2(dy, dx)` between `plotPoint(m)` and `plotPoint(m + 0.02)`. Rocket art points along local +X (nose to the right) before rotation. Pixi rotation 0 is +X.

Non-finite multipliers return the origin and the scene skips the stroke. Do not throw on the ticker.

### Pattern 4: Neon trail without a filter (D-01 discretion)

**What:** Two `Graphics` siblings, not children of each other (`Graphics` is a leaf). Each frame while climbing: `clear()`, `moveTo`/`lineTo` the 64 samples, `stroke` once.

| Layer | width | alpha | cap / join | Climb color | Crash color |
|-------|-------|-------|------------|-------------|-------------|
| Halo | 16 | 0.35 | round / round | `0x3dff8a` | `0xff3b4e` |
| Core | 4 | 1 | round / round | `0x3dff8a` | `0xff3b4e` |

Hex values are discretionary picks for D-02, not a brand spec. `[ASSUMED]` as design tokens.

Rebuild the trail only while `viewMode` is `climb`. Backdrop `Graphics` rebuild on resize only. During `crash_hold`, rebuild once in red, then leave the geometry alone until the fade hides it (`alpha` on the trail container). That respects the v8 warning that `clear()` every frame retessellates, without pretending a growing polyline can be a static sprite.

Sever (D-09): draw samples only up to the crash multiplier, but stop the main stroke at 94% of the tip distance and draw a short unconnected red stub past a gap along the last tangent. Path-primary break. Do not launch the rocket off-screen.

### Pattern 5: Rocket seam and short streak (D-05–D-08)

**What:** A `Container` whose position is `plotPoint(snapshot.multiplier)` and whose `rotation` is the tangent. Children:

- `bodyGraphics`: polygon nose along +X, about 28px long. Visible when no texture.
- `bodySprite`: `Sprite` with `anchor` 0.5, `visible: false` until `setBodyTexture(texture)`.
- Eight small circle `Graphics` (created once) offset along `-tangent`, alpha fading with index. Reposition each climb frame. No `ParticleContainer`, no texture atlas.

`setBodyTexture(null)` restores the geometric body. Rotation and position stay on the parent so a later sprite does not rewrite path-follow. No asset file in this phase.

Idle (D-19): same container at `plotPoint(1)`, rotation 0, `y += Math.sin(elapsed * 2π / 1400) * 4`. Hide the streak while idle. Ghost mark (D-17): a low-alpha ring `Graphics` at the same origin, left visible whenever mode is `idle`. No countdown text.

### Pattern 6: Theater × and view-mode clock

**What:** Two `BitmapText` nodes, anchor 0.5, font family a system face (`Arial` or `Segoe UI`), font size ~64 for the live × and ~28 for the frozen cash-out ×. Lazy atlas from the first `BitmapText` (no `BitmapFont.install` required). Glyphs installed white; per-frame color is `tint`, not a style fill change (fill bakes into the atlas).

Live string uses `formatMult` from `src/games/crash/hud/format.ts` (`toFixed(2)` + `×`). Position: x center, y = `0.18 * screen.height`. Frozen × sits ~48px below it.

Ramp (D-15): `t = clamp(log2(m) / log2(8), 0, 1)` lerps tint from `0xffffff` to `0xff3b4e`. On `crash_hold` / `crash_fade`, tint is solid `0xff3b4e` and the text is the crash multiplier (`history` last), not the waiting snapshot's `1`. During `idle`, that same crash × stays at alpha ~0.45 until `phase` becomes `flying` again (D-20). Before the first crash, idle shows no theater number.

Frozen cash-out ×: show while mode is `climb` and `snapshot.cashOutAt != null`, and keep the latched value through `crash_hold`. Clear it when the fade completes (D-20), even though logic already nulled `cashOutAt` at `enterWaiting`. The latch lives in the view reducer, copied from the last `cashed_out` snapshot.

**View-mode reducer (pure, tested):**

| Mode | Enter | Draw | Exit |
|------|-------|------|------|
| `idle` | boot, or fade finished | ghost, bob, dim last history × if any, no trail, no frozen × | `snap.phase` is `flying` or `cashed_out` → `climb` |
| `climb` | flying or cashed_out | trail to `snap.multiplier`, rocket visible, live theater | previous mode was climb and `snap.phase === "waiting"` → `crash_hold` |
| `crash_hold` | that transition | red severed path, rocket `visible = false` instantly, flash playing, solid red crash × | accumulated `deltaMS >= 1000` → `crash_fade` |
| `crash_fade` | hold done | trail container alpha 1→0 over 400ms; flash already dead | `>= 400` → `idle`, drop latched cash-out × |

Flash (D-10): full-screen `Graphics` rect, color `0xff3b4e`, peak alpha 0.5, decay across 160ms. Do not write `stage.x` / `stage.y`. Do not shake.

Hold 1000ms is inside D-12's 0.8–1.2s. Fade 400ms is inside D-18's 0.3–0.5s. These timers add `deltaMS` from the same callback. They do not call `tick` and do not read `waitRemainingMs`.

Initial `waiting` at boot is `idle`, not a crash. Only a climb→waiting edge starts the hold. Detect that edge inside the reducer from previous phase, not from `history.length` alone (history also grows on spectator crashes, which is the same edge).

### Pattern 7: Application bootstrap

**What:**

```typescript
// Source: pixijs-application skill
// https://pixijs.download/release/docs/app.Application.html.md
const app = new Application();
await app.init({
  resizeTo: host,
  background: 0x070b14,
  antialias: true,
  autoDensity: true,
  resolution: Math.min(window.devicePixelRatio || 1, 2),
  preference: "webgl",
  autoStart: true,
  sharedTicker: false,
});
host.replaceChildren(app.canvas);
```

`new Application()` takes no options. Options passed to the constructor are ignored. `app.canvas` exists only after `init` resolves. `resizeTo: host` follows the host's client box (the game region above the HUD), not `window`. Call `app.resize()` once after mount. Cap resolution at 2 now; Phase 4 owns further DPR and mobile layout. `preference: "webgl"` keeps the demo on the predictable backend. Do not set `preference: "webgpu"` in this phase.

CSS today centers children in the host:

```23:30:src/styles/hud.css
.canvas-host {
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  background: #1a222c;
}
```

Change the host to `display: block; position: relative; overflow: hidden` and set `canvas { display: block; width: 100%; height: 100%; }`. Flex centering will letterbox or overflow a canvas that `resizeTo` sizes to the host's client box.

`main()` becomes async and is invoked as `void main()`. Do not start `startRafClock` before init (the 5s wait should begin when the canvas is up). Delete `src/app/rafClock.ts` once nothing imports it. HMR: `import.meta.hot.dispose` must `ticker.remove`, then `app.destroy({ removeView: true, releaseGlobalResources: true }, { children: true })`.

Backdrop (D-04), built on resize, back to front: vertical `FillGradient` rect (sky `#7ec8ff` → cloud band `#c5d4e8` → cosmos `#070b18`), a handful of ellipse clouds at low alpha, ~40 star circles, then a dim grid (`0xffffff` alpha ~0.06) over the plot. No parallax. The neon trail stays the focal. Static after resize.

### Anti-Patterns to Avoid

- **v7 draw API:** `beginFill`, `lineStyle`, `drawRect`, `new Application(options)` do not exist on v8. Shape, then `fill`/`stroke`. `new Text({ text, style })` options object only.
- **Two clocks:** leaving `startRafClock` running beside `app.ticker`.
- **Passing `deltaTime` or the whole ticker into `game.tick`.** The argument must be a number of milliseconds.
- **Uncapped `elapsedMS` into `tick`.** Skips the sever frame.
- **View-owned multiplier.** Do not `m += dt * rate` on the rocket. Do not call `multiplierAt` to draw past `snapshot.multiplier`.
- **Nesting children in `Graphics`.** Group with a `Container`.
- **`innerHTML` for the theater ×.** Assign `bitmapText.text`.
- **Stage shake** for D-10.
- **Durable `crashed` phase or a logic sleep** for the 1s hold. That would invent settlement timing and shorten or shift the 5s wait.
- **Pushing history at cash-out time.** The strip would reveal `crashAt` before the visual crash. Push when the round crashes.
- **Installing `pixi.js` without editing `tests/architecture.no-pixi.test.ts`.** The test currently fails the build if `package.json` lists `pixi.js`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WebGL context, resize, HiDPI canvas | A raw `getContext("webgl2")` loop | `Application.init({ resizeTo, autoDensity, resolution })` | ResizePlugin tracks the host. `autoDensity` sets CSS pixel size. |
| Frame clock | A second `requestAnimationFrame` | `app.ticker` + `deltaMS` | Render is already registered at `UPDATE_PRIORITY.LOW`. Another rAF double-ticks logic. |
| Neon glow shader | Custom GLSL / `Filter.from` | Two `Graphics.stroke` passes | D-01 is a thick trail. A filter pipeline is the expensive option discretion allows and this research rejects. |
| Particle engine | Object pool framework or `ParticleContainer` | 8 circle `Graphics` on the rocket container | D-08 is a short streak, not 10k sprites. |
| Bitmap font file | msdf tooling | Lazy `BitmapText` from a system family | No art dependency. `tint` recolors without re-raster. |
| Multiplier easing | GSAP tween of `rocket.x` | `plotPoint(snapshot.multiplier)` | Tweens fight seeded time. Roadmap success criterion 3. |
| Crash detection from pixels | "Rocket left the canvas" | climb→waiting edge on the snapshot | Sprite position is not an outcome. |
| Settlement delay | `setTimeout` before `enterWaiting` | View-mode timer after the snapshot is already `waiting` | Discretion forbids inventing settlement. Wallet and history already committed on the crash step. |

**Key insight:** Pixi already tessellates strokes, runs the ticker, and rasterizes bitmap glyphs. The only new pure code is plot mapping, the view-mode reducer, and the `cashed_out` continuation inside `resolveTick`.

## Common Pitfalls

### Pitfall 1: Cash-out snapshot cannot feed D-16

**What goes wrong:** Player cashes out and the canvas snaps to idle at 1.00×. There is no frozen cash-out × and no continued climb. The crash break is skipped or plays on a reset graph.

**Why it happens:** `settleOnce` writes a terminal phase and then `enterWaiting` overwrites it before the snapshot is published. The next `getSnapshot()` is `waiting` / multiplier `1` / `crashAt` null. History stores `crashAt`, not the paid multiplier. The paid multiplier is not on any snapshot.

```31:42:src/games/crash/logic/resolveTick.ts
function enterWaiting(state: RoundState): RoundState {
  return {
    ...state,
    phase: "waiting",
    waitRemainingMs: CRASH_CONFIG.waitDurationMs,
    elapsedMs: 0,
    multiplier: 1,
    crashAt: null,
    lockedBetCents: null,
    cashOutRequested: false,
    // autoCashOutAt persists across rounds unless cleared by facade
  };
}
```

```83:90:src/games/crash/logic/resolveTick.ts
  return enterWaiting({
    ...state,
    phase: terminalPhase,
    multiplier: settleMult,
    settledRoundId: state.roundId,
    lockedBetCents: null,
    cashOutRequested: false,
  });
```

```105:107:src/games/crash/logic/resolveTick.ts
  if (state.phase === "cashed_out" || state.phase === "crashed") {
    return enterWaiting(state);
  }
```

`tests/resolveTick.test.ts` expects `phase === "waiting"` on the cash-out step. That test encodes the behavior D-16 replaces. Update the tests in the same commit as the resolver. Do not satisfy D-16 by extrapolating the curve in the view.

**How to avoid:** Pattern 2. Wallet credit stays immediate and idempotent (`settledRoundId`). Only the visual lifetime of the flight changes.

**Warning signs:** After cash-out, `getSnapshot().phase === "waiting"` in one `maxDeltaMs` step. `cashOutAt` absent. History grows before the rocket stops.

### Pitfall 2: Ticker units and a skipped sever

**What goes wrong:** `game.tick` receives a `Ticker` object, or `deltaTime` (~1), or a 30s `elapsedMS` after a background tab. Settlement jumps, or the view never observes climb→waiting as its own sync.

**Why it happens:** v8 callbacks receive the `Ticker`, not a bare number. `deltaTime` is `deltaMS * 0.06`. `CrashGame.tick` will burn an entire large delta in 100ms sub-steps before `scene.sync`.

**How to avoid:** `game.tick(ticker.deltaMS)` and `app.ticker.minFPS = 10`. One sync per callback. Delete `rafClock`.

**Warning signs:** Multiplier stuck near 1.00× while the rocket crawls, or a round vanishes between two frames with no red sever.

### Pitfall 3: v7 Pixi API on v8

**What goes wrong:** Build fails or the trail never appears. `beginFill` / `lineStyle` / `drawCircle` / `new Application({ width })` / `new Text("1.00×", style)`.

**Why it happens:** Training snippets and older blogs. This repo has no Pixi yet, so the first file sets the habit.

**How to avoid:** Patterns 4 and 7. Import only from `"pixi.js"`. `Graphics` methods are `rect`, `circle`, `moveTo`, `lineTo`, `fill`, `stroke`, `clear`.

**Warning signs:** `TS2339` on `beginFill` or `lineStyle`. Constructor deprecation warning about options on `new Application()`.

### Pitfall 4: Clearing the whole scene every frame

**What goes wrong:** GPU hitch, or a backdrop that flickers.

**Why it happens:** Canvas-2D habit. v8 `Graphics.clear()` drops tessellated geometry.

**How to avoid:** Resample only the two trail `Graphics` during `climb`. Build backdrop once per resize. Move the rocket by `position` / `rotation`. Fade with `alpha`.

**Warning signs:** `clear()` called on the backdrop or on the rocket body each frame.

### Pitfall 5: Host flex centering vs `resizeTo`

**What goes wrong:** Curve clipped, rocket origin not at the visual lower-left, blurry canvas, or a canvas larger than the host.

**Why it happens:** `.canvas-host` is `display: flex; align-items: center; justify-content: center`. `resizeTo` uses the host's client size and then the canvas does not stretch as a flex item the way the author expects.

**How to avoid:** Block layout, canvas `width/height: 100%`, `autoDensity: true`, `resolution` capped at 2, plot rectangle derived from `app.screen` after resize. Recompute plot on `app.renderer` resize (listen or compare `screen.width/height` at the start of `sync`).

**Warning signs:** Placeholder "Game view" still visible beside the canvas. CSS `transform: scale` on the canvas.

### Pitfall 6: Logic imported by the view, or Pixi imported by logic

**What goes wrong:** ARCH-02 test fails, or the view calls `sampleCrashAt` / `multiplierAt` and drifts from the snapshot.

**Why it happens:** Path code feels like it belongs next to `MultiplierCurve.ts`.

**How to avoid:** `pathMapping.ts` and `viewMode.ts` import neither `pixi.js` nor `MultiplierCurve`. The view may import `formatMult` and the `CrashSnapshot` type. `multiplierAt` stays the only producer of `snapshot.multiplier`.

**Warning signs:** `pixi.js` string under `src/games/crash/logic` or `src/shared`. A view file calling `multiplierAt(elapsed)`.

### Pitfall 7: Double payout on spectator finish

**What goes wrong:** Cash-out credits every tick until crash, or history records two rows per round.

**Why it happens:** `settleOnce`'s idempotent guard today returns `enterWaiting` when `settledRoundId === roundId`. Reusing that guard unchanged aborts the spectator finish. Forgetting the guard credits twice.

**How to avoid:** Credit only in the flying→`cashed_out` transition. `cashed_out` ticks update `multiplier` only. History push only on the crash transition. One `roundId`, one credit, one history row.

**Warning signs:** Balance changes after the cash-out frame. `history.length` increases by 2.

## Code Examples

### Async init and host mount

```typescript
// Source: pixijs-application skill (Quick Start + ResizePlugin)
// https://pixijs.download/release/docs/app.Application.html.md
import { Application } from "pixi.js";

export async function mountCrashView(host: HTMLElement) {
  const app = new Application();
  await app.init({
    resizeTo: host,
    background: 0x070b14,
    antialias: true,
    autoDensity: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    preference: "webgl",
  });
  host.replaceChildren(app.canvas);
  app.resize();
  return app;
}
```

### Trail stroke

```typescript
// Source: pixijs-scene-graphics skill — shape, then stroke; round caps
// https://pixijs.download/release/docs/scene.Graphics.html.md
halo.clear();
core.clear();
halo.moveTo(points[0].x, points[0].y);
core.moveTo(points[0].x, points[0].y);
for (let i = 1; i < points.length; i++) {
  halo.lineTo(points[i].x, points[i].y);
  core.lineTo(points[i].x, points[i].y);
}
halo.stroke({ width: 16, color: 0x3dff8a, alpha: 0.35, cap: "round", join: "round" });
core.stroke({ width: 4, color: 0x3dff8a, alpha: 1, cap: "round", join: "round" });
```

Call `stroke` on each `Graphics` separately. Do not nest them.

### Theater label

```typescript
// Source: pixijs-scene-text references/bitmap-text.md
// "When you pass a system font family without calling BitmapFont.install,
//  the text-bitmap system generates a dynamic bitmap font on first use."
import { BitmapText } from "pixi.js";

const live = new BitmapText({
  text: "1.00×",
  style: { fontFamily: "Arial", fontSize: 64, fill: 0xffffff },
  anchor: 0.5,
});
// Per-frame: live.text = formatMult(snap.multiplier); live.tint = ramp(snap.multiplier);
```

### Rocket texture seam

```typescript
// Source: pixijs-scene-sprite skill — anchor 0.5 centers a later texture
// Parent Container holds rotation so the seam does not rewrite path-follow.
bodySprite.anchor.set(0.5);
bodySprite.visible = false;

function setBodyTexture(texture: Texture | null): void {
  if (texture) {
    bodySprite.texture = texture;
    bodySprite.visible = true;
    bodyGraphics.visible = false;
  } else {
    bodySprite.visible = false;
    bodyGraphics.visible = true;
  }
}
```

No `Assets.load` in this phase.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `new Application({ width, height })` then `app.view` | `new Application()` + `await app.init()` + `app.canvas` | PixiJS v8 | Init is async. Mount after await. |
| `beginFill` / `lineStyle` / `drawRect` | `rect`/`moveTo` then `fill`/`stroke` | PixiJS v8 | v7 chain will not compile. |
| Ticker callback `(deltaTime: number)` | Callback argument is the `Ticker`; read `.deltaMS` | PixiJS v8 | Passing the argument straight into `tick` is a type and logic bug. |
| `new Text("hi", style)` | `new Text({ text, style })` / `new BitmapText({ text, style })` | PixiJS v8 | Positional constructors removed. |
| `@pixi/graphics` packages | Single `pixi.js` import | PixiJS v8 | Do not add scoped `@pixi/*` deps. |

**Deprecated/outdated:**

- `app.view` — use `app.canvas`.
- `GraphicsGeometry` — use `GraphicsContext` only if sharing geometry. This phase does not need a shared context.
- Particle engines and GSAP for the multiplier — rejected above.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `ticker.minFPS` default is 10, so an explicit `minFPS = 10` caps one frame near 100ms. Stated by the installed pixijs-ticker skill. Live docs were not fetched this session (Context7/WebFetch unavailable). | Pattern 1 | If the default differs, an unset cap could skip the sever. Setting `minFPS = 10` in code removes the dependency on the default. |
| A2 | Halo width 16 / core width 4 / colors `0x3dff8a` and `0xff3b4e` read as thick neon green-then-red. Design tokens, not measured. | Pattern 4 | Visual polish only. Adjust constants in `viewConfig.ts` without changing the two-stroke structure. |
| A3 | `SCALE_HEADROOM` 1.25, plot top at 36% of height, and `log2` x vs linear `(m-1)` y satisfy D-03 and keep the tip out of the upper third. | Pattern 3 | If the tip clips the theater ×, change pads/headroom only. Keep the pure function and its slope test. |
| A4 | Hold 1000ms, fade 400ms, flash 160ms at alpha 0.5, bob ±4px over 1400ms sit inside D-10/D-12/D-18/D-19. | Pattern 6 | Micro-timing. Do not move these clocks into `resolveTick`. |
| A5 | Lazy `BitmapText` atlas from `Arial`/`Segoe UI` works without `BitmapFont.install`, and `tint` recolors white glyphs without rebuilding the atlas. Cited from the bitmap-text skill, not a runtime probe. | Pattern 6 | If tint is ignored, set `fill` once to white at construction and tint; do not change `fontSize` per frame. |
| A6 | `moduleResolution: "NodeNext"` accepts `import from "pixi.js"` because `exports["."].import` exists. Not compiled in this session. | Standard Stack | If `tsc` fails, switch app tsconfig `module`/`moduleResolution` to `ESNext`/`bundler` for the Vite project only. Do not weaken the logic import ban. |

## Open Questions (RESOLVED)

1. **Human verify before `npm install pixi.js`**
   - What we know: `npm view` reports 8.21.0, repo `github.com/pixijs/pixijs`, `postinstall` null, weekly downloads 1,234,217. Seam verdict SUS only because the latest publish is `too-new`.
   - What's unclear: nothing technical. The seam still requires a checkpoint.
   - RESOLVED: Plan 03-01 Task 1 is `checkpoint:human-verify` (blocking) — approve only when `npm view pixi.js version` is exactly `8.21.0` and `repository.url` is `git+https://github.com/pixijs/pixijs.git` (github.com/pixijs/pixijs). Task 2 then pins exactly `pixi.js@8.21.0`. Do not install a substitute renderer.

2. **NodeNext vs Pixi types**
   - What we know: package exports include `import.types`. Repo tsconfig is `NodeNext` / `NodeNext`. `[VERIFIED: tsconfig.json]`
   - What's unclear: whether TS 5.8 selects `types@<6.0` legacy typings and whether those include `BitmapText` and `resizeTo`.
   - RESOLVED: Do not pre-edit tsconfig. First compile with `npx tsc --noEmit` (03-01 Task 2). Only if that fails on the `pixi.js` import, set app `module` / `moduleResolution` to `ESNext` / `bundler` and re-run tsc. Keep the logic/shared pixi ban.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | npm install, Vite, Vitest | ✓ | v24.18.0 | — |
| npm | Install `pixi.js` | ✓ | 11.16.0 | — |
| Vite | Existing shell | ✓ | 6.4.3 | — |
| TypeScript | `tsc --noEmit` | ✓ | 5.8.3 | — |
| Vitest | Phase gate | ✓ | 3.2.7 | — |
| `pixi.js` | VIS-01 | ✗ not installed | registry 8.21.0 | none — must install |
| Context7 / live Pixi docs | API cross-check | ✗ not in this session | — | Installed Pixi skills + `npm view` exports |
| Browser WebGL | Visual check | not probed | — | Manual `npm run dev` after implementation. Vitest stays on Node. |

**Missing dependencies with no fallback:**

- `pixi.js` is not in `package.json` (intentional until this phase). Execution installs it. No alternate renderer.

**Missing dependencies with fallback:**

- Live documentation fetch. API shapes below are cited from the local PixiJS skills read this session, which link to `https://pixijs.download/release/docs/`.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.7 |
| Config file | `vitest.config.ts` (`environment: "node"`, includes `src/**/*.test.ts` and `tests/**/*.test.ts`) |
| Quick run command | `npx vitest run tests/pathMapping.test.ts tests/viewMode.test.ts tests/resolveTick.test.ts tests/architecture.no-pixi.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VIS-01 | Path is left→right and steeper after 2× than from 1× to 2×; m=1 is the origin; non-finite does not produce NaN | unit | `npx vitest run tests/pathMapping.test.ts` | ❌ Wave 0 |
| VIS-01 | climb→waiting enters crash_hold; rocket flag hidden; fade clears latched cash-out ×; boot waiting is idle; dim crash × kept until next flying | unit | `npx vitest run tests/viewMode.test.ts` | ❌ Wave 0 |
| VIS-01 | Cash-out sets `cashOutAt`, phase stays `cashed_out`, multiplier still increases, wallet credits once, history unchanged until `m >= crashAt`, then one history row and `waiting` with `waitRemainingMs === 5000` | unit | `npx vitest run tests/resolveTick.test.ts tests/walkingSkeleton.test.ts` | ✅ files exist — assertions must change |
| VIS-01 | `cashed_out` cannot place bet or cash out | unit | `npx vitest run src/games/crash/hud/enablement.test.ts` | ✅ add one case |
| VIS-01 | `pixi.js` allowed in package.json; still forbidden under `logic/` and `shared/` | unit | `npx vitest run tests/architecture.no-pixi.test.ts` | ✅ must edit the package.json deny |
| VIS-01 | Recruiter sees neon trail, tangent rocket, red sever, flash, hold, fade, idle bob, dual × after cash-out | manual | `npm run dev` then play one cash-out and one crash | manual-only — Node Vitest has no WebGL |

Manual-only justification: VIS-01's pixels (glow, tangent, flash) need a browser. The behaviors that can lie (mapping slope, mode transitions, continued flight, single payout) are pure functions and stay in Vitest. Do not add Playwright or `@vitest/browser` in this phase.

### Sampling Rate

- **Per task commit:** `npx vitest run tests/pathMapping.test.ts tests/viewMode.test.ts tests/resolveTick.test.ts tests/architecture.no-pixi.test.ts`
- **Per wave merge:** `npm test`
- **Phase gate:** `npm test` green, plus `npx tsc --noEmit`, plus one manual cash-out round and one crash round in `npm run dev` confirming sever, continued flight after cash-out, and idle bob. `/gsd-verify-work` before calling VIS-01 done.

### Wave 0 Gaps

- [ ] `tests/pathMapping.test.ts` — D-03 slope, origin at m=1, non-finite guard
- [ ] `tests/viewMode.test.ts` — hold, fade, latch, idle vs boot
- [ ] `tests/resolveTick.test.ts` / `tests/walkingSkeleton.test.ts` — rewrite cash-out expectations for spectator finish (do not leave them red)
- [ ] `src/games/crash/hud/enablement.test.ts` — `cashed_out` disables place and cash-out
- [ ] `tests/architecture.no-pixi.test.ts` — expect `pixi.js` present; keep the source scan
- [ ] Framework install: none (Vitest already present). `pixi.js` install is plan 03-01, not a test-runner install.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No accounts. |
| V3 Session Management | no | No session. Demo seed stays the existing `createGame({ seed })` string. |
| V4 Access Control | no | Single local player. |
| V5 Input Validation | yes | Commands stay on `CrashGame` (non-finite bets already rejected). View treats snapshot numbers as untrusted for drawing: `pathMapping` bails on non-finite. Theater text is `formatMult` (`toFixed`) assigned to `BitmapText.text`, never `innerHTML`. No new HTML parsers. |
| V6 Cryptography | no | Seeded demo RNG already in logic. View does not hash or re-seed. |

### Known Threat Patterns for Pixi + existing HUD

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| View credits wallet or re-samples `crashAt` | Tampering | Scene has no command methods. Sync is read-only. ARCH-02 source scan stays on `logic/` and `shared/`. |
| Theater × or crash × injected into DOM | Tampering / XSS | Canvas text only. Do not write snapshot strings with `innerHTML`. HUD history already uses `textContent` (Phase 2). |
| Uncapped `tick` stalls the tab (huge sub-step loop) | Denial of service | `ticker.minFPS = 10` so one frame cannot enqueue tens of seconds of steps. |
| `pixi.js` supply chain | Tampering | Pin `8.21.0`. Seam SUS/`too-new` → human-verify official repo before install. `postinstall` is null. No git URL dependency. |
| Remote texture URL | Tampering | D-05 seam accepts a `Texture` later. This phase does not `Assets.load` a network URL. |
| Canvas placed over HUD controls | Tampering (mis-click) | Column layout keeps the host above `#hud-bar`. Do not `position: fixed` the canvas over the footer. Pointer-event hardening is Phase 4. |

## Sources

### Primary (HIGH confidence)

- `.planning/phases/03-pixi-hybrid-view/03-CONTEXT.md` — locked D-01..D-20
- `src/games/crash/logic/resolveTick.ts` — `enterWaiting` / `settleOnce` / immediate terminal wipe (lines 31–42, 83–90, 105–107)
- `src/games/crash/logic/RoundState.ts` — `Phase` and `CrashSnapshot` fields
- `src/games/crash/logic/CrashGame.ts` — `tick` sub-step and `getSnapshot`
- `src/games/crash/hud/enablement.ts` — waiting/flying matrix
- `src/main.ts` — rAF handoff comment
- `tests/architecture.no-pixi.test.ts` — package.json `pixi.js` ban
- `npm view pixi.js version` → 8.21.0; exports `".".import`; legitimacy JSON SUS/`too-new`, downloads 1234217, repo pixijs/pixijs, postinstall null

### Secondary (MEDIUM confidence)

- Installed skills read this session (Context7 was the research-plan provider and was not available; WebFetch/WebSearch were blocked):
  - `pixijs-application` — async `init`, `resizeTo`, `app.canvas`, destroy options. Docs: `https://pixijs.download/release/docs/app.Application.html.md`
  - `pixijs-ticker` — `deltaMS` vs `deltaTime` vs `elapsedMS`, callback receives `Ticker`, `minFPS` default 10. Docs: `https://pixijs.download/release/docs/ticker.Ticker.html.md`
  - `pixijs-scene-graphics` — `stroke`/`clear`, leaf node, v7 names removed, per-frame `clear` cost. Docs: `https://pixijs.download/release/docs/scene.Graphics.html.md`
  - `pixijs-scene-text` + `references/bitmap-text.md` — `BitmapText` options object, lazy system-font atlas
  - `pixijs-scene-sprite` — `anchor` 0.5
  - `pixijs-filters` / `pixijs-scene-particle-container` — rejected for this phase's scale
- `.planning/research/PITFALLS.md` — animation-owned timing, resize, logic-in-view
- `.planning/research/ARCHITECTURE.md` — `games/crash/view` seam
- `.planning/research/STACK.md` — ticker feeds logic, no GSAP for the multiplier

### Tertiary (LOW confidence)

- None beyond the design tokens in the Assumptions Log (A2–A4).

## Metadata

**Research scope:**

- Core technology: PixiJS v8.21.0 Application, ticker, Graphics, BitmapText
- Ecosystem: no extra libraries
- Patterns: snapshot-driven trail, durable `cashed_out`, view-local crash hold
- Pitfalls: current settle wipe, ticker units, v7 API, double clock, double payout

**Confidence breakdown:**

- Standard stack: HIGH — version from `npm view` this session; API from skills; legitimacy SUS is a checkpoint, not a different package
- Architecture: HIGH — D-16 gap is in `resolveTick.ts` read this session
- Pitfalls: HIGH — same source, plus Pixi skill "common mistakes"
- Code examples: MEDIUM — transcribed from skills, not executed in a Pixi runtime this session

**Research date:** 2026-09-27
**Valid until:** 2026-10-27 (30 days; Pixi 8 API is stable, patch version may move)

---

*Phase: 03-pixi-hybrid-view*
*Research completed: 2026-09-27*
*Ready for planning: yes*
