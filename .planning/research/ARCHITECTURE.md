# Architecture Research

**Domain:** Browser Crash game (Aviator-like) — client-only PixiJS v8 portfolio demo
**Researched:** 2026-09-26
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Vite App Shell (bootstrap)                   │
│  index.html · main.ts · mount canvas + HUD · wire subscriptions │
├─────────────────────────────────────────────────────────────────┤
│  HTML HUD (DOM)              │  Pixi View (canvas)               │
│  ┌──────────┐ ┌──────────┐   │  ┌─────────────────────────────┐ │
│  │ Bet/Presets│ │ Cash Out │   │  │ CurveGraph (Graphics path) │ │
│  │ Balance    │ │ History  │   │  │ RocketSprite (on path)     │ │
│  │ DEMO badge │ │ Auto CO  │   │  │ MultiplierText / FX        │ │
│  └─────┬──────┘ └────┬─────┘   │  └────────────▲──────────────┘ │
│        │ commands    │          │               │ read snapshot │
│        ▼             ▼          │               │ / events      │
├─────────────────────────────────┴───────────────┴───────────────┤
│                     GameLogic (pure TypeScript)                  │
│  ┌────────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────────┐ │
│  │ Round FSM  │ │ Wallet   │ │ Seeded   │ │ AutoCashOut       │ │
│  │ waiting →  │ │ balance  │ │ RNG      │ │ target multiplier │ │
│  │ flying →   │ │ settle   │ │ crash@M  │ │                   │ │
│  │ settle     │ │ bet lock │ │          │ │                   │ │
│  └────────────┘ └──────────┘ └──────────┘ └───────────────────┘ │
│  Emits: RoundState snapshots + discrete events (tick/cash/crash)│
└─────────────────────────────────────────────────────────────────┘
```

**Direction of truth:** GameLogic owns all authoritative state. HUD sends *commands*. Pixi *observes* and renders. Neither view layer mutates wallet, crash point, or round phase.

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **GameLogic** | Round FSM, bet lock, live multiplier, crash point, wallet settle, auto cash-out, history buffer, seeded RNG | Pure TS modules; no `pixi.js`, no DOM; unit-testable |
| **Pixi View** | Draw rising curve, place rocket on path, animate crash break, show in-canvas multiplier FX | `Application` + scene Containers; ticker reads `getSnapshot()` / events |
| **HTML HUD** | Bet amount + chip presets, Cash Out, balance, DEMO badge, history strip, auto cash-out input | Thin DOM in `index.html` + small TS binder; keyboard/touch friendly |
| **Vite App Shell** | Boot Vite entry, init Pixi, mount HUD, subscribe views to logic, resize/lifecycle | `main.ts` composition root; no game rules here |
| **Seeded RNG** | Deterministic crash multiplier from seed (demo / reproducible tests) | Pure function + optional seed from URL/query or fixed demo seed |
| **History Store** | Last N crash multipliers for strip UI | Array in GameLogic (or thin store owned by logic); HUD renders |

## Recommended Project Structure

```
src/
├── main.ts                 # Composition root: create logic, HUD, Pixi, wire
├── styles/
│   └── hud.css             # Overlay layout; canvas full-bleed behind
├── app/
│   ├── bootstrap.ts        # Application.init, canvas mount, resize
│   └── GameSession.ts      # Orchestrates one game instance (Crash)
├── games/
│   └── crash/
│       ├── logic/          # PURE TS — no Pixi/DOM imports
│       │   ├── CrashGame.ts      # Facade: commands + subscribe
│       │   ├── RoundState.ts     # FSM types + transitions
│       │   ├── Wallet.ts         # balance, placeBet, settle
│       │   ├── CrashRng.ts       # seeded crash-at multiplier
│       │   ├── MultiplierCurve.ts# time → multiplier function
│       │   ├── AutoCashOut.ts    # threshold check on tick
│       │   └── History.ts        # last N crashes
│       ├── view/           # Pixi only
│       │   ├── CrashScene.ts     # root Container for this game
│       │   ├── CurveGraph.ts     # Graphics path of multiplier
│       │   ├── Rocket.ts         # sprite position along path
│       │   └── CrashFx.ts        # break / particles / shake
│       └── hud/            # DOM binders for Crash controls
│           ├── CrashHud.ts
│           └── bindControls.ts
├── shared/                 # Ready for more casino games later
│   ├── types/
│   │   └── money.ts        # DemoMoney / cents helpers
│   ├── rng/
│   │   └── seed.ts         # mulberry32 / xorshift helpers
│   └── ui/
│       └── demoBadge.ts    # shared DEMO labeling helpers
└── assets/                 # textures (placeholders OK)
```

### Structure Rationale

- **`games/crash/logic`:** Isolates rules so tests and future ports (e.g. React shell) reuse the same round engine.
- **`games/crash/view`:** Pixi-only; swap art or graph style without touching settlement.
- **`games/crash/hud`:** HTML controls stay out of the canvas hit-testing path (better a11y + mobile forms).
- **`shared/`:** Minimal now; grows when a second game needs wallet/RNG/DEMO patterns without copying Crash code.
- **`app/` + `main.ts`:** Composition root — only place that knows about all three layers.

## Architectural Patterns

### Pattern 1: Pure Logic + Thin Views (locked)

**What:** GameLogic exposes `placeBet`, `cashOut`, `tick(dt)`, `setAutoCashOut`, and a subscribe/getSnapshot API. HUD and Pixi never compute crash point or payout.
**When to use:** Always for this project (user-locked and portfolio-testable).
**Trade-offs:** Slight boilerplate for event wiring; huge win for unit tests and multi-game reuse.

**Example:**
```typescript
// logic owns truth
type Phase = "waiting" | "flying" | "cashed_out" | "crashed";

interface CrashSnapshot {
  phase: Phase;
  multiplier: number;
  balance: number;
  bet: number | null;
  history: number[];
  autoCashOutAt: number | null;
}

// views only consume
game.subscribe((snap, event) => {
  hud.render(snap);
  scene.sync(snap, event); // event: "tick" | "cash_out" | "crash" | ...
});
```

### Pattern 2: Command / Event Bridge

**What:** HUD emits commands (`placeBet(amount)`); GameLogic emits events (`RoundStarted`, `MultiplierTick`, `CashedOut`, `Crashed`, `Settled`). Pixi reacts to events for one-shot FX; continuous motion uses snapshot + ticker dt.
**When to use:** Round lifecycle and settlement; avoid polling DOM from Pixi.
**Trade-offs:** Need a tiny event bus or callback list; do not pull in Redux for v1.

**Example:**
```typescript
hud.onCashOut(() => game.cashOut());
game.on("crash", ({ at }) => scene.playCrash(at));
```

### Pattern 3: Hybrid Visual Driven by Multiplier

**What:** Multiplier `m(t)` from logic maps to a 2D path point `p(m)`. CurveGraph redraws/extends the path; Rocket follows `p(m)`. Crash = stop advancing + break FX at last point.
**When to use:** Locked hybrid look (curve + rocket on path).
**Trade-offs:** Keep path math in view (presentation) or a small pure `pathFromMultiplier` helper under `view/` — never inside wallet/RNG.

### Pattern 4: Ticker as Clock, Logic as Authority

**What:** Pixi `app.ticker` (or shared ticker) advances GameLogic with `deltaMS` while `phase === "flying"`. Logic clamps/steps multiplier and may auto cash-out or crash in the same tick.
**When to use:** Live flying phase.
**Trade-offs:** Do not animate “fake” multiplier in the view independently of logic — desyncs cash-out fairness perception even in a demo.

## Data Flow

### Round Lifecycle (authoritative)

```
[Waiting]
    │  HUD: placeBet(amount) + optional autoCashOut
    ▼
[Lock stake in Wallet] → RNG: crashAt = f(seed)
    ▼
[Flying] ←── ticker dt ── Pixi/App
    │  Logic: multiplier = curve(t)
    │  emit tick snapshot → HUD (live ×) + Pixi (path/rocket)
    │  if autoCashOut && m >= target → CashOut path
    │  if m >= crashAt → Crash path
    ├──────────────────────┐
    ▼                      ▼
[Cashed Out]            [Crashed]
    │ settle win            │ settle loss (stake gone)
    ▼                      ▼
[History push crashAt] → [Waiting] (short delay OK)
```

### Request Flow (bet → settle)

```
User (HUD)
    ↓ placeBet(amount)
GameLogic.Wallet.lock(amount)
    ↓
GameLogic.startRound() → CrashRng.crashAt(seed)
    ↓
Ticker → GameLogic.tick(dt) → multiplier
    ↓                    ↓
Pixi.sync(snapshot)   HUD.update(multiplier, buttons)
    ↓
User cashOut OR auto OR crash
    ↓
GameLogic.settle() → Wallet balance
    ↓
HUD.balance + History strip; Pixi crash/cash FX
```

### State Management

```
CrashGame (single store for v1)
    ↓ getSnapshot() / subscribe()
┌───┴────┐
│ HUD    │  ← commands only (bet, cashOut, setAuto, setBet)
│ Pixi   │  ← read-only sync + event FX
└────────┘
```

No global Redux/Zustand for v1. One `CrashGame` instance per session is enough. If a multi-game shell appears later, introduce a thin `GameHost` that mounts/unmounts a game module with the same command/snapshot contract.

### Key Data Flows

1. **Bet → round start:** HUD validates UI limits → `placeBet` → wallet lock → RNG crash point → phase `flying`.
2. **Multiplier tick:** Ticker → `tick(dt)` → new `multiplier` → snapshot → HUD text + Pixi path/rocket.
3. **Cash out / crash → settle:** Command or threshold/crash → phase change → wallet settle → history append → UI enable next bet.
4. **Auto cash-out:** Stored target on logic; evaluated inside `tick` so it cannot desync from displayed multiplier.

## Suggested Build Order

Dependencies imply this sequence for roadmap phases:

| Order | Deliverable | Depends on | Why first |
|-------|-------------|------------|-----------|
| 1 | **GameLogic core** (FSM, wallet, RNG, tick, settle, history, auto CO) | — | Pure TS; tests without canvas |
| 2 | **Vite shell + HTML HUD** wired to logic (DEMO badge, bet, cash out, balance) | 1 | Playable “headless” loop with numbers only |
| 3 | **Pixi bootstrap** (Application, resize, empty scene) | 2 | Canvas behind HUD; lifecycle |
| 4 | **Hybrid visual** (curve + rocket driven by snapshot) | 1 + 3 | Presentation only; logic already correct |
| 5 | **Polish** (crash FX, history strip styling, mobile layout, presets UX) | 2 + 4 | Does not change architecture |

**Do not** start with Pixi art before the FSM settles bets correctly — view bugs then look like economy bugs.

## Scaling Considerations

This is a **client-only portfolio demo**, not a multiplayer crash server. “Scale” here means *more games / maintainability*, not concurrent users.

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Single Crash demo (v1) | Monolith Vite app; one `CrashGame`; HTML HUD; fine |
| +1–2 more games | Keep `games/<name>/{logic,view,hud}`; shared `Wallet`/`rng`/`DEMO`; optional lobby route |
| Multi-game shell (React/Angular later) | Reuse `logic/` packages unchanged; replace HUD binders; Pixi scenes mount into a host canvas slot |
| Real multiplayer / provably fair (out of scope) | Would move crash point + settle to server; client becomes prediction/display — **do not design v1 as if that exists** |

### Scaling Priorities (portfolio / codebase)

1. **First bottleneck:** Logic leaking into Pixi/HUD → fix with snapshot/command boundary (not FPS).
2. **Second bottleneck:** Copy-paste when adding Slot/Wheel → extract `shared/` wallet + session host early *only when* second game starts.

## Anti-Patterns

### Anti-Pattern 1: Multiplier owned by the view

**What people do:** Animate a number in Pixi and “cash out” based on what’s on screen.
**Why it's wrong:** Auto cash-out, settlement, and tests diverge; demo feels unfair or flaky.
**Do this instead:** Logic computes `multiplier`; view only displays it.

### Anti-Pattern 2: Bet buttons inside Pixi hit areas

**What people do:** Build chip UI as sprites for a “full Pixi UI.”
**Why it's wrong:** Worse forms/a11y/mobile keyboards; fights the locked HTML-controls decision.
**Do this instead:** HTML overlay for all monetary controls; Pixi for spectacle.

### Anti-Pattern 3: Mixing crash RNG into the render loop ad hoc

**What people do:** `Math.random()` on crash frame inside a sprite callback.
**Why it's wrong:** Non-reproducible demos; hard to test; crash decided too late.
**Do this instead:** Decide `crashAt` at round start via seeded RNG; tick only compares `m >= crashAt`.

### Anti-Pattern 4: Premature casino platform

**What people do:** Build lobby, auth, WebSocket hub, shared jackpot services for v1.
**Why it's wrong:** Blocks shipping the one playable Crash demo recruiters need.
**Do this instead:** Folder seams (`games/`, `shared/`) without implementing multi-game shell until a later milestone.

### Anti-Pattern 5: Fat `main.ts` with rules + drawing

**What people do:** One file places bets, draws rockets, and updates DOM.
**Why it's wrong:** Untestable; blocks “more casino games later.”
**Do this instead:** Composition root only wires modules.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| None (v1) | — | Fully client-side |
| Future: analytics | Optional HUD/shell hooks on `Settled` | Do not put in GameLogic core |
| Future: React/Angular shell | Mount canvas host + import `CrashGame` | Logic package stays framework-agnostic |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **HUD ↔ GameLogic** | Commands in / snapshots+events out | HUD never writes balance directly |
| **Pixi ↔ GameLogic** | Subscribe + ticker `tick(dt)` | Pixi never calls RNG or wallet settle APIs except via game facade if needed for debug |
| **App Shell ↔ both views** | Construct, mount, destroy | Owns lifecycle; tear down Pixi with `app.destroy` on HMR/unmount |
| **Crash ↔ future games** | Shared types/rng/wallet patterns only | No imports from `games/crash` into another game |

## Ready for More Casino Games Later

Keep these contracts stable:

1. **`GameModule` shape (informal v1):** `{ createLogic(), createView(app), createHud(root), destroy() }`.
2. **Money + DEMO labeling** in `shared/` so every game shows portfolio intent.
3. **No framework lock-in inside `logic/`** — enables a later SPA shell without rewrite.
4. **One canvas host policy:** either one `Application` with scene swap, or destroy/recreate per game — pick at multi-game milestone; v1 uses a single Crash scene.

## Sources

- Project locks: `.planning/PROJECT.md` (GameLogic ≠ Pixi; HTML controls; hybrid curve+rocket; Vite+Pixi v8+TS)
- PixiJS v8 Application / ticker / scene model (installed Pixi skills: application, core-concepts, ticker, scene graph)
- Domain pattern: Crash/Aviator-style client loops — precompute crash point, time-based multiplier, cash-out vs crash settlement (industry-common; adapted here to client-only demo without provably-fair networking)

---
*Architecture research for: browser Crash game (PixiJS v8 portfolio)*
*Researched: 2026-09-26*
