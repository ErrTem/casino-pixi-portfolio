# Phase 1: GameLogic Core - Research

**Researched:** 2026-09-26
**Domain:** Pure TypeScript Crash round FSM, wallet, seeded RNG, settlement, Vitest (no Pixi)
**Confidence:** HIGH (architecture / pitfalls / locked CONTEXT); MEDIUM (exact crash-distribution constants — demo-tuned, not certified RTP)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Demo wallet economy
- **D-01:** Starting demo balance is **5,000** (session-local; no persistence in this phase).
- **D-02:** Minimum bet is **10**; maximum bet is **1,000**, and never above current balance.
- **D-03:** When balance is below min bet, GameLogic **hard-stops** (rejects place-bet). No auto top-up.
- **D-04:** Expose **`resetWallet()`** (restore to starting balance) for Phase 2+ HUD to call — logic only; no UI here. — **Reversibility:** costly — callers and tests will depend on the reset contract once HUD wires it.

#### Crash distribution feel
- **D-05:** Outcome mix is **balanced Crash** (frequent early exits + occasional mid/high flyers, Aviator-ish demo feel). Exact sampling formula is for research/planning; target feel is locked.
- **D-06:** `crashAt` floor is **1.01×** (no instant 1.00× busts — every round has a tiny climb).
- **D-07:** Hard cap on `crashAt` is **~100×**.
- **D-08:** Mild house edge **~3–5%** in the crash sampling model (demo RNG, not provably fair / certified). — **Reversibility:** costly — settlement tests and perceived fairness tune against this edge once wired.

#### Multiplier climb pace
- **D-09:** Standard Crash tempo: about **2× in ~2–3 seconds** of flight time.
- **D-10:** Curve shape is **smooth exponential** (classic Crash acceleration).
- **D-11:** Multiplier display/settlement precision is **2 decimal places** (`1.00×`, `2.37×`).
- **D-12:** Climb rate lives as **named tunable constant(s)** in a small config object (not buried magic numbers).

#### Post-round settle beat / round cadence
- **D-13:** After a round ends, enter a **5 second waiting window** with betting open. — **Reversibility:** costly — HUD/Pixi and Phase 5 countdown will assume this cadence.
- **D-14:** When the 5s window hits zero, the round **auto-launches** whether or not a bet was placed (live online Crash style — continuous rounds). — **Reversibility:** one-way — changes PLAY-01 “manual start after bet” into continuous auto-start; HUD and tests must treat waiting as timed, not idle-until-click.
- **D-15:** **Spectator rounds** are first-class: no bet → still roll `crashAt`, fly, crash; **wallet unchanged**; crash point still recorded for history consumers. — **Reversibility:** costly — history buffer and phase machine must support bet-optional rounds.

#### Already locked by roadmap/research (CONTEXT Claude's Discretion notes)
- `resolveTick` order: **crash before auto cash-out**; idempotent settlement.

### Claude's Discretion
- Exact crash-sampling formula / seedrandom wiring that achieves D-05–D-08 (researcher picks; keep behind `Rng` interface per research).
- Exact exponential growth constant values that hit D-09 (named constants per D-12).
- Money representation internals (prefer fixed-point / integer cents for wallet to avoid float settle bugs — research PITFALLS); external API can still speak 2dp multipliers.
- Package layout under `games/crash/logic/` (or equivalent) and command/snapshot facade shapes — follow `.planning/research/ARCHITECTURE.md`.
- History ring-buffer size `N` (strip UI is Phase 2; buffer may exist in Phase 1 for D-15).
- Seed lifecycle for Phase 1 tests (per-round seed advancement); URL `?seed=` UI is Phase 5.

### Deferred Ideas (OUT OF SCOPE)
None new from discussion — stayed in Phase 1 domain. Already-roadmap deferred (not reopened here):
- Bet presets / history strip UI → Phase 2 (logic may still maintain history buffer for D-15)
- Pixi hybrid view → Phase 3
- Mobile → Phase 4
- Countdown chrome, SFX, `?seed=` UI, session stats, keyboard cash-out → Phase 5
- Dual bets / auto-bet consecutive / lobby → v2
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PLAY-01 | Player can start a round from waiting after placing a valid bet | **Reinterpreted by D-14:** waiting is a **timed 5s window**; rounds **auto-launch**. Place-bet remains optional before launch. Success = bet can be locked in waiting and flies with the auto-start (no separate “Start” command required). |
| PLAY-02 | Player sees a live rising multiplier while flying | Time-driven `multiplierAt(elapsedMs)` exponential curve; snapshot exposes live mult each `tick`. |
| PLAY-03 | Manual cash-out mid-flight → stake × current multiplier | `requestCashOut` intent → same `resolveTick` path; payout via fixed-point money helpers. |
| PLAY-04 | Crash at seeded `crashAt` if not cashed out | `crashAt` rolled once at round start; `resolveTick` crash-before-auto. |
| PLAY-05 | Return to waiting after cash-out/crash | Terminal → enter waiting with 5s timer (D-13); betting open again. |
| WALT-01 | Demo wallet start balance updates on win/loss | D-01 start 5000; settle only when bet was locked (D-15 spectator = no wallet change). |
| WALT-02 | Free-form bet within min/max vs balance | D-02 min 10 / max 1000 / ≤ balance; D-03 hard-stop when broke. |
| WALT-04 | Auto cash-out target multiplier | Evaluated inside `resolveTick` after crash check; rounded 2dp compare. |
| ARCH-01 | Seeded RNG → reproducible crash point | `seedrandom` behind `Rng`; same seed → same `crashAt`. |
| ARCH-02 | Pure TS GameLogic, no Pixi imports | Package under `src/games/crash/logic/` + `shared/`; CI grep / Vitest node env. |
| ARCH-04 | Vitest covers settlement, auto CO, wallet | Node Vitest suite; Wave 0 scaffold in Validation Architecture. |
</phase_requirements>

## Project Constraints (from `.claude/.cursor/rules`)

Actionable directives extracted this session from project rules (source: PROJECT.md + research/STACK.md embedded in rules):

- Stack lock: PixiJS v8 + TypeScript + Vite for the product — **Phase 1 must not import `pixi.js`**; Pixi shell is Phase 2+.
- No SPA framework in v1 (HTML + Pixi later); Phase 1 is headless logic only.
- Client-side only; no backend.
- Architecture: GameLogic (pure TS) separate from Pixi view — **enforce zero `pixi.js` / DOM in logic**.
- Keep phases small and shippable.
- Demo / portfolio framing; no real money; seeded demo RNG (not provably fair).
- Prefer `seedrandom` + Vitest for logic; ticker feeds logic in later phases — do not tween the multiplier.

## Summary

Phase 1 builds the **authoritative Crash engine** as pure TypeScript: continuous waiting→flying→settle cadence, demo wallet, seeded `crashAt` at round start, exponential time→multiplier, and a single `resolveTick` that settles manual cash-out, auto cash-out, and crash without float races. There is **no Vite/Pixi/HUD scaffold in this phase** — only `logic/`, `shared/` money/RNG helpers, and Vitest on Node. CONTEXT locks economy numbers, floor/cap/edge feel, 5s auto-launch (spectator rounds OK), and crash-before-auto ordering.

The standard approach for this genre is: sample `crashAt` once from a seeded U(0,1) with a mild house-edge transform; advance flight with clamped `deltaMS`; compare rounded multipliers in one resolver; store money as integer cents. That matches project ARCHITECTURE.md and PITFALLS.md and is what Phase 2/3 will bind to.

**Primary recommendation:** Scaffold a minimal Node+TS+Vitest package with `CrashGame` facade (`placeBet` / `setAutoCashOut` / `requestCashOut` / `tick(dt)` / `resetWallet` / `getSnapshot`), integer-cent wallet, Bustabit-style `(1-e)/U` crash sampler (floor 1.01, cap 100, e≈0.04), exponential climb `e^(r·t)` tuned so ~2× @ 2.5s, and Vitest proving seed replay + bet→settle + spectator no-op wallet — **before** any canvas work.

**Walking skeleton (MVP / SKELETON.md hint):** Thinnest E2E logic slice = config + cents helpers + `Rng` + `sampleCrashAt(seed)` + FSM that auto-starts after 5s → fly with synthetic `tick` → cash-out **or** crash → wallet + history. Defer polish (events bus richness, large history N tuning) until after that path is green.

## Architectural Responsibility Map

Single-tier application for Phase 1 — all capabilities reside in **Browser / Client (pure TS module, Node-testable)**. No API, SSR, CDN, or database.

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Round FSM + cadence timer | Browser / Client (logic) | — | Authoritative phase machine; later HUD/Pixi only observe |
| Demo wallet + bet validation | Browser / Client (logic) | — | Session-local cents; no persistence |
| Seeded crash sampling | Browser / Client (logic) | — | `crashAt` at round start; demo RNG |
| Multiplier curve | Browser / Client (logic) | — | Pure `f(elapsedMs)`; view will display only |
| Manual / auto cash-out + crash settle | Browser / Client (logic) | — | Single `resolveTick`; idempotent |
| History ring buffer | Browser / Client (logic) | Phase 2 HUD render | Logic owns buffer; UI later |
| Vitest coverage | Node test runner | — | Same pure modules; no canvas |
| Pixi / HTML / Vite shell | — | Phase 2–3 | Explicitly out of Phase 1 |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard | Provenance |
|---------|---------|---------|--------------|------------|
| **TypeScript** | `~5.8.3` (5.x line; do **not** use TS 6/7 in v1) | Typed GameLogic | Locked; avoids WebGPU typing friction when Pixi arrives | `[VERIFIED: npm registry]` `npm view typescript@5.8.3 version` → `5.8.3`; latest 5.x also `5.9.3` — prefer `~5.8.3` per STACK |
| **Vitest** | `3.2.7` (`^3.2.7`, **not** `latest` / v5) | Unit tests for pure logic | Vite-ecosystem; `environment: 'node'` | `[VERIFIED: npm registry]` dist-tag `V3` = `3.2.7` (published 2026-07-06); `latest` = `5.0.2` flagged SUS too-new |
| **Node.js** | 20+ LTS (env has v24.18.0) | Tooling / Vitest runtime | Required for npm + Vitest | `[VERIFIED: local]` `node --version` → `v24.18.0` |

### Supporting

| Library | Version | Purpose | When to Use | Provenance |
|---------|---------|---------|-------------|------------|
| **seedrandom** | `3.0.5` | Seeded PRNG for `crashAt` | Always in Phase 1; behind `Rng` interface | `[VERIFIED: npm registry]` `npm view seedrandom version` → `3.0.5` |
| **@types/seedrandom** | `3.0.8` | TS types | With seedrandom | `[VERIFIED: npm registry]` `npm view @types/seedrandom version` → `3.0.8` |

### Explicitly NOT in Phase 1

| Package | Why deferred |
|---------|----------------|
| `pixi.js` | Phase 3 (+ shell Phase 2); ARCH-02 forbids in logic |
| `vite` | Phase 2 composition root |
| `howler` / `gsap` | Phase 5 polish |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| seedrandom | Hand-rolled Mulberry32 | Zero dep; less clear “seeded demo RNG” story in README — only if seedrandom blocked |
| Vitest 3.2.x | Vitest 5.x (`latest`) | Newer API; legitimacy gate flagged `latest` as too-new — stay on 3.x |
| Integer cents | Float dollars | Float causes settlement/display bugs (PITFALLS) — do not |
| Continuous auto-start FSM | Classic place-bet-then-start | Locked out by D-14 |

**Installation (Phase 1 only):**

```bash
npm init -y
npm install seedrandom
npm install -D typescript@~5.8.3 vitest@3.2.7 @types/seedrandom @types/node
```

Add scripts: `"test": "vitest run"`, `"test:watch": "vitest"`.

**Version verification (this session):**

| Package | Command result |
|---------|----------------|
| seedrandom | `3.0.5` |
| vitest (V3 tag) | `3.2.7` |
| vitest (latest) | `5.0.2` — **do not install as unpinned latest** |
| typescript@5.8.3 | `5.8.3` |
| @types/seedrandom | `3.0.8` |

## Package Legitimacy Audit

| Package | Registry | Age / published | Downloads (wk) | Source Repo | Verdict | Disposition |
|---------|----------|-----------------|----------------|-------------|---------|-------------|
| seedrandom | npm | since 2019-09-17 | ~10.3M | github.com/davidbau/seedrandom | OK | Approved |
| vitest@3.2.7 | npm | 2026-07-06 | (project ~116M for name) | github.com/vitest-dev/vitest | OK* | Approved — pin `3.2.7` / `^3.2.7` |
| vitest@5.0.2 (`latest`) | npm | 2026-09-25 | ~116M | github.com/vitest-dev/vitest | SUS (too-new) | **REMOVED from recommend** — do not use unpinned `vitest@latest` |
| typescript | npm | mature | ~271M | github.com/microsoft/TypeScript | OK | Approved (`~5.8.3`) |
| @types/seedrandom | npm | 2023-11-07 | ~3.4M | DefinitelyTyped | OK | Approved |

\*Legitimacy seam rates bare `vitest` against `latest` (5.0.2 → SUS). Pinning the mature **3.2.7** release avoids the too-new signal while matching STACK’s Vitest ^3 recommendation.

**Packages removed due to [SLOP] verdict:** none  
**Packages flagged as suspicious [SUS]:** `vitest@latest` (5.0.2) — planner must install `vitest@3.2.7` explicitly, not unpinned latest.

**Postinstall scripts:** none observed for seedrandom / vitest (`npm view … scripts.postinstall` empty).

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  Caller (Vitest now / HUD+ticker later)                     │
│    commands: placeBet, setAutoCashOut, requestCashOut,      │
│              resetWallet, tick(deltaMs)                     │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  CrashGame facade                                           │
│    snapshot + events out                                    │
└───────┬──────────────┬──────────────┬───────────────────────┘
        │              │              │
        ▼              ▼              ▼
   RoundFSM        Wallet          CrashRng
   waiting ──►     cents           seed → U → crashAt
   flying ──►      lock/settle     (once per round)
   settle ──►
        │
        ▼
   resolveTick(state, dt)
     1. advance timers / elapsed
     2. if flying: m = curve(elapsed)
     3. if m >= crashAt → CRASH (settle loss if bet)
     4. else if auto && m >= target → CASH_OUT (settle win if bet)
     5. else if cashOutRequested → CASH_OUT
     6. if waiting timer ≤ 0 → startRound (bet optional)
        │
        ▼
   History ring (push crashAt every completed round)
```

### Recommended Project Structure (Phase 1 only)

Greenfield — **no** `main.ts`, Vite, Pixi, or HUD yet:

```
src/
├── games/
│   └── crash/
│       └── logic/                 # PURE TS — no pixi.js, no DOM
│           ├── CrashGame.ts       # Facade: commands + getSnapshot/subscribe
│           ├── RoundState.ts      # Phase types + transitions
│           ├── Wallet.ts          # cents balance, placeBet, settle, reset
│           ├── CrashRng.ts        # Rng adapter + sampleCrashAt
│           ├── MultiplierCurve.ts # time → multiplier (named constants)
│           ├── resolveTick.ts     # single authority: crash > auto > manual
│           ├── History.ts         # ring buffer last N crashAts
│           ├── config.ts          # WAIT_MS, edge, floor, cap, growth, N
│           └── index.ts           # public exports
├── shared/
│   ├── money/
│   │   └── cents.ts               # toCents, fromCents, payout(stake, mult)
│   └── rng/
│       └── createRng.ts           # seedrandom behind Rng interface
└── (no view/, no hud/, no app/ yet)

tests/   # or colocated *.test.ts under logic/
├── wallet.test.ts
├── crashRng.test.ts
├── resolveTick.test.ts
├── roundCadence.test.ts
└── architecture.no-pixi.test.ts

vitest.config.ts
tsconfig.json
package.json
```

Aligns with [VERIFIED: `.planning/research/ARCHITECTURE.md` Recommended Project Structure] folder seams; Phase 2 adds `hud/`, `app/`, `main.ts`; Phase 3 adds `view/`.

### Pattern 1: Continuous auto-start FSM (locked)

**What:** Phase `waiting` always runs a countdown (`WAIT_MS = 5000`). On expiry, `startRound()` always fires: roll `crashAt`, enter `flying`, even if `pendingBet === null` (spectator).  
**When to use:** Always (D-13–D-15).  
**Do not:** Idle until a “Start” click; do not require a bet to launch.

### Pattern 2: Command / snapshot facade

**What:** External callers only use `CrashGame` methods; internals mutate via `resolveTick`. Snapshot includes `phase`, `multiplier`, `balance`, `bet`, `crashAt` (optional hide until crash for UX later — for tests expose), `waitRemainingMs`, `autoCashOutAt`, `history`.  
**When to use:** Always — Phase 2 HUD binds here.

### Pattern 3: Crash-at-start + time curve

**What:** At `startRound`, `crashAt = sampleCrashAt(rng)`. While flying, `elapsedMs += clamp(dt)`; `m = round2(exp(GROWTH * elapsedMs))`. Never re-roll mid-flight.  
**When to use:** Always (ARCH-01, PITFALLS).

### Pattern 4: Single `resolveTick` settlement authority

**What:** Ordered rules — terminal no-op → crash → auto CO → manual CO intent → continue; wallet mutates once per `roundId`.  
**When to use:** Always (CONTEXT + PITFALLS).

### Anti-Patterns to Avoid

- **Manual “Start round” as the only launch path** — contradicts D-14.
- **Float wallet / float `===` on multipliers** — settlement bugs.
- **Separate auto-CO and crash handlers** — double settle.
- **`import 'pixi.js'` or DOM in `logic/`** — breaks ARCH-02 / ARCH-04.
- **Rolling crash on cash-out or animation end** — breaks reproducibility.
- **Auto top-up when broke** — contradicts D-03; only `resetWallet()`.
- **Skipping history on spectator rounds** — contradicts D-15.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Seeded PRNG | Custom LCG “good enough” without tests | `seedrandom` behind `Rng` | Known API; portfolio clarity; swap later |
| Test runner | Ad-hoc `assert` scripts | Vitest 3.2.x node env | Watch mode, suite structure, Vite-ready |
| Money rounding | Ad-hoc `toFixed` sprinkled | Shared `cents.ts` + mult hundredths | One path for wallet, history, payout |
| Crash distribution | Opaque magic `Math.random()*100` | Documented `(1-e)/U` + floor/cap | Tunable edge; testable CDF feel |
| Phase flags | Booleans `isFlying && hasBet` | Explicit phase enum + illegal command no-ops | Prevents double-bet / ghost cash-out |

**Key insight:** The expensive bugs in Crash demos are timing ownership and settlement races — not missing libraries. Spend design budget on `resolveTick` + cents, not on framework.

## Common Pitfalls

### Pitfall 1: Treating PLAY-01 as click-to-start
**What goes wrong:** Planner adds `startRound()` as a required HUD command and leaves waiting idle.  
**Why:** Naive reading of PLAY-01 without D-14.  
**How to avoid:** Waiting always ticks; auto-launch is the start path; place-bet only locks stake.  
**Warning signs:** Tests call `start()` after bet instead of advancing wait timer.

### Pitfall 2: Animation / uncapped dt owning outcomes
**What goes wrong:** Large `deltaMS` skips past auto CO into crash incorrectly ordered.  
**How to avoid:** Clamp dt (e.g. 50–100ms); optionally sub-step resolve; crash check uses rounded `m` after time advance.  
**Warning signs:** Flaky auto CO tests with large dt.

### Pitfall 3: Float settlement
**What goes wrong:** Balance shows `10.000000002`; auto at `2.00` misses.  
**How to avoid:** Integer cents + multiplier hundredths; one `roundMult` helper.  
**Warning signs:** Wallet assertions need `toBeCloseTo`.

### Pitfall 4: Auto vs crash same tick
**What goes wrong:** Pay and crash both fire.  
**How to avoid:** Crash before auto; table tests `target === crashAt`.  
**Warning signs:** Two balance deltas per `roundId`.

### Pitfall 5: Spectator wallet mutation
**What goes wrong:** Crash “loss” deducts without a bet.  
**How to avoid:** `hasLockedBet` gate on all settlements; still push `crashAt` to history.  
**Warning signs:** Balance changes on no-bet rounds.

### Pitfall 6: Logic package imports Pixi during “helpful” scaffold
**What goes wrong:** create-pixi pull into Phase 1.  
**How to avoid:** Phase 1 package.json has no `pixi.js`; architecture test greps imports.  
**Warning signs:** `pixi.js` in dependencies before Phase 2.

### Pitfall 7: Mid-flight or unseeded RNG
**What goes wrong:** Non-reproducible demos.  
**How to avoid:** `crashAt` only in `startRound` from seeded `Rng`.  
**Warning signs:** No seed on round record.

## Code Examples

Patterns below are **prescriptive recommendations** for the planner/implementer. Formula details tagged `[ASSUMED]` where not from an in-repo source file (greenfield).

### Config (named constants)

```typescript
// Recommended Phase 1 config — [ASSUMED] tuned to CONTEXT D-01..D-14
export const CRASH_CONFIG = {
  startingBalanceCents: 500_000, // 5000.00
  minBetCents: 1_000,            // 10.00
  maxBetCents: 100_000,          // 1000.00
  waitDurationMs: 5_000,
  houseEdge: 0.04,               // 4% within 3–5%
  crashFloor: 1.01,
  crashCap: 100,
  // 2x in 2.5s: ln(2)/2.5 per second → per ms:
  growthRatePerMs: Math.LN2 / 2500,
  multDecimals: 2,
  historySize: 20,
  maxDeltaMs: 100,
} as const;
```

### Fixed-point money + multiplier

```typescript
// shared/money/cents.ts — [ASSUMED] pattern from PITFALLS guidance
export type Cents = number; // integer
export type MultHundredths = number; // 200 = 2.00x

export function toMultHundredths(m: number): MultHundredths {
  return Math.round(m * 100);
}

export function fromMultHundredths(h: MultHundredths): number {
  return h / 100;
}

/** Payout in cents: stake * multiplier, floored to cent */
export function payoutCents(stakeCents: Cents, mult: MultHundredths): Cents {
  return Math.floor((stakeCents * mult) / 100);
}
```

### Crash sampling (house edge + floor + cap)

```typescript
// CrashRng — classic demo form of (1-e)/U  [ASSUMED] genre standard, not certified RTP
export interface Rng {
  next(): number; // U(0,1)
}

export function sampleCrashAt(
  rng: Rng,
  cfg: typeof CRASH_CONFIG,
): number {
  const u = Math.min(Math.max(rng.next(), Number.EPSILON), 1 - Number.EPSILON);
  const raw = (1 - cfg.houseEdge) / u;
  const clamped = Math.min(cfg.crashCap, Math.max(cfg.crashFloor, raw));
  return fromMultHundredths(toMultHundredths(clamped));
}
```

### Multiplier curve

```typescript
export function multiplierAt(elapsedMs: number, growthRatePerMs: number): number {
  const raw = Math.exp(growthRatePerMs * Math.max(0, elapsedMs));
  return fromMultHundredths(toMultHundredths(raw));
}
```

### resolveTick order

```typescript
// Pseudocode — [ASSUMED] encoding of locked CONTEXT + PITFALLS order
function resolveTick(state: RoundState, dt: number): RoundState {
  if (state.phase === "cashed_out" || state.phase === "crashed") {
    return enterWaiting(state); // or already waiting
  }
  if (state.phase === "waiting") {
    const wait = state.waitRemainingMs - clamp(dt);
    if (wait <= 0) return startRound(state); // bet optional
    return { ...state, waitRemainingMs: wait };
  }
  // flying
  const elapsed = state.elapsedMs + clamp(dt);
  const m = multiplierAt(elapsed, CRASH_CONFIG.growthRatePerMs);
  if (m >= state.crashAt) return settleCrash(state, state.crashAt);
  if (state.autoCashOutAt != null && m >= state.autoCashOutAt) {
    return settleCashOut(state, state.autoCashOutAt);
  }
  if (state.cashOutRequested) return settleCashOut(state, m);
  return { ...state, elapsedMs: elapsed, multiplier: m };
}
```

### seedrandom wiring

```typescript
import seedrandom from "seedrandom";

export function createRng(seed: string): Rng {
  const prng = seedrandom(seed);
  return { next: () => prng() };
}
```

### Vitest node config

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
  },
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Click-to-start after bet | Continuous 5s waiting auto-launch | CONTEXT D-14 (2026-09-26) | Tests/HUD must tick waiting |
| View-owned multiplier | Logic-owned time + seed | Project lock | Vitest without canvas |
| `Math.random` mid-flight | Seeded `crashAt` at start | ARCH-01 | Reproducible demos |
| Float wallet | Integer cents | PITFALLS | Stable settlement |
| Instant 1.00× busts | Floor 1.01× | D-06 | Always a tiny climb |

**Deprecated/outdated for this phase:**
- Provably fair commit-reveal — out of scope; label demo RNG only.
- Pixi-first scaffold before FSM — ARCHITECTURE anti-pattern.
- Vitest 5 unpinned latest — legitimacy too-new; use 3.2.x.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Crash sampler `(1 - houseEdge) / U` with clamp to [1.01, 100] yields “balanced” Aviator-ish feel at e=0.04 | Code Examples / Crash sampling | Feel too harsh/generous — tune e or resample policy; not a correctness blocker if tests lock the formula |
| A2 | Growth `LN2/2500` ms⁻¹ ≈ 2× in 2.5s | Config | Pace slightly off D-09 — retune named constant only |
| A3 | History ring size `N = 20` | Config / Discretion | Strip UX later — change constant freely |
| A4 | Payout uses `Math.floor` on cent product | Money helpers | Off-by-one cent vs banker's round — pick one and test; document |
| A5 | Phase model `waiting \| flying \| cashed_out \| crashed` with instant return to waiting on next tick OK | FSM | May want explicit settle beat — D-13 already uses waiting as the beat |
| A6 | Seed advancement = `seedrandom(baseSeed + ':' + roundId)` or consume one U per round from a long-lived RNG | Discretion | Replay UX in Phase 5 — keep round seed on snapshot |
| A7 | Clamp `maxDeltaMs = 100` sufficient | Pitfalls | Rare skip on auto CO — add sub-stepping if tests fail |

**If wrong:** Adjust constants only; do not change locked D-* decisions.

## Open Questions (RESOLVED)

1. **Expose `crashAt` in live snapshots during flight?**
   - What we know: Tests need it; commercial UIs often hide until crash.
   - Recommendation: Include in snapshot for Phase 1; HUD may omit display until Phase 2/5.
   - RESOLVED: Phase 1 snapshots expose `crashAt` (01-02 Walking Skeleton `getSnapshot`; HUD may hide display later).

2. **Settle beat vs immediate waiting?**
   - What we know: D-13 makes waiting the 5s open-bet window (no separate result-only beat).
   - Recommendation: On terminal, push history, settle once, set phase `waiting` with `waitRemainingMs = 5000` immediately (cashed_out/crashed can be event flags on the transition).
   - RESOLVED: Terminal settle enters `waiting` immediately with `waitRemainingMs = 5000` (01-02 resolveTick / D-13; cadence edges in 01-03).

3. **Should `placeBet` after auto-launch mid-flight be allowed?**
   - What we know: Commercial Crash usually locks bets before takeoff.
   - Recommendation: Reject place-bet unless `phase === 'waiting'`; locked bet clears after settle.
   - RESOLVED: `placeBet` only succeeds when `phase === 'waiting'` (01-02 facade gate; flying reject asserted in 01-03).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vitest / npm | ✓ | v24.18.0 | Node 20 LTS also OK |
| npm | Install deps | ✓ | 11.16.0 | — |
| seedrandom (registry) | ARCH-01 | ✓ | 3.0.5 | Mulberry32 hand-roll only if install blocked |
| vitest 3.2.7 (registry) | ARCH-04 | ✓ | 3.2.7 | — |
| pixi.js | — | n/a | — | **Must not install in Phase 1** |
| Graphify graph | Research enrichment | ✗ | — | Skipped — no `.planning/graphs/graph.json` |

**Missing dependencies with no fallback:** none for Phase 1  
**Missing dependencies with fallback:** none blocking

Step 2.6: External deps identified and probed (Node/npm). Registry packages verified via `npm view`.

## Validation Architecture

> `workflow.nyquist_validation` is `true` in `.planning/config.json` — section required.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest **3.2.7** (pin; not unpinned latest) |
| Config file | `vitest.config.ts` — **Wave 0** (does not exist yet) |
| Quick run command | `npx vitest run src/games/crash/logic` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PLAY-01 | Bet locked in waiting flies on auto-launch after 5s | unit | `npx vitest run tests/roundCadence.test.ts` | ❌ Wave 0 |
| PLAY-02 | Multiplier rises with elapsed Ms (exponential) | unit | `npx vitest run tests/multiplierCurve.test.ts` | ❌ Wave 0 |
| PLAY-03 | Manual cash-out pays stake × rounded mult | unit | `npx vitest run tests/resolveTick.test.ts -t "manual cash-out"` | ❌ Wave 0 |
| PLAY-04 | Reaches crashAt → crashed; loss if bet locked | unit | `npx vitest run tests/resolveTick.test.ts -t "crash"` | ❌ Wave 0 |
| PLAY-05 | After terminal → waiting with ~5000ms remaining | unit | `npx vitest run tests/roundCadence.test.ts -t "returns to waiting"` | ❌ Wave 0 |
| WALT-01 | Start 5000; win/loss updates cents | unit | `npx vitest run tests/wallet.test.ts` | ❌ Wave 0 |
| WALT-02 | Reject bet &lt;10, &gt;1000, &gt;balance; hard-stop broke | unit | `npx vitest run tests/wallet.test.ts -t "validation"` | ❌ Wave 0 |
| WALT-04 | Auto CO at target; crash wins if target ≥ crashAt | unit | `npx vitest run tests/resolveTick.test.ts -t "auto"` | ❌ Wave 0 |
| ARCH-01 | Same seed → same crashAt | unit | `npx vitest run tests/crashRng.test.ts` | ❌ Wave 0 |
| ARCH-02 | No pixi/DOM imports under logic | unit | `npx vitest run tests/architecture.no-pixi.test.ts` | ❌ Wave 0 |
| ARCH-04 | Suite covers settlement / auto / wallet | unit | `npx vitest run` | ❌ Wave 0 |
| D-15 | Spectator: history gains crashAt; balance unchanged | unit | `npx vitest run tests/roundCadence.test.ts -t "spectator"` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npx vitest run src/games/crash/logic`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `package.json` + `tsconfig.json` + `vitest.config.ts` (`environment: 'node'`)
- [ ] `npm install` deps listed in Standard Stack (pin vitest@3.2.7)
- [ ] `src/shared/money/cents.ts` + tests
- [ ] `src/shared/rng/createRng.ts` + `tests/crashRng.test.ts`
- [ ] `src/games/crash/logic/*` facade + FSM + `tests/resolveTick.test.ts`
- [ ] `tests/roundCadence.test.ts` (5s auto-launch + spectator)
- [ ] `tests/wallet.test.ts` (D-01..D-04)
- [ ] `tests/architecture.no-pixi.test.ts` (grep/read sources for `pixi.js` / `document` / `window`)
- [ ] Framework install: `npm install -D typescript@~5.8.3 vitest@3.2.7 @types/seedrandom @types/node && npm install seedrandom`

### Walking Skeleton Test (prove E2E logic)

Minimum green path before expanding tables:

1. `createGame({ seed: "demo-1" })`
2. `placeBet(100)` while waiting
3. `tick(5000)` → flying; assert `crashAt` stable
4. `tick` until near target → `requestCashOut` **or** tick past crash
5. Assert balance + history; repeat with no bet → balance unchanged

## Security Domain

> `security_enforcement: true`, ASVS level 1 in `.planning/config.json`.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No accounts in v1 |
| V3 Session Management | no | Session-local wallet only; no auth cookies |
| V4 Access Control | no | Single-player local process |
| V5 Input Validation | yes | Bet min/max/balance checks in Wallet; coerce finite numbers; reject NaN/Infinity |
| V6 Cryptography | partial | Use `seedrandom` for **demo** RNG only — do **not** claim cryptographic fairness; no hand-rolled crypto |

### Known Threat Patterns for client-only Crash demo

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Treating demo wallet as real funds | Elevation / Spoofing (optics) | README + later UI: demo only; no deposit language |
| Seed injection / tampering for “fairness” theater | Tampering | Document demo RNG; Phase 5 `?seed=` is replay, not proof |
| NaN bet → corrupt balance | Tampering | Validate finite, integer cents at command boundary |
| Logic in view bypassing settle | Tampering | ARCH-02 boundary; tests without Pixi |
| Supply-chain (bad npm pin) | Tampering | Legitimacy audit; pin vitest 3.2.7; no postinstall scripts |

**Phase 1 note:** Threat model is shallow (local demo). Highest practical risk is **false fairness claims** and **corrupt numeric input** — address in copy and validation, not server auth.

## Sources

### Primary (HIGH confidence)
- `.planning/phases/01-gamelogic-core/01-CONTEXT.md` — locked D-01..D-15 `[VERIFIED: read this session]`
- `.planning/REQUIREMENTS.md` — PLAY/WALT/ARCH IDs `[VERIFIED: read this session]`
- `.planning/ROADMAP.md` — Phase 1 goal, plans 01-01..01-05 `[VERIFIED: read this session]`
- `.planning/research/ARCHITECTURE.md` — folder seams, facade, tick authority `[VERIFIED: read this session]`
- `.planning/research/STACK.md` — seedrandom + Vitest + no Pixi in logic `[VERIFIED: read this session]`
- `.planning/research/PITFALLS.md` — float/race/timing pitfalls `[VERIFIED: read this session]`
- `.planning/research/SUMMARY.md` — Phase 1 research flags `[VERIFIED: read this session]`
- `.planning/research/FEATURES.md` — table stakes vs deferred `[VERIFIED: read this session]`
- `npm view` + `gsd-tools query package-legitimacy check` — package versions/verdicts `[VERIFIED: npm registry]`
- Local `node --version` / `npm --version` `[VERIFIED: local]`

### Secondary (MEDIUM confidence)
- Project STACK preference for Vitest ^3 vs registry `latest` 5.x — resolved by pinning 3.2.7
- Genre Crash sampling `(1-e)/U` — industry-common demo form `[ASSUMED]` (not certified; no live scrapes this session — WebFetch/WebSearch unavailable to agent)

### Tertiary (LOW confidence)
- Exact house-edge “feel” at e=0.04 after floor/cap clamp — tune during implementation tests `[ASSUMED]`

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** — registry-verified pins; Pixi correctly excluded
- Architecture: **HIGH** — aligns CONTEXT + ARCHITECTURE.md + continuous cadence
- Pitfalls: **HIGH** — mapped from PITFALLS.md + D-14/D-15 specifics
- Crash formula constants: **MEDIUM** — recommended values are discretionary/demo-tuned

**Research date:** 2026-09-26  
**Valid until:** ~2026-10-26 (stack pins); re-check vitest major if planning slips past Vitest 5 stabilization

**Commit note:** `commit_docs: true` — orchestrator/researcher should commit this file via `gsd-tools query commit` when available.
