---
status: testing
phase: 06-enhance-and-rework-ui-buttons-behavior
source: [06-VERIFICATION.md]
started: 2026-09-29T16:35:00Z
updated: 2026-09-29T16:35:00Z
---

## Current Test

number: 1
name: 100dvh shell / no page scroll (UI-01)
expected: |
  Zones match D-01; html/body/.app-shell overflow hidden; canvas flex leftover playable; no dual-bet / DEMO badge
awaiting: user response

## Tests

### 1. 100dvh shell / no page scroll (UI-01)
expected: Zones match D-01; html/body/.app-shell overflow hidden; canvas flex leftover playable; no dual-bet / DEMO badge. Phone/tablet/desktop widths; top → history → canvas → autos → primary/presets; no page scroll.
result: [pending]

### 2. Dual-line primary cycle (UI-02)
expected: Single dual-line primary; English labels; live win = bet×multiplier; frozen cashed amount disabled. Waiting → BET+stake → flying CASH OUT+live win → cash out → CASHED OUT frozen → crash → waiting BET; crash without cash out snaps to BET (no CRASHED).
result: [pending]

### 3. Auto bet waiting-edge + broke stop (UI-03)
expected: Place as soon as waiting allows; broke/insufficient clears flag; Reset emphasized; never auto resetWallet. Auto bet ON → consecutive waiting places; edit stake mid-flight → next wait uses new stake; drain wallet → Auto bet stops + Reset emphasized.
result: [pending]

### 4. Climb pace ~2× at 3.5–4s (FEEL-01)
expected: Authoritative growthRatePerMs = LN2/3750; houseEdge/floor/cap unchanged. Watch climb — ~2× arrives in ~3.5–4s band; crash distribution still feels like prior RNG.
result: [pending]

### 5. Arcade camera + crash FX (FEEL-02 / VIS-01Δ)
expected: world.position camera only (no stage.x/y); TILT_MAX_RAD clamp; D-19 choreography unchanged. Climb: craft mid-frame, trail scrolls under, gentle tilt; crash: camera freezes, sever red, craft vanishes, flash/hold/idle; theater × clear of craft.
result: [pending]

### 6. Silent ?seed= + Phase 5 polish relocated (PLSH-03Δ)
expected: parseBootSeed → createGame only; Phase 5 polish relocated in new shell. No Seed chip; `/?seed=demo-a` boots quietly; missing/invalid → portfolio-demo with no on-screen note; countdown/mute/stats/keyboard still work.
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps
