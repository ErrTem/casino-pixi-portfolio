---
phase: 05-gamble-paytable-polish
verified: 2026-10-12T11:05:00Z
status: passed
score: 8/12 must-haves verified
covered_files:

  - index.html
  - src/games/hotline/hud/GambleOverlay.ts
  - src/games/hotline/hud/HotlineHud.ts
  - src/games/hotline/hud/PaytableOverlay.ts
  - src/games/hotline/hud/paytableSheetModel.ts
  - src/games/hotline/logic/HotlineGame.ts
  - src/games/hotline/logic/gamble/createGamble.ts
  - src/games/hotline/session/mountHotlineSession.ts
  - src/styles/hud.css

covered_digest: "v1:sha256:d399ba990e35d9957581041d16aad107021bc09fe17c01e145992e89f1ff805a"
behavior_unverified: 4
overrides_applied: 0
behavior_unverified_items:

  - truth: "Gamble is offered only after a settled base line win and stays disabled mid-feature (enterIdle gate, D-01, GAMBLE-02)"
    test: "Spin until a line win and a night both occur, let the night finish, then check the Gamble button. Also check that it stays disabled during splash, free spins, hold and locker phases"
    expected: "Gamble is disabled for every feature phase. After the night it is enabled with the original base line win as the stake, not the night total"
    why_human: "Math is unit-tested, but the session gate (enterIdle, openGamble) is only covered by source-text regex tests in collectPresentation.test.ts. No test drives the session FSM"
  - truth: "SURVIVE and DIE flash a result, auto-close in about 600 to 900 ms, return to the base HUD and re-offer the doubled pot below maxRounds (D-03, D-07)"
    test: "Open Gamble, press SURVIVE and then DIE across several rounds on a seeded run"
    expected: "Each result flashes and auto-closes. After SURVIVE the Gamble button is enabled for the doubled stake. After DIE it is disabled and the balance drops by the pot. After the tenth SURVIVE the button is disabled"
    why_human: "The timer (GAMBLE_RESULT_MS in tickPresent) and the re-offer path are only asserted by regex over source. Presence does not prove the transition"
  - truth: "Info opens over a paused VHS overlay and SURVIVE/DIE stay inert until Info is dismissed (D-12)"
    test: "Open Gamble, open Info, press SURVIVE and DIE, close Info, then press SURVIVE"
    expected: "Clicks do nothing while the sheet is open. After dismiss the round resolves normally and Spin and Gamble are re-locked or unlocked per the prior state"
    why_human: "The guards (infoOpen in playGambleRound and hudGame.spin, hud.setBusy) exist, but no behavioral test exercises stacked overlays or the restore logic in closeInfo"
  - truth: "At about 360x640 the HUD, VHS overlay and paytable sheet stay inside the portrait column with no horizontal page scroll and usable 44 px targets (D-14, PRES-02)"
    test: "npm run dev, open HOTLINE, set DevTools device mode to 360x640, then check Spin, bet, Gamble, Info, the VHS panel and the rules sheet. Then widen to desktop and landscape"
    expected: "No horizontal scroll, the spin hub is centered, every control is at least 44 px, desktop shows the icon row beside a large Spin, and landscape stays a letterboxed 34rem column"
    why_human: "Backstop truth. Tests pin CSS source strings (media query, min sizes, overflow guards) but cannot prove real layout. 05-05 SUMMARY records a user approval, which is a claim and not evidence available to the verifier"
advisory: []
human_verification:

  - test: "Session gamble gate across a night"
    expected: "Gamble stays disabled during features and returns with the base line win stake after the night"
    why_human: "Session FSM is not behaviorally tested"
  - test: "SURVIVE and DIE round flow, auto-close and ten-round cap in the browser"
    expected: "Result beat, auto-close, re-offer or disable per outcome, cap at ten rounds"
    why_human: "Timer and re-offer path are only regex-tested"
  - test: "Info opened over the VHS overlay"
    expected: "SURVIVE and DIE are inert until Info closes, then play resumes in the prior state"
    why_human: "Stacked overlay restore logic has no behavioral test"
  - test: "Visual pass at 360x640, desktop and landscape"
    expected: "No horizontal scroll, 44 px targets, spin hub on narrow, icon row on desktop, letterbox on landscape"
    why_human: "Real layout and stacking cannot be proven from CSS strings"
---

# Phase 5: Gamble, Paytable, Polish Verification Report

**Phase Goal:** After line wins the visitor can risk on VHS SURVIVE/DIE, open rules/paytable, and play comfortably on desktop and mobile viewports
**Verified:** 2026-10-12T11:05:00Z
**Status:** human_needed
**Re-verification:** No, initial verification

MVP note: ROADMAP marks this phase `mode: mvp`, but the roadmap goal line is not in `As a ..., I want to ..., so that ...` form. The plans carry derived stories and flag this as an assumption. I verified with standard goal-backward checks against the four ROADMAP success criteria and recommend the roadmap goal be rewritten as a user story if the MVP guard is enforced later.

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
| -- | ----- | ------ | -------- |
| 1  | After a line win the player can play SURVIVE/DIE to double or lose it, up to 10 rounds (GAMBLE-01, SC1) | ✓ VERIFIED | `createGamble.ts` doubles on `rng.next() < surviveChance`, stops at `maxRounds`, clears on DIE. `HotlineGame.resolveGamble` credits the stake once more on SURVIVE and debits it on DIE. `HotlineGame.test.ts` covers survive, die, die-after-survive, `stops after maxRounds survives`, and seeded replay. `hotline.config.json` has `maxRounds: 10`, `surviveChance: 0.5`. Full suite is green |
| 2  | Gamble applies to base line wins only, never bonus totals (GAMBLE-02, SC2) | ✓ VERIFIED | `HotlineGame.spin` offers `baseLineWinCents` only. `spinFree` never touches the gamble. Tests `keeps the base pot as the stake after a night, never the night total` and `free spin wins never replace the base pot` pass |
| 3  | `features.gamble` is required by the Zod config | ✓ VERIFIED | `HotlineConfigSchema.ts` has `gamble: gambleSchema` with no default. The bundled JSON carries it. `createHotlineGame` passes `config.features.gamble` to `createGamble` |
| 4  | Gamble is enabled only after a settled base line win, never mid-feature | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `enterIdle` sets `hud.setGambleEnabled(offered && !isNightActive())` and `openGamble` re-checks. No test drives the session FSM, only regex over source text. See Human Verification |
| 5  | Gamble opens a DOM VHS overlay with CURRENT WIN, GAMBLE TO WIN, SURVIVE and DIE, outside `#game-canvas-host` | ✓ VERIFIED | `index.html` lines 364-415 hold the overlay as a sibling of `#game-canvas-host` (line 317) inside `hotline-screen-template`. `GambleOverlay.ts` binds by `textContent`. `tests/shell.hud-layout.test.ts` passes |
| 6  | SURVIVE/DIE flashes the result, auto-closes, re-offers the doubled pot or disables after DIE | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `playGambleRound` and `tickPresent` (timer then `enterIdle`) are present and wired. Only regex tests cover them. See Human Verification |
| 7  | Spin clears the offer and keeps the win credited, with no Collect control | ✓ VERIFIED | `hudGame.spin` calls `clearGambleOffer`. No `Collect` or `Take` control exists in `index.html` or the HUD. See WR-01 below for a failed-spin edge |
| 8  | Info opens a scrollable rules sheet with symbols, phones and bonuses, and gamble sections, with live payouts from `config.paytable` (BASE-04, SC3) | ✓ VERIFIED | `paytableSheetModel.ts` builds rows from `Object.entries(config.paytable)` and `maxRounds` from config, in symbols, phones, gamble order. `PaytableOverlay.ts` uses `createElement`, `textContent` and `replaceChildren` only. `paytableSheetModel.test.ts` passes. `index.html` has `paytable-overlay` and the Info button |
| 9  | Info stays enabled while busy and pauses SURVIVE/DIE and Spin until dismiss | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `HotlineHud` leaves `infoBtn` out of `setBusy` (unit-tested). `openInfo`, `closeInfo`, and the `infoOpen` guards in `playGambleRound`, `hudGame.spin` and `openGamble` are present. Stacked-overlay restore has no behavioral test |
| 10 | Desktop shows a compact Gamble and Info icon row beside a large Spin, and at 480 px the HUD reflows to a spin hub with 44 px targets and the 34 rem column kept (SC4, D-13, D-15, D-16) | ✓ VERIFIED (structural) | `hud.css` has `@media (max-width: 480px)` with `grid-template-areas`, `min-width/min-height: 2.75rem`, and `.hotline-screen { max-width: 34rem }`. `.hotline-bar__icons` is in `index.html`. Hub tests in `shell.hud-layout.test.ts` pass. Visual result is covered by item 11 |
| 11 | At about 360x640 the layout is playable with no horizontal page scroll | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Backstop truth. `min-width: 0` and `overflow-x: hidden` guards are present and pinned by tests. Real layout needs a browser pass. The 05-05 SUMMARY says the user approved, which the verifier cannot confirm from the codebase |
| 12 | VHS art is optional with a CSS fallback, gamble beeps exist, and `HOTLINE_ASSET_URLS` stays at 17 | ✓ VERIFIED | `GambleOverlay.ts` attaches `vhs-*.png` only on image load and the neon CSS is the default. No `vhs-*.png` is present in `public/`. `AudioPort` has `gamble_open`, `gamble_survive` and `gamble_die`, with distinct pitches tested. `tests/hotline.assets.test.ts` passes. No `package.json` changes |

**Score:** 8/12 truths verified (4 present, behavior-unverified)

### Deferred Items

None. Phase 5 is the last phase of the milestone.

### Advisory (New Scope, Unevidenced)

Not applicable, initial verification.

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `src/games/hotline/logic/gamble/createGamble.ts` | pure pot machine | ✓ VERIFIED | Substantive, imported by `HotlineGame.ts`, exported from `logic/index.ts` |
| `src/games/hotline/logic/Wallet.ts` | `debit` | ✓ VERIFIED | Used by `resolveGamble`. Unit-tested |
| `src/games/hotline/logic/HotlineGame.ts` | stake capture and facade | ✓ VERIFIED | `baseLineWinCents`, `clearGambleOffer`, `resolveGamble`, `getGambleSnapshot` all present and used by the session |
| `src/games/hotline/config/HotlineConfigSchema.ts` | required `features.gamble` | ✓ VERIFIED | Required object, no default |
| `src/games/hotline/hud/GambleOverlay.ts` | DOM binder | ✓ VERIFIED | Mounted by the session, disposed on teardown |
| `src/games/hotline/hud/HotlineHud.ts` | gamble and info hooks | ✓ VERIFIED | `setGambleEnabled`, `onGamble`, `onInfo`, and Info exempt from busy |
| `src/games/hotline/hud/paytableSheetModel.ts` | pure section model | ✓ VERIFIED | Reads config, tested |
| `src/games/hotline/hud/PaytableOverlay.ts` | scrollable binder | ✓ VERIFIED | Wired via `mountPaytableOverlay` in the session |
| `src/games/hotline/session/mountHotlineSession.ts` | offer gate, gamble phase, Info pause, beeps | ✓ VERIFIED (wired) | All paths present. Behavior is covered by the human items above |
| `src/styles/hud.css` | spin hub, overlay guards | ✓ VERIFIED | 480 px query, 2.75rem targets, overflow guards, VHS art layer |
| `index.html` | overlay and bar markup | ✓ VERIFIED | Overlays are outside the canvas host |
| `src/shared/audio/AudioPort.ts` | gamble ids | ✓ VERIFIED | Three ids, exhaustive pitch record |
| `.planning/phases/05-gamble-paytable-polish/05-ASSET-LIST.md` | asset handoff | ✓ VERIFIED | Present |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| `HotlineGame.ts` | `createGamble.ts` | `createGamble(config.features.gamble)`, offer on base spin, `resolveGamble` | WIRED | Confirmed in source |
| `mountHotlineSession.ts` | `GambleOverlay.ts` | `mountGambleOverlay`, `show`, `showResult`, `hide`, `dispose` | WIRED | |
| `mountHotlineSession.ts` | `HotlineGame.ts` | `clearGambleOffer`, `resolveGamble`, `getGambleSnapshot` | WIRED | |
| `mountHotlineSession.ts` | `PaytableOverlay.ts` | `mountPaytableOverlay`, `openInfo`, `closeInfo` | WIRED | |
| `paytableSheetModel.ts` | `HotlineConfigSchema.ts` | `config.paytable`, `config.features.gamble.maxRounds` | WIRED | |
| `mountHotlineSession.ts` | `AudioPort.ts` | `gamble_open`, `gamble_survive`, `gamble_die` | WIRED | |
| `index.html` | `hud.css` | `hotline-bar`, `hotline-bar__icons`, 480 px grid areas | WIRED | |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `GambleOverlay` | current win and gamble to win | `game.getGambleSnapshot().stakeCents` from `lineWins` payout sum | Yes | ✓ FLOWING |
| `PaytableOverlay` | rows | `paytableSheetModel(config)` from Zod-parsed `config.paytable` | Yes | ✓ FLOWING |
| HUD Gamble enable | `gambleEnabled` | `getGambleSnapshot().offered` | Yes | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Whole suite | `npx vitest run` (once) | 55 files, 411 passed | ✓ PASS |
| Type check | `npx tsc --noEmit` | exit 0 | ✓ PASS |

### Probe Execution

SKIPPED. No probes are declared by the phase plans.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ----------- | ----------- | ------ | -------- |
| GAMBLE-01 | 05-01, 05-02 | VHS SURVIVE/DIE after a line win, up to 10 rounds | ✓ SATISFIED (math), ? NEEDS HUMAN (session flow) | Truths 1, 3, 5, 6 |
| GAMBLE-02 | 05-01, 05-02 | Gamble on line wins only | ✓ SATISFIED (logic), ? NEEDS HUMAN (session gate) | Truths 2, 4 |
| BASE-04 | 05-03 | Paytable and rules overlay | ✓ SATISFIED | Truths 8, 9 (Info pause needs human) |
| PRES-02 | 05-04, 05-05 | Playable on desktop and mobile viewports | ? NEEDS HUMAN | Truths 10, 11, 12 |

All four IDs are declared in plan frontmatter and listed in REQUIREMENTS.md as Phase 5. No orphaned requirements. The traceability table already marks them Complete, which holds for the code but not yet for the visual and session sign-off.

### Prohibitions (judgment tier, non-authoritative)

All reviewed prohibitions appear respected, `unverified-prohibition, human review recommended`:

- No gamble stake from night or free spin totals: `spinFree` never touches the pot (tested).
- No SURVIVE/DIE, Gamble or Info markup inside `#game-canvas-host`: confirmed in `index.html` and layout test.
- No Collect control: grep clean.
- No `innerHTML` in the overlays: grep clean.
- Overlay not sticky between rounds: `enterIdle` calls `gambleOverlay.hide()`.
- No VHS URLs in `HOTLINE_ASSET_URLS`: pin test passes.
- No new npm dependencies: `package.json` unchanged.
- No separate landscape HUD: not independently checked beyond the SUMMARY claim, included in the visual pass.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| `mountHotlineSession.ts` | 426-428 | `clearGambleOffer` and `setGambleEnabled(false)` run before `game.spin()`, so a failed spin (`insufficient_balance` or `invalid_step`) still drops the offer (review WR-01, confirmed by reading) | ⚠️ Warning | A player who cannot afford the bet loses the chance to gamble their last win. Does not break the success criteria |
| `hud.css` | 1260-1293 | Button art image has `z-index: 0` above the text-node label, and no `--art` rule lifts the label (review WR-02, confirmed by reading) | ⚠️ Warning | Latent, no `vhs-*.png` exists yet. Labels would be hidden once the art is dropped in |
| `collectPresentation.test.ts` | 276-287 | Die-debit test builds `createRng(":gamble")`, ignores the seed, and accepts either outcome (review WR-03) | ⚠️ Warning | False confidence. The die-debit math is still covered in `HotlineGame.test.ts` |
| `collectPresentation.test.ts` | various | Session behavior asserted by regex over source text (review IN-07) | ℹ️ Info | Reason items 4, 6 and 9 stay behavior-unverified |

No `TODO`, `FIXME`, `XXX` or `TBD` markers in `src/games/hotline`. No blocker anti-patterns. The other review items IN-01 to IN-06 are hardening or UX polish and do not block the goal.

### Human Verification Required

#### 1. Session gamble gate across a night

**Test:** Play to a line win plus a night, then watch the Gamble button during and after the features.
**Expected:** Disabled during every feature phase. After the night it is enabled with the base line win as the stake.
**Why human:** The session FSM has no behavioral test.

#### 2. SURVIVE and DIE round flow

**Test:** Resolve several rounds on a seeded run, up to ten.
**Expected:** Result beat, auto-close at about 600 to 900 ms, re-offer after SURVIVE, disabled after DIE and after the tenth SURVIVE, balance changes by the pot on DIE.
**Why human:** Timer and re-offer paths are only regex-tested.

#### 3. Info over a paused VHS

**Test:** Open Gamble, open Info, click SURVIVE and DIE, dismiss Info, then continue.
**Expected:** Inert while Info is open. Normal play afterwards.
**Why human:** Stacked overlay restore has no behavioral test.

#### 4. Visual pass at 360x640, desktop and landscape

**Test:** Check Spin, bet, Gamble, Info, the VHS panel and the rules sheet at each size.
**Expected:** No horizontal scroll, 44 px targets, spin hub on narrow, icon row on desktop, letterboxed column in landscape.
**Why human:** Real layout cannot be proven from CSS strings.

### Gaps Summary

No failed truths, missing artifacts or unwired links. The gamble math, the line-win-only stake rule, the config-driven paytable sheet, the responsive CSS, the beeps and the asset pin are all backed by code and passing tests (411 tests, `tsc` clean). The status is `human_needed` because four truths are present and wired but only covered by source-text regex tests or a viewport backstop, so they are not behaviorally proven. Two warnings (WR-01 failed-spin offer loss, WR-02 hidden VHS button labels once art lands) are worth a small follow-up but do not block the phase goal.

---

_Verified: 2026-10-12T11:05:00Z_
_Verifier: Claude (gsd-verifier)_
