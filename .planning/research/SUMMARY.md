# Project Research Summary

**Project:** Casino Crash Portfolio (PixiJS)
**Domain:** Client-only browser Crash (Aviator-like) game — PixiJS v8 portfolio demo
**Researched:** 2026-09-26
**Confidence:** HIGH

## Executive Summary

This is a single-page, client-only Crash game built as a PixiJS portfolio piece: a recruiter opens the demo, places a bet, watches a rising multiplier with a hybrid curve + rocket visual, cashes out or crashes, and sees a demo balance update — all under clear DEMO / portfolio labeling. Experts in this genre treat the round as a pure state machine (seeded crash point at round start, time-driven multiplier, settle once) with canvas as presentation only; that matches the project’s locked GameLogic ↔ Pixi split.

**Recommended approach:** Scaffold Vite + PixiJS v8 + TypeScript 5.x with a thin HTML/CSS control overlay (no React/Angular in v1). Build GameLogic first (FSM, wallet, seeded RNG, tick/settle, auto cash-out, history), wire a headless-playable HUD, then Pixi hybrid visuals. Use `app.ticker` → `GameLogic.update(deltaMS)` → view snapshots; Vitest on pure logic; seedrandom behind an `Rng` interface; audio stub until placeholders.

**Key risks:** animation-owned timing and mid-flight RNG break reproducibility; float/auto-vs-crash races corrupt settlement; logic entangled in Pixi kills testability; weak DEMO labeling or commercial lookalike assets create legal/optics risk. Mitigate by shipping a single `resolveTick` authority in Phase 1, HTML-only monetary controls, persistent DEMO chrome, and original/placeholder art only.

## Key Findings

### Recommended Stack

Full detail: [STACK.md](./STACK.md). Locked stack is PixiJS v8 + TypeScript 5.x + Vite 6.x+ + vanilla HTML/CSS overlay. Prefer `create-pixi` `bundler-vite` (or manual same deps if `.planning/` blocks scaffold). Core flight time uses built-in `app.ticker` feeding GameLogic — not GSAP for the multiplier. seedrandom + Vitest for v1; Howler behind `AudioPort` when adding SFX; GSAP optional later for polish FX only.

**Core technologies:**
- **PixiJS v8 (`pixi.js`):** WebGL/WebGPU 2D canvas (curve, rocket, crash FX) — locked portfolio stack; monolithic v8 API
- **TypeScript ~5.8:** Typed GameLogic + view boundaries — avoids TS 6/7 WebGPU typing friction for v1
- **Vite ^6.3+:** Dev server, HMR, production bundle — official Pixi template; wrap `app.init()` in async IIFE
- **Vanilla HTML + CSS:** Bet / cash-out / balance / DEMO overlay — fastest single-game path; SPA deferred
- **seedrandom + Vitest:** Seeded crash points + unit tests on pure logic — reproducible demos and CI without canvas

### Expected Features

Full detail: [FEATURES.md](./FEATURES.md). v1 is table-stakes Crash UX plus architecture signal — not Aviator feature parity. Dual bets, auto-bet, multiplayer, lobby, and real money are deferred or anti-features.

**Must have (table stakes):**
- Round FSM (waiting → flying → cashed out / crashed) — game identity
- Demo wallet + place bet + presets + live multiplier + manual cash-out — Core Value loop
- Hybrid curve + rocket + crash break; HTML controls + DEMO badge — portfolio spectacle + honesty
- History strip + auto cash-out + seeded RNG + mobile layout + GameLogic/Pixi split — credible Crash + eng signal

**Should have (competitive / v1.x):**
- Waiting countdown, sound + mute, seed/`?seed=` replay — polish and interview rigor
- Soft session stats, keyboard cash-out, stronger crash VFX — low–medium cost after playable loop

**Defer (v2+):**
- Dual simultaneous bets, auto-bet, fake player feed — after single-bet UX is solid
- Multi-game lobby / React|Angular shell, additional games — later milestones
- Real money, auth, multiplayer, provably fair — out of scope

### Architecture Approach

Full detail: [ARCHITECTURE.md](./ARCHITECTURE.md). One composition root wires three layers: GameLogic owns authoritative state (commands in, snapshots/events out); HTML HUD sends commands; Pixi observes and renders. Ticker advances logic only while flying; crash point is decided at round start. Folder seams (`games/crash/{logic,view,hud}`, `shared/`) enable future games without building a lobby in v1.

**Major components:**
1. **GameLogic** — Round FSM, wallet, seeded RNG, multiplier curve, auto cash-out, history — pure TS, unit-testable
2. **HTML HUD** — Bet/presets, cash out, balance, DEMO badge, history strip, auto cash-out input
3. **Pixi View** — CurveGraph + Rocket + crash FX synced from snapshots; ticker feeds `tick(dt)`
4. **Vite App Shell** — Bootstrap Application, mount canvas + HUD, subscribe, resize/lifecycle
5. **Seeded RNG / History** — Deterministic `crashAt` at round start; last-N ring buffer for strip

### Critical Pitfalls

Full detail: [PITFALLS.md](./PITFALLS.md). Top risks for roadmap ordering:

1. **Animation-driven crash timing** — Logic owns `(seed, elapsedMs)` → state; clamp `deltaMS`; never drive outcome from sprite position or uncapped catch-up
2. **Unseeded / mid-flight RNG** — Roll `crashAt` once at round start via seedrandom; label as demo RNG, not provably fair
3. **Float comparisons + auto vs crash race** — Shared fixed-point/rounder; single `resolveTick` with crash-before-auto order; idempotent settlement
4. **Logic entangled in Pixi** — Zero `pixi.js` imports in logic; HTML commands only; Node Vitest without canvas
5. **DEMO/IP + mobile overlay/resize** — Persistent DEMO badge + original assets; resize to game container with capped DPR; HTML-only monetary controls, canvas `pointer-events: none` if non-interactive

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: GameLogic Core (FSM, Wallet, RNG, Settle)
**Rationale:** Architecture and pitfalls both require authoritative time + seed before any canvas work; pure TS ships tests without WebGL.
**Delivers:** Round phases, place bet / cash out / crash settle, seeded `crashAt`, live multiplier from elapsed time, auto cash-out in `resolveTick`, history buffer, shared multiplier formatter.
**Addresses:** Round loop, demo wallet, seeded RNG, auto cash-out, GameLogic/Pixi split (logic half), bet amount validation path.
**Avoids:** Animation-owned timing, unseeded RNG, float/race settlement bugs, logic-in-view debt.

### Phase 2: Vite Shell + HTML HUD + DEMO Chrome
**Rationale:** Headless-playable loop proves Core Value with numbers before art; DEMO labeling is a release optics blocker.
**Delivers:** Composition root, HTML bet/presets/cash-out/balance/auto CO/history strip, DEMO badge + meta copy, button enablement from phase.
**Uses:** Vite + vanilla HTML/CSS + thin TS binders; Vitest continues on logic.
**Implements:** HUD ↔ GameLogic command/snapshot bridge; App Shell wiring.

### Phase 3: Pixi Bootstrap + Hybrid Curve/Rocket View
**Rationale:** Presentation depends on correct snapshots; build order places Pixi after logic+HUD.
**Delivers:** `Application` init (async IIFE, resize to game region, capped DPR), CurveGraph + Rocket driven by multiplier, crash break FX, in-canvas multiplier optional mirror.
**Uses:** `pixi.js` v8, ticker → `tick(deltaMS)`, Graphics + Sprite patterns from Pixi skills.
**Implements:** Pixi View layer; hybrid visual locked requirement.
**Avoids:** Resize/HiDPI breakage, unbounded path rebuild, commercial IP in assets.

### Phase 4: Mobile Polish + Playable Demo Hardening
**Rationale:** Recruiters open on phones; overlay hit conflicts and layout are Phase 2–3 verification debts.
**Delivers:** Mobile-friendly layout, touch-sized controls, canvas/overlay stacking fix, history styling, waiting beat / terminal pause if needed, ship checklist (DEMO, IP, seed replay, auto≈crash tests).
**Addresses:** Mobile-friendly layout; remaining P1 UX gaps.
**Avoids:** Overlay hit conflicts, missing DEMO on first viewport, phase machine UI gaps.

### Phase 5 (optional / v1.x): Audio, Replay Seed, Light Polish
**Rationale:** FEATURES P2 — only after one clean round is shareable.
**Delivers:** Howler/`AudioPort` placeholders + mute, `?seed=` / seed inspector, optional GSAP crash shake, keyboard cash-out.
**Uses:** Howler (when ready); optional GSAP for FX only.
**Avoids:** Polish that breaks seeded reproducibility.

### Phase Ordering Rationale

- Logic → HUD → Pixi → polish matches ARCHITECTURE suggested build order and dependency graph (RNG → round → multiplier → visual; wallet → bet → settle → auto CO).
- Grouping keeps phases small and shippable per PROJECT.md; each phase ends with something demoable (tests → number loop → spectacle → mobile-ready).
- Front-loading `resolveTick`, seeded RNG, and logic/view boundary prevents the highest-cost recoveries (animation-owned timing, logic-in-view).

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** Exact crash-curve formula + fixed-point money/multiplier helpers — domain math details beyond “time → multiplier”
- **Phase 3:** Curve path parameterization and segment strategy for Graphics performance on long flights
- **Phase 5:** Audio unlock-on-gesture + asset pipeline if SFX are user-provided

Phases with standard patterns (skip deep research-phase):
- **Phase 2:** HTML overlay binders + Vite bootstrap — well-documented; follow STACK init tips
- **Phase 4:** Responsive CSS + touch targets — standard web layout QA against PITFALLS checklist

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Locked by PROJECT.md + Pixi create/skills; exact npm patches not live-verified |
| Features | HIGH | Strong alignment with commercial Crash UX + explicit out-of-scope locks |
| Architecture | HIGH | Standard pure-logic + thin views; folder seams for future games |
| Pitfalls | HIGH | Genre + Pixi/browser failure modes mapped to phases |

**Overall confidence:** HIGH

### Gaps to Address

- **Exact npm patch versions:** Confirm at scaffold with `npm view <pkg> version` (STACK noted registry unavailable this pass).
- **Multiplier curve formula / crash distribution:** Choose a simple demo formula in Phase 1 planning; document as demo RNG, not RTP certification.
- **Art/SFX assets:** Placeholders OK; ask user when textures/images/SFX are needed (PROJECT context).
- **Informal `GameModule` contract:** Enough for v1; formalize only when a second game or SPA shell starts.

## Sources

### Primary (HIGH confidence)
- `.planning/PROJECT.md` — locked stack, scope, DEMO/IP, GameLogic/Pixi split
- Research artifacts: [STACK.md](./STACK.md), [FEATURES.md](./FEATURES.md), [ARCHITECTURE.md](./ARCHITECTURE.md), [PITFALLS.md](./PITFALLS.md)
- PixiJS skill collection (create, application, ticker, graphics, sprite, assets) — v8 init, ticker, Vite pitfalls

### Secondary (MEDIUM confidence)
- Commercial Crash UX patterns (Aviator/Spribe-class, JetX-class) — feature parity expectations, adapted to portfolio constraints
- Howler / GSAP as optional polish — not required for correct loop

### Tertiary (LOW confidence)
- Exact latest npm patch numbers — confirm at install time
- WebGPU as default preference — optional showcase; WebGL is the portable demo default

---
*Research completed: 2026-09-26*
*Ready for roadmap: yes*
