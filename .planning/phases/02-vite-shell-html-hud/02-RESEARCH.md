# Phase 2: Vite Shell + HTML HUD - Research

**Researched:** 2026-09-26
**Domain:** Vite app shell, composition root, thin HTML Crash HUD bound to Phase 1 GameLogic (no Pixi Application / no canvas art)
**Confidence:** HIGH (architecture / CONTEXT locks / verified GameLogic contract); MEDIUM (exact CSS density / chip set polish — discretionary)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Overlay chrome layout
- **D-01:** First viewport is a **bottom control bar** with a full-width **canvas/placeholder region above** — monetary controls live in the bottom band. — **Reversibility:** costly — Phase 3 canvas mount and Phase 4 responsive stacking assume this top/bottom split.
- **D-02:** **History strip lives inside the bottom bar** (same chrome band as chips), not above the canvas and not floating over the game region. — **Reversibility:** costly — CSS stacking and Phase 4 touch grouping follow this single-chrome-region choice.
- **D-03:** Bottom bar internal layout: **balance left · primary actions center · chips + history right**. — **Reversibility:** costly — HUD binder structure and Phase 4 retunes assume this three-zone chrome.
- **D-04:** Phase 2 canvas region is an **empty reserved slot** (neutral game region; optional quiet label only) — **no** big HTML multiplier theater in the slot. Phase 3 replaces the slot with Pixi. — **Reversibility:** one-way — Phase 3 plans treat the slot as a clean mount target.

### Carried forward (do not reopen)
- Continuous 5s waiting → auto-launch (Phase 1 D-13/D-14); spectator rounds OK (D-15) — HUD has **no** separate “Start Round” gate; place bet during waiting.
- Wallet economy and `resetWallet()` (Phase 1 D-01–D-04); display-unit `placeBet`.
- History buffer `N=20` already in `CRASH_CONFIG.historySize` — strip renders `snapshot.history`.
- No React/Angular; no DEMO badge UI (PROJECT.md).
- Wire to existing facade: `createGame` → `placeBet` / `requestCashOut` / `setAutoCashOut` / `tick` / `getSnapshot` / `resetWallet`.

### Claude's Discretion (researcher resolves below)
- Exact bet preset chip values and chip↔free-form input interaction (WALT-03).
- History strip visual density within the right zone (show all 20 vs fewer visible with scroll), newest direction, color thresholds.
- Whether a **small** live multiplier / phase readout appears in the bottom bar (not in the canvas slot) for headless play clarity.
- Exact auto cash-out control chrome (always-visible input vs toggle+input) within the center actions zone.
- Broke / hard-stop UX: where and how to surface `resetWallet()` in the bottom bar.
- Composition-root tick source for Phase 2 (e.g. `requestAnimationFrame` until Pixi ticker in Phase 3).
- Vite + TS bootstrap details, folder seams under `games/crash/hud` (or equivalent) per research ARCHITECTURE — follow existing `src/games/crash/logic/` package.

### Deferred Ideas (OUT OF SCOPE)
- Hybrid curve + rocket → Phase 3
- Mobile / touch stacking → Phase 4
- Countdown, SFX/mute, `?seed=`, session stats, keyboard cash-out → Phase 5
- DEMO badge UI → declined (PROJECT.md)
- Multi-game lobby / React shell → later milestone
- `pixi.js` Application init / canvas spectacle → Phase 3 (even if STACK wording mentions shell timing)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VIS-02 | Player uses a thin HTML overlay for bet, cash-out, balance, presets, auto cash-out, and history (Pixi owns the canvas) | HTML bottom bar owns all monetary controls; `#game-canvas-host` is a **reserved empty mount** so Pixi “owns” the canvas region without Phase 2 init. Satisfies VIS-02 without putting controls in Pixi or faking spectacle in the slot (D-04). |
| WALT-03 | Player can select bet amount via preset chips in addition to free-form input | Chip buttons in right zone set free-form bet input (display units); Place Bet command still goes through `game.placeBet`. Chip values within min 10 / max 1000. |
| WALT-05 | Player can see a history strip of the last N crash multipliers | Render `snapshot.history` only (logic ring buffer N=20); newest-first display; color thresholds; no parallel history store in HUD. |
</phase_requirements>

## Project Constraints (from `.claude/.cursor/rules`)

Actionable directives extracted this session from project rules (source: PROJECT.md + research/STACK.md embedded in rules):

- Stack lock: PixiJS v8 + TypeScript + Vite — Phase 2 adds **Vite shell**; Pixi Application remains Phase 3.
- No SPA framework in v1 (HTML + thin TS binders); **no React**.
- Client-side only; no backend.
- Architecture: GameLogic (pure TS) separate from view — **zero `pixi.js` / DOM in `logic/` + `shared/`** (ARCH-02 gate stays; package.json deny-list must be **updated** when Vite lands).
- Keep phases small and shippable; Phase 2 ends playable with numbers only.
- Demo / portfolio framing; no real money; no DEMO badge UI (README/title OK).
- Prefer Vitest on Node for logic; ticker/rAF feeds logic — do not tween the multiplier in the HUD.
- Prefer `create-pixi` only for greenfield; **non-empty repo → manual Vite add** (STACK scaffold tip).

## Summary

Phase 2 turns the verified Phase 1 `createGame` facade into a **recruiter-playable browser loop**: Vite boots `index.html` + `main.ts`, a composition root creates one `CrashGame`, an imperative HTML HUD sends commands and re-renders from `getSnapshot()`, and a **rAF loop** calls `game.tick(deltaMs)` until Phase 3 swaps the clock to `app.ticker`. Layout is locked: empty canvas host above, three-zone bottom bar (balance | actions | chips+history). Pixi does **not** own monetary controls; the reserved slot is the future Pixi mount — install **Vite now**, do **not** init `Application` (and prefer **not** installing `pixi.js` until Phase 3).

**Primary recommendation:** Manually add Vite 6.4.x + DOM-capable TS app config; mount `CrashHud` under `src/games/crash/hud/`; poll snapshots each frame from a stoppable rAF binder; keep `#game-canvas-host` empty; update `tests/architecture.no-pixi.test.ts` so package.json may list `vite` while logic/shared stay pure. Defer `pixi.js` install + Application.init to Phase 3.

**Walking skeleton (MVP):** `npm run dev` → see balance → placeBet via input → wait auto-launch → see small live mult in bar → cash out or crash → balance + history update — with empty canvas slot.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Round FSM / wallet / RNG / settle | Browser GameLogic (Phase 1) | — | Unchanged; HUD never reimplements |
| Vite bootstrap + composition root | Browser / Client (`main.ts`, `app/`) | — | Wires game + HUD + clock; no rules |
| HTML HUD commands / enablement | Browser DOM (`games/crash/hud`) | — | VIS-02 / WALT-03 / WALT-05 chrome |
| Snapshot → DOM render | HUD binder | — | Poll `getSnapshot` (no subscribe yet) |
| Frame clock (Phase 2) | `requestAnimationFrame` | Phase 3 `app.ticker` | Same `game.tick(deltaMs)` call site |
| Reserved canvas region | Empty `#game-canvas-host` | Phase 3 Pixi mount | D-04 one-way clean slot |
| History / balance truth | GameLogic snapshot | HUD display only | No localStorage; no DOM mutation of money |
| Vitest ARCH-02 / logic suite | Node | — | Must stay green after Vite lands |
| Pixi Application / curve / rocket | — | Phase 3 | Explicitly out of Phase 2 |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard | Provenance |
|---------|---------|---------|--------------|------------|
| **Vite** | `6.4.3` (`^6.4.3`, ≥6.0.7) | Dev server, HMR, production bundle | Locked stack; STACK prefers Vite 6.x; avoids Vite 8 “too-new” + Vitest 3 pairing risk | `[VERIFIED: npm registry]` `npm view vite version` → `8.3.1` (latest); pin **6.4.3** as mature 6.x; published `2026-06-01` |
| **TypeScript** | `~5.8.3` (already installed) | Typed HUD + shell | Keep Phase 1 pin; avoid TS 6/7 until Pixi typing story revisited | `[VERIFIED: package.json + npm]` |
| **Vitest** | `^3.2.7` / `3.2.7` (already) | Logic + ARCH-02 tests | Stay on V3 pin; do not jump to `latest` 5.x | `[VERIFIED: npm]` dist-tag `V3` = `3.2.7`; `latest` = `5.0.2` |
| **Node.js** | 20+ LTS (env v24.18.0) | Tooling | Required | `[VERIFIED: local]` |

### Supporting (Phase 2)

| Library | Version | Purpose | When to Use | Provenance |
|---------|---------|---------|-------------|------------|
| **seedrandom** | `^3.0.5` (already) | GameLogic RNG | Unchanged | `[VERIFIED]` `3.0.5` |
| **@types/node** | already | Vitest / Node types | Keep for tests | `[VERIFIED]` |
| **Vanilla HTML/CSS** | — | Overlay chrome | Always | Locked |

### Explicitly NOT in Phase 2 runtime

| Package | Why deferred / avoided |
|---------|------------------------|
| **`pixi.js`** | Phase 3 Application + spectacle. STACK “shell timing” = Vite + tick handoff pattern, **not** unused Pixi dep. Installing now only expands ARCH-02 package.json churn with zero UI benefit. |
| **React / Vue / Angular** | Locked out of v1 |
| **Howler / GSAP** | Phase 5 polish |
| **create-pixi scaffold into `.`** | Repo non-empty; fights existing `src/`, `.planning/`, Vitest — **manual add** |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vite `6.4.3` | Vite `8.3.1` (`latest`) | Newer major published ~2 days before research (`2026-09-24`) — SUS too-new vs Vitest 3; STACK docs still cite 6.x |
| No `pixi.js` | Premature `npm i pixi.js` unused | Extra dep + package.json gate churn; no Phase 2 code path |
| rAF clock | Install Pixi solely for ticker | Violates D-04 empty slot / premature Application |
| Imperative HUD | React / lit / Preact | Locked out; slower |
| `subscribe()` on CrashGame | Poll `getSnapshot` each frame | Lightest; Phase 3 can keep poll or add subscribe later without HUD rewrite if binder API is `render(snap)` |
| create-pixi into `.` | Manual Vite files | create-pixi overwrites/conflicts non-empty tree |

**Installation (Phase 2):**

```bash
# Do NOT run create-pixi into this non-empty repo
npm install -D vite@6.4.3
# Optional: keep typescript / vitest pins unchanged
```

Add scripts:

```json
{
  "dev": "vite",
  "build": "tsc --noEmit && vite build",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

**Do not** `npm install pixi.js` in Phase 2.

**Version verification (this session):**

| Package | Command result |
|---------|----------------|
| vite (latest) | `8.3.1` — **do not pin as unpinned latest for Phase 2** |
| vite@6.4.3 | `6.4.3` — **recommended pin** |
| pixi.js (latest) | `8.21.0` — Phase 3 only |
| typescript@5.8.3 | `5.8.3` |
| vitest V3 | `3.2.7` |
| vitest latest | `5.0.2` — avoid |
| seedrandom | `3.0.5` |
| Node / npm | `v24.18.0` / `11.16.0` |

## Package Legitimacy Audit

| Package | Registry | Age / published | Notes | Verdict | Disposition |
|---------|----------|-----------------|-------|---------|-------------|
| vite@6.4.3 | npm | 2026-06-01 (version time) | Mature 6.x; STACK-aligned | OK | **Approved** — install as `^6.4.3` |
| vite@8.3.1 (`latest`) | npm | 2026-09-24 | ~2 days old at research | SUS (too-new) | **Defer** — optional later upgrade after Vitest pairing proven |
| pixi.js@8.21.0 | npm | 2026-09-17 | Fine for Phase 3 | OK | **Defer install to Phase 3** |
| typescript@~5.8.3 | npm | mature | Already in tree | OK | Keep |
| vitest@3.2.7 | npm | 2026-07-06 | Phase 1 pin | OK | Keep |
| vitest@5.0.2 | npm | 2026-09-25 | Too-new vs Phase 1 audit | SUS | Do not upgrade this phase |
| seedrandom@3.0.5 | npm | mature | Already in tree | OK | Keep |

**Packages removed due to [SLOP] verdict:** none  
**Packages flagged as suspicious [SUS]:** `vite@latest` (8.3.1), `vitest@latest` (5.0.2) — planner must pin mature releases.  
**Postinstall scripts:** none expected for vite 6.4.3 (standard).

## Architecture Patterns

### System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│  index.html                                                      │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  #game-canvas-host  (RESERVED — empty / quiet label)       │  │
│  │  Phase 3: append app.canvas here                           │  │
│  └────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  #hud-bar  (bottom chrome)                                 │  │
│  │  [balance+reset] │ [bet · place · cashout · autoCO · mult] │  │
│  │                  │ [chips · history strip]                 │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                │ commands                    ▲ snapshot render
                ▼                             │
┌──────────────────────────────────────────────────────────────────┐
│  main.ts composition root                                        │
│    game = createGame({ seed: "demo" })                           │
│    hud = mountCrashHud(root, game)                               │
│    clock = startRafClock((dt) => { game.tick(dt); hud.render() })│
└────────────────────────────┬─────────────────────────────────────┘
                             │ tick(deltaMs) / getSnapshot()
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  CrashGame (Phase 1 — UNCHANGED rules)                           │
│  placeBet · requestCashOut · setAutoCashOut · resetWallet        │
└──────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure (Phase 2 adds)

```
/
├── index.html                 # NEW — layout slots (#game-canvas-host, #hud-bar)
├── vite.config.ts             # NEW
├── package.json               # MOD — vite + scripts; allow vite in deps
├── tsconfig.json              # MOD — DOM lib / app include; keep tests
├── tsconfig.node.json         # NEW (optional) — vite.config typing
├── vitest.config.ts           # KEEP — environment: 'node'
├── src/
│   ├── main.ts                # NEW — composition root
│   ├── styles/
│   │   └── hud.css            # NEW — bottom bar + zones + history chips
│   ├── app/
│   │   ├── GameSession.ts     # NEW (optional) — owns game + clock lifecycle
│   │   └── rafClock.ts        # NEW — start/stop rAF → tick + onFrame
│   ├── games/crash/
│   │   ├── logic/             # EXISTING — pure; no edits required for HUD
│   │   └── hud/               # NEW
│   │       ├── CrashHud.ts    # mount + render(snapshot) + wire events
│   │       ├── enablement.ts  # phase → disabled flags matrix
│   │       ├── chips.ts       # PRESET_CHIPS constants
│   │       ├── historyStrip.ts# render history from snapshot.history
│   │       └── format.ts      # display helpers (mult, money) — text only
│   └── shared/                # EXISTING — no DOM
└── tests/
    ├── architecture.no-pixi.test.ts  # MOD — drop package.json vite/pixi ban;
    │                                 # keep logic/shared source scan
    └── (logic tests unchanged)
```

Aligns with [VERIFIED: `.planning/research/ARCHITECTURE.md`] folder seams; Phase 3 adds `games/crash/view/` + `app/bootstrap.ts` Pixi init into `#game-canvas-host`.

### Pattern 1: Composition root (thin)

**What:** `main.ts` only constructs `createGame`, mounts HUD, starts clock. No bet math, no phase rules.  
**When to use:** Always.  
**Do not:** Put `placeBet` validation besides calling the facade; do not write balance into the DOM except via `render(snapshot)`.

### Pattern 2: Command / snapshot binder (poll, no subscribe)

**What:** HUD event handlers call facade commands; each frame (or after command) `hud.render(game.getSnapshot())`. Phase 1 has **no** `subscribe()` — do not add a heavy event bus in Phase 2 unless planner needs it for tests. Polling at rAF rate is enough and matches Phase 3 ticker-driven sync.  
**When to use:** Always for Phase 2.  
**Optional later:** Thin `subscribe` on CrashGame — only if multiple views need push; not required to plan VIS-02.

### Pattern 3: Stoppable clock (rAF → ticker handoff)

**What:**

```typescript
type StopClock = () => void;
function startRafClock(onFrame: (deltaMs: number) => void): StopClock;
```

Phase 3: `stopRaf()` then `app.ticker.add(({ deltaMS }) => { game.tick(deltaMS); hud.render(game.getSnapshot()); scene.sync(...) })`.  
**Critical:** GameLogic already clamps/sub-steps `deltaMs` (`maxDeltaMs: 100`) — rAF hitch recovery is safe.

### Pattern 4: Reserved canvas slot (D-04)

**What:** `#game-canvas-host` is a flex-grow empty region. Optional muted aria/placeholder text only (“Game view”). **No** giant live multiplier, graph, or rocket HTML inside. Small live mult lives in the **bottom bar** (discretion — recommended yes).  
**Phase 3:** `host.appendChild(app.canvas)`; CSS already sizes host; `resizeTo: host`.

### Pattern 5: Phase-aware enablement (derived flags)

**What:** Pure function `enablementFrom(snapshot) → { canPlaceBet, canCashOut, canEditBet, canEditAuto, chipsEnabled, showBroke }` — buttons’ `disabled` attributes only. Logic already no-ops illegal commands; UI must still disable to prevent recruiter confusion.

**Note on phases `[VERIFIED: resolveTick.ts]`:** `settleOnce` returns via `enterWaiting`, so snapshots after settle are almost always `waiting` (terminal `cashed_out` / `crashed` are not durable UI states). Treat enablement as **waiting | flying** primarily; if a transient terminal appears for one frame, treat like waiting for controls (cash-out off, bet on when eligible).

### Anti-Patterns to Avoid

- **React / SPA framework** for the HUD.
- **Big HTML multiplier theater in `#game-canvas-host`** (D-04 one-way).
- **Logic rules in HUD** (min/max/broke/settlement) — call facade; display `PlaceBetResult.reason`.
- **Mutating balance/history in DOM** independently of snapshot.
- **create-pixi into non-empty repo**.
- **Init Pixi Application in Phase 2** “to reserve the canvas.”
- **Leaving ARCH-02 package.json deny-list unchanged** after adding vite — suite will fail closed.
- **`innerHTML` for history strip with untrusted strings** — use `textContent` / createElement (seed/mult are numbers from logic, still prefer safe DOM).
- **localStorage wallet** — session-local only (Phase 1 D-01; v2 persistence deferred).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dev server / HMR / build | Custom esbuild scripts | Vite 6.4.x | Locked stack; Pixi Phase 3 template path |
| UI framework | React/Vue “for forms” | Imperative DOM binder | PROJECT lock; thin overlay |
| Game clock | Ad-hoc `setInterval(16)` | rAF + `performance.now()` delta | Aligns with future ticker; visibility-friendly |
| History store in HUD | Second array of crashes | `snapshot.history` | Single source of truth; N=20 already |
| Bet validation in HUD | Duplicate min/max | `placeBet` result reasons | Wallet already authoritative |
| Pixi HTML-in-canvas (`HTMLSource`) | Rendering HUD as Pixi texture | Real DOM overlay | Wrong skill — HUD is sibling DOM, not `pixi.js/html-source` |

**Key insight:** Phase 2 risk is **layout + boundary**, not libraries. Spend plan budget on slots, binder, enablement matrix, and ARCH-02 gate update — not on scaffolding Pixi early.

## Common Pitfalls

### Pitfall 1: Logic leaking into HUD
**What goes wrong:** HUD computes payouts, clamps bets, or advances “fake” multipliers.  
**Why:** Fastest demo path.  
**How to avoid:** Commands only; render snapshot fields; format helpers are display-only.  
**Warning signs:** Tests for settlement live under `hud/`.

### Pitfall 2: Canvas slot pollution (D-04)
**What goes wrong:** Giant HTML `2.37×` in the game region; Phase 3 must rip it out.  
**How to avoid:** Empty host; small live mult in bottom bar only.  
**Warning signs:** `#game-canvas-host` contains interactive controls.

### Pitfall 3: rAF vs ticker handoff mess
**What goes wrong:** Both clocks run → double `tick`; or Phase 3 can’t find a stop handle.  
**How to avoid:** Single `StopClock` owned by session; Phase 3 stops before starting ticker.  
**Warning signs:** Multiplier climbs ~2× too fast.

### Pitfall 4: Chip sync / double place
**What goes wrong:** Chip both fills input and auto-`placeBet` while Place Bet also fires → confusing rejects (`bet_already_placed`).  
**How to avoid:** Chips **only set the bet input value**; Place Bet submits. Highlight selected chip from input value.  
**Warning signs:** Place bet fails after chip tap with no clear UX.

### Pitfall 5: History render from parallel state
**What goes wrong:** HUD pushes to its own array on button click; desyncs from spectator rounds.  
**How to avoid:** Only `snapshot.history`; reverse for newest-first display.  
**Warning signs:** History misses spectator crashes.

### Pitfall 6: Broke / reset UX buried
**What goes wrong:** Balance hits &lt;10; every placeBet returns `broke`; recruiter stuck.  
**How to avoid:** Left zone: balance + **Reset demo** control calling `resetWallet()`; emphasize when `reason === 'broke'` or `balance < min`.  
**Warning signs:** No path to restore 5000 without reload.

### Pitfall 7: create-pixi fighting non-empty repo
**What goes wrong:** Scaffold overwrites `package.json` / adds React template / duplicates tsconfig.  
**How to avoid:** Manual `vite` + `index.html` + `main.ts` (pixijs-create skill: “existing project → npm install only”).  
**Warning signs:** Unexpected framework deps.

### Pitfall 8: ARCH-02 package.json gate forgotten
**What goes wrong:** `tests/architecture.no-pixi.test.ts` still asserts no `vite` / `pixi.js` in package.json → Phase 2 CI red.  
**How to avoid:** Wave 0 task: rewrite second test to allow shell deps; **keep** source scan on `logic/` + `shared/` forbidding pixi/DOM. Optionally assert `hud/` **may** use DOM and must **not** import from a future `view/` incorrectly.  
**Warning signs:** First `npm i vite` makes `npm test` fail on architecture file.

### Pitfall 9: tsconfig without DOM breaks HUD
**What goes wrong:** Phase 1 `lib: ["ES2022"]` + `types: ["node"]` — `document` unknown in `main.ts`/`hud`.  
**How to avoid:** Add DOM lib for app sources (split `tsconfig.app.json` include `src/**` with `"lib": ["ES2022","DOM"]`, keep vitest/node config separate) **or** single tsconfig with DOM + node types carefully.  
**Warning signs:** `Cannot find name 'document'`.

### Pitfall 10: Import suffix / moduleResolution clash
**What goes wrong:** Logic uses `.js` ESM suffixes under NodeNext; Vite app imports break or Vitest breaks after switching everything to `bundler`.  
**How to avoid:** Prefer keeping `.js` suffixes (Vite resolves them); use `moduleResolution: "bundler"` for app **or** keep NodeNext if Vite builds cleanly — verify with `vite build` + `vitest run` in same plan.  
**Warning signs:** Logic tests fail to resolve after tsconfig churn.

### Pitfall 11: Assuming durable `cashed_out` / `crashed` UI phase
**What goes wrong:** Enablement matrix waits for terminal phase chrome that never sticks (settle → waiting same transition).  
**How to avoid:** Drive UI from `waiting` vs `flying`; use balance/history deltas for feedback; optional one-frame flash is nicety not requirement.  
**Warning signs:** Cash-out button stuck disabled after “win.”

### Pitfall 12: DEMO badge creep / deposit language
**What goes wrong:** PITFALLS.md still pushes DEMO badge; PROJECT/CONTEXT decline badge UI.  
**How to avoid:** Page `<title>` / README demo framing only; no “Deposit/Withdraw” copy.  
**Warning signs:** Badge element in HUD mockups.

## Code Examples

Patterns below are **prescriptive** for planner/implementer. Tagged `[VERIFIED]` when matching current source; `[ASSUMED]` for Phase 2-greenfield.

### index.html layout slots (D-01..D-04)

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Crash Demo — Portfolio</title>
    <link rel="stylesheet" href="/src/styles/hud.css" />
  </head>
  <body>
    <div id="app" class="app-shell">
      <!-- Reserved Pixi mount — keep empty (D-04) -->
      <div id="game-canvas-host" class="canvas-host" aria-label="Game view">
        <p class="canvas-placeholder">Game view</p>
      </div>

      <footer id="hud-bar" class="hud-bar">
        <div class="hud-zone hud-zone--left" data-zone="balance">
          <div class="balance" data-field="balance">—</div>
          <button type="button" data-action="reset-wallet">Reset demo</button>
        </div>

        <div class="hud-zone hud-zone--center" data-zone="actions">
          <span data-field="phase"></span>
          <span data-field="live-mult" class="live-mult">1.00×</span>
          <label>
            Bet
            <input data-field="bet-input" type="number" min="10" max="1000" step="1" value="100" />
          </label>
          <button type="button" data-action="place-bet">Place bet</button>
          <button type="button" data-action="cash-out">Cash out</button>
          <label>
            Auto CO
            <input data-field="auto-co" type="number" min="1.01" step="0.01" placeholder="Off" />
          </label>
          <button type="button" data-action="clear-auto-co">Clear</button>
        </div>

        <div class="hud-zone hud-zone--right" data-zone="chips-history">
          <div class="chips" data-field="chips"></div>
          <div class="history-strip" data-field="history" role="list"></div>
        </div>
      </footer>
    </div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

### main.ts composition root + rAF clock

```typescript
// src/main.ts — [ASSUMED] composition root
import { createGame } from "./games/crash/logic/index.js";
import { mountCrashHud } from "./games/crash/hud/CrashHud.js";
import { startRafClock } from "./app/rafClock.js";
import "./styles/hud.css";

function main(): void {
  const game = createGame({ seed: "portfolio-demo" });
  const root = document.querySelector("#hud-bar");
  if (!root) throw new Error("#hud-bar missing");

  const hud = mountCrashHud(root, game);
  hud.render(game.getSnapshot());

  // Phase 3: stop() then app.ticker.add(...)
  const stopClock = startRafClock((deltaMs) => {
    game.tick(deltaMs);
    hud.render(game.getSnapshot());
  });

  // HMR / teardown hook for later
  if (import.meta.hot) {
    import.meta.hot.dispose(() => stopClock());
  }
}

main();
```

```typescript
// src/app/rafClock.ts — [ASSUMED]
export function startRafClock(onFrame: (deltaMs: number) => void): () => void {
  let raf = 0;
  let last = performance.now();
  const frame = (now: number) => {
    const deltaMs = now - last;
    last = now;
    onFrame(deltaMs);
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
}
```

### HUD binder — commands + snapshot render

```typescript
// games/crash/hud/CrashHud.ts — [ASSUMED] imperative binder
import type { CrashGame, CrashSnapshot } from "../logic/index.js";
import { enablementFrom } from "./enablement.js";
import { PRESET_CHIPS } from "./chips.js";
import { renderHistoryStrip } from "./historyStrip.js";
import { formatMoney, formatMult } from "./format.js";

export function mountCrashHud(root: Element, game: CrashGame) {
  const betInput = root.querySelector<HTMLInputElement>("[data-field=bet-input]")!;
  const autoInput = root.querySelector<HTMLInputElement>("[data-field=auto-co]")!;
  const chipsHost = root.querySelector("[data-field=chips]")!;
  const historyHost = root.querySelector("[data-field=history]")!;

  // Chips: fill input only (do not placeBet)
  for (const value of PRESET_CHIPS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = String(value);
    btn.dataset.chip = String(value);
    btn.addEventListener("click", () => {
      betInput.value = String(value);
    });
    chipsHost.appendChild(btn);
  }

  root.querySelector("[data-action=place-bet]")!.addEventListener("click", () => {
    const amount = Number(betInput.value);
    const result = game.placeBet(amount);
    if (!result.ok) {
      // surface result.reason in a small status node (broke → emphasize reset)
      root.querySelector("[data-field=status]")!.textContent = result.reason;
    }
  });

  root.querySelector("[data-action=cash-out]")!.addEventListener("click", () => {
    game.requestCashOut();
  });

  autoInput.addEventListener("change", () => {
    const raw = autoInput.value.trim();
    if (raw === "") game.setAutoCashOut(null);
    else game.setAutoCashOut(Number(raw));
  });

  root.querySelector("[data-action=clear-auto-co]")!.addEventListener("click", () => {
    autoInput.value = "";
    game.setAutoCashOut(null);
  });

  root.querySelector("[data-action=reset-wallet]")!.addEventListener("click", () => {
    game.resetWallet();
  });

  function render(snap: CrashSnapshot): void {
    root.querySelector("[data-field=balance]")!.textContent = formatMoney(snap.balance);
    root.querySelector("[data-field=phase]")!.textContent = snap.phase;
    root.querySelector("[data-field=live-mult]")!.textContent = formatMult(snap.multiplier);
    // Reflect auto from snapshot (source of truth)
    if (snap.autoCashOutAt == null) {
      /* keep empty unless user typing — or sync when not focused */
    } else if (document.activeElement !== autoInput) {
      autoInput.value = String(snap.autoCashOutAt);
    }

    const en = enablementFrom(snap);
    (root.querySelector("[data-action=place-bet]") as HTMLButtonElement).disabled = !en.canPlaceBet;
    (root.querySelector("[data-action=cash-out]") as HTMLButtonElement).disabled = !en.canCashOut;
    betInput.disabled = !en.canEditBet;
    chipsHost.querySelectorAll("button").forEach((b) => {
      (b as HTMLButtonElement).disabled = !en.chipsEnabled;
    });

    renderHistoryStrip(historyHost, snap.history);
  }

  return { render };
}
```

### Phase-aware enablement matrix

```typescript
// enablement.ts — [ASSUMED] from verified phases + facade gates
import type { CrashSnapshot } from "../logic/index.js";
import { CRASH_CONFIG } from "../logic/config.js";

export function enablementFrom(snap: CrashSnapshot) {
  const waiting = snap.phase === "waiting";
  const flying = snap.phase === "flying";
  const broke = snap.balance < CRASH_CONFIG.minBetCents / 100; // display min = 10
  const hasBet = snap.bet != null;

  return {
    canPlaceBet: waiting && !hasBet && !broke,
    canEditBet: waiting && !hasBet && !broke,
    chipsEnabled: waiting && !hasBet && !broke,
    canCashOut: flying && hasBet, // spectator flying: cash-out no-ops; keep disabled without bet
    canEditAuto: true, // setAutoCashOut allowed anytime; persists across rounds [VERIFIED: enterWaiting]
    showBroke: broke,
    // resetWallet: always available (discretion) — especially when showBroke
  };
}
```

| Control | waiting (no bet) | waiting (bet locked) | flying (with bet) | flying (spectator) |
|---------|------------------|----------------------|-------------------|--------------------|
| Bet input / chips | on | off | off | off |
| Place bet | on (if not broke) | off | off | off |
| Cash out | off | off | on | off |
| Auto CO input | on | on | on | on |
| Reset demo | on | on | on | on |
| Live mult (bar) | show wait / 1.00× | show wait | live × | live × |

### Preset chips

```typescript
// chips.ts — [ASSUMED] Claude's Discretion resolution
/** Display units; within D-02 min 10 / max 1000 */
export const PRESET_CHIPS = [10, 25, 50, 100, 250, 500] as const;
```

Omit 1000 as a chip to reduce “all-in” mis-taps; free-form still allows up to 1000.

### History strip

```typescript
// historyStrip.ts — [ASSUMED]
/** snapshot.history is oldest→newest [VERIFIED: History.push]. Display newest-first. */
export function renderHistoryStrip(host: Element, history: readonly number[]): void {
  host.replaceChildren();
  const newestFirst = [...history].reverse();
  for (const m of newestFirst) {
    const el = document.createElement("span");
    el.role = "listitem";
    el.className = historyClass(m);
    el.textContent = `${m.toFixed(2)}×`;
    host.appendChild(el);
  }
}

function historyClass(m: number): string {
  if (m < 2) return "hist hist--low";
  if (m <= 10) return "hist hist--mid";
  return "hist hist--high";
}
```

**Density:** Render all up to 20; CSS `overflow-x: auto` in the right zone (horizontal scroll). Do not truncate the data — only the viewport.

### vite.config.ts (minimal)

```typescript
import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  publicDir: "public",
  server: { port: 5173 },
  build: { outDir: "dist", target: "es2022" },
});
```

## State & Persistence

| Concern | Phase 2 policy |
|---------|----------------|
| Wallet / history / round | Session-local in `CrashGame` memory only |
| `localStorage` / cookies | **None** — v2 requirement deferred |
| Seed | Hardcode composition-root seed (e.g. `"portfolio-demo"`); URL `?seed=` is Phase 5 |
| HUD form fields | Ephemeral DOM; auto CO mirrored from snapshot when input not focused |
| Refresh | Full reset to starting balance / empty history — acceptable for demo |

## Validation Architecture

> `workflow.nyquist_validation` is `true` in `.planning/config.json` — section required.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest **3.2.7** (keep pin) |
| Config | `vitest.config.ts` — `environment: 'node'` for logic |
| Quick run | `npx vitest run` |
| Dev smoke | `npm run dev` — manual play loop (human_verify end-of-phase) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ARCH-02 (regression) | logic/shared still free of pixi/DOM; package.json **may** include vite | unit | `npx vitest run tests/architecture.no-pixi.test.ts` | ✅ must **modify** |
| ARCH-04 (regression) | Full logic suite green after Vite | unit | `npx vitest run` | ✅ |
| VIS-02 | HTML owns controls; canvas host empty of monetary controls | unit + manual | DOM contract test optional; manual `npm run dev` | ❌ Wave 0 optional |
| WALT-03 | PRESET_CHIPS within 10–1000; chip sets input | unit | `npx vitest run src/games/crash/hud/chips.test.ts` | ❌ Wave 0 |
| WALT-05 | History render newest-first from snapshot; class thresholds | unit | `npx vitest run src/games/crash/hud/historyStrip.test.ts` | ❌ Wave 0 (happy-dom/jsdom **or** pure fn tests without DOM) |
| Enablement | waiting/flying matrix | unit | `npx vitest run src/games/crash/hud/enablement.test.ts` | ❌ Wave 0 |
| Clock handoff seam | `startRafClock` returns stop fn | unit | optional | ❌ |

**Prefer pure functions** (`enablementFrom`, `historyClass`, chip constants) tested under Node without jsdom. Reserve browser smoke for end-of-phase human verify.

### Sampling Rate

- **Per task commit:** `npx vitest run`
- **Per wave:** `npx vitest run` + `npm run build` (once Vite lands)
- **Phase gate:** Logic suite green + manual play of bet → fly → cash-out/crash → history

### Wave 0 Gaps

- [ ] Install `vite@6.4.3`; add `dev` / `build` / `preview` scripts
- [ ] `index.html` + `vite.config.ts` + `src/main.ts`
- [ ] Update `tests/architecture.no-pixi.test.ts` package.json assertion (allow vite; still ban pixi.js **until Phase 3**, or allow both shell packages but keep source scan)
- [ ] tsconfig DOM support for app entry without breaking Vitest
- [ ] `src/games/crash/hud/*` + pure unit tests for enablement/chips/history helpers
- [ ] Confirm `npx vitest run` still 37+ green after scaffold

**Recommended ARCH-02 package.json policy for Phase 2:**

- Allow `vite` in devDependencies.
- Continue **forbidding `pixi.js`** in package.json until Phase 3 (clear phase boundary).
- Always forbid pixi/DOM usage under `src/games/crash/logic` and `src/shared`.

## Integration Points

### Phase 1 facade (stable)

```
createGame({ seed }) → CrashGame {
  placeBet(amountDisplay): PlaceBetResult  // reasons: not_waiting | bet_already_placed |
                                           // invalid_amount | broke | below_min | above_max |
                                           // insufficient_balance
  requestCashOut(): void
  setAutoCashOut(target: number | null): void  // null clears; persists across rounds
  tick(deltaMs): void
  getSnapshot(): CrashSnapshot
  resetWallet(): void
}
CrashSnapshot: phase, multiplier, balance, bet, crashAt, waitRemainingMs,
               history, roundId, autoCashOutAt
CRASH_CONFIG.historySize = 20
```

`[VERIFIED: CrashGame.ts, RoundState.ts, config.ts, Wallet.ts, History.ts, resolveTick.ts]`

### Phase 3 mount target

| Contract | Phase 2 delivers | Phase 3 consumes |
|----------|------------------|------------------|
| DOM host | `#game-canvas-host` empty, sized by CSS | `host.appendChild(app.canvas)`; `resizeTo: host` |
| Clock | `stopRafClock()` export from session | Stop rAF; `app.ticker` → `game.tick(deltaMS)` |
| HUD | Remains HTML overlay above/beside canvas | Unchanged monetary ownership |
| Snapshot | Same `getSnapshot` | Pixi view observes; still no wallet writes |

### External

None (client-only).

## Security Domain

> `security_enforcement: true`, ASVS level 1.

| ASVS Category | Applies | Control |
|---------------|---------|---------|
| V5 Input Validation | yes | Bet/auto CO via logic; HUD coerces numbers; reject non-finite already in facade |
| V5 XSS | yes | Prefer `textContent` / createElement for history; no raw `innerHTML` of free text |
| V2–V4 Auth/Session | no | No accounts |
| Optics | yes | Demo title/copy; no deposit language; no DEMO badge widget (product declined) |

## Open Questions (RESOLVED)

1. **How to add Vite without breaking Vitest / ARCH-02?**
   - RESOLVED: Manual Vite install; keep Vitest node env; **update** architecture package.json test to allow `vite` while scanning logic/shared; verify dual `vitest run` + `vite build`.

2. **Install pixi.js in Phase 2?**
   - RESOLVED: **No.** Clarify STACK: “shell timing” means Vite composition root + stoppable clock ready for ticker — **not** unused Pixi dependency or Application.init. Phase 3 installs `pixi.js@^8` (8.21.0 verified) and mounts into `#game-canvas-host`.

3. **rAF → ticker handoff?**
   - RESOLVED: `startRafClock` returns `stop`; Phase 3 stops then binds `app.ticker`. Same `game.tick(deltaMs)` + `hud.render(getSnapshot())`.

4. **HUD binder pattern / folders?**
   - RESOLVED: Imperative DOM under `src/games/crash/hud/` (`CrashHud.ts`, `enablement.ts`, `chips.ts`, `historyStrip.ts`, `format.ts`); HTML structure in `index.html`; styles in `src/styles/hud.css`.

5. **Enablement matrix?**
   - RESOLVED: Table above; durable phases are waiting/flying due to settle→waiting `[VERIFIED]`.

6. **Chip values?**
   - RESOLVED: `[10, 25, 50, 100, 250, 500]`; chips fill input only; Place Bet submits.

7. **History strip?**
   - RESOLVED: Newest-first reverse of `snapshot.history`; colors `&lt;2` / `2–10` / `&gt;10`; show all ≤20 with horizontal scroll.

8. **Small live multiplier in bottom bar?**
   - RESOLVED: **Yes** — required for headless recruiter play (PLAY-02 without canvas). Not in canvas slot.

9. **Auto CO chrome?**
   - RESOLVED: Always-visible number input + Clear in center zone; empty = `setAutoCashOut(null)`; sync from snapshot when not focused.

10. **resetWallet / broke UX?**
    - RESOLVED: Left zone under/near balance; always available “Reset demo”; emphasize when broke / `placeBet` reason `broke`.

11. **VIS-02 without Pixi controls?**
    - RESOLVED: HTML overlay = all monetary UI; reserved empty host = Pixi’s future canvas ownership. Counts as VIS-02 for Phase 2 success criterion 4.

12. **What NOT to do?**
    - RESOLVED: No React; no big HTML mult in canvas slot; no logic rules in HUD; no DOM-owned balance; no create-pixi overwrite; no Pixi Application; no localStorage; no DEMO badge UI; no `pixi.js/html-source` for HUD.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Vite 6.4.3 pairs cleanly with Vitest 3.2.7 in this repo | Standard Stack | Build/test friction — try vite 6.3.x or isolate configs |
| A2 | Terminal phases are not durable in snapshots | Enablement | If logic later keeps cashed_out visible, extend matrix |
| A3 | Chip fill-only (not auto-place) is better UX | Chips | If product wants one-tap bet, change handler only |
| A4 | Forbidding pixi.js in package.json until Phase 3 is cleaner | ARCH-02 update | Harmless to allow early install if planner disagrees — still no Application |
| A5 | Horizontal scroll for 20 history pills fits right zone | History | Phase 4 may retune density |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vite / Vitest | ✓ | v24.18.0 | Node 20 LTS |
| npm | Install | ✓ | 11.16.0 | — |
| vite@6.4.3 registry | Shell | ✓ | 6.4.3 | — |
| pixi.js registry | Phase 3 only | ✓ | 8.21.0 | Do not install Phase 2 |
| Existing GameLogic | HUD bridge | ✓ | createGame facade | — |
| Graphify graph | Research enrichment | ✗ | — | Skipped |

**Missing dependencies with no fallback:** none for Phase 2 research  
**Blockers:** none — ARCH-02 test update is a known required task, not a blocker

## Sources

### Primary (HIGH confidence)
- `.planning/phases/02-vite-shell-html-hud/02-CONTEXT.md` — D-01..D-04 + discretion `[VERIFIED: read this session]`
- `.planning/REQUIREMENTS.md` — VIS-02, WALT-03, WALT-05 `[VERIFIED]`
- `.planning/ROADMAP.md` — Phase 2 goal, plans 02-01..02-03 `[VERIFIED]`
- `.planning/STATE.md` — Phase 2 planning position `[VERIFIED]`
- `.planning/research/ARCHITECTURE.md` — shell / HUD / logic seams `[VERIFIED]`
- `.planning/research/STACK.md` — Vite + vanilla HTML; create-pixi tip `[VERIFIED]`
- `.planning/research/PITFALLS.md` — logic-in-view, overlay, history bounds `[VERIFIED]`
- `.planning/phases/01-gamelogic-core/01-RESEARCH.md` — format template `[VERIFIED]`
- Phase 1 summaries / VERIFICATION — facade stable, 37 tests, ARCH-02 gate `[VERIFIED]`
- `src/games/crash/logic/*` — createGame contract, History order, settle→waiting `[VERIFIED: source]`
- `package.json` / `tsconfig.json` / `vitest.config.ts` / `tests/architecture.no-pixi.test.ts` `[VERIFIED]`
- `.claude/.cursor/rules` — stack + no React + GameLogic≠Pixi `[VERIFIED]`
- Pixi skills: create (existing project = install only), application (Phase 3 init), html-source (**not** HUD pattern) `[VERIFIED: skills]`
- `npm view` live versions `[VERIFIED: npm registry this session]`

### Secondary (MEDIUM confidence)
- Exact chip set and history CSS density — discretionary genre defaults `[ASSUMED]`
- Vite 8 deferral — legitimacy too-new heuristic from Phase 1 vitest audit pattern `[ASSUMED]`

### Tertiary (LOW confidence)
- Whether Phase 4 will keep three-zone proportions on mobile — deferred; D-01..D-03 costly but CSS retunable

## Metadata

**Confidence breakdown:**
- Standard stack / Vite pin: **HIGH** — registry-verified; Pixi correctly deferred
- Architecture / binder / slots: **HIGH** — CONTEXT + ARCHITECTURE + verified facade
- Discretion UX (chips/history/auto CO): **MEDIUM** — resolved with clear defaults, easy to retune
- Pitfalls: **HIGH** — includes Phase 2-specific ARCH-02 gate landmine

**Research date:** 2026-09-26  
**Valid until:** ~2026-10-26 (re-check vite 6 vs 8 + vitest if planning slips)

## Research Complete Checklist

- [x] `02-CONTEXT.md` locked decisions honored (D-01..D-04, carried constraints)
- [x] Phase requirements VIS-02 / WALT-03 / WALT-05 mapped
- [x] Existing GameLogic contract verified from source
- [x] npm versions live-verified (vite, pixi.js, typescript, vitest)
- [x] STACK “Pixi in Phase 2” clarified → install Vite only; no Application
- [x] ARCH-02 package.json gate called out as required update
- [x] Claude's Discretion items resolved with recommendations
- [x] Code examples for layout, binder, rAF, chips, history, enablement
- [x] Phase 3 integration contracts documented
- [x] No PLAN.md created; no `src/` implementation
- [x] Section structure matches `01-RESEARCH.md`

---
*Phase: 2 — Vite Shell + HTML HUD*  
*Researched: 2026-09-26*
)
