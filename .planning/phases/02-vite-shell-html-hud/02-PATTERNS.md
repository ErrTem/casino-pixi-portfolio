# Phase 2: Vite Shell + HTML HUD - Pattern Map

**Mapped:** 2026-09-26
**Files analyzed:** 18
**Analogs found:** 12 / 18

## Greenfield Status

Phase 1 **shipped** pure GameLogic under `src/games/crash/logic/` plus `src/shared/`, Vitest, and ARCH-02 gates. Phase 2 is **not** greenfield for the integration contract — HUD/shell consume the existing `createGame` facade.

**Absent (true greenfield this phase):** HTML layout, CSS chrome, Vite config, composition-root entry, rAF clock, and all `games/crash/hud/**` binders. No `index.html`, `src/main.ts`, `src/app/`, or `src/styles/` exist yet.

**Present (reuse / extend):** `createGame` / `CrashSnapshot` / `History` / `CRASH_CONFIG`, `package.json`, `tsconfig.json`, `vitest.config.ts`, `tests/architecture.no-pixi.test.ts`, logic unit tests (walking skeleton = play-loop analog).

| Authority | Use for |
|-----------|---------|
| Existing `src/games/crash/logic/*` | Command/snapshot API, history order, enablement inputs, money display units |
| `02-RESEARCH.md` → Architecture Patterns + Code Examples | index.html slots, CrashHud binder, rAF clock, enablement matrix, chips, history strip |
| `02-CONTEXT.md` → D-01..D-04 | Bottom bar / empty canvas slot / three-zone chrome |
| `.planning/research/ARCHITECTURE.md` | Folder seams (`main.ts`, `app/`, `games/crash/hud/`) |

Match quality: `exact` = same file to modify or 1:1 API consumer; `partial` = same shape/convention, different layer; `none` = establish from RESEARCH.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `package.json` | config | batch | `package.json` | exact |
| `tsconfig.json` | config | batch | `tsconfig.json` | exact |
| `vitest.config.ts` | config | batch | `vitest.config.ts` | exact (keep) |
| `vite.config.ts` | config | batch | `vitest.config.ts` | partial |
| `tsconfig.node.json` | config | batch | `tsconfig.json` | partial |
| `index.html` | view | batch | — (ABSENT) | none |
| `src/styles/hud.css` | view | batch | — (ABSENT) | none |
| `src/main.ts` | service | event-driven | `CrashGame.ts` `createGame` + `tests/walkingSkeleton.test.ts` | partial |
| `src/app/rafClock.ts` | utility | event-driven | `CrashGame.tick` + `CRASH_CONFIG.maxDeltaMs` | partial |
| `src/app/GameSession.ts` | store | event-driven | `CrashGame.ts` facade ownership | partial (optional) |
| `src/games/crash/hud/CrashHud.ts` | view | request-response | `CrashGame.ts` / `index.ts` public API | exact (consumer) |
| `src/games/crash/hud/enablement.ts` | utility | transform | `CrashGame.placeBet` gates + `RoundState` / `resolveTick` phases | partial |
| `src/games/crash/hud/chips.ts` | config | transform | `config.ts` `CRASH_CONFIG` min/max | partial |
| `src/games/crash/hud/historyStrip.ts` | view | transform | `History.ts` + `snapshot.history` | partial |
| `src/games/crash/hud/format.ts` | utility | transform | `src/shared/money/cents.ts` | partial |
| `tests/architecture.no-pixi.test.ts` | test | batch | `tests/architecture.no-pixi.test.ts` | exact |
| `src/games/crash/hud/enablement.test.ts` | test | transform | `tests/walkingSkeleton.test.ts` / `tests/wallet.test.ts` | partial |
| `src/games/crash/hud/chips.test.ts` | test | transform | `tests/wallet.test.ts` (min/max bounds) | partial |
| `src/games/crash/hud/historyStrip.test.ts` | test | transform | `tests/roundCadence.test.ts` history ring | partial |

**Logic package — consume, do not rewrite:** `src/games/crash/logic/**` (including `CrashGame.ts`, `RoundState.ts`, `History.ts`, `config.ts`, `index.ts`) are **integration analogs**, not Phase 2 deliverables to recreate.

**Out of Phase 2:** `pixi.js`, `src/games/crash/view/**`, `app/bootstrap.ts` Application.init, `?seed=`, mobile stacking, DEMO badge UI.

## Pattern Assignments

### Scaffold: `package.json` (config, batch) — MODIFY

**Analog:** `package.json` **[EXISTING]** — extend scripts + add `vite@^6.4.3`; do **not** add `pixi.js`.

**Core pattern (current):**
```json
{
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": { "seedrandom": "^3.0.5" },
  "devDependencies": {
    "typescript": "~5.8.3",
    "vitest": "^3.2.7"
  }
}
```

**Apply (from `02-RESEARCH.md`):**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "vite": "^6.4.3"
  }
}
```

**Validation:** After install, `tests/architecture.no-pixi.test.ts` package.json assertion **must** allow `vite` (still forbid `pixi.js` until Phase 3). Keep Vitest pin `3.2.7`.

---

### Scaffold: `tsconfig.json` / `tsconfig.node.json` (config, batch) — MODIFY / NEW

**Analog:** `tsconfig.json` **[EXISTING]** — currently Node-only (`lib: ["ES2022"]`, `types: ["node"]`, `moduleResolution: "NodeNext"`).

**Core pattern (current):**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "types": ["node"],
    "noEmit": true
  },
  "include": ["src/**/*.ts", "tests/**/*.ts", "vitest.config.ts"]
}
```

**Apply:** Add DOM lib for app/HUD (`"lib": ["ES2022", "DOM"]`) via split `tsconfig.app.json` **or** single tsconfig that still typechecks Vitest. Prefer keeping `.js` ESM import suffixes (logic already uses them; Vite resolves them). Optional `tsconfig.node.json` for `vite.config.ts` typing — mirror existing `strict` + `ES2022`.

**Anti-pattern:** Switching everything to `bundler` resolution without verifying `npx vitest run` still resolves `../src/.../*.js` imports.

---

### Scaffold: `vitest.config.ts` (config, batch) — KEEP

**Analog:** `vitest.config.ts` **[EXISTING — exact]**.

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
  },
});
```

**Apply:** Leave node env for logic + pure HUD helpers (`enablement`, chips constants, history class). Do not force jsdom globally; optional happy-dom only if a DOM binder test truly needs it.

---

### `vite.config.ts` (config, batch) — NEW

**Analog:** `vitest.config.ts` **[partial]** — same `defineConfig` habit; different tool.

**Establish from RESEARCH:**
```typescript
import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  publicDir: "public",
  server: { port: 5173 },
  build: { outDir: "dist", target: "es2022" },
});
```

**Anti-pattern:** `create-pixi` into non-empty repo (overwrites package/tsconfig).

---

### `index.html` (view, batch) — NEW

**Analog:** ABSENT — **[ESTABLISH]** from `02-RESEARCH.md` layout slots + CONTEXT D-01..D-04.

**Core pattern:**
```html
<div id="app" class="app-shell">
  <div id="game-canvas-host" class="canvas-host" aria-label="Game view">
    <p class="canvas-placeholder">Game view</p>
  </div>
  <footer id="hud-bar" class="hud-bar">
    <div class="hud-zone hud-zone--left" data-zone="balance">...</div>
    <div class="hud-zone hud-zone--center" data-zone="actions">...</div>
    <div class="hud-zone hud-zone--right" data-zone="chips-history">...</div>
  </footer>
</div>
<script type="module" src="/src/main.ts"></script>
```

**Apply:** Empty `#game-canvas-host` (quiet label only). Monetary controls only in `#hud-bar`. History inside right zone of bottom bar (D-02). No DEMO badge element.

---

### `src/styles/hud.css` (view, batch) — NEW

**Analog:** ABSENT — **[ESTABLISH]** from CONTEXT D-01..D-03 (top canvas / bottom three-zone chrome).

**Apply:** Flex column shell; canvas host `flex-grow`; hud-bar three zones (`balance | actions | chips+history`); history strip `overflow-x: auto` for ≤20 pills. No spectacle styling inside canvas host.

---

### `src/main.ts` (service, event-driven) — NEW

**Analog:** `createGame` usage in `tests/walkingSkeleton.test.ts` **[partial]** — same facade lifecycle; browser wires HUD + clock instead of assertions.

**Facade to call (EXISTING):**
```typescript
// src/games/crash/logic/CrashGame.ts
export function createGame(options: CreateGameOptions): CrashGame {
  // placeBet / requestCashOut / setAutoCashOut / tick / getSnapshot / resetWallet
}
```

**Walking-skeleton play loop (EXISTING test = behavioral analog):**
```typescript
const game = createGame({ seed: "demo-1" });
game.placeBet(100);
game.tick(5000); // → flying
game.requestCashOut();
game.tick(CRASH_CONFIG.maxDeltaMs);
// snapshot.phase === "waiting"; history + balance updated
```

**Composition root (ESTABLISH from RESEARCH):**
```typescript
const game = createGame({ seed: "portfolio-demo" });
const hud = mountCrashHud(document.querySelector("#hud-bar")!, game);
hud.render(game.getSnapshot());
const stopClock = startRafClock((deltaMs) => {
  game.tick(deltaMs);
  hud.render(game.getSnapshot());
});
```

**Rules:** No bet math / phase rules in `main.ts`. No Pixi `Application`. Seed hardcoded (URL `?seed=` is Phase 5).

---

### `src/app/rafClock.ts` (utility, event-driven) — NEW

**Analog:** `CrashGame.tick` sub-step clamp **[partial]** — logic already absorbs hitchy deltas.

**Existing clamp authority:**
```typescript
// CrashGame.tick — sub-steps at CRASH_CONFIG.maxDeltaMs (100)
tick(deltaMs: number): void {
  let remaining = Number.isFinite(deltaMs) ? Math.max(0, deltaMs) : 0;
  while (remaining > 0) {
    const step = Math.min(remaining, CRASH_CONFIG.maxDeltaMs);
    state = resolveTick(state, step, deps);
    remaining -= step;
  }
}
```

**Establish stoppable rAF:**
```typescript
export function startRafClock(onFrame: (deltaMs: number) => void): () => void {
  let raf = 0;
  let last = performance.now();
  const frame = (now: number) => {
    onFrame(now - last);
    last = now;
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
}
```

**Phase 3 handoff:** `stop()` then `app.ticker.add(({ deltaMS }) => { game.tick(deltaMS); hud.render(...) })`. Never run both clocks.

---

### `src/app/GameSession.ts` (store, event-driven) — OPTIONAL NEW

**Analog:** `CrashGame.ts` owns game instance **[partial]** — session can own `game + stopClock + hud` lifecycle for HMR teardown.

**Apply only if** planner wants a named owner; otherwise inline in `main.ts` is fine per RESEARCH.

---

### `src/games/crash/hud/CrashHud.ts` (view, request-response) — NEW

**Analog:** `CrashGame` / `index.ts` public API **[exact consumer]** — binder is the thin view prescribed by ARCHITECTURE Pattern 1.

**Import seam (EXISTING barrel):**
```typescript
// src/games/crash/logic/index.ts
export { CRASH_CONFIG } from "./config.js";
export { createGame } from "./CrashGame.js";
export type { CrashGame, CreateGameOptions, CrashSnapshot } from "./CrashGame.js";
```

**Command surface to wire (EXISTING):**
```typescript
export interface CrashGame {
  placeBet(amountDisplay: number): PlaceBetResult;
  requestCashOut(): void;
  setAutoCashOut(target: number | null): void;
  tick(deltaMs: number): void;
  getSnapshot(): CrashSnapshot;
  resetWallet(): void;
}
```

**Snapshot fields to render (EXISTING):**
```typescript
export interface CrashSnapshot {
  phase: Phase;
  multiplier: number;
  balance: number;
  bet: number | null;
  crashAt: number | null;
  waitRemainingMs: number;
  history: readonly number[];
  roundId: number;
  autoCashOutAt: number | null;
}
```

**Binder rules (ESTABLISH):**
- Events → facade commands only; `render(snap)` writes DOM from snapshot fields.
- Chips set bet **input** only — do not auto-`placeBet` (Pitfall 4).
- Surface `PlaceBetResult.reason` (`broke`, `not_waiting`, …) in status text; emphasize reset when `broke`.
- Prefer `textContent` / `createElement` for history (no `innerHTML` free text).
- Poll: no `subscribe()` on Phase 1 facade — rAF calls `getSnapshot()`.

**PlaceBetResult shape (EXISTING):**
```typescript
export type PlaceBetResult =
  | { ok: true }
  | { ok: false; reason: string };
// reasons include: not_waiting | bet_already_placed | invalid_amount |
// broke | below_min | above_max | insufficient_balance
```

---

### `src/games/crash/hud/enablement.ts` (utility, transform) — NEW

**Analog:** Facade gates in `CrashGame.placeBet` + durable phases from `resolveTick` **[partial]**.

**Existing placeBet gates:**
```typescript
if (state.phase !== "waiting") {
  return { ok: false, reason: "not_waiting" };
}
if (state.lockedBetCents != null) {
  return { ok: false, reason: "bet_already_placed" };
}
```

**Existing settle → waiting (terminal phases not durable UI):**
```typescript
// resolveTick.ts — settleOnce returns via enterWaiting;
// next tick also coerces cashed_out/crashed → waiting
if (state.phase === "cashed_out" || state.phase === "crashed") {
  return enterWaiting(state);
}
```

**Broke threshold (EXISTING config + wallet):**
```typescript
// CRASH_CONFIG.minBetCents = 1_000 → display min 10
if (this.balanceCents < CRASH_CONFIG.minBetCents) {
  return { ok: false, reason: "broke" };
}
```

**Establish pure matrix:**
```typescript
export function enablementFrom(snap: CrashSnapshot) {
  const waiting = snap.phase === "waiting";
  const flying = snap.phase === "flying";
  const broke = snap.balance < CRASH_CONFIG.minBetCents / 100;
  const hasBet = snap.bet != null;
  return {
    canPlaceBet: waiting && !hasBet && !broke,
    canEditBet: waiting && !hasBet && !broke,
    chipsEnabled: waiting && !hasBet && !broke,
    canCashOut: flying && hasBet,
    canEditAuto: true, // setAutoCashOut persists across rounds [VERIFIED: enterWaiting]
    showBroke: broke,
  };
}
```

**Apply:** Drive UI from `waiting` | `flying` primarily. `resetWallet` control always available (especially when `showBroke`). Auto CO editable anytime.

---

### `src/games/crash/hud/chips.ts` (config, transform) — NEW

**Analog:** `CRASH_CONFIG` bet bounds **[partial]**.

```typescript
// src/games/crash/logic/config.ts
minBetCents: 1_000,  // 10.00 display
maxBetCents: 100_000, // 1000.00 display
```

**Establish (RESEARCH discretion):**
```typescript
export const PRESET_CHIPS = [10, 25, 50, 100, 250, 500] as const;
// All within 10–1000; omit 1000 chip to reduce all-in mis-taps; free-form still allows 1000
```

**Rule:** Chips fill input; Place Bet submits via `game.placeBet(Number(input))`.

---

### `src/games/crash/hud/historyStrip.ts` (view, transform) — NEW

**Analog:** `History.ts` + `getSnapshot().history` **[partial]** — single source of truth; HUD must not keep a parallel array.

**Existing ring (oldest → newest):**
```typescript
export class History {
  push(crashAt: number): void { /* append; shift when > maxSize */ }
  toArray(): readonly number[] {
    return this.items.slice();
  }
}
// CRASH_CONFIG.historySize = 20
// CrashGame.getSnapshot → history: history.toArray()
```

**Cadence proof (EXISTING):** spectator rounds still push; ring caps at 20 (`tests/roundCadence.test.ts`).

**Establish render:**
```typescript
export function renderHistoryStrip(host: Element, history: readonly number[]): void {
  host.replaceChildren();
  const newestFirst = [...history].reverse();
  for (const m of newestFirst) {
    const el = document.createElement("span");
    el.textContent = `${m.toFixed(2)}×`;
    el.className = historyClass(m); // <2 / 2–10 / >10
    host.appendChild(el);
  }
}
```

**Anti-pattern:** Pushing to a HUD-local history on button click (misses spectator crashes).

---

### `src/games/crash/hud/format.ts` (utility, transform) — NEW

**Analog:** `src/shared/money/cents.ts` **[partial]** — display units already on snapshot; formatters are text-only.

```typescript
export function centsToDisplay(cents: Cents): number {
  return cents / 100;
}
export function toMultHundredths(m: number): MultHundredths {
  return Math.round(m * 100);
}
```

**Establish:** `formatMoney(balanceDisplay)`, `formatMult(m)` → strings for DOM. Do **not** reimplement payout/settle. Snapshot `balance` / `multiplier` are already display-oriented.

---

### `tests/architecture.no-pixi.test.ts` (test, batch) — MODIFY

**Analog:** same file **[exact]** — second assertion currently bans `vite`.

**Current gate (must change for Phase 2):**
```typescript
it("package.json must not list pixi.js or vite dependencies", () => {
  // ...
  expect(names.has("pixi.js")).toBe(false);
  expect(names.has("vite")).toBe(false);
});
```

**Apply (RESEARCH recommended policy):**
- Keep source scan on `src/games/crash/logic` + `src/shared` forbidding `pixi.js` imports and `document.` / `window.` usage.
- Allow `vite` in package.json.
- Continue forbidding `pixi.js` in package.json until Phase 3.
- Optional: assert `hud/` may use DOM and must not import future `view/`.

**Source scan pattern to preserve:**
```typescript
const LOGIC_DIRS = [
  join(ROOT, "src", "games", "crash", "logic"),
  join(ROOT, "src", "shared"),
];
const PIXI_IMPORT = /(?:from|import)\s+['"]pixi\.js['"]|.../;
const DOM_API = /\b(?:document|window)\s*\./;
```

---

### HUD helper tests (test, transform) — NEW

| File | Analog | Focus |
|------|--------|-------|
| `enablement.test.ts` | `walkingSkeleton.test.ts` / placeBet phase gates | waiting/flying matrix; broke disables place |
| `chips.test.ts` | `wallet.test.ts` min/max | `PRESET_CHIPS` ⊆ [10, 1000] |
| `historyStrip.test.ts` | `roundCadence.test.ts` history order | newest-first reverse; class thresholds; pure fn OK under node |

**Prefer pure functions** under Vitest node env (no jsdom required for enablement/chips/historyClass).

## Shared Patterns

### Command / snapshot binder (poll)
**Source:** ARCHITECTURE Pattern 1; Phase 1 `CrashGame`; `02-RESEARCH` Pattern 2  
**Apply to:** `CrashHud.ts`, `main.ts`, future Pixi view  
**Rule:** Commands in (`placeBet`, `requestCashOut`, `setAutoCashOut`, `resetWallet`); snapshots out via `getSnapshot()`. No wallet/history mutation in HUD. Phase 2 polls each rAF frame — no new event bus required.

### Pure logic boundary (ARCH-02) — extended
**Source:** Existing `architecture.no-pixi.test.ts`; PROJECT stack lock  
**Apply to:** `logic/` + `shared/` unchanged purity; `hud/` **may** use DOM; package.json may list `vite`, not `pixi.js` yet  
**Rule:** Update package.json gate when Vite lands or CI fails closed.

### Reserved canvas slot (D-04)
**Source:** CONTEXT D-01/D-04; RESEARCH Pattern 4  
**Apply to:** `index.html`, `hud.css`, Phase 3 mount  
**Rule:** `#game-canvas-host` empty (quiet label only). Small live mult lives in **bottom bar**, not the slot.

### Three-zone bottom chrome (D-01..D-03)
**Source:** CONTEXT decisions  
**Apply to:** `index.html`, `CrashHud.ts`, `hud.css`  
**Rule:** Balance+reset left · primary actions (+ live mult / auto CO) center · chips+history right. History not above canvas.

### Stoppable clock → ticker handoff
**Source:** RESEARCH Pattern 3; `CrashGame.tick` clamp  
**Apply to:** `rafClock.ts`, `main.ts` / `GameSession.ts`  
**Rule:** Single clock; `stop` before Phase 3 ticker; same `game.tick(deltaMs)` call site.

### Enablement from waiting | flying
**Source:** `resolveTick` settle→waiting; RESEARCH Pitfall 11  
**Apply to:** `enablement.ts`  
**Rule:** Do not wait for durable `cashed_out` / `crashed` chrome; use snapshot phase + bet/balance.

### History from snapshot only (WALT-05)
**Source:** `History.ts`; CONTEXT history N=20  
**Apply to:** `historyStrip.ts`  
**Rule:** Render `snapshot.history` newest-first; no parallel HUD store; no localStorage.

### Chips fill input only (WALT-03)
**Source:** RESEARCH Pitfall 4 + chips discretion  
**Apply to:** `chips.ts`, `CrashHud.ts`  
**Rule:** Preset within min/max; Place Bet is the only `placeBet` call path.

### Broke / reset path
**Source:** `Wallet.reset` / `CrashGame.resetWallet`; CONTEXT D-03/D-04  
**Apply to:** left HUD zone  
**Rule:** Always expose “Reset demo”; emphasize when `reason === 'broke'` or `showBroke`.

### `.js` ESM import suffixes
**Source:** All Phase 1 modules  
**Apply to:** HUD imports from `../logic/index.js`, app imports  
**Rule:** Keep suffixes so Vitest NodeNext + Vite both resolve.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `index.html` | view | batch | No HTML shell in repo yet |
| `src/styles/hud.css` | view | batch | No stylesheets under `src/` |
| `vite.config.ts` | config | batch | No Vite project yet (partial analog: vitest `defineConfig` only) |
| `tsconfig.node.json` | config | batch | Optional; no node-app split config yet |

All other Phase 2 files have **partial or exact** analogs in shipped Phase 1 sources or scaffold files.

## Metadata

**Analog search scope:** Tracked `src/**/*.ts`, `tests/**/*.ts`, `package.json`, `tsconfig.json`, `vitest.config.ts` (`git ls-files`); confirmed no `index.html`, `src/main.ts`, `src/app/**`, `src/games/crash/hud/**`, `src/styles/**`.
**Files scanned:** 12 logic/shared sources + 7 test files + 3 scaffold configs.
**Tracked-source gate:** Analogs cited above are paths present in `git ls-files` (or untracked only if noted — none; all analogs are tracked Phase 1 deliverables).
**Pattern extraction date:** 2026-09-26
)
