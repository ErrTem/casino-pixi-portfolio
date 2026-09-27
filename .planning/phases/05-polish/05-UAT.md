---
status: testing
phase: 05-polish
source: [05-VERIFICATION.md]
started: 2026-09-27T14:10:00Z
updated: 2026-09-27T14:10:00Z
---

## Current Test

number: 1
name: Waiting theater countdown (PLSH-01)
expected: |
  White 5.0→4.9… on theater live node; climb → live ×; crash hold/fade still show crash × (no GO flash).
awaiting: user response

## Tests

### 1. Waiting theater countdown (PLSH-01)
expected: White 5.0→4.9…; no GO flash; climb shows live ×. Watch waiting idle; digits clear when flight starts.
result: [pending]

### 2. SFX + mute (PLSH-02)
expected: Four distinct pitches (bet_lock, takeoff, cash out, crash); mute silences; Sound: Off persists across reload.
result: [pending]

### 3. Seed chip + URL (PLSH-03)
expected: `/?seed=demo-a` reveal/copy works; no query → portfolio-demo; invalid seed → fallback + "using default". Chip uses textContent.
result: [pending]

### 4. Session stats + keyboard cash-out (PLSH-04 / PLSH-05)
expected: Empty —/n/a; after rounds avg/max update; mid-flight Space/Enter cash out; typing in bet/auto ignores keys. Placeholders never 0.00×.
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
