# Phase 3: Diskette Collectors + Trigger Queue - Context

**Gathered:** 2026-10-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Base spins collect colored diskette tokens into three rotary phones: tokens overlay reel cells and fly in; phone meters grow via signal bars; landing a token can randomly trigger that phone's bonus into an ordered combo queue. Phase 3 ships a **queue stub** (presentation + drain beats) — real Green / Red / Purple bonus features stay in Phase 4.

</domain>

<decisions>
## Implementation Decisions

### Token spawn + flight
- **D-01:** Rename `tokenOdds.perSpinChance` keys from pink/cyan/yellow to **green / red / purple** in Zod + `hotline.config.json` so config colors match phone art — **Reversibility:** costly — schema, sample JSON, and any fixtures/tests that assert the old color names must migrate together
- **D-02:** On a successful per-color spawn roll, show the diskette as an **overlay on a random cell** (does not replace the reel symbol), then fly to the matching phone
- **D-03:** Flight motion is a **short neon arc** (bezier hop with ticker easing — same motion stack as Crash/HOTLINE reels, no GSAP)
- **D-04:** If multiple colors hit on the same spin, fly **in parallel** (all arcs at once)

### Phone meter growth
- **D-05:** Fill feedback is **discrete signal bars under each phone** (0…`meterTarget` steps)
- **D-06:** `meterTarget` is a **soft cap** — bars fill to N and stay full; more tokens can still land/fly; trigger odds are **not** raised by fill level
- **D-07:** Reset **that phone's** meter when **that phone's** bonus triggers (other phones keep their counts)
- **D-08:** Draw bars with **procedural Pixi Graphics** — no dedicated meter PNG pack for v1

### Trigger + combo queue
- **D-09:** Add per-color **`triggerChance`** under features/`tokenOdds` (Zod + JSON); independent roll **on each token land** after the arc completes — **Reversibility:** costly — becomes part of the backend-shaped config contract Phase 4 expects
- **D-10:** Combo presentation = **phone glow + DOM queue strip** (e.g. `COMBO: Green → Red`) — keep monetary controls out of `#game-canvas-host`
- **D-11:** Queue order is **fixed Green → Red → Purple**, including only phones that fired that spin
- **D-12:** Phase 3 stub **highlights + short beat per queue entry**, pops the entry, resets that phone's meter as it pops, then returns to base play — no fake mini-games and no Continue taps between steps

### Spin timing vs tokens
- **D-13:** Run token overlays/flights **after the win cycle finishes** (or immediately after reel stop when there are no wins)
- **D-14:** **Lock Spin** through token flights and the combo stub; re-enable only when settled — no queue-next-spin and no skip/interrupt in v1
- **D-15:** **Request a PNG asset list** for three diskette tokens (green/red/purple); user generates and places under `public/assets/hotline/` — same art pipeline as Phase 2
- **D-16:** Extend shell **beep** `AudioPort` events for token spawn / fly land / phone trigger / queue step (no Howler sample pack yet)

### Carried from prior phases (do not reopen)
- Phones above CRT; Pixi scene / DOM HUD split; portrait-first stack
- Full Witch Pots–shaped config already validated; Phase 3 consumes `tokenOdds` (+ new `triggerChance`)
- Custom first-party reel/ticker motion; Retro Computer font; portfolio comment/voice rules
- Real bonuses (FS / Hold & Win / Pick'em) and nesting are Phase 4

### Claude's Discretion
- Exact illustrative `triggerChance` numbers in sample JSON (plausible studio-looking, not certified RTP)
- Exact arc duration, easing curve, and neon stroke color
- Exact bar segment size/gap/neon under phones
- Exact DOM combo-strip copy and stub beat lengths
- Which random cell is chosen for an overlay (uniform among 20 cells; avoid stacking two overlays on the same cell when multiple colors hit)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and requirements
- `.planning/ROADMAP.md` — Phase 3 goal, success criteria, COLL-01..03
- `.planning/REQUIREMENTS.md` — COLL-01, COLL-02, COLL-03; BONUS-* deferred to Phase 4
- `.planning/PROJECT.md` — diskette/phone creative locks, art pipeline, Witch Pots mechanics notes
- `.planning/STATE.md` — current milestone position after Phase 2
- `.planning/phases/02-hotline-base-playable/02-CONTEXT.md` — config envelope, phones layout, win cycle, audio beeps, Pixi/DOM split
- `.planning/phases/01-portfolio-shell-crash-session/01-CONTEXT.md` — shell AudioPort / session ownership

### Layout references (from Phase 2)
- `.planning/phases/02-hotline-base-playable/witch-pots-layout-ref.jpg` — collectors above reels

### HOTLINE code to extend
- `src/games/hotline/config/HotlineConfigSchema.ts` — `tokenOdds` schema (rename colors; add `triggerChance`)
- `src/games/hotline/config/hotline.config.json` — sample feature tables
- `src/games/hotline/logic/HotlineGame.ts` — spin settlement (today ignores feature tables)
- `src/games/hotline/view/PhonesLayer.ts` — inert phones; add meters / glow API
- `src/games/hotline/view/HotlineScene.ts` — scene layout for overlays + flights
- `src/games/hotline/view/winCycle.ts` — win presentation gate before tokens (D-13)
- `src/games/hotline/hud/HotlineHud.ts` — DOM combo strip + Spin lock (D-10, D-14)
- `src/games/hotline/session/mountHotlineSession.ts` — wire logic ↔ view ↔ HUD
- `src/games/hotline/view/loadHotlineAssets.ts` — load diskette textures after art drop-in
- `src/shared/audio/AudioPort.ts` — widen/map SFX events for collector beeps

### Stack constraints
- `AGENTS.md` — Zod config, custom reels, Howler deferred, Retro Computer, logic/view/hud split

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PhonesLayer` — three phone sprites laid out above the CRT; extend with bar Graphics + glow without changing slot order (green/red/purple L→R)
- `tokenOdds` in Zod/JSON — `meterTarget` + `perSpinChance` already present; Phase 2 tests assert logic ignores feature tables until this phase
- `createWinCycle` / win overlay — natural gate before token presentation (D-13)
- `HotlineHud` Spin enable/disable patterns — extend for flight/stub lock (D-14)
- Shell `AudioPort` / beep adapter — same unlock-on-Spin path; add collector event IDs

### Established Patterns
- `logic` / `view` / `hud` under `src/games/hotline/`
- Ticker-driven motion (reel stagger, last-win tween) — reuse for arcs and stub beats
- Vitest for pure math/config/HUD helpers without canvas
- Bundled config parse at mount; bad config throws

### Integration Points
- Roll token spawns + trigger chances in logic after (or as part of) spin settlement; emit a structured outcome for view
- View: spawn overlays in reel window space, animate to phone positions from `PhonesLayer`
- HUD: combo strip + keep Spin disabled across win cycle → tokens → stub
- Asset load path: add diskette URLs beside existing `PHONE_URLS` once files exist

</code_context>

<specifics>
## Specific Ideas

- Color rename is intentional — drop pink/cyan/yellow so config reads like the phones
- Soft-cap meters are feedback, not a second RNG; trigger stays on land `triggerChance`
- Combo night in Phase 3 is a **readable stub**, not placeholder bonuses
- Diskette art follows the Phase 2 list → user generate → `public/assets/hotline/` pipeline

</specifics>

<deferred>
## Deferred Ideas

None new from discussion — stayed in phase scope.

Already roadmap-deferred (do not pull into Phase 3):
- Phase 4: Green free spins, Red Hold & Win, Purple locker Pick'em, nested combo nights
- Phase 5: VHS gamble, paytable overlay (BASE-04), responsive polish (PRES-02)
- Howler sample pack (keep beeps until then)

</deferred>

---

*Phase: 3-Diskette Collectors + Trigger Queue*
*Context gathered: 2026-10-10*
