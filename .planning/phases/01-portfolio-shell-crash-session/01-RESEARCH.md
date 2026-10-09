# Phase 1: Portfolio Shell + Crash Session - Research

**Researched:** 2026-10-09
**Domain:** Brownfield refactor of a Crash-only PixiJS v8 boot into a DOM shell (menu + router) that owns one long-lived `Application` and one `AudioPort`; Crash becomes a mount/dispose session adapter
**Confidence:** HIGH (all findings come from reading the repo and the installed `pixi.js@8.21.0` sources this session; no new libraries needed)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Menu composition**
- **D-01:** First screen is a **minimal game list** on a dark shell (not a full-bleed branded landing)
- **D-02:** Games are **compact tiles with a game icon** (not text-only rows)
- **D-03:** Menu has a **named Retro Computer header** (portfolio / demos title), then tiles below
- **D-04:** While the menu is open, use an **empty dark shell** - no idle Pixi scene behind the menu; canvas host blank or hidden

**HOTLINE stub**
- **D-05:** HOTLINE tile is **visible but disabled** - not clickable; no placeholder launch screen
- **D-06:** Disabled tile shows a short **"Coming soon"** status chip
- **D-07:** **Request real menu icons now** - agent provides a clear asset list; user generates and places files in Phase 1 (Crash + HOTLINE tile icons)
- **D-08:** Tile order: **Crash first, HOTLINE second**

**Crash session on leave**
- **D-09:** **Fresh Crash session every launch** - leaving to menu tears down Crash logic + view; next launch resets balance/history - **Reversibility:** costly - session lifecycle and dispose paths assume ephemeral mounts; switching to resume-in-memory would rework shell adapter teardown
- **D-10:** Mid-round leave **abandons cleanly** - stop ticker work, drop in-flight state, no force cash-out / settle before menu
- **D-11:** Every Crash launch in the same page load **reuses the seed parsed at page boot** from `?seed=` (reproducible across menu hops)
- **D-12:** **Shell owns `AudioPort`** - create once at boot; Crash only unlocks/plays; mute survives leave without recreating the port - **Reversibility:** costly - mute persistence and unlock lifecycle are shell-scoped

**Shell chrome**
- **D-13:** **No dedicated demo / no-real-money banner** - SHELL-04 is met by existing portfolio-demo voice (page title, Reset demo, menu copy). Do not add a persistent disclaimer label
- **D-14:** While Crash is open, **"Menu" button in top chrome** (alongside mute / Reset demo) returns to the menu
- **D-15:** **Mute control on the menu** as well as in Crash; same preference
- **D-16:** Rename mute storage key from `crash-demo:mute` to **`portfolio-demo:mute`**, with a **one-time migrate** from the old key if present - **Reversibility:** one-way - published localStorage key change; migration is a one-shot read of the old key

**Carried from prior planning (do not reopen)**
- One long-lived Pixi `Application` owned by the shell; Crash thin adapter only
- Per-game demo balances for v1 (no shared wallet)
- DOM menu (not React/Vue)
- Crash gameplay not rewritten - wire into menu only
- HOTLINE may stay stub until Phase 2

### Claude's Discretion
- Exact menu title string and tile microcopy (keep short, human, Retro Computer)
- Exact "Coming soon" chip styling within the minimal HUD voice
- Precise mute-key migration helper shape (read old -> write new -> prefer new)

### Deferred Ideas (OUT OF SCOPE)
None - discussion stayed within phase scope.
Related v2 (already in REQUIREMENTS, not this phase):
- `?game=` deep-link (SHELL-V2-01)
- Shared wallet across games (SHELL-V2-02)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SHELL-01 | User can open a game menu and launch Crash or HOTLINE (HOTLINE is a disabled stub this phase per D-05) | Game registry + DOM menu + router (Architecture Patterns 1, 2, 5) |
| SHELL-02 | Return from a game to the menu without leaking tickers or audio handlers | Session dispose contract; the four real leak sources are enumerated in Pattern 3 and Pitfalls 1-4 |
| SHELL-03 | Mute preference persists across menu and games | Shell-owned `AudioPort`, shared mute binder, key rename + migrate (Pattern 6, Pitfall 7) |
| SHELL-04 | Clear portfolio demo / no real money voice | Tension with D-13 resolved in Open Question 1 (menu subtitle copy, no persistent banner) |
| CFG-02 | `?seed=` reproducible demo sessions via shared boot seam | Seed parsed once in shell boot, passed in `ShellContext`; `createGame` has no module level state (Pattern 4) |
</phase_requirements>

## Summary

Today `src/main.ts` is a Crash-only boot that creates the game, audio, HUD, a private `Application` (inside `mountCrashView`) and a ticker callback, with teardown wired only to Vite HMR. Phase 1 has to invert that: a **shell** (`src/shell/`) boots once, parses `?seed=` once, creates one `Application` and one `AudioPort`, shows a DOM menu, and on launch asks a **game definition** to `mount(ctx)` a session that returns `{ dispose }`. Crash's current `main.ts` body (game + HUD + view + `onTick` auto-bet loop) moves nearly verbatim into a Crash session adapter. Crash gameplay logic is untouched.

The leak surface is smaller and more specific than "tickers and audio" suggests. Reading the code and the installed Pixi sources, there are exactly these things that outlive a naive "remove the DOM" teardown: (1) `AnimatedSprite` in `Rocket.ts` and `Explosion.ts` use `autoUpdate: true`, which attaches to **`Ticker.shared`**, not the app's private ticker (`sharedTicker: false`), so they keep ticking until the sprite is `stop()`ped/destroyed; (2) `CrashHud` registers an un-removed `window` `keydown` listener and a `requestAnimationFrame` balance tween; (3) `mountCrashView` registers `orientationchange` / `visualViewport` resize listeners (it does return a `dispose` for these, but `main.ts` only calls it under HMR); (4) `ResizePlugin` keeps a `window` `resize` listener and a `resizeTo` reference to the host element until `app.resizeTo = null`. Plus one non-leak trap that causes a "stuck HUD": `CrashHud` toggles `hud-zone--broke` on the closest `.app-shell`, which would be the shell-owned root if the Crash markup stays inside a persistent `#app.app-shell`.

**Primary recommendation:** Build `src/shell/` (registry, router, menu, boot) and a Crash session adapter that clones the Crash screen from an `index.html` `<template>` on each launch (fresh DOM = fresh session, no duplicate listeners), adds `dispose()` to `CrashHud` and `destroy()` to `CrashScene`, changes `mountCrashView` to take the shell's `Application`, and on leave runs a fixed dispose order (ticker off, HUD dispose, scene destroy, `app.resizeTo = null`, `app.stop()`, canvas detach, DOM remove). Unit-test the router and mute migration in the existing node Vitest env with fakes; no new packages.

## Architectural Responsibility Map

All capabilities live in the browser tier; the app is client-only (no server). The "tiers" below are the in-repo layers.

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Menu screen, tiles, "Coming soon" chip | Shell DOM (`src/shell/menu`) | CSS (`src/styles`) | D-01..D-08; plain DOM, no React |
| Screen routing, launch race handling | Shell router (pure TS, no DOM) | Shell DOM boot (`main.ts`) | Keep pure so node Vitest can test dispose ordering |
| `Application` lifecycle (create once, start/stop, resizeTo) | Shell | Game session (borrows) | Locked: shell owns the app |
| `AudioPort` + mute pref | Shell | Game session (play/unlock only) | D-12 |
| Boot seed | Shell boot (`parseBootSeed` in `src/shared/boot`) | Game session (consumes string) | D-11, CFG-02 |
| Crash game loop (`onTick`, auto bet) | Crash session adapter (`src/games/crash/session`) | `logic/`, `hud/`, `view/` unchanged | Thin adapter; gameplay not rewritten |
| Crash HUD DOM | Crash HUD (`hud/CrashHud.ts`) | Shell template in `index.html` | Needs `dispose()` only |
| Crash Pixi scene | Crash view (`view/`) | Shell app | Needs `destroy()` + `mountCrashView(app)` |
| Menu icons | Static assets (`public/assets/menu/`) | - | User supplied (D-07) |
| Retro Computer font for DOM header | CSS `@font-face` | - | Not yet loaded anywhere (see Pitfall 9) |

## Standard Stack

No new runtime or dev dependencies. Everything below is already installed.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `pixi.js` | 8.21.0 (pinned; latest on npm is 8.22.0) | One shell-owned `Application` | Locked; `tests/architecture.no-pixi.test.ts` asserts `pkg.dependencies?.["pixi.js"]` is `"8.21.0"` [VERIFIED: npm view pixi.js version -> 8.22.0; tests/architecture.no-pixi.test.ts:92-93] |
| `vite` | ^6.4.3 | Dev server, CSS `url()` asset handling for the TTF | Existing toolchain [VERIFIED: package.json] |
| `vitest` | ^3.2.7, environment `node` | Router, registry, mute migration tests | `vitest.config.ts` includes `src/**/*.test.ts` and `tests/**/*.test.ts` [VERIFIED: vitest.config.ts] |
| `typescript` | ~5.8.3 | `tsc --noEmit` is part of `npm run build` | [VERIFIED: package.json] |

### Supporting
None to add. `zod`, `howler` from AGENTS.md stack notes are Phase 2 concerns and must not be added here.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Node-only tests with fakes | `happy-dom` / `jsdom` to unit-test DOM menu | Adds a devDependency and a legitimacy check for little value; the DOM parts (menu, template clone) are better covered by a manual smoke checklist plus string-level layout tests (the existing `tests/shell.hud-layout.test.ts` style). Do not add unless the planner wants it. |
| `<template>` in `index.html` cloned per launch | Keep Crash markup static and hide/show | Static markup keeps listeners, input values, `hud-zone--broke`, history strip DOM, tween state across launches; needs a manual reset of every field to satisfy D-09. Rejected. |
| Dynamic `import()` per game | Static imports | Dynamic imports help once HOTLINE is large (Phase 2). For Phase 1 use static imports; the registry shape does not preclude switching. |

**Installation:** none.

## Package Legitimacy Audit

No external packages are installed or recommended in this phase. Nothing to audit.

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
page load (index.html: <div id="app"> + <template id="crash-screen-template">)
   |
   v
src/main.ts -> bootShell()
   |  parseBootSeed(location.search)  --> seed (once, D-11)
   |  loadMutePref() [migrates legacy key once]
   |  createBeepAudioPort({muted})    --> audio (once, D-12)
   |  new Application(); await init   --> app (once); app.stop()
   v
 router (pure state machine)  <------------------------------+
   state: menu | launching(id,epoch) | game(id,session)        |
   |                                                           |
   |-- showMenu() --> mountMenu(#app): tiles from registry,    |
   |                  mute button bound to audio               |
   |                                                           |
   |-- launch('crash') on tile click (enabled tiles only)      |
   |      epoch++ ; menu.dispose()                             |
   |      session = await game.mount(ctx)                      |
   |      if epoch changed while awaiting -> session.dispose() |
   |      ctx = { app, root:#app, audio, seed, requestMenu }   |
   |                                                           |
   |   Crash session mount:                                    |
   |     clone template into #app -> crash screen element      |
   |     canvas -> #game-canvas-host ; app.resizeTo = host     |
   |     createGame({seed}) ; mountCrashHud(screen,game,{audio})|
   |     mountCrashView(app) -> scene                          |
   |     app.ticker.add(onTick) ; app.start()                  |
   |     [Menu] button click -> ctx.requestMenu() -------------+
   |
   |-- dispose order on leave (idempotent):
         ticker.remove(onTick) -> hud.dispose() -> scene.destroy()
         -> view.dispose() -> app.resizeTo = null -> app.stop()
         -> canvas.remove() -> screen.remove()
         (audio is NOT disposed; app is NOT destroyed)
```

### Recommended Project Structure

```
src/
  main.ts                         # thin: bootShell() + HMR dispose
  shell/
    bootShell.ts                  # seed, audio, app, router, menu wiring; returns dispose
    router.ts                     # pure state machine (no DOM, no pixi imports)
    router.test.ts                # fakes: session dispose counts, launch race
    gameRegistry.ts               # GAMES list: crash enabled, hotline disabled (pure data)
    gameRegistry.test.ts
    types.ts                      # GameDefinition, GameSession, ShellContext
    menu/
      mountMenu.ts                # DOM build via createElement/textContent
    muteBinding.ts                # bindMuteButton(button, audio): used by menu (and optionally Crash)
  games/crash/
    session/
      mountCrashSession.ts        # moved body of main.ts + dispose order
    hud/CrashHud.ts               # + dispose()
    view/CrashScene.ts            # + destroy()
    view/mountCrashView.ts        # takes shell Application; returns { scene, dispose }
  shared/audio/mutePref.ts        # key rename + legacy migrate (+ tests updated)
  styles/hud.css                  # + @font-face, .menu-*, .menu-back, [hidden]
public/assets/menu/               # icon-crash.png, icon-hotline.png (user supplied)
```

Why `src/shell/` and not `src/shared/`: `tests/architecture.no-pixi.test.ts` scans every non-test `.ts` under `src/shared` and `src/games/crash/logic` and fails on any `document.` / `window.` use or `pixi.js` import (`DOM_API = /\b(?:document|window)\s*\./`, `LOGIC_DIRS` includes `join(ROOT, "src", "shared")`). Shell code needs `document`, so it must live outside `src/shared`. `parseBootSeed`, `mutePref`, `AudioPort` stay in `src/shared` and stay DOM free (`mutePref` already uses `globalThis` for this reason).

### Pattern 1: Game definition + session contract

**What:** A tiny interface every game implements; the shell never imports Crash internals except through the registry.
**When to use:** Phase 1 for Crash, Phase 2 for HOTLINE (same contract, no router change).
**Example:**
```ts
// src/shell/types.ts
import type { Application } from "pixi.js";
import type { AudioPort } from "../shared/audio/AudioPort.js";

export interface ShellContext {
  app: Application;          // shell owned, long lived
  root: HTMLElement;         // #app, session appends its own screen element
  audio: AudioPort;          // shell owned, never dispose from a session
  seed: string;              // parsed once at boot
  requestMenu: () => void;   // session calls this from its Menu button
}

export interface GameSession {
  dispose(): void;           // must be idempotent
}

export interface GameDefinition {
  id: "crash" | "hotline";
  title: string;
  blurb: string;             // short tile microcopy
  iconUrl: string;
  enabled: boolean;
  mount?: (ctx: ShellContext) => Promise<GameSession>;
}
```
Tile order (D-08) is array order: crash, hotline. HOTLINE has `enabled: false` and no `mount`.

### Pattern 2: Router as a pure state machine with an epoch guard

**What:** `launch(id)` and `showMenu()` bump a numeric epoch. After `await game.mount(ctx)`, compare the captured epoch; if it changed, dispose the just-built session immediately.
**Why:** Crash mount has real awaits (`loadBackdropTextures`, `loadRocketTextures`, `loadExplosionTextures`, `app.init` is already done). The Menu button exists in the cloned Crash DOM before those awaits finish, so a user can leave mid-load. Without the guard a session finishes mounting after the menu is shown and leaks a ticker callback and a screen element.
**Example:**
```ts
// src/shell/router.ts (no DOM, no pixi imports -> node testable)
export function createRouter(deps: {
  games: readonly GameDefinition[];
  showMenu: () => { dispose(): void };
  buildContext: (requestMenu: () => void) => ShellContext;
}) {
  let epoch = 0;
  let menu: { dispose(): void } | null = null;
  let session: GameSession | null = null;
  let disposed = false;

  function goMenu(): void {
    if (disposed) return;
    epoch++;
    session?.dispose();
    session = null;
    menu?.dispose();
    menu = deps.showMenu();
  }

  async function launch(id: string): Promise<void> {
    const def = deps.games.find((g) => g.id === id);
    if (disposed || !def?.enabled || !def.mount || session) return; // ignore double click
    const mine = ++epoch;
    menu?.dispose();
    menu = null;
    const next = await def.mount(deps.buildContext(goMenu));
    if (mine !== epoch || disposed) {
      next.dispose();
      return;
    }
    session = next;
  }
  // dispose(): disposed = true; epoch++; session?.dispose(); menu?.dispose()
  return { start: goMenu, launch, dispose() { /* as above */ } };
}
```
Note for the planner: while `mount` is in flight `session` is still `null`, so a second tile click would pass the `session` check. Guard with an explicit `launching` flag (or because the menu is disposed synchronously at the start of `launch`, the tile no longer exists; either is fine, but add a test). Also: if `mount` throws, the router must restore the menu and surface the error in the console; add a try/catch that calls `goMenu()`.

A subtle point: a session that was disposed during its own `mount` (user clicked Menu while loading) calls `dispose()` once from the router's epoch guard; the session's `dispose` must therefore be safe when called before `mount` fully resolved only through that path (the session's partial-mount state is its own responsibility: build `dispose` before the first `await`, or have `mount` check a `cancelled` flag between awaits). Prefer: create DOM and register `dispose` state first; after each `await`, `if (cancelled) { cleanup(); throw/return }`.

### Pattern 3: Crash session adapter and fixed dispose order

**What:** Move the body of `src/main.ts` (create game, HUD, view, `onTick`, auto-bet loop) into `mountCrashSession(ctx)`. The `onTick` code is moved verbatim: it references `hud`, `game`, `audio`, `scene`, `prevSnap`, `prevAutoBetOn`, `DISPLAY_MIN`, `shouldAutoPlaceBet`, `sfxEventsFromTransition`.
**Dispose order (important):**
```ts
// inside mountCrashSession
let disposed = false;
function dispose(): void {
  if (disposed) return;
  disposed = true;
  app.ticker.remove(onTick);   // 1: nothing ticks into a half torn scene
  hud.dispose();               // 2: window keydown + balance rAF tween
  scene.destroy();             // 3: stage children destroyed (stops AnimatedSprite on Ticker.shared)
  viewDispose();               // 4: orientationchange / visualViewport listeners
  app.resizeTo = null;         // 5: removes window resize listener + host reference
  app.stop();                  // 6: shell renders nothing while menu is up
  app.canvas.remove();         // 7: D-04 canvas not in the DOM on the menu
  screen.remove();             // 8: DOM and its element listeners go with it
  // audio.dispose() is deliberately absent (D-12)
}
```
**Source of facts for each step:**
- `app.ticker.add(onTick)` and `app.ticker.minFPS = 10` come from `main.ts`; `minFPS` should be set once at shell boot, `onTick` added per session [VERIFIED: src/main.ts:37-38, 80].
- `AnimatedSprite.stop()` removes from `Ticker.shared`, and `destroy()` calls `this.stop()`:
  ```
  stop() {
      ...
      this._playing = false;
      if (this._autoUpdate && this._isConnectedToTicker) {
        Ticker.shared.remove(this.update, this);
  ```
  [VERIFIED: node_modules/pixi.js/lib/scene/sprite-animated/AnimatedSprite.mjs:88-94] and `this.stop(); super.destroy(options);` inside `destroy` [VERIFIED: AnimatedSprite.mjs:291-294]. `Rocket.ts` constructs `new AnimatedSprite({ ..., autoUpdate: true })` [VERIFIED: src/games/crash/view/Rocket.ts:50-56] and `Explosion.ts:37` has `autoUpdate: true` [VERIFIED: grep output `37:    autoUpdate: true,`]. So destroying the scene containers with `{ children: true }` is what ends those ticker subscriptions. Destroy with the default `texture: false` so Assets-cached textures stay valid for the next launch.
- `app.resizeTo = null`: the plugin defines `resizeTo` with a setter that does `globalThis.removeEventListener("resize", this.queueResize); this._resizeTo = dom; if (dom) { globalThis.addEventListener("resize", this.queueResize); this.resize(); }` [VERIFIED: node_modules/pixi.js/lib/app/ResizePlugin.mjs:11-21]. `resize` reads `clientWidth` / `clientHeight` of the host and calls `renderer.resize` then `this.render()` [VERIFIED: ResizePlugin.mjs:41-59]. Leaving a detached host as `resizeTo` would resize the renderer to 0x0 on any window resize, so clear it.

**Create order (mount):** clone template into `ctx.root` and keep the element -> `host.replaceChildren(app.canvas)` -> `app.resizeTo = host` (this triggers an immediate `resize()`; the element must already be attached and laid out) -> `await` texture loads -> `createCrashScene(app, ...)` (it reads `app.screen.width/height` at creation, so size must already be right) -> `createGame({ seed })` -> `mountCrashHud(screen, game, { audio })` -> `app.ticker.add(onTick)` -> `app.start()`.

### Pattern 4: Seed reuse (CFG-02, D-11)

`parseBootSeed(window.location.search)` is called once in `bootShell` and the string is stored in the shell. `ShellContext.seed` is passed to every launch; the Crash session calls `createGame({ seed })`. `createGame` and `src/shared`/`logic` contain no `Math.random`, `Date.now`, or module level mutable state (ripgrep over `src/games/crash/logic` and `src/shared` for `Math.random|Date.now|performance.now|^let |^const [a-z]+ = new` returned nothing), so two launches with the same seed in the same page load run identically as long as the tick deltas are the same; real tick deltas come from the real clock, so the *sequence of crash points* is what is reproducible, which is the same guarantee Crash has today. Test at the logic level: `createGame({ seed })` twice, tick identically, expect equal `crashAt` (the existing `walkingSkeleton.test.ts` style); plus a router test asserting every launch receives the same `ctx.seed` string.

`parseBootSeed` behavior to keep in mind: unset/empty seed -> `DEFAULT_DEMO_SEED = "portfolio-demo"` (so even without `?seed=` the session is deterministic from boot; that is existing behavior), invalid seed (>128 chars or control characters) falls back with `invalid: true` [VERIFIED: src/shared/boot/parseBootSeed.ts:5-22]. The shell should keep ignoring `invalid`/`fromQuery` (no seed chip is allowed: `tests/shell.hud-layout.test.ts` asserts `not.toMatch(/seed-chip/)`).

### Pattern 5: Crash screen as a cloned `<template>`; menu and Crash screens are siblings under `#app`

- `index.html` becomes: `<div id="app"></div>` plus `<template id="crash-screen-template">` holding exactly today's Crash markup, wrapped in one root `<div class="app-shell crash-screen" id="crash-screen">` (top-chrome, history-band, canvas-host, hud-bar inside). Keep every id and `data-*` attribute exactly as they are; `tests/shell.hud-layout.test.ts` parses `index.html` as a string and will still find them inside the template [VERIFIED: test uses `innerById(html, ...)` regex over the raw source, tests/shell.hud-layout.test.ts:9-33].
- The wrapper must carry the `app-shell` class. `CrashHud` computes its `shell` element as `root.classList.contains("app-shell") ? root : (root.closest(".app-shell") ?? root)` [VERIFIED: src/games/crash/hud/CrashHud.ts:97-101] and toggles `hud-zone--broke` on it [VERIFIED: CrashHud.ts:447 `shell.classList.toggle("hud-zone--broke", true);` and :557-558]. If `root` is the cloned wrapper, that class dies with the wrapper. If the Crash markup stays inside the persistent `#app.app-shell`, a broke state would remain on the shell root after leaving (criterion 2 "stuck HUD").
- `.app-shell` in CSS is `display: flex; flex-direction: column; height: 100dvh; overflow: hidden` [VERIFIED: src/styles/hud.css:57-65 region; `.app-shell` at line 57]. Keep this class on each screen wrapper (menu wrapper too) and make `#app` a plain block container. Any existing `hud.css` selectors keyed to `#app` should be checked (grep `#app` in `hud.css` during planning).
- Add `[hidden] { display: none !important; }` only if the plan uses `hidden`; with remove/insert routing it is unnecessary.
- Add `<button type="button" data-action="menu" class="menu-back">Menu</button>` in `.top-chrome__actions`, beside `reset-wallet` and `mute` (D-14). Wire it in the session adapter (`querySelector('[data-action=menu]')` -> `ctx.requestMenu()`), not in `CrashHud`; `CrashHud` already throws if required fields are missing, and the Menu button is not a Crash gameplay concern. Style by adding `.menu-back` to the existing `.mute-toggle, .reset-demo` rule group (hud.css:679-680 selector list, and the `:focus-visible` / `:hover` groups at 439-440 and 694-695).
- Layout test additions: Menu button is under `#top-chrome`; menu button not under `#game-canvas-host`.

### Pattern 6: Shared mute, one binder, one pref

- Add to `src/shell/muteBinding.ts`: `bindMuteButton(btn, audio): () => void` that sets the label (`"Sound: On"` / `"Sound: Off"`, same strings as Crash), `aria-pressed`, and on click does `audio.unlock(); const next = !audio.isMuted(); audio.setMuted(next); saveMutePref(next); sync()`. This duplicates 8 lines of `CrashHud` (CrashHud.ts:185-189 label sync, :428-433 click). Leave `CrashHud`'s own mute code as is (no gameplay rewrite); both read `audio.isMuted()` at mount, and because the Crash DOM is fresh per launch and the menu DOM is rebuilt on each show, labels always sync from the single source of truth (`audio.isMuted()`), so no cross-screen event bus is needed.
- Order of events for criterion 3: toggle on menu -> `audio.setMuted` + `saveMutePref` -> launch Crash -> `CrashHud` calls `syncMuteLabel()` at mount using `audio.isMuted()` -> label correct. Toggle in Crash -> leave -> menu rebuilt with `audio.isMuted()` -> label correct. Add a router test that mute state survives two leave/launch cycles with a fake `AudioPort` whose instance identity is asserted equal across launches (D-12).

### Pattern 7: Mute key migration (D-16)

Current: `export const MUTE_STORAGE_KEY = "crash-demo:mute";` [VERIFIED: src/shared/audio/mutePref.ts:1]. Recommended shape:

```ts
export const MUTE_STORAGE_KEY = "portfolio-demo:mute";
export const LEGACY_MUTE_STORAGE_KEY = "crash-demo:mute";

export function loadMutePref(store?: MuteStore): boolean {
  try {
    const s = resolveStore(store);
    const current = s.getItem(MUTE_STORAGE_KEY);
    if (current === "1" || current === "0") return current === "1";   // prefer new
    const legacy = s.getItem(LEGACY_MUTE_STORAGE_KEY);
    if (legacy === "1" || legacy === "0") {
      s.setItem(MUTE_STORAGE_KEY, legacy);                            // one shot migrate
      return legacy === "1";
    }
    return false;
  } catch {
    return memoryFallback.get(MUTE_STORAGE_KEY) === "1";
  }
}
```
Notes: (a) `MuteStore` has only `getItem` / `setItem` [VERIFIED: mutePref.ts:3-6]; do not delete the legacy key (keeps the interface and existing injectable-store tests intact; once the new key exists the legacy key is never read, so it is inert). If the planner wants deletion, add an optional `removeItem?` to `MuteStore`. (b) The `resolveStore` probe calls `getItem(MUTE_STORAGE_KEY)` [VERIFIED: mutePref.ts:34]; it follows the constant automatically. (c) Update `mutePref.test.ts`: test titles hardcode `crash-demo:mute` and assertions use the exported constant, so assertions follow the rename, but titles need editing; add tests: migrate "1", migrate "0", new key wins over legacy, malformed legacy ignored, no-write when neither key exists. (d) Call `loadMutePref()` exactly once in `bootShell`; do not call it per launch.

### Pattern 8: Menu DOM and CSS (no innerHTML)

- Build with `createElement` / `textContent` / `setAttribute`; the repo already bans `.innerHTML` in theater files via an architecture test (`INNER_HTML_USE = /\.innerHTML\b/`), and the project voice is plain DOM. Extend that test pattern to `src/shell/**` (add `src/shell` to a scan list) so the rule is enforced here too.
- Tile: `<button type="button" class="menu-tile" data-game="crash">` with `<img class="menu-tile__icon" alt="" width=.. height=..>`, title, one-line blurb; disabled tile: `disabled` attribute + `aria-disabled="true"` + `<span class="menu-tile__chip">Coming soon</span>`. A native `disabled` button cannot be clicked or focused (D-05), no extra JS needed.
- The menu screen wrapper `<main class="app-shell menu-screen">` includes: header (`<h1 class="menu-title">`, one subtitle line), tile list, and a mute button in a small top bar (D-15) using the existing `.mute-toggle` class so it looks identical.
- Safe-area and mobile: reuse the `env(safe-area-inset-*)` padding pattern from `.top-chrome`.
- Icons: use `/assets/menu/icon-crash.png` and `/assets/menu/icon-hotline.png` (same root-relative convention as `ROCKET_ASSET_URLS = ["/assets/rocket/ship-1.png", ...]` [VERIFIED: Rocket.ts:10-13]). **The tiles must render acceptably before the files exist** (CSS background plus an `img` `onerror` that hides the broken image), so the walking skeleton is not blocked on art. Add a `checkpoint:human-action` plan task for icon delivery (see Asset List below).

### Anti-Patterns to Avoid
- **Destroying the `Application` on leave:** violates the locked "one long-lived app" and would re-create a WebGL context on every launch. Destroy only on shell dispose (HMR).
- **Calling `audio.dispose()` from the session:** `createBeepAudioPort` sets `disposed = true` permanently and closes the context [VERIFIED: createBeepAudioPort.ts:116-127], so every later `play` / `unlock` is a silent no-op (breaks D-12 and criterion 3).
- **Keeping Crash's `onTick` on `app.ticker` after leaving:** it would keep calling `game.tick` and `scene.sync` on a destroyed scene.
- **Putting shell DOM code under `src/shared`:** the architecture test fails on `document.` / `window.` there.
- **Resetting a static Crash DOM by hand:** prefer clone-per-launch.
- **Reading the seed from the URL inside the session:** the seed is shell state (D-11).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Window resize tracking for the canvas | A custom resize listener | `app.resizeTo = hostElement` / `null` | `ResizePlugin` already owns this, including the resize-then-render step; custom code would race it |
| Per-launch `Application` | New `Application` per Crash launch | The shell's single app + `app.start()` / `app.stop()` | Context churn; locked decision |
| Sound output | New audio adapter | Existing `createBeepAudioPort` instance owned by shell | One backend per AGENTS.md; Howler arrives with HOTLINE SFX later |
| Seed parsing | New query parser | `parseBootSeed` | Already tested (`parseBootSeed.test.ts`) |
| Mute persistence with fallbacks | New storage code | Extend `loadMutePref` / `saveMutePref` | Already handles private mode via memory fallback |
| Disabled tile behavior | Click handlers that check a flag | Native `<button disabled>` | Not focusable or clickable by construction |
| Font loading for the DOM header | Pixi `Assets.load` of the TTF | CSS `@font-face` with a Vite-resolved `url()` | DOM header only; Pixi text is not used in Phase 1 |

**Key insight:** the work is lifecycle plumbing. Every custom mechanism in this phase (router, dispose order) is small, but each one exists to cancel a specific subscription that Pixi or the HUD created; enumerate them and test the enumeration.

## Runtime State Inventory

Phase 1 includes a storage key rename (D-16) and a boot restructure, so this applies.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | `localStorage` key `crash-demo:mute` (values `"1"` / `"0"`) on visitors' browsers; no other keys exist in `src` (only `mutePref.ts` touches storage) | **Data migration at runtime** (one-shot read in `loadMutePref`) plus **code edit** (rename constant). Both are required and distinct. |
| Live service config | None - client-only static app, no external services | None |
| OS-registered state | None | None |
| Secrets/env vars | None | None |
| Build artifacts | `dist/` from `vite build` if present is stale after the change; no installed-package names change | Rebuild only; nothing to migrate |

**The canonical question** (after every file is updated, what still has the old string?): only visitors' stored `crash-demo:mute` values, handled by the migration; the old key is left in place and inert.

## Common Pitfalls

### Pitfall 1: `AnimatedSprite` keeps ticking on `Ticker.shared` after leave
**What goes wrong:** Rocket and Explosion sprites keep calling `update` every frame on the global shared ticker even though the app's own ticker is stopped (`sharedTicker: false` in `mountCrashView`), exactly the "leftover ticker ticks" in criterion 2.
**Why it happens:** `autoUpdate: true` subscribes to `Ticker.shared`, not `app.ticker` [VERIFIED: AnimatedSprite.mjs:91-93, 132-134].
**How to avoid:** `CrashScene.destroy()` removes `backdrop.container`, `world`, `theater.container`, `flash` from `app.stage` and calls `destroy({ children: true })` on each (default `texture: false`). Alternatively add `destroy()` to `Rocket` / `Explosion` that calls `bodySprite.stop()`; destroying containers with `children: true` is sufficient because `AnimatedSprite.destroy` calls `stop()`.
**Warning signs:** `Ticker.shared.count` (public API on `Ticker`) is greater than its pre-launch value after returning to the menu. Use this in a manual console check. Mark `Ticker.shared.count` as [ASSUMED] to exist in 8.21.0; confirm in the plan's manual step, or verify `Ticker.shared._head` inspection fallback.

### Pitfall 2: `CrashHud` window listener and rAF survive the screen
**What goes wrong:** Space/Enter keeps calling `game.requestCashOutAll()` on a stale game after returning to the menu, and each launch stacks another listener.
**Why it happens:** `window.addEventListener("keydown", ...)` at CrashHud.ts:461 has no matching `removeEventListener`; `balanceTweenRaf` (`requestAnimationFrame`) can still be pending.
**How to avoid:** Name the keydown handler, add `dispose()` to the `CrashHud` interface that removes it and calls `cancelBalanceTween()`; the DOM-bound listeners die with the cloned screen element. Also guard `render` after dispose (a no-op flag) so a late tick cannot touch a removed DOM.
**Warning signs:** pressing Space on the menu logs or throws; repeated launch/leave makes Space handlers multiply.

### Pitfall 3: `mountCrashView` creates its own `Application` and ties listeners to `dispose` that `main` only calls under HMR
**What goes wrong:** Taking the file as-is, each launch builds a new app/context and leaks `orientationchange` / `visualViewport` listeners [VERIFIED: mountCrashView.ts:36-45 and `dispose`].
**How to avoid:** Change signature to `mountCrashView(app: Application): Promise<{ scene: CrashScene; dispose: () => void }>`; delete `new Application()` / `app.init(...)` from it and move the init options to shell boot, keeping the exact options (`background: VIEW_CONFIG.BACKGROUND`, `antialias: true`, `autoDensity: true`, `resolution: Math.min(window.devicePixelRatio || 1, 2)`, `preference: "webgl"`, `autoStart: true`, `sharedTicker: false`) [VERIFIED: mountCrashView.ts:18-27]. Keep `resizeTo` out of init (set per launch). `BACKGROUND` lives in `viewConfig.ts`; the shell importing `VIEW_CONFIG.BACKGROUND` is acceptable for Phase 1 (or let the shell pass the background in the app options constant, then HOTLINE can set its own stage background per session).
**Constraint:** `tests/architecture.no-pixi.test.ts` forbids the literal `Assets.load` in `CrashScene.ts` and `mountCrashView.ts`; keep loading through the existing `loadBackdropTextures` / `loadRocketTextures` / `loadExplosionTextures` helpers.

### Pitfall 4: Stale `resizeTo` host after leaving
See Pattern 3 step 5. Also: `app.resize()` while the host is `display: none` or detached reads 0x0; always set `resizeTo` after the screen is attached and visible.

### Pitfall 5: Launch race (leave while loading)
See Pattern 2. Test both orders: leave before `mount` resolves; leave after.

### Pitfall 6: Persistent `.app-shell` collects `hud-zone--broke` / `reset-demo--emphasize` (stuck HUD)
See Pattern 5. `reset-demo--emphasize` is toggled on the Reset button inside the cloned screen so it is fine; `hud-zone--broke` is the one that targets `shell`.

### Pitfall 7: Mute key rename test titles and probe
`mutePref.test.ts` has titles containing the literal `crash-demo:mute` (lines 21 and 27 of that test file: "save then load round-trips muted=true as crash-demo:mute=1"). Update titles with the rename; the assertions use `MUTE_STORAGE_KEY` so they follow automatically.

### Pitfall 8: Detached canvas and WebGL context
**What goes wrong:** Leaving the shell-owned canvas detached for a long time on mobile may let the browser drop the context.
**Why it happens:** Browsers may reclaim contexts under memory pressure; Pixi v8 documents context-loss handling in the core renderer but behavior on a detached canvas is not something verified in this session.
**How to avoid / verify:** [ASSUMED] detached canvas keeps its context. Manual check in the plan: launch, leave, wait 60 s, relaunch 5 times with DevTools console open and confirm no "context lost" warnings. If it fails, fallback is to park the canvas in a `hidden` host element that stays in the document instead of `canvas.remove()` (D-04 allows "blank or hidden").

### Pitfall 9: Retro Computer font is not wired up anywhere yet
`grep` for `font-face|retrocomputer` in `src` and `index.html` returned no hits (the only reference is the TTF file itself at `src/shared/fonts/retrocomputerrusbydaymarius.ttf`). `body` uses `"Segoe UI", system-ui, sans-serif` [VERIFIED: hud.css:44]. The header needs a new `@font-face` in `hud.css` (or a sibling `shell.css` imported from `main.ts` / linked from `index.html`) with `src: url("../shared/fonts/retrocomputerrusbydaymarius.ttf") format("truetype")` and `font-display: swap`. Visually verify glyph coverage for the chosen title (case, digits); [ASSUMED] the TTF has lowercase and the characters used.

### Pitfall 10: Baseline is not green
Before the phase starts: `npx vitest run` reports **3 failed | 150 passed** (all in `src/games/crash/hud/sessionStats.test.ts`) and `npx tsc --noEmit` reports `src/games/crash/view/Rocket.ts(113,40): error TS2561: ... 'setBodyTexture' does not exist in type 'Rocket'` [VERIFIED: command output this session]. Causes found: `sessionStats.ts:9` formats `${n.toFixed(2)}x` (ASCII x) while the tests expect `"3.00×"` and `format.ts:8` uses `×`; `Rocket.ts:113` returns `setBodyTexture` but the `Rocket` interface at lines 15-25 only declares `setBodyTextures`. `npm run build` is `tsc --noEmit && vite build`, so **the build is currently broken** and "full suite green" cannot be a phase gate. Plan a Wave 0 housekeeping task: add `setBodyTexture: (texture: Texture | null) => void` to the `Rocket` interface (the architecture test also asserts `Rocket` exposes `setBodyTexture`), and align `sessionStats` with its tests (the tests and `formatMult` agree on `×`; the empty label `-` vs test expectation should be checked when editing). This is a decision for the planner/user because it touches Crash HUD code outside the "not rewritten" rule, but they are non-gameplay fixes needed for a verifiable phase.

## Code Examples

### Boot (shell)
```ts
// src/shell/bootShell.ts (sketch)
export async function bootShell(): Promise<() => void> {
  const root = document.querySelector<HTMLElement>("#app");
  if (!root) throw new Error("#app missing");
  const { seed } = parseBootSeed(window.location.search);   // once
  const audio = createBeepAudioPort({ muted: loadMutePref() }); // once, migrates legacy key
  const app = new Application();
  await app.init({ /* same options as today's mountCrashView, no resizeTo */ });
  app.ticker.minFPS = 10;
  app.stop();                                                // no rendering behind the menu (D-04)
  const router = createRouter({ /* games, showMenu, buildContext */ });
  router.start();
  return () => {
    router.dispose();
    audio.dispose();
    app.destroy({ removeView: true, releaseGlobalResources: true }, { children: true });
  };
}
```
```ts
// src/main.ts
import "./styles/hud.css";
import { bootShell } from "./shell/bootShell.js";

const disposeShell = bootShell();
if (import.meta.hot) {
  import.meta.hot.dispose(() => { void disposeShell.then((d) => d()); });
}
```
The `app.destroy(...)` argument shape is copied from the existing HMR block [VERIFIED: src/main.ts:84-91]. Keep `import "./styles/hud.css"` (main.ts imports it today, and `index.html` also links it).

### Template and cloning
```html
<div id="app"></div>
<template id="crash-screen-template">
  <div id="crash-screen" class="app-shell crash-screen">
    <header id="top-chrome" class="top-chrome"> ... existing markup + menu button ... </header>
    <div id="history-band" class="history-band"> ... </div>
    <div id="game-canvas-host" class="canvas-host" aria-label="Game view"> ... </div>
    <footer id="hud-bar" class="hud-bar"> ... </footer>
  </div>
</template>
```
```ts
const tpl = document.querySelector<HTMLTemplateElement>("#crash-screen-template");
const screen = (tpl!.content.firstElementChild as HTMLElement).cloneNode(true) as HTMLElement;
ctx.root.append(screen);
```
Also update `<title>` (index.html:8, currently `Crash Demo - Portfolio`) to a portfolio-wide string; this is part of the D-13 "page title" voice.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `main.ts` boots Crash, HMR-only teardown | Shell boot + session `dispose()` + router | This phase | Required for SHELL-02 |
| `mountCrashView` owns `Application` | Shell owns `Application`; view borrows it | This phase | Prerequisite for HOTLINE in Phase 2 |
| Single mute key `crash-demo:mute` | `portfolio-demo:mute` + legacy read | This phase | One-way (D-16) |
| Pixi 8.21.0 pinned | 8.22.0 exists on npm | n/a | Do not bump in this phase (test asserts `8.21.0`) |

**Deprecated/outdated:** `<p class="canvas-placeholder">Game view</p>` is replaced by the canvas on mount; it stays in the template markup for the layout test and is removed by `replaceChildren`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `Ticker.shared.count` is a public readable property in 8.21.0 (used for the manual leak check) | Pitfall 1 | Manual check needs another method (e.g. spy on `Ticker.shared.add/remove`); low |
| A2 | A detached shell-owned canvas keeps its WebGL context across a menu stay | Pitfall 8 | Context loss on relaunch; fallback is a hidden in-DOM parking host |
| A3 | `Container.destroy({ children: true })` on `BitmapText` (theater) does not leak or break a later re-created `BitmapText` using the same dynamic font style | Pattern 3 | Visual glitch or slow memory growth after many launches; verify by relaunch x10 |
| A4 | Retro Computer TTF has the glyphs needed for the title string | Pitfall 9 | Header falls back to a system font; pick a different string or uppercase |
| A5 | Icon sizing guidance (256x256 source for a ~64-96 px tile) is adequate for DPR 2-3 | Asset List | User regenerates icons; low |
| A6 | The `<template>` in `index.html` is acceptable to the user for the Crash markup location (vs a TS string) | Pattern 5 | Minor refactor of where markup lives; tests would need path tweak |

## Open Questions

1. **SHELL-04 vs D-13 (is there a visible "no real money" label at all?)**
   - What we know: roadmap criterion 4 says "Menu/HUD shows a clear portfolio demo / no real money label"; D-13 forbids a dedicated or persistent disclaimer banner and says the requirement is met by "page title, Reset demo, menu copy".
   - What's unclear: whether a short subtitle in the menu header counts as "menu copy" or as a banner.
   - Recommendation: honor D-13 literally. Put the voice in (a) `<title>`, (b) one short subtitle line under the menu title (menu only, not shown in Crash), for example "Portfolio demos. Play money only." (exact string is Claude's discretion), (c) keep `Reset demo` in Crash. Do not add anything to the Crash chrome. Have the plan state this explicitly so verification of criterion 4 checks the menu subtitle and title.

2. **Baseline repairs (Pitfall 10)**
   - What's unclear: whether the user wants tsc/test fixes in this phase; they block `npm run build` and a green suite gate.
   - Recommendation: include as a small Wave 0 task, called out as non-gameplay fixes.

3. **Should the menu mute button also appear while a game is loading?**
   - Not needed; the menu is gone during load; the Crash screen has its own mute button.

## Asset List for D-07 (menu icons, user-generated)

| File | Path | Size | Notes |
|------|------|------|-------|
| Crash tile icon | `public/assets/menu/icon-crash.png` | 256x256 PNG, square, transparent or dark background | Rocket / climbing curve motif, matches Crash's palette (`--bg: #161648`, accent `#7667ff`, cta gradient `#7b3ff0` to `#3ecfff`) |
| HOTLINE tile icon | `public/assets/menu/icon-hotline.png` | 256x256 PNG, square, transparent or dark background | Hotline Miami neon motif (rotary phone / animal mask); the tile is disabled and may be desaturated by CSS |

Displayed at roughly 64-96 CSS px. Keep important content within the center 80% so rounded corners do not clip it. The plan should include a `checkpoint:human-action` step that asks for exactly these two files and states that the tiles are built to render without them until they arrive.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | build/test | yes | v24.18.0 | - |
| npm / Vite / Vitest / tsc | build/test | yes (installed) | per package.json | - |
| Modern browser for manual smoke | leak/mute/seed checks | assumed available on the dev machine | - | Use the `cursor-ide-browser` MCP for a smoke pass if available |

No missing blocking dependencies.

## Security Domain

`security_enforcement` is not set in `.planning/config.json` (absent = enabled). This is a client-only demo with no auth, sessions, or network calls beyond static assets.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | - |
| V3 Session Management | no | - |
| V4 Access Control | no | - |
| V5 Input Validation | yes (query string `?seed=`, localStorage values) | `parseBootSeed` length and control-char checks (existing); `loadMutePref` accepts only `"1"` / `"0"` for the migrated value |
| V6 Cryptography | no | - |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| DOM injection via `?seed=` or stored values rendered into HTML | Tampering | Menu is built with `createElement` / `textContent`; never render the seed; add a `.innerHTML` ban test for `src/shell/**` |
| localStorage unavailable (private mode) | DoS (feature) | Existing memory fallback in `mutePref.ts`; the migrate path stays inside the same try/catch |

## Sources

### Primary (HIGH confidence, read this session)
- `D:/pixi/casino-pixi-portfolio/src/main.ts`, `src/games/crash/view/mountCrashView.ts`, `CrashScene.ts`, `Rocket.ts`, `src/games/crash/hud/CrashHud.ts`, `src/shared/audio/*`, `src/shared/boot/parseBootSeed.ts`, `index.html`, `src/styles/hud.css`, `tests/shell.hud-layout.test.ts`, `tests/walkingSkeleton.test.ts`, `tests/architecture.no-pixi.test.ts`, `vitest.config.ts`, `vite.config.ts`, `tsconfig.json`, `package.json`
- `node_modules/pixi.js/lib/scene/sprite-animated/AnimatedSprite.mjs` (ticker subscription and destroy), `node_modules/pixi.js/lib/app/ResizePlugin.mjs` (`resizeTo` setter and `resize`), `node_modules/pixi.js/lib/app/TickerPlugin.mjs` (`start` / `stop`)
- Command output: `npx vitest run` (3 failed | 150 passed), `npx tsc --noEmit` (Rocket.ts TS2561), `npm view pixi.js version` (8.22.0), `node --version` (v24.18.0)

### Secondary (MEDIUM confidence)
- Project skills `pixijs-application`, `pixijs-ticker`, `pixijs-scene-container` descriptions (start/stop lifecycle, destroy options) used as pointers only; behavior confirmed against installed sources where cited.

### Tertiary (LOW confidence)
- Detached-canvas context behavior, `BitmapText` destroy side effects, `Ticker.shared.count`, TTF glyph coverage (see Assumptions Log)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new packages, all in repo
- Architecture: HIGH - derived from reading every file touched; leak sources verified in Pixi sources
- Pitfalls: HIGH for 1-7, 10; MEDIUM for 8-9 (marked assumed, with a manual verification step)

**Research date:** 2026-10-09
**Valid until:** 30 days (stack is pinned; only repo changes invalidate it)

## Project Constraints (from AGENTS.md)

No `.cursor/rules/` directory exists (checked). `AGENTS.md` directives that bind this phase:
- Stack: PixiJS v8 (`8.21.0` pinned), TypeScript, Vite, Vitest; match Crash `logic` / `view` / `hud` patterns with shared audio / rng / money.
- DOM menu, no React / Vue / Preact.
- Client-only; no backend.
- Art pipeline: ask the user for assets with a clear list (D-07 list above); user places files.
- Code comments: lowercase, no trailing period, no special symbols (arrows, em dashes, etc.).
- Portfolio voice: minimal AI fingerprints in code, copy, commit messages; short human phrasing for menu copy.
- Font: Retro Computer TTF from `src/shared/fonts/`.
- Scope: HOTLINE only as a disabled stub; menu must leave room for more games (registry array).
- GSD workflow: file edits happen through a GSD command (plan / execute), not ad hoc.

## Suggested Plan Slicing (for the planner)

Walking skeleton first: shell -> Crash -> menu loop, thin but end to end.

1. **Wave 0 / foundations (parallel safe):**
   a. Baseline repair (Rocket interface, sessionStats alignment) so `tsc` and the suite are green.
   b. `mutePref` rename + migrate + tests (SHELL-03 foundation, D-16).
   c. `src/shell/types.ts`, `gameRegistry.ts`, `router.ts` + `router.test.ts` (fake sessions: dispose once, epoch guard, double launch, mount throws, same audio and seed across launches).
2. **Crash decomposition (depends on 1c for types):** `CrashHud.dispose()`, `CrashScene.destroy()`, `mountCrashView(app)`, `mountCrashSession` (moved `main.ts` body), `index.html` template with Menu button, layout test updates. Keep a manual checklist: launch, leave mid-round, relaunch x5; Space key does nothing on the menu; `Ticker.shared` listener count back to baseline.
3. **Menu + boot + chrome:** `mountMenu`, `muteBinding`, CSS (`@font-face`, tiles, chip, `.menu-back`), `bootShell`, thin `main.ts`, page title, subtitle copy, icon asset checkpoint (D-07), `.innerHTML` ban test for `src/shell/**`, HMR dispose.
4. **Verification:** map the five success criteria to checks: (1) menu lists Crash and disabled HOTLINE, Crash launches; (2) router dispose test plus manual ticker and key check; (3) mute round-trip test plus manual; (4) title and menu subtitle present (string test on `index.html` / menu source); (5) `?seed=abc` twice in a fresh load gives the same first `crashAt` (logic test plus manual two-hop check).
