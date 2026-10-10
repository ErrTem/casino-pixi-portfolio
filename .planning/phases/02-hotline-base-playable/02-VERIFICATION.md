---
phase: 02-hotline-base-playable
verified: 2026-10-10T11:55:00Z
status: human_needed
score: 4/5 must-haves verified
covered_files:
  - .planning/REQUIREMENTS.md
  - .planning/ROADMAP.md
  - .planning/phases/02-hotline-base-playable/02-01-PLAN.md
  - .planning/phases/02-hotline-base-playable/02-01-SUMMARY.md
  - .planning/phases/02-hotline-base-playable/02-02-PLAN.md
  - .planning/phases/02-hotline-base-playable/02-02-SUMMARY.md
  - .planning/phases/02-hotline-base-playable/02-03-PLAN.md
  - .planning/phases/02-hotline-base-playable/02-03-SUMMARY.md
  - .planning/phases/02-hotline-base-playable/02-04-PLAN.md
  - .planning/phases/02-hotline-base-playable/02-04-SUMMARY.md
  - .planning/phases/02-hotline-base-playable/02-05-PLAN.md
  - .planning/phases/02-hotline-base-playable/02-05-SUMMARY.md
  - .planning/phases/02-hotline-base-playable/02-06-PLAN.md
  - .planning/phases/02-hotline-base-playable/02-06-SUMMARY.md
  - .planning/phases/02-hotline-base-playable/02-07-PLAN.md
  - .planning/phases/02-hotline-base-playable/02-07-SUMMARY.md
  - index.html
  - src/games/hotline/config/HotlineConfigSchema.ts
  - src/games/hotline/config/hotline.config.json
  - src/games/hotline/config/loadHotlineConfig.ts
  - src/games/hotline/hud/HotlineHud.ts
  - src/games/hotline/logic/HotlineGame.ts
  - src/games/hotline/logic/SpinEngine.ts
  - src/games/hotline/logic/Wallet.ts
  - src/games/hotline/logic/evaluatePaylines.ts
  - src/games/hotline/session/mountHotlineSession.ts
  - src/games/hotline/view/HotlineScene.ts
  - src/games/hotline/view/PhonesLayer.ts
  - src/games/hotline/view/WinLinesOverlay.ts
  - src/games/hotline/view/loadHotlineAssets.ts
  - src/games/hotline/view/mountHotlineView.ts
  - src/games/hotline/view/reels/ReelStrip.ts
  - src/games/hotline/view/reels/createReelWindow.ts
  - src/shell/gameRegistry.ts
covered_digest: "v1:sha256:eb7de19fc208d77feb46e00fe9dff2e5d8ae206c1768346ee168cd160c49e84f"
behavior_unverified: 1
overrides_applied: 0
behavior_unverified_items:
  - truth: "HOTLINE shows motel rooftop at sunset with CRT/VHS monitor framing and Retro Computer font"
    test: "Run npm run dev, open the menu, launch HOTLINE, look at the canvas at desktop and phone-sized viewports"
    expected: "Rooftop sunset backdrop fills the canvas, CRT frame sits over the 5x4 reels with symbols inside the glass, three phones sit above the frame, HOTLINE title renders in Retro Computer"
    why_human: "Textures load, are PNG-validated and are wired into the scene, but nothing renders them headless. Glass rect alignment (GLASS 100,97,698x536) and visual fidelity can only be judged by eye"
human_verification:
  - test: "Play spins end to end from the menu"
    expected: "Menu tile launches HOTLINE; SPIN runs five reels left to right with staggered stops; balance drops by the bet at spin start, win and balance credit only appear after reel 5 lands; line cycle callout shows LINE n PAYS x; last win counts up"
    why_human: "Session, reel motion and win cycle have no automated test that mounts Pixi. Only pure helpers (reelMotion, winCycle, lastWinTween, HUD binder) are unit tested"
  - test: "Bet steps in the browser"
    expected: "Bet minus and plus walk 0.10, 0.20, 0.50, 1.00, 2.00, 5.00, 10.00 and disable at the ends"
    why_human: "HUD binder is unit tested against a fake DOM, not the real template and CSS"
  - test: "Menu round trip and first-click race"
    expected: "Click SPIN immediately after launch while PNGs are still loading: it should not settle money without reel playback (WR-01). Menu returns cleanly, relaunch works, no ticker or listener leak"
    why_human: "WR-01 and WR-02 from 02-REVIEW.md are open and no test mounts the session"
  - test: "Brand font coverage"
    expected: "Decide whether the DOM HUD (Segoe UI) and the win callout (sans-serif) are acceptable next to the Retro Computer title for PRES-01"
    why_human: "Only the Pixi title uses Retro Computer. Whether that satisfies PRES-01 is a product call"
---

# Phase 2: HOTLINE Base Playable Verification Report

**Phase Goal:** As a portfolio visitor, I want to launch HOTLINE and play base spins on a 5x4 / 40-line game, so that I feel a Witch Pots style slot in Hotline Miami dress with working config and CRT framing.
**Verified:** 2026-10-10
**Status:** human_needed
**Re-verification:** No, initial verification

Goal-backward check against the code, not the SUMMARY files. `npx tsc --noEmit` exits 0, `npx vitest run` passes 268 of 268 in 42 files, and `npm run build` succeeds. The math, config and HUD binder are solid. The Pixi session and presentation layer is wired but never exercised headless, so it routes to a human check. No requirement is unmet.

## Goal Achievement

### Observable Truths

| #   | Truth (ROADMAP success criteria) | Status | Evidence |
| --- | -------------------------------- | ------ | -------- |
| 1 | User opens HOTLINE from the menu and plays on a 5x4 grid with 40 fixed paylines, wins left to right from reel 1 | ✓ VERIFIED | `gameRegistry.ts` HOTLINE `enabled: true`, lazy `mountHotlineSession` (`gameRegistry.test.ts:21-27`). Schema pins `rows: 4`, `reels: 5`, `paylineCount: 40`, `paylines.length(40)`. I checked the JSON directly: 40 lines, 40 unique, all 5 long, rows within 0..3. `evaluatePaylines` anchors every run at reel 0 and tests cover "does not pay a run that starts after reel 0" and "stops at the first break". |
| 2 | User can spin, change bet within config steps, and see balance and last win update | ✓ VERIFIED | `HotlineGame.spin` deducts via `Wallet.placeBet` (config steps only), credits `lastWinCents`. `setBetStepIndex` clamps and floors. `HotlineHud` writes balance, bet, last win and "40 lines", with inc/dec disabled at the ends. Tests: "deducts exactly the selected step on every step", "walks only the config steps", "spin updates balance from the snapshot". Browser behavior is in the human list. |
| 3 | Matching payline symbols pay per paytable; Wild (animal mask) substitutes | ✓ VERIFIED | `evaluatePaylines` runs a wild-only run and a substituted run and takes the better. Tests: "lets wild substitute", "lets wild sit in the middle of a run", "takes the substituted run when it beats wild only", "pays five wilds from the wild row". The seeded engine replay test confirms outcomes are reproducible. Payout uses integer cents with a floor. |
| 4 | HOTLINE loads bet steps, symbol weights and related tables from validated backend-shaped JSON at boot; bad config fails loud | ✓ VERIFIED | `HotlineConfigSchema` is a Zod envelope `{gameId, version, math, paytable, features}`. `loadHotlineConfig` calls `parse` with no fallback, and `mountHotlineSession` calls it first, before any DOM work. Tests prove `ZodError` for a missing `math`, a wrong grid, an out-of-range payline row, a wild with no weight and a missing feature table. A source-scan test confirms spin logic never reads `config.features`. Caveat WR-04: per-reel symbol sets are not cross-checked. |
| 5 | HOTLINE shows motel rooftop at sunset with CRT/VHS monitor framing and Retro Computer font | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Present and wired. 14 PNGs are tracked under `public/assets/hotline/`. `tests/hotline.assets.test.ts` checks PNG signatures and that the loader list matches the asset list. `loadHotlineAssets` throws on any missing or empty texture and loads the TTF through `Assets` with family "Retro Computer". `HotlineScene` stacks backdrop, title, phones, dark screen, masked reels, CRT frame and win overlay. Rendered output is untested. The DOM HUD uses Segoe UI. |

**Score:** 4/5 truths verified (1 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `src/games/hotline/config/HotlineConfigSchema.ts` | Zod full envelope | ✓ VERIFIED | Substantive and wired. Used by `loadHotlineConfig` and the game. |
| `src/games/hotline/config/hotline.config.json` | Bundled illustrative config | ✓ VERIFIED | 40 paylines, 8 paying symbols plus wild, 7 bet steps, token/bonus/jackpot tables. |
| `src/games/hotline/config/loadHotlineConfig.ts` | Boot parse | ✓ VERIFIED | Throws on bad input. |
| `src/games/hotline/logic/{Wallet,SpinEngine,evaluatePaylines,HotlineGame}.ts` | Math facade | ✓ VERIFIED | Real logic, seeded through `createRng`. |
| `src/games/hotline/hud/HotlineHud.ts`, `format.ts`, `lastWinTween.ts` | DOM binder | ✓ VERIFIED | Wired from the session, with the template in `index.html`. |
| `src/games/hotline/session/mountHotlineSession.ts` | Shell adapter | ⚠️ PARTIAL | Wired from the registry. Open review warnings WR-01 and WR-02. |
| `src/games/hotline/view/HotlineScene.ts`, `PhonesLayer.ts`, `reels/*`, `WinLinesOverlay.ts` | Pixi scene | ✓ VERIFIED (static) | Wired. Visual behavior is in the human list. |
| `src/games/hotline/view/loadHotlineAssets.ts`, `mountHotlineView.ts` | Asset and view mount | ⚠️ PARTIAL | Works. WR-03: listeners are added before a call that can throw. |
| `public/assets/hotline/*.png` (14 files) | User art pack | ✓ VERIFIED | All tracked, valid PNG signatures. |
| `index.html` `#hotline-screen-template` | HUD DOM | ✓ VERIFIED | Spin, bet, balance, last win, 40 lines, menu and mute are present. The canvas host holds no monetary controls. |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| `gameRegistry.ts` | `mountHotlineSession` | dynamic import | WIRED | |
| `mountHotlineSession` | `loadHotlineConfig` | first call | WIRED | Fails before DOM work. |
| `mountHotlineSession` | `createHotlineGame`, `mountHotlineHud`, `mountHotlineView` | direct | WIRED | |
| Session spin | `scene.startSpin` | `hudGame.spin` | WIRED | Skipped when `view` is null (WR-01). |
| `reelWindow.onReelStop` | `audio.play("reel_stop")` | hook | WIRED | |
| `scene.isSpinning` | `visibleSnapshot` | win and balance hold | WIRED | Parses display strings (IN-03). |
| `onSettled` | `audio.play("win")` | ticker | WIRED | |
| `HotlineScene` | `WinLinesOverlay.showCycle` | `showWins` after spin | WIRED | |
| `loadHotlineAssets` | `SYMBOL_URLS` per config symbol | texture check | WIRED | Checks reel 0 ids only (WR-04). |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| HUD balance, bet, last win | `HotlineSnapshot` | `Wallet` and `evaluatePaylines` over `SpinEngine` grid | Yes | ✓ FLOWING |
| Reels | `snapshot.grid` | `SpinEngine.spin` seeded from `ctx.seed` | Yes | ✓ FLOWING |
| Win overlay | `snapshot.lineWins` | `evaluatePaylines` | Yes | ✓ FLOWING |
| Symbol art | `textures.symbols[id]` | `Assets.load` of PNGs | Yes, runtime unverified | ✓ FLOWING (static) |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Type check | `npx tsc --noEmit` | exit 0 | ✓ PASS |
| Full suite (run once) | `npx vitest run` | 42 files, 268 tests passed | ✓ PASS |
| Production build | `npm run build` | built, `mountHotlineSession` chunk emitted | ✓ PASS |
| Payline table integrity | `node -e` over the JSON | 40 lines, 40 unique, all 5 long, rows 0..3 | ✓ PASS |

### Probe Execution

Step 7c: SKIPPED. No probes are declared in the plans and no `scripts/*/tests/probe-*.sh` exist.

### Requirements Coverage

Every ID from the PLAN frontmatter appears in REQUIREMENTS.md. No requirement mapped to Phase 2 is orphaned, and the five IDs in the task input match.

| Requirement | Source Plan(s) | Description | Status | Evidence |
| ----------- | -------------- | ----------- | ------ | -------- |
| CFG-01 | 02-01 | JSON config validated at boot | ✓ SATISFIED | Truth 4 |
| BASE-01 | 02-02, 02-03, 02-04 | 5x4 grid, 40 lines, left to right | ✓ SATISFIED | Truth 1 |
| BASE-02 | 02-02, 02-03, 02-04, 02-05 | Spin, bet steps, balance, last win | ✓ SATISFIED | Truth 2 |
| BASE-03 | 02-02, 02-05 | Paytable pays, wild substitutes | ✓ SATISFIED | Truth 3 |
| PRES-01 | 02-06, 02-07 | Rooftop, CRT frame, Retro Computer | ? NEEDS HUMAN | Truth 5 |

REQUIREMENTS.md already marks all five `[x]` and "Complete". PRES-01 is unconfirmed until the visual check passes, so that mark is premature. The traceability rows for CFG-02 and the SHELL items belong to Phase 1. Phase 1 regression is clean: the shell and Crash tests (`architecture.shell`, `shell.hud-layout`, `shell.seedReuse`, `walkingSkeleton`, `gameRegistry`) all pass in the 268-test run.

### Anti-Patterns Found

No `TBD`, `FIXME`, `XXX`, `TODO` or placeholder markers anywhere under `src/games/hotline`.

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| `session/mountHotlineSession.ts` | 46-57, 127 | WR-01: spin is accepted before `view` exists | ⚠️ Warning | A fast first click settles the bet with no reel playback and no win hold. Edge case during PNG load (the backdrop is about 3.3 MB). |
| `session/mountHotlineSession.ts` | 30-95 | WR-02: a throw before the abort listener leaves the screen and canvas in the DOM | ⚠️ Warning | Only on a broken template or HUD node. |
| `view/mountHotlineView.ts` | 30-39 | WR-03: window listeners are added before `createHotlineScene` can throw | ⚠️ Warning | Leaks a resize handler on a missing symbol texture. |
| `config/HotlineConfigSchema.ts` | 35-45, 85-94 | WR-04: reel symbol sets are not cross-checked | ⚠️ Warning | A bad config for reels 2-5 fails late, mid-spin, instead of at boot. The bundled config is fine. |
| `view/WinLinesOverlay.ts` | 42-50 | IN-01: callout uses `sans-serif` | ℹ️ Info | Brand font gap on a presentation element. |
| `hud/HotlineHud.ts`, `config/HotlineConfigSchema.ts` | various | IN-02 to IN-05 (duplicate or unsorted bet steps, no refill at zero balance, money string parsing, bet change mid-spin, beep overlap) | ℹ️ Info | Non-blocking polish. |

Debt marker gate: no markers, so it passes. All four warnings are carried over from `02-REVIEW.md` and none has been fixed. I confirmed this against the current source. None breaks a ROADMAP truth with the bundled config, so none is a blocker.

### Human Verification Required

#### 1. Visual presentation (PRES-01)

**Test:** `npm run dev`, open the menu, launch HOTLINE, and check desktop and a narrow viewport.
**Expected:** Rooftop sunset backdrop, CRT frame aligned over the reels with symbols inside the glass, three phones above, Retro Computer HOTLINE title.
**Why human:** Nothing renders the scene headless. Alignment and look are visual.

#### 2. Full spin loop

**Test:** Launch from the menu and press SPIN several times, including a win.
**Expected:** Reels stop left to right. Balance drops at spin start. Win and balance credit appear only after reel 5 lands. `LINE n PAYS x` cycles through the winning lines. Last win counts up. Beeps play for spin, reel stops and win.
**Why human:** The session and Pixi motion are not covered by any mounting test.

#### 3. Bet steps in the real DOM

**Test:** Press bet minus and plus.
**Expected:** The bet walks 0.10, 0.20, 0.50, 1.00, 2.00, 5.00, 10.00 and the buttons disable at the ends.
**Why human:** The unit tests use a fake DOM.

#### 4. Launch race and teardown

**Test:** Click SPIN immediately after launch. Then use Menu and relaunch twice.
**Expected:** A click before assets load does not spend the bet with no animation (WR-01). The menu returns cleanly with no leftover HUD or ticker.
**Why human:** WR-01 and WR-02 are open and unexercised.

#### 5. Font scope for PRES-01

**Test:** Compare the DOM HUD (Segoe UI) and the win callout (sans-serif) against the Retro Computer title.
**Expected:** Product decision on whether title-only Retro Computer satisfies PRES-01, or whether the HUD and callout should switch.
**Why human:** Context D-12 only requires the Pixi title, but the context note about "DOM HUD @font-face" is ambiguous.

### Gaps Summary

There are no blocking gaps. Four of five roadmap truths are backed by passing tests and direct code reads. The fifth, the visual presentation, is wired but has never been rendered in an automated check, so it stays human-gated. The four open review warnings (WR-01 to WR-04) are worth a short fix pass. WR-01 is the one a real visitor could hit, with one extra guard line (`!view`). They are not required to meet the phase goal.

---

_Verified: 2026-10-10_
_Verifier: Claude (gsd-verifier)_
