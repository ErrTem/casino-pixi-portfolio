# Phase 2: Vite Shell + HTML HUD - Context

**Gathered:** 2026-09-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Vite app shell with a thin HTML overlay so a recruiter can play the full bet → fly → cash-out/crash → balance loop using numbers before art. Composition root wires GameLogic commands/snapshots to the HUD; Pixi does **not** own monetary controls; a reserved canvas region sits above the control chrome for Phase 3 drop-in. No hybrid curve/rocket (Phase 3), no mobile hardening (Phase 4), no countdown/SFX/seed/stats/keyboard polish (Phase 5).

</domain>

<decisions>
## Implementation Decisions

### Overlay chrome layout
- **D-01:** First viewport is a **bottom control bar** with a full-width **canvas/placeholder region above** — monetary controls (bet, cash-out, balance, auto CO, chips, history) live in the bottom band. — **Reversibility:** costly — Phase 3 canvas mount and Phase 4 responsive stacking assume this top/bottom split.
- **D-02:** **History strip lives inside the bottom bar** (same chrome band as chips), not above the canvas and not floating over the game region. — **Reversibility:** costly — CSS stacking and Phase 4 touch grouping follow this single-chrome-region choice.
- **D-03:** Bottom bar internal layout: **balance left · primary actions center · chips + history right**. — **Reversibility:** costly — HUD binder structure and Phase 4 retunes assume this three-zone chrome.
- **D-04:** Phase 2 canvas region is an **empty reserved slot** (neutral game region; optional quiet label only) — **no** big HTML multiplier theater in the slot. Phase 3 replaces the slot with Pixi. — **Reversibility:** one-way — Phase 3 plans treat the slot as a clean mount target; putting large HTML flight feedback in the slot would force a layout rework when the curve lands.

### Carried forward (do not reopen)
- Continuous 5s waiting → auto-launch (Phase 1 D-13/D-14); spectator rounds OK (D-15) — HUD has no separate “Start round” gate; place bet during waiting.
- Wallet economy and `resetWallet()` (Phase 1 D-01–D-04); display-unit `placeBet`.
- History buffer `N=20` already in `CRASH_CONFIG.historySize` — strip renders `snapshot.history`.
- No React/Angular; no DEMO badge UI (PROJECT.md).
- Wire to existing facade: `createGame` → `placeBet` / `requestCashOut` / `setAutoCashOut` / `tick` / `getSnapshot` / `resetWallet`.

### Claude's Discretion
- Exact bet preset chip values and chip↔free-form input interaction (WALT-03).
- History strip visual density within the right zone (show all 20 vs fewer visible with scroll), newest direction, color thresholds.
- Whether a **small** live multiplier / phase readout appears in the bottom bar (not in the canvas slot) for headless play clarity.
- Exact auto cash-out control chrome (always-visible input vs toggle+input) within the center actions zone.
- Broke / hard-stop UX: where and how to surface `resetWallet()` in the bottom bar.
- Composition-root tick source for Phase 2 (e.g. `requestAnimationFrame` until Pixi ticker in Phase 3).
- Vite + TS bootstrap details, folder seams under `games/crash/hud` (or equivalent) per research ARCHITECTURE — follow existing `src/games/crash/logic/` package.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project scope
- `.planning/PROJECT.md` — Stack locks (Vite + Pixi v8 + TS; HTML HUD, no React v1); no DEMO badge UI; GameLogic ≠ Pixi
- `.planning/REQUIREMENTS.md` — VIS-02, WALT-03, WALT-05 mapped to Phase 2
- `.planning/ROADMAP.md` — Phase 2 goal, success criteria, plans 02-01..02-03
- `.planning/STATE.md` — Current position / session continuity
- `.planning/phases/01-gamelogic-core/01-CONTEXT.md` — D-01..D-15 locked (wallet, cadence, spectator, resetWallet)

### Research / architecture
- `.planning/research/ARCHITECTURE.md` — Vite shell composition root; HTML HUD commands / Pixi observes; folder seams (`main.ts`, `games/crash/hud`, logic package)
- `.planning/research/STACK.md` — Vite + Pixi timing (Pixi deps land this phase for shell; canvas spectacle still Phase 3)
- `.planning/research/PITFALLS.md` — Logic leaking into HUD/Pixi; animation-owned timing

### Existing GameLogic (integration contract)
- `src/games/crash/logic/CrashGame.ts` — `createGame` facade, command/snapshot API
- `src/games/crash/logic/config.ts` — `CRASH_CONFIG` including `historySize: 20`
- `src/games/crash/logic/RoundState.ts` — `CrashSnapshot` / `Phase` shapes for HUD binding
- `src/games/crash/logic/History.ts` — ring buffer consumed by history strip
- `src/games/crash/logic/index.ts` — public exports for composition root

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `createGame` / `CrashGame` facade — sole authority for bets, cash-out, auto CO, ticks, snapshots, `resetWallet`.
- `CRASH_CONFIG` — wallet bounds, wait duration, history size already locked in code.
- `CrashSnapshot` — HUD binder should render from snapshot fields only (phase, multiplier, balance, bet, history, waitRemainingMs, autoCashOutAt).

### Established Patterns
- Pure logic under `src/games/crash/logic/` with `.js` ESM import suffixes; Vitest on Node; no `pixi.js` / Vite in package.json yet (Phase 2 adds shell deps).
- Display units at the command boundary (`placeBet(100)`); cents internal to wallet.

### Integration Points
- New Vite entry (`index.html` + `main.ts`) creates one `CrashGame`, mounts HUD binder, reserves canvas host div above the bar.
- HUD sends commands only; never mutates balance/history directly.
- Phase 3 mounts Pixi into the reserved slot and switches tick feed to `app.ticker` — keep slot DOM stable.

</code_context>

<specifics>
## Specific Ideas

- User wants a classic Crash-style chrome: spectacle above, controls below — not a side-rail dashboard.
- History stays with the money controls (one chrome region), not competing with the future curve view.
- Phase 2 should not fake the game view with a giant HTML multiplier in the canvas slot; keep the slot clean for Pixi.

</specifics>

<deferred>
## Deferred Ideas

None new from discussion — stayed in Phase 2 domain. Already-roadmap deferred (not reopened here):
- Hybrid curve + rocket → Phase 3
- Mobile / touch stacking → Phase 4
- Countdown, SFX/mute, `?seed=`, session stats, keyboard cash-out → Phase 5
- DEMO badge UI → declined (PROJECT.md)
- Multi-game lobby / React shell → later milestone

</deferred>

---

*Phase: 2-Vite Shell + HTML HUD*
*Context gathered: 2026-09-26*
