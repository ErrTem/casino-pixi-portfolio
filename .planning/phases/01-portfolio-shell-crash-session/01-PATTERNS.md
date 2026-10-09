# Phase 1: Portfolio Shell + Crash Session - Pattern Map

**Mapped:** 2026-10-09
**Files analyzed:** 24 (12 new, 12 modified)
**Analogs found:** 22 / 24

All analog paths below were checked as git-tracked source.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/shell/types.ts` (new) | model (interfaces) | n/a | `src/shared/audio/AudioPort.ts` | role-match |
| `src/shell/gameRegistry.ts` (new) | config (pure data) | transform | `src/games/crash/logic/config.ts` (`CRASH_CONFIG`) | role-match |
| `src/shell/gameRegistry.test.ts` (new) | test | transform | `src/games/crash/hud/autoBet.test.ts` | exact |
| `src/shell/router.ts` (new) | service (pure state machine) | event-driven | `src/games/crash/hud/autoBet.ts` (pure decision fn, no DOM) | role-match |
| `src/shell/router.test.ts` (new) | test | event-driven | `src/shared/audio/mutePref.test.ts` (injectable fake) | role-match |
| `src/shell/bootShell.ts` (new) | provider (boot / wiring) | request-response | `src/main.ts` (current boot) | exact |
| `src/shell/menu/mountMenu.ts` (new) | component (DOM) | event-driven | `src/games/crash/hud/CrashHud.ts` (`mountCrashHud`) | role-match |
| `src/shell/muteBinding.ts` (new) | utility (DOM binder) | event-driven | `src/games/crash/hud/CrashHud.ts` lines 184-189, 426-435 | exact |
| `src/games/crash/session/mountCrashSession.ts` (new) | service (session adapter) | event-driven (tick loop) | `src/main.ts` (body moves verbatim) | exact |
| `src/main.ts` (modify) | config (entry) | request-response | self (HMR block lines 82-92) | exact |
| `src/games/crash/hud/CrashHud.ts` (modify: add `dispose`) | component | event-driven | self (`cancelBalanceTween`, keydown handler) | exact |
| `src/games/crash/view/CrashScene.ts` (modify: add `destroy`) | component | event-driven | self (`createCrashScene` stage wiring) | exact |
| `src/games/crash/view/mountCrashView.ts` (modify: take `app`) | provider | request-response | self (listener + `dispose` shape) | exact |
| `src/games/crash/view/Rocket.ts` (modify: baseline interface fix) | component | transform | self (returns `setBodyTexture` at line 113) | exact |
| `src/games/crash/hud/sessionStats.ts` (modify: baseline fix) | utility | transform | `src/games/crash/hud/format.ts` (`formatMult` uses the multiplication sign) | role-match |
| `src/shared/audio/mutePref.ts` (modify: key rename + migrate) | utility | CRUD (localStorage) | self | exact |
| `src/shared/audio/mutePref.test.ts` (modify) | test | CRUD | self (`memoryStore` helper) | exact |
| `index.html` (modify: template + menu button + title) | config (markup) | n/a | self | exact |
| `tests/shell.hud-layout.test.ts` (modify) | test | file-I/O (string parse) | self (`innerById`, `hasAttr`) | exact |
| `tests/architecture.no-pixi.test.ts` (modify: scan `src/shell`) | test | file-I/O | self (`collectTsFiles`, `INNER_HTML_USE`) | exact |
| `src/styles/hud.css` (modify: font-face, menu, chip, menu-back) | config (styles) | n/a | self (`.mute-toggle, .reset-demo` group, `.top-chrome` safe-area) | exact |
| `public/assets/menu/icon-crash.png`, `icon-hotline.png` (new, user supplied) | asset | static | `ROCKET_ASSET_URLS` in `Rocket.ts` (path convention only) | convention-only |
| `src/shell/**` `.innerHTML` ban test (new or inside architecture test) | test | file-I/O | `tests/architecture.no-pixi.test.ts` lines 120-130 | exact |
| `src/shell/bootShell.test.ts` (optional) | test | event-driven | none | no analog |

## Pattern Assignments

### `src/shell/types.ts` (model, interfaces only)

**Analog:** `src/shared/audio/AudioPort.ts` (small interface-only module, doc comments lowercase)

**Core pattern** (AudioPort.ts lines 1-10):
```typescript
/** key SFX demo events */
export type SfxEvent = "bet_lock" | "takeoff" | "cash_out" | "crash";

export interface AudioPort {
  play(event: SfxEvent): void;
  setMuted(muted: boolean): void;
  isMuted(): boolean;
  unlock(): void;
  dispose(): void;
}
```
Use `import type { AudioPort } from "../shared/audio/AudioPort.js"` (relative paths with `.js` suffix everywhere in this repo). `ShellContext`, `GameSession`, `GameDefinition` come from RESEARCH Pattern 1. Comments: lowercase, no trailing period.

---

### `src/shell/gameRegistry.ts` (config, pure data)

**Analog:** `src/games/crash/logic/config.ts` (`CRASH_CONFIG` frozen-style const). Registry is an ordered readonly array: crash first, hotline second (D-08). The crash entry's `mount` is `mountCrashSession`; hotline has `enabled: false` and no `mount`. Icon URLs follow the root-relative convention.

**Asset URL convention** (`src/games/crash/view/Rocket.ts` lines 10-13):
```typescript
export const ROCKET_ASSET_URLS = [
  "/assets/rocket/ship-1.png",
  "/assets/rocket/ship-2.png",
] as const;
```
Use `/assets/menu/icon-crash.png` and `/assets/menu/icon-hotline.png`.

Registry stays free of `document` / `window`. `src/shell` may import `pixi.js` types, but keep `gameRegistry.ts` and `router.ts` pixi-free so node Vitest loads them without WebGL.

---

### `src/shell/router.ts` (service, pure state machine, event-driven)

**Analog:** `src/games/crash/hud/autoBet.ts` + `autoBet.test.ts` (pure function module, tested in node without DOM). The router has no repo analog for epoch guards, so take the code from RESEARCH Pattern 2 (lines 230-266 of 01-RESEARCH.md).

**Dependency-injection style to copy** (`mutePref.ts` takes an optional injectable store, lines 41-47):
```typescript
export function loadMutePref(store?: MuteStore): boolean {
  try {
    const s = resolveStore(store);
    return s.getItem(MUTE_STORAGE_KEY) === "1";
  } catch {
    return memoryFallback.get(MUTE_STORAGE_KEY) === "1";
  }
}
```
Router takes `deps` (`games`, `showMenu`, `buildContext`) the same way, so tests inject fakes.

**Requirements from research to add:** `launching` flag against double click, try/catch around `mount` that falls back to `goMenu()` and `console.error`, idempotent `dispose()`.

---

### `src/shell/router.test.ts` (test, event-driven)

**Analog:** `src/shared/audio/mutePref.test.ts` (fake collaborator + vitest `it` blocks) and `src/games/crash/hud/autoBet.test.ts` (`describe` / `it` with descriptive names).

**Imports and fake pattern** (mutePref.test.ts lines 1-19):
```typescript
import { expect, it } from "vitest";
import {
  MUTE_STORAGE_KEY,
  loadMutePref,
  saveMutePref,
  type MuteStore,
} from "./mutePref.js";

function memoryStore(initial: Record<string, string> = {}): MuteStore {
  const map = new Map<string, string>(Object.entries(initial));
  return {
    getItem(key: string): string | null {
      return map.has(key) ? (map.get(key) as string) : null;
    },
    setItem(key: string, value: string): void {
      map.set(key, value);
    },
  };
}
```
Build `fakeSession()` returning `{ dispose }` with a call counter, and `fakeAudio(): AudioPort` with a stable identity. Cases: dispose exactly once, leave before mount resolves (epoch guard), leave after, double launch, mount throws restores menu, same `ctx.seed` string and same `ctx.audio` instance across launches, mute state survives two cycles. Vitest env is `node` (`vitest.config.ts` includes `src/**/*.test.ts`), so no DOM.

---

### `src/shell/bootShell.ts` (provider, boot wiring)

**Analog:** `src/main.ts` (exact: this is today's boot, re-homed).

**Imports pattern** (main.ts lines 1-17):
```typescript
import { createBeepAudioPort } from "./shared/audio/createBeepAudioPort.js";
import { loadMutePref } from "./shared/audio/mutePref.js";
import { parseBootSeed } from "./shared/boot/parseBootSeed.js";
import "./styles/hud.css";
```
(paths become `../shared/...` from `src/shell/`).

**Boot sequence to copy** (main.ts lines 20-29):
```typescript
const hudRoot = document.querySelector("#app");
if (!hudRoot) throw new Error("#app missing");
...
const { seed } = parseBootSeed(window.location.search);
const audio = createBeepAudioPort({ muted: loadMutePref() });
```
Keep the `throw new Error("... missing")` guard style for `#app`. Call `parseBootSeed` and `loadMutePref` exactly once.

**App init options** (mountCrashView.ts lines 18-27), moved here minus `resizeTo`:
```typescript
const app = new Application();
await app.init({
  resizeTo: host,            // drop: set per launch
  background: VIEW_CONFIG.BACKGROUND,
  antialias: true,
  autoDensity: true,
  resolution: Math.min(window.devicePixelRatio || 1, 2),
  preference: "webgl",
  autoStart: true,           // follow with app.stop() after init (D-04)
  sharedTicker: false,
});
```
Then `app.ticker.minFPS = 10;` (from main.ts line 37) once, and `app.stop()`.

**Shell dispose (HMR)** copies main.ts lines 82-92 (see `src/main.ts` entry below).

---

### `src/shell/menu/mountMenu.ts` (component, DOM, event-driven)

**Analog:** `src/games/crash/hud/CrashHud.ts` (`mountCrashHud`): plain DOM binder that takes a root, queries by `data-*`, throws on missing required nodes, uses `addEventListener`, returns an object.

**Required-node guard** (CrashHud.ts lines 108-124):
```typescript
if (
  !resetBtn ||
  !statusEl ||
  ...
  panelRoots.length !== 2
) {
  throw new Error("CrashHud: required shell / #hud-bar fields missing");
}
```
Menu builds its own nodes (no template), so use `createElement` / `textContent` / `setAttribute` only (never `.innerHTML`; see architecture ban). Return `{ dispose }` that removes listeners and the wrapper element.

**Markup rules:** wrapper `<main class="app-shell menu-screen">`; tile `<button type="button" class="menu-tile" data-game="crash">`; disabled tile: `disabled` + `aria-disabled="true"` + `<span class="menu-tile__chip">Coming soon</span>`; mute button reuses the `.mute-toggle` class and `data-action="mute"`. Icon `<img alt="">` with `onerror` that hides the image.

---

### `src/shell/muteBinding.ts` (utility, DOM binder, event-driven)

**Analog:** `src/games/crash/hud/CrashHud.ts` (exact; copy these two blocks).

**Label sync** (CrashHud.ts lines 184-189):
```typescript
function syncMuteLabel(): void {
  if (!mute || !audio) return;
  const muted = audio.isMuted();
  mute.textContent = muted ? "Sound: Off" : "Sound: On";
  mute.setAttribute("aria-pressed", muted ? "true" : "false");
}
```
**Click handler** (CrashHud.ts lines 426-435):
```typescript
if (mute && audio) {
  mute.addEventListener("click", () => {
    audio.unlock();
    const next = !audio.isMuted();
    audio.setMuted(next);
    saveMutePref(next);
    syncMuteLabel();
  });
  syncMuteLabel();
}
```
New helper `bindMuteButton(btn, audio): () => void` returns an unbind function (menu `dispose` calls it). Keep the exact label strings so Crash and menu match. Import `saveMutePref` from `../shared/audio/mutePref.js`. Leave CrashHud's own mute code unchanged.

---

### `src/games/crash/session/mountCrashSession.ts` (service, session adapter, tick loop)

**Analog:** `src/main.ts` (exact). Move lines 12-81 nearly verbatim; replace `host` lookup and `mountCrashView(host)` with the shell-owned `ctx.app`.

**Imports** (main.ts lines 1-14, re-pathed): `sfxEventsFromTransition`, `shouldAutoPlaceBet`, `mountCrashHud`, `CRASH_CONFIG`, `BET_SLOT_IDS`, `createGame`, `type BetSlotId`, `type CrashSnapshot`, `mountCrashView`.

**Constant and per-launch game** (main.ts lines 16, 25-26):
```typescript
const DISPLAY_MIN = CRASH_CONFIG.minBetCents / 100;
...
const game = createGame({ seed });   // seed now comes from ctx.seed
```

**Tick body to move verbatim** (main.ts lines 31-80):
```typescript
let prevSnap: CrashSnapshot | null = game.getSnapshot();
const prevAutoBetOn: [boolean, boolean] = [hud.isAutoBetOn(0), hud.isAutoBetOn(1)];
hud.render(prevSnap);

const onTick = (ticker: { deltaMS: number }): void => {
  game.tick(ticker.deltaMS);
  let snap = game.getSnapshot();
  for (const event of sfxEventsFromTransition(prevSnap, snap)) {
    audio.play(event);
  }
  // per slot auto bet placeBet
  for (const slot of BET_SLOT_IDS) { /* shouldAutoPlaceBet ... hud.stopAutoBet(...) */ }
  prevSnap = snap;
  hud.render(snap);
  scene.sync(snap, ticker.deltaMS);
};
app.ticker.add(onTick);
```
Drop `app.ticker.minFPS = 10` (moves to boot).

**Dispose pattern** (idempotent, adapted from main.ts HMR block lines 83-91, ordered per RESEARCH Pattern 3):
```typescript
import.meta.hot.dispose(() => {
  app.ticker.remove(onTick);
  audio.dispose();          // NOT in session dispose (D-12)
  dispose();
  app.destroy({ removeView: true, releaseGlobalResources: true }, { children: true }); // NOT in session dispose
});
```
Session dispose = `disposed` flag, then ticker remove, `hud.dispose()`, `scene.destroy()`, view `dispose()`, `app.resizeTo = null`, `app.stop()`, `app.canvas.remove()`, `screen.remove()`.

**Mount order:** clone `<template id="crash-screen-template">` into `ctx.root`, `host.replaceChildren(app.canvas)`, `app.resizeTo = host`, await texture loads (inside `mountCrashView`), cancel check after each `await`, `createGame`, `mountCrashHud(screen, ...)`, wire `[data-action=menu]` to `ctx.requestMenu()` here (not in CrashHud), `app.ticker.add(onTick)`, `app.start()`.

---

### `src/main.ts` (entry, modify)

**Analog:** self. Reduce to boot plus HMR dispose; keep CSS import.

**HMR block to preserve in shape** (lines 82-92):
```typescript
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    ...
  });
}
```
Target shape (RESEARCH): `import "./styles/hud.css"; const disposeShell = bootShell(); if (import.meta.hot) { import.meta.hot.dispose(() => { void disposeShell.then((d) => d()); }); }`. Keep the trailing `void main()` style for the async call (line 95).

---

### `src/games/crash/hud/CrashHud.ts` (add `dispose`)

**Analog:** self.

**Interface to extend** (lines 40-51): add `dispose(): void` after `stopAutoBet`. Return object is at lines 565-575; add `dispose` there.

**Existing cleanup helper to reuse** (lines 146-151):
```typescript
function cancelBalanceTween(): void {
  if (balanceTweenRaf !== 0) {
    cancelAnimationFrame(balanceTweenRaf);
    balanceTweenRaf = 0;
  }
}
```
**Listener to name and remove** (lines 461-473, currently an anonymous arrow on `window`):
```typescript
window.addEventListener("keydown", (e: KeyboardEvent) => {
  if (e.key !== " " && e.key !== "Enter") return;
  ...
  game.requestCashOutAll();
});
```
Change to `const onKeydown = (e: KeyboardEvent): void => {...}; window.addEventListener("keydown", onKeydown);` and in `dispose`: `window.removeEventListener("keydown", onKeydown); cancelBalanceTween(); disposed = true;`. Add a `disposed` guard at the top of `render`. Also note `shell` resolution (lines 99-101) must find the cloned `.app-shell` wrapper so `hud-zone--broke` dies with it.

---

### `src/games/crash/view/CrashScene.ts` (add `destroy`)

**Analog:** self.

**Interface** (lines 34-36): extend `CrashScene` with `destroy: () => void`.

**Stage wiring to undo** (line 110):
```typescript
app.stage.addChild(backdrop.container, world, theater.container, flash);
```
Return (line 385) becomes `{ sync, destroy }`. `destroy` removes those four from `app.stage` and calls `.destroy({ children: true })` on each (default `texture: false` so cached Assets textures survive). That ends `AnimatedSprite` `autoUpdate: true` subscriptions on `Ticker.shared` (Rocket.ts line 55, Explosion.ts line 37). Do not use `Assets.load` here (architecture test T-03-08 bans it in this file).

---

### `src/games/crash/view/mountCrashView.ts` (take `app`)

**Analog:** self.

**Current signature and result** (lines 8-14):
```typescript
export interface MountedCrashView {
  app: Application;
  scene: CrashScene;
  dispose: () => void;
}
export async function mountCrashView(host: HTMLElement): Promise<MountedCrashView> {
```
New: `mountCrashView(app: Application)` returning `{ scene, dispose }`. Delete `new Application()`, `app.init(...)`, `host.replaceChildren(...)`, `app.resize()` (lines 17-29, session now does these).

**Keep the listener and dispose pair** (lines 31-45):
```typescript
const refresh = (): void => {
  const next = Math.min(window.devicePixelRatio || 1, 2);
  if (app.renderer.resolution !== next) { app.renderer.resolution = next; }
  app.resize();
};
window.addEventListener("orientationchange", refresh);
const vv = window.visualViewport;
vv?.addEventListener("resize", refresh);
const dispose = (): void => {
  window.removeEventListener("orientationchange", refresh);
  vv?.removeEventListener("resize", refresh);
};
```
**Keep the texture loading shape** (lines 47-60) using the existing helpers only:
```typescript
const [{ cloudTextures, treeTextures }, rocketTextures, explosionTextures] =
  await Promise.all([loadBackdropTextures(), loadRocketTextures(), loadExplosionTextures()]);
```
Race note: if the session is cancelled during this `await`, `dispose` listeners are already registered; the session must call `dispose()` on cancel.

---

### `src/games/crash/view/Rocket.ts` (baseline fix, Wave 0)

**Analog:** self. Interface (lines 15-25) declares `setBodyTextures` only; the factory returns `setBodyTexture` at line 113 (`return { container, setBodyTextures, setBodyTexture, syncPose };`). Add `setBodyTexture: (texture: Texture | null) => void;` to `interface Rocket`. The architecture test also asserts `Rocket` exposes `setBodyTexture`.

---

### `src/games/crash/hud/sessionStats.ts` (baseline fix, Wave 0)

**Analog:** `src/games/crash/hud/format.ts` (`formatMult` uses the multiplication sign). Align `sessionStats.ts:9` (`${n.toFixed(2)}x`) with `sessionStats.test.ts` expectations (`"3.00×"`); check the empty-label expectation (`-` vs test) while editing. Non-gameplay fix, flag as such in the plan.

---

### `src/shared/audio/mutePref.ts` (key rename + migrate)

**Analog:** self (exact). Edit lines 1, 41-52, and the doc comment at 54-57.

**Current key and store shape** (lines 1-6):
```typescript
export const MUTE_STORAGE_KEY = "crash-demo:mute";
export interface MuteStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
```
Target (RESEARCH Pattern 7): `MUTE_STORAGE_KEY = "portfolio-demo:mute"`, add `LEGACY_MUTE_STORAGE_KEY = "crash-demo:mute"`, and in `loadMutePref` prefer new key, else read legacy `"1"|"0"`, write it to the new key, return it. Keep everything inside the existing `try`/`catch` with `memoryFallback`. Do not add `removeItem` to `MuteStore` (keeps injectable-store tests intact). The file must stay free of `document.` / `window.` (use `globalThis`, already the case) because `src/shared` is scanned by the architecture test.

**Save path unchanged** (lines 58-65):
```typescript
export function saveMutePref(muted: boolean, store?: MuteStore): void {
  const value = muted ? "1" : "0";
  try {
    resolveStore(store).setItem(MUTE_STORAGE_KEY, value);
  } catch {
    memoryFallback.set(MUTE_STORAGE_KEY, value);
  }
}
```

---

### `src/shared/audio/mutePref.test.ts` (modify)

**Analog:** self. Rename titles at lines 21 and 27 (`crash-demo:mute` in the test names; assertions use the constant and follow the rename). Add cases using `memoryStore({ [LEGACY_MUTE_STORAGE_KEY]: "1" })`: migrate "1", migrate "0", new key wins over legacy, malformed legacy ignored, no write when neither key exists. Use the existing `it(...)` / `expect(...).toBe(...)` style and the `memoryStore(initial)` helper (lines 9-19).

---

### `index.html` (modify)

**Analog:** self.

- Lines 12-13 `<div id="app" class="app-shell">` becomes `<div id="app"></div>`; the markup from `<header id="top-chrome">` (line 14) to the end of `<footer id="hud-bar">` (line 282) moves inside `<template id="crash-screen-template">` wrapped in `<div id="crash-screen" class="app-shell crash-screen">`.
- Keep every id and `data-*` attribute exactly (layout test string-parses them).
- Add the Menu button inside `.top-chrome__actions` (lines 23-35) beside reset and mute, matching their markup:
```html
<button type="button" data-action="reset-wallet" class="reset-demo">Reset demo</button>
<button type="button" data-action="mute" class="mute-toggle" aria-pressed="false">Sound: On</button>
```
  New: `<button type="button" data-action="menu" class="menu-back">Menu</button>`.
- Keep `<p class="canvas-placeholder">Game view</p>` (line 55) inside `#game-canvas-host`.
- `<title>` line 8 (`Crash Demo - Portfolio`) becomes a portfolio-wide string (D-13 voice). Keep `<script type="module" src="/src/main.ts">` (line 284) and the stylesheet link (line 10).

---

### `tests/shell.hud-layout.test.ts` (modify)

**Analog:** self. Reuse `innerById` (lines 10-34) and `hasAttr` (lines 48-52). Because `innerById` is a regex scan of raw `index.html`, existing assertions still find ids inside the `<template>`.

**Existing placement test to extend** (lines 110-117):
```typescript
it("places reset-wallet under #top-chrome and history under #history-band", () => {
  const top = innerById(html, "top-chrome");
  const hist = innerById(html, "history-band");
  expect(hasAttr(top, "action", "reset-wallet")).toBe(true);
  ...
});
```
Add: `hasAttr(top, "action", "menu")` is true; `hasAttr(host, "action", "menu")` is false (add `{ kind: "action", name: "menu" }` to `MONETARY_SELECTORS`-style negative check or a separate assertion on `#game-canvas-host`). Keep `not.toMatch(/seed-chip/)` passing (line 73). Optionally assert `<title>` no longer says "Crash Demo" and a `crash-screen-template` exists.

---

### `tests/architecture.no-pixi.test.ts` (modify)

**Analog:** self.

**Why `src/shell` not `src/shared`** (lines 6-9, 27):
```typescript
const LOGIC_DIRS = [
  join(ROOT, "src", "games", "crash", "logic"),
  join(ROOT, "src", "shared"),
];
const DOM_API = /\b(?:document|window)\s*\./;
```
Shell code needs `document`, so do not add `src/shell` to `LOGIC_DIRS`.

**Add an `.innerHTML` scan for shell** by reusing helpers (lines 33, 38-62, 120-130):
```typescript
const INNER_HTML_USE = /\.innerHTML\b/;
function collectTsFiles(dir: string): string[] { ... }
function readRel(file: string): { rel: string; src: string; code: string } { ... }

it("view theater sources ban .innerHTML usage (T-03-07)", () => {
  const violations: string[] = [];
  for (const file of THEATER_FILES) {
    const { rel, code } = readRel(file);
    if (INNER_HTML_USE.test(code)) violations.push(`${rel}: forbidden .innerHTML usage`);
  }
  expect(violations, violations.join("\n")).toEqual([]);
});
```
New test: `collectTsFiles(join(ROOT, "src", "shell"))` plus `src/games/crash/session`, same violation loop. The existing T-03-08 test (`NO_ASSETS_LOAD_FILES`, lines 11-15) already covers `CrashScene.ts` and `mountCrashView.ts`; keep those files free of `Assets.load`.

---

### `src/styles/hud.css` (modify)

**Analog:** self.

**Shell container** (lines 57-65):
```css
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  max-width: 100%;
  background: var(--bg);
}
```
Keep on the crash wrapper and the menu wrapper; `#app` becomes a plain block. Grep `#app` in `hud.css` before editing (none matched in a quick scan).

**Safe-area padding to reuse for menu header** (lines 74-77):
```css
padding-top: max(0.65rem, env(safe-area-inset-top));
padding-left: max(0.75rem, env(safe-area-inset-left));
padding-right: max(0.75rem, env(safe-area-inset-right));
```
**Button group to extend with `.menu-back`** (lines 679-697) and focus group (lines 438-445):
```css
.mute-toggle,
.reset-demo {
  padding: 0.35rem 0.7rem;
  font-size: 0.75rem;
  font-weight: 600;
  min-height: 2.25rem;
  white-space: nowrap;
  border: 0;
  border-radius: var(--radius-pill);
  background: var(--card);
  color: var(--text);
  cursor: pointer;
  touch-action: manipulation;
}
.mute-toggle:not(:disabled):hover,
.reset-demo:not(:disabled):hover { background: var(--border); }
```
Add `.menu-back` to all three selector lists (`:focus-visible` at 439-440, base at 679-680, hover at 694-695). Tokens to reuse for tiles: `--card`, `--border`, `--radius-card`, `--radius-pill`, `--muted`, `--text`. Chip can mirror the pill look. Add `@font-face` for `../shared/fonts/retrocomputerrusbydaymarius.ttf` (`font-display: swap`) and a `.menu-title` rule using it. Existing `body` font is `"Segoe UI", system-ui, sans-serif` (line 44), leave it.

---

### `public/assets/menu/icon-crash.png`, `icon-hotline.png` (asset, user supplied)

No code analog beyond the root-relative path convention (`/assets/rocket/...`). Existing dirs under `public/assets`: `clouds`, `explosion`, `rocket`, `trees`. Plan needs a `checkpoint:human-action` step (spec in RESEARCH "Asset List"). Menu must render acceptably without the files.

---

## Shared Patterns

### Imports with `.js` suffix, type-only imports
**Source:** `src/main.ts` lines 1-14
**Apply to:** every new `.ts` file
```typescript
import { createBeepAudioPort } from "./shared/audio/createBeepAudioPort.js";
import { type BetSlotId, type CrashSnapshot } from "./games/crash/logic/index.js";
```
Relative imports always end in `.js`; use `import type` / inline `type` for interfaces.

### Throw on missing DOM requirement
**Source:** `src/main.ts` lines 20-23 and `CrashHud.ts` lines 118-125
**Apply to:** `bootShell.ts`, `mountCrashSession.ts`, `mountMenu.ts`
```typescript
if (!hudRoot) throw new Error("#app missing");
...
throw new Error("CrashHud: data-action=mute required when audio is provided");
```
Message format is `<module>: <what is missing>` or `<selector> missing`.

### Idempotent dispose that never touches shell-owned resources
**Source:** `src/shared/audio/createBeepAudioPort.ts` lines 116-127 (`disposed` flag early return) and `mountCrashView.ts` lines 41-44
**Apply to:** router, menu, Crash session, `CrashHud.dispose`, `CrashScene.destroy`
```typescript
dispose(): void {
  if (disposed) return;
  disposed = true;
  ...
}
```
Anti-pattern: a session calling `audio.dispose()` (sets `disposed = true` permanently, all later `play` / `unlock` silently no-op; breaks D-12) or `app.destroy()`.

### Shared mute preference (single source of truth is `audio.isMuted()`)
**Source:** `CrashHud.ts` lines 184-189, 426-435; `mutePref.ts`
**Apply to:** menu mute button, Crash mute button
Labels always sync from `audio.isMuted()` at mount; no cross-screen event bus. `loadMutePref()` called once in `bootShell`.

### Pure logic outside DOM, node-testable
**Source:** `tests/architecture.no-pixi.test.ts` lines 63-82; `vitest.config.ts` (`environment: "node"`)
**Apply to:** `router.ts`, `gameRegistry.ts`, `mutePref.ts`
No `document.` / `window.` in `src/shared`; shell DOM code lives in `src/shell`. Tests colocated as `*.test.ts` under `src/` or in `tests/`.

### Test style
**Source:** `src/games/crash/hud/autoBet.test.ts`, `src/shared/audio/mutePref.test.ts`
**Apply to:** all new Vitest files
`import { describe, expect, it } from "vitest";`, descriptive plain-English `it` names, small hand-rolled fakes, no mocking library.

### Comments and copy voice
**Source:** AGENTS.md constraints
**Apply to:** all new code
Comments lowercase, no trailing period, no arrows or em dashes; short human menu copy; no AI-sounding phrasing; no persistent demo banner (D-13), only `<title>` plus one menu subtitle line.

### Tracker and listener leak inventory (what dispose must cancel)
| Leak source | Created at | Cancelled by |
|-------------|-----------|--------------|
| `AnimatedSprite` on `Ticker.shared` | `Rocket.ts:55`, `Explosion.ts:37` (`autoUpdate: true`) | `CrashScene.destroy()` with `{ children: true }` |
| `window` keydown + balance rAF | `CrashHud.ts:461`, `:146-181` | `CrashHud.dispose()` |
| `orientationchange` / `visualViewport` resize | `mountCrashView.ts:36-40` | view `dispose()` called from session dispose |
| `ResizePlugin` window resize + host ref | `app.resizeTo = host` | `app.resizeTo = null` |
| `onTick` on `app.ticker` | session mount | `app.ticker.remove(onTick)` first |

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/shell/router.ts` epoch guard logic | service | event-driven | No async launch or race handling exists in repo; use RESEARCH Pattern 2 code |
| `src/shell/bootShell.test.ts` (optional) | test | event-driven | No test touches Pixi `Application` or DOM; node env, no jsdom or happy-dom, so skip or keep to pure helpers |

## Metadata

**Analog search scope:** `src/`, `tests/`, `index.html`, `vitest.config.ts`, `public/assets`
**Files scanned:** 57 under `src/` plus 12 under `tests/`; 14 read in detail
**Pattern extraction date:** 2026-10-09
