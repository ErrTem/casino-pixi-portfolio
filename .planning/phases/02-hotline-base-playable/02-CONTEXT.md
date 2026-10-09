# Phase 2: HOTLINE Base Playable - Context

**Gathered:** 2026-10-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Visitor launches HOTLINE from the portfolio menu and plays base spins on a 5×4 / 40-line game: bet/balance HUD, Wild (animal mask) substitutes, Zod-validated backend-shaped JSON (full Witch Pots tables present; Phase 2 only consumes base fields), and Hotline Miami motel rooftop + CRT framing with inert rotary-phone silhouettes. Collectors, bonuses, and gamble stay out of this phase.

</domain>

<decisions>
## Implementation Decisions

### Config schema
- **D-01:** Ship a **full Witch Pots–shaped** Zod schema and JSON in Phase 2 (bet steps, symbols, weights, paytable, paylines, plus token odds / bonus prizes / jackpot multipliers). Phase 2 runtime only uses base fields; unused tables are still validated — **Reversibility:** costly — schema and fixtures become the contract Phase 3–4 expect; shrinking later means migration of sample JSON and parsers
- **D-02:** Unused feature tables use **illustrative but runnable** numbers (plausible studio-looking weights/prizes; not certified RTP; not joke placeholders)
- **D-03:** Config is **bundled** under `src/games/hotline/config/`; import + Zod parse at HOTLINE mount; **bad config throws** (failed mount / loud console) — no soft DOM error panel
- **D-04:** Top-level JSON uses a **backend-ish envelope**: `{ gameId, version, math, features, paytable, ... }` with nested tables

### Scene art handoff
- **D-05:** **Request a clear asset list in Phase 2**; user generates and places files; ship with real (or near-real) art — not procedural placeholders as the primary presentation
- **D-06:** First pack = **must-have + inert phone silhouettes**: rooftop backdrop, CRT/monitor frame, paying symbols + Wild animal mask, three rotary phones (no diskette flight / meter growth until Phase 3)
- **D-07:** Deliver as **loose PNGs** under `public/assets/hotline/` (Crash-style separate files; no atlas required for v1 base)
- **D-08:** Dirty CRT/VHS look is **baked into the frame art**; code mainly positions the frame — **Reversibility:** reversible — code overlays can be added later without rewriting the pack contract

### Rooftop + HUD layout
- **D-09:** **Crash-like Pixi / DOM split** — Pixi: title, phones, rooftop, CRT reels. DOM: Spin, bet −/+, balance, last win, fixed 40-lines readout, plus shell Menu/mute. Keep `#game-canvas-host` free of monetary controls (existing shell layout tests)
- **D-10:** Three phones sit **above the monitor** (Witch Pots meters-over-reels). Layout reference: `.planning/phases/02-hotline-base-playable/witch-pots-layout-ref.jpg`
- **D-11:** **Portrait-first** composition like Witch Pots; on desktop letterbox or use a tall column — **Reversibility:** costly — scene camera/layout and HUD CSS assume a tall stack; landscape-first would rework composition
- **D-12:** **HOTLINE title lives in the Pixi scene** above the phones (Retro Computer)
- **D-13:** Phase 2 DOM strip is **core only**: Spin, bet −/+, balance, last win, “40 lines”. No turbo/auto (autoplay is BASE-V2)

### Reel stop + win feedback
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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and requirements
- `.planning/ROADMAP.md` — Phase 2 goal, success criteria, requirements CFG-01, BASE-01..03, PRES-01
- `.planning/REQUIREMENTS.md` — CFG-01, BASE-01..03, PRES-01; BASE-04 / PRES-02 / collectors / bonuses / gamble deferred
- `.planning/PROJECT.md` — HOTLINE creative locks, art pipeline, stack constraints, comment/style rules
- `.planning/STATE.md` — shell Application ownership, per-game balances, Phase 1 decisions
- `.planning/phases/01-portfolio-shell-crash-session/01-CONTEXT.md` — session/mute/seed/menu locks to inherit

### Layout / win feedback references (user-supplied)
- `.planning/phases/02-hotline-base-playable/witch-pots-layout-ref.jpg` — portrait stack: title → three collectors above → 5×4 reels → controls
- `.planning/phases/02-hotline-base-playable/witch-pots-winline-ref.jpg` — neon payline path, framed cells, LINE N PAYS callout, total win

### Shell / session integration
- `src/shell/types.ts` — `ShellContext`, `GameSession`, `GameDefinition`
- `src/shell/gameRegistry.ts` — HOTLINE currently `enabled: false` with no mount
- `src/shell/router.ts` — menu ↔ game routing / epoch abort
- `src/games/crash/session/mountCrashSession.ts` — session mount/dispose pattern to mirror
- `tests/shell.hud-layout.test.ts` — canvas host must stay free of monetary controls

### Audio / RNG / money
- `src/shared/audio/AudioPort.ts` — shared port; Crash-only `SfxEvent` today (widen or map for HOTLINE)
- `src/shared/audio/createBeepAudioPort.ts` — beep adapter until Howler samples exist
- `src/shared/boot/parseBootSeed.ts` — `?seed=` seam (CFG-02 already shipped)
- `src/shared/rng/createRng.ts` — seeded U(0,1) for HOTLINE outcomes

### Stack constraints
- `AGENTS.md` — Zod config boundary, custom reels, Howler deferred until SFX, Retro Computer font, logic/view/hud split

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `mountCrashSession` — template for HOTLINE session: clone screen, attach canvas host, ticker, dispose without destroying shell app/audio
- `parseBootSeed` / shell `seed` — pass into HOTLINE RNG at session create
- Shell `AudioPort` — unlock on Spin; extend play events for reel SFX
- Money/HUD formatting patterns from Crash (`format`, last-win, balance display) — adapt for single-bet slot HUD
- Retro Computer font already used on menu — load for Pixi title + DOM HUD `@font-face`

### Established Patterns
- `logic` / `view` / `hud` separation under `src/games/<game>/`
- DOM HUD in `#app` screen template; Pixi in `#game-canvas-host`
- Vitest for math/config/HUD pure helpers (no canvas required for paylines/Zod)
- HMR / leave: dispose session-owned tickers and scene; shell app survives

### Integration Points
- Enable HOTLINE in `gameRegistry.ts` with `mount` → `mountHotlineSession`
- New tree under `src/games/hotline/` (`config`, `logic`, `view`, `hud`, `session`)
- Assets under `public/assets/hotline/` loaded via Pixi `Assets`
- Menu tile already has icon; flip `enabled: true` when session mounts

</code_context>

<specifics>
## Specific Ideas

- User referenced **3 Witch Pots** screenshots for layout (phones/pots above reels, portrait stack) and win feedback (neon polyline through winning symbols, purple frames, “LINE N PAYS”, centered total win)
- Creative locks stay Hotline Miami: motel rooftop sunset, CRT/VHS frame, rotary phones, diskette tokens later, animal-mask Wild
- Agent must produce a **concrete asset list** (filenames, sizes, roles) before expecting art drop-in

</specifics>

<deferred>
## Deferred Ideas

None new from discussion — stayed in phase scope.

Already roadmap-deferred (do not pull into Phase 2):
- Phase 3: diskette flight, phone meter growth, trigger queue
- Phase 4: green/red/purple bonuses + combo nights
- Phase 5: VHS gamble, paytable overlay (BASE-04), responsive polish (PRES-02)
- v2: `?game=` deep-link, shared wallet, simple autoplay (BASE-V2-01)

</deferred>

---

*Phase: 2-HOTLINE Base Playable*
*Context gathered: 2026-10-09*
