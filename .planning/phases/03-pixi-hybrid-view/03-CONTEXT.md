# Phase 3: Pixi Hybrid View - Context

**Gathered:** 2026-09-27
**Status:** Ready for planning

<domain>
## Phase Boundary

PixiJS v8 hybrid spectacle mounted in the reserved `#game-canvas-host`: rising neon curve with a small rocket on the path, big in-canvas theater multiplier, and a clear crash path-break — driven only by GameLogic snapshots. Composition root switches tick feed from `rafClock` to `app.ticker` at the same tick + HUD render site. No mobile stacking (Phase 4), no countdown/SFX/seed/stats/keyboard polish (Phase 5), no monetary controls in Pixi.

</domain>

<decisions>
## Implementation Decisions

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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project scope
- `.planning/PROJECT.md` — Hybrid curve+rocket visual lock; Pixi v8 + TS + Vite; HTML HUD; GameLogic ≠ Pixi; assets ask-user / original IP only
- `.planning/REQUIREMENTS.md` — VIS-01 mapped to Phase 3
- `.planning/ROADMAP.md` — Phase 3 goal, success criteria, plans 03-01..03-03
- `.planning/STATE.md` — Current position / session continuity
- `.planning/phases/02-vite-shell-html-hud/02-CONTEXT.md` — D-01/D-04 canvas host + tick-site handoff notes
- `.planning/phases/01-gamelogic-core/01-CONTEXT.md` — Cadence D-13–D-15; multiplier climb D-09–D-12

### Research / architecture
- `.planning/research/ARCHITECTURE.md` — Pixi observes snapshots; `app.ticker` → `tick(dt)`; `games/crash/view` seam; hybrid path + rocket
- `.planning/research/STACK.md` — PixiJS v8 timing / deps
- `.planning/research/PITFALLS.md` — Animation-owned timing; logic leaking into Pixi

### Existing integration (code)
- `src/main.ts` — Composition root; comment marks Phase 3 stop `rafClock` then bind `app.ticker`
- `src/app/rafClock.ts` — Current tick source to replace
- `index.html` — `#game-canvas-host` mount target
- `src/games/crash/logic/CrashGame.ts` — Facade: `tick` / `getSnapshot` / commands
- `src/games/crash/logic/RoundState.ts` — `CrashSnapshot` / phase fields for view sync
- `src/games/crash/logic/MultiplierCurve.ts` — Authoritative multiplier-from-time (view maps; does not recompute outcomes)
- `src/games/crash/hud/CrashHud.ts` — Existing HUD live × mirror; keep commands in HUD

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `createGame` / `CrashGame` — sole authority; view reads `getSnapshot()` after each tick.
- `#game-canvas-host` + `.canvas-host` — empty reserved slot ready for Application canvas mount.
- `startRafClock` — stoppable clock; Phase 3 stops it and binds the same `(deltaMs) => { game.tick; hud.render }` site to Pixi ticker.
- `formatMult` / HUD liveMult — display-unit `×` formatting already exists for HUD; Pixi theater × should match 2dp convention (Phase 1 D-11).

### Established Patterns
- Pure logic under `src/games/crash/logic/` with no `pixi.js` imports; `pixi.js` not yet in `package.json` (add in this phase).
- HUD sends commands only; composition root owns lifecycle.
- Research folder seam: `games/crash/view/` for Pixi-only scene (CurveGraph, rocket, crash FX).

### Integration Points
- Mount Pixi into `#game-canvas-host`; resize to host bounds (mobile hardening deferred to Phase 4).
- Wire `app.ticker` → `game.tick(deltaMS)` → snapshot → HUD render + Pixi sync.
- View reacts to `phase` / `multiplier` / cash-out vs crash for D-09–D-20 choreography; never settles wallet or RNG.

</code_context>

<specifics>
## Specific Ideas

- Backdrop should feel like an ascent through layers: **sky → clouds → deep cosmos with stars**, with a **dim grid** so it still reads as a Crash graph.
- After cash-out, recruiters should see **two numbers**: locked personal cash-out × below, and continuing live theater × / rocket until crash.
- Waiting should not look empty/broken: **ghost origin + parked bobbing rocket + dim last crash ×**.

</specifics>

<deferred>
## Deferred Ideas

None new from discussion — stayed in Phase 3 domain. Already-roadmap deferred (not reopened here):
- Mobile / touch stacking / DPR resize hardening → Phase 4
- Waiting countdown digits, SFX/mute, `?seed=`, session stats, keyboard cash-out → Phase 5
- User-supplied rocket texture file — seam reserved (D-05); provide asset when ready
- DEMO badge UI → declined (PROJECT.md)
- Multi-game lobby / React shell → later milestone

</deferred>

---

*Phase: 3-Pixi Hybrid View*
*Context gathered: 2026-09-27*
