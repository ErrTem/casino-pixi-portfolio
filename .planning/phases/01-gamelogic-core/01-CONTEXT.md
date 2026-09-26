# Phase 1: GameLogic Core - Context

**Gathered:** 2026-09-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Authoritative Crash round loop in pure TypeScript — continuous waiting→flying→settle cadence, demo wallet, seeded RNG (`crashAt` at round start), time-driven multiplier, manual + auto cash-out in a single `resolveTick`, Vitest coverage — with **zero** `pixi.js` / DOM imports. No HUD, no Pixi canvas, no polish UX (countdown chrome, SFX, `?seed=` UI).

</domain>

<decisions>
## Implementation Decisions

### Demo wallet economy
- **D-01:** Starting demo balance is **5,000** (session-local; no persistence in this phase).
- **D-02:** Minimum bet is **10**; maximum bet is **1,000**, and never above current balance.
- **D-03:** When balance is below min bet, GameLogic **hard-stops** (rejects place-bet). No auto top-up.
- **D-04:** Expose **`resetWallet()`** (restore to starting balance) for Phase 2+ HUD to call — logic only; no UI here. — **Reversibility:** costly — callers and tests will depend on the reset contract once HUD wires it.

### Crash distribution feel
- **D-05:** Outcome mix is **balanced Crash** (frequent early exits + occasional mid/high flyers, Aviator-ish demo feel). Exact sampling formula is for research/planning; target feel is locked.
- **D-06:** `crashAt` floor is **1.01×** (no instant 1.00× busts — every round has a tiny climb).
- **D-07:** Hard cap on `crashAt` is **~100×**.
- **D-08:** Mild house edge **~3–5%** in the crash sampling model (demo RNG, not provably fair / certified). — **Reversibility:** costly — settlement tests and perceived fairness tune against this edge once wired.

### Multiplier climb pace
- **D-09:** Standard Crash tempo: about **2× in ~2–3 seconds** of flight time.
- **D-10:** Curve shape is **smooth exponential** (classic Crash acceleration).
- **D-11:** Multiplier display/settlement precision is **2 decimal places** (`1.00×`, `2.37×`).
- **D-12:** Climb rate lives as **named tunable constant(s)** in a small config object (not buried magic numbers).

### Post-round settle beat / round cadence
- **D-13:** After a round ends, enter a **5 second waiting window** with betting open. — **Reversibility:** costly — HUD/Pixi and Phase 5 countdown will assume this cadence.
- **D-14:** When the 5s window hits zero, the round **auto-launches** whether or not a bet was placed (live online Crash style — continuous rounds). — **Reversibility:** one-way — changes PLAY-01 “manual start after bet” into continuous auto-start; HUD and tests must treat waiting as timed, not idle-until-click.
- **D-15:** **Spectator rounds** are first-class: no bet → still roll `crashAt`, fly, crash; **wallet unchanged**; crash point still recorded for history consumers. — **Reversibility:** costly — history buffer and phase machine must support bet-optional rounds.

### Claude's Discretion
- Exact crash-sampling formula / seedrandom wiring that achieves D-05–D-08 (researcher picks; keep behind `Rng` interface per research).
- Exact exponential growth constant values that hit D-09 (named constants per D-12).
- Money representation internals (prefer fixed-point / integer cents for wallet to avoid float settle bugs — research PITFALLS); external API can still speak 2dp multipliers.
- Package layout under `games/crash/logic/` (or equivalent) and command/snapshot facade shapes — follow `.planning/research/ARCHITECTURE.md`.
- `resolveTick` order already locked by roadmap/research: **crash before auto cash-out**; idempotent settlement.
- History ring-buffer size `N` (strip UI is Phase 2; buffer may exist in Phase 1 for D-15).
- Seed lifecycle for Phase 1 tests (per-round seed advancement); URL `?seed=` UI is Phase 5.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project scope
- `.planning/PROJECT.md` — Product vision, stack locks, GameLogic≠Pixi, out-of-scope (no real money, no multiplayer, seeded demo RNG only)
- `.planning/REQUIREMENTS.md` — PLAY-01..05, WALT-01/02/04, ARCH-01/02/04 mapped to Phase 1; note D-14 reinterprets start cadence vs naive reading of PLAY-01
- `.planning/ROADMAP.md` — Phase 1 goal, success criteria, plans 01-01..01-05
- `.planning/STATE.md` — Current position / session continuity

### Research (implementation constraints)
- `.planning/research/SUMMARY.md` — Recommended approach; Phase 1 research flags (curve formula, fixed-point money)
- `.planning/research/ARCHITECTURE.md` — Layers, folder seams, ticker→`tick(dt)`, crashAt-at-start, snapshot contracts
- `.planning/research/STACK.md` — seedrandom + Vitest; `Rng` interface; no Pixi in logic
- `.planning/research/PITFALLS.md` — Animation-owned timing, mid-flight RNG, float/auto-vs-crash races, logic-in-Pixi
- `.planning/research/FEATURES.md` — Table-stakes vs deferred (auto-bet consecutive is v2; continuous rounds ≠ auto-bet)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None yet — greenfield repo (planning docs + README only; no `src/` TypeScript).

### Established Patterns
- Research-prescribed: pure GameLogic facade (commands in / snapshots+events out); `app.ticker` feeds logic only in later phases; Vitest on Node without canvas.

### Integration Points
- Phase 2 will bind HTML HUD commands to this facade and call `resetWallet()` when broke.
- Phase 3 Pixi will observe snapshots only; must not own timing or settlement.
- Phase 5 can surface seed/countdown chrome on top of the 5s waiting cadence (D-13/D-14).

</code_context>

<specifics>
## Specific Ideas

- User wants cadence **like a real online Crash game**: rounds keep launching on a timer; betting is optional for watching.
- “5 seconds pause before next launch” clarified as the **waiting window with bets open**, not a separate locked result-only beat.
- Broke wallet: hard stop now; **UI reset button later** via `resetWallet()` — do not invent auto refill.

</specifics>

<deferred>
## Deferred Ideas

None new from discussion — stayed in Phase 1 domain. Already-roadmap deferred (not reopened here):
- Bet presets / history strip UI → Phase 2 (logic may still maintain history buffer for D-15)
- Pixi hybrid view → Phase 3
- Mobile → Phase 4
- Countdown chrome, SFX, `?seed=` UI, session stats, keyboard cash-out → Phase 5
- Dual bets / auto-bet consecutive / lobby → v2

</deferred>

---

*Phase: 1-GameLogic Core*
*Context gathered: 2026-09-26*
