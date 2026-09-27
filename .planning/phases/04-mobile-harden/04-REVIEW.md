---
phase: 04-mobile-harden
reviewed: 2026-09-27T15:35:00Z
depth: standard
files_reviewed: 7
files_reviewed_list:
  - src/styles/hud.css
  - index.html
  - src/games/crash/hud/chromeMode.ts
  - src/games/crash/hud/chromeMode.test.ts
  - src/games/crash/hud/CrashHud.ts
  - src/games/crash/view/mountCrashView.ts
  - src/main.ts
findings:
  critical: 0
  warning: 2
  info: 5
  total: 7
status: issues
---

# Phase 04: Code Review Report

**Reviewed:** 2026-09-27T15:35:00Z
**Depth:** standard
**Files Reviewed:** 7
**Status:** issues

## Summary

Phase 04 Mobile Harden lands the ARCH-03 shell contract cleanly: fixed `--hud-bar-height: 15.5rem` on ≤720px with leftover flex for `#game-canvas-host`, canvas `pointer-events: none` + HUD `z-index: 1`, phase-driven `hud-bar--promote-cashout` (not `canCashOut`), `viewport-fit=cover` + `env(safe-area-inset-*)`, and host-scoped orientation/`visualViewport` refresh with HMR `dispose`. Pure `chromeModeFrom` + unit table are solid. No new critical money/security defects in this scope. Two warnings: synchronous `orientationchange` resize before layout settle, and listener leak if `createCrashScene` throws after listeners attach.

## Critical Issues

None in Phase 04 reviewed files.

_Prior open (out of this wave’s implementation, still playable): `resetWallet` / locked-bet free payout (Phases 1–3 CR-01) — `CrashHud` still wires Reset demo to `game.resetWallet()` without clearing stake. Not re-scored here as a Phase 04 finding._

## Warnings

### WR-01: `orientationchange` refresh runs before layout settles

**File:** `src/games/crash/view/mountCrashView.ts:34-43`
**Issue:** `refresh` calls `app.resize()` (and optional resolution update) synchronously on `orientationchange`. On many mobile browsers that event fires before the `#game-canvas-host` flex box has new `clientWidth`/`clientHeight`, so ResizePlugin can measure a stale host and leave a wrong buffer until a later `visualViewport` resize (if any). Project PITFALLS call for deferred / queued re-layout after orientation change; RESEARCH Pattern 6 omits the deferral.
**Fix:** Defer at least one frame (or a short timeout) on orientation only; keep `visualViewport` resize immediate:

```typescript
const refresh = (): void => {
  const next = Math.min(window.devicePixelRatio || 1, 2);
  if (app.renderer.resolution !== next) {
    app.renderer.resolution = next;
  }
  app.resize();
};
const onOrientation = (): void => {
  requestAnimationFrame(() => requestAnimationFrame(refresh));
};
window.addEventListener("orientationchange", onOrientation);
vv?.addEventListener("resize", refresh);
// dispose: remove onOrientation / vv resize accordingly
```

### WR-02: Listeners attach before `createCrashScene` — mount failure leaks

**File:** `src/games/crash/view/mountCrashView.ts:41-51`
**Issue:** `orientationchange` / `visualViewport` listeners are registered, then `createCrashScene(app)` runs. If scene construction throws, `dispose` is never returned to `main`, listeners stay on `window`/`visualViewport`, and the live `Application` is not destroyed. Uncommon path, but Phase 04 added the only global listeners in this mount.
**Fix:** Create the scene before registering listeners, or wrap in `try/catch` that calls the same remove + `app.destroy` path on failure:

```typescript
const scene = createCrashScene(app);
window.addEventListener("orientationchange", refresh);
vv?.addEventListener("resize", refresh);
return { app, scene, dispose };
```

## Info

### IN-01: Safe-area padding sits inside the fixed 15.5rem budget

**File:** `src/styles/hud.css:1-4`, `54-58`, `228-234`
**Issue:** Global `box-sizing: border-box` means `padding-bottom: max(0.75rem, env(safe-area-inset-bottom))` (and side insets) consume the locked `--hud-bar-height` rather than extending the bar. On home-indicator devices the usable chrome shrinks; `overflow-y: auto` is the intended escape (D-03). Human QA (04-03) passed without a ±1rem tweak — acceptable, but worth remembering if a taller inset device clips Cash out above the bar fold.
**Fix:** Optional: reserve safe-area outside the content budget (`height: calc(var(--hud-bar-height) + env(...))` with content area fixed, or pad `.app-shell` instead). Only if a real device shows clipping.

### IN-02: Resize listener teardown is HMR-only in production

**File:** `src/main.ts:27-35`, `src/games/crash/view/mountCrashView.ts:45-48`
**Issue:** `dispose()` correctly removes orientation/`visualViewport` listeners, but `main` only invokes it under `import.meta.hot.dispose`. Cold loads never unregister (same SPA-demo lifecycle as Phase 3). Acceptable for a single-page portfolio shell; listeners are cheap but permanent for the page lifetime.
**Fix:** Expose a shell-level `destroy` if a future host remounts the game without full navigation.

### IN-03: Promote mode de-emphasizes waiting controls below 44px

**File:** `src/styles/hud.css:211-217`
**Issue:** Under `.hud-bar--promote-cashout`, place-bet / chips / bet-input / auto-CO drop to `min-height: 2rem` (32px) while Cash out is `2.875rem` full-width. Matches D-06 / 04-02 discretion (“smaller but visible”); waiting defaults remain `2.75rem`. Not a contract break — document so QA does not treat 32px mid-flight chips as a regression against the waiting ≥44px rule.
**Fix:** None required unless product wants mid-flight chips ≥44px too.

### IN-04: `CrashHud` promote class toggle has no DOM unit test

**File:** `src/games/crash/hud/CrashHud.ts:154-158`, `src/games/crash/hud/chromeMode.test.ts`
**Issue:** `chromeModeFrom` is fully table-tested; the binder’s `root.classList.toggle("hud-bar--promote-cashout", …)` and “disabled Cash out still promoted” path rely on grep + manual QA. Low risk given the one-liner and D-08 CSS comment, but a happy-dom mount + `render({ phase: "cashed_out", … })` would lock the class contract.
**Fix:** Optional smoke: mount fixture HUD → render flying / cashed_out / waiting → assert class presence.

### IN-05: Dual stylesheet ownership unchanged

**File:** `index.html:10`, `src/main.ts:4`
**Issue:** Carry-forward from Phase 2 IN-02: `hud.css` is both `<link>`ed and imported from `main.ts`. Vite applies rules twice (idempotent). Phase 04 touches the same CSS heavily; single ownership would reduce FOUC/bundle confusion later.
**Fix:** Prefer one path (link for no-FOUC **or** JS import for bundling).

## What looks good

- **ARCH-03 chrome budget:** `@media (max-width: 720px)` locks `--hud-bar-height: 15.5rem` with `flex: 0 0` / `height` / `max-height`; `.canvas-host` keeps `flex: 1 1 auto; min-height: 0`. Desktop bar stays content-sized.
- **Hit isolation:** `pointer-events: none` on `.canvas-host` and `canvas`; `.hud-bar` `position: relative; z-index: 1`. HTML siblings (not canvas children) so controls remain hittable without `pointer-events: auto` hacks.
- **Promote chrome (D-05–D-08):** Pure `chromeModeFrom(phase)`; `CrashHud` toggles from `snap.phase` only; enablement still owns `cashOut.disabled`. CSS promotes Cash out full-width independently of `:disabled`.
- **Safe-area / viewport:** `viewport-fit=cover`; bar pads left/right/bottom with `max(base, env(safe-area-inset-*))`; no incorrect top pad on the bottom bar.
- **Resize harden:** Still `resizeTo: host` + DPR cap 2; no second `resizeTo: window` path; `dispose` wired before `app.destroy` on HMR.
- **Tests:** `chromeMode.test.ts` covers flying/cashed_out/waiting/crashed and the full `Phase` union without inventing `idle`.

---

_Reviewed: 2026-09-27T15:35:00Z_
_Reviewer: Composer (gsd-code-reviewer)_
_Depth: standard_
