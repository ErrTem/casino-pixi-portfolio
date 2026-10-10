---
phase: 03-diskette-collectors-trigger-queue
verified: 2026-10-10T21:10:00Z
status: human_needed
score: 1/3 must-haves verified
covered_files:
  - .planning/REQUIREMENTS.md
  - .planning/ROADMAP.md
  - .planning/phases/03-diskette-collectors-trigger-queue/03-01-PLAN.md
  - .planning/phases/03-diskette-collectors-trigger-queue/03-01-SUMMARY.md
  - .planning/phases/03-diskette-collectors-trigger-queue/03-02-PLAN.md
  - .planning/phases/03-diskette-collectors-trigger-queue/03-02-SUMMARY.md
  - .planning/phases/03-diskette-collectors-trigger-queue/03-03-PLAN.md
  - .planning/phases/03-diskette-collectors-trigger-queue/03-03-SUMMARY.md
  - .planning/phases/03-diskette-collectors-trigger-queue/03-04-PLAN.md
  - .planning/phases/03-diskette-collectors-trigger-queue/03-04-SUMMARY.md
  - .planning/phases/03-diskette-collectors-trigger-queue/03-05-PLAN.md
  - .planning/phases/03-diskette-collectors-trigger-queue/03-05-SUMMARY.md
  - .planning/phases/03-diskette-collectors-trigger-queue/03-CONTEXT.md
  - .planning/phases/03-diskette-collectors-trigger-queue/03-ASSET-LIST.md
  - index.html
  - public/assets/hotline/diskette-green.png
  - public/assets/hotline/diskette-red.png
  - public/assets/hotline/diskette-purple.png
  - src/games/hotline/config/HotlineConfigSchema.ts
  - src/games/hotline/config/hotline.config.json
  - src/games/hotline/hud/HotlineHud.ts
  - src/games/hotline/logic/HotlineGame.ts
  - src/games/hotline/logic/collectors/TokenColors.ts
  - src/games/hotline/logic/collectors/resolveCollectors.ts
  - src/games/hotline/logic/collectors/PhoneMeters.ts
  - src/games/hotline/logic/collectors/ComboQueue.ts
  - src/games/hotline/session/mountHotlineSession.ts
  - src/games/hotline/session/collectPresentation.ts
  - src/games/hotline/view/HotlineScene.ts
  - src/games/hotline/view/TokenFlight.ts
  - src/games/hotline/view/PhonesLayer.ts
  - src/games/hotline/view/winCycle.ts
  - src/games/hotline/view/WinLinesOverlay.ts
  - src/games/hotline/view/loadHotlineAssets.ts
  - src/shared/audio/AudioPort.ts
  - src/shared/audio/createBeepAudioPort.ts
  - src/styles/hud.css
  - tests/hotline.assets.test.ts
covered_digest: "v1:sha256:bb77de243b84da8234762b0801bd7a4295897977c20da25c40986b9bdd7a981b"
behavior_unverified: 2
overrides_applied: 0
decision_coverage:
  honored: 16
  total: 16
  not_honored: []
behavior_unverified_items:
  - truth: "Colored diskette tokens appear on reel symbols and fly into the matching rotary phone meter"
    test: "Launch HOTLINE, spin until a diskette spawn lands; watch overlay on a cell then neon arc into the matching phone"
    expected: "Green/red/purple diskette textures overlay cells (not replacing symbols) and fly in parallel arcs to the matching phone centers"
    why_human: "TokenFlight and DISKETTE_URLS are wired; no headless Pixi test exercises start/tick/onLand rendering"
  - truth: "Phone meters visibly grow (signal bars / neon intensity) as tokens accumulate"
    test: "On token land, watch signal bars under phones; land several of one color across spins"
    expected: "Procedural neon bars fill 0..meterTarget per phone as tokens land; soft-cap stays full when count exceeds target"
    why_human: "progressiveDisplayFills and PhoneMeters are unit-tested; PhonesLayer Graphics bar growth is not rendered headless"
human_verification:
  - test: "Full collector loop walkthrough (03-05 human-check)"
    expected: "Colored tokens fly to phones, meters grow, combo stub drains Green→Red→Purple with glow + COMBO strip, Spin stays locked through flights/stub, collector beeps fire, mute silences them"
    why_human: "End-to-end Pixi + DOM + audio presentation has no automated mount; SUMMARY claims 2026-10-10 sign-off but verifier does not treat SUMMARY as evidence"
  - test: "Diskette art matches phone colors (03-01 human-check)"
    expected: "diskette-green/red/purple.png under public/assets/hotline/ read as green/red/purple tokens next to matching phones"
    why_human: "PNG signatures and asset-list wiring are verified; color fidelity is a visual judgment"
---

# Phase 3: Diskette Collectors + Trigger Queue Verification Report

**Phase Goal:** As a portfolio visitor playing HOTLINE, I want to collect colored diskettes into three phone meters and see combo nights enqueue when tokens land, so that the Witch Pots collector loop is readable before real bonuses arrive in Phase 4.
**Verified:** 2026-10-10T21:10:00Z
**Status:** human_needed
**Re-verification:** No — initial verification
**Mode:** mvp

Goal-backward check against the codebase, not SUMMARY claims. Collector math, config, HUD binders, progressive fill helpers, and beep pitches are unit-tested and wired. Pixi TokenFlight arcs and PhonesLayer bar growth are present and session-wired but not exercised headless, so visitor-facing success criteria 1–2 stay behavior-unverified. Logic for random triggers and fixed-order combo enqueue is verified. Real Green/Red/Purple bonus engines correctly remain Phase 4.

## User Flow Coverage

User story: «As a portfolio visitor playing HOTLINE, I want to collect colored diskettes into three phone meters and see combo nights enqueue when tokens land, so that the Witch Pots collector loop is readable before real bonuses arrive in Phase 4.»

| Step | Expected | Evidence | Status |
|------|----------|----------|--------|
| Open HOTLINE | Menu launches playable HOTLINE session | `gameRegistry` → `mountHotlineSession`; session loads config, mounts HUD + view | ✓ |
| Spin collects | Diskette overlays appear on cells after settle / win gate | `resolveCollectors` spawns + `TokenFlight.start` from `startCollectors` after `winsDone` / no-wins path | ⚠️ wired, not rendered headless |
| Meters grow | Signal bars under phones increase on land | `onCollectorLand` → `progressiveDisplayFills` → `setPhoneMeters` → `PhonesLayer.setMeters` | ⚠️ math tested; bars not rendered headless |
| Combo enqueue | Triggered phones show in fixed order; stub drains | `collectorOutcome.queue` Green→Red→Purple; `beginStubOrIdle` + `formatComboStrip` + glow + `resetPhoneMeter` | ✓ logic; stub presentation needs eyes/ears |
| Outcome | Witch Pots collector loop readable before Phase 4 bonuses | End-to-end path idle→reels→win_gate→flights→stub→idle with Spin lock; stub only (no feature engines) | ⚠️ needs human walkthrough |

## Goal Achievement

### Observable Truths

| #   | Truth (ROADMAP success criteria) | Status | Evidence |
| --- | -------------------------------- | ------ | -------- |
| 1 | Colored diskette tokens appear on reel symbols and fly into the matching rotary phone meter | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | PNG pack exists (89-50-4E-47 signatures). `DISKETTE_URLS` + `textures.diskettes` required in `loadHotlineAssets.ts`. `createTokenFlight` overlays sprites at cell centers, quadratic neon arcs to `phoneCenters` by color index, parallel flights, `onLand` callback. Scene stacks flight above reels; session calls `startCollectors` / `tickCollectors` after finite win gate. No Pixi test runs `TokenFlight.tick`. |
| 2 | Phone meters visibly grow (signal bars / neon intensity) as tokens accumulate | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `PhoneMeters` soft-caps display (`PhoneMeters.test.ts`). `progressiveDisplayFills` grows one land at a time from pre-spin baseline (`collectPresentation.test.ts` — named test passed). Session `onCollectorLand` applies progressive fills; `PhonesLayer` draws procedural neon segments 0..meterTarget + glow. Visual bar growth untested headless. |
| 3 | Landing a token can randomly trigger that phone's bonus; multiple phones can enqueue as combo nights (queue stub ready for Phase 4 features) | ✓ VERIFIED | `resolveCollectors` rolls `triggerChance` per spawn independent of meter fill; queue is fixed Green→Red→Purple (`resolveCollectors.test.ts`, `ComboQueue.test.ts` — named pop-drain test passed). `HotlineGame.spin` attaches `collectorOutcome`, books meters once, sets combo queue (`HotlineGame.test.ts` — named attach/book test passed). Session stub drains queue with glow + COMBO strip + `resetPhoneMeter` per pop (`mountHotlineSession.ts`); no Phase 4 feature engines present (intentional stub). |

**Score:** 1/3 truths verified (2 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `03-ASSET-LIST.md` + `diskette-*.png` | Diskette art handoff | ✓ VERIFIED | List + three PNGs with valid signatures; `gsd_run verify.artifacts` 03-01 passed |
| `resolveCollectors.ts` / `PhoneMeters.ts` / `ComboQueue.ts` | Collectors math | ✓ VERIFIED | Substantive + exported; wired from `HotlineGame` |
| `HotlineGame.ts` | `collectorOutcome` on spin | ✓ VERIFIED | Separate `:collectors` RNG; settle booking; snapshot fills |
| `TokenFlight.ts` | Neon arc flights | ✓ VERIFIED (static) | Wired via `HotlineScene`; runtime motion needs human |
| `PhonesLayer.ts` | Signal bars / glow / centers | ✓ VERIFIED (static) | Procedural Graphics; `setMeters` / `setGlow` / `phoneCenters` |
| `winCycle.ts` / overlay `isDone` | Finite win gate before tokens | ✓ VERIFIED | Named one-pass test passed; session waits `winsDone()` |
| `mountHotlineSession.ts` | Busy FSM flights → stub | ✓ VERIFIED (wired) | Phases `reels`→`win_gate`→`flights`→`stub`→`idle`; source contracts in `collectPresentation.test.ts` (not runtime FSM) |
| `HotlineHud.ts` + `index.html` combo | Busy lock + strip | ✓ VERIFIED | `setBusy` disables spin/bet; `data-field=combo` via `textContent` (`HotlineHud.test.ts`) |
| `AudioPort.ts` / `createBeepAudioPort.ts` | Collector beep events | ✓ VERIFIED | `token_spawn` / `token_land` / `phone_trigger` / `queue_step` in union + `PITCH_HZ`; session play edges asserted |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| `HotlineGame.ts` | `resolveCollectors.ts` | spin + `:collectors` RNG | WIRED | `gsd_run verify.key-links` 03-02 |
| `HotlineGame.ts` | `PhoneMeters.ts` | settle increment + snapshot | WIRED | |
| `HotlineConfigSchema.ts` | `hotline.config.json` | green/red/purple + triggerChance | WIRED | |
| `HotlineScene.ts` | `TokenFlight.ts` | `startCollectors` / `tickCollectors` | WIRED | |
| `loadHotlineAssets.ts` | `diskette-*.png` | `DISKETTE_URLS` | WIRED | |
| `mountHotlineSession.ts` | `TokenFlight` / progressive fills | after win gate + `onLand` | WIRED | |
| `mountHotlineSession.ts` | `PhonesLayer` via scene | `setPhoneMeters` / glow | WIRED | |
| `mountHotlineSession.ts` | `winCycle` / overlay | `winsDone` / `isDone` | WIRED | |
| `HotlineHud.ts` | `index.html` | `data-field=combo` + `setBusy` | WIRED | |
| `mountHotlineSession.ts` | `AudioPort` | collector `play(...)` edges | WIRED | |

`gsd_run query verify.artifacts` / `verify.key-links` returned valid for plans 03-01 through 03-05.

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `collectorOutcome` | spawns / queue | `resolveCollectors` + config `tokenOdds` + collectors RNG | Yes — RNG + Zod config | ✓ FLOWING |
| Logic `meterFills` | count / display | `PhoneMeters.increment` at spin settle | Yes | ✓ FLOWING |
| Display meter bars | fills array | pre-spin baseline + landed spawns → `progressiveDisplayFills` → `setMeters` | Yes — not final snapshot on every land | ✓ FLOWING |
| Combo strip | `stubQueue` text | `pendingOutcome.queue` → `formatComboStrip` → `textContent` | Yes | ✓ FLOWING |
| Token sprites | diskette textures | `Assets.load(DISKETTE_URLS)` | Yes — required textures | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Spin books collectors + queue | `npx vitest run -t "attaches collectorOutcome and books meter fills at settle"` | 1 passed | ✓ PASS |
| Progressive meter fills | `npx vitest run -t "grows one land at a time from a pre-spin baseline"` | 1 passed | ✓ PASS |
| Combo queue order | `npx vitest run -t "pop drain preserves green red purple order"` | 1 passed | ✓ PASS |
| HUD Spin lock | `npx vitest run -t "setBusy disables spin and bet steppers"` | 1 passed | ✓ PASS |
| Collector beep pitches | `npx vitest run -t "keeps collector events distinct from each other"` | 1 passed | ✓ PASS |
| Win-cycle one-pass gate | `npx vitest run -t "is done after one pass and does not wrap"` | 1 passed | ✓ PASS |
| Diskette PNG pack | file bytes + `tests/hotline.assets.test.ts` list coverage | PNG sig 89-50-4E-47 ×3 | ✓ PASS |

### Probe Execution

| Probe | Command | Result | Status |
| ----- | ------- | ------ | ------ |
| — | — | No phase-declared or conventional `scripts/*/tests/probe-*.sh` | SKIP |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| COLL-01 | 03-01, 03-02, 03-03, 03-04, 03-05 | Colored tokens appear and fly to matching phones | ? NEEDS HUMAN | Art + TokenFlight + session wiring present; flight appearance unverified headless |
| COLL-02 | 03-02, 03-03, 03-04, 03-05 | Phone meters visibly grow | ? NEEDS HUMAN | Soft-cap math + progressive fills tested; bar Graphics need eyes |
| COLL-03 | 03-02, 03-04, 03-05 | Random trigger; multi-phone combo queue | ✓ SATISFIED (logic) / ? human for stub UX | Trigger/queue math verified; stub presentation + beeps in walkthrough |

No orphaned Phase 3 requirements: ROADMAP maps only COLL-01..03 to Phase 3; all three appear in plan frontmatter.

### Decision Coverage

All trackable CONTEXT.md decisions are honored by shipped artifacts (`honored: 16 / total: 16`, non-blocking gate).

### Test Quality Audit

| Test File | Linked Req | Active | Skipped | Circular | Assertion Level | Verdict |
|-----------|-----------|--------|---------|----------|-----------------|---------|
| `resolveCollectors.test.ts` | COLL-01, COLL-03 | 4 | 0 | no | Value / order | OK |
| `PhoneMeters.test.ts` | COLL-02 | 2 | 0 | no | Value | OK |
| `ComboQueue.test.ts` | COLL-03 | 3 | 0 | no | Behavioral drain | OK |
| `HotlineGame.test.ts` (collector block) | COLL-01..03 | 3 | 0 | no | Value / parity | OK |
| `collectPresentation.test.ts` | COLL-02, COLL-03 | 6 | 0 | no | Value + source contract | OK (FSM is source-scan, not runtime) |
| `HotlineHud.test.ts` (busy/combo) | COLL-03 | 2 | 0 | no | Behavioral binder | OK |
| `winCycle.test.ts` | COLL-01 gate | 6 | 0 | no | Behavioral | OK |
| `createBeepAudioPort.test.ts` | COLL-01 SFX | collector cases | 0 | no | Value (distinct Hz) | OK |
| `hotline.assets.test.ts` | COLL-01 | diskette case | 0 | no | Existence | OK |

**Disabled tests on requirements:** 0  
**Circular patterns detected:** 0  
**Insufficient assertions:** session busy FSM relies on source-string contracts rather than a runtime state-machine test — WARNING only (does not block; already covered by PRESENT_BEHAVIOR_UNVERIFIED presentation truths)

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| — | — | No `TBD`/`FIXME`/`XXX` in hotline collector sources | — | — |
| `collectPresentation.test.ts` | source contracts | Presence grep for session FSM / SFX | ℹ️ Info | Proves wiring strings, not runtime transitions |
| `hotline.config.json` | bonus tables | Config lists freeSpins/pickEm multipliers | ℹ️ Info | Tables only; no feature engines (Phase 4) |

### Prohibitions (judgment-tier)

| Statement | Evidence | Flag |
| --------- | -------- | ---- |
| MUST NOT invent final diskette art in agent task | PNGs exist as user pack; ASSET-LIST handoff pattern | LLM-judge: held |
| MUST NOT require dedicated meter PNG pack | `PhonesLayer` procedural Graphics only | LLM-judge: held |
| MUST NOT implement Green FS / Red H&W / Purple Pick'em engines | No feature modules under `src/games/hotline` | LLM-judge: held |
| MUST NOT share strip RNG with collectors | `createRng(\`${seed}:collectors\`)` separate from SpinEngine | LLM-judge: held |
| MUST NOT raise triggerChance from fill | `resolveCollectors` uses config chances only | LLM-judge: held |
| MUST NOT use GSAP / pixi-reels / Howler this phase | No deps in package scan; ticker bezier + beep AudioPort | LLM-judge: held |
| MUST NOT use innerHTML for combo strip | `textContent` + HUD test forbids `.innerHTML` | LLM-judge: held |

`unverified-prohibition — human review recommended` (non-authoritative LLM judgment; does not silently pass).

### Human Verification Required

### 1. Full collector loop walkthrough

**Test:** `npm run dev` → open HOTLINE → Spin until tokens spawn (or many spins); unmute; optionally mute mid-loop  
**Expected:** Diskettes overlay cells and fly to matching phones; bars grow on land; if queue non-empty, glow + `COMBO: …` strip drains Green→Red→Purple with short beats and meter reset; Spin disabled until idle; four distinct beeps; mute silences them  
**Why human:** Pixi arcs, bar readability, stub pacing, and audio cannot be proven headless. PLAN 03-05 deferred this check; SUMMARY claims prior sign-off — reconfirm or accept UAT.

### 2. Diskette color fidelity

**Test:** Compare diskette PNGs to phone sprites in-scene  
**Expected:** Green/red/purple tokens read as matching the three phones  
**Why human:** Binary PNG validity ≠ color match

### Gaps Summary

No blocking implementation gaps for Phase 3 logic or wiring. Status is `human_needed` because ROADMAP success criteria 1–2 are visitor-visible presentation truths with no behavioral render tests, and PLAN human-checks remain for walkthrough / art fidelity. Combo trigger enqueue (criterion 3) is verified in logic with a Phase-4-ready stub drain path.

---

_Verified: 2026-10-10T21:10:00Z_
_Verifier: Claude (gsd-verifier)_
