---
status: complete
phase: 02-hotline-base-playable
source: [02-VERIFICATION.md]
started: 2026-10-10T12:00:00Z
updated: 2026-10-10T12:00:00Z
---

## Current Test

number: done
name: testing complete
expected: |
  all five human checks approved
awaiting: none

## Tests

### 1. Visual PRES-01 presentation
expected: Rooftop sunset backdrop fills the canvas, CRT frame sits over the 5x4 reels with symbols inside the glass, three phones sit above the frame, HOTLINE title renders in Retro Computer (desktop and phone-sized viewports)
result: pass

### 2. Play spins end to end from the menu
expected: Menu tile launches HOTLINE; SPIN runs five reels left to right with staggered stops; balance drops by the bet at spin start, win and balance credit only appear after reel 5 lands; line cycle callout shows LINE n PAYS x; last win counts up
result: pass

### 3. Bet steps in the browser
expected: Bet minus and plus walk 0.10, 0.20, 0.50, 1.00, 2.00, 5.00, 10.00 and disable at the ends
result: pass

### 4. Menu round trip and first-click race
expected: Click SPIN immediately after launch while PNGs are still loading should not settle money without reel playback (WR-01). Menu returns cleanly, relaunch works, no ticker or listener leak
result: pass

### 5. Brand font coverage
expected: Decide whether the DOM HUD (Segoe UI) and the win callout (sans-serif) are acceptable next to the Retro Computer title for PRES-01
result: pass

## Summary

total: 5
passed: 5
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
