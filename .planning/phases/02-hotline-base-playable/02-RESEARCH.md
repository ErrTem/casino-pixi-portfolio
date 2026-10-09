# Phase 2: HOTLINE Base Playable - Research

**Researched:** 2026-10-09
**Domain:** Client-only PixiJS v8 slot (5×4 / 40-line), Zod backend-shaped config, Crash-aligned session mount
**Confidence:** HIGH (brownfield Crash/shell patterns + locked CONTEXT); MEDIUM (exact Witch Pots symbol set / 40 payline coordinates — discretionary)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Ship a **full Witch Pots–shaped** Zod schema and JSON in Phase 2 (bet steps, symbols, weights, paytable, paylines, plus token odds / bonus prizes / jackpot multipliers). Phase 2 runtime only uses base fields; unused tables are still validated — **Reversibility:** costly — schema and fixtures become the contract Phase 3–4 expect; shrinking later means migration of sample JSON and parsers
- **D-02:** Unused feature tables use **illustrative but runnable** numbers (plausible studio-looking weights/prizes; not certified RTP; not joke placeholders)
- **D-03:** Config is **bundled** under `src/games/hotline/config/`; import + Zod parse at HOTLINE mount; **bad config throws** (failed mount / loud console) — no soft DOM error panel
- **D-04:** Top-level JSON uses a **backend-ish envelope**: `{ gameId, version, math, features, paytable, ... }` with nested tables
- **D-05:** **Request a clear asset list in Phase 2**; user generates and places files; ship with real (or near-real) art — not procedural placeholders as the primary presentation
- **D-06:** First pack = **must-have + inert phone silhouettes**: rooftop backdrop, CRT/monitor frame, paying symbols + Wild animal mask, three rotary phones (no diskette flight / meter growth until Phase 3)
- **D-07:** Deliver as **loose PNGs** under `public/assets/hotline/` (Crash-style separate files; no atlas required for v1 base)
- **D-08:** Dirty CRT/VHS look is **baked into the frame art**; code mainly positions the frame — **Reversibility:** reversible — code overlays can be added later without rewriting the pack contract
- **D-09:** **Crash-like Pixi / DOM split** — Pixi: title, phones, rooftop, CRT reels. DOM: Spin, bet −/+, balance, last win, fixed 40-lines readout, plus shell Menu/mute. Keep `#game-canvas-host` free of monetary controls (existing shell layout tests)
- **D-10:** Three phones sit **above the monitor** (Witch Pots meters-over-reels). Layout reference: `.planning/phases/02-hotline-base-playable/witch-pots-layout-ref.jpg`
- **D-11:** **Portrait-first** composition like Witch Pots; on desktop letterbox or use a tall column — **Reversibility:** costly — scene camera/layout and HUD CSS assume a tall stack; landscape-first would rework composition
- **D-12:** **HOTLINE title lives in the Pixi scene** above the phones (Retro Computer)
- **D-13:** Phase 2 DOM strip is **core only**: Spin, bet −/+, balance, last win, “40 lines”. No turbo/auto (autoplay is BASE-V2)
- **D-14:** Spin motion is a **readable left-to-right stagger** (clear stops; not snappy overshoot physics)
- **D-15:** Wins show **glowing payline path + framed winning cells** plus a **brief DOM last-win count-up**. Match Witch Pots win presentation; reference: `.planning/phases/02-hotline-base-playable/witch-pots-winline-ref.jpg`
- **D-16:** Multiple wins **cycle one line at a time** with a per-line pay callout; DOM shows total win count-up
- **D-17:** Phase 2 audio uses **shell AudioPort beeps** — extend event IDs for spin / reel-stop / win; unlock on Spin; no Howler sample pack yet — **Reversibility:** costly — widening `SfxEvent` (or a mapped game-local union) touches shared audio; Howler later must keep the same mute/unlock port

### Carried from prior phases (do not reopen)
- Shell owns long-lived Pixi `Application` + `AudioPort`; HOTLINE is a thin session adapter like Crash
- Fresh session every launch; boot `?seed=` reused across menu hops
- Per-game demo balances; Menu returns home; Retro Computer font
- User supplies art after agent asset list; portfolio voice / comment style rules
- Custom first-party reel view (no `pixi-reels` / GSAP)

### Claude's Discretion
- Exact Zod field names within the agreed envelope sections
- Exact stagger timings and win-line neon color (Hotline neon, not Witch green)
- Exact beep pitch mapping for new SFX events
- Desktop letterbox vs tall-column sizing details within portrait-first rule
- Symbol count / naming in the asset list (Witch Pots–analogue set, Hotline Miami reskin)

### Deferred Ideas (OUT OF SCOPE)
None new from discussion — stayed in phase scope.

Already roadmap-deferred (do not pull into Phase 2):
- Phase 3: diskette flight, phone meter growth, trigger queue
- Phase 4: green/red/purple bonuses + combo nights
- Phase 5: VHS gamble, paytable overlay (BASE-04), responsive polish (PRES-02)
- v2: `?game=` deep-link, shared wallet, simple autoplay (BASE-V2-01)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CFG-01 | HOTLINE loads bet steps, symbol weights, token odds, bonus prizes, and jackpot multipliers from backend-shaped JSON validated at boot | Full Witch Pots–shaped Zod schema + bundled JSON under `src/games/hotline/config/`; `.parse` at mount throws (D-01..D-04); Phase 2 runtime consumes base fields only |
| BASE-01 | 5×4 grid, 40 fixed paylines, wins left-to-right from reel 1 | Config `paylines` as 40×5 row-index paths; pure `evaluatePaylines` in `logic/`; custom reel view shows 5×4 window |
| BASE-02 | Spin, bet within config steps, balance + last win | Session wallet (cents) + DOM HUD (Spin, −/+, balance, last win, “40 lines”); bet steps from config |
| BASE-03 | Paytable pays; Wild (animal mask) substitutes | LTR consecutive match + wild substitute; highest combo per line; sum lines; Pure Vitest coverage |
| PRES-01 | Motel rooftop sunset, CRT/VHS frame, Retro Computer font | Loose PNGs in `public/assets/hotline/`; Pixi title with loaded TTF; baked CRT frame art (D-05..D-08, D-12) |
</phase_requirements>

## Summary

Phase 2 enables HOTLINE as a real session on the Phase 1 shell: mirror `mountCrashSession`, flip `enabled: true` in the registry, and ship a new `src/games/hotline/` tree (`config` / `logic` / `view` / `hud` / `session`). Math and bet/spin settlement stay canvas-free and Vitest-tested. Presentation is a portrait Pixi stack (title → inert phones → CRT-framed 5×4 reels) with a slim DOM strip for money controls — never inside `#game-canvas-host`.

Config is the contract for Phases 3–4: install `zod`, ship the full envelope (including unused feature tables with plausible numbers), and fail loud on bad JSON. Reels are first-party (strip `Container` + `Graphics` mask + LTR stagger). Audio stays on shell beeps with widened event IDs — Howler is out of scope. Art is a user handoff after a concrete filename/size list; without that pack, PRES-01 cannot close.

**Primary recommendation:** Plan Wave 0 as Zod + full config + pure payline/spin math tests; Wave 1 as session/HUD/registry enablement; Wave 2 as custom reels + win feedback; Wave 3 as asset-list checkpoint → art drop-in → PRES-01 polish — all on the existing Crash session/dispose pattern.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Game registry / menu launch | Browser / Client | — | Shell router + `GameDefinition.mount` already own navigation |
| Zod config parse at mount | Browser / Client | CDN / Static (bundled JSON) | Client-only demo; no API; fail loud in session mount |
| Seeded spin + payline math | Browser / Client | — | Pure logic module; no Pixi/DOM |
| Wallet / bet steps / last win | Browser / Client | — | Per-game demo balance in session logic + DOM HUD |
| 5×4 reel strip + stagger stop | Browser / Client | — | First-party Pixi view on shell `Application` |
| Win-line neon + cell frames | Browser / Client | — | Pixi overlays; DOM only for total count-up |
| Rooftop / CRT / phones / title | Browser / Client | CDN / Static (PNGs + TTF) | Pixi scene; assets from `public/` + shared font |
| Mute / unlock / Menu | Browser / Client | — | Shared `AudioPort` + shell chrome; unlock on Spin |
| Backend / DB | — | — | Explicitly out of scope |

## Project Constraints (from .cursor/rules/)

No `.cursor/rules/` directory in this repo. Actionable constraints come from `AGENTS.md` / PROJECT.md:

- PixiJS v8, TypeScript, Vite, Vitest; Crash `logic` / `view` / `hud` split
- Client-only JSON configs; Zod for backend-shaped parse
- Custom reels — no `pixi-reels` / GSAP
- Retro Computer TTF from `src/shared/fonts/`
- Art: request clear asset list; user generates and places files
- Comments: lowercase; no trailing period; no special symbols
- Portfolio voice: short human phrasing; minimize AI fingerprints
- GSD: start work via GSD commands before file-changing tools (planner/executor)

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `pixi.js` | `8.21.0` (pinned in repo; npm latest `8.22.0`) | Scene, Assets, Text, masks, ticker | Already shipping Crash; do not bump mid-feature [VERIFIED: package.json deps + `npm view pixi.js version` → `8.22.0`] |
| TypeScript | `~5.8.3` | Typed logic/view split | Matches toolchain [VERIFIED: package.json] |
| Vite | `^6.4.3` | Dev/build, static `public/` assets | Existing [VERIFIED: package.json] |
| Vitest | `^3.2.7` | Unit tests for config/math/HUD helpers | Existing; node env [VERIFIED: package.json + vitest.config.ts] |
| `seedrandom` | `^3.0.5` via `createRng` | Seeded U(0,1) for reel outcomes | Repo seam; CFG-02 already shipped [VERIFIED: src/shared/rng/createRng.ts:1-11] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zod` | `4.6.5` (registry current) | Parse backend-shaped HOTLINE JSON | **Install this phase** — CFG-01 [VERIFIED: `npm view zod version` → `4.6.5`] |
| PixiJS `Assets` | (via pixi.js) | Load PNG symbols + TTF | Crash already uses `Assets.load` for PNGs [VERIFIED: src/games/crash/view/Backdrop.ts:24-35,353] |
| PixiJS `Text` | (via pixi.js) | HOTLINE title (static/infrequent) | Load font then `fontFamily` [CITED: pixijs-assets fonts skill / Pixi Assets fonts] |
| Shell `AudioPort` + beeps | in-repo | Spin / stop / win SFX | D-17 — extend `SfxEvent`; no Howler [VERIFIED: src/shared/audio/AudioPort.ts:1-9] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom reel + mask | `pixi-reels` + GSAP | Forbidden by stack / CONTEXT |
| Zod 4 | Hand-written guards | Weaker “backend-shaped” claim; more brittle for Phase 3–4 tables |
| Beep `AudioPort` | Howler samples | Deferred to later phase (D-17) |
| Loose PNGs | Spritesheet atlas | Atlas optional later; D-07 locks loose files for base |
| Pin pixi `8.21.0` | Jump to `8.22.0` | Chore after HOTLINE green |

**Installation:**

```bash
npm install zod@^4.6.5
```

Do **not** install `howler` / `@types/howler` in Phase 2 (D-17).

**Version verification (this session):** `zod@4.6.5`, `pixi.js` latest `8.22.0` (repo stays on `8.21.0`), `seedrandom@3.0.5`, Node `v24.18.0`, npm `11.16.0`, `tsc` `5.8.3`.

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `zod` | npm | Latest publish 2026-09-13 (v4.6.5); package long-lived | ~324M/wk | github.com/colinhacks/zod | SUS (`too-new` on latest publish) | Flagged — planner must add `checkpoint:human-verify` that the install is official `zod` from colinhacks (not a lookalike). No `postinstall` script. Signals otherwise clean. |

**Packages removed due to [SLOP] verdict:** none

**Packages flagged as suspicious [SUS]:** `zod` — false-positive risk on version publish date; still gate install identity per protocol.

*Howler / pixi-reels / gsap: not recommended for this phase — omitted from install list.*

## Architecture Patterns

### System Architecture Diagram

```text
[Menu tile HOTLINE]
        │ launch(id)
        ▼
[shell/router] ──epoch AbortSignal──► [mountHotlineSession]
        │                                    │
        │ ShellContext{app,audio,seed,root}  │
        │                                    ├─ import JSON → HotlineConfigSchema.parse ──X throws → router onError → menu
        │                                    ├─ createHotlineGame(seed, config)  [logic]
        │                                    ├─ mountHotlineHud(screen)          [DOM]
        │                                    └─ mountHotlineView(app)            [Pixi]
        │                                           │
        │                                           ├ rooftop + CRT frame + phones + title
        │                                           └ reels (5 strips, Graphics mask, stagger)
        ▼
[app.ticker] ──deltaMS──► view.sync + optional win-cycle
        ▲
        │ Spin click → audio.unlock + play(spin) → game.spin() → settle paylines → credit wallet → HUD last-win count-up
```

### Recommended Project Structure

```
src/games/hotline/
├── config/
│   ├── hotline.config.json      # full Witch Pots–shaped tables
│   ├── HotlineConfigSchema.ts   # Zod schema + z.infer type
│   └── loadHotlineConfig.ts     # import JSON + parse (throw)
├── logic/
│   ├── Wallet.ts                # cents wallet (Crash pattern)
│   ├── SpinEngine.ts            # weighted strip / window sample via Rng
│   ├── evaluatePaylines.ts      # LTR + wild; returns LineWin[]
│   ├── HotlineGame.ts           # spin / bet / snapshot
│   └── index.ts
├── view/
│   ├── mountHotlineView.ts
│   ├── HotlineScene.ts          # portrait layout
│   ├── reels/                   # strip + mask + stagger
│   ├── WinLinesOverlay.ts       # neon path + cell frames + LINE N PAYS
│   ├── PhonesLayer.ts           # inert silhouettes
│   └── loadHotlineAssets.ts     # Assets.load PNG + font
├── hud/
│   ├── HotlineHud.ts
│   ├── format.ts                # reuse/adapt Crash formatMoney
│   └── lastWinTween.ts          # DOM count-up (balanceTween pattern)
└── session/
    └── mountHotlineSession.ts   # clone template, host canvas, dispose
public/assets/hotline/           # user-placed PNGs
index.html                       # #hotline-screen-template
```

### Pattern 1: Session mount mirrors Crash

**What:** Clone `#hotline-screen-template`, attach `ctx.app.canvas` to `#game-canvas-host`, create game + HUD + view, ticker sync, dispose without destroying shell app/audio.

**When to use:** Every game session under the shell.

**Evidence:** `mountCrashSession` already does this [VERIFIED: src/games/crash/session/mountCrashSession.ts:16-137].

### Pattern 2: Pure logic boundary

**What:** `logic/` and `shared/` must not import `pixi.js` or use `document.` / `window.` — enforced by architecture tests that today scan Crash logic + shared [VERIFIED: tests/architecture.no-pixi.test.ts:5-28,65-78]. Extend scans to `src/games/hotline/logic` when added.

**When to use:** Always for math/config.

### Pattern 3: Zod parse at boundary

**What:** `HotlineConfigSchema.parse(raw)` on mount; success yields typed config; failure throws `ZodError` and aborts mount (router already `catch` → `reportError` → menu) [VERIFIED: src/shell/router.ts:84-90] [CITED: zod.dev/basics — `.parse` throws `ZodError`].

### Pattern 4: Custom masked reel strips

**What:** Each reel is a vertical strip `Container` of symbol `Sprite`s; parent uses `Graphics` rect as `mask` for the 4-row window; stop by easing strip `y` to symbol pitch × index; stagger reel 0→4 (D-14). Leaves cannot nest children — wrap cells in Containers [CITED: pixijs-scene-core-concepts — mask + leaf rule].

### Pattern 5: Audio event widen

**What:** Today `SfxEvent = "bet_lock" | "takeoff" | "cash_out" | "crash"` [VERIFIED: src/shared/audio/AudioPort.ts:1-2]. Add HOTLINE events (recommend `"spin" | "reel_stop" | "win"`) and map pitches in `createBeepAudioPort` `PITCH_HZ` [VERIFIED: src/shared/audio/createBeepAudioPort.ts:38-43]. Keep Crash events working.

### Anti-Patterns to Avoid

- **Monetary controls in `#game-canvas-host`:** Shell layout tests forbid `data-action` / `data-field` inside the host [VERIFIED: tests/shell.hud-layout.test.ts:81-91]. HOTLINE template must keep Spin/bet/balance in DOM chrome outside the host.
- **Soft config errors:** D-03 forbids DOM error panels — throw and let router log/return.
- **Consuming feature tables in Phase 2 runtime:** Schema validates them; collectors/bonuses stay inert.
- **Pixi text for per-frame win digits:** Prefer DOM count-up (Crash `balanceTweenValue`) for last-win; use Pixi `Text` only for static title [CITED: pixijs-scene-text — Text update cost].
- **Installing Howler / pixi-reels this phase:** Locked out by D-17 and stack.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Config validation | Ad-hoc `typeof` trees | `zod` `.parse` | Nested tables + Phase 3–4 contract |
| Seeded RNG | `Math.random` | `createRng(ctx.seed)` | CFG-02 parity [VERIFIED: createRng.ts:8-11] |
| Money math | Float display units in logic | Integer cents helpers | Existing `shared/money/cents` [VERIFIED: src/shared/money/cents.ts:14-27] |
| Session lifecycle | Destroy `app` / recreate AudioPort | Crash-style session dispose | Shell owns app/audio |
| Reel physics engine | GSAP / pixi-reels | Ticker + mask strip | Stack lock |
| Font loading inventiveness | Manual FontFace without Assets | `Assets.load` + `data.family` | Matches Pixi skill guidance |

**Key insight:** The expensive unique work is payline math + custom reel presentation + config contract — not frameworks.

## Common Pitfalls

### Pitfall 1: Nested Zod fields as plain objects
**What goes wrong:** Runtime TypeError (`traits`) instead of clean `ZodError`.
**Why it happens:** Zod 4 allows recursive typing looseness; nested `{ a: z.number() }` without `z.object` passes TS but fails at parse [CITED: github.com/colinhacks/zod/issues/5218].
**How to avoid:** Every nested object is `z.object({...})`; add a schema unit test that expects throw on malformed fixture.
**Warning signs:** Mount crashes with non-ZodError.

### Pitfall 2: Wild-leading line ambiguity
**What goes wrong:** Wrong payout when line starts with wilds then a paying symbol.
**Why it happens:** Both wild-only and substituted runs can be valid; industry practice pays the higher of the two [CITED: StakeEngine math-sdk win-types / lines docs].
**How to avoid:** Implement dual-track evaluation; optionally define wild pays only at 5-kind in illustrative paytable to reduce ties.
**Warning signs:** Unit fixtures with `[W,W,W,A,A]` disagree with expected table.

### Pitfall 3: Art / mount race
**What goes wrong:** Session enabled before PNGs exist → blank/broken PRES-01.
**Why it happens:** D-05 requires user art after asset list.
**How to avoid:** Plan an explicit asset-list deliverable + human art checkpoint before marking PRES-01 done; keep mount behind `enabled: true` only when assets load (or fail loud on missing required URLs).
**Warning signs:** `Assets.load` rejects; empty stage.

### Pitfall 4: Destroying shell Application on leave
**What goes wrong:** Menu relaunch broken; audio disposed.
**Why it happens:** Copying naive Pixi teardown.
**How to avoid:** Copy Crash dispose: remove ticker, destroy scene, detach canvas, remove screen — never `app.destroy()` / `audio.dispose()` in session [VERIFIED: mountCrashSession.ts:59-77].
**Warning signs:** Second launch throws; mute broken.

### Pitfall 5: Crash-only architecture scans miss HOTLINE
**What goes wrong:** Pixi leaks into `hotline/logic` unnoticed.
**How to avoid:** Extend `architecture.no-pixi.test.ts` `LOGIC_DIRS` to include `src/games/hotline/logic`.
**Warning signs:** Logic imports `pixi.js`.

### Pitfall 6: Portrait layout on wide desktop
**What goes wrong:** Reels stretch; phones collide with chrome.
**Why it happens:** D-11 locks portrait-first; Crash HUD is landscape-ish.
**How to avoid:** Letterbox or tall centered column in scene + CSS; do not landscape-reflow v1.
**Warning signs:** Reference layout ratios diverge from `witch-pots-layout-ref.jpg`.

## Code Examples

### Zod config load (fail loud)

```typescript
// Source: zod.dev/basics (.parse throws ZodError)
import * as z from "zod";
import raw from "./hotline.config.json";

export const HotlineConfigSchema = z.object({
  gameId: z.literal("hotline"),
  version: z.string(),
  math: z.object({
    rows: z.literal(4),
    reels: z.literal(5),
    paylineCount: z.literal(40),
    betStepsCents: z.array(z.number().int().positive()).min(1),
    // weights, strips, etc. (discretionary field names)
  }),
  paytable: z.object({
    // symbolId -> counts -> multiplier or cents-per-bet-unit
  }),
  features: z.object({
    // token odds / bonus prizes / jackpots — validated, unused in Phase 2 runtime
  }),
});

export type HotlineConfig = z.infer<typeof HotlineConfigSchema>;

export function loadHotlineConfig(): HotlineConfig {
  return HotlineConfigSchema.parse(raw);
}
```

### Registry enablement

```typescript
// Mirror crash entry; today hotline is stub:
// [VERIFIED: src/shell/gameRegistry.ts:22-28]
// id: "hotline", enabled: false — no mount
{
  id: "hotline",
  title: "HOTLINE",
  blurb: "Neon motel slot",
  iconUrl: "/assets/menu/icon-hotline.png",
  enabled: true,
  async mount(ctx) {
    const { mountHotlineSession } = await import(
      "../games/hotline/session/mountHotlineSession.js"
    );
    return mountHotlineSession(ctx);
  },
}
```

### Payline evaluation skeleton (LTR + wild)

```typescript
// Evaluation rule cited from StakeEngine lines docs + Rational Jokrz payline PDF:
// consecutive from reel 0; wild substitutes; highest combo per line; sum lines.
export type LineWin = {
  lineIndex: number;
  symbolId: string;
  count: number;
  payoutCents: number;
  cells: Array<{ reel: number; row: number }>;
};

export function evaluatePaylines(args: {
  grid: string[][]; // [reel][row] length 5 x 4
  paylines: number[][]; // 40 lines of 5 row indices
  paytable: Record<string, Record<number, number>>; // mult of bet
  wildId: string;
  betCents: number;
}): LineWin[] {
  // for each line: walk LTR building substituted run + wild-only run; pick higher payout
  return [];
}
```

### Font load for Pixi title

```typescript
// Source: Pixi Assets fonts skill (Agents skills pixijs-assets/references/fonts.md)
import { Assets, Text } from "pixi.js";

await Assets.load({
  alias: "retro-computer",
  src: "/src/shared/fonts/retrocomputerrusbydaymarius.ttf",
  // prefer copying/serving under public if Vite path awkward — discretionary
  data: { family: "Retro Computer" },
});

const title = new Text({
  text: "HOTLINE",
  style: { fontFamily: "Retro Computer", fontSize: 48, fill: 0xff2a6d },
});
```

DOM already declares the same family via `@font-face` [VERIFIED: src/styles/hud.css:1-5].

### Recommended asset list (D-05 deliverable)

Planner should emit this list in a plan task for the user (filenames under `public/assets/hotline/`):

| File | Role | Suggested size |
|------|------|----------------|
| `backdrop-rooftop.png` | Motel rooftop sunset full-bleed behind CRT | 1080×1920 (portrait) |
| `frame-crt.png` | Dirty CRT/VHS bezel with transparent center for reels | 900×720 (open window ~5×4 cells) |
| `phone-green.png` | Inert rotary phone (left) | 256×256 |
| `phone-red.png` | Inert rotary phone (center) | 256×256 |
| `phone-purple.png` | Inert rotary phone (right) | 256×256 |
| `sym-wild-mask.png` | Wild animal mask | 128×128 |
| `sym-hi-*.png` (3–4) | High pays (Hotline reskin of Witch highs) | 128×128 |
| `sym-lo-*.png` (4–5) | Low pays | 128×128 |
| Optional: `cell-frame.png` | Win cell chrome if not drawn with Graphics | 128×128 |

Exact symbol count/names: Claude discretion (CONTEXT). No diskettes / meter fill art in Phase 2.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Crash-only boot | Shell menu + session mounts | Phase 1 (2026-10-09) | HOTLINE mounts like Crash |
| Hand config objects | Zod 4 backend-shaped JSON | Phase 2 | CFG-01 |
| Third-party reel kits | First-party ticker strips | Stack research | Matches Crash motion style |
| Howler for all SFX | Beeps now; Howler later | D-17 | Shared mute/unlock preserved |

**Deprecated/outdated:**
- Soft DOM config error UI for bad JSON — contradicted by D-03
- Atlas-first art for v1 base — contradicted by D-07

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Illustrative 40 payline coordinate set can be authored as any valid 5×4 LTR paths if Witch Pots exact map is unavailable | BASE-01 / Open Questions | Visual line paths may not match reference screenshots until corrected |
| A2 | Serving Retro Computer TTF via Vite/`Assets.load` from `src/shared/fonts` works; else copy to `public/fonts/` | PRES-01 | Title falls back to system font |
| A3 | Wild paytable entries optional beyond substitute; dual-track max(wild-only, substituted) is acceptable for portfolio | BASE-03 | Edge-case payouts differ from certified Witch math |
| A4 | `zod` SUS `too-new` is a false positive on latest publish date | Package audit | Checkpoint still required |
| A5 | Router `onError` + console is sufficient “loud fail” for bad config (no dedicated overlay) | CFG-01 / D-03 | User might miss console in casual playtest |

## Open Questions (RESOLVED)

1. **Exact 40 payline coordinates** — RESOLVED
   - What we know: Must be 40 fixed lines on 5×4, LTR from reel 1 (BASE-01, PROJECT.md).
   - What's unclear: Official Witch Pots line map not in repo.
   - Recommendation: Author a documented 40-line table in JSON; adjust later if reference overlays demand it. Flag as discretionary unless user supplies a map.
   - RESOLVED: Adopt illustrative documented 40×5 row-index paths in `hotline.config.json` (assumption A1). Exact Witch Pots coordinates are not required for Phase 2; correct later only if a user-supplied map arrives.

2. **Paytable units** — RESOLVED
   - What we know: Wins credit wallet in cents; bet steps in config.
   - What's unclear: Multipliers × bet vs absolute prize cents.
   - Recommendation: Prefer **multipliers of total bet** (or bet-per-line × line) stored as rationals/hundredths — document in schema comments; keep consistent for Phase 4 bonuses.
   - RESOLVED: Paytable entries are multipliers of total bet (assumption A3). `evaluatePaylines` computes `payoutCents` from multiplier × `betCents`; document in schema comments for Phase 4 bonus consistency.

3. **Font URL for Pixi Assets** — RESOLVED
   - What we know: DOM `@font-face` already points at `../shared/fonts/retrocomputerrusbydaymarius.ttf` [VERIFIED: hud.css:1-5].
   - What's unclear: Best `Assets.load` URL under Vite.
   - Recommendation: Try import URL / `public/` copy in Wave 2; verify title renders before PRES-01 sign-off.
   - RESOLVED: Load Retro Computer for Pixi title via `Assets.load` of the shared TTF at `src/shared/fonts/retrocomputerrusbydaymarius.ttf` (assumption A2). Copy to `public/fonts/` only if Vite URL resolution fails during PRES-01 wiring.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Toolchain | ✓ | v24.18.0 | — |
| npm | Install zod | ✓ | 11.16.0 | — |
| TypeScript (`tsc`) | Build gate | ✓ | 5.8.3 | — |
| Vite / Vitest | Dev + tests | ✓ | (package.json) | — |
| Browser DevTools | Visual QA PRES-01 | ✓ (assumed local) | — | Manual |
| User art pack | PRES-01 | ✗ until handoff | — | Block PRES-01; ship logic/HUD first |
| Howler samples | — | n/a | — | Not used Phase 2 |

**Missing dependencies with no fallback:**
- Final HOTLINE PNG pack (user-supplied) — blocks PRES-01 completion

**Missing dependencies with fallback:**
- None for code path (zod install is the only new package)

Step 2.6: External tools beyond Node/npm not required for implementation.

## Security Domain

> `security_enforcement` absent in `.planning/config.json` → treat as enabled. Client-only portfolio demo.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No accounts |
| V3 Session Management | no | In-memory game session only |
| V4 Access Control | no | No privileged APIs |
| V5 Input Validation | yes | Zod parse of bundled JSON; bet steps clamped to config; integer cents checks |
| V6 Cryptography | no | Demo RNG (`seedrandom`) — not fairness-critical |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malformed / hostile config JSON | Tampering | Zod `.parse` fail loud; schema literals for grid size |
| XSS via HUD strings | Tampering | No `.innerHTML` (shell architecture tests); textContent / Pixi Text only |
| Balance manipulation | Elevation | Client demo only — acceptable; still keep cents logic consistent |
| Dependency confusion on install | Tampering | Package legitimacy checkpoint for `zod` |

## Sources

### Primary (HIGH confidence)
- In-repo: `02-CONTEXT.md`, `REQUIREMENTS.md`, `ROADMAP.md`, `STATE.md`, `STACK.md`, Crash session/shell/audio/tests (paths cited inline)
- [VERIFIED: npm registry] `npm view zod version` → `4.6.5`; `package-legitimacy check` on `zod`
- [CITED: zod.dev/basics] `.parse` / `ZodError` / `safeParse`
- [CITED: Pixi Agents skills] Assets fonts, scene masking/leaf rules, Text update costs

### Secondary (MEDIUM confidence)
- [CITED: StakeEngine math-sdk lines / win-types] LTR paylines, wild dual-track max payout
- [CITED: Rational Jokrz Wild Jackpot payline PDF] consecutive LTR; highest per line; sum lines
- [CITED: github.com/colinhacks/zod/issues/5218] nested plain-object schema pitfall

### Tertiary (LOW confidence)
- Exact Witch Pots 40-line coordinate table — not found in-repo; treat as authored illustrative data until user corrects

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — pinned repo + npm view this session; Howler correctly excluded
- Architecture: HIGH — Crash/shell patterns read and cited with line ranges
- Pitfalls: MEDIUM — Zod/payline pitfalls from official/community docs; art handoff process from CONTEXT

**Research date:** 2026-10-09
**Valid until:** ~2026-11-08 (30 days; stack stable)

**Nyquist note:** `.planning/config.json` has `workflow.nyquist_validation: false` — Validation Architecture section omitted per protocol. Prefer reusing Phase 01 verify commands: `npx tsc --noEmit`, `npx vitest run`, `npx vite build`, `npm test` / `npm run build`.
