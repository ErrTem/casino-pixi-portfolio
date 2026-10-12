---
phase: 05-gamble-paytable-polish
reviewed: 2026-10-12T10:50:00Z
depth: standard
files_reviewed: 24
files_reviewed_list:
  - index.html
  - src/games/hotline/config/HotlineConfigSchema.test.ts
  - src/games/hotline/config/HotlineConfigSchema.ts
  - src/games/hotline/config/hotline.config.json
  - src/games/hotline/hud/GambleOverlay.ts
  - src/games/hotline/hud/HotlineHud.test.ts
  - src/games/hotline/hud/HotlineHud.ts
  - src/games/hotline/hud/PaytableOverlay.ts
  - src/games/hotline/hud/paytableSheetModel.test.ts
  - src/games/hotline/hud/paytableSheetModel.ts
  - src/games/hotline/logic/HotlineGame.test.ts
  - src/games/hotline/logic/HotlineGame.ts
  - src/games/hotline/logic/Wallet.test.ts
  - src/games/hotline/logic/Wallet.ts
  - src/games/hotline/logic/gamble/createGamble.test.ts
  - src/games/hotline/logic/gamble/createGamble.ts
  - src/games/hotline/logic/index.ts
  - src/games/hotline/session/collectPresentation.test.ts
  - src/games/hotline/session/mountHotlineSession.ts
  - src/shared/audio/AudioPort.ts
  - src/shared/audio/createBeepAudioPort.test.ts
  - src/shared/audio/createBeepAudioPort.ts
  - src/styles/hud.css
  - tests/shell.hud-layout.test.ts
findings:
  critical: 0
  warning: 3
  info: 7
  total: 10
status: issues_found
---

# Phase 5: Code Review Report

**Reviewed:** 2026-10-12T10:50:00Z
**Depth:** standard
**Files Reviewed:** 24
**Status:** issues_found

## Summary

Scope came from the key_files lists in the five 05-*-SUMMARY.md files. Logic, HUD binders, session, overlays, audio and CSS were read in full. Plain test files, the bundled json and the AudioPort type were skimmed, with a closer read of the session contract tests.

The gamble math is sound. The pot already sits in the wallet, survive credits it once more, die debits it, and the integer checks hold. Everything the overlays render goes through `textContent`, so there is no XSS surface. Listeners are removed on dispose. There are no critical issues.

Three warnings:
- A failed spin silently throws away the gamble offer.
- Once the optional VHS button art loads, it paints over the SURVIVE and DIE labels.
- One session test does not exercise the seeded stream it claims to.

## Warnings

### WR-01: A failed spin drops the gamble offer

**File:** `src/games/hotline/session/mountHotlineSession.ts:426-428`
**Issue:** The session facade `hudGame.spin()` calls `game.clearGambleOffer()` and `hud.setGambleEnabled(false)` before `game.spin()` runs, and does so unconditionally. `game.spin()` can still fail with `insufficient_balance` or `invalid_step`. In that case the player keeps the same balance but loses the offer, and the Gamble button is disabled. A player whose balance is below the stake can no longer gamble their last base win, which is the one move that could get them back into play. `createHotlineGame.spin()` already clears the offer itself, but only after `placeBet` succeeds (`HotlineGame.ts:168-169`), so the facade-level clear is redundant as well as harmful.
**Fix:** Drop the pre-clear and disable the button only once the spin is accepted:
```ts
spin(): SpinResult {
  if (busy || infoOpen || view?.scene.isSpinning()) {
    return { ok: false, reason: "" };
  }
  const result = game.spin();
  if (result.ok && view) {
    hud.setGambleEnabled(false);
    view.scene.setPhoneGlow(null);
    hud.setComboPath([]);
    hud.setCombo(formatComboStrip([]));
    startReels(true);
  }
  return result;
},
```
The source-order assertion in `collectPresentation.test.ts:190-192` and `:258-262` will need to change to match.

### WR-02: Optional VHS button art paints over the SURVIVE and DIE labels

**File:** `src/styles/hud.css:1261-1293` (with `src/games/hotline/hud/GambleOverlay.ts:70-71`)
**Issue:** `attachOptionalArt` inserts `<img class="hotline-vhs-art">` as the first child of each button. The CSS positions that image absolutely with `z-index: 0`. The label is a bare text node inside the button, so it cannot be positioned. A positioned element with `z-index: 0` paints above non-positioned in-flow text, so as soon as `vhs-btn-survive.png` or `vhs-btn-die.png` loads, the face covers the label. `05-ASSET-LIST.md` states "label text is drawn by the page on top", so this contradicts the asset contract. The panel variant is handled by the `.hotline-gamble-panel--art > :not(.hotline-vhs-art)` rule, but the button variant has no such rule. The fallback path (no art) is fine, which is why this is invisible today.
**Fix:** Wrap the label in a span, or lower the image below the text. For example, give the art `z-index: -1`. The `isolation: isolate` already on `.hotline-gamble-panel__btn--art` keeps it inside the button:
```css
.hotline-gamble-panel__btn--art > .hotline-vhs-art {
  z-index: -1;
}
```
Also add a CSS test that guards this, since no test covers the art path.

### WR-03: The "die debits the pot once through the seeded gamble stream" test does not use the session stream, and does not force a die

**File:** `src/games/hotline/session/collectPresentation.test.ts:276-287`
**Issue:** The test destructures `seed` from `gameWithOffer` and never uses it. It then builds `createRng(":gamble")`, which is not the session stream `` `${ctx.seed}:gamble` ``. The title says "die" and "seeded gamble stream", but the assertion accepts either outcome. Which branch runs depends on that one rng value, so the die-debit path may never run here. The test passes for the wrong reason and gives false confidence about the one edge in this phase that moves money down. The unit tests in `createGamble.test.ts` and `Wallet.test.ts` cover the pieces. Nothing at the `HotlineGame` level forces a die and checks the balance.
**Fix:** Pass an injected rng that always dies, and another that always survives, and assert both balances:
```ts
const dieRng = { next: () => 0.99 } as Rng;
const res = game.resolveGamble(dieRng);
expect(res?.survived).toBe(false);
expect(after).toBe(before - stake);
```
Run the survive case with `next: () => 0`. Drop the unused `seed`, or use it to build `` createRng(`${seed}:gamble`) `` if stream parity is the point.

## Info

### IN-01: `gamble.maxRounds` has no upper bound

**File:** `src/games/hotline/config/HotlineConfigSchema.ts:106-109`
**Issue:** `maxRounds` is `positiveInt` with no maximum. The pot doubles each round, so a config of about 50 or more rounds pushes `stakeCents` past `Number.MAX_SAFE_INTEGER`. `createGamble.offer` and `Wallet.debit` both require `Number.isInteger`, and an imprecise or Infinity pot would then fail those checks and desync the wallet. The bundled value is 10, so this is only a hardening gap in the "backend-shaped" config.
**Fix:** Add a sane cap, for example `z.number().int().min(1).max(20)`.

### IN-02: `resolveGamble` ignores the `Wallet.debit` result

**File:** `src/games/hotline/logic/HotlineGame.ts:321-322`
**Issue:** `wallet.debit(before.stakeCents)` returns `false` when the amount does not fit, and that result is discarded. The wallet cannot be short today. The pot is always inside the balance, and nothing else lowers it during a gamble. If that invariant ever breaks, the gamble would report DEAD while the balance stays unchanged.
**Fix:** Assert it, for example `if (!wallet.debit(before.stakeCents)) throw new Error("gamble pot missing from wallet")`, or document the invariant at the call site.

### IN-03: Reels keep animating while the rules sheet is open

**File:** `src/games/hotline/session/mountHotlineSession.ts:609-611`
**Issue:** `onTick` gates only `tickPresent` on `infoOpen`. `view.scene.sync(game.getSnapshot(), ticker.deltaMS)` still runs, so reels that were spinning when Info opened keep spinning and stop behind the sheet. The 05-03 summary says play is paused ("reels ... wait for dismiss"). The presentation state machine is held, but the visuals are not. Settle audio such as `reel_stop` also plays while the sheet is up, and on dismiss `onReelsSettled` runs immediately.
**Fix:** Either pass a zero delta to `scene.sync` while `infoOpen`, or update the summary and copy to say that only the presentation steps pause.

### IN-04: Hard-coded absolute art URLs ignore the Vite base

**File:** `src/games/hotline/hud/GambleOverlay.ts:22-24`
**Issue:** `"/assets/hotline/..."` assumes the app is served from `/`. Today `vite.config.ts` has no `base`. For a portfolio served from a sub-path such as GitHub Pages, every probe 404s and the art silently never attaches.
**Fix:** Build the paths from `import.meta.env.BASE_URL`, for example `` `${import.meta.env.BASE_URL}assets/hotline/vhs-gamble-panel.png` ``.

### IN-05: No focus management for the modal overlays

**File:** `src/games/hotline/hud/GambleOverlay.ts:99-127`, `src/games/hotline/hud/PaytableOverlay.ts:69-80`
**Issue:** Both panels are marked `role="dialog" aria-modal="true"` and move focus in on open. On close or hide, focus is not restored, so it drops to `<body>` (the focused SURVIVE button becomes disabled and hidden, and the Info button is not refocused). There is no focus trap either, so Tab can reach controls behind the modal. Info stays enabled while the gamble panel is open, so both dialogs can be open at once.
**Fix:** Remember `document.activeElement` on open and restore it on close. For a light trap, make the underlying `.hotline-bar` `inert` while a dialog is open.

### IN-06: Last win readout is stale after a gamble round

**File:** `src/games/hotline/logic/HotlineGame.ts:316-324`
**Issue:** `lastWinCents` is not touched by `resolveGamble`. After a die the balance drops by the pot, but the HUD "last win" still shows the original line win. After a survive it shows the pre-double amount. The overlay shows the correct amounts, so this only affects the main readout once the panel closes.
**Fix:** Decide whether last win should follow the pot. If so, set `lastWinCents` to `res.stakeCents` in `resolveGamble`, and make sure the count-up tween in `HotlineHud` does not replay.

### IN-07: Several session tests assert on source text with regexes

**File:** `src/games/hotline/session/collectPresentation.test.ts:182-215`, `:238-262`, `:294-334`
**Issue:** These tests read `mountHotlineSession.ts` and `index.html` and match them with regexes such as `/if \(busy \|\| infoOpen/`. They break on harmless refactors, such as renaming or reformatting a guard. They also pass when the code exists but is wrong, for example WR-01. Behavioural checks (jsdom plus a stub view) would catch more.
**Fix:** Keep the HTML-structure checks. Replace the code-shape checks with behaviour tests of `mountHotlineSession` or of the extracted guards, as the phase 3 and 4 session tests do where they can.

---

_Reviewed: 2026-10-12T10:50:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
