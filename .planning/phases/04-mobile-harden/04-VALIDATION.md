---
phase: "4"
slug: "mobile-harden"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-27"
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.7 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/games/crash/hud/chromeMode.test.ts src/games/crash/hud/enablement.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test` + `npx tsc --noEmit`
- **Before `/gsd-verify-work`:** Full suite must be green + manual 04-03 checklist
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-* | 01 | 1 | ARCH-03 | T-4-01 | Canvas `pointer-events: none`; taps reach HUD | unit + CSS | `npx vitest run tests/architecture.no-pixi.test.ts` | ✅ | ⬜ pending |
| 04-02-* | 02 | 2 | ARCH-03 | T-4-01 / T-4-02 | Promote Cash out; ≥44px targets; DPR cap 2 | unit | `npx vitest run src/games/crash/hud/chromeMode.test.ts src/games/crash/hud/enablement.test.ts` | ❌ W0 | ⬜ pending |
| 04-03-* | 03 | 3 | ARCH-03 | T-4-01 | Manual hit-test / touch matrix green | manual | DevTools QA matrix (see RESEARCH) | manual | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/games/crash/hud/chromeMode.ts` + `chromeMode.test.ts` — phase→promote mapping (optional but recommended; D-05/D-08)
- [ ] No new framework installs
- [ ] Manual QA script documented in plan 04-03

*Existing infrastructure covers architecture + enablement regressions; promote mapping may be Wave 0.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Phone viewport: canvas fills leftover; bar fixed | ARCH-03 | Flex leftover / layout pixels not meaningful in Node | DevTools 375×667 + 390×844 |
| Touch: place bet, chips, auto CO, cash out mid-flight | ARCH-03 | Touch + hit-testing | DevTools touch + preferably one real device |
| Canvas does not steal taps; history swipeable | ARCH-03 | `elementFromPoint` / mash test | Overlay hit conflict checks |
| Rotate portrait↔landscape at ≤720px width | ARCH-03 | Orientation + safe-area | DevTools rotate; stacked per D-14 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
