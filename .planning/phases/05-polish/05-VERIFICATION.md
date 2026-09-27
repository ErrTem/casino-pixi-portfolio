---
phase: 05-polish
verified: 2026-09-27T14:16:00Z
status: passed
score: 2/4 must-haves verified
covered_files:

  - .planning/REQUIREMENTS.md
  - .planning/ROADMAP.md
  - .planning/phases/05-polish/05-01-PLAN.md
  - .planning/phases/05-polish/05-01-SUMMARY.md
  - .planning/phases/05-polish/05-02-PLAN.md
  - .planning/phases/05-polish/05-02-SUMMARY.md
  - .planning/phases/05-polish/05-03-PLAN.md
  - .planning/phases/05-polish/05-03-SUMMARY.md
  - .planning/phases/05-polish/05-04-PLAN.md
  - .planning/phases/05-polish/05-04-SUMMARY.md
  - .planning/phases/05-polish/05-CONTEXT.md
  - index.html
  - src/games/crash/hud/CrashHud.ts
  - src/games/crash/hud/enablement.ts
  - src/games/crash/hud/seedChip.ts
  - src/games/crash/hud/sessionStats.test.ts
  - src/games/crash/hud/sessionStats.ts
  - src/games/crash/view/CrashScene.ts
  - src/games/crash/view/formatWaitCountdown.test.ts
  - src/games/crash/view/formatWaitCountdown.ts
  - src/main.ts
  - src/shared/audio/AudioPort.ts
  - src/shared/audio/createBeepAudioPort.ts
  - src/shared/audio/mutePref.test.ts
  - src/shared/audio/mutePref.ts
  - src/shared/audio/sfxEdges.test.ts
  - src/shared/audio/sfxEdges.ts
  - src/shared/boot/parseBootSeed.test.ts
  - src/shared/boot/parseBootSeed.ts
  - src/styles/hud.css
  - tests/architecture.no-pixi.test.ts

covered_digest: "v1:sha256:9ca88d8b4e269f906cfb1c36bafdedd61cf0f6911b74e8140f00b5b71d9fa9c7"
behavior_unverified: 2
overrides_applied: 0
decision_coverage:
  honored: 16
  total: 16
  not_honored: []
behavior_unverified_items:

  - truth: "Player sees a waiting-phase countdown before the next flight starts"
    test: "npm run dev — watch theater during waiting idle; confirm continuous tenths then clear on climb"
    expected: "White tenths (5.0→4.9…) on TheaterText live BitmapText while waiting+idle; climb shows live ×; no GO flash; crash hold/fade still show crash ×"
    why_human: "formatWaitCountdown unit-tested and CrashScene showCountdown branch is wired, but no test exercises CrashScene.sync → BitmapText frames"
  - truth: "Key events play SFX placeholders with a working mute toggle"
    test: "npm run dev — unmute; place bet → hear bet_lock + takeoff; cash out / crash → hear those; mute; reload and confirm mute sticks"
    expected: "Four distinct beeps when unmuted; mute silences play; Sound: On|Off persists via crash-demo:mute"
    why_human: "sfxEdges + mutePref unit-tested and main/HUD wired; Web Audio oscillator audibility and mute UX need a live browser"
human_verification:

  - test: "npm run dev — waiting idle shows continuous tenths in canvas theater; digits clear when flight starts; crash hold/fade still show crash × (no GO flash)."
    expected: "White 5.0→4.9… on theater live node; climb → live ×; crash paths unchanged"
    why_human: "Canvas theater spectacle — no CrashScene sync / Pixi BitmapText test"
  - test: "Unmute; place bet → bet_lock + takeoff beeps; cash out and/or crash → matching beeps; mute silences; reload keeps mute preference."
    expected: "Four distinct pitches; mute no-op; Sound: Off persists across reload"
    why_human: "Web Audio + localStorage UX cannot be proven by Vitest alone"
  - test: "Open /?seed=demo-a — Seed chip reveals demo-a and Copy writes seed string; open without query → portfolio-demo; garbage ?seed= → fallback + optional using default."
    expected: "Chip textContent shows active seed; clipboard gets seed string not a share URL; invalid falls back to portfolio-demo"
    why_human: "parseBootSeed unit-tested; collapsible chip/clipboard gesture needs browser"
  - test: "Empty history shows — / n/a near strip; after rounds avg/max update; mid-flight Space/Enter cash out when focus is not in inputs; typing in bet/auto ignores keys."
    expected: "Placeholders never 0.00×; stats update from snapshot.history; keyboard matches Cash out enablement"
    why_human: "sessionStats unit-tested; live keydown + focus-guard feel needs browser"
---

# Phase 5: Polish Verification Report

**Phase Goal:** Shareable polish — waiting countdown, SFX placeholders + mute, seed URL/display, soft session stats, desktop keyboard cash-out.
**Verified:** 2026-09-27T14:16:00Z
**Status:** human_needed
**Re-verification:** No — initial verification
**Mode:** mvp (ROADMAP Phase 5 goal is capability-style; User Flow Coverage uses a validated composite user story aligning 05-01–05-04 plan goals)

## User Flow Coverage

User story: «As a recruiter sharing the Crash demo, I want to see a waiting countdown, hear SFX with mute, use seed URL/display, glance at soft session stats, and cash out via keyboard, so that the polish is shareable.»

Validated via `gsd-tools query user-story.validate` → `valid: true`.

| Step | Expected | Evidence | Status |
|------|----------|----------|--------|
| Waiting countdown | Theater tenths before next flight | `formatWaitCountdown` + `CrashScene` `showCountdown` (`phase===waiting && mode===idle`) → TheaterText live | ⚠️ wired; visual UAT |
| SFX + mute | Four beeps + HUD mute that persists | `AudioPort` / `createBeepAudioPort` / `sfxEventsFromTransition` / `mutePref` + HUD mute + main ticker | ⚠️ wired; audible UAT |
| Seed URL/display | `?seed=` boots session; chip reveals/copies | `parseBootSeed` → `createGame({ seed })`; `mountSeedChip` textContent + clipboard | ✓ (parse+wire); chip UAT |
| Soft stats | Avg/max near history; empty — / n/a | `sessionStatsFrom` + `CrashHud.render` textContent bind; `index.html` session-stats | ✓ |
| Keyboard cash-out | Space/Enter → `requestCashOut` when `canCashOut` and not editing | `CrashHud` keydown + `isEditableTarget` + `enablementFrom` | ✓ wired; feel UAT |
| Outcome | Shareable polish (PLSH-01..05) | REQUIREMENTS mapped Complete; suite 104/104; no gaps in artifacts | ✓ structure |

## Goal Achievement

### Observable Truths

Roadmap success criteria (contract). SC1–SC2 are present+wired but canvas/audio runtime not exercised by tests → ⚠️ PRESENT_BEHAVIOR_UNVERIFIED. SC3–SC4 have strong unit + wiring evidence → ✓ VERIFIED (chip expand/copy and keyboard mid-flight feel still listed under Human Verification as UAT, not as failed truths).

| # | Truth | Status | Evidence |
| --- | ------- | ---------- | -------------- |
| 1 | Player sees a waiting-phase countdown before the next flight starts | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `formatWaitCountdown.ts` `(ms/1000).toFixed(1)`; tests 5000→5.0 / 4900→4.9 / ≤0→0.0; `CrashScene.ts` `showCountdown` sets white/full-alpha liveText; climb branch still `formatMult` — no sync/canvas test |
| 2 | Key events play SFX placeholders with a working mute toggle | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `sfxEdges.test.ts` takeoff/cash_out/crash + idempotent pair; `mutePref.test.ts` crash-demo:mute round-trip; `createBeepAudioPort` muted early-return + pitches 440/660/880/160; `main.ts` edges after tick; HUD mute + `bet_lock` on `placeBet` ok — audible path untested |
| 3 | Player can reproduce a round via `?seed=` and/or read the active seed on screen | ✓ VERIFIED | `parseBootSeed.test.ts` 8/8 (missing/empty/whitespace/control/overlong/valid opaque); `main.ts` `parseBootSeed(window.location.search)` → `createGame({ seed })` + HUD options; `seedChip.ts` `textContent` + `clipboard.writeText(seed)` (not URL); no `popstate`/`hashchange` |
| 4 | Soft session stats (e.g. average / max crash) appear from history; desktop keyboard shortcut cashes out mid-flight | ✓ VERIFIED | `sessionStats.test.ts` empty —/n/a, single, multi, non-finite; `CrashHud.render` binds `stat-avg`/`stat-max`; keydown Space\|Enter → `enablementFrom(lastSnap).canCashOut` → `game.requestCashOut()` with `isEditableTarget` guard; `enablement.ts` unmodified |

**Score:** 2/4 truths verified (2 present, behavior-unverified)

### Additional plan truths (supporting)

| Truth | Status | Evidence |
|-------|--------|----------|
| formatWaitCountdown clamps non-positive → 0.0; no × suffix (05-01) | ✓ VERIFIED | `formatWaitCountdown.test.ts` 4/4 |
| Countdown gated waiting+idle; crash hold/fade unchanged (D-03) | ✓ VERIFIED (code) | `CrashScene.ts` branches; climb clears countdown |
| GameLogic waitRemainingMs / resolveTick unchanged | ✓ VERIFIED | No Phase 5 edits under `src/games/crash/logic/`; architecture.no-pixi green |
| sfxEdges never emits bet_lock; null prev → [] (05-02) | ✓ VERIFIED | `sfxEdges.test.ts` |
| Mute last-write-wins to crash-demo:mute only (05-02) | ✓ VERIFIED | `mutePref.ts` / tests; no wallet/seed under mute key |
| No Howler; no countdown tick SFX | ✓ VERIFIED | `package.json` has no howler; SfxEvent is four events only |
| parseBootSeed control/length >128 → invalid + portfolio-demo (05-03) | ✓ VERIFIED | `parseBootSeed.test.ts` |
| Seed chip textContent only; copy seed string (05-03) | ✓ VERIFIED (code) | `seedChip.ts`; no `innerHTML` in CrashHud |
| sessionStats empty never 0.00× (05-04 / D-16) | ✓ VERIFIED | `sessionStats.test.ts` |
| Keyboard ignores editable focus; preventDefault only when cashing out (05-04) | ✓ VERIFIED (code) | `CrashHud.ts` keydown guard order |

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | ----------- | ------ | ------- |
| `src/games/crash/view/formatWaitCountdown.ts` | Tenths formatter | ✓ VERIFIED | Pure; no Pixi/DOM/logic imports |
| `src/games/crash/view/formatWaitCountdown.test.ts` | Unit cases | ✓ VERIFIED | 4 passed |
| `src/games/crash/view/CrashScene.ts` | waiting+idle countdown | ✓ VERIFIED | Imports + calls formatWaitCountdown; climb/crash paths intact |
| `src/shared/audio/AudioPort.ts` | SfxEvent + AudioPort | ✓ VERIFIED | Four events + play/setMuted/unlock/dispose |
| `src/shared/audio/createBeepAudioPort.ts` | Oscillator adapter | ✓ VERIFIED | Mute no-op; distinct pitches; dispose closes context |
| `src/shared/audio/sfxEdges.ts` | Edge detector | ✓ VERIFIED | takeoff/cash_out/crash only |
| `src/shared/audio/sfxEdges.test.ts` | Edge cases | ✓ VERIFIED | 6 passed |
| `src/shared/audio/mutePref.ts` | load/save mute | ✓ VERIFIED | Injectable store; crash-demo:mute |
| `src/shared/audio/mutePref.test.ts` | Round-trip | ✓ VERIFIED | 4 passed |
| `src/shared/boot/parseBootSeed.ts` | Boot seed parse | ✓ VERIFIED | DEFAULT_DEMO_SEED + boundaries |
| `src/shared/boot/parseBootSeed.test.ts` | Boundary cases | ✓ VERIFIED | 8 passed |
| `src/games/crash/hud/seedChip.ts` | Collapsible chip | ✓ VERIFIED | textContent + Copy; using default note |
| `src/games/crash/hud/sessionStats.ts` | Avg/max labels | ✓ VERIFIED | — / n/a empty contract |
| `src/games/crash/hud/sessionStats.test.ts` | Stats cases | ✓ VERIFIED | 5 passed |
| `src/games/crash/hud/CrashHud.ts` | Mute/seed/stats/keyboard | ✓ VERIFIED | All PLSH-02..05 HUD wires |
| `src/main.ts` | Boot + ticker SFX | ✓ VERIFIED | parseBootSeed → createGame; edges; audio.dispose HMR |
| `index.html` | mute / seed-chip / session-stats hosts | ✓ VERIFIED | data-action=mute; data-field hosts |
| `src/styles/hud.css` | Compact chrome | ✓ VERIFIED | session-stats/seed-chip/mute; `--hud-bar-height: 15.5rem` ≤720px |

**Artifacts:** 17/17 verified (exists + substantive + wired)

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | --- | --- | ------ | ------- |
| waitRemainingMs + waiting+idle | TheaterText live BitmapText | formatWaitCountdown in CrashScene.sync | ✓ WIRED | `CrashScene.ts` showCountdown branch |
| mode climb | live × | formatMult | ✓ WIRED | climb else-branch clears countdown |
| prevSnap → nextSnap | audio.play | sfxEventsFromTransition in main ticker | ✓ WIRED | `main.ts` after `game.tick`, before hud.render |
| HUD mute button | localStorage crash-demo:mute | setMuted + saveMutePref | ✓ WIRED | CrashHud mute click |
| placeBet result.ok | bet_lock + unlock | CrashHud click | ✓ WIRED | only on ok path |
| window.location.search | createGame({ seed }) | parseBootSeed at boot | ✓ WIRED | `main.ts` |
| composition-root seed | Seed chip textContent + clipboard | mountCrashHud options → mountSeedChip | ✓ WIRED | seedChip.ts |
| snapshot.history | stat-avg / stat-max | sessionStatsFrom in render | ✓ WIRED | textContent bind |
| keydown Space\|Enter | game.requestCashOut | isEditableTarget + canCashOut | ✓ WIRED | CrashHud.ts |

**Wiring:** 9/9 connections verified

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| Theater countdown | waitRemainingMs | GameLogic waiting cadence via snapshot | Yes — existing resolveTick | ✓ FLOWING |
| SFX edges | prev/next CrashSnapshot | game.tick → getSnapshot | Yes — live transitions | ✓ FLOWING |
| Mute pref | muted boolean | localStorage crash-demo:mute | Yes — load at boot / save on toggle | ✓ FLOWING |
| Boot seed | seed string | URLSearchParams ?seed= | Yes — opaque string to createGame | ✓ FLOWING |
| Seed chip | seed display | composition-root options.seed | Yes — same boot seed | ✓ FLOWING |
| Session stats | avg/max labels | snapshot.history finite numbers | Yes — ring from GameLogic | ✓ FLOWING |
| Keyboard CO | canCashOut | enablementFrom(lastSnap) | Yes — flying && hasBet | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| formatWaitCountdown cases | `npx vitest run src/games/crash/view/formatWaitCountdown.test.ts` | 4 passed | ✓ PASS |
| sfxEdges + mutePref | `npx vitest run src/shared/audio/sfxEdges.test.ts src/shared/audio/mutePref.test.ts` | 10 passed | ✓ PASS |
| parseBootSeed boundaries | `npx vitest run src/shared/boot/parseBootSeed.test.ts` | 8 passed | ✓ PASS |
| sessionStats | `npx vitest run src/games/crash/hud/sessionStats.test.ts` | 5 passed | ✓ PASS |
| architecture.no-pixi | `npx vitest run tests/architecture.no-pixi.test.ts` | 7 passed | ✓ PASS |
| Full suite (once) | `npm test` | **104 passed** / 20 files | ✓ PASS |
| Typecheck | `npx tsc --noEmit` | exit 0 | ✓ PASS |

### Probe Execution

| Probe | Command | Result | Status |
| ----- | ------- | ------ | ------ |
| — | — | No `scripts/*/tests/probe-*.sh` declared for Phase 5 | SKIP |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| PLSH-01 | 05-01 | Waiting-phase countdown before next flight | ✓ SATISFIED (code); UAT for spectacle | formatWaitCountdown + CrashScene waiting+idle; REQUIREMENTS Complete |
| PLSH-02 | 05-02 | SFX placeholders + mute toggle | ✓ SATISFIED (code); UAT for audio | AudioPort beeps + mutePref + HUD/main wire |
| PLSH-03 | 05-03 | `?seed=` and/or on-screen seed | ✓ SATISFIED | parseBootSeed + createGame + Seed chip |
| PLSH-04 | 05-04 | Soft session stats from history | ✓ SATISFIED | sessionStatsFrom + HUD bind near strip |
| PLSH-05 | 05-04 | Desktop keyboard cash-out | ✓ SATISFIED (code); UAT for feel | Space/Enter → requestCashOut + focus guard |

**Orphaned requirements:** none — REQUIREMENTS maps PLSH-01..05 → Phase 5; all appear in plan frontmatter.

**Coverage:** 5/5 requirements satisfied in code (visual/audio/keyboard feel → human UAT below)

### Decision Coverage

All trackable CONTEXT.md decisions are honored by shipped artifacts. (`honored: 16 / total: 16`, non-blocking gate)

### Prohibitions

| Prohibition | Tier | Status | Evidence |
|-------------|------|--------|----------|
| MUST NOT place waiting countdown in HUD / HTML overlay | judgment | ✓ resolved | CrashScene theater only; no HUD countdown |
| MUST NOT play countdown tick SFX / GO flash / crash-hold countdown | judgment | ✓ resolved | Four SfxEvents only; climb clears digits |
| MUST NOT edit GameLogic settle/cadence or import audio/DOM into logic/ | judgment | ✓ resolved | No Phase 5 logic/ edits; no audio imports in logic/ |
| MUST NOT present DEMO badge UI | judgment | ✓ resolved | Grep clean on index.html / HUD |
| MUST NOT install Howler | judgment | ✓ resolved | package.json has no howler |
| MUST NOT persist wallet/seed under mute key | judgment | ✓ resolved | MUTE_STORAGE_KEY = crash-demo:mute only |
| MUST NOT render seed via innerHTML | judgment | ✓ resolved | seedChip textContent / createElement |
| MUST NOT watch mid-session ?seed= / popstate | judgment | ✓ resolved | No popstate/hashchange listeners in src/ |
| MUST NOT copy share URL instead of seed string | judgment | ✓ resolved | `writeText(seed)` |
| MUST NOT show 0.00× when history empty | test | ✓ resolved | sessionStats.test.ts |
| MUST NOT cash out via keyboard while editable focused | judgment | ✓ resolved | isEditableTarget guard |
| MUST NOT invent parallel history array | judgment | ✓ resolved | sessionStatsFrom(snap.history) only |
| MUST NOT change enablementFrom / GameLogic for keyboard | judgment | ✓ resolved | enablement.ts last commit Phase 3; same requestCashOut |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| — | — | TBD/FIXME/XXX in Phase 5 modified sources | — | None found |
| `src/games/crash/hud/CrashHud.ts` | ~212 | Window keydown without dispose teardown | ℹ️ Info | Documented SPA/HMR note; 05-REVIEW warning — not goal-blocking |
| `src/games/crash/hud/seedChip.ts` | ~74 | clipboard.writeText without catch | ℹ️ Info | 05-REVIEW warning — copy may reject; still copies seed string on success |

**Anti-patterns:** 0 blockers, 2 info notes (pre-existing review warnings)

### Test Quality Audit

| Requirement | Test file(s) | Disabled tests | Circular? | Notes |
|-------------|--------------|----------------|-----------|-------|
| PLSH-01 | formatWaitCountdown.test.ts | none | no | Formatter proven; CrashScene sync not unit-tested |
| PLSH-02 | sfxEdges.test.ts, mutePref.test.ts | none | no | Edges + mute; createBeepAudioPort untested (code-reviewed) |
| PLSH-03 | parseBootSeed.test.ts | none | no | Strong boundary coverage |
| PLSH-04 | sessionStats.test.ts | none | no | Empty/single/multi/non-finite |
| PLSH-05 | (enablement.test.ts supports canCashOut) | none | no | No dedicated keydown test — wiring by code read |

### Human Verification Required

### 1. Waiting theater countdown (PLSH-01)

**Test:** `npm run dev` — watch waiting idle; confirm continuous tenths then clear on climb; crash hold/fade still crash ×.
**Expected:** White 5.0→4.9…; no GO flash; climb shows live ×.
**Why human:** Canvas BitmapText spectacle not covered by Vitest.

### 2. SFX + mute (PLSH-02)

**Test:** Unmute; place bet → bet_lock + takeoff; cash out / crash → matching beeps; mute; reload.
**Expected:** Four distinct pitches; mute silences; Sound: Off persists.
**Why human:** Web Audio + preference UX need live browser/speakers.

### 3. Seed chip + URL (PLSH-03)

**Test:** `/?seed=demo-a` reveal/copy; no query → portfolio-demo; invalid seed → fallback + using default.
**Expected:** Chip shows seed via textContent; Copy writes seed string; invalid falls back.
**Why human:** Collapsible chip / clipboard gesture not in Vitest.

### 4. Session stats + keyboard cash-out (PLSH-04 / PLSH-05)

**Test:** Empty —/n/a; after rounds avg/max update; mid-flight Space/Enter cash out; typing in bet/auto ignores keys.
**Expected:** Placeholders never 0.00×; keyboard matches Cash out button enablement.
**Why human:** Focus-guard feel and live keydown path need browser.

## Gaps Summary

**No critical gaps.** All roadmap artifacts exist, are substantive, and are wired. PLSH-01..05 are implemented in source with unit tests for pure helpers (formatWaitCountdown, sfxEdges, mutePref, parseBootSeed, sessionStats). Full suite **104/104** and `tsc --noEmit` green.

Automated score is **2/4** roadmap truths because waiting countdown spectacle and audible SFX/mute UX are present+wired but not behaviorally proven without a browser — status **human_needed** until the four UAT items above are confirmed.

### Deferred Items

None — Phase 5 is the final milestone phase; CONTEXT deferred items (share-URL copy, Howler assets, countdown tick SFX, mid-session seed watch) are explicitly out of scope, not gaps.

---

## Verification Metadata

**Verification approach:** Goal-backward (roadmap SCs + PLAN must_haves) against live source
**Must-haves source:** ROADMAP Phase 5 Success Criteria + 05-01..05-04 PLAN frontmatter
**Automated checks:** 7 spot-checks passed (incl. full suite 104/104); 0 failed
**Human checks required:** 4
**Decision coverage:** 16/16 honored (non-blocking)
**Total verification time:** ~12 min

---
_Verified: 2026-09-27T14:16:00Z_
_Verifier: Claude (gsd-verifier)_
