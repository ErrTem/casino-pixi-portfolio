---
phase: 05-polish
reviewed: 2026-09-27T14:12:00Z
depth: standard
files_reviewed: 18
files_reviewed_list:
  - src/games/crash/view/formatWaitCountdown.ts
  - src/games/crash/view/formatWaitCountdown.test.ts
  - src/games/crash/view/CrashScene.ts
  - src/shared/audio/AudioPort.ts
  - src/shared/audio/createBeepAudioPort.ts
  - src/shared/audio/sfxEdges.ts
  - src/shared/audio/sfxEdges.test.ts
  - src/shared/audio/mutePref.ts
  - src/shared/audio/mutePref.test.ts
  - src/shared/boot/parseBootSeed.ts
  - src/shared/boot/parseBootSeed.test.ts
  - src/games/crash/hud/seedChip.ts
  - src/games/crash/hud/sessionStats.ts
  - src/games/crash/hud/sessionStats.test.ts
  - src/games/crash/hud/CrashHud.ts
  - src/main.ts
  - index.html
  - src/styles/hud.css
findings:
  critical: 0
  warning: 2
  info: 5
  total: 7
status: issues
---

# Phase 05: Code Review Report

**Reviewed:** 2026-09-27T14:12:00Z
**Depth:** standard
**Files Reviewed:** 18
**Status:** issues

## Summary

Phase 05 Polish lands cleanly against plan must_haves: waiting+idle theater countdown via `formatWaitCountdown` (no HUD countdown, no GameLogic edits, no DEMO badge); `AudioPort` oscillator beeps with mute key `crash-demo:mute` only (no Howler, no audio in `logic/`); boot-only `parseBootSeed` + Seed chip via `textContent` / seed-string copy; `sessionStatsFrom` placeholders and Space/Enter cash-out gated by `isEditableTarget` + `canCashOut`. No new critical money/XSS defects in this scope. Two warnings: clipboard copy can reject unhandled, and the window keydown listener is not torn down on HMR remount.

## Critical Issues

None in Phase 05 reviewed files.

_Prior open (out of this wave’s implementation, still playable): `resetWallet` / locked-bet free payout (Phases 1–3 CR-01) — `CrashHud` still wires Reset demo to `game.resetWallet()` without clearing stake. Not re-scored here as a Phase 05 finding._

## Warnings

### WR-01: Seed copy `clipboard.writeText` has no rejection handler

**File:** `src/games/crash/hud/seedChip.ts:73-75`
**Issue:** `void navigator.clipboard.writeText(seed)` discards the Promise but does not attach `.catch`. In insecure contexts (non-HTTPS / some embedded previews) or when permission is denied, the rejection becomes an unhandled promise rejection. Copy still fails silently for the user, with console noise.
**Fix:** Swallow and optionally surface a quiet failure:

```typescript
copyBtn.addEventListener("click", () => {
  void navigator.clipboard.writeText(seed).catch(() => {
    // insecure context / denied — leave UI unchanged
  });
});
```

### WR-02: Window keydown cash-out listener stacks on HMR remount

**File:** `src/games/crash/hud/CrashHud.ts:211-221`, `src/main.ts:41-50`
**Issue:** `mountCrashHud` registers a permanent `window` `keydown` listener. `import.meta.hot.dispose` tears down ticker/audio/Pixi but never removes that listener or remounts HUD with cleanup. Each Vite HMR cycle that re-runs `main()` adds another handler closing over a new `game`/`audio` while prior handlers remain — Space/Enter can fire `requestCashOut` N times. Plan 05-04 explicitly allows documenting SPA/HMR without dispose; still a real dev footgun.
**Fix:** Return `dispose` from `mountCrashHud` that `removeEventListener`s the same handler reference; call it from `hot.dispose` before remount (or guard with an `{ once: false }` named function stored on the module).

## Info

### IN-01: `formatWaitCountdown` does not guard non-finite ms

**File:** `src/games/crash/view/formatWaitCountdown.ts:5-8`
**Issue:** `Math.max(0, NaN)` is `NaN`; `(Infinity / 1000).toFixed(1)` is `"Infinity"`. Logic always feeds finite `waitRemainingMs` today, so production risk is low; a defensive `Number.isFinite` clamp would match other Phase 5 helpers (`sessionStatsFrom`, view idle clock).
**Fix:** Optional: `const ms = Number.isFinite(waitRemainingMs) ? Math.max(0, waitRemainingMs) : 0`.

### IN-02: `sfxEdges` couples `shared/` to `games/crash/logic`

**File:** `src/shared/audio/sfxEdges.ts:1`
**Issue:** Pure edge detector imports `CrashSnapshot` from the game package, inverting the usual shared→games dependency direction. ARCH-02 still passes (no pixi/`window.`), but future shared reuse pays a crash-logic tax.
**Fix:** Optional: accept a minimal `{ phase; cashOutAt; history }` structural type local to `sfxEdges` (same fields the function already reads).

### IN-03: Beep oscillators are not disconnected after `stop`

**File:** `src/shared/audio/createBeepAudioPort.ts:82-97`
**Issue:** Each `play` creates osc+gain, connects to destination, and stops on a timer without `disconnect` / `onended` cleanup. Browsers usually GC after stop; under rapid unmuted transitions this is a mild node churn concern only.
**Fix:** Optional: `osc.onended = () => { osc.disconnect(); gain.disconnect(); }`.

### IN-04: Mobile chrome budget absorbs mute + seed + session stats

**File:** `src/styles/hud.css:108-119`, `182-233`, `299-309`
**Issue:** Phase 04 locked `--hud-bar-height: 15.5rem` on ≤720px. Phase 05 adds mute toggle, collapsible Seed chip, and session-stats row without raising that budget — intentional (`overflow-y: auto`). Expanded Seed + stats can push Cash out below the fold on short phones; scroll is the escape hatch (D-03 / D-14).
**Fix:** None required unless device QA shows Cash out buried; then collapse seed by default more aggressively or tighten stats line-height further.

### IN-05: Keyboard cash-out and Seed chip lack DOM unit coverage

**File:** `src/games/crash/hud/CrashHud.ts:211-221`, `src/games/crash/hud/seedChip.ts`
**Issue:** Pure helpers (`sessionStatsFrom`, `parseBootSeed`, `sfxEdges`, `formatWaitCountdown`, `mutePref`) are well table-tested. The D-15 keyboard gate (`isEditableTarget` + `canCashOut`) and Seed chip textContent/copy path rely on code review + manual QA — same gap pattern as Phase 04 promote-class binding.
**Fix:** Optional happy-dom: mount fixture → focus INPUT → assert Space no-ops; focus body with flying+bet → assert `requestCashOut` called; assert seed `code` textContent equals boot seed.

## What looks good

- **PLSH-01 countdown:** `phase === "waiting" && mode === "idle"` gate; white full-alpha tenths; climb uses `formatMult`; crash_hold/fade untouched; no × suffix; no HUD countdown; no GameLogic edits.
- **PLSH-02 audio:** Four distinct pitches; muted `play` no-op; `bet_lock` only on `placeBet` ok; ticker edges for takeoff/cash_out/crash; mute persists under `crash-demo:mute` only; no Howler; no audio imports in `logic/`.
- **PLSH-03 seed:** Opaque string parse; control/length/whitespace fallback; boot-only (no `popstate`); Seed chip `textContent` + `writeText(seed)` (not share URL); quiet “using default” when invalid.
- **PLSH-04/05 stats + keyboard:** Empty → `—` / `n/a` (never `0.00×`); bind from `snap.history` only; Space/Enter + editable guard + `enablementFrom.canCashOut`; stats/seed via `textContent` only.
- **Prohibitions held:** No DEMO badge UI; no countdown tick SFX; no `innerHTML` for seed/stats/theater path in reviewed files.

---

_Reviewed: 2026-09-27T14:12:00Z_
_Reviewer: Composer (gsd-code-reviewer)_
_Depth: standard_
