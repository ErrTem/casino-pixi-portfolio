# Phase 4: Mobile Harden - Context

**Gathered:** 2026-09-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Playable on phones — responsive canvas layout and touch-usable HTML controls without overlay hit conflicts (ARCH-03). Fixed-height HUD chrome with leftover viewport for Pixi; mobile stacked bar; promoted Cash out during flight; history stays in the bottom bar. No countdown / SFX / seed / stats / keyboard (Phase 5). No new monetary capabilities. No DEMO badge UI.

</domain>

<decisions>
## Implementation Decisions

### Phone bar shape / layout budget
- **D-01:** On narrow viewports, keep the **one tall column** stack (balance → actions → chips+history), matching today's `@media (max-width: 720px)` behavior — not a two-row compact chrome or a single thumb row. — **Reversibility:** costly — HUD CSS grid and Phase 4 retunes assume stacked zones.
- **D-02:** **Fixed height for the HUD button bar**; **whatever remains above goes to `#game-canvas-host` / Pixi**. The stacked column must not grow the bar and steal curve space. — **Reversibility:** costly — shell flex, `resizeTo: host`, and canvas fill depend on a stable chrome budget.
- **D-03:** When chips + history + actions overflow the fixed bar, **scroll inside the chrome** (bar height stays locked; canvas size stays stable). History may continue to scroll horizontally within that budget.
- **D-04:** **Same fixed bar height in portrait and landscape** — one chrome budget; landscape does not get a shorter/taller bar.

### Cash-out while flying (touch)
- **D-05:** During flight, **promote Cash out** to the main thumb target; de-emphasize bet/chips. — **Reversibility:** costly — phase-dependent HUD classes and enablement styling hang on this promotion.
- **D-06:** Place bet / chips / Auto CO stay **visible but smaller** while Cash out is promoted (do not hide mid-flight).
- **D-07:** Flying Cash out is a **full-width primary button** in the actions zone (~44–48px tall).
- **D-08:** After personal cash-out (spectator finish), Cash out **stays full-width and disabled** until crash → idle — do not shrink immediately on cash-out.

### History on a narrow bar
- **D-09:** History remains a **horizontal scroll row** of the existing pills (all `historySize` entries available via swipe) — not a “newest few only” redesign.
- **D-10:** In the stacked column, **history sits below chips**.
- **D-11:** Keep **compact history pills** (~0.75rem) on phone — denser strip over larger mobile typography.
- **D-12:** History strip is **display-only** — scroll to browse; no tap/select action on pills.

### Portrait vs landscape / breakpoints / safe area
- **D-13:** **Portrait-first** — design and QA primarily for portrait; landscape must not break (playable, no hit conflicts) but does not get a separate first-class chrome design.
- **D-14:** Mobile chrome stays **stacked for narrow viewports even in landscape** (no dedicated landscape layout). Switching stacked ↔ 3-column is driven by **viewport width only** at the existing **~720px** breakpoint.
- **D-15:** Pad the fixed HUD bar with **`env(safe-area-inset-*)`** so controls clear notches / home indicator; canvas uses the remaining space.

### Carried forward (do not reopen)
- Canvas above bottom HTML chrome; history inside the bottom bar; three-zone chrome (Phase 2 D-01–D-03).
- Pixi owns spectacle only; monetary controls stay HTML (Phase 2/3).
- Pixi `resizeTo: host` + `resolution: Math.min(devicePixelRatio, 2)` + `autoDensity` already in `mountCrashView` — harden/re-verify in this phase; do not invent a second resize path.
- Durable cashed_out spectator finish + dual theater × (Phase 3 D-16) — Cash out disable styling must not change settlement.
- Continuous waiting / auto-launch / spectator (Phase 1 D-13–D-15).
- No DEMO badge UI (PROJECT.md).

### Claude's Discretion
- Exact fixed HUD bar height in `px` / `rem` / `dvh` that fits stacked zones + full-width Cash out without clipping critical controls on common phones.
- Exact mobile tap-target sizes for Place bet / chips / Auto CO when de-emphasized; Cash out ~44–48px full-width is locked.
- Canvas / host `pointer-events` and stacking so the canvas never steals taps from monetary controls (PITFALLS: prefer `pointer-events: none` on non-interactive canvas).
- `touch-action: manipulation` (or equivalent) on HUD controls; prevent accidental page scroll stealing cash-out taps.
- Whether bar overflow is vertical scroll on `.hud-bar` vs inner zones — keep D-02/D-03 (fixed height, canvas stable).
- DPR cap already at 2 — only re-bind/re-measure on resize / orientation change if needed; no uncapped DPR.
- Exact safe-area padding distribution (bottom vs sides) within D-15.
- Mobile QA checklist devices / DevTools widths for plan 04-03 — must cover success criteria and overlay hit conflicts.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project scope
- `.planning/PROJECT.md` — HTML + Pixi; no React v1; no DEMO badge; GameLogic ≠ Pixi
- `.planning/REQUIREMENTS.md` — ARCH-03 mapped to Phase 4
- `.planning/ROADMAP.md` — Phase 4 goal, success criteria, plans 04-01..04-03
- `.planning/STATE.md` — Current position / session continuity
- `.planning/phases/02-vite-shell-html-hud/02-CONTEXT.md` — D-01–D-03 bottom bar / history / three-zone chrome
- `.planning/phases/03-pixi-hybrid-view/03-CONTEXT.md` — Canvas mount; D-16 spectator cash-out; resize deferred to Phase 4

### Research / pitfalls
- `.planning/research/PITFALLS.md` — Overlay hit conflicts; `pointer-events`; safe-area; `resizeTo` host not window; capped DPR; touch targets ≥44px
- `.planning/research/ARCHITECTURE.md` — HTML HUD out of canvas hit-testing; shell resize/lifecycle
- `.planning/research/SUMMARY.md` — Phase 4 delivers responsive CSS + touch targets

### Existing integration (code)
- `src/styles/hud.css` — Current shell flex, `.hud-bar` grid, `@media (max-width: 720px)` stack
- `index.html` — `#game-canvas-host` + `#hud-bar` zones
- `src/games/crash/view/mountCrashView.ts` — `resizeTo: host`, DPR cap 2, `autoDensity`
- `src/games/crash/hud/CrashHud.ts` — Binder / enablement / chip fill-only / history render
- `src/main.ts` — Composition root; canvas host query

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `.app-shell` column flex + `.canvas-host { flex: 1 }` + `.hud-bar` — retarget so bar is fixed height and host takes remainder.
- Existing `@media (max-width: 720px)` single-column stack — keep breakpoint behavior (D-14); retune sizes/order (history below chips).
- `mountCrashView` already resizes to host with capped DPR — Phase 4 hardens orientation/safe-area; avoid CSS-scaling the canvas.
- `CrashHud` enablement already distinguishes waiting vs flying — drive Cash out promotion classes from phase/enablement.

### Established Patterns
- Monetary controls HTML-only; chips fill input only (no placeBet on chip click).
- History from `snapshot.history` only; createElement + textContent.
- Pixi canvas replaced into `#game-canvas-host`; placeholder removed at mount.

### Integration Points
- CSS: fixed bar height, safe-area pads, mobile tap targets, flying Cash out full-width, scroll overflow in chrome.
- Optional tiny HUD class hooks when `phase === "flying"` / post-cash-out disabled promote state — no GameLogic changes expected.
- QA: phone-sized viewport + touch; verify canvas does not steal taps; history readable/scrollable.

</code_context>

<specifics>
## Specific Ideas

- User phrasing for layout budget: **fixed height for buttons; what's left for the canvas** — treat that as the shell contract.
- Cash out should feel like a mobile primary CTA mid-flight and remain a full-width disabled slab through spectator finish so the chrome does not “pop” smaller right after a successful cash-out.

</specifics>

<deferred>
## Deferred Ideas

None new from discussion — stayed in Phase 4 domain. Already-roadmap deferred (not reopened here):
- Waiting countdown, SFX/mute, `?seed=`, session stats, keyboard cash-out → Phase 5
- First-class landscape chrome redesign → not in v1 (portrait-first only)
- History pill tap / round replay → Phase 5 seed territory if ever
- DEMO badge UI → declined (PROJECT.md)
- Multi-game lobby / React shell → later milestone

</deferred>

---

*Phase: 4-Mobile Harden*
*Context gathered: 2026-09-27*
