# Phase 5: Polish - Pattern Map

**Mapped:** 2026-09-27
**Files analyzed:** 18
**Analogs found:** 18 / 18

## Status

Phases 1–4 shipped a playable seeded Crash loop: pure GameLogic (`waitRemainingMs`, history, cash-out), HTML three-zone HUD, Pixi theater ×, and a fixed phone bar budget. Phase 5 is **presentation + I/O polish** — not greenfield. Countdown reuses the theater live BitmapText slot; mute/Seed/stats extend the HUD binder; `?seed=` only changes the composition-root boot argument to existing `createGame({ seed })`.

**Consume, do not rewrite:** `src/games/crash/logic/**` (waiting cadence / settle / RNG stream already authoritative), `src/games/crash/hud/enablement.ts` (`canCashOut: flying && hasBet` — keyboard must call the same gate), `src/games/crash/hud/historyStrip.ts` (display-only pills; stats bind beside strip, do not fork history), `src/games/crash/view/TheaterText.ts` (BitmapText API — assign `.text`, no third node unless layout fights), `src/shared/rng/createRng.ts` (seeded PRNG done).

**Out of phase:** Howler / real WAV assets, DEMO badge, mid-session `?seed=` watch, share-URL copy, countdown tick SFX / GO flash, new game modes, Playwright.

| Authority | Use for |
|-----------|---------|
| `CrashScene` theater branch + `TheaterText` | Waiting countdown digits (D-01–D-04); idle gate vs dimmed crash × |
| `main.ts` + `createGame({ seed })` | Boot `parseBootSeed` → session RNG (D-10/D-12) |
| `CrashHud` + `enablementFrom` + `historyStrip` | Mute, Seed chip, avg/max, Space/Enter → `requestCashOut` |
| `05-RESEARCH.md` Patterns 1–6 | AudioPort edges, mute pref, session stats, keyboard guard, bar budget |

Match quality: `exact` = same file to modify; `role-match` = same role and data flow, different file; `partial` = same convention, different layer; `none` = establish from RESEARCH.

All analog paths below are present under `src/` / `tests/` / `index.html` (`git ls-files` + working tree).

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/games/crash/view/CrashScene.ts` | component | event-driven | `src/games/crash/view/CrashScene.ts` | exact |
| `src/games/crash/view/formatWaitCountdown.ts` | utility | transform | `src/games/crash/hud/format.ts` | role-match (OPTIONAL — may live next to scene) |
| `src/games/crash/view/TheaterText.ts` | component | event-driven | `src/games/crash/view/TheaterText.ts` | exact (KEEP — API unchanged) |
| `src/shared/audio/AudioPort.ts` | service | event-driven | `src/shared/rng/createRng.ts` (`Rng` port shape) | role-match |
| `src/shared/audio/createBeepAudioPort.ts` | service | event-driven | `src/shared/rng/createRng.ts` (factory behind port) | role-match |
| `src/shared/audio/mutePref.ts` | utility | transform | `src/shared/money/cents.ts` (pure shared helper) | role-match |
| `src/shared/audio/sfxEdges.ts` | utility | transform | `src/games/crash/hud/enablement.ts` (pure snap → flags) | role-match |
| `src/shared/audio/*.test.ts` | test | transform | `src/games/crash/hud/enablement.test.ts` | role-match |
| `src/shared/boot/parseBootSeed.ts` | utility | transform | `src/shared/money/cents.ts` | role-match |
| `src/shared/boot/parseBootSeed.test.ts` | test | transform | `src/games/crash/hud/historyStrip.test.ts` | role-match |
| `src/main.ts` | service | event-driven | `src/main.ts` | exact |
| `src/games/crash/hud/CrashHud.ts` | view | event-driven | `src/games/crash/hud/CrashHud.ts` | exact |
| `src/games/crash/hud/sessionStats.ts` | utility | transform | `src/games/crash/hud/historyStrip.ts` + `format.ts` | role-match |
| `src/games/crash/hud/sessionStats.test.ts` | test | transform | `src/games/crash/hud/historyStrip.test.ts` | role-match |
| `src/games/crash/hud/seedChip.ts` | view | event-driven | `src/games/crash/hud/historyStrip.ts` (DOM helper) | role-match (OPTIONAL) |
| `index.html` | view | batch | `index.html` | exact |
| `src/styles/hud.css` | view | batch | `src/styles/hud.css` | exact |
| `src/games/crash/hud/enablement.ts` | utility | transform | `src/games/crash/hud/enablement.ts` | exact (KEEP — keyboard gate) |
| `src/games/crash/logic/**` | model | transform | self | exact (KEEP — no polish edits) |
| `tests/architecture.no-pixi.test.ts` | test | batch | `tests/architecture.no-pixi.test.ts` | exact (extend if audio/boot land under `shared/`) |

## Pattern Assignments

### `src/games/crash/view/CrashScene.ts` (component, event-driven)

**Analog:** `src/games/crash/view/CrashScene.ts` lines 185–225 **[EXISTING]** + `viewMode.ts` idle/climb clock **[EXISTING]**

**Core pattern** — theater dual-read after viewMode reduce; idle currently shows dimmed last crash × (Phase 3 D-20):
```typescript
// Theater dual-read (D-13..D-16, D-20 idle dim last crash ×)
let liveText: string;
let liveTint: number;
let liveAlpha: number;

if (mode === "crash_hold" || mode === "crash_fade") {
  // … latched crash ×, CRASH_COLOR …
} else if (mode === "idle") {
  if (latchedCrashMult != null && Number.isFinite(latchedCrashMult)) {
    liveText = formatMult(latchedCrashMult);
    liveTint = VIEW_CONFIG.CRASH_COLOR;
    liveAlpha = VIEW_CONFIG.IDLE_CRASH_ALPHA;
  } else {
    liveText = "";
    liveTint = 0xffffff;
    liveAlpha = 0;
  }
} else {
  // climb
  liveText = formatMult(snapshot.multiplier);
  liveTint = theaterTintForMult(snapshot.multiplier);
  liveAlpha = 1;
}

theater.sync({ liveText, liveTint, liveAlpha, frozenText });
```

**Apply (from `05-RESEARCH.md` Pattern 1 / PLSH-01):**

1. **Waiting+idle gate** — countdown replaces dimmed last-crash × while waiting idle (D-01/D-03; avoids flash over crash hold):
   ```typescript
   const showCountdown =
     snapshot.phase === "waiting" && mode === "idle";
   ```
2. When `showCountdown`: `liveText = formatWaitCountdown(snapshot.waitRemainingMs)`, `liveTint = 0xffffff`, `liveAlpha = 1`. No `×` suffix (not a multiplier).
3. Climb / crash_hold / crash_fade branches stay as today — countdown clears the instant mode leaves idle into climb (D-03: no GO flash).
4. Do **not** read `waitRemainingMs` inside `reduceViewMode` (viewMode comment already bans it). Format only in scene sync.
5. Prefer reusing the existing live BitmapText node — do not add a third theater text node.

**Keep:** Flash / rocket / curve choreography; `theater.layout` on resize; frozen cash-out × path.

---

### `formatWaitCountdown` helper (utility, transform) — OPTIONAL file

**Analog:** `src/games/crash/hud/format.ts` **[EXISTING]**

**Core pattern:**
```typescript
export function formatMult(m: number): string {
  if (!Number.isFinite(m)) return "—";
  return `${m.toFixed(2)}×`;
}
```

**Apply [ESTABLISH from RESEARCH Pattern 1]:**
```typescript
export function formatWaitCountdown(waitRemainingMs: number): string {
  const ms = Math.max(0, waitRemainingMs);
  return (ms / 1000).toFixed(1); // "5.0" … "0.0"
}
```

Place beside scene (`view/formatWaitCountdown.ts`) or next to `format.ts` if shared with tests. Unit-test: `5000 → "5.0"`, `4900 → "4.9"`, clamp `≤0 → "0.0"`. Continuous tenths only — no integer steps (D-02).

---

### `src/games/crash/view/TheaterText.ts` (component) — KEEP

**Analog:** self lines 47–97 **[EXISTING]**

**Core pattern** — BitmapText for per-frame strings (Pixi text skill):
```typescript
const live = new BitmapText({
  text: "",
  style: { fontFamily: "Arial", fontSize: 64, fill: 0xffffff },
});
// …
live.text = args.liveText;
live.tint = args.liveTint;
live.alpha = args.liveAlpha;
```

**Apply:** No API change expected. Countdown inherits D-04 (same type scale/weight; white tint from scene). Do not switch waiting digits to `Text` / `HTMLText`.

---

### `src/shared/audio/AudioPort.ts` + `createBeepAudioPort.ts` (service, event-driven)

**Analog:** `src/shared/rng/createRng.ts` **[EXISTING]** — thin port + factory; no Pixi/DOM in shared consumers of the interface itself.

**Core pattern:**
```typescript
export interface Rng {
  next(): number;
}

export function createRng(seed: string): Rng {
  const prng = seedrandom(seed);
  return { next: () => prng() };
}
```

**Apply [ESTABLISH from RESEARCH Pattern 2 / PLSH-02]:**
```typescript
export type SfxEvent = "bet_lock" | "takeoff" | "cash_out" | "crash";

export interface AudioPort {
  play(event: SfxEvent): void;
  setMuted(muted: boolean): void;
  isMuted(): boolean;
  unlock(): void;
  dispose(): void;
}
```

`createBeepAudioPort({ muted })` — Web Audio `AudioContext` + short oscillators (~80–120ms), distinct pitches (e.g. bet 440 / takeoff 660 / cash_out 880 / crash 160). Muted → `play` no-op. **Do not install Howler** in Phase 5 (D-08 synthetic beeps; Howler deferred until real files).

**ARCH-02 note:** Adapter may touch browser `AudioContext` — keep under `shared/audio/` but ensure `tests/architecture.no-pixi.test.ts` DOM ban is satisfied (prefer no `document.`/`window.` in mutePref/sfxEdges; isolate browser APIs inside the adapter, or extend the architecture allowlist carefully if `window.AudioContext` is required). Prefer injecting `AudioContext` / storage for Node tests.

---

### `src/shared/audio/sfxEdges.ts` + `mutePref.ts` (utility, transform)

**Analog:** `src/games/crash/hud/enablement.ts` **[EXISTING]** — pure snapshot fields → decisions; Vitest with `snap(partial)`.

**Core pattern:**
```typescript
export function enablementFrom(snap: CrashSnapshot): HudEnablement {
  const waiting = snap.phase === "waiting";
  const flying = snap.phase === "flying";
  const hasBet = snap.bet != null;
  return {
    canCashOut: flying && hasBet,
    // …
  };
}
```

**Apply — SFX edges (RESEARCH Pattern 2):**
```typescript
export function sfxEventsFromTransition(
  prev: CrashSnapshot | null,
  next: CrashSnapshot,
): SfxEvent[] {
  if (!prev) return [];
  const out: SfxEvent[] = [];
  if (prev.phase === "waiting" && next.phase === "flying") out.push("takeoff");
  if (prev.cashOutAt == null && next.cashOutAt != null) out.push("cash_out");
  if (
    prev.phase !== "waiting" &&
    next.phase === "waiting" &&
    next.history.length > prev.history.length
  ) {
    out.push("crash");
  }
  return out;
}
```

`bet_lock` stays in Place bet click handler (`result.ok`) — not snapshot-diff. Wire edge detector in `main` ticker (composition root) so view stays dumb.

**Apply — mute pref:** key `crash-demo:mute` = `"1"|"0"`; load at boot, save on toggle. In-memory fallback if `localStorage` throws (private mode). Pure load/save helpers unit-testable with a mock store.

**Tests:** Mirror `enablement.test.ts` local `snap()` factory for edge cases; mute round-trip with fake storage.

---

### `src/shared/boot/parseBootSeed.ts` + test (utility/test, transform)

**Analog:** `src/shared/money/cents.ts` **[EXISTING]** — pure shared transform, no game imports.

**Core pattern:** small exported helpers with finite/clamp discipline at boundaries.

**Apply [ESTABLISH from RESEARCH Pattern 3 / PLSH-03]:**
```typescript
export const DEFAULT_DEMO_SEED = "portfolio-demo";

export function parseBootSeed(
  search: string,
  fallback = DEFAULT_DEMO_SEED,
): { seed: string; fromQuery: boolean; invalid: boolean } {
  const raw = new URLSearchParams(
    search.startsWith("?") ? search : `?${search}`,
  ).get("seed");
  if (raw == null || raw === "") {
    return { seed: fallback, fromQuery: false, invalid: false };
  }
  const trimmed = raw.trim();
  const invalid =
    trimmed.length === 0 ||
    trimmed.length > 128 ||
    /[\u0000-\u001F\u007F]/.test(trimmed);
  if (invalid) return { seed: fallback, fromQuery: true, invalid: true };
  return { seed: trimmed, fromQuery: true, invalid: false };
}
```

**Tests:** missing → fallback; empty → fallback; control chars / length >128 → invalid+fallback; valid `demo-a` → seed string. No `popstate` / mid-session reset (deferred).

---

### `src/main.ts` (service, event-driven)

**Analog:** `src/main.ts` lines 6–37 **[EXISTING]**

**Core pattern** — composition root: createGame → mount HUD → mount view → one ticker:
```typescript
const game = createGame({ seed: "portfolio-demo" });
const hud = mountCrashHud(hudRoot, game);
const { app, scene, dispose } = await mountCrashView(host as HTMLElement);

hud.render(game.getSnapshot());

const onTick = (ticker: { deltaMS: number }): void => {
  game.tick(ticker.deltaMS);
  const snap = game.getSnapshot();
  hud.render(snap);
  scene.sync(snap, ticker.deltaMS);
};
app.ticker.add(onTick);
```

**Apply:**

1. Replace hardcoded seed:
   ```typescript
   const { seed, invalid } = parseBootSeed(window.location.search);
   const game = createGame({ seed });
   ```
2. Create audio: `const audio = createBeepAudioPort({ muted: loadMutePref() })`.
3. Pass `{ seed, invalid, audio }` into `mountCrashHud` (or equivalent options bag). Retain seed at composition root for the chip — do **not** put URL parsing in `logic/`.
4. Edge-detect SFX in ticker:
   ```typescript
   let prev: CrashSnapshot | null = null;
   // after tick:
   for (const ev of sfxEventsFromTransition(prev, snap)) audio.play(ev);
   prev = snap;
   ```
5. HMR dispose: also `audio.dispose()` alongside ticker remove / view dispose.
6. Keep tick order: `tick` → (SFX edges) → HUD render → `scene.sync`. Do not invent a second clock.

---

### `src/games/crash/hud/CrashHud.ts` (view, event-driven)

**Analog:** `src/games/crash/hud/CrashHud.ts` lines 16–172 **[EXISTING]**

**Core pattern** — query `data-*` hooks, click → facade commands, render from snapshot only:
```typescript
placeBet.addEventListener("click", () => {
  const amount = Number(bet.value);
  const result = game.placeBet(amount);
  // …
});

cashOut.addEventListener("click", () => {
  game.requestCashOut();
});

function render(snap: CrashSnapshot): void {
  // …
  const en = enablementFrom(snap);
  cashOut.disabled = !en.canCashOut;
  renderHistoryStrip(history, snap.history);
  // …
}
```

**Apply (Patterns 2–5 / PLSH-02..05):**

1. **Mute toggle** — small control in bar; toggle → `audio.setMuted` + `saveMutePref`; call `audio.unlock()` on toggle / Place bet / Cash out click.
2. **`bet_lock` SFX** — on successful `placeBet` (`result.ok`), `audio.play("bet_lock")` + `unlock()`.
3. **Seed chip** — receive boot `seed` (and optional `invalid`) from mount options; collapsed label `Seed`; expand reveals string via `textContent` only; Copy → `navigator.clipboard.writeText(seed)`. Never `innerHTML`. Optional quiet `using default` when `invalid`.
4. **Session stats** — query `[data-field=session-stats]` / `stat-avg` / `stat-max`; in `render`, bind `sessionStatsFrom(snap.history)` (no parallel history array — WALT-05).
5. **Keyboard cash-out** — document/window `keydown`:
   ```typescript
   // Space + Enter; ignore editable targets; gate enablementFrom(lastSnap).canCashOut
   // preventDefault only when actually cashing out; call game.requestCashOut()
   ```
   Retain `lastSnap` from latest `render`. Same path as Cash out button (D-15).
6. Extend mount signature: `mountCrashHud(root, game, options?)` — keep thin binder; no wallet math.

**Keep:** Chip fill-only; promote via `chromeModeFrom`; broke emphasize; enablement matrix unchanged.

---

### `src/games/crash/hud/sessionStats.ts` + test (utility/test, transform)

**Analog:** `src/games/crash/hud/historyStrip.ts` + `format.ts` **[EXISTING]**

**Core pattern** — pure history ring helpers + `toFixed(2)×` display:
```typescript
export function orderNewestFirst(history: readonly number[]): number[] {
  return [...history].reverse();
}
// …
el.textContent = `${m.toFixed(2)}×`;
```

**Apply [ESTABLISH from RESEARCH Pattern 4 / PLSH-04]:**
```typescript
export function sessionStatsFrom(history: readonly number[]): SessionStats {
  if (history.length === 0) return { avgLabel: "—", maxLabel: "n/a" }; // D-16
  // sum / max over finite entries; format `${n.toFixed(2)}×`
}
```

**Tests:** empty → placeholders (never `0.00×`); `[1.5, 3, 12]` avg/max; skip non-finite. Bind only from `snapshot.history` in HUD render.

---

### `src/games/crash/hud/seedChip.ts` (view, event-driven) — OPTIONAL

**Analog:** `src/games/crash/hud/historyStrip.ts` **[EXISTING]** — small DOM helper with `createElement` + `textContent`.

**Apply:** Collapsible chip mount/bind if `CrashHud` grows too large. Otherwise inline in `CrashHud` is fine. XSS: `textContent` only (PITFALLS). Copy seed string, not share URL (D-11).

---

### `index.html` (view, batch)

**Analog:** `index.html` lines 19–65 **[EXISTING]**

**Core pattern** — three zones; history already in right zone:
```html
<footer id="hud-bar" class="hud-bar">
  <div class="hud-zone hud-zone--left" data-zone="balance">…</div>
  <div class="hud-zone hud-zone--center" data-zone="actions">…</div>
  <div class="hud-zone hud-zone--right" data-zone="chips-history">
    <div data-field="chips" class="chip-row" …></div>
    <div data-field="history" class="history-strip" …></div>
  </div>
</footer>
```

**Apply:**

1. Mute control host — left balance zone or trailing actions (compact text button `data-action="mute"`).
2. Seed chip host — right zone (collapsed by default), e.g. `data-field="seed-chip"`.
3. Session stats **above** history strip (D-14):
   ```html
   <div class="session-stats" data-field="session-stats" aria-label="Session stats">
     <span>Avg <span data-field="stat-avg">—</span></span>
     <span>Max <span data-field="stat-max">n/a</span></span>
   </div>
   ```
4. Do not reorder monetary controls. No DEMO badge. No canvas overlay countdown (D-01).

---

### `src/styles/hud.css` (view, batch)

**Analog:** `src/styles/hud.css` lines 49–126, 228–249 **[EXISTING]** — fixed bar budget + history strip.

**Core pattern:**
```css
@media (max-width: 720px) {
  .hud-bar {
    --hud-bar-height: 15.5rem;
    flex: 0 0 var(--hud-bar-height);
    height: var(--hud-bar-height);
    max-height: var(--hud-bar-height);
    overflow-y: auto;
  }
  .hud-zone--right {
    flex-direction: column;
    align-items: stretch;
  }
}

.history-strip {
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  /* …
}
```

**Apply (Pattern 6 / Phase 4 carry):**

1. Compact mute / Seed / stats — do **not** raise `--hud-bar-height` (15.5rem stays).
2. `.session-stats` thin row (~0.7–0.75rem) above `.history-strip`; tabular nums to match pills.
3. Seed chip collapsed width minimal; expanded still inside bar (internal scroll OK).
4. Mute: quiet text control, same touch-action / min-height conventions as other bar buttons where practical.
5. No card chrome, no purple glow, no canvas overlays.

---

### `src/games/crash/hud/enablement.ts` (utility) — KEEP

**Analog:** self **[EXISTING]**

**Core pattern:**
```typescript
canCashOut: flying && hasBet,
```

**Apply:** No Phase 5 matrix edits. Keyboard shortcuts **must** use `enablementFrom(lastSnap).canCashOut` (RESEARCH Q3 / D-15 discretion locked). Regression: existing `enablement.test.ts` `cashed_out` / spectator cases stay green.

---

### `src/games/crash/logic/**` (model) — KEEP

**Analog:** `CrashGame.ts` / `resolveTick.ts` / `RoundState.ts` **[EXISTING]**

**Core pattern already shipping:**
- `createGame({ seed })` → `createRng(options.seed)`
- Snapshot exposes `waitRemainingMs`, `history`, `cashOutAt`, `phase`
- Waiting auto-launch via `waitDurationMs: 5_000`

**Apply:** No polish edits to settle / cadence / wallet. Seed string for the chip stays at composition root (optional thin `getSeed()` only if tests demand — prefer root retention per RESEARCH A4).

---

### `tests/architecture.no-pixi.test.ts` (test, batch)

**Analog:** self lines 5–83 **[EXISTING]**

**Core pattern** — `src/shared` + `logic` scanned for `pixi.js` and `document.`/`window.`:
```typescript
const LOGIC_DIRS = [
  join(ROOT, "src", "games", "crash", "logic"),
  join(ROOT, "src", "shared"),
];
const DOM_API = /\b(?:document|window)\s*\./;
```

**Apply:** Keep audio/boot pure helpers free of Pixi. If `createBeepAudioPort` must reference `window.AudioContext`, either:
- inject the context from `main.ts` (preferred — shared stays constructible in Node), or
- narrowly adjust the architecture scan for that one adapter file with an explicit allow comment — prefer injection so the existing ban stays intact.

Also ensure Seed chip / theater paths never introduce `.innerHTML` (existing theater scan is a model).

---

## Anti-Pattern Watchlist (from RESEARCH)

| Do not | Why | Use instead |
|--------|-----|-------------|
| Countdown in HUD bar / HTML overlay | Breaks D-01 | Theater BitmapText + waiting+idle gate |
| Integer-only countdown / GO flash | Breaks D-02/D-03 | `(ms/1000).toFixed(1)`; clear on climb |
| Countdown tick SFX | Breaks D-05 | Four events only |
| Howler install without assets | Weight for no benefit | Oscillator `AudioPort` |
| Audio / URL parse in `logic/` | ARCH-02 | `shared/audio`, `shared/boot`, HUD, `main` |
| `innerHTML` for seed | XSS (PITFALLS) | `textContent` |
| Share-URL copy / mid-session seed reset | Deferred / D-11 | Seed string copy; boot-only |
| `0.00×` empty avg/max | Breaks D-16 | `—` / `n/a` |
| Keyboard cash-out while typing / ungated | Breaks D-15 | `isEditableTarget` + `canCashOut` |
| Raise `--hud-bar-height` for chrome | Phase 4 regression | Compact controls + bar scroll |
| Parallel history array in HUD | WALT-05 | `snapshot.history` only |
| `new Text` each frame for countdown | Perf / skill | Existing live `BitmapText.text =` |

## Plan → File Map

| Plan | Primary files | Pattern focus |
|------|---------------|---------------|
| **05-01** Waiting countdown | `CrashScene.ts`, optional `formatWaitCountdown`, keep `TheaterText.ts` | Pattern 1; idle gate; tenths |
| **05-02** AudioPort + mute | `shared/audio/*`, `CrashHud.ts`, `index.html`, `hud.css`, `main.ts` | Pattern 2; edges; unlock; mute pref |
| **05-03** `?seed=` + Seed chip | `parseBootSeed.ts`, `main.ts`, `CrashHud.ts` / optional `seedChip.ts`, `index.html`, `hud.css` | Pattern 3; textContent copy |
| **05-04** Session stats + keyboard CO | `sessionStats.ts`, `CrashHud.ts`, `index.html`, `hud.css`, keep `enablement.ts` | Patterns 4–5; focus guard |

**MVP / tracer hint:** 05-01 makes waiting tenths visible end-to-end first. 05-02 adds bet/takeoff beeps on the same loop. 05-03 unlocks shareable boot. 05-04 finishes soft stats + Space/Enter (can parallelize with 05-03 once HUD mount points exist).

---

*Phase: 05-polish*
*Pattern mapping completed: 2026-09-27*
*Ready for planning: yes*
