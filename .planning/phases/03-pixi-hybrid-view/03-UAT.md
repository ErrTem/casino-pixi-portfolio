---
status: testing
phase: 03-pixi-hybrid-view
source: [03-VERIFICATION.md]
started: 2026-09-27T01:48:41Z
updated: 2026-09-27T01:48:41Z
---

## Current Test

number: 1
name: Climb spectacle + cash-out dual × + crash sever/flash/idle
expected: |
  Green neon trail while climbing; rocket nose follows the path; after cash-out the live × keeps rising and a frozen paid × sits under it until the crash. At crash the path gaps in red, the rocket disappears, a brief full-canvas red flash plays, the frame holds about a second, then fades. Waiting shows the sky backdrop, a ghost mark, a bobbing rocket at the origin, and a dim last crash ×. HUD bet and cash-out stay clickable below the canvas.
awaiting: user response

## Tests

### 1. Climb spectacle + cash-out dual × + crash sever/flash/idle
expected: Run `npm run dev`. Play one cash-out round and one round that crashes without cash-out. Green neon trail while climbing; rocket nose follows the path; after cash-out the live × keeps rising and a frozen paid × sits under it until the crash. At crash the path gaps in red, the rocket disappears, a brief full-canvas red flash plays, the frame holds about a second, then fades. Waiting shows the sky backdrop, a ghost mark, a bobbing rocket at the origin, and a dim last crash ×. HUD bet and cash-out stay clickable below the canvas.
result: [pending]

## Summary

total: 1
passed: 0
issues: 0
pending: 1
skipped: 0
blocked: 0

## Gaps
