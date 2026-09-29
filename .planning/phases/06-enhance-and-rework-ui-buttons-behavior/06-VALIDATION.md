---
phase: "6"
slug: "enhance-and-rework-ui-buttons-behavior"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-29"
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.7 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run tests/multiplierCurve.test.ts src/games/crash/hud src/shared/boot` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~25 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test` + `npx tsc --noEmit`
- **Before `/gsd-verify-work`:** Full suite must be green + manual success criteria
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 06-01-T1 | 01 | 1 | UI-02, WALT-03Δ | T-6-01-01 | placeBet validation unchanged; chips fill-only | unit | `npx vitest run src/games/crash/hud/primaryChrome.test.ts src/games/crash/hud/chips.test.ts` | ❌ W0 | ⬜ pending |
| 06-01-T2 | 01 | 1 | UI-01 | T-6-01-03 | canvas host no monetary attrs | unit | `npx vitest run tests/shell.hud-layout.test.ts` | ✅ update | ⬜ pending |
| 06-01-T3 | 01 | 1 | UI-01, UI-02, WALT-04Δ | T-6-01-01 | Auto CO OFF → setAutoCashOut(null) | unit+tsc | `npx vitest run src/games/crash/hud` + `tsc` | ✅ update | ⬜ pending |
| 06-02-T1 | 02 | 2 | UI-03 | — | checkpoint:decision D-10 | human | — | — | ⬜ pending |
| 06-02-T2 | 02 | 2 | UI-03 | T-6-02-01 | shouldAutoPlaceBet pure gate | unit | `npx vitest run src/games/crash/hud/autoBet.test.ts` | ❌ W0 | ⬜ pending |
| 06-02-T3 | 02 | 2 | UI-03 | T-6-02-02 | broke stops Auto bet; no resetWallet | unit+tsc | `npx vitest run src/games/crash/hud` + `architecture.no-pixi` | ❌ W0 | ⬜ pending |
| 06-03-T1 | 03 | 2 | FEEL-01 | T-6-03-01 | growthRate only; sampler untouched | unit | `npx vitest run tests/multiplierCurve.test.ts` | ✅ update | ⬜ pending |
| 06-04-T1 | 04 | 3 | FEEL-02 | — | soft path / tilt math | unit | `npx vitest run tests/pathMapping.test.ts` | ✅ update | ⬜ pending |
| 06-04-T2 | 04 | 3 | FEEL-02, VIS-01Δ | T-6-04-01 | world Container; no stage.x/y | tsc | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 06-04-T3 | 04 | 3 | PLSH-03Δ | T-6-04-02 | silent ?seed= only; no chip XSS surface | unit | `npx vitest run src/shared/boot tests/shell.hud-layout.test.ts` | ✅ | ⬜ pending |
| ARCH | all | — | ARCH-02 | — | logic/ stays pixi-free | unit | `npx vitest run tests/architecture.no-pixi.test.ts` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

**Specless probe note:** Phase had no requirement IDs at probe time — probe fallback skipped; D-01..D-24 covered in plan must_haves.truths instead of invented probe predicates.

---

## Wave 0 Requirements

- [ ] Update `tests/multiplierCurve.test.ts` for ~2× at 3.5–4s (`LN2/3750`) — plan 06-03
- [ ] Pure `maxAffordableStake` / ALL chip tests — plan 06-01
- [ ] Pure `shouldAutoPlaceBet` (+ `primaryChromeFrom`) tests — plans 06-01 / 06-02
- [ ] Soft path / tilt helper tests (FEEL-02) — plan 06-04
- [ ] Remove Seed chip DOM + wiring; keep `parseBootSeed` tests green — plan 06-04
- [ ] Manual QA checklist: phone 100dvh, Auto bet loop, dual-line amounts, arcade camera, silent `?seed=`
- [x] REQUIREMENTS.md / ROADMAP.md: promote Auto-bet; amend PLSH-03; set Phase 6 goal + req IDs — done at plan-phase

*Existing Vitest + architecture suites cover regressions; Wave 0 adds Phase 6 pure helpers inside plan tasks.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 100dvh no page scroll; zone budget; canvas leftover | UI-01 | Layout pixels | DevTools phone + desktop |
| Dual-line live win mid-flight; CASHED OUT freeze | UI-02 | DOM/visual chrome | Play round through cash-out |
| Auto bet consecutive rounds; stop on broke | UI-03 | Cadence feel | Drain wallet with Auto bet ON |
| Craft centered; trail scrolls; crash freeze | FEEL-02 | Pixi camera | Watch climb/crash |
| Countdown / mute / stats / Space-Enter still work | D-05 | Regression | Waiting + flight keyboard |
| Silent `?seed=` boots; no Seed chip | PLSH-03Δ | DOM absence + boot | Load `?seed=` and default URL |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 / checkpoint dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (as plan tasks)
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter *(set by validate-phase after execute)*

**Approval:** pending execute / validate-phase
