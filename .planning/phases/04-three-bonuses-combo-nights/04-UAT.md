---
status: complete
phase: 04-three-bonuses-combo-nights
source: [04-VERIFICATION.md]
started: 2026-10-10T23:16:00Z
updated: 2026-10-11T14:45:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Green free spins walkthrough (BONUS-01)
expected: Trigger green phone; splash → continue → 24 auto free spins with denser mask wilds on reels 2–5; DOM feature line shows remaining spins + win; exit total splash; Spin locked the whole night
result: pass

### 2. Red Hold & Win walkthrough (BONUS-02)
expected: Trigger red; splash → CRT 5×4 sticky cash with jackpot strip MIN/MID/MAX/ULTRA replacing phones; 3 respins that reset on new cash; exit total (jackpot callout if won); phones/reels restore
result: pass

### 3. Purple locker Pick'em walkthrough (BONUS-03)
expected: Trigger purple; splash → 12-locker DOM overlay; exactly 5 picks reveal cash; total splash; wallet credits once at exit
result: pass

### 4. Combo night + nesting walkthrough (BONUS-04)
expected: Multi-phone trigger runs Green→Red→Purple with combo strip path highlight and night-total splash when path length ≥ 2; during free spins with nested red/purple, FS pauses then resumes with spinsLeft unchanged; feature beeps fire; no skip control
result: pass

## Summary

total: 4
passed: 4
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
