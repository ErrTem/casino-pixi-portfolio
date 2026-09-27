# Phase 4: Mobile Harden - Research

**Researched:** 2026-09-27
**Domain:** Responsive shell layout, touch-usable HTML HUD, canvas/overlay hit isolation, safe-area + DPR-capped resize hardening (ARCH-03)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Phone bar shape / layout budget
- **D-01:** On narrow viewports, keep the **one tall column** stack (balance → actions → chips+history), matching today's `@media (max-width: 720px)` behavior — not a two-row compact chrome or a single thumb row. — **Reversibility:** costly
- **D-02:** **Fixed height for the HUD button bar**; **whatever remains above goes to `#game-canvas-host` / Pixi**. The stacked column must not grow the bar and steal curve space. — **Reversibility:** costly
- **D-03:** When chips + history + actions overflow the fixed bar, **scroll inside the chrome** (bar height stays locked; canvas size stays stable). History may continue to scroll horizontally within that budget.
- **D-04:** **Same fixed bar height in portrait and landscape** — one chrome budget; landscape does not get a shorter/taller bar.

#### Cash-out while flying (touch)
- **D-05:** During flight, **promote Cash out** to the main thumb target; de-emphasize bet/chips. — **Reversibility:** costly
- **D-06:** Place bet / chips / Auto CO stay **visible but smaller** while Cash out is promoted (do not hide mid-flight).
- **D-07:** Flying Cash out is a **full-width primary button** in the actions zone (~44–48px tall).
- **D-08:** After personal cash-out (spectator finish), Cash out **stays full-width and disabled** until crash → idle — do not shrink immediately on cash-out.

#### History on a narrow bar
- **D-09:** History remains a **horizontal scroll row** of the existing pills (all `historySize` entries available via swipe) — not a “newest few only” redesign.
- **D-10:** In the stacked column, **history sits below chips**.
- **D-11:** Keep **compact history pills** (~0.75rem) on phone — denser strip over larger mobile typography.
- **D-12:** History strip is **display-only** — scroll to browse; no tap/select action on pills.

#### Portrait vs landscape / breakpoints / safe area
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

### Claude's Discretion (researcher resolves below)
- Exact fixed HUD bar height in `px` / `rem` / `dvh` that fits stacked zones + full-width Cash out without clipping critical controls on common phones.
- Exact mobile tap-target sizes for Place bet / chips / Auto CO when de-emphasized; Cash out ~44–48px full-width is locked.
- Canvas / host `pointer-events` and stacking so the canvas never steals taps from monetary controls.
- `touch-action: manipulation` (or equivalent) on HUD controls; prevent accidental page scroll stealing cash-out taps.
- Whether bar overflow is vertical scroll on `.hud-bar` vs inner zones — keep D-02/D-03 (fixed height, canvas stable).
- DPR cap already at 2 — only re-bind/re-measure on resize / orientation change if needed; no uncapped DPR.
- Exact safe-area padding distribution (bottom vs sides) within D-15.
- Mobile QA checklist devices / DevTools widths for plan 04-03.

### Deferred Ideas (OUT OF SCOPE)
- Waiting countdown, SFX/mute, `?seed=`, session stats, keyboard cash-out → Phase 5
- First-class landscape chrome redesign → not in v1 (portrait-first only)
- History pill tap / round replay → Phase 5 seed territory if ever
- DEMO badge UI → declined (PROJECT.md)
- Multi-game lobby / React shell → later milestone
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ARCH-03 | Layout works on mobile: responsive canvas and touch-usable HTML controls | Fixed-height HUD chrome + leftover viewport for `#game-canvas-host` (D-02); stacked narrow layout at ≤720px (D-01/D-14); ≥44px Cash out mid-flight (D-05–D-08); `pointer-events: none` on non-interactive canvas + correct stacking (PITFALLS 6–7); `env(safe-area-inset-*)` + `viewport-fit=cover` (D-15); re-verify existing `resizeTo: host` + DPR cap 2 on rotate. Success criteria: canvas fills game region without clipping HUD; touch can place bet / cash out / presets / auto CO; canvas does not steal taps. |
</phase_requirements>

## Project Constraints (from `.claude/.cursor/rules`)

Actionable directives from project rules read this session:

- Stack lock: PixiJS v8 + TypeScript + Vite. No new renderer or SPA framework.
- No React / Angular in v1. HTML + thin TS binders remain the HUD path.
- Client-side only. No backend.
- GameLogic stays pure TypeScript. Phase 4 must not put layout or DOM into `src/games/crash/logic/` or `src/shared/`.
- Monetary controls stay HTML; Pixi remains spectacle-only.
- No DEMO badge UI (PROJECT.md / CONTEXT override PITFALLS wording that still mentions a badge).
- Vitest on Node remains the automated gate; canvas/layout QA is browser-manual for pixels and hit testing.
- Keep phases small and shippable.

## Summary

Phase 4 makes the existing hybrid demo **phone-playable**. The shell already stacks zones under `@media (max-width: 720px)`, mounts Pixi with `resizeTo: host` and a DPR cap of 2, and keeps monetary controls in `#hud-bar`. What is missing is the **layout budget contract** (fixed chrome height so the canvas owns the leftover space), **touch-sized / phase-promoted Cash out**, **safe-area padding**, and **explicit hit isolation** so the canvas cannot steal taps.

No new npm packages. No GameLogic changes. No second Pixi resize path. Work is almost entirely `hud.css` + a tiny HUD class toggle driven by `snapshot.phase`, plus a short orientation/DPR re-check around the existing `mountCrashView` init, and a manual mobile QA checklist (plan 04-03).

**Primary recommendation:** Treat `.hud-bar` as a fixed chrome budget (`--hud-bar-height: 15.5rem` on narrow viewports; same height in landscape). Give `.canvas-host { flex: 1; min-height: 0 }` the remainder. On `phase === "flying" || phase === "cashed_out"`, toggle `hud-bar--promote-cashout` so Cash out is full-width ~46px while bet/chips shrink but stay visible. Set `pointer-events: none` on the canvas, `touch-action: manipulation` on HUD controls, add `viewport-fit=cover` + safe-area pads on the bar. Re-call `app.resize()` (and optionally refresh capped `resolution`) on `orientationchange` / `visualViewport` resize. Validate with DevTools phone widths + one real-device pass for cash-out taps.

**Walking skeleton (MVP):** Phone-width DevTools → canvas fills above a non-growing bar → place bet with finger → mid-flight Cash out is a large full-width target that settles once → history strip scrolls horizontally below chips → rotate: no hit conflicts, canvas reflows.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Round FSM, wallet, settle, history | GameLogic (unchanged) | — | ARCH-02. Phase 4 does not reopen settlement. |
| Shell flex: fixed bar + leftover host | CSS (`.app-shell`, `.hud-bar`, `.canvas-host`) | — | D-02 contract. |
| Narrow stacked zones / history below chips | CSS `@media (max-width: 720px)` + existing DOM order | — | D-01, D-10, D-14. |
| Promote Cash out chrome | HUD binder class toggle from snapshot phase | CSS for sizes | D-05–D-08. Enablement matrix stays in `enablement.ts`. |
| Hit isolation | CSS `pointer-events` / stacking | — | Canvas is non-interactive; no Pixi monetary handlers exist today. |
| Safe-area / viewport-fit | `index.html` meta + `.hud-bar` padding | — | D-15. |
| Host resize / DPR cap | Existing `mountCrashView` | Small harden listener | Do not invent a second resize path (CONTEXT). |
| Scene replot on size change | Existing `CrashScene.ensurePlot` | — | Already compares `app.screen` each sync. |
| Mobile QA / hit conflicts | Manual checklist (04-03) | Optional pure `chromeModeFrom(snap)` unit test | ARCH-03 pixels need a browser. |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Existing CSS (`src/styles/hud.css`) | — | Fixed bar, stack, tap targets, safe-area, pointer-events | ARCH-03 is a layout/touch problem; no UI kit. |
| Existing HTML (`index.html`) | — | Zones + `viewport-fit=cover` | DOM order already balance → actions → chips → history. |
| Existing HUD (`CrashHud.ts`) | — | Phase class for Cash out promotion | Tiny binder hook; no new framework. |
| `pixi.js` | 8.21.0 (installed) | `resizeTo: host`, capped DPR, `autoDensity` | Already correct init shape; Phase 4 hardens, does not replace. `[VERIFIED: package.json]` |
| TypeScript / Vite / Vitest | 5.8.x / 6.4.3 / 3.2.7 | Existing toolchain | No new test runner. `[VERIFIED: package.json]` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none new) | — | — | Do not add Bootstrap, Hammer.js, or a gesture library. Native scroll + Pointer Events are enough. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Fixed `rem` chrome height | `%` / `dvh` of viewport for the bar | `%` fights D-02 (content would still negotiate). `dvh` for the **bar** makes landscape steal canvas differently than portrait, which violates D-04. Prefer one locked rem/px budget. |
| Fixed bar height | Content-sized bar (`flex: 0 0 auto` today) | Current CSS grows with stack and steals curve space — fails D-02 and success criterion 1. |
| CSS `pointer-events: none` on canvas | Pixi `eventMode = "none"` on stage | CSS is the PITFALLS recommendation and stops the browser hit-test before Pixi. Prefer CSS; optional stage flag is redundant insurance only. |
| Promote via hiding bet/chips | Visibility collapse mid-flight | Violates D-06. |
| Second `resizeTo: window` path | Keep host-only resize | CONTEXT forbids inventing a second path; `resizeTo: window` ignores chrome (PITFALLS 6). |
| Playwright mobile suite | Manual DevTools + one device | Overkill for v1 ARCH-03; Node Vitest cannot assert hit targets. Manual QA is plan 04-03. |

**Installation:** none. No `npm install` for this phase.

## Gap Analysis (current code vs Phase 4)

| Area | Current state | Phase 4 need |
|------|---------------|--------------|
| `.hud-bar` height | `flex: 0 0 auto` — grows with content | Fixed height + internal scroll (D-02, D-03) |
| Narrow layout | `@media (max-width: 720px)` → 1 column; zones centered | Keep breakpoint; ensure chips then history (DOM already chips→history); retune sizes |
| Cash out mid-flight | Same button size as Place bet; only `disabled` toggles | Promote class + full-width ~44–48px; stay promoted while `cashed_out` (D-05–D-08) |
| Tap targets | Buttons `padding: 0.4rem 0.75rem`; chips `min-width: 2.5rem` | Waiting: ≥44px min height on primary controls; flying: Cash out ≥44px, others smaller but still tappable |
| Safe area | Viewport meta is `width=device-width, initial-scale=1.0` only; no `env()` pads | `viewport-fit=cover` + bar padding with `safe-area-inset-*` (D-15) |
| Canvas hit | No `pointer-events` rule; Pixi view has no monetary listeners but canvas can still capture | `pointer-events: none` on `.canvas-host canvas` (and preferably the host) |
| Touch scroll steal | No `touch-action` | `touch-action: manipulation` on `.hud-bar button, .hud-bar input, .chip` |
| History | 0.75rem pills, horizontal overflow — already matches D-09/D-11 | Confirm no click handlers (already display-only); keep compact size on phone |
| Resize / DPR | `resizeTo: host`, cap 2, `app.resize()` once; scene `ensurePlot` on screen change | Re-verify on orientation; optionally refresh capped resolution if DPR changes |
| GameLogic | Durable `cashed_out` already | No changes |

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────┐
│ .app-shell (column flex, min-height 100dvh) │
│ ┌─────────────────────────────────────────┐ │
│ │ #game-canvas-host.canvas-host           │ │
│ │   flex: 1 1 auto; min-height: 0         │ │
│ │   canvas { pointer-events: none }       │ │
│ │   Pixi resizeTo: host (existing)        │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ #hud-bar.hud-bar                        │ │
│ │   FIXED height (--hud-bar-height)       │ │
│ │   overflow-y: auto (D-03)               │ │
│ │   padding + env(safe-area-inset-*)      │ │
│ │   ≤720px: 1-col stack                   │ │
│ │   flying|cashed_out → promote Cash out  │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### Recommended Project Structure (delta only)

```
index.html                          # viewport-fit=cover; optional data-action class hooks already present
src/styles/hud.css                  # fixed bar, stack retune, promote, safe-area, pointer-events, touch-action
src/games/crash/hud/
  CrashHud.ts                       # toggle hud-bar--promote-cashout from phase
  chromeMode.ts                     # OPTIONAL pure helper: "normal" | "promote-cashout" (unit-tested)
  chromeMode.test.ts                # OPTIONAL Wave 0
  enablement.ts                     # unchanged (canCashOut still flying && hasBet)
src/games/crash/view/mountCrashView.ts  # optional orientation / visualViewport → app.resize(); keep resizeTo host
```

Do not add a mobile layout module under `logic/`. Do not move controls into Pixi.

### Pattern 1: Fixed chrome budget, leftover canvas (D-02 / D-04)

**What:** Lock `.hud-bar` to one height on all orientations. `.canvas-host` takes the rest via flex. Overflow scrolls **inside** the bar so the host's client box (and thus Pixi) stays stable while the user scrolls chips/history/actions.

**Recommended tokens (discretion):**

| Token | Value | Why |
|-------|-------|-----|
| `--hud-bar-height` | `15.5rem` (~248px at 16px root) | Fits balance row + actions (incl. 46px Cash out) + chips + one history row on ~375×667 phones without eating the whole viewport. Same value portrait and landscape (D-04). |
| `.hud-bar` | `flex: 0 0 var(--hud-bar-height); height: var(--hud-bar-height); max-height: var(--hud-bar-height); overflow-x: hidden; overflow-y: auto; -webkit-overflow-scrolling: touch` | Fixed budget + internal scroll (D-03). Scroll on `.hud-bar` itself (discretion) — simpler than per-zone scrollers and keeps one scrollbar. |
| `.canvas-host` | keep `flex: 1 1 auto; min-height: 0; overflow: hidden` | Leftover space; host shrinks correctly in a column flex. |
| Wide desktop | Keep content-sized or a taller comfortable bar **only above 720px** if needed — but D-04's "same height" applies to portrait vs landscape, not necessarily desktop vs phone. Discretion: apply the fixed height **inside** `@media (max-width: 720px)` so desktop three-column chrome can stay auto-height; phones get the locked budget. |

**Why not `dvh` for the bar:** A bar of `35dvh` grows/shrinks when the mobile URL chrome shows/hides and differs in landscape, fighting D-02/D-04. Use `rem`/`px`. Keep `100dvh` on `.app-shell` only.

**When to use:** Always for narrow viewports. Desktop may keep auto height (three-column) so recruiters on large monitors are unaffected.

### Pattern 2: Stacked zones + history below chips (D-01 / D-10 / D-14)

**What:** Keep `@media (max-width: 720px) { grid-template-columns: 1fr }`. DOM order is already:

1. `hud-zone--left` (balance)
2. `hud-zone--center` (actions)
3. `hud-zone--right` (chips host, then history host)

That yields balance → actions → chips → history without HTML surgery. Do **not** introduce a landscape two-row chrome. Width-only breakpoint remains 720px.

**History (D-09 / D-11 / D-12):** Keep `.history-strip` horizontal overflow + `0.75rem` pills. Do not add click/select handlers. Optional: `touch-action: pan-x` on `.history-strip` so vertical bar scroll and horizontal pill swipe coexist cleanly.

### Pattern 3: Promote Cash out chrome (D-05–D-08)

**What:** Pure mode from snapshot phase — not from button enablement alone (disabled Cash out must stay promoted during `cashed_out`).

```typescript
// Discretion: tiny pure helper for testability
export type HudChromeMode = "normal" | "promote-cashout";

export function chromeModeFrom(phase: CrashSnapshot["phase"]): HudChromeMode {
  return phase === "flying" || phase === "cashed_out"
    ? "promote-cashout"
    : "normal";
}
```

In `CrashHud.render`:

```typescript
root.classList.toggle(
  "hud-bar--promote-cashout",
  chromeModeFrom(snap.phase) === "promote-cashout",
);
```

**CSS contract (discretionary sizes; Cash out height locked to ~44–48px):**

| State | Cash out | Place bet / chips / Auto CO |
|-------|----------|-----------------------------|
| `normal` (waiting / idle chrome) | ≥44px min-height, normal width in actions row | Primary actions ≥44px min-height; chips ≥44px min-height / ≥44px min-width |
| `promote-cashout` | `width: 100%`; `min-height: 2.875rem` (46px); visually primary | Visible; smaller (`min-height: 2rem`, reduced padding/font) — D-06 |

`cashOut.disabled = !en.canCashOut` stays. During `cashed_out`, Cash out is disabled **and** still full-width (D-08). Do not derive promotion from `canCashOut` or the button will shrink the frame after a successful cash-out.

Settlement must not change: still `game.requestCashOut()` on click; enablement still `flying && hasBet`.

### Pattern 4: Hit isolation + touch-action (ARCH-03 success #3)

**What:**

```css
.canvas-host,
.canvas-host canvas {
  pointer-events: none;
}

.hud-bar {
  position: relative;
  z-index: 1; /* above host if any overlap from overflow */
}

.hud-bar button,
.hud-bar input,
.hud-bar .chip {
  touch-action: manipulation; /* drop 300ms delay; reduce double-tap zoom steal */
  min-height: 2.75rem; /* 44px — waiting defaults; promote overrides Cash out to 2.875rem */
}
```

Canvas is display-only today (no `eventMode` / pointer handlers in `view/`). CSS `pointer-events: none` is still required so a full-bleed canvas cannot sit in the hit path if stacking ever overlaps (PITFALLS 7). Do **not** put monetary `pointertap` on the stage.

Avoid `position: fixed` full-viewport canvas. Keep the column layout: host then footer.

### Pattern 5: Safe area (D-15)

**What:**

1. Update viewport meta:
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
   ```
   Without `viewport-fit=cover`, `env(safe-area-inset-*)` is often 0 on notched iOS.

2. Pad the **bar**, not the canvas host (canvas already gets leftover space):
   ```css
   .hud-bar {
     padding-top: 0.75rem;
     padding-left: max(1rem, env(safe-area-inset-left));
     padding-right: max(1rem, env(safe-area-inset-right));
     padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
   }
   ```
   Discretion: bottom inset is the critical home-indicator clearance; sides matter in landscape notch. Top inset on the bar is usually 0 because the bar is at the bottom — do not double-pad the canvas for the status bar unless QA shows clipping (then pad `.app-shell` or `body`, not by shrinking Pixi incorrectly).

### Pattern 6: DPR / orientation harden (no second resize path)

**What already works:**

```18:29:src/games/crash/view/mountCrashView.ts
  await app.init({
    resizeTo: host,
    ...
    autoDensity: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    ...
  });
  host.replaceChildren(app.canvas);
  app.resize();
```

`CrashScene.ensurePlot` rebuilds plot/backdrop when `app.screen` size changes after ResizePlugin updates.

**Harden (discretion, minimal):** After mount, listen once:

```typescript
const refresh = () => {
  const next = Math.min(window.devicePixelRatio || 1, 2);
  if (app.renderer.resolution !== next) {
    app.renderer.resolution = next;
  }
  app.resize(); // still host-sized — not window
};
window.addEventListener("orientationchange", refresh);
window.visualViewport?.addEventListener("resize", refresh);
```

Clean up in HMR `dispose` alongside `app.destroy`. Do **not** set `app.resizeTo = window`. Do **not** CSS-scale the canvas. Cap stays 2 (PITFALLS 6 / uncapped DPR trap).

## Anti-Patterns to Avoid

- Growing the HUD with content on phones (breaks D-02 / clips curve).
- Hiding Place bet / chips during flight (breaks D-06).
- Promoting Cash out only when `canCashOut` is true (breaks D-08 after personal cash-out).
- `resizeTo: window` or CSS `transform: scale` on the canvas.
- Uncapped `devicePixelRatio`.
- Putting bet/cash-out hit areas in Pixi.
- History pill tap / replay UI (deferred).
- DEMO badge UI (declined).
- Landscape-specific second chrome design (D-13/D-14).
- GameLogic or `shared/` imports of DOM/Pixi for layout.
- Playwright/browser test harness as a Phase 4 dependency.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HiDPI canvas sizing | Manual `canvas.width = css * dpr` each frame | Existing `autoDensity` + capped `resolution` + `app.resize()` | ResizePlugin already tracks the host. |
| Touch gesture library | Hammer / custom swipe FSM | Native `overflow-x: auto` on history; `touch-action` on controls | D-09 is a scroll strip, not a gesture app. |
| Mobile layout framework | Bootstrap / container queries redesign | Existing grid + one media query at 720px | D-14 locks width-only stack. |
| Safe-area polyfill | JS notch detection | `viewport-fit=cover` + `env(safe-area-inset-*)` | Standard CSS; zero deps. |
| Separate landscape stylesheet | `@media (orientation: landscape)` chrome redesign | Same fixed bar + width breakpoint | D-13/D-14. |

**Key insight:** Phase 3 already resized to the host. Phase 4's job is to make the **host's box** correct on phones (fixed chrome, safe-area, no canvas hit steal) and make the **Cash out control** thumb-reachable mid-flight — not to re-architect Pixi.

## Common Pitfalls

### Pitfall 1: Content-sized bar steals the curve

**What goes wrong:** Stacked balance + actions + chips + history grow the footer; `#game-canvas-host` collapses; theater × / path clip; success criterion 1 fails.

**Why it happens:** Today's `.hud-bar { flex: 0 0 auto }` with a 1-column stack.

**How to avoid:** Pattern 1 — fixed `--hud-bar-height` + `overflow-y: auto` on the bar.

**Warning signs:** On 375px width, canvas height &lt; ~40% of viewport while the bar shows all controls without scrolling.

### Pitfall 2: Canvas steals cash-out taps

**What goes wrong:** Desktop mouse works; phone taps on Cash out do nothing or feel dead. Recruiter cannot cash out in time.

**Why it happens:** Stacking / full-bleed canvas receiving touches; missing `pointer-events: none`; page scroll stealing the gesture (PITFALLS 7).

**How to avoid:** Pattern 4. Keep host above bar in normal flow. QA: mash Cash out mid-flight on a phone or DevTools touch emulation.

**Warning signs:** `elementFromPoint` over the button returns `canvas`. Rubber-band scroll when jabbing Cash out.

### Pitfall 3: Promote chrome collapses after cash-out

**What goes wrong:** Player cashes out; Cash out button shrinks immediately while rocket still climbs; layout pop; thumb misses the (now small) disabled control.

**Why it happens:** CSS keyed off `:disabled` or `canCashOut` instead of phase.

**How to avoid:** Pattern 3 — `flying || cashed_out` → promote. Leave enablement separate.

**Warning signs:** Class drops on the cash-out frame while `phase === "cashed_out"`.

### Pitfall 4: Safe-area env() always zero

**What goes wrong:** Home indicator overlaps Cash out / history on iPhone; taps miss.

**Why it happens:** Missing `viewport-fit=cover`.

**How to avoid:** Pattern 5. QA on a notched simulator or device.

**Warning signs:** Controls flush with the physical bottom edge on iOS Safari.

### Pitfall 5: Orientation leaves a stale Pixi buffer

**What goes wrong:** After rotate, curve letterboxes or rocket sits wrong until a full reload.

**Why it happens:** Host size changed but something blocked ResizePlugin; or resolution baked once without refresh when moving across DPR.

**How to avoid:** Pattern 6 — `app.resize()` on orientation / visualViewport; scene already replots on screen change. Do not CSS-scale.

**Warning signs:** Soft blur after rotate; empty bands beside the canvas.

### Pitfall 6: Accidental GameLogic / settlement edits

**What goes wrong:** "Mobile cash-out feel" tempts changing spectator finish or wait timing.

**Why it happens:** Confusing chrome promotion with settlement.

**How to avoid:** Phase 4 is CSS + HUD class + resize harden only. `enablement.ts` and `resolveTick` stay as Phase 3 left them unless a genuine bug blocks touch QA.

**Warning signs:** Diffs under `src/games/crash/logic/` in a layout PR.

## Code Examples

### Fixed bar + leftover host (narrow)

```css
/* Discretion: apply locked budget on phone widths only */
@media (max-width: 720px) {
  .hud-bar {
    --hud-bar-height: 15.5rem;
    flex: 0 0 var(--hud-bar-height);
    height: var(--hud-bar-height);
    max-height: var(--hud-bar-height);
    overflow-x: hidden;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    grid-template-columns: 1fr;
  }

  .hud-zone--right {
    flex-direction: column;
    align-items: stretch;
  }
}
```

### Promote Cash out

```css
.hud-bar--promote-cashout [data-action="cash-out"] {
  display: block;
  width: 100%;
  min-height: 2.875rem; /* 46px within D-07 44–48 */
  font-weight: 600;
}

.hud-bar--promote-cashout [data-action="place-bet"],
.hud-bar--promote-cashout .chip,
.hud-bar--promote-cashout [data-field="bet-input"],
.hud-bar--promote-cashout [data-field="auto-co"] {
  min-height: 2rem;
  font-size: 0.8125rem;
}
```

### Hit isolation

```css
.canvas-host,
.canvas-host canvas {
  pointer-events: none;
}

.hud-bar button,
.hud-bar input,
.hud-bar .chip {
  touch-action: manipulation;
}
```

### Chrome mode toggle

```typescript
// CrashHud.render — alongside enablement
root.classList.toggle(
  "hud-bar--promote-cashout",
  snap.phase === "flying" || snap.phase === "cashed_out",
);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `resizeTo: window` with overlay math | `resizeTo: game host` + HTML chrome below | Pixi v8 + this project's Phase 3 | Host box is the layout contract; Phase 4 fixes the host's flex budget. |
| Uncapped `devicePixelRatio` | Cap at 2 + `autoDensity` | Phase 3 init | Thermal/GPU safety on phones; Phase 4 re-verifies. |
| Mouse-sized HUD | ≥44px targets + mid-flight primary CTA | Phase 4 (this research) | ARCH-03 touch usability. |
| Ignoring safe-area | `viewport-fit=cover` + `env(safe-area-inset-*)` | Phase 4 | Notch / home indicator clearance. |

**Deprecated/outdated for this phase:**

- CSS-scaling the canvas to "make it responsive."
- Duplicate cash-out control in Pixi.
- DEMO badge as a Phase 4 ship blocker (explicitly declined for this project).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `15.5rem` fixed bar fits stacked zones + 46px Cash out on common phones (~375×667) without making the canvas unusable; internal scroll covers overflow. | Pattern 1 | If critical controls clip, raise to `16.5–17rem` or tighten waiting-row gaps — do not switch to content-sized bar. |
| A2 | Applying the fixed height only inside `max-width: 720px` satisfies D-04 (portrait/landscape same) while leaving desktop auto-height usable. | Pattern 1 | If planner reads D-04 as global, apply the same token at all widths — canvas still gets leftover via flex. |
| A3 | DOM order chips→history already satisfies D-10 once the right zone is a column. | Pattern 2 | If visual order is wrong, set `flex-direction: column` on `.hud-zone--right` only under the mobile media query. |
| A4 | `pointer-events: none` on the host is safe because Phase 3 view has no interactive Pixi controls. | Pattern 4 | If a future phase adds canvas hits, scope `none` to monetary-era Phase 4 only or use a child overlay — out of scope now. |
| A5 | `visualViewport.resize` + `orientationchange` → `app.resize()` is enough; ResizePlugin alone may miss some iOS chrome show/hide cases. | Pattern 6 | If redundant, listeners are cheap; keep host `resizeTo`. |
| A6 | No new packages; Vitest covers only `chromeModeFrom` (optional); ARCH-03 gate is manual QA. | Validation | Acceptable: roadmap plan 04-03 is explicitly a QA pass. |

## Open Questions (RESOLVED)

### Q1: Exact `--hud-bar-height` on first paint
- **What we know:** D-02 requires fixed height; discretion owns the number; 15.5rem is a reasoned starting budget.
- **What's unclear:** Whether real devices with large accessibility text need a taller budget.
- **Recommendation:** Ship 15.5rem; plan 04-03 QA adjusts by ±1rem only. Do not reopen D-02.
- **RESOLVED:** `--hud-bar-height: 15.5rem` (discretionary first paint; 04-01/04-03 lock). Plan 04-03 QA may tune ±1rem only while keeping fixed height + internal scroll — do not reopen D-02 to content-sized bar.

### Q2: Desktop (≥721px) bar height
- **What we know:** D-04 is about portrait vs landscape sameness; D-14 breakpoint is 720px.
- **What's unclear:** Whether desktop should also lock height.
- **Recommendation:** Fixed height under 720px only (A2). Desktop keeps current auto chrome.
- **RESOLVED:** Fixed height applies under `max-width: 720px` only (A2 / 04-01). Desktop ≥721px keeps content-sized bar (`flex: 0 0 auto`); D-04 sameness is portrait vs landscape at narrow width, not phone vs desktop.

### RESOLVED from CONTEXT
- Stacked one-column (not thumb row) — D-01.
- Cash out stays promoted through `cashed_out` — D-08.
- No DEMO badge — PROJECT.md.
- No second Pixi resize architecture — carry-forward.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | tooling | ✓ | (local) | — |
| Vite | `npm run dev` for QA | ✓ | 6.4.3 | — |
| pixi.js | canvas resize | ✓ | 8.21.0 | — |
| Vitest | optional chromeMode test | ✓ | 3.2.7 | skip helper; CSS-only toggle in CrashHud |
| Browser DevTools device mode | 04-03 QA | ✓ | — | Required for phase gate |
| Physical phone (iOS/Android) | hit-conflict confidence | not assumed | — | DevTools touch + one borrowed device if available |

**Missing dependencies with no fallback:** none for implementation. Real-device QA is strongly preferred for success criterion 3 but DevTools touch emulation is the minimum for 04-03.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.7 (existing) |
| Config | `vitest.config.ts` node env |
| Quick run | `npx vitest run src/games/crash/hud/chromeMode.test.ts src/games/crash/hud/enablement.test.ts` |
| Full suite | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ARCH-03 | `chromeModeFrom("flying"\|"cashed_out") === "promote-cashout"`; waiting/idle → normal | unit | `npx vitest run src/games/crash/hud/chromeMode.test.ts` | ❌ Wave 0 (optional but recommended) |
| ARCH-03 | `cashed_out` still cannot place bet / cash out (regression) | unit | `npx vitest run src/games/crash/hud/enablement.test.ts` | ✅ |
| ARCH-03 | logic/shared still pixi-free; no accidental logic edits | unit | `npx vitest run tests/architecture.no-pixi.test.ts` | ✅ |
| ARCH-03 | Phone viewport: canvas fills leftover; bar fixed; controls reachable | manual | DevTools 375×667 + 390×844; scroll bar internally | manual — 04-03 |
| ARCH-03 | Touch: place bet, chips, auto CO, cash out mid-flight | manual | DevTools touch + preferably one real device | manual — 04-03 |
| ARCH-03 | Canvas does not steal taps; history readable / swipeable | manual | `elementFromPoint` / mash test; history swipe | manual — 04-03 |
| ARCH-03 | Rotate portrait↔landscape at ≤720px width: stacked, playable, no hit conflicts | manual | DevTools rotate | manual — 04-03 |

Manual-only justification: hit-testing, safe-area, and flex leftover pixels are not meaningful in Node Vitest. Do not add Playwright in this phase.

### Sampling Rate

- **Per task commit:** `npm test` (fast) after any TS touch; CSS-only commits still run full suite once before merge.
- **Per wave merge:** `npm test` + `npx tsc --noEmit`.
- **Phase gate:** Manual 04-03 checklist green against ROADMAP success criteria 1–3; `/gsd-verify-work` before ARCH-03 done.

### Wave 0 Gaps

- [ ] Optional `src/games/crash/hud/chromeMode.ts` + `chromeMode.test.ts` — phase→promote mapping (D-05/D-08)
- [ ] No new framework installs
- [ ] Manual QA script documented in plan 04-03 (devices/widths below)

### Suggested 04-03 QA matrix (discretion)

| Viewport | Notes |
|----------|-------|
| 375×667 (iPhone SE) | Primary portrait budget |
| 390×844 (iPhone 12/13) | Notch / safe-area |
| 360×800 (common Android) | Material density |
| 667×375 / 844×390 | Landscape at narrow **width** still stacked (D-14) — use width &lt;720 |
| 1280×800 | Desktop three-column regression |

Checks per viewport: canvas non-empty; HUD controls not clipped off-screen (scroll inside bar OK); place bet; mid-flight cash out once; history swipe; no canvas steal; after cash-out Cash out stays full-width disabled until crash.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | yes | Existing facade validation; HUD still uses `textContent` for history; no new `innerHTML`. |
| V6 Cryptography | no | — |

### Known Threat Patterns for mobile shell

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Canvas overlay captures taps → missed cash-out / mis-tap | Tampering / UX integrity | `pointer-events: none` on canvas; HTML-only monetary path |
| Accidental double place-bet from touch + click | Tampering | Single HTML listener; chips fill-only (unchanged); `touch-action: manipulation` |
| Layout change used to inject DOM | XSS | History remains `createElement` + `textContent` |
| Uncapped DPR heats device into unusable demo | Denial of service | Keep resolution cap 2 |

## Plan Mapping (for planner)

| Plan | Research focus | Primary files |
|------|----------------|---------------|
| **04-01** Responsive layout CSS — canvas + overlay stacking | Patterns 1–2, 4 (stacking/`pointer-events`); fixed bar; 720px stack; history below chips | `hud.css`, maybe `index.html` zone class tweaks only if order wrong |
| **04-02** Touch-sized controls, safe areas, DPR-capped resize hardening | Patterns 3–6; promote Cash out; tap targets; `viewport-fit`; orientation resize | `hud.css`, `index.html` meta, `CrashHud.ts`, optional `chromeMode.ts`, light `mountCrashView.ts` |
| **04-03** Mobile QA pass | Validation matrix; overlay hit conflicts; history readability | Checklist / VERIFICATION notes; no feature scope creep |

**MVP / tracer-first hint:** 04-01 should leave a phone-width layout where the canvas visibly owns leftover space and taps reach the bar (pointer-events). 04-02 then promotes Cash out + safe-area + resize harden. 04-03 only verifies.

## Sources

### Primary (HIGH confidence)

- `.planning/phases/04-mobile-harden/04-CONTEXT.md` — D-01..D-15 locks
- `.planning/REQUIREMENTS.md` — ARCH-03
- `.planning/ROADMAP.md` — Phase 4 success criteria + plans 04-01..04-03
- `.planning/research/PITFALLS.md` — Pitfalls 6–7 (resize/HiDPI, overlay hit conflicts), uncapped DPR, CSS-scale anti-pattern
- `.planning/research/ARCHITECTURE.md` — HTML HUD out of canvas hit-testing; shell resize to game region
- `.planning/research/SUMMARY.md` — Phase 4 delivers responsive CSS + touch targets
- `src/styles/hud.css` — current flex shell + 720px stack (content-sized bar)
- `index.html` — zone DOM order; viewport meta without `viewport-fit`
- `src/games/crash/view/mountCrashView.ts` — `resizeTo: host`, DPR cap 2
- `src/games/crash/view/CrashScene.ts` — `ensurePlot` on screen size change
- `src/games/crash/hud/CrashHud.ts` / `enablement.ts` — no promote class yet; enablement waiting\|flying only
- `src/games/crash/hud/historyStrip.ts` — display-only pills via `textContent`
- `.claude/.cursor/rules` — stack locks; no DEMO badge; GameLogic ≠ Pixi

### Secondary (MEDIUM confidence)

- Installed `pixijs-application` skill — ResizePlugin `resize` / `queueResize`; `resizeTo` element; `resolution` + `autoDensity`
- Apple / CSS `env(safe-area-inset-*)` + `viewport-fit=cover` practice (standard mobile web; not live-fetched this session)
- WCAG / common mobile target guidance ≥44×44 CSS px for primary controls (aligned with CONTEXT D-07)

### Tertiary (LOW confidence)

- Exact `15.5rem` budget (A1) — tune in QA, not a brand spec

## Metadata

**Research scope:**

- Core technology: CSS flex/grid shell, touch CSS, existing Pixi host resize
- Ecosystem: no new libraries
- Patterns: fixed chrome budget, promote Cash out, pointer-events isolation, safe-area, orientation harden
- Pitfalls: growing bar, canvas steal, promote collapse after cash-out, missing viewport-fit, stale resize

**Confidence breakdown:**

- Standard stack: HIGH — no new packages; versions verified from package.json
- Architecture: HIGH — gaps confirmed against live `hud.css` / `mountCrashView` / `CrashHud`
- Pitfalls: HIGH — project PITFALLS + CONTEXT locks
- Exact rem budget / QA device list: MEDIUM — discretionary, validated in 04-03

**Research date:** 2026-09-27
**Valid until:** 2026-10-27 (30 days; CSS/Pixi resize APIs stable)

---

*Phase: 04-mobile-harden*
*Research completed: 2026-09-27*
*Ready for planning: yes*
