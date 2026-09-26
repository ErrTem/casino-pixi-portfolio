# Phase 1: GameLogic Core - Pattern Map

**Mapped:** 2026-09-26
**Files analyzed:** 20
**Analogs found:** 0 / 20

## Greenfield Status

This repository has **no application source yet** (`src/` absent; zero `*.ts` / `*.js` / `*.tsx` / `*.jsx` tracked or untracked in the project root). Existing artifacts are planning docs (`/.planning/**`), `README.md`, `.gitignore`, and IDE metadata only.

**Closest-analog search result:** ABSENT for every Phase 1 deliverable. Do **not** invent fictional `src/` excerpts. Planner and executor must **establish** conventions from:

| Authority | Use for |
|-----------|---------|
| `.planning/phases/01-gamelogic-core/01-RESEARCH.md` → Architecture Patterns + Code Examples | Exact module shapes, `resolveTick` order, money/RNG snippets, Vitest node config |
| `.planning/research/ARCHITECTURE.md` → Recommended Project Structure + Pattern 1–4 | Folder seams (`games/crash/logic/`, `shared/`), command/snapshot facade, ticker→`tick(dt)` later |
| `.planning/phases/01-gamelogic-core/01-CONTEXT.md` → D-01..D-15 | Locked numbers/cadence (wallet, floor/cap, 5s auto-launch, spectator) |
| `.planning/research/PITFALLS.md` | Anti-patterns to encode as tests (float settle, crash-before-auto, no Pixi in logic) |

Match quality column below uses `none` everywhere. Research-prescribed excerpts are labeled **[ESTABLISH]** (not existing codebase analogs).

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `package.json` | config | batch | — (ABSENT) | none |
| `tsconfig.json` | config | batch | — (ABSENT) | none |
| `vitest.config.ts` | config | batch | — (ABSENT) | none |
| `src/shared/money/cents.ts` | utility | transform | — (ABSENT) | none |
| `src/shared/rng/createRng.ts` | utility | transform | — (ABSENT) | none |
| `src/games/crash/logic/config.ts` | config | transform | — (ABSENT) | none |
| `src/games/crash/logic/RoundState.ts` | model | transform | — (ABSENT) | none |
| `src/games/crash/logic/Wallet.ts` | service | CRUD | — (ABSENT) | none |
| `src/games/crash/logic/CrashRng.ts` | utility | transform | — (ABSENT) | none |
| `src/games/crash/logic/MultiplierCurve.ts` | utility | transform | — (ABSENT) | none |
| `src/games/crash/logic/History.ts` | store | CRUD | — (ABSENT) | none |
| `src/games/crash/logic/resolveTick.ts` | service | event-driven | — (ABSENT) | none |
| `src/games/crash/logic/CrashGame.ts` | store | request-response | — (ABSENT) | none |
| `src/games/crash/logic/index.ts` | utility | request-response | — (ABSENT) | none |
| `tests/wallet.test.ts` | test | request-response | — (ABSENT) | none |
| `tests/crashRng.test.ts` | test | transform | — (ABSENT) | none |
| `tests/resolveTick.test.ts` | test | event-driven | — (ABSENT) | none |
| `tests/roundCadence.test.ts` | test | event-driven | — (ABSENT) | none |
| `tests/multiplierCurve.test.ts` | test | transform | — (ABSENT) | none |
| `tests/architecture.no-pixi.test.ts` | test | batch | — (ABSENT) | none |

**Out of Phase 1 (do not create now):** `src/main.ts`, `src/app/**`, `src/games/crash/view/**`, `src/games/crash/hud/**`, `pixi.js`, Vite shell — deferred per RESEARCH + ARCHITECTURE build order.

**Note vs ARCHITECTURE.md:** research lists optional `AutoCashOut.ts`; Phase 1 RESEARCH folds auto cash-out into `resolveTick` — prefer the RESEARCH file list (no separate `AutoCashOut.ts` unless planner splits for clarity). Prefer `shared/money/cents.ts` over ARCHITECTURE’s `shared/types/money.ts` naming.

## Pattern Assignments

### Scaffold: `package.json` / `tsconfig.json` / `vitest.config.ts` (config, batch)

**Analog:** ABSENT — **[ESTABLISH]** from `01-RESEARCH.md` Standard Stack + Vitest node config.

**Core pattern** (install pins + scripts):
```bash
npm init -y
npm install seedrandom
npm install -D typescript@~5.8.3 vitest@3.2.7 @types/seedrandom @types/node
# scripts: "test": "vitest run", "test:watch": "vitest"
# Do NOT add pixi.js or vite in Phase 1
```

**Vitest environment** — research Code Examples (`01-RESEARCH.md`):
```typescript
import { describe, it, expect } from "vitest"; // node env
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
  },
});
```

**Apply:** Wave 0 before any logic modules. Pin Vitest `3.2.7` (not unpinned `latest` / v5).

---

### `src/shared/money/cents.ts` (utility, transform)

**Analog:** ABSENT — **[ESTABLISH]** from `01-RESEARCH.md` Code Examples (Fixed-point money) + PITFALLS float settlement.

**Core pattern:**
```typescript
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

**Validation / error handling:** Coerce finite numbers at command boundary (ASVS V5 in RESEARCH Security Domain); reject `NaN` / `Infinity` before wallet mutate. No try/catch framework — return typed reject results from Wallet.

**Testing:** Pair with `tests/wallet.test.ts` (payout + balance assertions use exact integer cents, never `toBeCloseTo`).

---

### `src/shared/rng/createRng.ts` (utility, transform)

**Analog:** ABSENT — **[ESTABLISH]** from RESEARCH seedrandom wiring + STACK `Rng` interface.

**Imports pattern:**
```typescript
import seedrandom from "seedrandom";
```

**Core pattern:**
```typescript
export interface Rng {
  next(): number; // U(0,1)
}

export function createRng(seed: string): Rng {
  const prng = seedrandom(seed);
  return { next: () => prng() };
}
```

**Anti-pattern:** Do not call `Math.random()` from logic; do not re-roll mid-flight (PITFALLS #2).

---

### `src/games/crash/logic/config.ts` (config, transform)

**Analog:** ABSENT — **[ESTABLISH]** from CONTEXT D-01..D-14 + RESEARCH named constants (D-12).

**Core pattern:**
```typescript
export const CRASH_CONFIG = {
  startingBalanceCents: 500_000, // 5000.00
  minBetCents: 1_000,            // 10.00
  maxBetCents: 100_000,          // 1000.00
  waitDurationMs: 5_000,
  houseEdge: 0.04,               // 4% within 3–5%
  crashFloor: 1.01,
  crashCap: 100,
  growthRatePerMs: Math.LN2 / 2500, // ~2× @ 2.5s
  multDecimals: 2,
  historySize: 20,
  maxDeltaMs: 100,
} as const;
```

**Apply:** Single source of truth; no buried magic numbers in FSM/settle code.

---

### `src/games/crash/logic/RoundState.ts` (model, transform)

**Analog:** ABSENT — **[ESTABLISH]** from ARCHITECTURE Pattern 1 + RESEARCH FSM phases.

**Core pattern** (types / phase enum):
```typescript
type Phase = "waiting" | "flying" | "cashed_out" | "crashed";

interface CrashSnapshot {
  phase: Phase;
  multiplier: number;
  balance: number;
  bet: number | null;
  history: number[];
  autoCashOutAt: number | null;
  // Phase 1 also: crashAt, waitRemainingMs, roundId/seed fields for tests
}
```

**Cadence (D-13–D-15):** `waiting` always has `waitRemainingMs`; expiry → `startRound` even if `pendingBet === null` (spectator). Prefer explicit phase enum over boolean flags (`isFlying && hasBet`) — RESEARCH Don't Hand-Roll.

---

### `src/games/crash/logic/Wallet.ts` (service, CRUD)

**Analog:** ABSENT — **[ESTABLISH]** from CONTEXT D-01..D-04 + RESEARCH wallet capability.

**Core pattern (contracts to implement):**
- Start balance `startingBalanceCents` (5000 display / 500_000 cents)
- `placeBet`: validate min 10 / max 1000 / ≤ balance; reject when broke (hard-stop, no auto top-up)
- Lock stake only in `waiting`; settle win/loss only if bet was locked
- Spectator rounds: no wallet mutation
- `resetWallet()` restores starting balance (logic API for Phase 2 HUD)

**Error handling:** Return structured reject (`{ ok: false, reason }`) rather than throwing for illegal bets; illegal commands are no-ops with reason for tests.

**Validation:** Finite integer cents only; clamp/reject non-integers at boundary.

---

### `src/games/crash/logic/CrashRng.ts` (utility, transform)

**Analog:** ABSENT — **[ESTABLISH]** from RESEARCH `sampleCrashAt` + ARCH-01.

**Core pattern:**
```typescript
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

**Lifecycle:** Call **once** in `startRound` only; store `crashAt` on round; never mid-flight.

---

### `src/games/crash/logic/MultiplierCurve.ts` (utility, transform)

**Analog:** ABSENT — **[ESTABLISH]** from RESEARCH multiplier curve + D-09..D-11.

**Core pattern:**
```typescript
export function multiplierAt(elapsedMs: number, growthRatePerMs: number): number {
  const raw = Math.exp(growthRatePerMs * Math.max(0, elapsedMs));
  return fromMultHundredths(toMultHundredths(raw));
}
```

**Rule:** Pure `f(elapsedMs)`; view (Phase 3) displays only — never owns the curve.

---

### `src/games/crash/logic/History.ts` (store, CRUD)

**Analog:** ABSENT — **[ESTABLISH]** from ARCHITECTURE History Store + D-15.

**Core pattern:** Ring buffer of last `N` (`historySize: 20`) crash multipliers. Push **every** completed round including spectator (wallet unchanged, history still records `crashAt`).

---

### `src/games/crash/logic/resolveTick.ts` (service, event-driven)

**Analog:** ABSENT — **[ESTABLISH]** from RESEARCH Pattern 4 + locked crash-before-auto order.

**Core pattern (pseudocode authority):**
```typescript
function resolveTick(state: RoundState, dt: number): RoundState {
  if (state.phase === "cashed_out" || state.phase === "crashed") {
    return enterWaiting(state);
  }
  if (state.phase === "waiting") {
    const wait = state.waitRemainingMs - clamp(dt);
    if (wait <= 0) return startRound(state); // bet optional
    return { ...state, waitRemainingMs: wait };
  }
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

**Ordering (locked):** clamp `dt` → advance → **crash before auto CO** → manual intent → continue. Idempotent settle once per `roundId`. Table-test `target === crashAt`.

---

### `src/games/crash/logic/CrashGame.ts` (store, request-response)

**Analog:** ABSENT — **[ESTABLISH]** from ARCHITECTURE Pattern 1 (Pure Logic + Thin Views) + RESEARCH facade.

**Command / snapshot facade:**
```typescript
// Commands in (Phase 1 API surface)
placeBet(amount)
setAutoCashOut(target | null)
requestCashOut()
resetWallet()
tick(deltaMs)
getSnapshot() / subscribe(listener)

// Snapshots + events out — HUD/Pixi later bind here only
```

**Data flow:** External callers never mutate wallet/RNG/phase except via these methods. Internals route through `resolveTick`. No `pixi.js` / DOM imports (ARCH-02).

**Architecture diagram (RESEARCH) — establish this seam:**
```
Caller → CrashGame facade → RoundFSM / Wallet / CrashRng
                          → resolveTick (single settlement authority)
                          → History ring
```

---

### `src/games/crash/logic/index.ts` (utility, request-response)

**Analog:** ABSENT — **[ESTABLISH]** public barrel exporting `CrashGame`, types, `CRASH_CONFIG` as needed for tests/future HUD. Keep barrels thin; no re-export of Pixi.

---

### Tests (test, various data flows)

**Analog:** ABSENT — **[ESTABLISH]** from RESEARCH Validation Architecture test map.

| File | Focus (req IDs) |
|------|-----------------|
| `tests/wallet.test.ts` | WALT-01/02; D-01..D-04; hard-stop / `resetWallet` |
| `tests/crashRng.test.ts` | ARCH-01 same seed → same `crashAt` |
| `tests/resolveTick.test.ts` | PLAY-03/04; WALT-04; crash-before-auto; idempotent settle |
| `tests/roundCadence.test.ts` | PLAY-01/05; D-13..D-15 auto-launch + spectator |
| `tests/multiplierCurve.test.ts` | PLAY-02 exponential rise / 2dp |
| `tests/architecture.no-pixi.test.ts` | ARCH-02 grep `pixi.js` / `document` / `window` under `logic/` |

**Walking skeleton (prove E2E logic first):**
1. `createGame({ seed: "demo-1" })`
2. `placeBet(100)` while waiting
3. `tick(5000)` → flying; assert `crashAt` stable
4. Tick to cash-out **or** past crash
5. Assert balance + history; repeat with no bet → balance unchanged

## Shared Patterns

### Pure GameLogic boundary (ARCH-02)
**Source:** ARCHITECTURE.md Pattern 1; CONTEXT code_context  
**Apply to:** All files under `src/games/crash/logic/**` and `src/shared/**`  
**Rule:** Zero `pixi.js` / DOM. Enforce with `tests/architecture.no-pixi.test.ts`. Phase 1 `package.json` must not list `pixi.js`.

### Command / snapshot facade
**Source:** ARCHITECTURE.md Pattern 1–2; RESEARCH Pattern 2  
**Apply to:** `CrashGame.ts`, future HUD/Pixi (Phase 2–3)  
**Rule:** Commands in / snapshots+events out. Views never settle wallet or roll RNG.

### Fixed-point money + rounded multipliers
**Source:** RESEARCH cents helpers; PITFALLS #3  
**Apply to:** `cents.ts`, `Wallet.ts`, `resolveTick.ts`, all settle paths  
**Rule:** Integer cents + mult hundredths; one `roundMult` path; no float `===`.

### Crash-at-start + time curve
**Source:** ARCHITECTURE Pattern 4; RESEARCH Pattern 3; PITFALLS #1–2  
**Apply to:** `CrashRng.ts`, `MultiplierCurve.ts`, `resolveTick.ts`  
**Rule:** Sample `crashAt` once at round start; advance with clamped `deltaMs`; never animation-owned timing.

### Continuous auto-start FSM (D-13–D-15)
**Source:** CONTEXT decisions; RESEARCH Pattern 1  
**Apply to:** `RoundState.ts`, `resolveTick.ts`, `roundCadence.test.ts`  
**Rule:** 5s waiting always ticks; auto-launch without bet (spectator); history still records crash.

### Single settlement authority
**Source:** RESEARCH Pattern 4; PITFALLS #4  
**Apply to:** `resolveTick.ts`, cash-out commands  
**Rule:** Crash > auto CO > manual; one wallet delta per `roundId`.

### Seeded demo RNG (not provably fair)
**Source:** STACK + RESEARCH Security Domain  
**Apply to:** `createRng.ts`, `CrashRng.ts`, README later  
**Rule:** `seedrandom` behind `Rng`; document demo-only — no fairness claims.

### Broke wallet = hard stop
**Source:** CONTEXT D-03/D-04  
**Apply to:** `Wallet.ts`, `CrashGame.placeBet`  
**Rule:** Reject place-bet when below min; only `resetWallet()` restores funds — no auto top-up.

## No Analog Found

All Phase 1 files have **no close match** in the codebase (greenfield). Planner must use RESEARCH.md / ARCHITECTURE.md patterns above instead of copying existing `src/` modules.

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `package.json` | config | batch | No package scaffold yet |
| `tsconfig.json` | config | batch | No TS project yet |
| `vitest.config.ts` | config | batch | No Vitest config yet |
| `src/shared/money/cents.ts` | utility | transform | No `src/` |
| `src/shared/rng/createRng.ts` | utility | transform | No `src/` |
| `src/games/crash/logic/config.ts` | config | transform | No `src/` |
| `src/games/crash/logic/RoundState.ts` | model | transform | No `src/` |
| `src/games/crash/logic/Wallet.ts` | service | CRUD | No `src/` |
| `src/games/crash/logic/CrashRng.ts` | utility | transform | No `src/` |
| `src/games/crash/logic/MultiplierCurve.ts` | utility | transform | No `src/` |
| `src/games/crash/logic/History.ts` | store | CRUD | No `src/` |
| `src/games/crash/logic/resolveTick.ts` | service | event-driven | No `src/` |
| `src/games/crash/logic/CrashGame.ts` | store | request-response | No `src/` |
| `src/games/crash/logic/index.ts` | utility | request-response | No `src/` |
| `tests/wallet.test.ts` | test | request-response | No tests yet |
| `tests/crashRng.test.ts` | test | transform | No tests yet |
| `tests/resolveTick.test.ts` | test | event-driven | No tests yet |
| `tests/roundCadence.test.ts` | test | event-driven | No tests yet |
| `tests/multiplierCurve.test.ts` | test | transform | No tests yet |
| `tests/architecture.no-pixi.test.ts` | test | batch | No tests yet |

## Metadata

**Analog search scope:** Project root (Glob `**/*.{ts,tsx,js,jsx}`); confirmed 0 source files. Planning docs under `.planning/` used as prescription only (not analogs).
**Files scanned:** 0 application sources; planning docs CONTEXT/RESEARCH/ARCHITECTURE/PITFALLS consulted for **[ESTABLISH]** patterns.
**Tracked-source gate:** N/A — no candidate analog paths under `src/`; nothing to `git ls-files` as an analog.
**Pattern extraction date:** 2026-09-26
)
