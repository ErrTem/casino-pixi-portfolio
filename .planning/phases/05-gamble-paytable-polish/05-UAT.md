---
status: testing
phase: 05-gamble-paytable-polish
source: [05-VERIFICATION.md]
started: 2026-10-12T13:51:54Z
updated: 2026-10-12T13:51:54Z
---

## Current Test

number: 1
name: Session gamble gate across a night
expected: |
  Gamble stays disabled during features and returns with the base line win stake after the night
awaiting: user response

## Tests

### 1. Session gamble gate across a night
expected: Gamble stays disabled during features and returns with the base line win stake after the night
result: [pending]

### 2. SURVIVE and DIE round flow, auto-close and ten-round cap in the browser
expected: Result beat, auto-close, re-offer or disable per outcome, cap at ten rounds
result: [pending]

### 3. Info opened over the VHS overlay
expected: SURVIVE and DIE are inert until Info closes, then play resumes in the prior state
result: [pending]

### 4. Visual pass at 360x640, desktop and landscape
expected: No horizontal scroll, 44 px targets, spin hub on narrow, icon row on desktop, letterbox on landscape
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
