# Phase 4: Mobile Harden - Pattern Map

**Mapped:** 2026-09-27
**Files analyzed:** 12
**Analogs found:** 12 / 12

## Status

Phases 2–3 shipped the hybrid shell: HTML three-zone HUD, Pixi `resizeTo: host` + DPR cap 2, and durable `cashed_out`. Phase 4 is **not** greenfield — it retunes the existing chrome budget and touch affordances. Every deliverable file already has a same-path or same-role analog under `src/styles/`, `index.html`, `hud/`, or `view/`.

**Consume, do not rewrite:** `src/games/crash/hud/enablement.ts` (cash-out still `flying && hasBet` — promotion is a CSS class, not enablement), `src/games/crash/hud/historyStrip.ts` (display-only pills; no tap handlers), `src/games/crash/logic/**` (no layout/settlement edits), `src/games/crash/view/CrashScene.ts` `ensurePlot` (already replots on `app.screen` change — do not duplicate resize math), `src/main.ts` ticker order (`tick` → HUD → `scene.sync`).

**Out of phase:** countdown / SFX / `?seed=` / keyboard (Phase 5), landscape-first chrome redesign, DEMO badge UI, Playwright, new npm packages, second Pixi resize path (`resizeTo: window`).

| Authority | Use for |
|-----------|---------|
| Existing `hud.css` + `index.html` zones | Flex shell, 720px stack, chips→history DOM order |
| `CrashHud.render` + `enablementFrom` | Phase-driven class toggle alongside disabled flags |
| `mountCrashView` init | Keep `resizeTo: host` + capped `resolution`; harden listeners only |
| `04-RESEARCH.md` Patterns 1–6 | Fixed bar tokens, promote CSS, pointer-events, safe-area, orientation refresh |

Match quality: `exact` = same file to modify; `role-match` = same role and data flow, different file; `partial` = same convention, different layer; `none` = establish from RESEARCH.

All analog paths below are git-tracked (`git ls-files`).

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/styles/hud.css` | view | batch | `src/styles/hud.css` | exact |
| `index.html` | view | batch | `index.html` | exact |
| `src/games/crash/hud/CrashHud.ts` | view | event-driven | `src/games/crash/hud/CrashHud.ts` | exact |
| `src/games/crash/view/mountCrashView.ts` | service | event-driven | `src/games/crash/view/mountCrashView.ts` | exact |
| `src/games/crash/hud/chromeMode.ts` | utility | transform | `src/games/crash/hud/enablement.ts` | role-match (OPTIONAL) |
| `src/games/crash/hud/chromeMode.test.ts` | test | transform | `src/games/crash/hud/enablement.test.ts` | role-match (OPTIONAL) |
| `src/games/crash/hud/enablement.ts` | utility | transform | `src/games/crash/hud/enablement.ts` | exact (KEEP — no change) |
| `src/games/crash/hud/historyStrip.ts` | view | transform | `src/games/crash/hud/historyStrip.ts` | exact (KEEP — no change) |
| `src/main.ts` | service | event-driven | `src/main.ts` | exact (KEEP — HMR dispose may absorb mount cleanup only if listeners leave mount) |
| `src/games/crash/view/CrashScene.ts` | component | event-driven | `src/games/crash/view/CrashScene.ts` | exact (KEEP — `ensurePlot` already handles size) |
| `tests/architecture.no-pixi.test.ts` | test | batch | `tests/architecture.no-pixi.test.ts` | exact (KEEP — regression gate) |
| Manual QA checklist (plan 04-03) | docs | batch | `04-RESEARCH.md` Validation matrix | partial (no prior QA file) |

## Pattern Assignments

### `src/styles/hud.css` (view, batch)

**Analog:** `src/styles/hud.css` lines 16–56, 180–208 **[EXISTING]**

**Core pattern** — column shell + content-sized bar + 720px stack:
```css
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: 100dvh;
}

.canvas-host {
  flex: 1 1 auto;
  display: block;
  position: relative;
  overflow: hidden;
  min-height: 0;
  background: #1a222c;
}

.hud-bar {
  flex: 0 0 auto;
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  gap: 0.75rem;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #121820;
  border-top: 1px solid #2a3542;
}

@media (max-width: 720px) {
  .hud-bar {
    grid-template-columns: 1fr;
  }

  .hud-zone--left,
  .hud-zone--center,
  .hud-zone--right {
    justify-content: center;
  }
}
```

**Apply (from `04-RESEARCH.md` Patterns 1–2, 4–5):**

1. **Fixed chrome budget on narrow only** — inside `@media (max-width: 720px)` lock `.hud-bar` to `--hud-bar-height: 15.5rem` with `flex: 0 0 var(--hud-bar-height); height/max-height: var(--hud-bar-height); overflow-x: hidden; overflow-y: auto; -webkit-overflow-scrolling: touch`. Keep breakpoint at 720px (D-14). Desktop may stay `flex: 0 0 auto`.
2. **Leftover canvas** — keep `.canvas-host { flex: 1 1 auto; min-height: 0 }`. Do not CSS-scale the canvas.
3. **History below chips** — under the same media query, `.hud-zone--right { flex-direction: column; align-items: stretch }` so DOM order chips→history stacks (D-10). Optional: `.history-strip { touch-action: pan-x }`.
4. **Hit isolation** — `.canvas-host, .canvas-host canvas { pointer-events: none }`; `.hud-bar { position: relative; z-index: 1 }`.
5. **Touch targets** — waiting defaults: `.hud-bar button, .hud-bar input, .hud-bar .chip { touch-action: manipulation; min-height: 2.75rem }` (44px). Chips also need usable `min-width` (≥44px on phone).
6. **Safe-area** — pad the bar (not the host):
   ```css
   .hud-bar {
     padding-left: max(1rem, env(safe-area-inset-left));
     padding-right: max(1rem, env(safe-area-inset-right));
     padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
   }
   ```
7. **Promote Cash out** — class on root (toggled from HUD):
   ```css
   .hud-bar--promote-cashout [data-action="cash-out"] {
     display: block;
     width: 100%;
     min-height: 2.875rem; /* 46px within D-07 */
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
   Do **not** key promote off `:disabled` or hide bet/chips (D-06/D-08).

**Keep:** `.history-strip` horizontal overflow + `0.75rem` pills (D-09/D-11). Same 720px width-only switch — no `@media (orientation: landscape)` chrome redesign (D-13/D-14).

---

### `index.html` (view, batch)

**Analog:** `index.html` lines 1–64 **[EXISTING]**

**Core pattern** — viewport + zone DOM order (balance → actions → chips → history):
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
...
<div id="game-canvas-host" class="canvas-host" aria-label="Game view">...</div>
<footer id="hud-bar" class="hud-bar">
  <div class="hud-zone hud-zone--left" data-zone="balance">...</div>
  <div class="hud-zone hud-zone--center" data-zone="actions">
    ...
    <button type="button" data-action="place-bet">Place bet</button>
    <button type="button" data-action="cash-out">Cash out</button>
    ...
  </div>
  <div class="hud-zone hud-zone--right" data-zone="chips-history">
    <div data-field="chips" class="chip-row" ...></div>
    <div data-field="history" class="history-strip" ...></div>
  </div>
</footer>
```

**Apply:**

1. Change viewport to `width=device-width, initial-scale=1.0, viewport-fit=cover` so `env(safe-area-inset-*)` is non-zero on notched iOS (D-15 / Pattern 5).
2. **Do not reorder zones** — chips already precede history in the right zone (D-10). No new monetary controls. No DEMO badge.
3. Keep `data-action="cash-out"` / `data-action="place-bet"` / `data-field` hooks — promote CSS targets these attributes.

---

### `src/games/crash/hud/CrashHud.ts` (view, event-driven)

**Analog:** `src/games/crash/hud/CrashHud.ts` lines 135–164 **[EXISTING]**

**Core pattern** — snapshot → enablement → classList toggles (broke / Reset emphasize):
```typescript
function render(snap: CrashSnapshot): void {
  // ... field text + enablement ...
  const en = enablementFrom(snap);
  placeBet.disabled = !en.canPlaceBet;
  cashOut.disabled = !en.canCashOut;
  // ...
  renderHistoryStrip(history, snap.history);

  const emphasizeBroke = en.showBroke || lastPlaceReason === "broke";
  balanceZone.classList.toggle("hud-zone--broke", emphasizeBroke);
  reset.classList.toggle("reset-demo--emphasize", emphasizeBroke);
  // ...
}
```

**Apply:** Alongside enablement, toggle promote chrome from **phase**, not from `canCashOut`:

```typescript
root.classList.toggle(
  "hud-bar--promote-cashout",
  snap.phase === "flying" || snap.phase === "cashed_out",
);
// Prefer: chromeModeFrom(snap.phase) === "promote-cashout" if helper lands
```

**Keep unchanged:** `game.requestCashOut()` on click; chips fill-only; history via `renderHistoryStrip`; enablement matrix. Do not shrink promote when Cash out becomes disabled after personal cash-out (D-08).

---

### `src/games/crash/hud/chromeMode.ts` + `chromeMode.test.ts` (utility/test, transform) — OPTIONAL

**Analog:** `src/games/crash/hud/enablement.ts` + `enablement.test.ts` **[EXISTING]** — pure snapshot/phase → flags, Vitest snap helper.

**Core pattern** (`enablement.ts`):
```typescript
export function enablementFrom(snap: CrashSnapshot): HudEnablement {
  const waiting = snap.phase === "waiting";
  const flying = snap.phase === "flying";
  // ...
  return {
    canCashOut: flying && hasBet,
    // ...
  };
}
```

**Test pattern** (`enablement.test.ts`) — local `snap(partial)` factory + phase cases including durable `cashed_out`:
```typescript
it("cashed_out with a bet → canPlaceBet false and canCashOut false", () => {
  const en = enablementFrom(
    snap({ phase: "cashed_out", bet: 100, cashOutAt: 1.8, multiplier: 2.5 }),
  );
  expect(en.canCashOut).toBe(false);
});
```

**Apply [ESTABLISH from RESEARCH Pattern 3]** — separate chrome mode from enablement:

```typescript
export type HudChromeMode = "normal" | "promote-cashout";

export function chromeModeFrom(phase: CrashSnapshot["phase"]): HudChromeMode {
  return phase === "flying" || phase === "cashed_out"
    ? "promote-cashout"
    : "normal";
}
```

**Tests:** `flying` / `cashed_out` → `"promote-cashout"`; `waiting` / `idle` / `crashed` → `"normal"`. Reuse the same `snap()` / phase-table style as `enablement.test.ts`. Do **not** fold promote into `enablementFrom` (would couple D-08 layout to `canCashOut`).

**Skip path:** Inline the phase check in `CrashHud.render` if Wave 0 helper is deferred — CSS class contract stays the same.

---

### `src/games/crash/view/mountCrashView.ts` (service, event-driven)

**Analog:** `src/games/crash/view/mountCrashView.ts` lines 14–31 **[EXISTING]** + `src/main.ts` HMR dispose **[EXISTING]**

**Core pattern** — host resize, capped DPR, single `app.resize()` after canvas insert:
```typescript
await app.init({
  resizeTo: host,
  background: VIEW_CONFIG.BACKGROUND,
  antialias: true,
  autoDensity: true,
  resolution: Math.min(window.devicePixelRatio || 1, 2),
  preference: "webgl",
  autoStart: true,
  sharedTicker: false,
});
host.replaceChildren(app.canvas);
app.resize();
const scene = createCrashScene(app);
return { app, scene };
```

**Scene already replots** (`CrashScene.ts` `ensurePlot`):
```typescript
function ensurePlot(): void {
  const w = app.screen.width;
  const h = app.screen.height;
  if (w !== lastW || h !== lastH) {
    lastW = w;
    lastH = h;
    plot = buildPlot(w, h);
    // ... theater / backdrop / flash ...
  }
}
```

**Apply (Pattern 6 — minimal harden):** After mount, register:

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

Clean up listeners on dispose (extend `main.ts` HMR `dispose` or return a `dispose` from `mountCrashView`). **Do not** set `resizeTo: window`. Cap stays 2. No CSS `transform: scale` on the canvas.

---

### `src/games/crash/hud/enablement.ts` (utility, transform) — KEEP

**Analog:** self **[EXISTING]**

**Core pattern:**
```typescript
canCashOut: flying && hasBet,
```

**Apply:** No Phase 4 edits. Promote chrome must not change this matrix. Regression: `enablement.test.ts` `cashed_out` case already asserts cash-out stays off.

---

### `src/games/crash/hud/historyStrip.ts` (view, transform) — KEEP

**Analog:** self lines 22–34 **[EXISTING]**

**Core pattern** — display-only, no click handlers:
```typescript
export function renderHistoryStrip(
  host: Element,
  history: readonly number[],
): void {
  host.replaceChildren();
  for (const m of orderNewestFirst(history)) {
    const el = document.createElement("span");
    el.setAttribute("role", "listitem");
    el.className = historyClass(m);
    el.textContent = `${m.toFixed(2)}×`;
    host.appendChild(el);
  }
}
```

**Apply:** No tap/select (D-12). CSS keeps horizontal scroll + compact `0.75rem` pills. Optional `touch-action: pan-x` lives in `hud.css`, not here.

---

### `src/main.ts` (service, event-driven) — KEEP (dispose only if needed)

**Analog:** self lines 6–35 **[EXISTING]**

**Core pattern** — query host + HUD, mount view, one ticker, HMR destroy:
```typescript
const { app, scene } = await mountCrashView(host as HTMLElement);
// ...
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    app.ticker.remove(onTick);
    app.destroy(
      { removeView: true, releaseGlobalResources: true },
      { children: true },
    );
  });
}
```

**Apply:** Prefer attaching orientation/`visualViewport` cleanup inside `mountCrashView` return value; only touch `main.ts` if dispose must live at the composition root. Do not change tick order or invent a second clock.

---

### Manual QA checklist (plan 04-03) (docs, batch)

**Analog:** `04-RESEARCH.md` § Validation Architecture / Suggested 04-03 QA matrix **[RESEARCH]** — no prior `*-QA.md` in `.planning/`.

**Apply:** Document (in plan 04-03 or VERIFICATION notes), not a runtime module:

| Viewport | Notes |
|----------|-------|
| 375×667 | Primary portrait budget |
| 390×844 | Notch / safe-area |
| 360×800 | Android density |
| 667×375 / 844×390 | Landscape at width &lt;720 still stacked |
| 1280×800 | Desktop three-column regression |

Per viewport: canvas fills leftover; bar fixed (internal scroll OK); place bet / chips / auto CO / mid-flight cash out; Cash out stays full-width disabled through `cashed_out`; history swipe; canvas does not steal taps (`elementFromPoint` / mash test). No Playwright this phase.

---

## Anti-Pattern Watchlist (from RESEARCH)

| Do not | Why | Use instead |
|--------|-----|-------------|
| Content-sized `.hud-bar` on phone | Steals curve (D-02) | Fixed `--hud-bar-height` + `overflow-y: auto` |
| Promote via `:disabled` / `canCashOut` | Shrinks after cash-out (D-08) | `flying \|\| cashed_out` class |
| Hide bet/chips mid-flight | Breaks D-06 | Smaller but visible |
| `resizeTo: window` / CSS-scale canvas | Ignores chrome; blur | Host `resizeTo` + `app.resize()` |
| Uncapped DPR | Thermal trap | Cap 2 |
| Pixi monetary hit areas | Overlay conflicts | HTML controls + `pointer-events: none` on canvas |
| GameLogic / `shared/` DOM imports | Wrong tier | CSS + CrashHud only |
| Landscape-specific chrome sheet | Violates D-13/D-14 | Width-only 720px stack |

## Plan → File Map

| Plan | Primary files | Pattern focus |
|------|---------------|---------------|
| **04-01** Responsive layout | `hud.css` (Patterns 1–2, 4 stacking) | Fixed bar, leftover host, 720px stack, pointer-events |
| **04-02** Touch + safe-area + resize | `hud.css`, `index.html`, `CrashHud.ts`, optional `chromeMode.*`, `mountCrashView.ts` | Promote, tap targets, viewport-fit, orientation refresh |
| **04-03** Mobile QA | Checklist only | Validation matrix; no feature scope |

---

*Phase: 04-mobile-harden*
*Pattern mapping completed: 2026-09-27*
*Ready for planning: yes*
