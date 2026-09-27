---
phase: "5"
slug: "polish"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-27"
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.7 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/shared/boot src/shared/audio src/games/crash/hud/sessionStats.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~20 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test` + `npx tsc --noEmit`
- **Before `/gsd-verify-work`:** Full suite must be green + manual success criteria 1–4
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 05-01-* | 01 | 1 | PLSH-01 | — | N/A | unit | `npx vitest run` formatWaitCountdown helper | ❌ W0 | ⬜ pending |
| 05-02-* | 02 | 2 | PLSH-02 | T-5-02 | Mute pref localStorage only; no wallet persistence | unit | `npx vitest run src/shared/audio` | ❌ W0 | ⬜ pending |
| 05-03-* | 03 | 3 | PLSH-03 | T-5-01 | Seed via `textContent`; bound/reject control chars | unit | `npx vitest run src/shared/boot` | ❌ W0 | ⬜ pending |
| 05-04-* | 04 | 4 | PLSH-04, PLSH-05 | — | N/A | unit | `npx vitest run src/games/crash/hud/sessionStats.test.ts` | ❌ W0 | ⬜ pending |
| ARCH | all | — | ARCH-02 | — | logic/shared stay pixi-free; audio not imported by logic | unit | `npx vitest run tests/architecture.no-pixi.test.ts` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `formatWaitCountdown` helper + tests — tenths formatting / clamp
- [ ] `sfxEdges.ts` + `mutePref.ts` + tests — transition events + mute round-trip
- [ ] `parseBootSeed.ts` + tests — missing/invalid/valid `?seed=`
- [ ] `sessionStats.ts` + tests — empty placeholders; avg/max from history
- [ ] No Howler install on recommended Web Audio path
- [ ] Manual QA notes in plans for audio unlock, seed URL, keyboard, countdown readability

*Existing Vitest + architecture suites cover regressions; Wave 0 adds polish pure helpers.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Waiting theater shows countdown tenths; clears on flight | PLSH-01 | Theater pixels not meaningful in Node | `npm run dev` — watch wait → flight |
| Beeps audible / mute silences | PLSH-02 | AudioContext unlock + playback | Gesture then mute toggle |
| `?seed=abc` boot + chip copy | PLSH-03 | URL + clipboard | Open URL; copy; reload default |
| Space/Enter cash out mid-flight; ignored in inputs | PLSH-05 | Keyboard focus | Desktop: flying + focused inputs |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
