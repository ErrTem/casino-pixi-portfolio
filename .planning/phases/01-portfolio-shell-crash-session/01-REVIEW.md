---
phase: 01-portfolio-shell-crash-session
reviewed: 2026-10-09T17:10:00Z
depth: standard
files_reviewed: 16
files_reviewed_list:
  - src/shell/types.ts
  - src/shell/router.ts
  - src/shell/bootShell.ts
  - src/shell/gameRegistry.ts
  - src/shell/menu/mountMenu.ts
  - src/shell/muteBinding.ts
  - src/shared/audio/mutePref.ts
  - src/games/crash/session/mountCrashSession.ts
  - src/games/crash/hud/CrashHud.ts
  - src/games/crash/hud/sessionStats.ts
  - src/games/crash/view/mountCrashView.ts
  - src/games/crash/view/CrashScene.ts
  - src/games/crash/view/Rocket.ts
  - src/main.ts
  - index.html
  - src/styles/hud.css
findings:
  critical: 0
  warning: 4
  info: 3
  total: 7
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-10-09T17:10:00Z
**Depth:** standard
**Files Reviewed:** 16
**Status:** issues_found

## Summary

Phase 01 shell/router/menu/mute/Crash session code is mostly sound on the happy path: epoch + AbortSignal races are handled, leave teardown order matches architecture gates, menu builds with `createElement`/`textContent` only, and mute migrates `crash-demo:mute` → `portfolio-demo:mute` with exact `1`/`0` parsing. Adversarial review found **no critical/security blockers**, but **four warnings** around error-path and teardown races (partial mount without `session.dispose`, view listener registration order, shell `app.destroy` vs in-flight asset load, mute migrate `setItem` fail-open).

## Warnings

### WR-01: Partial mount throw skips session dispose and leaks CrashHud keydown

**File:** `src/games/crash/session/mountCrashSession.ts:28-57`
**Issue:** Sync work between `ctx.root.append(screen)` and `ctx.signal.addEventListener("abort", …)` can throw (`mountCrashHud` contract failure, missing menu button). The router catch path calls `goMenu()`, which aborts the controller and looks up `session` — but `session` is still `null` because `mount` never returned a handle. Nothing calls the session cleanup, so the cloned crash screen can remain under `#app`, `resizeTo` may stay bound to the host, the canvas may stay reparented, and `CrashHud`'s `window` `keydown` listener (registered inside `mountCrashHud`) is never removed. Router tests only cover mounts that throw with no side effects (`mount reject calls onError`), so this gap is untested.
**Fix:** Register abort cleanup first (or wrap mount body in `try/catch` that always runs the same `dispose` path), and ensure any throw after DOM/HUD side effects still tears down:

```ts
let disposed = false;
let hud: ReturnType<typeof mountCrashHud> | null = null;
// ... append screen, wire canvas ...

const dispose = (): void => {
  if (disposed) return;
  disposed = true;
  ctx.signal.removeEventListener("abort", onAbort);
  // ticker / hud / view / resizeTo / stop / canvas / screen — same order as today
};

const onAbort = (): void => {
  dispose();
};
ctx.signal.addEventListener("abort", onAbort, { once: true });

try {
  hud = mountCrashHud(screen, game, { audio: ctx.audio });
  // menu button + view mount ...
} catch (err) {
  dispose();
  throw err;
}
```

### WR-02: `mountCrashView` can leak window listeners if scene create throws

**File:** `src/games/crash/view/mountCrashView.ts:22-44`
**Issue:** `orientationchange` / `visualViewport.resize` listeners are attached before `createCrashScene`. If scene construction throws, `dispose` is never returned to the session and those listeners stay on `window` for the life of the page.
**Fix:** Attach listeners only after the scene is created, or use `try/finally` so failure always removes them:

```ts
const scene = createCrashScene(app, { /* textures */ });
window.addEventListener("orientationchange", refresh);
vv?.addEventListener("resize", refresh);
return {
  scene,
  dispose() {
    window.removeEventListener("orientationchange", refresh);
    vv?.removeEventListener("resize", refresh);
  },
};
```

### WR-03: Shell teardown can race an in-flight Crash view mount

**File:** `src/shell/bootShell.ts:53-61`, `src/games/crash/session/mountCrashSession.ts:79-85`
**Issue:** `bootShell`'s dispose runs `router.dispose()` then immediately `app.destroy(...)`. If Crash is still inside `await mountCrashView` (asset load), abort/`dispose` runs with `view === null`, then the Application is destroyed. When `Assets.load` resolves, `createCrashScene` runs against a destroyed app before the `if (disposed)` branch destroys the late scene. This mainly hits HMR (`main.ts` hot dispose) today, but any future full-shell teardown during launch has the same race.
**Fix:** Either (a) delay `app.destroy` until in-flight mounts settle (track a launch generation / await router drain), or (b) have `mountCrashView` check a disposed/aborted flag after `Assets.load` and skip `createCrashScene` entirely:

```ts
// after Promise.all textures:
if (ctx.signal.aborted) {
  return { scene: noopScene, dispose: () => {} };
}
```

(Pass `signal` into `mountCrashView`, or check a session-local `disposed` closure before creating the scene.)

### WR-04: Mute migrate can fail open if `setItem` throws after legacy read

**File:** `src/shared/audio/mutePref.ts:53-77`
**Issue:** `loadMutePref` reads a valid legacy `crash-demo:mute` value, then `setItem(portfolio-demo:mute, …)` may throw (quota / private-mode quirks). The outer `catch` falls through to module `memoryFallback`, which does not contain the legacy value from `localStorage`, so the function returns `false` (unmuted) and drops the migrated preference for that boot.
**Fix:** Capture legacy before writing, and on write failure still return/apply that value (and mirror into `memoryFallback`):

```ts
const legacy = parseMuteFlag(s.getItem(LEGACY_MUTE_STORAGE_KEY));
if (legacy !== null) {
  try {
    s.setItem(MUTE_STORAGE_KEY, legacy ? "1" : "0");
  } catch {
    memoryFallback.set(MUTE_STORAGE_KEY, legacy ? "1" : "0");
  }
  return legacy;
}
```

## Info

### IN-01: Empty `catch` in `resolveStore` hides storage probe failures

**File:** `src/shared/audio/mutePref.ts:37-38`
**Issue:** Intentional fallback to in-memory store, but the empty `catch` makes genuine unexpected errors indistinguishable from SecurityError.
**Fix:** Optional: log once in DEV, or catch only known DOMException names.

### IN-02: Crash HUD mute path duplicates `bindMuteButton`

**File:** `src/games/crash/hud/CrashHud.ts:428-436`, `src/shell/muteBinding.ts:16-44`
**Issue:** Menu uses `bindMuteButton`; Crash HUD reimplements unlock/toggle/save/label. Behavior matches today (same `AudioPort` + `saveMutePref`), but future mute UX changes can drift. Called out as intentional in 01-03; track as debt.
**Fix:** Reuse `bindMuteButton(mute, audio)` inside CrashHud when audio is present; keep `dispose` removing the binder return value.

### IN-03: Commented-out blur filter block left in CrashScene

**File:** `src/games/crash/view/CrashScene.ts:112-120`, `203-216`
**Issue:** Large commented motion-blur block adds noise without affecting runtime.
**Fix:** Delete the dead block or restore behind a flagged feature; prefer delete for portfolio tone.

---

_Reviewed: 2026-10-09T17:10:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
