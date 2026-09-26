# State — Crash Pixi Portfolio

**Updated:** 2026-09-26  
**Milestone:** v1 — Playable demo Crash  
**Status:** Initialized — ready for Phase 1 planning

## Current Position

- **Phase:** none active (roadmap defined)
- **Next command:** `/gsd-plan-phase 1`
- **Branch:** `cursor/gsd-new-project-crash-c5a3` (planning init)

## Project Memory

- Stack locked: PixiJS v8 + TypeScript + Vite; client-only demo
- Visual default: graph + big multiplier number (no textures unless user provides)
- Architecture: pure `GameLogic` separate from Pixi view; seeded RNG
- Positioning: DEMO / portfolio — not real-money gambling
- Research completed lightly; requirements + fine 5-phase roadmap written
- Config: yolo mode, fine granularity, research on, auto_advance on, commit_docs on

## Decisions Log

| Date | Decision | Why |
|------|----------|-----|
| 2026-09-26 | Client seeded RNG (not provably fair) | Testable demos; no backend |
| 2026-09-26 | Graphics curve first, sprites later | Simplest polished look; ask for textures |
| 2026-09-26 | HTML controls + Pixi playfield | Faster ship, better mobile inputs |
| 2026-09-26 | Five fine phases | Shippable increments toward playable round |

## Open Questions

- Starting balance / bet presets — defaults documented in research (1000 / 10·25·50·100); confirm at Phase 3 if needed
- Textures — **blocked on user** only if we leave Graphics-only path; not needed for v1 success

## Blockers

None for Phase 1.

## Session Continuity

After `/gsd-plan-phase 1`, update this file with active phase, plan IDs, and any new decisions.
