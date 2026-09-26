# Pitfalls Research — Crash Pixi Portfolio

**Researched:** 2026-09-26  
**Confidence:** HIGH

## Pitfall 1: Putting crash math inside the ticker/Pixi code

**Symptom:** Untestable rounds; hard to reproduce demos; logic tied to frames.  
**Avoid:** Precompute `crashPoint`; pure `update(dtMs)` advances multiplier; Pixi only syncs.

## Pitfall 2: Using `Math.random()` for outcomes

**Symptom:** Flaky tests; cannot replay a “nice” demo round.  
**Avoid:** Seeded PRNG with injectable seed.

## Pitfall 3: Cash-out race / double settle

**Symptom:** Balance jumps wrong if cash-out and crash fire same frame.  
**Avoid:** Single transition function; cash-out checks `phase === 'flying' && multiplier < crashPoint`; crash transition exclusive.

## Pitfall 4: Floating-point multiplier display bugs

**Symptom:** Shows `2.449999x` or pays wrong cents.  
**Avoid:** Store money as integer credits (or fixed 2-decimal); display with `toFixed(2)`.

## Pitfall 5: Looking like a real casino product

**Symptom:** Employer/legal concern; mistaken for gambling app.  
**Avoid:** Persistent DEMO badge, “portfolio demo — no real money”, credits not $, no deposit UI.

## Pitfall 6: Copying commercial assets

**Symptom:** IP risk.  
**Avoid:** Graphics/Text only for v1; **ask user** before any texture/image pipeline.

## Pitfall 7: Ignoring mobile canvas sizing

**Symptom:** Cropped playfield, unusable buttons.  
**Avoid:** CSS full-width stage parent + resize listener; touch-friendly control hit targets (HTML buttons help).

## Pitfall 8: Deprecated Pixi APIs

**Symptom:** v7 habits (`lineStyle`, sync Application constructor) break on v8.  
**Avoid:** Async `app.init`, Graphics `stroke({...})`, ticker `deltaMS`.

## Pitfall 9: Overbuilding lobby / multiplayer “for realism”

**Symptom:** Misses portfolio deadline; dilutes crash demo.  
**Avoid:** Stick to single-page v1 roadmap.

## Confidence

HIGH — these are common crash-demo and Pixi v8 footguns.
