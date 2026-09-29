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
| 06-01-* | 01 | 1 | UI-01, UI-02, WALT-03Δ | — | N/A | unit | `npx vitest run src/games/crash/hud` | ❌ W0 | ⬜ pending |
| 06-02-* | 02 | 2 | UI-03 | T-6-01 | Auto bet uses same placeBet path; stops on broke | unit | `npx vitest run` autoBet helper | ❌ W0 | ⬜ pending |
| 06-03-* | 03 | 3 | FEEL-01 | — | N/A | unit | `npx vitest run tests/multiplierCurve.test.ts` | ✅ update | ⬜ pending |
| 06-04-* | 04 | 4 | FEEL-02, PLSH-03Δ | T-6-02 | Silent `?seed=` via parseBootSeed only; no seed chip XSS surface | unit | `npx vitest run src/shared/boot` + path/tilt helpers | ❌ W0 | ⬜ pending |
| ARCH | all | — | ARCH-02 | — | logic/ stays pixi-free after growth edit | unit | `npx vitest run tests/architecture.no-pixi.test.ts` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Update `tests/multiplierCurve.test.ts` for ~2× at 3.5–4s (`LN2/3750`)
- [ ] Pure `maxAffordableStake` / ALL chip tests (replace old PRESET list)
- [ ] Pure `shouldAutoPlaceBet` (+ optional `primaryChromeFrom`) tests
- [ ] Soft path / tilt helper tests (FEEL-02)
- [ ] Remove Seed chip DOM + wiring; keep `parseBootSeed` tests green
- [ ] Manual QA checklist: phone 100dvh, Auto bet loop, dual-line amounts, arcade camera, silent `?seed=`
- [ ] REQUIREMENTS.md / ROADMAP.md: promote Auto-bet; amend PLSH-03; set Phase 6 goal + req IDs

*Existing Vitest + architecture suites cover regressions; Wave 0 adds Phase 6 pure helpers.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 100dvh no page scroll; zone budget; canvas leftover | UI-01 | Layout pixels | DevTools phone + desktop |
| Dual-line live win mid-flight; CASHED OUT freeze | UI-02 | DOM/visual chrome | Play round through cash-out |
| Auto bet consecutive rounds; stop on broke | UI-03 | Cadence feel | Drain wallet with Auto bet ON |
| Craft centered; trail scrolls; crash freeze | FEEL-02 | Pixi camera | Watch climb/crash |
| Countdown / mute / stats / Space-Enter still work | D-05 | Regression | Waiting + flight keyboard |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
