# Phase 5: Polish - Context

**Gathered:** 2026-09-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Shareable polish on the playable Crash demo: waiting-phase countdown chrome on the canvas theater, SFX placeholders with a mute toggle, `?seed=` session bootstrap plus an on-screen seed chip, soft session stats (avg/max) from history, and desktop keyboard cash-out (Space + Enter with input-focus guard). No new game modes, no real audio art pipeline beyond synthetic beeps, no DEMO badge, no multiplayer.

</domain>

<decisions>
## Implementation Decisions

### Countdown placement & read
- **D-01:** Waiting countdown lives in the **canvas theater** (upper game region), not the HUD bar. — **Reversibility:** costly — Pixi theater text / waiting choreography and Phase 3 D-17 handoff assume canvas digits.
- **D-02:** Countdown reads as **continuous tenths**: `5.0 → 4.9 → 4.8 …` driven by `waitRemainingMs`, not whole-second steps.
- **D-03:** Show countdown in **waiting only**; clear the instant flight starts (do not keep it through crash hold or add a GO flash).
- **D-04:** Digit **style matches the theater ×** (same type scale/weight; white while waiting).

### SFX events & mute UX
- **D-05:** SFX placeholders for the **core four** events: bet lock, takeoff/launch, cash-out, crash (no countdown tick SFX).
- **D-06:** **Mute toggle lives in HUD chrome** (small control in the bottom bar).
- **D-07:** Mute preference **persists in `localStorage`** across reloads.
- **D-08:** Placeholders are **short synthetic beeps** with distinct pitches per event, behind an `AudioPort` (swap real files later).

### Seed URL & on-screen display
- **D-09:** On-screen seed is a **collapsible “Seed” chip** in HUD chrome (not always-visible full string, not canvas).
- **D-10:** `?seed=` performs a **full session bootstrap** — `createGame({ seed })` from that seed at load (wallet + RNG stream from that seed). — **Reversibility:** costly — boot wiring and shareable replay links assume one seed owns the session.
- **D-11:** Seed chip **reveals the seed string and one-click copies** it to the clipboard (not a share-URL copy helper in v1).
- **D-12:** Missing or invalid `?seed=` falls back to the fixed demo default **`"portfolio-demo"`** (same as today’s `main.ts`).

### Session stats & keyboard cash-out
- **D-13:** Soft session stats are **average crash ×** and **max crash ×** derived from the history ring (`snapshot.history`).
- **D-14:** Stats live **near the history strip** (beside or above the history pills in chrome).
- **D-15:** Desktop cash-out shortcuts are **Space and Enter**, both ignored while the bet field, auto cash-out field, or any text input is focused. — **Reversibility:** costly — global key handlers and HUD focus rules hang on this dual-key + guard contract.
- **D-16:** When history is empty, avg/max show **placeholders** (`—` / `n/a`), not zeros and not a hidden row.

### Claude's Discretion
- Exact theater countdown typography within D-04 (matching theater × family).
- Exact HUD placement of mute control and Seed chip within the fixed bar budget (Phase 4 D-02).
- Howler vs Web Audio vs oscillator for synthetic beeps — keep behind `AudioPort`; STACK.md suggests Howler when adding audio.
- Whether invalid `?seed=` silently falls back or briefly notes fallback in the Seed chip UI.
- Exact avg/max label copy and formatting (2dp × to match `formatMult`).
- Whether Space/Enter also require `phase === "flying"` with an active cashable bet (should follow existing `enablementFrom` / cash-out rules).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project scope
- `.planning/PROJECT.md` — Polish in active requirements; placeholders OK for SFX; seeded demo RNG; no DEMO badge UI
- `.planning/REQUIREMENTS.md` — PLSH-01..PLSH-05
- `.planning/ROADMAP.md` — Phase 5 goal, success criteria, plan sketch (05-01..05-04)

### Prior phase decisions
- `.planning/phases/01-gamelogic-core/01-CONTEXT.md` — D-13/D-14 5s waiting auto-launch; seeded RNG; Phase 5 countdown/`?seed=` deferred notes
- `.planning/phases/02-vite-shell-html-hud/02-CONTEXT.md` — Bottom bar / three-zone chrome / history in bar
- `.planning/phases/03-pixi-hybrid-view/03-CONTEXT.md` — Theater ×; D-17 no countdown digits until Phase 5; waiting idle choreography
- `.planning/phases/04-mobile-harden/04-CONTEXT.md` — Fixed chrome budget; Cash out promotion; history display-only

### Research / stack
- `.planning/research/STACK.md` — Howler / `AudioPort` for SFX; seedrandom behind `Rng`
- `.planning/research/PITFALLS.md` — Seeded reproducibility; no XSS via seed UI (`textContent`); DEMO labeling
- `.planning/research/FEATURES.md` — Waiting countdown, sound+mute, seed/`?seed=`, soft session stats, keyboard cash-out

### Existing integration (code)
- `src/main.ts` — Hardcoded `createGame({ seed: "portfolio-demo" })`; ticker → tick → HUD + scene
- `src/games/crash/logic/config.ts` — `waitDurationMs: 5_000`
- `src/games/crash/logic/resolveTick.ts` — `waitRemainingMs` countdown → `startRound`
- `src/games/crash/hud/CrashHud.ts` / `historyStrip.ts` — History binding; chrome mount points for mute/seed/stats
- `src/games/crash/view/TheaterText.ts` / `CrashScene.ts` — Theater × pattern for countdown digits
- `src/shared/rng/createRng.ts` — Seeded PRNG entry

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `waitRemainingMs` on waiting phase — drive tenths display (`(ms/1000).toFixed(1)` or equivalent)
- Theater × (`TheaterText` / scene sync) — same upper-third slot for waiting countdown digits (D-01/D-04)
- `snapshot.history` + `historyStrip` — compute avg/max; place labels near strip (D-13/D-14)
- `enablementFrom` / cash-out path — keyboard shortcuts must call the same cash-out action as the button
- `createRng` / `createGame({ seed })` — URL parse feeds boot seed (D-10/D-12)

### Established Patterns
- GameLogic pure; HUD/view read snapshots only — audio and seed UI stay outside logic
- Fixed HUD bar budget on ≤720px — mute, Seed chip, and stats must fit without stealing canvas height
- Continuous waiting → auto-launch — countdown is presentation of existing cadence, not a new FSM

### Integration Points
- `main.ts` boot: parse `URLSearchParams` → seed → `createGame`
- HUD binder: mute control, Seed chip, avg/max near history, keydown listeners with input-focus guard
- View: show/hide/update countdown text from `phase === "waiting"` + `waitRemainingMs`
- `AudioPort`: fire on bet lock / launch / cash-out / crash transitions observed from snapshots or HUD actions

</code_context>

<specifics>
## Specific Ideas

- Countdown must feel like a live timer: **`5.0 → 4.9 → 4.8`**, not integer ticks.
- Cash-out keys are **both Space and Enter**, with a hard rule: never fire while typing in bet/auto fields.
- Seed chip copies the **seed string**, not a constructed share URL (can add URL copy later).

</specifics>

<deferred>
## Deferred Ideas

- Copy shareable `?seed=` absolute URL from the chip (user chose seed-string copy only for v1)
- Real SFX asset files / art pipeline (synthetic beeps now; ask user when assets are ready)
- Countdown tick SFX / GO flash / crash-hold countdown (explicitly rejected)
- Mid-session `?seed=` watching / hard-reset on URL change (boot-only bootstrap)

None of the above are in Phase 5 scope unless reopened.

</deferred>

---

*Phase: 5-Polish*
*Context gathered: 2026-09-27*
