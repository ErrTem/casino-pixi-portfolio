---
phase: 02-hotline-base-playable
reviewed: 2026-10-10T11:50:00Z
depth: standard
files_reviewed: 28
files_reviewed_list:
  - src/games/hotline/config/HotlineConfigSchema.ts
  - src/games/hotline/config/hotline.config.json
  - src/games/hotline/config/loadHotlineConfig.ts
  - src/games/hotline/logic/Wallet.ts
  - src/games/hotline/logic/SpinEngine.ts
  - src/games/hotline/logic/evaluatePaylines.ts
  - src/games/hotline/logic/HotlineGame.ts
  - src/games/hotline/logic/index.ts
  - src/games/hotline/hud/HotlineHud.ts
  - src/games/hotline/hud/format.ts
  - src/games/hotline/hud/lastWinTween.ts
  - src/games/hotline/session/mountHotlineSession.ts
  - src/games/hotline/view/HotlineScene.ts
  - src/games/hotline/view/mountHotlineView.ts
  - src/games/hotline/view/loadHotlineAssets.ts
  - src/games/hotline/view/PhonesLayer.ts
  - src/games/hotline/view/WinLinesOverlay.ts
  - src/games/hotline/view/winCycle.ts
  - src/games/hotline/view/reels/ReelStrip.ts
  - src/games/hotline/view/reels/createReelWindow.ts
  - src/games/hotline/view/reels/reelMotion.ts
  - src/shared/audio/AudioPort.ts
  - src/shared/audio/createBeepAudioPort.ts
  - src/shell/gameRegistry.ts
  - src/styles/hud.css
  - index.html
  - package.json
  - tests/hotline.assets.test.ts
findings:
  critical: 0
  warning: 4
  info: 5
  total: 9
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-10-10
**Depth:** standard
**Files Reviewed:** 28
**Status:** issues_found

## Summary

Scope came from the key-files of the 02-01..02-07 SUMMARY files plus the phase commits (3c61c8d..HEAD). Binary art under `public/assets/hotline/` was not read; the tracked file list matches the loader URLs.

`npx tsc --noEmit` is clean and `npx vitest run` passes (268 tests). No security issues: there is no `eval`, no `innerHTML`, no secrets, and the only external input is bundled JSON parsed by Zod. The payline math, wallet checks and cent rounding trace correctly. I checked the 40 paylines in the config: all 5 long, all rows 0..3, all unique. The reel landing math is consistent between the spin and landing layouts.

The defects are all in session lifecycle and edge handling, not in the math:
- A spin can be accepted before the view exists.
- Several throw paths leave DOM or listeners behind.
- The config schema does not guarantee what the view assumes.

## Warnings

### WR-01: Spin is accepted before the view is mounted, so the math settles with no playback

**File:** `src/games/hotline/session/mountHotlineSession.ts:46-57` (view assigned at `:127`)
**Issue:** `mountHotlineHud` runs at line 72, but `view` is only set after `await mountHotlineView(...)`, which loads about 14 PNGs (the backdrop alone is about 3.3 MB) and a font. If the user clicks SPIN in that window, `hudGame.spin()` skips the `view?.scene.isSpinning()` guard, calls `game.spin()` and deducts the bet. Because `view` is null, `startSpin` and `settleArmed` are skipped. The balance, grid and wins are then committed with no reel animation and no win beep. When the view mounts, `sync` calls `setGrid` with the already settled grid, so the result just appears. It also bypasses the "win hidden until reels stop" rule. The slow-load case is the likeliest to hit.
**Fix:** Refuse spins until the view is ready, using the same quiet empty-reason path as the mid-spin case:
```ts
spin(): SpinResult {
  if (!view || view.scene.isSpinning()) return { ok: false, reason: "" };
  const result = game.spin();
  if (result.ok) {
    ctx.audio.unlock();
    ctx.audio.play("spin");
    settleArmed = true;
    view.scene.startSpin(game.getSnapshot().grid);
  }
  return result;
},
```
You could also mount the hud only after the view resolves, or disable the spin button until then.

### WR-02: Session throw paths before the abort listener leave the screen and canvas in the DOM

**File:** `src/games/hotline/session/mountHotlineSession.ts:30-95` (abort listener registered at `:102`)
**Issue:** `ctx.root.append(screen)` runs at line 31 and `host.replaceChildren(ctx.app.canvas)` plus `ctx.app.resizeTo = host` at lines 38-40. After that, `mountHotlineHud` (line 72, throws on any missing `[data-field]`) and the `data-action=menu` lookup (line 89) can still throw. At those points `dispose`, `onAbort` and the abort listener do not exist yet. The router's catch path calls `goMenu()`, which aborts the signal but cannot reach the session cleanup. The hotline screen stays attached next to the menu and `resizeTo` is left pointing at a detached host.
**Fix:** Register cleanup immediately after `ctx.root.append(screen)`. Hoist `dispose` and `onAbort` above the lookups so every later throw is covered, or wrap the setup in `try { ... } catch (e) { dispose(); throw e; }`.

### WR-03: `mountHotlineView` registers window listeners before the call that can throw

**File:** `src/games/hotline/view/mountHotlineView.ts:30-39`
**Issue:** `window.addEventListener("orientationchange", refresh)` and the `visualViewport` listener are added at lines 30-32. `createHotlineScene` at line 39 throws when a config symbol has no texture, and that is documented as a deliberate fail-loud case. The function then rejects without returning `dispose`, and the session never gets a handle for it. `refresh` keeps firing and calls `app.resize()` and sets `app.renderer.resolution` on the shell app after the user is back in the menu.
**Fix:** Create the scene first and only then add the listeners. Or wrap it:
```ts
const scene = createHotlineScene(app, config, textures, hooks);
window.addEventListener("orientationchange", refresh);
vv?.addEventListener("resize", refresh);
```

### WR-04: Schema allows reel symbol sets that the view and idle grid never check

**File:** `src/games/hotline/config/HotlineConfigSchema.ts:35-45,85-94` with `src/games/hotline/view/HotlineScene.ts:46-52` and `src/games/hotline/logic/HotlineGame.ts:37-42`
**Issue:** `superRefine` only requires the wild id on each reel and each paytable id on every reel. Reels can otherwise carry different symbol sets. The scene derives `symbolIds` and the texture check from `symbolWeights[0]` only. `idleGrid` also uses reel 0 only. A symbol that exists only in reel 2 to 4 has no texture check at scene creation. `SpinEngine` can roll it, and `paintCell` then throws `no texture for symbol ...` inside the ticker callback mid-spin. The schema promises fail-at-boot, but this case fails late. If reel 0 holds only the wild, `idleGrid` computes `% plain.length` with `plain.length` 0, which gives `NaN`.
**Fix:** In the schema, require every reel to carry the same symbol id set (and at least one non-wild symbol). In the scene, build `symbolIds` as the union over all reels so the texture check covers every rollable id.

## Info

### IN-01: Win callout text ignores the Retro Computer font

**File:** `src/games/hotline/view/WinLinesOverlay.ts:42-50`
**Issue:** The `LINE n PAYS x` label uses `fontFamily: "sans-serif"`. AGENTS.md locks the brand font to Retro Computer, and the title in `HotlineScene` uses it.
**Fix:** Pass `textures.fontFamily` into `createWinLinesOverlay` and use it for the label.

### IN-02: HUD bet buttons and wallet assume well-formed bet steps; there is no recovery from a zero balance

**File:** `src/games/hotline/config/HotlineConfigSchema.ts:28`, `src/games/hotline/logic/Wallet.ts:38-41`, `src/games/hotline/hud/HotlineHud.ts:95-105`
**Issue:**
- `betStepsCents` accepts duplicates and unsorted values (I confirmed `[10, 10]` parses). The HUD +/- logic and the "step index" model assume ascending order.
- `startingBalanceCents` is not checked against the smallest step.
- `Wallet.reset()` is never called. Once the balance is below the smallest bet, SPIN fails for good with no reload path. The status line also shows the raw code, for example `insufficient_balance`.
**Fix:** Add a refine for strictly ascending steps and `startingBalanceCents >= betStepsCents[0]`. Map reason codes to short copy. Add a demo refill action later if wanted.

### IN-03: HUD session code parses formatted money strings back into cents

**File:** `src/games/hotline/session/mountHotlineSession.ts:62-72`
**Issue:** `visibleSnapshot` calls `Number.parseFloat` on `balanceDisplay` and `lastWinDisplay` to hold back the win. It works today because the format is fixed at two decimals. It silently couples the session to the display format, and an unparseable value falls back to showing the already-credited balance.
**Fix:** Expose `balanceCents` and `lastWinCents` on `HotlineSnapshot` and subtract those.

### IN-04: Bet can change while the reels are spinning

**File:** `src/games/hotline/hud/HotlineHud.ts:107-114` and `src/games/hotline/session/mountHotlineSession.ts:58`
**Issue:** `setBetStepIndex` passes straight through while `isSpinning()` is true. No money bug results, because the stake was already taken. But the bet readout changes under an in-flight spin whose win callout was computed for the old stake.
**Fix:** Ignore nudges while the scene is spinning, as the spin path does.

### IN-05: Last reel stop beep and win beep fire in the same frame

**File:** `src/games/hotline/session/mountHotlineSession.ts:80-85,139-141`
**Issue:** `onReelStop` for reel 5 plays `reel_stop` inside `scene.sync`. `onSettled` then runs in the same tick and plays `win` (520 Hz plus 990 Hz overlapping). It is cosmetic, but it muddies the cue.
**Fix:** Delay the win cue by one tick or a short timeout, or accept it as is.

---

_Reviewed: 2026-10-10_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
