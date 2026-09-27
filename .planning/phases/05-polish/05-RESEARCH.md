# Phase 5: Polish - Research

**Researched:** 2026-09-27
**Domain:** Waiting countdown theater UX, AudioPort SFX + mute, `?seed=` session bootstrap + seed chip, soft session stats, desktop keyboard cash-out (PLSH-01..05)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Countdown placement & read
- **D-01:** Waiting countdown lives in the **canvas theater** (upper game region), not the HUD bar. — **Reversibility:** costly
- **D-02:** Countdown reads as **continuous tenths**: `5.0 → 4.9 → 4.8 …` driven by `waitRemainingMs`, not whole-second steps.
- **D-03:** Show countdown in **waiting only**; clear the instant flight starts (do not keep it through crash hold or add a GO flash).
- **D-04:** Digit **style matches the theater ×** (same type scale/weight; white while waiting).

#### SFX events & mute UX
- **D-05:** SFX placeholders for the **core four** events: bet lock, takeoff/launch, cash-out, crash (no countdown tick SFX).
- **D-06:** **Mute toggle lives in HUD chrome** (small control in the bottom bar).
- **D-07:** Mute preference **persists in `localStorage`** across reloads.
- **D-08:** Placeholders are **short synthetic beeps** with distinct pitches per event, behind an `AudioPort` (swap real files later).

#### Seed URL & on-screen display
- **D-09:** On-screen seed is a **collapsible “Seed” chip** in HUD chrome (not always-visible full string, not canvas).
- **D-10:** `?seed=` performs a **full session bootstrap** — `createGame({ seed })` from that seed at load (wallet + RNG stream from that seed). — **Reversibility:** costly
- **D-11:** Seed chip **reveals the seed string and one-click copies** it to the clipboard (not a share-URL copy helper in v1).
- **D-12:** Missing or invalid `?seed=` falls back to the fixed demo default **`"portfolio-demo"`** (same as today’s `main.ts`).

#### Session stats & keyboard cash-out
- **D-13:** Soft session stats are **average crash ×** and **max crash ×** derived from the history ring (`snapshot.history`).
- **D-14:** Stats live **near the history strip** (beside or above the history pills in chrome).
- **D-15:** Desktop cash-out shortcuts are **Space and Enter**, both ignored while the bet field, auto cash-out field, or any text input is focused. — **Reversibility:** costly
- **D-16:** When history is empty, avg/max show **placeholders** (`—` / `n/a`), not zeros and not a hidden row.

### Carried forward (do not reopen)
- Continuous 5s waiting / auto-launch / spectator (Phase 1 D-13–D-15); `waitDurationMs: 5_000`; snapshot already exposes `waitRemainingMs`.
- Theater × upper-third BitmapText pattern (Phase 3 D-13–D-16); Phase 3 D-17 deferred countdown digits to Phase 5.
- Fixed HUD bar budget on ≤720px (`--hud-bar-height: 15.5rem`, internal scroll) — mute / Seed chip / stats must fit without stealing canvas (Phase 4 D-02).
- History display-only pills via `createElement` + `textContent` (Phase 2/4); enablement `canCashOut: flying && hasBet`.
- GameLogic pure — no Pixi/DOM in `logic/` or `shared/` (ARCH-02).
- No DEMO badge UI; no real audio art pipeline beyond synthetic beeps; no mid-session URL seed watch; no share-URL copy in v1 (CONTEXT deferred).

### Claude's Discretion (researcher resolves below)
- Exact theater countdown typography within D-04 (matching theater × family).
- Exact HUD placement of mute control and Seed chip within the fixed bar budget.
- Howler vs Web Audio vs oscillator for synthetic beeps — keep behind `AudioPort`; STACK.md suggests Howler when adding audio.
- Whether invalid `?seed=` silently falls back or briefly notes fallback in the Seed chip UI.
- Exact avg/max label copy and formatting (2dp × to match `formatMult`).
- Whether Space/Enter also require `phase === "flying"` with an active cashable bet (should follow existing `enablementFrom` / cash-out rules).

### Deferred Ideas (OUT OF SCOPE)
- Copy shareable `?seed=` absolute URL from the chip
- Real SFX asset files / art pipeline
- Countdown tick SFX / GO flash / crash-hold countdown
- Mid-session `?seed=` watching / hard-reset on URL change
- DEMO badge UI; multiplayer; new game modes
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PLSH-01 | Player sees a waiting-phase countdown before the next flight | Drive live theater BitmapText from `phase === "waiting"` + `waitRemainingMs` as continuous tenths (`(ms/1000).toFixed(1)`); clear on climb (D-01–D-04). Replaces dimmed last-crash × in the waiting/idle theater slot for the wait window. Success: digits visibly count down before takeoff. |
| PLSH-02 | Game plays SFX placeholders for key events with a mute toggle | `AudioPort` + four distinct synthetic beeps; edge-detect bet lock / takeoff / cash-out / crash; HUD mute + `localStorage` (D-05–D-08). Unlock AudioContext on first user gesture. Success: events audible when unmuted; mute stops and persists. |
| PLSH-03 | Player can reproduce a round via `?seed=` and/or on-screen seed display | Parse `URLSearchParams` → boot `createGame({ seed })`; fallback `"portfolio-demo"`; collapsible Seed chip reveals + copies seed string via `textContent` / Clipboard API (D-09–D-12). Success: same seed → same RNG stream from boot; seed readable/copyable. |
| PLSH-04 | Soft session stats derived from history (avg / max crash) | Pure `sessionStatsFrom(history)` → avg + max; place near history strip; empty → `—` / `n/a` (D-13–D-14, D-16). Success: stats update as history grows; empty state never shows `0.00×`. |
| PLSH-05 | Player can cash out via a keyboard shortcut on desktop | `keydown` Space + Enter → same `requestCashOut()` path as the button; ignore when editable focused; gate with `enablementFrom(...).canCashOut` (D-15). Success: mid-flight cash-out without mouse when focus is not in an input. |
</phase_requirements>

## Project Constraints (from `.claude/.cursor/rules`)

Actionable directives from project rules read this session:

- Stack lock: PixiJS v8 + TypeScript + Vite. No new renderer or SPA framework.
- No React / Angular in v1. HTML + thin TS binders remain the HUD path.
- Client-side only. No backend.
- GameLogic stays pure TypeScript. Audio, URL parse, keyboard, and DOM seed UI stay outside `logic/` / must not import Pixi into `shared/`.
- Monetary controls stay HTML; Pixi remains spectacle-only (countdown digits are spectacle, not controls).
- No DEMO badge UI (PROJECT.md / CONTEXT).
- Seeded demo RNG — never claim provably fair crypto; seed UI uses `textContent` (PITFALLS XSS).
- Vitest on Node remains the automated gate; audio unlock / mute persistence / keyboard QA are browser-manual or thin pure-helper unit tests.
- Keep phases small and shippable.
- Pixi text skill: per-frame countdown/timer strings belong on **BitmapText** (already used by `TheaterText`) — do not switch waiting digits to `Text` (expensive per-frame upload).

## Summary

Phase 5 is **presentation + I/O polish** on an already-complete playable loop. GameLogic already owns waiting cadence (`waitRemainingMs`), seeded RNG (`createGame({ seed })`), history ring, and cash-out enablement. What is missing is: (1) theater countdown digits during waiting, (2) an `AudioPort` with four beeps + mute, (3) boot-time `?seed=` parse + HUD Seed chip, (4) avg/max from history + Space/Enter cash-out with focus guard.

**Primary recommendation:** Keep GameLogic almost untouched. Wire countdown inside `CrashScene` theater sync when `snapshot.phase === "waiting"`. Add `src/shared/audio/AudioPort.ts` with a Web Audio oscillator adapter (zero new deps for synthetic beeps; Howler later when real files exist). Parse seed in a pure `parseBootSeed` helper at `main.ts` boot. Extend HUD with mute, Seed chip, session stats, and a document-level keydown handler that calls the same `game.requestCashOut()` as the Cash out button when `enablementFrom(snap).canCashOut`.

**Walking skeleton (MVP):** Open `/?seed=demo-a` → Seed chip shows `demo-a` → waiting theater shows `5.0…4.9…` → place bet (bet beep) → launch (takeoff beep) → Space cashes out (cash-out beep) → crash (crash beep) → avg/max update near history → mute persists across reload.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Waiting timer / `waitRemainingMs` | GameLogic (unchanged) | View formats tenths | Cadence already authoritative; countdown is presentation. |
| Theater countdown digits | Pixi view (`CrashScene` / `TheaterText`) | — | D-01/D-04; BitmapText matches live ×. |
| Dimmed last-crash × during wait | View (displaced) | — | Phase 5 waiting slot shows countdown; resume dimmed crash only if needed after countdown cleared — see Pattern 1. |
| Four SFX + mute | `AudioPort` (shared) + HUD mute + composition edge-detect | — | Outside GameLogic; mute is chrome. |
| `?seed=` bootstrap | `main.ts` + pure parse helper | `createGame({ seed })` | D-10 boot-only; RNG already seeded. |
| Seed chip reveal/copy | HTML HUD | Clipboard API | D-09/D-11; `textContent` only. |
| Avg / max stats | Pure HUD helper from `snapshot.history` | DOM near strip | D-13/D-14/D-16; no parallel store. |
| Keyboard cash-out | HUD `keydown` | `enablementFrom` + `requestCashOut` | D-15; same path as button. |
| Round FSM / wallet / settle | GameLogic (unchanged) | — | ARCH-02; polish must not reopen settlement. |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Existing Pixi `BitmapText` via `TheaterText` | pixi.js 8.21.0 | Waiting countdown digits (per-frame string updates) | Already mounted; skill: BitmapText for timers. `[VERIFIED: package.json / TheaterText.ts]` |
| Existing `createGame({ seed })` + `seedrandom` | seedrandom ^3.0.5 | Session RNG from boot seed | ARCH-01 already shipped; Phase 5 only changes boot source. `[VERIFIED]` |
| Existing HUD / `enablementFrom` / `historyStrip` | — | Mute, Seed chip, stats mount; cash-out gate | Thin binder pattern from Phase 2/4. |
| Existing Vitest | 3.2.7 | Pure helpers: seed parse, session stats, audio mute preference, SFX edge detector | Node-safe; no canvas/audio required. `[VERIFIED]` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **Web Audio API** (`AudioContext` + `OscillatorNode`) | browser built-in | Synthetic beeps behind `AudioPort` | **Recommended for Phase 5** — matches D-08 “synthetic beeps”, zero npm deps, easy pitch-per-event. |
| Howler (`howler`) | 2.2.4 (registry) | File-based SFX later | **Defer** until real WAV/MP3 assets exist. Keep `AudioPort` so a Howler adapter can drop in. `@types/howler` 2.2.13 available if/when added. `[VERIFIED: npm view]` |
| `localStorage` | browser | Mute persistence (D-07) | Always for mute preference. |
| `navigator.clipboard.writeText` | browser | Seed copy (D-11) | Prefer with `document.execCommand('copy')` fallback only if needed; require user gesture (chip click). |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Web Audio oscillators | Howler + silent stubs / data-URI WAVs | Howler is STACK default for file SFX, but Phase 5 has **no files** — Howler adds deps + unlock ceremony without benefit. Prefer oscillators now; Howler adapter later. |
| Web Audio oscillators | `@pixi/sound` | Couples audio to Pixi asset pipeline; monetary/HUD events (bet lock, mute) are HTML-first — worse fit. |
| Theater BitmapText countdown | HTML overlay timer over canvas | Violates D-01 (canvas theater). |
| Theater BitmapText countdown | HUD bar countdown | Violates D-01. |
| Boot `?seed=` only | Mid-session `popstate` / `hashchange` reset | Explicitly deferred; costly session tear-down. |
| Seed on snapshot | Composition-root string only | Both OK; prefer **boot seed held at root + passed into HUD** so GameLogic snapshot stays HUD-agnostic. Optional `game.getSeed()` if useful for tests. |
| Space/Enter always calling `requestCashOut` | Only when button enabled via `canCashOut` | Must gate — otherwise spectator/waiting presses are no-ops that still `preventDefault` awkwardly. Follow `enablementFrom`. |
| Avg of **cash-out** multipliers | Avg of **crashAt** history | D-13 locks crash × from `snapshot.history` (already crashAt per completed round, including spectator). |

**Installation:** none required for the recommended path. Optional later: `npm install howler && npm install -D @types/howler` when real assets land (out of Phase 5 scope).

## Gap Analysis (current code vs Phase 5)

| Area | Current state | Phase 5 need |
|------|---------------|--------------|
| Waiting theater | Idle mode shows **dimmed last crash ×** (Phase 3 D-20); no countdown (D-17 deferred) | Waiting: show tenths countdown (white); clear on climb (D-01–D-04) |
| `waitRemainingMs` | Already on snapshot; decremented in `resolveTick` | View formats only — no logic change |
| Audio | None; no Howler | `AudioPort` + 4 beeps + mute HUD + localStorage |
| Boot seed | Hardcoded `"portfolio-demo"` in `main.ts` | `parseBootSeed(location.search)` → `createGame({ seed })` |
| Seed on UI | None | Collapsible Seed chip; reveal + copy string |
| Session stats | History pills only | Avg + max near strip; empty placeholders |
| Keyboard cash-out | None | Space + Enter + focus guard + `canCashOut` |
| GameLogic seed field | Seed consumed at `createRng`; not retained on facade | Retain seed string at composition root (or thin `getSeed()`) for chip — **do not** put URL parsing in logic |
| Fixed bar budget | 15.5rem on ≤720px | Compact mute + Seed + stats; scroll inside bar if needed — do not grow canvas theft |

## Architecture Patterns

### System Architecture Diagram

```
┌─ main.ts (composition root) ─────────────────────────────────┐
│  seed = parseBootSeed(location.search)  // D-10/D-12         │
│  game = createGame({ seed })                                 │
│  audio = createBeepAudioPort(loadMutePref())                 │
│  hud = mountCrashHud(root, game, { seed, audio })            │
│  view = mountCrashView(host)                                 │
│  ticker:                                                     │
│    prev = snap; game.tick(dt); snap = getSnapshot()          │
│    detectSfxEdges(prev, snap) → audio.play(event)            │
│    hud.render(snap); scene.sync(snap, dt)                    │
└──────────────────────────────────────────────────────────────┘
        │                         │                    │
        ▼                         ▼                    ▼
  GameLogic (pure)          HTML HUD                 Pixi view
  waitRemainingMs           mute / Seed chip         waiting → tenths
  history / cash-out        avg·max near strip       climb → live ×
  createRng(seed)           Space/Enter → CO         crash_hold unchanged
```

### Recommended Project Structure (delta only)

```
src/main.ts                          # parseBootSeed → createGame; optional SFX edge wire
src/shared/audio/
  AudioPort.ts                       # interface + MuteStore types
  createBeepAudioPort.ts             # Web Audio oscillator adapter
  mutePref.ts                        # localStorage load/save (pure-ish)
  sfxEdges.ts                        # pure prev/next snapshot → SfxEvent[]
  *.test.ts
src/shared/boot/
  parseBootSeed.ts                   # URLSearchParams → seed | fallback
  parseBootSeed.test.ts
src/games/crash/hud/
  CrashHud.ts                        # mute, Seed chip, stats, keydown
  sessionStats.ts                    # avg/max from history
  sessionStats.test.ts
  seedChip.ts                        # optional small DOM helper
index.html                           # mute button, Seed chip host, stats host near history
src/styles/hud.css                   # compact mute/seed/stats within bar budget
src/games/crash/view/CrashScene.ts   # waiting theater branch → countdown string
# TheaterText.ts — likely unchanged API (still sync liveText/tint/alpha)
```

Do not add audio imports under `logic/`. Do not put countdown in the HUD bar.

### Pattern 1: Waiting countdown in theater (PLSH-01 / D-01–D-04)

**What:** When `snapshot.phase === "waiting"`, set theater live node to continuous tenths from `waitRemainingMs`, white tint, full alpha. When phase leaves waiting (flight / climb), clear countdown — existing climb/crash theater paths take over.

**Format (discretion):**

```typescript
function formatWaitCountdown(waitRemainingMs: number): string {
  const ms = Math.max(0, waitRemainingMs);
  return (ms / 1000).toFixed(1); // "5.0" … "0.0" — no × suffix (not a multiplier)
}
```

**Conflict with Phase 3 D-20 (dimmed last crash × during waiting):** Phase 5 CONTEXT explicitly owns the theater slot for countdown during waiting. **Resolution:** While `phase === "waiting"`, countdown **replaces** dimmed last-crash × on the live node. After takeoff, climb shows live × as today. Crash hold/fade unchanged. Do not show countdown during `crash_hold` / `crash_fade` even if logic has already entered waiting early — prefer **logic phase** `waiting` + view idle, or gate on `phase === "waiting" && viewMode.mode === "idle"` so countdown appears only after fade completes (smoother). 

**Recommended gate (discretion):**

```typescript
const showCountdown =
  snapshot.phase === "waiting" && viewMode.mode === "idle";
```

That avoids flashing tenths over the crash × during hold/fade while `resolveTick` has already returned to waiting. Matches D-03 spirit (“waiting only”) and keeps crash read clean.

**Typography (discretion):** Reuse live `BitmapText` (fontSize 64, Arial, white `0xffffff`). Do not add a third text node unless layout fights frozen cash-out × (frozen should already be cleared on idle per D-20).

**Clear on flight:** As soon as `isClimbPhase` / mode → `climb`, existing climb branch sets `formatMult(snapshot.multiplier)` — countdown gone. No GO flash (D-03).

### Pattern 2: AudioPort + synthetic beeps + mute (PLSH-02 / D-05–D-08)

**Interface (discretion):**

```typescript
export type SfxEvent = "bet_lock" | "takeoff" | "cash_out" | "crash";

export interface AudioPort {
  play(event: SfxEvent): void;
  setMuted(muted: boolean): void;
  isMuted(): boolean;
  /** Resume AudioContext after a user gesture; idempotent. */
  unlock(): void;
  dispose(): void;
}
```

**Adapter:** `createBeepAudioPort({ muted })` using one shared `AudioContext`, short oscillators (~80–120ms), distinct frequencies e.g. bet 440Hz / takeoff 660Hz / cash_out 880Hz / crash 160Hz (square or sine). If muted, `play` is no-op. Persist mute via key `crash-demo:mute` = `"1"|"0"`.

**Why not Howler in Phase 5:** D-08 is synthetic beeps; no assets. Howler 2.2.4 is verified on npm but adds weight. Keep the port so `createHowlerAudioPort` can replace later.

**Edge detection (pure, unit-testable):**

| Event | Trigger |
|-------|---------|
| `bet_lock` | HUD: successful `placeBet` (`result.ok`) — also call `audio.unlock()` |
| `takeoff` | `prev.phase === "waiting" && next.phase === "flying"` |
| `cash_out` | `prev.cashOutAt == null && next.cashOutAt != null` (covers manual + auto) |
| `crash` | `prev.phase !== "waiting" && next.phase === "waiting" && next.history.length > prev.history.length` |

Wire edge detector in `main` ticker **or** inside HUD render with a `prevSnap` ref — composition root is cleaner so view stays dumb. Call `audio.unlock()` on first Place bet / mute toggle / Cash out click (Safari gesture policy — STACK Howler note applies equally to Web Audio).

**Mute control (discretion):** Small button in left balance zone or trailing actions zone: `Mute` / `Unmute` (or icon-free text `Sound: On|Off`). Must stay inside fixed bar; use compact padding. Toggle writes localStorage immediately.

**No countdown tick SFX** (D-05).

### Pattern 3: `?seed=` bootstrap + Seed chip (PLSH-03 / D-09–D-12)

**Parse helper:**

```typescript
export const DEFAULT_DEMO_SEED = "portfolio-demo";

export function parseBootSeed(
  search: string,
  fallback = DEFAULT_DEMO_SEED,
): { seed: string; fromQuery: boolean; invalid: boolean } {
  const raw = new URLSearchParams(search.startsWith("?") ? search : `?${search}`).get("seed");
  if (raw == null || raw === "") return { seed: fallback, fromQuery: false, invalid: false };
  // Reject pathological seeds: empty after trim, control chars, absurd length
  const trimmed = raw.trim();
  const invalid =
    trimmed.length === 0 ||
    trimmed.length > 128 ||
    /[\u0000-\u001F\u007F]/.test(trimmed);
  if (invalid) return { seed: fallback, fromQuery: true, invalid: true };
  return { seed: trimmed, fromQuery: true, invalid: false };
}
```

**Semantics of “reproduce a round”:** One seed owns the **session RNG stream** from boot (D-10). Each `startRound` consumes `rng.next()` via `sampleCrashAt`. Same seed + same number of launched rounds → same crash sequence. Bets do not consume RNG. Document in Seed chip title/`aria-label`: demo session seed — not provably fair.

**HUD Seed chip (discretion):** Collapsed label `Seed` in right zone above history (or left of history). Expand reveals `<code>`/`span` with `textContent = seed` + `Copy` button calling `navigator.clipboard.writeText(seed)`. Never `innerHTML`. If `invalid`, optional quiet status `using default` on the chip (discretion — recommend brief note once).

**Boot only:** No `popstate` listener. Changing the query after load does nothing until reload.

### Pattern 4: Session stats near history (PLSH-04 / D-13–D-14–D-16)

```typescript
export interface SessionStats {
  avgLabel: string; // "2.45×" or "—" / "n/a"
  maxLabel: string;
}

export function sessionStatsFrom(history: readonly number[]): SessionStats {
  if (history.length === 0) return { avgLabel: "—", maxLabel: "n/a" }; // D-16
  let sum = 0;
  let max = -Infinity;
  for (const m of history) {
    if (!Number.isFinite(m)) continue;
    sum += m;
    if (m > max) max = m;
  }
  if (!Number.isFinite(max)) return { avgLabel: "—", maxLabel: "n/a" };
  const avg = sum / history.length;
  return {
    avgLabel: `${avg.toFixed(2)}×`,
    maxLabel: `${max.toFixed(2)}×`,
  };
}
```

**DOM (discretion):** Above `.history-strip` in the right zone:

```html
<div class="session-stats" data-field="session-stats" aria-label="Session stats">
  <span>Avg <span data-field="stat-avg">—</span></span>
  <span>Max <span data-field="stat-max">n/a</span></span>
</div>
```

Bind in `CrashHud.render` from `snapshot.history` only — never a parallel array (WALT-05 pattern).

### Pattern 5: Desktop keyboard cash-out (PLSH-05 / D-15)

```typescript
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return false;
}

// In mountCrashHud — retain lastSnap for enablement
window.addEventListener("keydown", (e) => {
  if (e.key !== " " && e.key !== "Enter") return;
  if (e.repeat) return;
  if (isEditableTarget(e.target)) return; // D-15
  if (!enablementFrom(lastSnap).canCashOut) return; // flying && hasBet
  e.preventDefault(); // stop Space page scroll
  game.requestCashOut();
  audio?.unlock();
  // cash_out SFX will fire from edge detector on next tick when cashOutAt latches
});
```

**Discretion locked:** Shortcuts follow **`enablementFrom(...).canCashOut`**, not a looser “any flying” rule — matches the Cash out button and avoids spectator/no-bet presses.

Clean up listener on HMR dispose if HUD gains a dispose hook; otherwise document-level listener is acceptable for a single-page demo (pair with `import.meta.hot.dispose` in `main` if added).

### Pattern 6: Fixed-bar chrome budget (carry Phase 4)

Mute + Seed + stats are **small**. Prefer:

- Mute: text button ~compact in balance zone
- Seed: chip collapsed by default (minimal width)
- Stats: one thin row above history (`0.7–0.75rem`)

If phone bar overflows: **internal scroll already exists** (Phase 4 D-03) — do not raise `--hud-bar-height` unless QA proves critical controls unreachable. Do not put these controls on the canvas.

## Anti-Patterns to Avoid

- Putting countdown in the HUD bar or as HTML overlay on the canvas (breaks D-01).
- Integer-only countdown (`5…4…3`) (breaks D-02).
- GO flash / countdown through crash hold (breaks D-03).
- Countdown tick SFX (breaks D-05).
- Importing Howler/AudioContext into `logic/` or driving settle from audio.
- `innerHTML` for seed string (XSS — PITFALLS).
- Claiming “provably fair” in Seed chip copy.
- Mid-session URL seed reset without full reload (deferred).
- Copying constructed share URL instead of seed string (breaks D-11).
- Showing `0.00×` avg/max on empty history (breaks D-16).
- Keyboard cash-out while typing in bet/auto fields (breaks D-15).
- Keyboard calling a different settle path than the button.
- Growing the fixed phone bar so canvas collapses (Phase 4 regression).
- Installing Howler “just because STACK mentioned it” while still shipping oscillators only — pick one adapter behind the port.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Seeded PRNG | New RNG for polish | Existing `createRng` / `createGame({ seed })` | ARCH-01 done. |
| Waiting timer | Parallel `setTimeout` countdown | `waitRemainingMs` from snapshot | Logic is authoritative. |
| Per-frame theater text | `new Text` each frame | Existing `BitmapText` `.text =` | Pixi text skill. |
| File SFX pipeline | Asset pack / loader | Oscillator `AudioPort` | D-08 placeholders. |
| Stats store | Second history array in HUD | `snapshot.history` | WALT-05 single source. |
| Custom clipboard polyfill | Flash/legacy hacks | `navigator.clipboard` on click | Modern Chromium/Safari/Firefox. |

**Key insight:** Phase 5 is mostly **adapters at the composition root + view/HUD presentation**. Resist touching `resolveTick` unless a genuine bug blocks polish.

## Common Pitfalls

### Pitfall 1: Countdown fights crash × / fade

**What goes wrong:** Tenths appear over red crash × during hold, or flicker at waiting entry.

**Why it happens:** Logic enters `waiting` immediately on crash while view is still in `crash_hold`.

**How to avoid:** Pattern 1 gate: `phase === "waiting" && mode === "idle"`.

**Warning signs:** `5.0` visible during red flash.

### Pitfall 2: Silent audio (no unlock)

**What goes wrong:** Beeps never play on Safari/Chrome until a gesture; recruiters think mute is broken.

**Why it happens:** `AudioContext` starts `suspended`.

**How to avoid:** `audio.unlock()` on Place bet, mute toggle, and Cash out click; also on first successful keydown cash-out.

**Warning signs:** `audioContext.state === "suspended"` in DevTools after load with no clicks.

### Pitfall 3: Double SFX / missed edges

**What goes wrong:** Crash fires twice, or takeoff never fires when catching up large `deltaMS`.

**Why it happens:** Edge detector compares coarse fields incorrectly; or large tick jumps waiting→flying inside one `tick()` without HUD seeing intermediate snaps.

**How to avoid:** Detect on **post-tick snapshot** vs previous rendered snapshot (main already does one snap per frame). For multi-step inside `tick()`, phase transitions still land on the final snapshot — waiting→flying in one frame is fine (one takeoff). Prefer `cashOutAt` null→value for cash-out (single latch). Crash via history length increase.

**Warning signs:** Two crash beeps per round; bet beep without takeoff when auto-launch catches up.

### Pitfall 4: Seed XSS / huge query strings

**What goes wrong:** `?seed=<script>…` rendered into DOM unsafely, or absurd length freezes UI.

**Why it happens:** `innerHTML` or unbounded string.

**How to avoid:** `textContent`; validate length ≤128; strip controls; fallback `portfolio-demo`.

**Warning signs:** Seed chip renders markup; clipboard copies a multi-KB string.

### Pitfall 5: Keyboard steals typing / scrolls the page

**What goes wrong:** Space inserts in inputs or scrolls the page; Enter submits weirdly.

**Why it happens:** Missing editable guard or missing `preventDefault`.

**How to avoid:** Pattern 5 — `isEditableTarget` + `preventDefault` only when actually cashing out.

**Warning signs:** Bet field cannot type spaces (N/A for number) but Auto CO / future text breaks; page jumps on Space mid-flight.

### Pitfall 6: Mute / Seed / stats steal phone canvas

**What goes wrong:** Bar grows; curve clipped (Phase 4 regression).

**Why it happens:** Large new chrome without respecting `--hud-bar-height`.

**How to avoid:** Compact controls; rely on bar `overflow-y: auto`; collapsed Seed by default.

**Warning signs:** On 375×667, canvas height collapses after Phase 5 CSS.

### Pitfall 7: “Same seed” misunderstood as single-round deep link

**What goes wrong:** Recruiter expects `?seed=x` to jump to a specific historical crash mid-session.

**Why it happens:** Marketing “reproduce a round” vs D-10 session bootstrap.

**How to avoid:** Chip copy: session seed from boot; README one-liner. Round N crash depends on N launches from that seed.

**Warning signs:** Support confusion; do not build mid-session seek.

## Code Examples

### Theater waiting branch (CrashScene sync sketch)

```typescript
if (snapshot.phase === "waiting" && mode === "idle") {
  liveText = formatWaitCountdown(snapshot.waitRemainingMs);
  liveTint = 0xffffff;
  liveAlpha = 1;
} else if (mode === "crash_hold" || mode === "crash_fade") {
  // existing crash ×
} else if (mode === "idle") {
  // unreachable for waiting+idle; keep as safety for non-waiting idle
} else {
  // climb — existing live ×
}
```

### Boot seed

```typescript
const { seed } = parseBootSeed(window.location.search);
const game = createGame({ seed });
```

### SFX edges (pure)

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

`bet_lock` stays in the Place bet click handler (not snapshot-diff).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| HUD-only multiplier | Canvas theater × + HUD mirror | Phase 3 | Phase 5 countdown reuses theater slot |
| Hardcoded demo seed | `?seed=` session bootstrap + chip | Phase 5 | Shareable recruiter links |
| Silent demo | `AudioPort` synthetic beeps + mute | Phase 5 | Game feel without asset pipeline |
| Mouse-only cash-out | Space/Enter + focus guard | Phase 5 | Desktop polish |
| History pills only | + avg/max soft stats | Phase 5 | Analytical glance without backend |

**Deprecated/outdated for this phase:**

- Installing Howler before any audio files exist.
- HTML countdown overlay.
- DEMO badge as a polish deliverable.
- Provably-fair / commit-reveal theater.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Gating countdown on `phase === "waiting" && viewMode.mode === "idle"` satisfies D-03 without fighting crash hold. | Pattern 1 | If countdown must show for full 5s including overlap with fade, drop the `idle` gate — may flash over crash ×. Prefer idle gate. |
| A2 | Web Audio oscillators are acceptable “SFX placeholders” under D-08 / STACK without installing Howler. | Pattern 2 | If planner insists on STACK Howler pin, add howler@2.2.4 behind the same `AudioPort` — interface unchanged. |
| A3 | `cashOutAt` null→value is the single cash-out SFX edge (manual + auto). | Pattern 2 | If a path settles without latching `cashOutAt`, add phase `flying→cashed_out` edge — today’s D-16 latch should cover it. |
| A4 | Seed retained at composition root (not on `CrashSnapshot`) is enough for the chip. | Pattern 3 | If tests want seed on snapshot, add readonly `seed` to facade getter only. |
| A5 | Empty stats labels `—` and `n/a` (avg vs max) match D-16 literally. | Pattern 4 | Swap both to `—` if UI looks uneven — still not zeros. |
| A6 | `enablementFrom.canCashOut` is the correct keyboard gate (discretion). | Pattern 5 | Matches button; do not fire in `cashed_out`. |
| A7 | Compact mute/Seed/stats fit in 15.5rem with existing internal scroll. | Pattern 6 | QA may need tighter CSS; do not reopen fixed-bar contract to content-sized. |

## Open Questions (RESOLVED)

### Q1: Howler vs oscillator for Phase 5?
- **What we know:** D-08 synthetic beeps; STACK suggests Howler when adding audio; CONTEXT leaves discretion.
- **Recommendation:** Oscillator `AudioPort` now; Howler when files exist.
- **RESOLVED:** Use Web Audio oscillators behind `AudioPort`. Do not add Howler in Phase 5 plans unless assets appear.

### Q2: Countdown vs dimmed last crash ×?
- **What we know:** Phase 3 D-20 dimmed crash; Phase 5 D-01 countdown in same theater slot.
- **Recommendation:** Countdown wins during waiting+idle.
- **RESOLVED:** Pattern 1 — countdown replaces dimmed last-crash × while waiting idle.

### Q3: Keyboard enablement gate?
- **What we know:** Discretion says follow `enablementFrom`.
- **RESOLVED:** Require `canCashOut` (flying + active bet). Space/Enter otherwise ignored (no preventDefault).

### Q4: Invalid `?seed=` UX?
- **RESOLVED:** Silent fallback to `portfolio-demo` plus optional one-line note on expanded Seed chip when `invalid === true` (discretion: show `using default`).

### RESOLVED from CONTEXT
- Four SFX events only; no tick SFX — D-05.
- Mute in HUD + localStorage — D-06/D-07.
- Seed chip copies string not URL — D-11.
- Boot-only seed — D-10; deferred mid-session watch.
- Stats = avg + max crash from history — D-13.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | tooling / Vitest | ✓ | (local) | — |
| Vite | `npm run dev` | ✓ | 6.4.3 | — |
| pixi.js | theater BitmapText | ✓ | 8.21.0 | — |
| seedrandom | session RNG | ✓ | ^3.0.5 | — |
| Vitest | pure helper tests | ✓ | 3.2.7 | — |
| Web Audio API | beeps | ✓ in modern browsers | — | no-op `AudioPort` if `AudioContext` missing |
| localStorage | mute pref | ✓ | — | in-memory mute if throws (private mode) |
| Clipboard API | seed copy | ✓ on gesture | — | `textarea` + `execCommand('copy')` fallback |
| Howler | optional later | not installed | 2.2.4 on npm | Oscillators (recommended) |

**Missing dependencies with no fallback:** none for recommended path.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.7 (existing) |
| Config | `vitest.config.ts` node env |
| Quick run | `npx vitest run src/shared/boot src/shared/audio src/games/crash/hud/sessionStats.test.ts` |
| Full suite | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PLSH-01 | `formatWaitCountdown(5000)==="5.0"`; `4900→"4.9"`; clamp ≤0 | unit | vitest on format helper | ❌ Wave 0 |
| PLSH-01 | Waiting theater shows countdown; clears on flying | manual | `npm run dev` watch wait→flight | manual |
| PLSH-02 | `sfxEventsFromTransition` yields takeoff/cash_out/crash correctly | unit | vitest `sfxEdges.test.ts` | ❌ Wave 0 |
| PLSH-02 | Mute preference round-trip (mock localStorage) | unit | vitest `mutePref.test.ts` | ❌ Wave 0 |
| PLSH-02 | Beeps audible / mute silences | manual | browser gesture + mute toggle | manual |
| PLSH-03 | `parseBootSeed` missing/invalid/valid cases | unit | vitest `parseBootSeed.test.ts` | ❌ Wave 0 |
| PLSH-03 | `?seed=abc` boot + chip copy | manual | open URL; copy; reload default | manual |
| PLSH-03 | Same seed → same first `crashAt` after N launches | unit | existing CrashGame + seed fixtures | extend optional |
| PLSH-04 | `sessionStatsFrom([])` placeholders; avg/max finite | unit | vitest `sessionStats.test.ts` | ❌ Wave 0 |
| PLSH-05 | Focus guard + canCashOut documented; optional pure `shouldHandleCashOutKey` | unit | vitest small helper | ❌ optional |
| PLSH-05 | Space/Enter cash out mid-flight; ignored in inputs | manual | desktop keyboard | manual |
| ARCH-02 | logic/shared still pixi-free; audio not imported by logic | unit | `tests/architecture.no-pixi.test.ts` | ✅ extend deny-list if needed |

Manual-only justification: AudioContext unlock, clipboard, keyboard focus, and theater pixels are not meaningful in Node Vitest.

### Sampling Rate

- **Per task commit:** `npm test` after TS touches.
- **Per wave merge:** `npm test` + `npx tsc --noEmit`.
- **Phase gate:** Manual pass against ROADMAP success criteria 1–4; `/gsd-verify-work`.

### Wave 0 Gaps

- [ ] `parseBootSeed.ts` + tests
- [ ] `sessionStats.ts` + tests
- [ ] `sfxEdges.ts` + `mutePref.ts` + tests
- [ ] `formatWaitCountdown` helper (+ optional export for scene)
- [ ] No Howler install on recommended path
- [ ] Manual QA notes in plans for audio unlock, seed URL, keyboard, countdown readability

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | Mute in localStorage is preference only — not a security session |
| V4 Access Control | no | — |
| V5 Input Validation | yes | Bound/validate `?seed=`; `textContent` for seed display; existing placeBet finite checks |
| V6 Cryptography | no | Demo RNG only — do not imply crypto fairness |

### Known Threat Patterns for polish surface

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via `?seed=` reflected into DOM | Tampering / XSS | `textContent` only; length/control-char reject; no `innerHTML` / `eval` |
| Clipboard abuse | Information disclosure | Copy only on explicit chip click; copy seed string not cookies |
| localStorage treated as “account” | Spoofing optics | Mute-only key; never persist wallet as valuable (PITFALLS) |
| Audio autoplay annoyance | Denial / UX | Mute default optional (discretion: default unmuted after gesture); respect mute pref |

## Plan Mapping (for planner)

| Plan | Research focus | Primary files |
|------|----------------|---------------|
| **05-01** Waiting-phase countdown UX wired to round timing | Pattern 1; viewMode idle gate; BitmapText tenths | `CrashScene.ts`, optional tiny `formatWaitCountdown`, view tests if any |
| **05-02** AudioPort + SFX placeholders + mute toggle | Pattern 2; edges; mute localStorage; HUD mute control | `shared/audio/*`, `CrashHud.ts`, `index.html`, `hud.css`, `main.ts` wire |
| **05-03** `?seed=` parse + on-screen seed display | Pattern 3; parseBootSeed; Seed chip copy | `parseBootSeed.ts`, `main.ts`, `CrashHud.ts`, `index.html`, `hud.css` |
| **05-04** Session stats + desktop keyboard cash-out | Patterns 4–5; stats near strip; Space/Enter + focus guard | `sessionStats.ts`, `CrashHud.ts`, `index.html`, `hud.css` |

**MVP / tracer-first hint:** 05-01 should make waiting tenths visible end-to-end before audio/seed. 05-02 can play bet/takeoff from the same loop. 05-03 unlocks shareable boot. 05-04 finishes soft stats + keyboard (can parallelize with 05-03 after HUD mount points exist).

**UI hint:** Phase has `UI hint: yes` — planner should keep mute/Seed/stats visually quiet (compact, no card chrome, no purple glow) and within the fixed bar budget.

## Sources

### Primary (HIGH confidence)

- `.planning/phases/05-polish/05-CONTEXT.md` — D-01..D-16 locks
- `.planning/REQUIREMENTS.md` — PLSH-01..PLSH-05
- `.planning/ROADMAP.md` — Phase 5 success criteria + plans 05-01..05-04
- `.planning/STATE.md` — Phase 5 planning position
- `.planning/research/STACK.md` — Howler/`AudioPort`; seedrandom; gesture unlock note
- `.planning/research/FEATURES.md` — countdown, sound+mute, seed/`?seed=`, soft stats, keyboard
- `.planning/research/PITFALLS.md` — seeded reproducibility; XSS via seed UI; DEMO labeling
- `.planning/phases/03-pixi-hybrid-view/03-CONTEXT.md` — D-17 countdown deferred; D-20 dimmed crash ×
- `.planning/phases/04-mobile-harden/04-CONTEXT.md` — fixed bar budget
- `src/main.ts` — hardcoded `portfolio-demo`
- `src/games/crash/logic/CrashGame.ts` / `resolveTick.ts` / `config.ts` — seed, wait 5s, history
- `src/games/crash/view/CrashScene.ts` / `TheaterText.ts` / `viewMode.ts` — theater + idle gate
- `src/games/crash/hud/CrashHud.ts` / `enablement.ts` / `historyStrip.ts` / `format.ts`
- `index.html` / `src/styles/hud.css` — chrome mount points; `--hud-bar-height: 15.5rem`
- `.claude/.cursor/rules` — stack / architecture locks
- `.agents/skills/pixijs-scene-text/SKILL.md` — BitmapText for per-frame timers

### Secondary (MEDIUM confidence)

- `npm view howler version` → 2.2.4; `@types/howler` → 2.2.13 (verified this session)
- Web Audio autoplay / `AudioContext.resume()` on user gesture (browser standard; same class of issue as Howler unlock)

### Tertiary (LOW confidence)

- Exact beep frequencies / durations (taste) — tune in implementation
- Exact mute/Seed DOM slot within zones — CSS fit during 05-02/05-03

## Metadata

**Research scope:**

- Core technology: existing Pixi theater + HTML HUD + Web Audio port + URL boot seed
- Ecosystem: no new required libraries; Howler optional/deferred
- Patterns: countdown gate, AudioPort edges, parseBootSeed, sessionStats, keyboard cash-out
- Pitfalls: fade overlap, audio unlock, XSS seed, bar budget regression, seed semantics

**Confidence breakdown:**

- Standard stack: HIGH — verified package.json + npm howler versions; oscillator path needs no install
- Architecture: HIGH — gaps confirmed against live `main.ts` / `CrashScene` / `CrashHud` / snapshot fields
- Pitfalls: HIGH — CONTEXT + PITFALLS + Phase 3/4 carry-forwards
- Beep taste / exact chrome pixels: MEDIUM — discretionary

**Research date:** 2026-09-27
**Valid until:** 2026-10-27 (30 days; Web Audio / Pixi BitmapText / Vitest stable)

---

*Phase: 05-polish*
*Research completed: 2026-09-27*
*Ready for planning: yes*
