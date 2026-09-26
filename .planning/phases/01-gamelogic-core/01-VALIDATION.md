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
| 01-01-T1 | 01-01 | 1 | ARCH-04 | T-01-SC | Pin vitest 3.2.7; no SUS latest | unit | Wave 0 scaffold (MISSING until package.json) | ❌ W0 | ⬜ pending |
| 01-01-T2 | 01-01 | 1 | PLAY-01 | — | D-14 one-way confirm | checkpoint | — | — | ⬜ pending |
| 01-02-T1 | 01-02 | 2 | ARCH-01, PLAY-01/02/04/05, WALT-01 | T-01-03 | Demo RNG; crashAt-at-start | unit | `npx vitest run tests/walkingSkeleton.test.ts tests/crashRng.test.ts` | ❌ W0 | ⬜ pending |
| 01-03-T1 | 01-03 | 3 | WALT-01, WALT-02 | T-01-02 | Reject NaN/OOB; integer cents | unit | `npx vitest run tests/wallet.test.ts` | ❌ W0 | ⬜ pending |
| 01-03-T2 | 01-03 | 3 | PLAY-01, PLAY-05, D-15 | T-01-05 | Spectator no wallet change | unit | `npx vitest run tests/roundCadence.test.ts` | ❌ W0 | ⬜ pending |
| 01-04-T1 | 01-04 | 4 | PLAY-03, PLAY-04 | T-01-01 | Finite stake×mult settle; idempotent | unit | `npx vitest run tests/resolveTick.test.ts -t "manual cash-out"` | ❌ W0 | ⬜ pending |
| 01-04-T2 | 01-04 | 4 | WALT-04 | T-01-01 | Crash before auto CO | unit | `npx vitest run tests/resolveTick.test.ts -t "auto"` | ❌ W0 | ⬜ pending |
| 01-05-T1 | 01-05 | 5 | ARCH-02 | T-01-04 | No pixi/DOM in logic | unit | `npx vitest run tests/architecture.no-pixi.test.ts` | ❌ W0 | ⬜ pending |
| 01-05-T2 | 01-05 | 5 | PLAY-02, ARCH-04 | — | Full suite green | unit | `npx vitest run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `package.json` + `tsconfig.json` + `vitest.config.ts` (`environment: 'node'`)
- [ ] `npm install -D typescript@~5.8.3 vitest@3.2.7 @types/seedrandom @types/node && npm install seedrandom@3.0.5`
- [ ] `src/shared/money/cents.ts` + money helpers used by wallet
- [ ] `src/shared/rng/createRng.ts` + `tests/crashRng.test.ts`
- [ ] `src/games/crash/logic/*` facade + FSM + resolveTick
- [ ] `tests/walkingSkeleton.test.ts` (tracer E2E)
- [ ] `tests/roundCadence.test.ts` (5s auto-launch + spectator)
- [ ] `tests/wallet.test.ts` (D-01..D-04)
- [ ] `tests/resolveTick.test.ts` (manual / crash / auto)
- [ ] `tests/architecture.no-pixi.test.ts`
- [ ] `tests/multiplierCurve.test.ts`

---

## Manual-Only Verifications

All phase behaviors have automated verification. D-14 is a `checkpoint:decision` (not a runtime UAT).

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 / checkpoint dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
