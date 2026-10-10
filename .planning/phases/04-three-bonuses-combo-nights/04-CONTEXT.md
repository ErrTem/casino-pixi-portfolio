# Phase 4: Three Bonuses + Combo Nights - Context

**Gathered:** 2026-10-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the Phase 3 combo-queue stub with real Witch Pots–style features: Green free spins (24, elevated Wild density on reels 2–5), Red Hold & Win (5×4 sticky cash, 3 respins reset on new cash), Purple locker Pick'em, and ordered combo nights including nesting during free spins where config allows. VHS gamble, paytable overlay, and Howler sample packs stay out of this phase.

</domain>

<decisions>
## Implementation Decisions

### Green free spins
- **D-01:** Auto-run all 24 free spins (no tap-per-spin) — portfolio feature should feel continuous
- **D-02:** Remaining-spins counter lives in the **DOM strip** (with combo / win chrome), not Pixi-over-CRT
- **D-03:** Enter FS via **full-screen splash → tap continue → auto-run** (same cadence as other features)
- **D-04:** Exit FS via **total-win splash → tap → continue** (base or next queue step / night total)
- **D-05:** Green **can retrigger mid-FS** — diskette tokens may add free spins; chance is **config-driven** — **Reversibility:** costly — becomes part of the feature math contract and session FSM

### Red Hold & Win
- **D-06:** Stage Hold **in-place on the CRT 5×4** (sticky cash on the reel window; empty cells themed) — matches live Witch Pots Pumpkin Hold, not a separate scene — **Reversibility:** costly — reel view must support a Hold mode overlay on the same grid
- **D-07:** Enter via **full-screen splash → tap → Hold board**
- **D-08:** During Hold, **jackpot strip (MIN / MID / MAX / ULTRA)** replaces the three phones above the CRT
- **D-09:** Exit via **total-win splash** (include jackpot callout if won) → tap → base / next queue step
- **D-10:** Mechanics stay Witch Pots–shaped from PROJECT/REQUIREMENTS: 3 respins that reset on new cash symbols; full-grid / jackpot path; prizes from existing `bonusPrizes` / `jackpotMultipliers` config tables (illustrative, not certified RTP)

### Purple locker Pick'em
- **D-11:** Round ends after a **fixed pick count**, then auto-total (not collect-until-stopper, not clear-all, not 3-match jackpot pick rules)
- **D-12:** Stage as a **full-screen locker overlay** (hide/dim CRT; dedicated pick grid) — unlike Hold’s in-place transform
- **D-13:** Board size **12 lockers, 5 picks**; prize ladder from config `bonusPrizes` (`pickEm`)
- **D-14:** Enter/exit chrome matches other features: **splash → tap → board**; after 5th pick **total-win splash → tap → base/queue**
- **D-15:** Creative skin stays **lockers** (not Witch Pots bats) — already locked in PROJECT.md

### Combo queue + nesting
- **D-16:** Carry Phase 3 **fixed queue order Green → Red → Purple** (only phones that fired)
- **D-17:** Nesting: **pause FS → run nested Red/Purple in queue order → resume remaining FS** — **Reversibility:** costly — session busy FSM must support stack/resume around features
- **D-18:** During nested play, DOM combo strip shows **full night path + highlight current** (e.g. `COMBO: Green → Red → Purple` with active step lit)
- **D-19:** When the whole combo night finishes, show **one night-total splash → tap → base** (sum of feature wins that night)
- **D-20:** Spin stays **locked** through features, splashes, and nesting (extend Phase 3 D-14); no skip/interrupt in v1

### Carried from prior phases (do not reopen)
- Pixi scene / DOM HUD split; phones above CRT; portrait-first stack
- Queue order Green → Red → Purple; phone glow + DOM combo strip
- Zod backend-shaped config already has `bonusPrizes` + `jackpotMultipliers`; consume and extend as needed
- Shell beep `AudioPort` for feature events; Howler sample pack deferred
- Custom ticker motion (no GSAP); Retro Computer font; art pipeline = request list → user places PNGs

### Claude's Discretion
- Exact illustrative FS wild-weight bumps, Hold cash prize draws, Pick'em prize assignment, and retrigger odds in sample JSON (plausible studio-looking, not certified RTP)
- Exact splash copy, neon colors, Hold empty-cell theme, locker art layout within 12-cell grid
- Exact respin-lives chrome (e.g. three icons) and jackpot strip typography
- Whether night-total splash is skipped when the night was a single non-nested feature (still show that feature’s own exit splash)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and requirements
- `.planning/ROADMAP.md` — Phase 4 goal, success criteria, BONUS-01..04
- `.planning/REQUIREMENTS.md` — BONUS-01, BONUS-02, BONUS-03, BONUS-04
- `.planning/PROJECT.md` — Witch Pots mechanics notes, locker/diskette creative locks, art pipeline
- `.planning/STATE.md` — current milestone position after Phase 3
- `.planning/phases/03-diskette-collectors-trigger-queue/03-CONTEXT.md` — queue order, stub drain, Spin lock, triggerChance, meter reset
- `.planning/phases/02-hotline-base-playable/02-CONTEXT.md` — config envelope, Pixi/DOM split, win cycle, phones layout
- `.planning/phases/01-portfolio-shell-crash-session/01-CONTEXT.md` — shell AudioPort / session ownership

### Live reference (discussion)
- `https://endorphina.com/games/3-witch-pots/play` — live demo observed 2026-10-11: in-place Hold board, splash cadence, jackpot strip replacing pots, 5×4 sticky cash, 3-life respin chrome

### Layout references
- `.planning/phases/02-hotline-base-playable/witch-pots-layout-ref.jpg` — collectors above reels
- `.planning/phases/02-hotline-base-playable/witch-pots-winline-ref.jpg` — win-line presentation

### HOTLINE code to extend
- `src/games/hotline/logic/collectors/ComboQueue.ts` — ordered queue; replace stub drain with real features
- `src/games/hotline/session/mountHotlineSession.ts` — busy FSM (`stub` → real bonus phases + nesting)
- `src/games/hotline/session/collectPresentation.ts` — combo strip formatting
- `src/games/hotline/logic/HotlineGame.ts` — spin settlement; FS / Hold / Pick'em math
- `src/games/hotline/config/HotlineConfigSchema.ts` — `bonusPrizes`, `jackpotMultipliers`; extend for FS/Hold/Pick'em runtime knobs as needed
- `src/games/hotline/config/hotline.config.json` — sample feature tables
- `src/games/hotline/view/HotlineScene.ts` / `PhonesLayer.ts` — Hold jackpot strip swap; splash layers
- `src/games/hotline/hud/HotlineHud.ts` — FS counter, combo path highlight, Spin lock
- `src/shared/audio/AudioPort.ts` — widen/map SFX events for bonus lifecycle beeps

### Stack constraints
- `AGENTS.md` — Zod config, custom reels, Howler deferred, Retro Computer, logic/view/hud split

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `createComboQueue` / `orderComboQueue` — fixed Green→Red→Purple ordering already tested
- Phase 3 stub path in `mountHotlineSession` (`present === "stub"`) — replace beat/pop with real feature runners
- `HotlineHud.setCombo` / `setBusy` — extend for FS remaining count + current-step highlight
- Config `bonusPrizes` (`freeSpins`, `holdAndWin`, `pickEm`) and `jackpotMultipliers` — already Zod-validated
- Win cycle + token flight gate — features start after collectors/triggers settle (carry D-13/D-14)

### Established Patterns
- `logic` / `view` / `hud` / `session` under `src/games/hotline/`
- Ticker-driven motion; Vitest for pure math/config/HUD without canvas
- Bundled config parse at mount; bad config throws
- Pixi for scene chrome; DOM for monetary controls and combo strip

### Integration Points
- Replace stub drain with a feature controller that can pause/resume Green FS around nested Red/Purple
- View: Hold mode on reel grid + jackpot strip; Pick'em as full-screen overlay; shared splash component
- HUD: FS remaining, combo path highlight, Spin disabled across entire night
- Asset load: request Hold cash / locker / splash art list when implementation needs pixels

</code_context>

<specifics>
## Specific Ideas

- Live Witch Pots session confirmed Hold is an **in-place** 5×4 transform with splash + jackpot strip; HOTLINE should feel the same structurally, Miami-dressed
- Shared splash cadence across Green / Red / Purple / night-total keeps the demo readable
- Purple deliberately simplifies vs Witch Pots bat match-jackpots: fixed 5 picks on 12 lockers for portfolio clarity
- Nesting + night-total splash are the “combo night” signature for BONUS-04

</specifics>

<deferred>
## Deferred Ideas

None new from discussion — stayed in phase scope.

Already roadmap-deferred (do not pull into Phase 4):
- Phase 5: VHS SURVIVE/DIE gamble, paytable/rules overlay (BASE-04), responsive polish (PRES-02)
- Howler sample pack (keep beeps)
- Turbo / autoplay (BASE-V2)

</deferred>

---

*Phase: 4-Three Bonuses + Combo Nights*
*Context gathered: 2026-10-11*
