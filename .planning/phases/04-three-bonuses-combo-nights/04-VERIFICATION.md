---
phase: 04-three-bonuses-combo-nights
verified: 2026-10-10T23:15:24Z
status: human_needed
score: 4/4 must-haves verified
covered_files:
  - .planning/REQUIREMENTS.md
  - .planning/ROADMAP.md
  - .planning/phases/04-three-bonuses-combo-nights/04-01-PLAN.md
  - .planning/phases/04-three-bonuses-combo-nights/04-01-SUMMARY.md
  - .planning/phases/04-three-bonuses-combo-nights/04-02-PLAN.md
  - .planning/phases/04-three-bonuses-combo-nights/04-02-SUMMARY.md
  - .planning/phases/04-three-bonuses-combo-nights/04-03-PLAN.md
  - .planning/phases/04-three-bonuses-combo-nights/04-03-SUMMARY.md
  - .planning/phases/04-three-bonuses-combo-nights/04-04-PLAN.md
  - .planning/phases/04-three-bonuses-combo-nights/04-04-SUMMARY.md
  - .planning/phases/04-three-bonuses-combo-nights/04-05-PLAN.md
  - .planning/phases/04-three-bonuses-combo-nights/04-05-SUMMARY.md
  - .planning/phases/04-three-bonuses-combo-nights/04-CONTEXT.md
  - .planning/phases/04-three-bonuses-combo-nights/04-RESEARCH.md
  - .planning/phases/04-three-bonuses-combo-nights/04-REVIEW.md
  - index.html
  - src/styles/hud.css
  - src/games/hotline/config/HotlineConfigSchema.ts
  - src/games/hotline/config/hotline.config.json
  - src/games/hotline/config/HotlineConfigSchema.test.ts
  - src/games/hotline/logic/features/freeSpins.ts
  - src/games/hotline/logic/features/freeSpins.test.ts
  - src/games/hotline/logic/features/prizeTable.ts
  - src/games/hotline/logic/features/prizeTable.test.ts
  - src/games/hotline/logic/features/pickEm.ts
  - src/games/hotline/logic/features/pickEm.test.ts
  - src/games/hotline/logic/features/holdAndWin.ts
  - src/games/hotline/logic/features/holdAndWin.test.ts
  - src/games/hotline/logic/night/createNight.ts
  - src/games/hotline/logic/night/createNight.test.ts
  - src/games/hotline/logic/HotlineGame.ts
  - src/games/hotline/logic/HotlineGame.test.ts
  - src/games/hotline/logic/index.ts
  - src/games/hotline/hud/FeatureOverlay.ts
  - src/games/hotline/hud/HotlineHud.ts
  - src/games/hotline/hud/HotlineHud.test.ts
  - src/games/hotline/hud/comboStripModel.ts
  - src/games/hotline/hud/comboStripModel.test.ts
  - src/games/hotline/session/mountHotlineSession.ts
  - src/games/hotline/session/collectPresentation.ts
  - src/games/hotline/session/collectPresentation.test.ts
  - src/games/hotline/view/HoldLayer.ts
  - src/games/hotline/view/JackpotStrip.ts
  - src/games/hotline/view/HotlineScene.ts
  - src/games/hotline/view/WinLinesOverlay.ts
  - src/games/hotline/view/loadHotlineAssets.ts
  - src/shared/audio/AudioPort.ts
  - src/shared/audio/createBeepAudioPort.ts
  - src/shared/audio/createBeepAudioPort.test.ts
  - tests/hotline.assets.test.ts
covered_digest: "v1:sha256:0a0cc73bd18e750388fee004e9ab90ce16c83b9fb4ee1c076ae65df2945e76d5"
behavior_unverified: 0
overrides_applied: 0
decision_coverage:
  honored: 20
  total: 20
  not_honored: []
human_verification:
  - test: "Green free spins walkthrough (BONUS-01)"
    expected: "Trigger green phone; splash → continue → 24 auto free spins with denser mask wilds on reels 2–5; DOM feature line shows remaining spins + win; exit total splash; Spin locked the whole night"
    why_human: "Logic and config are unit-tested; auto-run pacing, splash chrome, and wild density feel need a browser session"
  - test: "Red Hold & Win walkthrough (BONUS-02)"
    expected: "Trigger red; splash → CRT 5×4 sticky cash with jackpot strip MIN/MID/MAX/ULTRA replacing phones; 3 respins that reset on new cash; exit total (jackpot callout if won); phones/reels restore"
    why_human: "HoldLayer/JackpotStrip/setHoldMode are wired; Pixi sticky-board motion and strip swap are not rendered headless"
  - test: "Purple locker Pick'em walkthrough (BONUS-03)"
    expected: "Trigger purple; splash → 12-locker DOM overlay; exactly 5 picks reveal cash; total splash; wallet credits once at exit"
    why_human: "createPickEm + FeatureOverlay locker grid are wired and logic-tested; overlay hide/dim CRT and tap UX need eyes"
  - test: "Combo night + nesting walkthrough (BONUS-04)"
    expected: "Multi-phone trigger runs Green→Red→Purple with combo strip path highlight and night-total splash when path length ≥ 2; during free spins with nested red/purple, FS pauses then resumes with spinsLeft unchanged; feature beeps fire; no skip control"
    why_human: "createNight order/nesting and multi-phone integration tests pass; DOM strip highlight, nested presentation, and beep feel need a live session"
---

# Phase 4: Three Bonuses + Combo Nights Verification Report

**Phase Goal (ROADMAP):** Each phone delivers its Witch Pots–style feature, and multi-phone triggers run as an ordered combo night (including nesting during free spins where config allows)

**User story (plans / MVP framing):** As a portfolio visitor playing HOTLINE, I want to have each phone deliver its Witch Pots-style feature and see multi-phone triggers run as an ordered combo night (including nesting during free spins where config allows), so that I feel the full Witch Pots bonus loop of three bonuses including combos in Hotline Miami dress.

**Verified:** 2026-10-10T23:15:24Z  
**Status:** human_needed  
**Re-verification:** No — initial verification  
**Mode:** mvp

**Note:** ROADMAP Phase 4 goal text is not in `As a…, I want to…, so that…` form (`user-story.validate` failed on the ROADMAP goal). Plans 04-01..05 share a valid user story; this report uses that story for MVP User Flow Coverage. Optional cleanup: `/gsd mvp-phase 4` to align ROADMAP goal wording.

Goal-backward check against the codebase, not SUMMARY claims. Green free spins, Hold & Win, Pick'em, and createNight combo/nesting machines are present, wired through HotlineGame + session presenter, and exercised by named Vitest cases. Visitor-facing chrome (splashes, CRT Hold board, locker overlay, combo neon, beeps) still needs a browser walkthrough.

## User Flow Coverage

User story: «As a portfolio visitor playing HOTLINE, I want to have each phone deliver its Witch Pots-style feature and see multi-phone triggers run as an ordered combo night (including nesting during free spins where config allows), so that I feel the full Witch Pots bonus loop of three bonuses including combos in Hotline Miami dress.»

| Step | Expected | Evidence | Status |
|------|----------|----------|--------|
| Open HOTLINE | Menu launches playable HOTLINE | `mountHotlineSession` + Zod config with `freeSpins` / `holdAndWin` / `pickEm` | ✓ |
| Green phone | 24 free spins, elevated wild density reels 2–5 | `features.freeSpins.spins: 24`, `wildWeights` 9 > base mask 3; `boostedFreeSpinMath`; forced green night test | ✓ logic; ⚠️ pacing/chrome human |
| Red phone | Hold & Win 5×4 sticky, 3 respins reset on cash | `createHoldAndWin` TOTAL 20, `respins: 3`, lives reset; `HoldLayer` + `setHoldMode` | ✓ logic; ⚠️ CRT board human |
| Purple phone | Locker Pick'em, reveal until round ends | `pickEm` 12/5; `FeatureOverlay.showLockerGrid`; five-pick night test | ✓ logic; ⚠️ overlay human |
| Combo / nest | Ordered queue + nest during FS when config allows | `createNight` D-16/D-17 tests; multi-phone night_total test; `nested: { red, purple: true }` | ✓ logic; ⚠️ strip/UX human |
| Outcome | Full Witch Pots bonus loop in Hotline Miami dress | Engines + presenter replace Phase 3 stub; end-to-end feel untested headless | ⚠️ needs human walkthrough |

## Goal Achievement

### Observable Truths

| #   | Truth (ROADMAP success criteria) | Status | Evidence |
| --- | -------------------------------- | ------ | -------- |
| 1 | Green phone grants 24 free spins with elevated Wild mask density on reels 2–5 | ✓ VERIFIED | Config `freeSpins.spins: 24`, `wildWeights: [9,9,9,9]` vs base mask weight 3 on reels 1..4. Zod refine requires each wildWeight strictly greater than base. `boostedFreeSpinMath` keeps reel 0 base, bumps reels 1..4. Named tests passed: `forced green night runs 24 free spins then exits to done`; `keeps reel 0 weights identical and boosts wild on reels 1..4`. Session auto-runs via `fs_spin` / `FS_GAP_MS` / `spinFree`. |
| 2 | Red phone starts Hold & Win on a 5×4 sticky cash grid with 3 respins that reset on new cash symbols | ✓ VERIFIED | `createHoldAndWin` uses REELS×ROWS = 5×4, `lives = knobs.respins` (config 3), resets `lives = knobs.respins` when `landed > 0`. Named tests passed: `resets lives to respins when at least one cell lands`; `forced red night drives hold respins then credits wallet once at feature_exit`. View: `HoldLayer` 20-cell overlay; `HotlineScene.setHoldMode` / `syncHold`; session `hold_respin` phase; `JackpotStrip` MIN/MID/MAX/ULTRA. |
| 3 | Purple phone opens a locker Pick'em where the user reveals cash prizes until the round ends | ✓ VERIFIED | `createPickEm` pre-assigns `lockers` from weighted `bonusPrizes.pickEm` on `seed:pick`; accepts `picks` (5) then ignores further. Named tests passed: full `pickEm.test.ts` (4/4); `forced purple night credits wallet once at feature_exit after five picks`; `accepts five distinct picks then ignores further and invalid picks`. DOM: `FeatureOverlay.showLockerGrid` with `data-action=locker-pick`; session calls `pickLocker` then advances. |
| 4 | When multiple phones trigger, bonuses run in a clear ordered combo queue (including nesting during free spins where config allows) | ✓ VERIFIED | `createNight` enforces Green→Red→Purple; nested red/purple pause FS and resume with spinsLeft unchanged (`createNight nesting resume` named test passed). Config `freeSpins.nested.red/purple: true`. Multi-phone integration: `forced multi-phone night keeps Green Red Purple order and night_total sum` passed. Combo strip: `buildComboStripCells` + `setComboPath`; session `syncComboFromSnapshot`. Phase 3 stub drain removed (no `present === "stub"`). |

**Score:** 4/4 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `logic/night/createNight.ts` | Combo night machine | ✓ VERIFIED | Frame stack, nest queue, path, settleFeature, night_total; wired from HotlineGame |
| `logic/features/freeSpins.ts` | Boosted FS math + token odds | ✓ VERIFIED | `boostedFreeSpinMath`, `freeSpinTokenOdds` |
| `logic/features/holdAndWin.ts` | Hold respin stepper | ✓ VERIFIED | Sticky map, lives reset, jackpot/grand |
| `logic/features/pickEm.ts` + `prizeTable.ts` | Pick'em + shared ladder | ✓ VERIFIED | 12/5 machine; weighted draws |
| `logic/HotlineGame.ts` | Night + feature drivers | ✓ VERIFIED | `createNight`, `spinFree`, `pickLocker`, `stepHoldRespin`; streams `:fs`, `:fs-collectors`, `:pick`, `:hold` |
| `hud/FeatureOverlay.ts` | Splash + locker grid | ✓ VERIFIED | Sibling of canvas host; `textContent` / createElement |
| `hud/comboStripModel.ts` + `HotlineHud.ts` | Path highlight strip | ✓ VERIFIED | `buildComboStripCells` / `setComboPath` spans |
| `view/HoldLayer.ts` + `JackpotStrip.ts` | CRT Hold + jackpot strip | ✓ VERIFIED | Wired via `HotlineScene.setHoldMode` |
| `session/mountHotlineSession.ts` | Night presenter | ✓ VERIFIED | Maps NightStep → splash / fs / hold_respin / pick; no stub drain |
| `config/HotlineConfigSchema.ts` + JSON | Feature knobs | ✓ VERIFIED | freeSpins / holdAndWin / pickEm parse; wildWeights refine |
| `AudioPort.ts` / beep port | Feature SFX ids | ✓ VERIFIED | `feature_start/end`, `hold_land/respin`, `pick_reveal`, `jackpot` |

`gsd_run query verify.artifacts` returned valid for plans 04-01 through 04-05.

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| `HotlineGame.ts` | `createNight.ts` | spin settle opens night; `nextNightStep` | WIRED | |
| `HotlineGame.ts` | `freeSpins.ts` | `:fs` engine + `boostedFreeSpinMath` | WIRED | |
| `HotlineGame.ts` | `holdAndWin.ts` | `createHoldAndWin` / `stepHoldRespin` / `:hold` | WIRED | |
| `HotlineGame.ts` | `pickEm.ts` | `createPickEm` / `pickLocker` / `:pick` | WIRED | |
| `mountHotlineSession.ts` | `HotlineGame.ts` | `nextNightStep` / `spinFree` / hold / pick | WIRED | |
| `mountHotlineSession.ts` | `FeatureOverlay.ts` | splash + locker grid | WIRED | |
| `mountHotlineSession.ts` | `HotlineScene.ts` | `setHoldMode` / `hold_respin` | WIRED | |
| `mountHotlineSession.ts` | `HotlineHud.ts` | `setFeatureLine` / `setComboPath` | WIRED | |
| `HotlineScene.ts` | `JackpotStrip.ts` | hold mode phones swap | WIRED | |
| `mountHotlineSession.ts` | `AudioPort` | feature/hold/pick play edges | WIRED | source-grep test |

`gsd_run query verify.key-links` returned valid for plans 04-01 through 04-05.

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| Free spin grids | `fsEngine.spin()` | `boostedFreeSpinMath` + `seed:fs` RNG | Yes | ✓ FLOWING |
| Hold cells / lives | `HoldAndWin` map | `seed:hold` + config holdAndWin / bonusPrizes | Yes | ✓ FLOWING |
| Locker prizes | `lockers[]` | `seed:pick` + pickEm prize table | Yes — pre-assigned before picks | ✓ FLOWING |
| Feature wallet credit | `settleFeature` → `feature_exit.totalCents` | night accounting + once at exit | Yes | ✓ FLOWING |
| Feature line DOM | `formatFeatureLine(night)` | `NightSnapshot.fs` | Yes | ✓ FLOWING |
| Combo strip | `buildComboStripCells(path, activeIndex)` | night path from createNight | Yes | ✓ FLOWING |
| Night total splash | `night_total` step | path length ≥ 2 feature win sum | Yes | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| 24 green free spins | `npx vitest run -t "forced green night runs 24 free spins then exits to done"` | 1 passed | ✓ PASS |
| Elevated wild reels 1..4 | `npx vitest run -t "keeps reel 0 weights identical and boosts wild on reels 1..4"` | 1 passed | ✓ PASS |
| Hold lives reset | `npx vitest run -t "resets lives to respins when at least one cell lands"` | 1 passed | ✓ PASS |
| Red Hold night settle | `npx vitest run -t "forced red night drives hold respins then credits wallet once at feature_exit"` | 1 passed | ✓ PASS |
| Pick'em five picks | `npx vitest run -t "accepts five distinct picks then ignores further and invalid picks"` | 1 passed | ✓ PASS |
| Purple night settle | `npx vitest run -t "forced purple night credits wallet once"` | 1 passed | ✓ PASS |
| Nest pause/resume | `npx vitest run -t "pauses free spins for red then purple nested and resumes spinsLeft"` | 1 passed | ✓ PASS |
| Multi-phone order + total | `npx vitest run -t "forced multi-phone night keeps Green Red Purple order and night_total sum"` | 1 passed | ✓ PASS |
| Asset pack length 17 | `npx vitest run tests/hotline.assets.test.ts` | 4 passed; `toHaveLength(17)` | ✓ PASS |

### Probe Execution

| Probe | Command | Result | Status |
| ----- | ------- | ------ | ------ |
| — | — | No phase-declared or conventional `scripts/*/tests/probe-*.sh` | SKIP |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| BONUS-01 | 04-01, 04-02 | Green 24 FS + elevated wild density reels 2–5 | ✓ SATISFIED (logic) / ? human for chrome | Config + boosted math + forced green night + DOM feature line / FS cadence |
| BONUS-02 | 04-04 | Red Hold & Win 5×4 sticky, 3 respins reset | ✓ SATISFIED (logic) / ? human for CRT | holdAndWin + HoldLayer/JackpotStrip + forced red night |
| BONUS-03 | 04-03 | Purple locker Pick'em until round ends | ✓ SATISFIED (logic) / ? human for overlay | pickEm 12/5 + FeatureOverlay + forced purple night |
| BONUS-04 | 04-01, 04-05 | Ordered combo queue + nesting when config allows | ✓ SATISFIED (logic) / ? human for strip/UX | createNight + multi-phone + comboStripModel + feature beeps |

No orphaned Phase 4 requirements: ROADMAP maps only BONUS-01..04; all four appear in plan frontmatter. REQUIREMENTS.md marks them Complete — consistent with logic evidence; human UAT still open.

### Decision Coverage

All trackable CONTEXT.md decisions are honored by shipped artifacts (`honored: 20 / total: 20`, non-blocking gate).

### Test Quality Audit

| Test File | Linked Req | Active | Skipped | Circular | Assertion Level | Verdict |
|-----------|-----------|--------|---------|----------|-----------------|---------|
| `freeSpins.test.ts` | BONUS-01 | 3 | 0 | no | Value (weights/odds) | OK |
| `HotlineGame.test.ts` (green/red/purple/multi) | BONUS-01..04 | named cases | 0 | no | Behavioral night drive | OK |
| `holdAndWin.test.ts` | BONUS-02 | 7 | 0 | no | Value / reset / bound | OK |
| `pickEm.test.ts` | BONUS-03 | 4 | 0 | no | Value / replay | OK |
| `createNight.test.ts` | BONUS-04 | 7 | 0 | no | Behavioral order/nest | OK |
| `comboStripModel.test.ts` | BONUS-04 | 3 | 0 | no | Value states | OK |
| `HotlineHud.test.ts` (setComboPath) | BONUS-04 | binder cases | 0 | no | DOM structure | OK |
| `collectPresentation.test.ts` | BONUS-01/04 | feature line + source contracts | 0 | no | Value + source-scan | OK (FSM is source-scan) |
| `createBeepAudioPort.test.ts` | BONUS-04 SFX | closed union pitches | 0 | no | Value | OK |
| `hotline.assets.test.ts` | asset pin | 4 | 0 | no | Length 17 | OK |

**Disabled tests on requirements:** 0  
**Circular patterns detected:** 0  
**Insufficient assertions:** session night presenter relies partly on source-string contracts — WARNING only (does not block; human walkthrough covers runtime FSM)

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| — | — | No TBD/FIXME/XXX/TODO debt markers in phase hotline sources | — | — |
| `HotlineGame.ts` | finishHold | Hold instance cleared only on night `done` (04-REVIEW WR-01) | ℹ️ Info | Session avoids mid-night `stepHoldRespin` after red; API fragile if presenter changes — not a must-have failure |
| `comboStripModel.ts` | 22 | `paused` mapped to `done` (04-REVIEW WR-03) | ⚠️ Warning | Nesting strip can show Green as completed while paused; order/execution still correct |
| `HotlineScene.ts` | hold resize | Hold geo not re-synced on resize (WR-02) | ℹ️ Info | Portrait flip mid-Hold misaligns cells; demo edge |

### Advisory (from 04-REVIEW — not automatic gaps)

| # | Finding | Category | Why not blocking |
|---|---------|----------|------------------|
| 1 | WR-01 stale Hold settle if `stepHoldRespin` after red exit | architectural | Must-haves verified; session only steps Hold in `hold_respin` |
| 2 | WR-02 Hold geometry stale on resize | other | Not in ROADMAP success criteria; polish |
| 3 | WR-03 paused Green shown as done on combo strip | other | Combo order/nesting verified; strip labeling polish vs D-18 |

### Prohibitions (spot-check)

| Prohibition | Evidence | Verdict |
| ----------- | -------- | ------- |
| Feature RNG not on base / `:collectors` | `:fs`, `:fs-collectors`, `:pick`, `:hold` in HotlineGame | ✓ held |
| Session does not decide night order | presenter maps `NightStep` kinds only | ✓ held |
| No data-action inside `#game-canvas-host` | overlay + HUD siblings in `index.html` | ✓ held |
| HOTLINE_ASSET_URLS stays 17 | assets test passed | ✓ held |
| No Howler/GSAP/pixi-reels npm deps | package.json has none | ✓ held |
| No skip/interrupt feature control | no skip control in session/HUD feature paths | ✓ held (judgment; confirm in walkthrough) |

### Human Verification Required

### 1. Green free spins walkthrough (BONUS-01)

**Test:** Launch HOTLINE, force or play until green triggers; tap splash continue; watch free spins  
**Expected:** 24 auto spins, denser wild masks on reels 2–5, DOM remaining/win line, exit total splash, Spin locked  
**Why human:** Auto-run cadence and wild density feel are not headless-proven

### 2. Red Hold & Win walkthrough (BONUS-02)

**Test:** Trigger red; complete Hold board  
**Expected:** In-place CRT sticky 5×4, jackpot strip replaces phones, respins reset on new cash, restore after exit  
**Why human:** Pixi HoldLayer / JackpotStrip presentation

### 3. Purple locker Pick'em walkthrough (BONUS-03)

**Test:** Trigger purple; pick five lockers  
**Expected:** Full-screen 12-locker overlay, five reveals then total splash, one wallet credit  
**Why human:** DOM overlay UX over CRT

### 4. Combo night + nesting walkthrough (BONUS-04)

**Test:** Multi-phone trigger and (if possible) nested red/purple during free spins  
**Expected:** Green→Red→Purple order, path highlight, night-total when multi-step, FS pause/resume, feature beeps, no skip  
**Why human:** End-to-end night presenter + audio + strip neon

### Gaps Summary

No blocking gaps on ROADMAP success criteria. Logic and wiring for BONUS-01..04 are verified with named tests. Status is `human_needed` solely for MVP user-flow / presentation sign-off.

---

_Verified: 2026-10-10T23:15:24Z_  
_Verifier: Claude (gsd-verifier)_
