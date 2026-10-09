# Architecture Research

**Domain:** Multi-game PixiJS casino portfolio (Crash + HOTLINE slot)
**Researched:** 2026-10-09
**Confidence:** HIGH (brownfield patterns) / MEDIUM (Pixi multi-app lifecycle, Witch Pots feature mapping from public mechanics)

## Standard Architecture

### System Overview

Exclusive one-game-at-a-time shell. Shared boot/audio/money/rng stay alive; each game mounts as a disposable **GameSession**. Crash logic is unchanged — only its boot path is extracted from `main.ts`.

```
┌─────────────────────────────────────────────────────────────────┐
│  main.ts / PortfolioShell                                        │
│  boot seed · AudioPort · mute pref · game registry · routing     │
├─────────────────────────────────────────────────────────────────┤
│  MenuSession                                                     │
│  pick Crash | HOTLINE | (future) → launch → back-to-menu         │
├──────────────────────────┬──────────────────────────────────────┤
│  CrashGameSession        │  HotlineGameSession                   │
│  ┌────────┐ ┌─────────┐  │  ┌────────┐ ┌─────────┐ ┌─────────┐ │
│  │ logic  │ │  view   │  │  │ logic  │ │  view   │ │ features│ │
│  │create  │→│ mount   │  │  │create  │→│ reels   │ │ meters  │ │
│  │Game    │ │ Crash   │  │  │Hotline │ │ CRT     │ │ bonuses │ │
│  └────┬───┘ └────▲────┘  │  └────┬───┘ └────▲────┘ └────▲────┘ │
│       │ snapshot │       │       │ snapshot │           │      │
│  ┌────▼───┐      │       │  ┌────▼───┐      │           │      │
│  │  hud   │──────┘       │  │  hud   │──────┴───────────┘      │
│  │ DOM    │ commands     │  │ DOM    │ spin / pick / gamble    │
│  └────────┘              │  └────────┘                         │
└──────────────────────────┴──────────────────────────────────────┘
│  shared: audio · boot · money · rng · fonts                      │
└──────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **PortfolioShell** | Parse boot seed, own AudioPort, show menu or one game, dispose previous session before next | `src/shell/` + thin `main.ts` |
| **GameRegistry** | Map `gameId` → async `mountGameSession(hosts, deps)` | Static registry object; Vite dynamic `import()` for code-split |
| **GameSession** | Mount Pixi + DOM HUD, wire ticker, return `dispose()` | Adapter per game; Crash wraps existing `createGame` / `mountCrashView` / `mountCrashHud` |
| **Crash logic** | Seeded round sim, wallet, bets, cashout — unchanged | Existing `src/games/crash/logic/` |
| **Crash view/hud** | Pixi scene sync + DOM binder — mount path only adapts | Existing view/hud; HUD template becomes session-injected DOM |
| **HOTLINE Config** | Backend-shaped JSON: symbols, strips, 40 lines, meter/bonus weights, gamble | `src/games/hotline/config/*.json` loaded at session start |
| **HOTLINE MathEngine** | Pure spin/feature resolve → snapshot; no Pixi imports | `logic/` modules (sampler, lines, meters, features, gamble) |
| **HOTLINE View** | Animate resolved outcomes: reels, diskette flights, phones, CRT frame | `view/` scene graph under one Application |
| **HOTLINE HUD** | Stake, spin, gamble CTA, balance, free-spin counter | DOM binder mirroring CrashHud pattern |
| **Shared ports** | Audio, mute, cents, seeded RNG | Existing `src/shared/*` |

## Recommended Project Structure

```
src/
├── main.ts                      # boot shell only
├── shell/
│   ├── PortfolioShell.ts        # menu ↔ game lifecycle
│   ├── GameSession.ts           # GameSession + Hosts + SessionDeps types
│   ├── registry.ts              # crash | hotline mount factories
│   ├── mountMenu.ts             # menu DOM + Pixi (or CSS) chrome
│   └── hosts.ts                 # #app + #game-canvas-host contracts
├── games/
│   ├── crash/
│   │   ├── logic/               # UNCHANGED math
│   │   ├── view/
│   │   ├── hud/
│   │   └── mountCrashSession.ts # extract wiring from today's main.ts
│   └── hotline/
│       ├── config/
│       │   ├── hotline.math.json    # strips, pays, meters, features
│       │   └── hotline.ui.json      # optional presentation knobs
│       ├── logic/
│       │   ├── index.ts             # createHotlineGame facade
│       │   ├── types.ts             # HotlineSnapshot, phases
│       │   ├── SpinResolver.ts      # strip sample + grid
│       │   ├── PaylineEval.ts       # 40 LTR lines
│       │   ├── MeterSystem.ts       # 3 phones + diskette collect
│       │   ├── features/
│       │   │   ├── FreeSpins.ts     # green / 24 FS + wild masks
│       │   │   ├── HoldAndWin.ts    # red respins
│       │   │   ├── PickEm.ts        # purple lockers
│       │   │   └── FeatureQueue.ts  # combo nights (ordered run)
│       │   ├── Gamble.ts            # VHS SURVIVE/DIE
│       │   └── Wallet.ts            # or reuse shared wallet helper
│       ├── view/
│       │   ├── mountHotlineView.ts
│       │   ├── HotlineScene.ts
│       │   ├── Reels.ts
│       │   ├── Phones.ts
│       │   ├── TokenFlight.ts
│       │   └── CrtFrame.ts
│       ├── hud/
│       │   └── HotlineHud.ts
│       └── mountHotlineSession.ts
├── shared/                      # audio, boot, money, rng, fonts
└── styles/
    ├── shell.css
    ├── crash-hud.css            # split from monolithic hud.css
    └── hotline-hud.css
```

### Structure Rationale

- **`shell/`:** Isolates portfolio routing from game math so Crash stays a leaf package.
- **`games/*/mount*Session.ts`:** Single entry per game; `main.ts` never imports Crash internals again.
- **`hotline/config`:** JSON stands in for “config from server”; logic loads once per session.
- **`hotline/logic/features`:** Witch Pots bonuses are separate state machines; combo nights = queue, not tangled ifs.
- **HUD CSS split:** Today Crash chrome lives in `index.html` + `hud.css` — shell must inject/remove per-game DOM.

## Architectural Patterns

### Pattern 1: GameSession contract (mandatory)

**What:** Uniform mount/dispose boundary for Crash, HOTLINE, and future demos.
**When to use:** Any game launched from the menu.
**Trade-offs:** Small adapter cost for Crash; prevents leaked tickers/WebGL/DOM.

**Example:**
```typescript
export interface SessionHosts {
  hudRoot: HTMLElement;   // #app
  canvasHost: HTMLElement; // #game-canvas-host
}

export interface SessionDeps {
  seed: string;
  audio: AudioPort;
}

export interface GameSession {
  dispose(): void;
}

export type MountGameSession = (
  hosts: SessionHosts,
  deps: SessionDeps,
) => Promise<GameSession>;
```

Crash adapter wraps today’s `main.ts` loop: `createGame` → `mountCrashHud` → `mountCrashView` → ticker → SFX edges → on dispose remove ticker, destroy app with `releaseGlobalResources: true`, clear HUD DOM.

### Pattern 2: Snapshot-driven view (existing Crash pattern)

**What:** Logic owns state; view/hud are pure consumers of `getSnapshot()` plus command methods.
**When to use:** Both Crash (already) and HOTLINE.
**Trade-offs:** Snapshot must be rich enough for animation queues (HOTLINE needs event lists: token flights, line wins, feature enter).

**Example:**
```typescript
// hotline logic returns outcome + anim cues; view never rolls RNG
interface HotlineSnapshot {
  phase: "idle" | "spinning" | "win_present" | "meter" | "feature" | "gamble";
  balance: number;
  stake: number;
  grid: SymbolId[][];          // 5x4 visible
  lineWins: LineWin[];
  meters: [MeterSnap, MeterSnap, MeterSnap];
  feature: FeatureSnap | null;
  events: HotlineEvent[];      // consumed once by view for flights/SFX
}
```

### Pattern 3: Config-in / result-out math (HOTLINE)

**What:** Load JSON config → `createHotlineGame({ config, seed })` → `spin()` / `pick()` / `gamble()` resolve fully in logic, then view plays the book.
**When to use:** All HOTLINE base and feature rounds.
**Trade-offs:** Matches iGaming mental model without a live server; RTP is illustrative only.

### Pattern 4: Single active Application (recommended)

**What:** Only one Pixi `Application` exists while a game session is live. On menu return or game switch: stop ticker → destroy stage children / app with `{ removeView: true, releaseGlobalResources: true }` → clear hosts → show menu.
**When to use:** Portfolio with exclusive games (this project).
**Trade-offs:** Prefer this over concurrent Applications — Pixi v8 TexturePool/global resources make multi-app destroy fragile ([pixijs#11694](https://github.com/pixijs/pixijs/issues/11694)). Optional later upgrade: shell-owned long-lived Application + scene Containers only; not required for v1 if dispose is strict.

## Data Flow

### Shell / menu mount–dispose

```
Boot (parseBootSeed, createBeepAudioPort)
    ↓
MenuSession.mount(hosts)
    ↓  user picks gameId
MenuSession.dispose (DOM only)
    ↓
active?.dispose()          // guaranteed before next mount
    ↓
registry[gameId](hosts, deps)  // dynamic import
    ↓  Back to menu
active.dispose()
    ↓
MenuSession.mount(hosts)
```

**Crash vs HOTLINE:**

| Step | Crash | HOTLINE |
|------|-------|---------|
| Clear hosts | Replace `#app` children with Crash HUD template; empty canvas host | Replace with Hotline HUD template; empty canvas host |
| Logic | `createGame({ seed })` | `loadHotlineConfig()` → `createHotlineGame({ config, seed })` |
| View | `mountCrashView(host)` creates Application | `mountHotlineView(host)` creates Application |
| Loop | ticker → `tick` → SFX → `hud.render` → `scene.sync` | ticker → anim clock → `hud.render` → `scene.sync` (spin is command, not continuous sim) |
| Dispose | remove ticker; `audio` stays; `dispose()` view listeners; `app.destroy({removeView:true, releaseGlobalResources:true}, {children:true, texture:true, textureSource:true})`; wipe HUD DOM | same teardown contract |

Shared across switches: **AudioPort + mute preference + boot seed**. Do **not** share Crash `Wallet` with HOTLINE — per-game demo balances avoid coupling.

### Config → logic → view/hud (HOTLINE)

```
hotline.math.json
    ↓ load + validate
HotlineConfig
    ↓ createHotlineGame
MathEngine (rng + wallet + feature queue)
    ↓ user: spin / pick / gambleTake / gambleGo
Commands mutate state, append events[]
    ↓ getSnapshot()
HotlineSnapshot ──→ HotlineHud.render (DOM)
                 ──→ HotlineScene.sync (Pixi: reels, phones, tokens, CRT)
                 ──→ sfxEdges(prev, next) → AudioPort
```

### Key Data Flows

1. **Base spin:** debit stake → sample 5 reel stops from strips → build 5×4 grid → evaluate 40 LTR paylines → detect diskette tokens → schedule meter collect events → roll per-token trigger chances → enqueue green/red/purple features (0–3) → snapshot.
2. **Meter collect:** view plays diskette flight from cell → phone; logic already advanced meter fill; trigger may fire on land (random per config, not “full meter required”).
3. **Combo nights:** `FeatureQueue` runs features sequentially (order fixed in config, e.g. green→red→purple); each feature is its own phase + snapshot shape.
4. **Green FS:** 24 free spins; elevated wild-mask weights on reels 2–5; meters still active so red/purple can interrupt/queue.
5. **Red Hold & Win:** enter with locked cash symbols (Witch Pots-style start set); 3 respins; reset on new cash; full grid / jackpot path from config.
6. **Purple Pick:** reveal locker prizes until stop rule (matching tier / collect done) per config.
7. **Gamble:** after eligible win, VHS SURVIVE/DIE 50/50 up to 10 rounds; logic resolves immediately; view plays the tape animation.

### Crash data flow (preserved)

```
createGame(seed) → tick(delta) / placeBet / cashOut
    → CrashSnapshot → CrashHud + CrashScene + sfxEdges
```

No rewrite of `resolveTick` / `Wallet` / scene internals — only call site moves into `mountCrashSession`.

## Suggested Build Order

Order matters: shell contract first, Crash rewire second, HOTLINE math before art-heavy view.

| Phase | Deliverable | Why this order |
|-------|-------------|----------------|
| **1. Shell + GameSession** | `PortfolioShell`, hosts, menu UI, registry stub | Unblocks multi-game without touching math |
| **2. Crash session adapter** | Extract `main.ts` → `mountCrashSession`; menu launch/return Crash | Proves dispose; Crash stays playable; no Crash rewrite |
| **3. HOTLINE config schema + loader** | JSON shape + Zod/hand validation + Vitest fixtures | Backend-shaped configs early; math can lock to schema |
| **4. HOTLINE base math** | Strips, 5×4 grid, 40 paylines, wallet, spin command, snapshot | Table-stakes playable headless |
| **5. Meter + token system** | Diskette collect, phone meters, random trigger rolls | Core Witch Pots differentiator |
| **6. Feature modules** | Green FS → Red Hold&Win → Purple Pick → FeatureQueue combos | Dependent on meters; test each in isolation |
| **7. Gamble** | VHS SURVIVE/DIE | Depends on win-present phase only |
| **8. HOTLINE view + HUD** | Reels/CRT/phones/flights + DOM stake/spin; mountHotlineSession | Consumes stable snapshots; art drops into view last |
| **9. Polish** | Font, mute edges, deep-link `?game=hotline`, code-split chunks | After both games mount cleanly |

**Do not:** build HOTLINE Pixi before spin snapshot is testable; do not share one eternal Application until Crash adapter dispose is proven; do not put menu chrome inside Crash HUD.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Portfolio demo (this repo) | One active session; per-game JSON; Vite dynamic imports |
| 5–10 demos | Same shell; stricter asset unload; optional shared Application |
| Production lobby | Server math + session tokens; client becomes presentational only |

### Scaling Priorities

1. **First bottleneck:** Leaked Applications / TexturePool after game switch — fix with strict dispose + `releaseGlobalResources`.
2. **Second bottleneck:** Monolithic `index.html` Crash HUD — fix by session-owned DOM templates.
3. **Third:** HOTLINE feature spaghetti — fix with FeatureQueue + per-feature modules.

## Anti-Patterns

### Anti-Pattern 1: Rewrite Crash into a shared “engine”

**What people do:** Abstract Crash + Slot into one mega state machine.
**Why it's wrong:** Different time models (continuous tick vs spin books); high rewrite risk.
**Do this instead:** Shared ports only; GameSession adapters; leave Crash logic alone.

### Anti-Pattern 2: View owns RNG / win evaluation

**What people do:** Reel stop positions chosen in Pixi tweens.
**Why it's wrong:** Untestable math; presentation drifts from “backend config” story.
**Do this instead:** Logic resolves full outcome; view animates toward known stops.

### Anti-Pattern 3: Stack Applications without destroy

**What people do:** `new Application()` per launch, hide old canvas.
**Why it's wrong:** WebGL context + TexturePool corruption on re-init.
**Do this instead:** Dispose previous session fully before next `app.init`.

### Anti-Pattern 4: Meter fill = guaranteed bonus

**What people do:** Trigger feature when phone is “full”.
**Why it's wrong:** Diverges from Witch Pots (token land rolls random trigger).
**Do this instead:** Configured probability on token collect; fill is presentation urgency only.

### Anti-Pattern 5: Crash chrome left in `index.html` forever

**What people do:** Toggle `display:none` on bet panels for HOTLINE.
**Why it's wrong:** Wrong controls leak; a11y noise; brittle.
**Do this instead:** Shell clears `#app` and mounts the active game’s HUD fragment.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Live backend | Out of scope | JSON files mimic response shape |
| Asset pipeline | User drops art into `public/` or `src/games/hotline/assets/` | Agent requests lists; does not invent finals |
| cosmic-spinner sibling | None | Separate project; do not import |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Shell ↔ GameSession | `mount` / `dispose` only | No peeking into game stores |
| Logic ↔ View/HUD | Snapshot + commands | No Pixi types in logic |
| Crash ↔ HOTLINE | None | Only via shell + shared ports |
| Config JSON ↔ MathEngine | Load once at session start | Hot-reload optional via Vite HMR later |
| AudioPort ↔ Games | Injected dep | Shell owns lifetime across switches |

## Sources

- Brownfield codebase: `src/main.ts`, `src/games/crash/logic/*`, `mountCrashView.ts`, `CrashHud.ts`, `shared/{audio,boot,money,rng}` — **HIGH**
- PixiJS v8 Application destroy / `releaseGlobalResources` — official Application docs + pixijs-application skill — **MEDIUM** (verified via docs + [#11694](https://github.com/pixijs/pixijs/issues/11694))
- Industry slot config/math separation — Energy8 / slot-engine style guides, provider math JSON patterns — **MEDIUM**
- 3 Witch Pots feature map — Endorphina public game/news pages (5×4, 40 lines, three elixir pots, FS / Hold&Win / Pick’em, risk game) — **MEDIUM** (marketing detail variance on pick grid size / jackpot multipliers; lock exact numbers in HOTLINE JSON during phase research)

---
*Architecture research for: multi-game PixiJS casino portfolio + HOTLINE (Witch Pots-like) slot*
*Researched: 2026-10-09*
