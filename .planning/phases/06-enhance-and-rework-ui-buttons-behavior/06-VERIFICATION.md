---
phase: 06-enhance-and-rework-ui-buttons-behavior
verified: 2026-09-29T16:30:00Z
status: human_needed
score: 4/6 must-haves verified
covered_files:
  - .planning/REQUIREMENTS.md
  - .planning/ROADMAP.md
  - .planning/phases/06-enhance-and-rework-ui-buttons-behavior/06-01-PLAN.md
  - .planning/phases/06-enhance-and-rework-ui-buttons-behavior/06-01-SUMMARY.md
  - .planning/phases/06-enhance-and-rework-ui-buttons-behavior/06-02-PLAN.md
  - .planning/phases/06-enhance-and-rework-ui-buttons-behavior/06-02-SUMMARY.md
  - .planning/phases/06-enhance-and-rework-ui-buttons-behavior/06-03-PLAN.md
  - .planning/phases/06-enhance-and-rework-ui-buttons-behavior/06-03-SUMMARY.md
  - .planning/phases/06-enhance-and-rework-ui-buttons-behavior/06-04-PLAN.md
  - .planning/phases/06-enhance-and-rework-ui-buttons-behavior/06-04-SUMMARY.md
  - .planning/phases/06-enhance-and-rework-ui-buttons-behavior/06-CONTEXT.md
  - .planning/research/FEATURES.md
  - index.html
  - src/games/crash/hud/CrashHud.ts
  - src/games/crash/hud/autoBet.test.ts
  - src/games/crash/hud/autoBet.ts
  - src/games/crash/hud/chips.test.ts
  - src/games/crash/hud/chips.ts
  - src/games/crash/hud/chromeMode.ts
  - src/games/crash/hud/enablement.ts
  - src/games/crash/hud/primaryChrome.test.ts
  - src/games/crash/hud/primaryChrome.ts
  - src/games/crash/logic/config.ts
  - src/games/crash/view/CrashScene.ts
  - src/games/crash/view/pathMapping.ts
  - src/games/crash/view/viewConfig.ts
  - src/main.ts
  - src/shared/boot/parseBootSeed.test.ts
  - src/shared/boot/parseBootSeed.ts
  - src/styles/hud.css
  - tests/architecture.no-pixi.test.ts
  - tests/multiplierCurve.test.ts
  - tests/pathMapping.test.ts
  - tests/resolveTick.test.ts
  - tests/shell.hud-layout.test.ts
covered_digest: "v1:sha256:4b037b8276ab54e7fd22b3d079b7ee7e95d8361767a354cdefd407aa3c323599"
behavior_unverified: 2
overrides_applied: 0
decision_coverage:
  honored: 24
  total: 24
  not_honored: []
behavior_unverified_items:
  - truth: "Auto bet ON auto-places at waiting start; stops and emphasizes Reset when broke (D-10–D-12)"
    test: "npm run dev — Auto bet ON; watch consecutive waiting auto-places; edit stake mid-flight; drain wallet until broke"
    expected: "Place at each waiting start (not countdown end); next wait uses edited stake; Auto bet OFF + Reset demo emphasized; never auto resetWallet"
    why_human: "shouldAutoPlaceBet unit-tested and main.ts single placeBet site is wired, but no test exercises composition-root placeBet + stopAutoBet → Reset emphasize together"
  - truth: "Craft stays near center with scrolling trail + gentle tilt; crash FX unchanged (D-17–D-19)"
    test: "npm run dev — watch climb; confirm craft near mid-frame while trail scrolls; cash out or crash; confirm freeze + sever/flash/hold/idle"
    expected: "World camera locks tip near center (CAMERA_CENTER_Y_RATIO 0.52); gentle ±15° tilt; crash freezes world offset; theater × upper third clear of craft"
    why_human: "pathMapping/gentleTilt unit-tested and CrashScene world.position camera is wired, but no test exercises CrashScene.sync climb/crash camera frames"
human_verification:
  - test: "npm run dev — phone/tablet/desktop widths; confirm 100dvh column (top → history → canvas → autos → primary/presets) with no page scroll."
    expected: "Zones match D-01; html/body/.app-shell overflow hidden; canvas flex leftover playable; no dual-bet / DEMO badge"
    why_human: "shell.hud-layout.test.ts asserts selectors/CSS strings only — live viewport / short-landscape clip needs browser (06-REVIEW WR-03)"
  - test: "Play waiting → BET+stake → flying CASH OUT+live win → cash out → CASHED OUT frozen → crash → waiting BET; crash without cash out snaps to BET (no CRASHED)."
    expected: "Single dual-line primary; English labels; live win = bet×multiplier; frozen cashed amount disabled"
    why_human: "primaryChromeFrom unit-tested; mid-flight DOM chrome feel needs browser"
  - test: "Auto bet ON → consecutive waiting places; edit stake mid-flight → next wait uses new stake; drain wallet → Auto bet stops + Reset emphasized."
    expected: "Place as soon as waiting allows; broke/insufficient clears flag; Reset emphasized; never auto resetWallet"
    why_human: "Composition auto place + broke UX untested end-to-end"
  - test: "Watch climb — ~2× arrives in ~3.5–4s band; crash distribution still feels like prior RNG (not retuned)."
    expected: "Authoritative growthRatePerMs = LN2/3750; houseEdge/floor/cap unchanged"
    why_human: "Curve math unit-locked; perceived pace needs live play"
  - test: "Climb: craft mid-frame, trail scrolls under, gentle tilt; crash: camera freezes, sever red, craft vanishes, flash/hold/idle; theater × clear of craft."
    expected: "world.position camera only (no stage.x/y); TILT_MAX_RAD clamp; D-19 choreography unchanged"
    why_human: "Canvas spectacle — CrashScene sync not covered by Vitest"
  - test: "No Seed chip; open /?seed=demo-a boots quietly; missing/invalid → portfolio-demo with no on-screen note; countdown/mute/stats/keyboard still work."
    expected: "parseBootSeed → createGame only; Phase 5 polish relocated in new shell"
    why_human: "Silent boot + polish relocation feel need browser"
---

# Phase 6: Enhance and Rework UI/Buttons/Behavior Verification Report

**Phase Goal:** As a recruiter on phone or desktop, I want a compact JetX-like Crash chrome with a dual-line BET/CASH OUT, Auto bet, a milder climb, and a centered craft over a scrolling graph — so the demo feels finished before milestone close without dual-bet or lobby scope.
**Verified:** 2026-09-29T16:30:00Z
**Status:** human_needed
**Re-verification:** No — initial verification
**Mode:** standard (ROADMAP Phase 6)

## Goal Achievement

### Observable Truths

Roadmap success criteria (contract). SC3 and SC5 are present+wired but composition auto-place / canvas camera runtime not exercised by tests → ⚠️ PRESENT_BEHAVIOR_UNVERIFIED. SC1–SC2, SC4, SC6 have strong unit + wiring evidence → ✓ VERIFIED (live shell/primary/climb/seed polish still listed under Human Verification as UAT).

| # | Truth | Status | Evidence |
| --- | ------- | ---------- | -------------- |
| 1 | Viewport is 100dvh with no page scroll; layout matches D-01 zones on phone/tablet/desktop | ✓ VERIFIED | `hud.css` html/body/.app-shell `height: 100dvh` + `overflow: hidden`; `index.html` `#top-chrome` → `#history-band` → `#game-canvas-host` → `#hud-bar`; `shell.hud-layout.test.ts` zones + overflow/100dvh + primary-only + canvas monetary ban |
| 2 | Primary control cycles BET+stake → CASH OUT+live win → CASHED OUT frozen → BET on next wait (D-06–D-09) | ✓ VERIFIED | `primaryChrome.test.ts` 6/6 (waiting BET, flying live win, cashed_out frozen+disabled, spectator no fake win, crash→BET); `CrashHud.render` binds `primaryChromeFrom` → label/amount/disabled; single `data-action=primary` |
| 3 | Auto bet ON auto-places at waiting start; stops and emphasizes Reset when broke (D-10–D-12) | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `autoBet.test.ts` 9/9 waiting-edge / broke / hasBet / mid-wait toggle ON; `main.ts` single `shouldAutoPlaceBet` → `placeBet` + `bet_lock`; broke → `hud.stopAutoBet` (clears flag, `reset-demo--emphasize`, never `resetWallet`) — composition loop untested end-to-end |
| 4 | Authoritative ~2× lands in 3.5–4s band; crash distribution unchanged (D-14/D-15) | ✓ VERIFIED | `config.ts` `growthRatePerMs: Math.LN2 / 3750`; `multiplierCurve.test.ts` 0→1 / 3750→2; houseEdge 0.04 / crashFloor 1.01 / crashCap 100 unchanged; no CrashRng edits |
| 5 | Craft stays near center with scrolling trail + gentle tilt; crash FX unchanged (D-17–D-19) | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `CrashScene` world Container + `world.position.set(lock - tip)`; `gentleTiltRadians` → `rocket.syncPose`; crash latches `frozenWorld`; theater/flash stage children; `pathMapping.test.ts` soft slope + tilt clamp + m=1 origin — no sync/canvas test |
| 6 | Seed chip gone; `?seed=` still boots quietly (D-21–D-24); Phase 5 polish (countdown, mute, stats, keyboard) still works | ✓ VERIFIED | `seedChip.ts` absent from tree/git; `shell.hud-layout` asserts no `seed-chip`; `main.ts` `parseBootSeed` → `createGame({ seed })` only; `parseBootSeed.test.ts` 8/8; countdown/`formatWaitCountdown`, mute, `sessionStatsFrom`, Space/Enter cash-out still in CrashScene/CrashHud |

**Score:** 4/6 truths verified (2 present, behavior-unverified)

### Additional plan truths (supporting)

| Truth | Status | Evidence |
|-------|--------|----------|
| English labels BET / CASH OUT / Auto bet / Auto cash out; no dual-bet / X2 (D-02) | ✓ VERIFIED | `index.html` English copy; no place-bet/cash-out dual primaries; no DEMO / dual-bet markup |
| PRESET_CHIPS [20,50,100] + ALL fill-only maxAffordableStake (D-03, WALT-03Δ) | ✓ VERIFIED | `chips.test.ts`; CrashHud chip click sets `bet.value` only — never `placeBet` |
| Auto CO toggle OFF → setAutoCashOut(null) + dim/disable field (D-04, WALT-04Δ) | ✓ VERIFIED (code) | CrashHud `autoToggle` change + `syncAutoCoFieldEnabled` / `is-dimmed` |
| Canvas pointer-events none; monetary controls outside host (VIS-02) | ✓ VERIFIED | `hud.css` + `shell.hud-layout.test.ts` |
| Single Auto bet placeBet call site (composition root) | ✓ VERIFIED | only `main.ts` auto path; HUD owns flag/`getStake`/`stopAutoBet` |
| Mid-wait toggle ON places once (synthetic edge) | ✓ VERIFIED | `autoBet.test.ts` `!prevAutoBetOn` case |
| No app.stage.x/y camera writes (D-17) | ✓ VERIFIED | Grep clean; CrashScene comments + world.position only |
| PLSH-03 REQUIREMENTS amended to silent ?seed= only (D-23) | ✓ VERIFIED | REQUIREMENTS PLSH-03 / PLSH-03Δ wording; FEATURES Auto-bet promoted |
| ARCH-02 logic/ pixi-free after config edit | ✓ VERIFIED | `architecture.no-pixi.test.ts` 7/7 |

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | ----------- | ------ | ------- |
| `index.html` | 100dvh zone markup; primary; Auto CO/bet; no seed-chip | ✓ VERIFIED | Zones + dual-line primary; English autos |
| `src/styles/hud.css` | 100dvh; overflow hidden; dual-line; Auto CO dim | ✓ VERIFIED | Column shell; canvas flex leftover; pointer-events none |
| `src/games/crash/hud/primaryChrome.ts` | primaryChromeFrom | ✓ VERIFIED | BET / CASH OUT / CASHED OUT kinds |
| `src/games/crash/hud/primaryChrome.test.ts` | Chrome cases | ✓ VERIFIED | 6 passed |
| `src/games/crash/hud/chips.ts` | PRESET 20/50/100 + ALL + maxAffordableStake | ✓ VERIFIED | Fill-only data module |
| `src/games/crash/hud/chips.test.ts` | Preset + ALL cases | ✓ VERIFIED | 7 passed |
| `src/games/crash/hud/CrashHud.ts` | Primary binder; Auto CO; Auto bet flag; polish | ✓ VERIFIED | Single primary; stopAutoBet; keyboard; stats; mute |
| `src/games/crash/hud/autoBet.ts` | shouldAutoPlaceBet | ✓ VERIFIED | Waiting-edge + synthetic toggle |
| `src/games/crash/hud/autoBet.test.ts` | Edge / broke / hasBet / toggle | ✓ VERIFIED | 9 passed |
| `src/main.ts` | Silent seed + single auto place site | ✓ VERIFIED | parseBootSeed; shouldAutoPlaceBet ticker |
| `src/games/crash/logic/config.ts` | growthRatePerMs LN2/3750 | ✓ VERIFIED | D-14 comment; houseEdge/floor/cap intact |
| `tests/multiplierCurve.test.ts` | 3750 → 2× | ✓ VERIFIED | 5 passed; no 2500→2 default |
| `src/games/crash/view/CrashScene.ts` | World camera; freeze; gentle tilt | ✓ VERIFIED | world Container; frozenWorld; theater outside world |
| `src/games/crash/view/pathMapping.ts` | Soft plot + gentleTiltRadians | ✓ VERIFIED | linear blend + clamp |
| `src/games/crash/view/viewConfig.ts` | Soft/tilt/camera tunables | ✓ VERIFIED | PLOT_X_LINEAR_BLEND 0.55; TILT_MAX_RAD π/12; CAMERA_CENTER_Y_RATIO 0.52 |
| `tests/pathMapping.test.ts` | Soft slope + tilt | ✓ VERIFIED | 4 passed |
| `src/shared/boot/parseBootSeed.ts` | Silent boot helper | ✓ VERIFIED | Unchanged API retained |
| `tests/shell.hud-layout.test.ts` | Zones + monetary ban + no seed-chip | ✓ VERIFIED | 7 passed |
| `src/games/crash/hud/seedChip.ts` | Deleted | ✓ VERIFIED | Absent on disk / not git-tracked; no src imports |

**Artifacts:** 18/18 verified (exists + substantive + wired; seedChip correctly absent)

gsd-tools `verify.artifacts`: 06-01 6/6, 06-02 4/4, 06-03 2/2, 06-04 6/6 — all_passed.

### Key Link Verification

gsd-tools `verify.key-links` could not auto-verify narrative `from:` fields (expects file paths) — verified manually:

| From | To | Via | Status | Details |
| ---- | --- | --- | ------ | ------- |
| snapshot + stake | dual-line primary | primaryChromeFrom → CrashHud.render | ✓ WIRED | CrashHud.ts render binds label/amount/disabled |
| Auto CO toggle OFF | setAutoCashOut(null) + dim field | CrashHud auto-CO binder | ✓ WIRED | change handler + syncAutoCoFieldEnabled |
| ALL chip click | bet input = maxAffordableStake | fill-only handler | ✓ WIRED | never placeBet |
| prevPhase→waiting + autoBetOn | game.placeBet(getStake) | shouldAutoPlaceBet in main ticker | ✓ WIRED | single composition site |
| placeBet broke/insufficient | autoBetOff + Reset emphasize | hud.stopAutoBet | ✓ WIRED | no resetWallet in stop path |
| growthRatePerMs | multiplierAt / resolveTick | MultiplierCurve consume-only | ✓ WIRED | config → multiplierAt default |
| tip plotPoint | world.position camera | CrashScene.sync climb | ✓ WIRED | lock − tipLocal; freeze on crash |
| parseBootSeed(search) | createGame({ seed }) | main.ts boot | ✓ WIRED | no HUD seed options |

**Wiring:** 8/8 connections verified (manual)

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| Primary dual-line | chrome.label/amount | primaryChromeFrom(snap, stake) | Yes — live snap + bet input | ✓ FLOWING |
| Auto bet place | stake | hud.getStake() at edge | Yes — current bet input | ✓ FLOWING |
| Auto bet stop | broke reason | placeBet result → stopAutoBet | Yes — wallet/command result | ✓ FLOWING |
| Climb × | multiplier | growthRatePerMs via resolveTick | Yes — authoritative curve | ✓ FLOWING |
| World camera | tip plotPoint | snapshot.multiplier → plotPoint | Yes — live climb tip | ✓ FLOWING |
| Gentle tilt | path tangent | gentleTiltRadians(clamp) | Yes — path samples | ✓ FLOWING |
| Silent seed | seed string | URLSearchParams ?seed= | Yes — parseBootSeed → createGame | ✓ FLOWING |
| Session stats | avg/max | snapshot.history | Yes — GameLogic ring | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| primaryChrome + chips | `npx vitest run src/games/crash/hud/primaryChrome.test.ts src/games/crash/hud/chips.test.ts` | 13 passed | ✓ PASS |
| shouldAutoPlaceBet | `npx vitest run src/games/crash/hud/autoBet.test.ts` | 9 passed | ✓ PASS |
| climb retune | `npx vitest run tests/multiplierCurve.test.ts` | 5 passed | ✓ PASS |
| path + tilt | `npx vitest run tests/pathMapping.test.ts` | 4 passed | ✓ PASS |
| shell layout | `npx vitest run tests/shell.hud-layout.test.ts` | 7 passed | ✓ PASS |
| parseBootSeed | `npx vitest run src/shared/boot/parseBootSeed.test.ts` | 8 passed | ✓ PASS |
| architecture.no-pixi | `npx vitest run tests/architecture.no-pixi.test.ts` | 7 passed | ✓ PASS |
| Full suite (once) | `npm test` | **127 passed** / 22 files | ✓ PASS |
| Typecheck | `npx tsc --noEmit` | exit 0 | ✓ PASS |

### Probe Execution

| Probe | Command | Result | Status |
| ----- | ------- | ------ | ------ |
| — | — | No `scripts/*/tests/probe-*.sh` declared for Phase 6 | SKIP |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| UI-01 | 06-01 | Compact no-scroll 100dvh shell | ✓ SATISFIED (code); UAT for multi-device | zones + overflow/100dvh + shell test |
| UI-02 | 06-01 | Dual-line BET↔CASH OUT / CASHED OUT | ✓ SATISFIED | primaryChromeFrom + CrashHud bind |
| UI-03 | 06-02 | Auto bet waiting-edge; stop on broke | ✓ SATISFIED (code); UAT for consecutive feel | autoBet + main ticker + stopAutoBet |
| WALT-03Δ | 06-01 | Presets 20/50/100/ALL fill-only | ✓ SATISFIED | chips.ts/tests + CrashHud fill handlers |
| WALT-04Δ | 06-01 | Auto CO toggle + ±; dim when OFF | ✓ SATISFIED (code) | CrashHud + index.html chrome |
| FEEL-01 | 06-03 | ~2× @ 3.5–4s; distribution unchanged | ✓ SATISFIED | LN2/3750 + curve tests |
| FEEL-02 | 06-04 | Arcade camera + gentle tilt + crash FX | ✓ SATISFIED (code); UAT for spectacle | world camera + pathMapping |
| PLSH-03Δ | 06-04 | Silent ?seed= only; no Seed chip | ✓ SATISFIED | seedChip gone; parseBootSeed retained |
| VIS-01Δ | 06-04 | Hybrid visual under arcade camera | ✓ SATISFIED (code); UAT for camera | curve+rocket under world; theater fixed |

**Orphaned requirements:** none — REQUIREMENTS maps UI-01..03, WALT-03Δ/04Δ, FEEL-01/02, PLSH-03Δ, VIS-01Δ → Phase 6; all appear in plan frontmatter.

**Coverage:** 9/9 requirements satisfied in code (shell/primary/Auto bet/camera/seed polish feel → human UAT below)

### Decision Coverage

All trackable CONTEXT.md decisions D-01..D-24 are honored by shipped artifacts. (`honored: 24 / total: 24`, non-blocking gate)

### Prohibitions

| Prohibition | Tier | Status | Evidence |
|-------------|------|--------|----------|
| MUST NOT add dual-bet / X2 / lobby frameworks | judgment | ✓ resolved | No dual-bet markup; single primary |
| MUST NOT call placeBet from preset/ALL chip click | judgment | ✓ resolved | Chips set bet.value only |
| MUST NOT put monetary controls in #game-canvas-host / remove pointer-events:none | judgment | ✓ resolved | shell test + hud.css |
| MUST NOT import Pixi/DOM into logic/ | judgment | ✓ resolved | architecture.no-pixi green; config-only logic edit |
| MUST NOT present DEMO badge UI | judgment | ✓ resolved | Grep clean on index.html / HUD |
| MUST NOT implement Auto bet in 06-01 (06-02 owns) | judgment | ✓ resolved | Wave order honored in SUMMARYs |
| MUST NOT add Auto bet as GameLogic FSM | judgment | ✓ resolved | HUD flag + composition edge only |
| MUST NOT auto-call resetWallet on broke stop | judgment | ✓ resolved | stopAutoBet clears flag/emphasizes Reset only; resetWallet on Reset click |
| MUST NOT double-invoke placeBet from ticker and HUD | judgment | ✓ resolved | Single main.ts auto site |
| MUST NOT change houseEdge/floor/cap/CrashRng | judgment | ✓ resolved | Only growthRatePerMs edited |
| MUST NOT write app.stage.x/y for camera | judgment | ✓ resolved | Grep clean; world.position only |
| MUST NOT remove parseBootSeed / ?seed= boot | judgment | ✓ resolved | main.ts silent boot retained |
| MUST NOT change crash FX to eject/explode | judgment | ✓ resolved | sever/flash/hold/fade retained |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| — | — | TBD/FIXME/XXX in Phase 6 modified sources | — | None found |
| `src/games/crash/hud/CrashHud.ts` | keydown | Window keydown without dispose teardown | ℹ️ Info | Carry-forward 06-REVIEW WR-02 / Phase 5 — not goal-blocking |
| `src/styles/hud.css` | shell | 100dvh overflow:hidden may clip short landscape | ℹ️ Info | 06-REVIEW WR-03 — UAT soft phones; not a must-have fail |
| `src/games/crash/hud/CrashHud.ts` | getStake | Non-finite stake coerces to DISPLAY_MIN | ℹ️ Info | 06-REVIEW WR-01 — manual placeBet rejects; auto path softer |

**Anti-patterns:** 0 blockers, 3 info notes (pre-existing review warnings)

### Test Quality Audit

| Requirement | Test file(s) | Disabled tests | Circular? | Notes |
|-------------|--------------|----------------|-----------|-------|
| UI-01 | shell.hud-layout.test.ts | none | no | Selectors/CSS; not live viewport |
| UI-02 | primaryChrome.test.ts | none | no | Chrome kinds proven; live DOM UAT |
| UI-03 | autoBet.test.ts | none | no | Gate proven; composition loop untested |
| WALT-03Δ | chips.test.ts | none | no | Presets + maxAffordableStake |
| WALT-04Δ | (binder code) | none | no | No dedicated Auto CO dim unit test |
| FEEL-01 | multiplierCurve.test.ts | none | no | Strong 3750→2 lock |
| FEEL-02 | pathMapping.test.ts | none | no | Soft/tilt proven; CrashScene sync not |
| PLSH-03Δ | parseBootSeed + shell seed-chip absent | none | no | Chip deleted; silent boot retained |
| VIS-01Δ | pathMapping + code read CrashScene | none | no | Camera spectacle → human |

### Human Verification Required

### 1. 100dvh shell / no page scroll (UI-01)

**Test:** `npm run dev` — phone/tablet/desktop; confirm column zones and no page scroll.
**Expected:** D-01 topology; canvas playable leftover; no dual-bet/DEMO.
**Why human:** Layout string tests ≠ live viewport (short landscape clip noted in 06-REVIEW).

### 2. Dual-line primary cycle (UI-02)

**Test:** BET → CASH OUT live win → CASHED OUT frozen → waiting BET; crash-without-cash snaps to BET.
**Expected:** Single primary; English; correct amounts/disabled states.
**Why human:** Mid-flight DOM chrome not covered by Vitest.

### 3. Auto bet consecutive rounds (UI-03)

**Test:** Auto bet ON; consecutive waiting places; mid-flight stake edit; drain to broke.
**Expected:** Place at waiting start; next stake applies; stop + Reset emphasize; no auto resetWallet.
**Why human:** Composition placeBet + broke UX untested end-to-end.

### 4. Climb pace (FEEL-01)

**Test:** Watch ~2× arrive in ~3.5–4s; crash odds feel unchanged.
**Expected:** Milder climb; distribution not retuned.
**Why human:** Perceived pace needs live play.

### 5. Arcade camera + crash FX (FEEL-02 / VIS-01Δ)

**Test:** Craft mid-frame + scrolling trail + gentle tilt; crash freeze + sever/flash/hold/idle; theater clear.
**Expected:** world camera only; D-19 choreography unchanged.
**Why human:** Canvas CrashScene.sync not unit-tested.

### 6. Silent seed + Phase 5 polish (PLSH-03Δ / D-05)

**Test:** No Seed chip; `/?seed=demo-a` quiet boot; invalid → portfolio-demo quiet; countdown/mute/stats/keyboard still work.
**Expected:** Silent boot only; polish relocated in new shell.
**Why human:** Boot/polish UX needs browser.

## Gaps Summary

**No critical gaps.** All roadmap artifacts exist, are substantive, and are wired. UI-01..03, WALT-03Δ/04Δ, FEEL-01/02, PLSH-03Δ, VIS-01Δ are implemented with unit tests for pure helpers (primaryChrome, chips, autoBet gate, multiplierCurve, pathMapping, parseBootSeed, shell layout). Full suite **127/127** and `tsc --noEmit` green. `seedChip.ts` deleted; no stage.x/y camera writes.

Automated score is **4/6** roadmap truths because Auto bet composition loop and arcade camera spectacle are present+wired but not behaviorally proven without a browser — status **human_needed** until the six UAT items above are confirmed.

### Deferred Items

None — Phase 6 is the final milestone phase; CONTEXT deferred items (dual-bet/X2, eject/explode FX, crash RNG retune, full `?seed=` removal) are explicitly out of scope, not gaps.

---

## Verification Metadata

**Verification approach:** Goal-backward (roadmap SCs + PLAN must_haves) against live source
**Must-haves source:** ROADMAP Phase 6 Success Criteria + 06-01..06-04 PLAN frontmatter
**Automated checks:** 9 spot-checks passed (incl. full suite 127/127); 0 failed
**Human checks required:** 6
**Decision coverage:** 24/24 honored (non-blocking)
**gsd-tools:** `roadmap.get-phase 06`; `verify.artifacts` all plans passed; `verify.key-links` path-schema skip → manual; `verification.fingerprint` → covered_digest
**Total verification time:** ~15 min

---
_Verified: 2026-09-29T16:30:00Z_
_Verifier: Claude (gsd-verifier)_
