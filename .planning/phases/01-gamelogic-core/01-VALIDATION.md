---
phase: "01"
slug: "gamelogic-core"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-26"
---

# Phase 01 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.7 (pin; not unpinned latest) |
| **Config file** | `vitest.config.ts` — Wave 0 (does not exist yet) |
| **Quick run command** | `npx vitest run src/games/crash/logic` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5–15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/games/crash/logic`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-W0 | 01 | 0 | ARCH-04 | — | N/A | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| PLAY-01 | — | 1 | PLAY-01 | — | N/A | unit | `npx vitest run tests/roundCadence.test.ts` | ❌ W0 | ⬜ pending |
| PLAY-02 | — | 1 | PLAY-02 | — | N/A | unit | `npx vitest run tests/multiplierCurve.test.ts` | ❌ W0 | ⬜ pending |
| PLAY-03 | — | 1 | PLAY-03 | T-01-01 | Finite stake×mult settle | unit | `npx vitest run tests/resolveTick.test.ts -t "manual cash-out"` | ❌ W0 | ⬜ pending |
| PLAY-04 | — | 1 | PLAY-04 | — | N/A | unit | `npx vitest run tests/resolveTick.test.ts -t "crash"` | ❌ W0 | ⬜ pending |
| PLAY-05 | — | 1 | PLAY-05 | — | N/A | unit | `npx vitest run tests/roundCadence.test.ts -t "returns to waiting"` | ❌ W0 | ⬜ pending |
| WALT-01 | — | 1 | WALT-01 | T-01-02 | Integer cents wallet | unit | `npx vitest run tests/wallet.test.ts` | ❌ W0 | ⬜ pending |
| WALT-02 | — | 1 | WALT-02 | T-01-02 | Reject NaN/OOB bets | unit | `npx vitest run tests/wallet.test.ts -t "validation"` | ❌ W0 | ⬜ pending |
| WALT-04 | — | 1 | WALT-04 | T-01-01 | Crash before auto CO | unit | `npx vitest run tests/resolveTick.test.ts -t "auto"` | ❌ W0 | ⬜ pending |
| ARCH-01 | — | 1 | ARCH-01 | T-01-03 | Demo RNG only | unit | `npx vitest run tests/crashRng.test.ts` | ❌ W0 | ⬜ pending |
| ARCH-02 | — | 1 | ARCH-02 | T-01-04 | No pixi/DOM in logic | unit | `npx vitest run tests/architecture.no-pixi.test.ts` | ❌ W0 | ⬜ pending |
| ARCH-04 | — | 1 | ARCH-04 | — | N/A | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| D-15 | — | 1 | D-15 | — | Spectator no wallet change | unit | `npx vitest run tests/roundCadence.test.ts -t "spectator"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*Planner will refine Task IDs / Plan columns when PLAN.md files are written.*

---

## Wave 0 Requirements

- [ ] `package.json` + `tsconfig.json` + `vitest.config.ts` (`environment: 'node'`)
- [ ] `npm install -D typescript@~5.8.3 vitest@3.2.7 @types/seedrandom @types/node && npm install seedrandom@3.0.5`
- [ ] `src/shared/money/cents.ts` + tests
- [ ] `src/shared/rng/createRng.ts` + `tests/crashRng.test.ts`
- [ ] `src/games/crash/logic/*` facade + FSM + `tests/resolveTick.test.ts`
- [ ] `tests/roundCadence.test.ts` (5s auto-launch + spectator)
- [ ] `tests/wallet.test.ts` (D-01..D-04)
- [ ] `tests/architecture.no-pixi.test.ts` (grep/read sources for `pixi.js` / `document` / `window`)
- [ ] `tests/multiplierCurve.test.ts`

---

## Manual-Only Verifications

All phase behaviors have automated verification.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
