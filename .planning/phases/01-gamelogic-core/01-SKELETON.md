# Walking Skeleton — Casino Crash Portfolio (PixiJS)

**Phase:** 1
**Generated:** 2026-09-26

## Capability Proven End-to-End

A Vitest caller can `createGame({ seed })`, `placeBet`, advance the 5s waiting window into flight, cash out or crash, and observe demo-wallet settlement — with the same seed always yielding the same `crashAt` — with zero Pixi/Vite UI.

## Phase Goal (MVP)

**As a** GameLogic caller (Vitest now, HUD later), **I want to** place a demo bet, advance a continuous round through flight and crash or cash-out, and see the wallet settle, **so that** the authoritative Crash loop is proven before any Pixi or Vite UI.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Runtime (Phase 1) | Node + TypeScript ~5.8.3 + Vitest 3.2.7 | Pure logic testable without canvas; Pixi shell deferred to Phase 2–3 |
| Data layer | In-memory session wallet (integer cents) | No persistence/backend in v1; avoids float settle bugs |
| Auth | None | Client-only demo; no accounts |
| Deployment / run | `npx vitest run` local full-logic suite | Phase 1 has no hosted UI; documented local command is the stack proof |
| Directory layout | `src/games/crash/logic/*` + `src/shared/{money,rng}` | Matches ARCHITECTURE.md seams; HUD/view/app arrive in later phases |
| RNG | `seedrandom@3.0.5` behind `Rng` | Reproducible demo crash points (not provably fair) |
| Round cadence | Continuous 5s waiting auto-launch (D-14) | Live Crash style; spectator rounds first-class (D-15) |
| Settlement | Single `resolveTick`: crash → auto CO → manual | Prevents double-settle races |

## Stack Touched in Phase 1

- [x] Project scaffold (package.json, tsconfig, Vitest node) — plan 01-01
- [x] Walking Skeleton tracer (createGame → bet→fly→settle) — plan 01-02
- [ ] Routing — N/A (no HTTP app in Phase 1; deferred to Phase 2 Vite shell)
- [ ] Database — N/A (session-local wallet only)
- [x] “UI” interaction stand-in — Vitest drives CrashGame commands (placeBet / tick / cash-out)
- [x] Deployment stand-in — documented local command: `npx vitest run`

## Out of Scope (Deferred to Later Slices)

- Vite composition root, HTML HUD, bet presets, history strip UI → Phase 2
- Pixi hybrid curve/rocket view → Phase 3
- Mobile layout / touch → Phase 4
- Countdown chrome, SFX, `?seed=` UI, session stats, keyboard cash-out → Phase 5
- Dual bets / auto-bet consecutive / lobby / real money → v2
- Provably fair commit-reveal RNG

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering its architectural decisions:

- Phase 2: Recruiter can play bet → fly → cash-out via HTML overlay wired to CrashGame
- Phase 3: Recruiter sees hybrid Pixi curve + rocket driven only by snapshots
- Phase 4: Same loop usable on phone-sized viewports
- Phase 5: Countdown, SFX/mute, seed display, soft stats, keyboard cash-out

## Walking Skeleton Test Path

1. `createGame({ seed: "demo-1" })`
2. `placeBet(100)` while `phase === waiting`
3. `tick(5000)` → `phase === flying`; `crashAt` stable
4. `requestCashOut()` before crash **or** tick until crash
5. Assert balance + history; spectator round → balance unchanged

## Artifacts Index (Phase 1)

| Path | Role |
|------|------|
| `src/games/crash/logic/CrashGame.ts` | Facade |
| `src/games/crash/logic/resolveTick.ts` | Settlement authority |
| `src/games/crash/logic/config.ts` | Named constants (D-12) |
| `src/shared/money/cents.ts` | Fixed-point money |
| `src/shared/rng/createRng.ts` | Seeded Rng adapter |
| `tests/walkingSkeleton.test.ts` | E2E tracer |
| `tests/wallet.test.ts` | WALT-01/02 |
| `tests/roundCadence.test.ts` | PLAY-01/05, D-15 |
| `tests/resolveTick.test.ts` | PLAY-03/04, WALT-04 |
| `tests/crashRng.test.ts` | ARCH-01 |
| `tests/multiplierCurve.test.ts` | PLAY-02 |
| `tests/architecture.no-pixi.test.ts` | ARCH-02 |
