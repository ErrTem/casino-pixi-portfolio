# Project Research Summary

**Project:** casino-pixi-portfolio (HOTLINE + Crash)
**Domain:** Client-only PixiJS v8 multi-game casino portfolio (Crash + Witch Pots–style HOTLINE slot + shared menu)
**Researched:** 2026-10-09
**Confidence:** HIGH (brownfield stack/architecture) / MEDIUM (Witch Pots feature mapping, reel/audio ecosystem tradeoffs)

## Executive Summary

This milestone extends an existing PixiJS v8 Crash demo into a multi-game portfolio: a lean menu shell plus **HOTLINE**, a 5×4 / 40-line feature slot whose math mirrors Endorphina’s **3 Witch Pots**, reskinned as Hotline Miami (motel rooftop, CRT/VHS frame, Retro Computer font, diskette→phone collectors, three bonuses with combo nights, VHS SURVIVE/DIE gamble). Experts build this as exclusive one-game-at-a-time sessions over shared ports (audio, mute, seed, money helpers), with pure logic resolving full spin/feature books and Pixi/DOM only replaying snapshots and events — not rolling RNG.

**Recommended approach:** Keep `pixi.js@8.21.0`, Vite 6, TS 5.8, Vitest, `seedrandom`; add `zod` for backend-shaped JSON config and `howler` behind the existing `AudioPort`. Prefer a **first-party reel view** (ticker + mask) and Crash-aligned `logic` / `view` / `hud` layout under `src/games/hotline/`. Shell owns a **single long-lived Pixi `Application`**; games mount/unmount scene roots and DOM HUD fragments — do not destroy/recreate Application per switch. Crash gameplay stays untouched; only extract today’s `main.ts` wiring into a session adapter.

**Key risks:** Pixi v8 global TexturePool corruption on multi-app destroy; view-side RNG / dual math; token meters treated as fill-gates instead of random-on-land; Hold & Win locked-cell contamination; FS wild density boolean soup; gamble without win-lock; rewriting Crash “for the shell.” Mitigate with GameSession mount/unmount contracts, FeatureQueue + phase FSM, Vitest-seeded transcripts, illustrative JSON only (no certified RTP claims), and user-owned art drops.

## Key Findings

### Recommended Stack

Stay on the brownfield toolchain. Add Zod + Howler only; no React, Phaser, GSAP, or `pixi-reels`. Details in [STACK.md](./STACK.md).

**Core technologies:**
- `pixi.js@8.21.0` — WebGL scene, Assets, Text, masks, ticker — already shipping Crash; intentional bump to 8.22 later
- TypeScript `~5.8.3` + Vite `^6.4.x` + Vitest `^3.2.7` — match repo; test math/config without canvas
- `seedrandom` via `createRng` — HOTLINE outcomes + `?seed=` parity with Crash
- `zod@^4.6.5` — parse backend-shaped game JSON once at load; fail loud on bad weights
- `howler@^2.2.4` (+ `@types/howler`) — HOTLINE SFX behind `AudioPort`; Crash can keep beeps
- Custom reel engine (ticker + Graphics mask + stagger stop) — portfolio control; avoids GSAP peer of `pixi-reels`
- Retro Computer TTF via `Assets.load` + CSS `@font-face` — brand lock for canvas and DOM

### Expected Features

Core Value is the full Witch Pots loop in Hotline Miami dress, not a single free-spins toy. Details in [FEATURES.md](./FEATURES.md).

**Must have (table stakes):**
- Multi-game menu (Crash + HOTLINE + future slot) with return-to-menu
- Shared mute; seeded boot; demo-only label; responsive desktop/mobile
- HOTLINE base: 5×4, 40 L→R lines, Wild on reels 2–5, bet/balance/spin HUD
- Diskette tokens → three rotary phone meters + random trigger on land
- Green 24 FS + elevated Wild masks; Red Hold & Win; Purple locker Pick’em
- Combo nights (queue / nested from FS); VHS SURVIVE/DIE gamble ×10
- Backend-shaped JSON config; motel rooftop + CRT/VHS + Retro Computer

**Should have (competitive / P2):**
- Paytable / rules overlay
- Token flight + meter anticipation polish
- Simple autoplay / turbo after FSM stable; forced-trigger debug tools
- Shared vs per-game wallet polish once menu UX settles

**Defer (v2+ / never in v1):**
- Megaways, cascades, buy-feature, Bonus Pop
- Live backend / real money / KYC / certified RTP
- Full aggregator lobby; Crash gameplay rewrite; agent-invented final art

### Architecture Approach

Exclusive GameSession shell: registry maps `gameId` → `mount` / `dispose`; shared boot/audio/mute/seed stay alive; Crash and HOTLINE never share wallets or peek into each other’s stores. HOTLINE uses config-in / result-out math, snapshot + event lists for view/HUD, and a FeatureQueue for combo nights. Details in [ARCHITECTURE.md](./ARCHITECTURE.md).

**Major components:**
1. **PortfolioShell** — boot seed, AudioPort, menu ↔ one active game, dispose previous before next
2. **GameRegistry / GameSession** — uniform mount/dispose; Crash adapter wraps existing create/mount without math rewrite
3. **HOTLINE MathEngine** — pure spin, paylines, meters, features, gamble; Zod-loaded JSON
4. **HOTLINE View + HUD** — reels, phones, token flights, CRT; DOM stake/spin mirroring CrashHud
5. **Shared ports** — audio, mute, cents, rng, fonts under `src/shared/`

**Application lifecycle (resolved conflict):**

Architecture initially allowed per-session `Application` destroy with `releaseGlobalResources: true`. Pitfalls (and Pixi #11694) make that the failure mode for menu switches. **Roadmap recommendation: one long-lived `Application` owned by the shell; swap scene roots (menu / Crash / HOTLINE) via mount/unmount.** Remove ticker handlers and clear HUD DOM on every switch. Use `releaseGlobalResources: true` only on final tab/HMR teardown. Recreate-app is a last resort with `releaseGlobalResources: false` between games — not the default plan.

### Critical Pitfalls

Top risks from [PITFALLS.md](./PITFALLS.md):

1. **Multi-app destroy / leaked tickers** — one Application + strict mount/unmount; never leave Crash `onTick` registered under HOTLINE
2. **View re-rolls math** — logic emits ordered events; view replays only; seeded Vitest transcripts
3. **Token fill-gate / wrong trigger model** — random trigger on land decided before animation; combo = FeatureQueue, not parallel FSMs
4. **Hold & Win locked-cell contamination** — separate locked ledger vs free cells; reset counter only on new cash land
5. **Crash rewrite for the shell** — thin adapter only; no diffs under `crash/logic` gameplay; no mega SlotEngine

Also watch: FS wild boolean soup, gamble without pot/control lock, pick’em number drift + fake RTP tone, AI-fingerprint code / invented art.

## Implications for Roadmap

Based on research, suggested phase structure (aligns Architecture build order + Features dependencies + Pitfall phases):

### Phase 1: Multi-game shell + GameSession
**Rationale:** Unblocks portfolio routing without touching Crash or HOTLINE math; lifecycle must be proven before a second WebGL game mounts.
**Delivers:** `PortfolioShell`, hosts (`#app` / canvas host), menu UI, registry stub, single long-lived Application + scene root swap.
**Addresses:** Multi-game menu; shared mute/seed chrome; Crash wire-in path.
**Avoids:** Dual Application / ticker leaks; bolting menu by rewriting Crash; Crash chrome left in `index.html` forever.

### Phase 2: Crash session adapter
**Rationale:** Proves mount/unmount and return-to-menu on a known-good game before HOTLINE exists.
**Delivers:** Extract `main.ts` → `mountCrashSession`; menu launch/return Crash; Vitest Crash suite still green.
**Addresses:** Crash intact in portfolio shell.
**Avoids:** Crash rewrite; shared eternal wallet coupling.

### Phase 3: HOTLINE config schema + loader
**Rationale:** Backend-shaped JSON early so math locks to one schema; avoids hardcoded prize drift.
**Delivers:** Zod schemas + `hotline.math.json` (strips, pays, meters, features, gamble) + Vitest fixtures; demo-only framing in docs/rules.
**Addresses:** JSON backend-shaped config; illustrative weights (not certified RTP).
**Avoids:** Pick’em/jackpot number drift across files; fake certification claims.
**Uses:** `zod@^4.6.5`.

### Phase 4: HOTLINE base math (5×4 / 40 lines / Wild / wallet)
**Rationale:** Table-stakes playable headless; establishes snapshot + event-stream pattern bonuses inherit.
**Delivers:** Strip sample, grid, PaylineEval, spin command, snapshot, Vitest seeded transcripts.
**Addresses:** Base spin loop; bet/balance; Wild reels 2–5.
**Avoids:** View-owned RNG; Megaways/cascades scope creep.

### Phase 5: Token → phone collectors
**Rationale:** Bonuses are orphan screens without diskette/phone pipeline; Core Value differentiator.
**Delivers:** MeterSystem ledger, token collect events, random trigger rolls, queue stub for multi-phone.
**Addresses:** Colored diskettes → three rotary phones.
**Avoids:** Meter-as-fill-gate; flight VFX deciding settlement.

### Phase 6: Feature modules + combo nights
**Rationale:** Green/Red/Purple depend on meters; combo nights need FeatureQueue from day one of features.
**Delivers:** FreeSpins (24 + wild masks), HoldAndWin (ledger + 3-respin rules), PickEm (lockers), FeatureQueue sequential run + FS nesting.
**Addresses:** Three bonuses + combo nights (P1 Core Value).
**Avoids:** FS boolean soup; H&W locked contamination; parallel bonus mutation; pick model honesty.

### Phase 7: VHS gamble
**Rationale:** Depends on clear win-present / pot handoff after line (and locked gamble-eligibility policy).
**Delivers:** SURVIVE/DIE ×10, gamble pot, Collect, control lock, enablement tests.
**Addresses:** Themed risk game.
**Avoids:** Double-credit; spin during gamble; unbounded rounds.

### Phase 8: HOTLINE view + HUD + presentation
**Rationale:** View consumes stable snapshots; art drops last; custom reels + Howler SFX.
**Delivers:** Reels/CRT/phones/token flights, DOM HUD, Retro Computer, rooftop scene, `mountHotlineSession`, Howler `AudioPort` adapter.
**Addresses:** Hotline Miami polish; spin/bet HUD; playable mobile/desktop.
**Avoids:** Invented final art; Text thrash on hot counters (prefer BitmapText/DOM); unbounded flight particles.
**Uses:** Howler, Pixi Assets/fonts, first-party reel view.

### Phase 9: Polish + portfolio seams
**Rationale:** After both games mount cleanly.
**Delivers:** Paytable/rules overlay; deep-link `?game=`; code-split chunks; switch QA checklist (Crash↔menu↔HOTLINE×5); anti-AI voice pass.
**Addresses:** P2 paytable; shared mute edges; demo framing.
**Avoids:** Shipping placeholders as final; AI-fingerprint copy.

### Phase Ordering Rationale

- Shell + Crash adapter first: lifecycle and Crash integrity are prerequisites for any second game
- Config → base math → meters → features → gamble → view: matches Features dependency graph and Architecture build order
- FeatureQueue early in feature work: combo nights are Core Value, not a late bolt-on
- View after logic: prevents dual math and untestable animation-first design
- One Application from Phase 1: avoids the hardest recovery path (GPU pool corruption)

### Research Flags

Phases likely needing deeper research during planning (`/gsd-plan-phase --research`):
- **Phase 5 (meters/triggers):** Exact Witch Pots trigger probabilities and meter reset-after-bonus rules — marketing sources disagree; lock in JSON during phase research
- **Phase 6 (Hold & Win / Pick’em / combo):** Public refs disagree on pick grid size (16 vs 20) and jackpot multipliers (500× vs 1000×) — lock mechanics from Endorphina news + PROJECT; prizes illustrative
- **Phase 8 (view/audio):** Asset pack inventory unknown until user drops files; spritesheet vs loose PNGs decision at art handoff

Phases with standard patterns (skip deep research-phase):
- **Phase 1–2 (shell + Crash adapter):** Brownfield patterns already proven in-repo
- **Phase 3–4 (Zod config + base paylines):** Well-documented Zod + Crash logic/view/hud analog
- **Phase 7 (gamble):** Classic risk-game UX; lock eligibility rule once, then implement
- **Phase 9 (polish):** Checklist-driven; no novel architecture

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Pinned to brownfield + npm registry; MEDIUM only on reel/audio library tradeoffs (resolved: custom reels + Howler) |
| Features | MEDIUM | Official Endorphina pages + PROJECT locks; marketing prize/grid variance on secondary sites |
| Architecture | HIGH | Crash patterns verified in-repo; MEDIUM on multi-app lifecycle — resolved here toward long-lived Application |
| Pitfalls | MEDIUM | Pixi #11694 + industry H&W/FSM sources; brownfield lifecycle evidence HIGH |

**Overall confidence:** MEDIUM–HIGH — enough to roadmap; lock Witch Pots numeric tables and art inventory during feature phases.

### Gaps to Address

- **Application ownership detail:** Shell-owned Application API (who calls `init`, where canvas host lives) — decide in Phase 1 plan; recommendation is clear (long-lived + scene swap)
- **Shared vs per-game wallet:** Architecture says per-game demo balances; Features leaves optional shared — **recommend per-game labeled balances** for v1
- **Gamble eligibility:** Line wins only vs bonus totals — lock in Phase 7 config/rules (Endorphina Classic Risk is typically line-win flavored)
- **Pick’em model:** True-pick vs presentational pick — lock in Phase 6 JSON + UX reveal rules
- **Art pack:** User generates; agent requests lists — block final presentation on asset handoff, not on logic phases
- **pixi.js 8.22 bump:** Defer until HOTLINE green + visual regression check

## Sources

### Primary (HIGH confidence)
- In-repo Crash: `src/main.ts`, `src/games/crash/**`, `src/shared/{audio,boot,money,rng}` — patterns, lifecycle risks
- `.planning/PROJECT.md` — HOTLINE skin locks, v1 exclusions, Core Value
- npm registry — `pixi.js@8.21.0`, `zod@4.6.5`, `howler@2.2.4`, `pixi-reels` peers (rejected)

### Secondary (MEDIUM confidence)
- [PixiJS v8 Assets / GC docs](https://pixijs.com/8.x/guides/concepts/garbage-collection) — fonts, destroy, TextureGC
- [pixijs#11694](https://github.com/pixijs/pixijs/issues/11694) — Application destroy / TexturePool
- Endorphina [3 Witch Pots](https://endorphina.com/games/3-witch-pots) + [official news](https://endorphina.com/news/3-witch-pots-endorphinas-multi-bonus-halloween-special) — 5×4, 40 lines, triad bonuses, risk ×10
- [Zod v4](https://zod.dev/v4) — parse + JSON Schema
- Hold & Win / slot FSM industry notes — ledger vs free cells, skip ≠ skip ledger

### Tertiary (LOW confidence)
- Third-party Witch Pots reviews (grid size / multipliers) — validate against official news + lock in JSON
- Aggregator lobby demos — deliberately not copied (lean menu instead)

---
*Research completed: 2026-10-09*
*Ready for roadmap: yes*
