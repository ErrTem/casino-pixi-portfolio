---
phase: "03"
slug: "pixi-hybrid-view"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-27"
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.7 |
| **Config file** | `vitest.config.ts` (`environment: "node"`, includes `src/**/*.test.ts` and `tests/**/*.test.ts`) |
| **Quick run command** | `npx vitest run tests/pathMapping.test.ts tests/viewMode.test.ts tests/resolveTick.test.ts tests/architecture.no-pixi.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/pathMapping.test.ts tests/viewMode.test.ts tests/resolveTick.test.ts tests/architecture.no-pixi.test.ts`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** `npm test` green, plus `npx tsc --noEmit`, plus one manual cash-out round and one crash round in `npm run dev`
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | VIS-01 | T-03-SC | Human confirms `pixi.js` version `8.21.0` and repo `git+https://github.com/pixijs/pixijs.git` before install | checkpoint | `npm view pixi.js version` and `npm view pixi.js repository.url` (human gate, no install) | — | ⬜ pending |
| 03-01-02 | 01 | 1 | VIS-01 | T-03-01, T-03-02 | `pixi.js@8.21.0` allowed in package.json; still forbidden under `logic/` and `shared/`. Path steeper after 2×; m=1 is origin; non-finite has no NaN. climb→waiting enters crash_hold; boot waiting is idle | unit | `npx vitest run tests/architecture.no-pixi.test.ts` then `npx vitest run tests/pathMapping.test.ts tests/viewMode.test.ts` | ❌ W0 for path/viewMode; architecture file exists | ⬜ pending |
| 03-02-01 | 02 | 2 | VIS-01 | T-03-05, T-03-06 | Cash-out sets `cashOutAt`, phase stays `cashed_out`, multiplier still increases, wallet credits once, history unchanged until crash, then one history row and `waiting` | unit | `npx vitest run tests/resolveTick.test.ts tests/walkingSkeleton.test.ts` | ✅ | ⬜ pending |
| 03-02-02 | 02 | 2 | VIS-01 | — | `cashed_out` cannot place bet or cash out | unit | `npx vitest run src/games/crash/hud/enablement.test.ts tests/roundCadence.test.ts` | ✅ | ⬜ pending |
| 03-02-03 | 02 | 2 | VIS-01 | T-03-07 | Theater strings go to `BitmapText.text` via `formatMult`; latch still covered by viewMode tests | unit | `npx vitest run tests/viewMode.test.ts tests/architecture.no-pixi.test.ts` | ❌ W0 viewMode | ⬜ pending |
| 03-03-01 | 03 | 3 | VIS-01 | T-03-08 | Rocket seam has no `Assets.load`; logic/shared stay free of pixi | unit | `npx tsc --noEmit` and `npx vitest run tests/pathMapping.test.ts tests/architecture.no-pixi.test.ts` | ✅ architecture; pathMapping created in 03-01 | ⬜ pending |
| 03-03-02 | 03 | 3 | VIS-01 | T-03-09 | Recruiter sees neon trail, tangent rocket, red sever, flash, hold, fade, idle bob, dual × after cash-out | manual | `npm run dev` (plus `npx vitest run tests/viewMode.test.ts tests/pathMapping.test.ts tests/architecture.no-pixi.test.ts`) | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

Threat refs: T-03-01 view must not credit the wallet or re-sample `crashAt`. T-03-02 `pathMapping` bails on non-finite snapshot numbers. Visual pixels stay manual; Node Vitest has no WebGL. Do not add Playwright or `@vitest/browser` in this phase.

---

## Wave 0 Requirements

- [ ] `tests/pathMapping.test.ts` — D-03 slope, origin at m=1, non-finite guard
- [ ] `tests/viewMode.test.ts` — hold, fade, latch, idle vs boot
- [ ] `tests/resolveTick.test.ts` / `tests/walkingSkeleton.test.ts` — rewrite cash-out expectations for spectator finish (do not leave them red)
- [ ] `src/games/crash/hud/enablement.test.ts` — `cashed_out` disables place and cash-out
- [ ] `tests/architecture.no-pixi.test.ts` — expect `pixi.js` present; keep the source scan
- [ ] Framework install: none (Vitest already present). `pixi.js` install is plan 03-01, not a test-runner install.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Neon trail, tangent rocket, red sever, flash, hold, fade, idle bob, dual × after cash-out | VIS-01 | Pixels need a browser. Mapping slope, mode transitions, continued flight, and single payout stay in Vitest. | `npm run dev`; play one cash-out round and one crash round. Confirm sever, continued flight after cash-out, and idle bob. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
