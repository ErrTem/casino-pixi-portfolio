---
phase: "02"
slug: "vite-shell-html-hud"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-26"
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.7 (keep pin) |
| **Config file** | `vitest.config.ts` — `environment: 'node'` for logic |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run` (+ `npm run build` once Vite lands) |
| **Estimated runtime** | ~5–15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npx vitest run` + `npm run build` (once Vite lands)
- **Before `/gsd-verify-work`:** Full suite must be green + manual play loop
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | ARCH-02 | — | logic/shared free of pixi/DOM; package.json may include vite | unit | `npx vitest run tests/architecture.no-pixi.test.ts` | ✅ modify | ⬜ pending |
| 02-01-02 | 01 | 1 | ARCH-04 | — | Full logic suite green after Vite scaffold | unit | `npx vitest run` | ✅ | ⬜ pending |
| 02-02-01 | 02 | 2 | VIS-02 | — | HTML owns controls; canvas host empty of monetary controls | unit + manual | `npx vitest run` + `npm run dev` (manual) | ❌ W0 optional | ⬜ pending |
| 02-02-02 | 02 | 2 | WALT-03 / enablement | — | waiting/flying enablement matrix | unit | `npx vitest run src/games/crash/hud/enablement.test.ts` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 3 | WALT-03 | — | PRESET_CHIPS within 10–1000; chip sets input | unit | `npx vitest run src/games/crash/hud/chips.test.ts` | ❌ W0 | ⬜ pending |
| 02-03-02 | 03 | 3 | WALT-05 | — | History render newest-first; class thresholds | unit | `npx vitest run src/games/crash/hud/historyStrip.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

Prefer pure functions (`enablementFrom`, `historyClass`, chip constants) under Node. Reserve browser smoke for end-of-phase human verify.

---

## Wave 0 Requirements

- [ ] Install `vite@6.4.3`; add `dev` / `build` / `preview` scripts
- [ ] `index.html` + `vite.config.ts` + `src/main.ts`
- [ ] Update `tests/architecture.no-pixi.test.ts` (allow vite; forbid pixi.js until Phase 3; keep logic/shared source scan)
- [ ] tsconfig DOM support for app entry without breaking Vitest
- [ ] `src/games/crash/hud/*` + pure unit tests for enablement/chips/history helpers
- [ ] Confirm `npx vitest run` still 37+ green after scaffold

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Full bet → fly → cash-out/crash → history play loop | VIS-02, WALT-03, WALT-05 | HTML overlay + rAF clock needs a real browser | `npm run dev`; place bet, wait, fly, cash out or crash; confirm balance + history strip |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
