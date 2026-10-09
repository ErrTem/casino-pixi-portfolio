---
phase: 01-portfolio-shell-crash-session
verified: 2026-10-09T17:10:00Z
status: passed
score: 5/5 must-haves verified
covered_files:
  - .planning/REQUIREMENTS.md
  - .planning/ROADMAP.md
  - .planning/phases/01-portfolio-shell-crash-session/01-01-PLAN.md
  - .planning/phases/01-portfolio-shell-crash-session/01-01-SUMMARY.md
  - .planning/phases/01-portfolio-shell-crash-session/01-02-PLAN.md
  - .planning/phases/01-portfolio-shell-crash-session/01-02-SUMMARY.md
  - .planning/phases/01-portfolio-shell-crash-session/01-03-PLAN.md
  - .planning/phases/01-portfolio-shell-crash-session/01-03-SUMMARY.md
  - .planning/phases/01-portfolio-shell-crash-session/01-04-PLAN.md
  - .planning/phases/01-portfolio-shell-crash-session/01-04-SUMMARY.md
  - .planning/phases/01-portfolio-shell-crash-session/01-CONTEXT.md
  - index.html
  - public/assets/menu/icon-crash.png
  - public/assets/menu/icon-hotline.png
  - src/games/crash/hud/CrashHud.ts
  - src/games/crash/hud/sessionStats.ts
  - src/games/crash/session/mountCrashSession.ts
  - src/games/crash/view/CrashScene.ts
  - src/games/crash/view/Rocket.ts
  - src/games/crash/view/mountCrashView.ts
  - src/main.ts
  - src/shared/audio/mutePref.test.ts
  - src/shared/audio/mutePref.ts
  - src/shared/boot/parseBootSeed.ts
  - src/shell/bootShell.ts
  - src/shell/gameRegistry.test.ts
  - src/shell/gameRegistry.ts
  - src/shell/menu/mountMenu.ts
  - src/shell/muteBinding.test.ts
  - src/shell/muteBinding.ts
  - src/shell/router.test.ts
  - src/shell/router.ts
  - src/shell/types.ts
  - src/styles/hud.css
  - tests/architecture.shell.test.ts
  - tests/shell.hud-layout.test.ts
  - tests/shell.seedReuse.test.ts
covered_digest: "v1:sha256:3f4d2e874736fe9bfab7da3fd6fed44078df36c041755c2c94bdc87840e3e912"
behavior_unverified: 0
overrides_applied: 0
decision_coverage:
  honored: 16
  total: 16
  not_honored: []
mvp_goal_format_note: "ROADMAP Phase 1 goal is mode mvp but not As a / I want to / so that; User Flow Coverage uses 01-01 plan objective user story plus roadmap success criteria"
---

# Phase 1: Portfolio Shell + Crash Session Verification Report

**Phase Goal:** Visitor picks a demo from a shared menu, plays Crash, and returns without leaking tickers or audio — portfolio chrome and boot seed work across the shell

**Verified:** 2026-10-09T17:10:00Z
**Status:** passed
**Re-verification:** No — initial verification
**Mode:** mvp (User Flow Coverage below; ROADMAP goal text is not As-a format — flow framed from plan 01-01 objective + roadmap SCs)

## User Flow Coverage

User story (from 01-01 plan objective): *As a portfolio visitor, I want to pick Crash from a demo menu, play it, and go back to the menu, so that I can move between demos without the page carrying leftovers from the last one.*

| Step | Expected | Evidence | Status |
|------|----------|----------|--------|
| Open portfolio | Dark menu, Retro Computer title, play-money subtitle, no canvas | `mountMenu` + `MENU_COPY`; `hud.css` `@font-face`; walkthrough step 1 approved | ✓ |
| See demos | Crash tile launchable; HOTLINE disabled + Coming soon | `gameRegistry.ts` crash enabled + hotline `enabled: false`; `gameRegistry.test.ts` | ✓ |
| Launch Crash | Playable Crash on shell-owned Application | `bootShell` → router → `mountCrashSession` → `mountCrashView(ctx.app)`; router happy-path test | ✓ |
| Leave mid-round | Immediate menu; no settle; fresh next launch | Session dispose order; D-09/D-10 walkthrough step 3 approved; router race tests | ✓ |
| Outcome | No leftovers; mute + seed chrome work | architecture.shell gates; mute cycle test; seedReuse test; walkthrough steps 4–7 approved | ✓ |

## Goal Achievement

### Observable Truths

Roadmap success criteria (contract). Plan frontmatter truths add detail; they do not shrink this list.

| # | Truth | Status | Evidence |
| --- | ------- | ---------- | -------------- |
| 1 | User opens a game menu and can launch Crash (HOTLINE may be stub/disabled until Phase 2) | ✓ VERIFIED | `GAMES` ordered crash then hotline; crash has `mount`; hotline `enabled: false` no mount; `mountMenu` tiles; icons 256×256 at `public/assets/menu/`; router launch/menu tests; walkthrough steps 1–2 approved |
| 2 | User returns from Crash to the menu without leftover ticker ticks, audio handlers, or stuck HUD | ✓ VERIFIED | `mountCrashSession` dispose: ticker.remove → hud.dispose → scene.destroy → view.dispose → resizeTo null → stop → canvas.remove → screen.remove; never `audio.dispose` / `app.destroy`; `CrashHud.dispose` removes named keydown; `architecture.shell.test.ts` Gates B/C; router leave-during-load / dispose-while-launching; walkthrough steps 4–5 (`__shellDebug`) approved |
| 3 | Mute preference set in menu or Crash still applies after switching between menu and Crash | ✓ VERIFIED | Shell-owned `AudioPort` in `bootShell`; `bindMuteButton` on menu; Crash HUD mute; `portfolio-demo:mute` + legacy migrate; `router.test.ts` mute cycle across two launch/leave cycles; walkthrough step 6 approved |
| 4 | Menu/HUD shows a clear portfolio demo / no real money label | ✓ VERIFIED | `MENU_COPY.subtitle` "Play money only."; page title `Casino Demos - Portfolio`; D-13 no banner (layout test); banned-copy regex in `gameRegistry.test.ts`; walkthrough step 1 approved |
| 5 | Booting with `?seed=` produces a reproducible Crash session via the shared boot seam | ✓ VERIFIED | `parseBootSeed` once in `bootShell`; `createGame({ seed: ctx.seed })` per launch; router "second launch reuses seed string"; `tests/shell.seedReuse.test.ts` identical history for same seed; walkthrough step 7 approved |

**Score:** 5/5 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | ----------- | ------ | ------- |
| `src/shell/types.ts` | game contracts | ✓ VERIFIED | GameId, ShellContext, GameSession, GameDefinition, Disposable |
| `src/shell/router.ts` | epoch/abort router | ✓ VERIFIED | createRouter, createContextFactory; wired from bootShell |
| `src/shell/router.test.ts` | routing/mute/race tests | ✓ VERIFIED | 9 tests passing |
| `src/shell/gameRegistry.ts` | ordered games + copy | ✓ VERIFIED | crash + hotline stub; MENU_COPY |
| `src/shell/bootShell.ts` | one-time boot | ✓ VERIFIED | seed, audio, Application, router |
| `src/shell/menu/mountMenu.ts` | DOM menu | ✓ VERIFIED | tiles, mute, Coming soon chip |
| `src/games/crash/session/mountCrashSession.ts` | Crash adapter | ✓ VERIFIED | borrowed app; fixed dispose order |
| `src/games/crash/view/mountCrashView.ts` | view on borrowed app | ✓ VERIFIED | `mountCrashView(app)` — no `new Application` |
| `tests/architecture.shell.test.ts` | teardown gates | ✓ VERIFIED | Gates A/B/C |
| `index.html` | crash template + Menu | ✓ VERIFIED | `crash-screen-template`, `data-action=menu` |
| `src/shared/audio/mutePref.ts` | portfolio mute key | ✓ VERIFIED | `portfolio-demo:mute` + legacy migrate |
| `tests/shell.seedReuse.test.ts` | seed replay | ✓ VERIFIED | 4 tests passing |
| `src/shell/muteBinding.ts` | shared mute binder | ✓ VERIFIED | used by mountMenu + router mute test |
| `src/styles/hud.css` | Retro Computer + menu | ✓ VERIFIED | `@font-face`, menu-tile, menu-back |
| `public/assets/menu/icon-crash.png` | Crash icon | ✓ VERIFIED | 256×256 PNG, git-tracked |
| `public/assets/menu/icon-hotline.png` | HOTLINE icon | ✓ VERIFIED | 256×256 PNG, git-tracked |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | --- | --- | ------ | ------- |
| `src/main.ts` | `src/shell/bootShell.ts` | `bootShell(` | ✓ WIRED | HMR dispose of shell |
| `src/shell/bootShell.ts` | `src/shell/router.ts` | `createRouter(` | ✓ WIRED | showMenu + createContextFactory |
| `src/shell/gameRegistry.ts` | `mountCrashSession` | dynamic import | ✓ WIRED | Multiline `await import("../games/crash/session/mountCrashSession.js")` — automated pattern missed newlines; source confirms |
| `mountCrashSession` | `mountCrashView` | `mountCrashView(ctx.app)` | ✓ WIRED | Borrowed Application |
| `mountCrashSession` | `CrashHud` | `hud.dispose()` | ✓ WIRED | In session dispose |
| `index.html` | session | `crash-screen-template` | ✓ WIRED | Cloned per launch; menu button → `requestMenu` |
| `mutePref` | `bootShell` | `loadMutePref(` | ✓ WIRED | Once at boot |
| `seedReuse` test | `CrashGame` | `createGame(` | ✓ WIRED | Fixed-tick replay |
| `mountMenu` | `muteBinding` | `bindMuteButton(` | ✓ WIRED | Unbind on dispose |
| `bootShell` | `mountMenu` | audio in options | ✓ WIRED | Shell AudioPort |
| `hud.css` | Retro Computer TTF | `@font-face` url | ✓ WIRED | |
| `muteBinding` | `saveMutePref` | default save | ✓ WIRED | |
| `router.test` | `bindMuteButton` | mute cycle | ✓ WIRED | |
| `gameRegistry` | icon PNGs | `/assets/menu/icon-*.png` | ✓ WIRED | |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| Crash session seed | `ctx.seed` | `parseBootSeed(location.search)` in bootShell → createContextFactory | Yes — `createGame({ seed: ctx.seed })` | ✓ FLOWING |
| Mute state | `AudioPort` muted + `portfolio-demo:mute` | `loadMutePref` at boot; menu/Crash toggles via `saveMutePref` | Yes — shared port identity across launches | ✓ FLOWING |
| Menu tiles | `GAMES` registry | Static registry (intentional for client demo) | Yes — Crash mount path real; HOTLINE stub intentional Phase 1 | ✓ FLOWING |
| Menu icons | `iconUrl` → img src | `public/assets/menu/*.png` via Vite publicDir | Yes — 256×256 PNGs on disk | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Seed replay + mute + router + architecture + registry + layout | `npx vitest run tests/shell.seedReuse.test.ts src/shell/router.test.ts tests/architecture.shell.test.ts src/shared/audio/mutePref.test.ts src/shell/gameRegistry.test.ts src/shell/muteBinding.test.ts tests/shell.hud-layout.test.ts` | 7 files, 49 tests passed | ✓ PASS |
| Menu icon PNGs | node PNG signature/dimension check | both ok 256×256 | ✓ PASS |
| Suite / build (orchestrator-reported) | `npm test` / `npm run build` | 191 passing; build green | ✓ PASS |

### Probe Execution

| Probe | Command | Result | Status |
| ----- | ------- | ------ | ------ |
| — | — | No phase-declared `scripts/*/tests/probe-*.sh` | SKIPPED |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| SHELL-01 | 01-01, 01-03, 01-04 | Open menu; launch Crash or HOTLINE | ✓ SATISFIED | Crash launchable; HOTLINE visible disabled stub (Phase 2 enables launch — matches roadmap SC1 / flagged assumption) |
| SHELL-02 | 01-01, 01-04 | Return without leaking tickers/audio | ✓ SATISFIED | Session dispose + architecture gates + race tests + walkthrough leak check |
| SHELL-03 | 01-01, 01-02, 01-03, 01-04 | Mute persists across menu and games | ✓ SATISFIED | Shell AudioPort + portfolio mute key + mute cycle test |
| SHELL-04 | 01-03, 01-04 | Portfolio demo / no real money label | ✓ SATISFIED | MENU_COPY play-money voice + title; no banner (D-13) |
| CFG-02 | 01-01, 01-02, 01-04 | `?seed=` reproducible via shared boot seam | ✓ SATISFIED | parseBootSeed → ctx.seed → createGame; seedReuse test |

No orphaned Phase 1 requirement IDs: REQUIREMENTS.md maps exactly SHELL-01..04 + CFG-02 to Phase 1; all appear in plan frontmatter.

### Decision Coverage

All trackable CONTEXT.md decisions are honored by shipped artifacts (16/16). `gsd_run query check.decision-coverage-verify` — non-blocking gate.

### Prohibitions

| Statement | Tier | Status | Evidence |
| --------- | ---- | ------ | -------- |
| MUST NOT settle/cash-out on mid-round leave (D-10) | judgment | resolved | Session dispose abandons only; no settle path on leave; walkthrough step 3 |
| MUST NOT persist beyond mute flag | judgment | resolved | mutePref only writes `portfolio-demo:mute` |
| MUST NOT imply real-money / deposits / prizes in copy | judgment | resolved | `gameRegistry.test.ts` banned regex |
| MUST NOT use hype/pressure menu framing | judgment | resolved | same banned regex + short MENU_COPY |

### Test Quality Audit

| Test File | Linked Req | Active | Skipped | Circular | Assertion Level | Verdict |
|-----------|-----------|--------|---------|----------|-----------------|---------|
| `src/shell/router.test.ts` | SHELL-01/02/03 | 9 | 0 | no | Behavioral | OK |
| `tests/architecture.shell.test.ts` | SHELL-02 | 3 | 0 | no | Value (source contract) | OK |
| `tests/shell.seedReuse.test.ts` | CFG-02 | 4 | 0 | no | Value | OK |
| `src/shared/audio/mutePref.test.ts` | SHELL-03 | 10 | 0 | no | Value | OK |
| `src/shell/muteBinding.test.ts` | SHELL-03 | 5 | 0 | no | Behavioral | OK |
| `src/shell/gameRegistry.test.ts` | SHELL-01/04 | 6 | 0 | no | Value | OK |
| `tests/shell.hud-layout.test.ts` | SHELL-04 | 12 | 0 | no | Value | OK |

**Disabled tests on requirements:** 0
**Circular patterns detected:** 0
**Insufficient assertions:** 0

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| `src/shell/menu/mountMenu.ts` | ~100 | `"Coming soon"` text | ℹ️ Info | Intentional D-06 chip copy, not a stub |

No unresolved `TBD` / `FIXME` / `XXX` debt markers in phase-touched source.

### Human Verification Required

None pending. Plan 01-04 visitor walkthrough (steps 1–9) was approved after the icon-swap fix; results recorded in `01-04-SUMMARY.md`. Orchestrator confirms all steps approved.

### Gaps Summary

None. Phase goal achieved: shared menu launches Crash, leave tears down session without shell audio/app dispose, mute and `?seed=` boot seam work, portfolio demo voice is present, HOTLINE remains the intentional Phase 2 stub.

---

_Verified: 2026-10-09T17:10:00Z_
_Verifier: Claude (gsd-verifier)_
