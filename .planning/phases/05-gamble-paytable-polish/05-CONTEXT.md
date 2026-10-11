# Phase 5: Gamble + Paytable + Polish - Context

**Gathered:** 2026-10-11
**Status:** Ready for planning

<domain>
## Phase Boundary

After line wins the visitor can risk on VHS SURVIVE/DIE (double-or-nothing, up to 10 rounds, line wins only), open a paytable/rules overlay, and play comfortably on desktop and mobile viewports. Bonus feature totals stay non-gambleable. Howler sample packs and deep-link shell work stay out of this phase.

</domain>

<decisions>
## Implementation Decisions

### Gamble offer timing
- **D-01:** Add a **Gamble** control on the HOTLINE HUD (with Spin / bet). Disabled by default; enabled only when a **base line win** is available after win cycle + collectors/night settle — never mid-feature — **Reversibility:** costly — session busy FSM and Spin enable rules must treat gamble-offer as a settled-base state
- **D-02:** While Gamble is offered, **Spin keeps the win and clears the offer** (classic take-and-spin)
- **D-03:** After a successful SURVIVE, **return to base HUD**; Gamble stays enabled for the new amount until Spin (chain up to 10 rounds via repeated HUD entry, not a sticky VHS screen)
- **D-04:** **No explicit Collect / Take** button — Spin (or equivalent move-on) banks and clears Gamble

### VHS SURVIVE/DIE presentation
- **D-05:** Round plays in a **full-screen DOM overlay** (same family as `FeatureOverlay` / locker) — CURRENT WIN / GAMBLE TO WIN style chrome; not Pixi-on-CRT
- **D-06:** Player chooses with **two big buttons: SURVIVE / DIE** (equal-chance double-or-nothing; labels are the skin)
- **D-07:** On resolve: **instant result** on the overlay (amount update / DIE flash) then **auto-close** back to HUD — no Continue tap, no long result beat
- **D-08:** **Request a small PNG pack** for VHS frame / button art via the usual user art pipeline (`public/assets/hotline/`) — **Reversibility:** reversible — CSS-only fallback possible if art is late, but pack is the intended v1 look

### Paytable / rules overlay
- **D-09:** **Info / Paytable** button on the HOTLINE DOM strip (not shell-menu-only)
- **D-10:** Content is **one scrollable sheet** — sections stacked: symbols → phones & bonuses → gamble
- **D-11:** Symbol **payout numbers live from** the Zod-parsed `paytable` in config — **Reversibility:** costly — overlay becomes a consumer of the backend-shaped paytable contract
- **D-12:** Info may open **anytime**; opening **pauses play** until closed (X / dismiss)

### Responsive polish
- **D-13:** Desktop strip: **compact icon row** for Gamble / Info; Spin stays large
- **D-14:** Hard QA floor: **phone portrait ~360×640** — CRT + HUD usable, no horizontal scroll — **Reversibility:** costly — layout/CSS and touch targets are planned against this floor
- **D-15:** Must **adapt for desktop and mobile** (not desktop-only). Landscape: keep **portrait column + letterbox** (Phase 2 D-11) — no landscape redesign
- **D-16:** Mobile HUD is **spin-centric** like Witch Pots mobile — large center Spin; bet ±, Gamble, Info as compact icons around it — **Reversibility:** costly — diverges from current strip-only HUD; desktop may keep strip, mobile uses spin hub

### Carried from prior phases (do not reopen)
- Gamble skin is VHS SURVIVE/DIE, not card compare (PROJECT.md)
- GAMBLE-02: line wins only; not bonus feature totals
- DOM overlays for feature chrome; money controls out of `#game-canvas-host`
- Portrait-first composition; Retro Computer font; shell `AudioPort` beeps (Howler deferred)
- Busy/Spin lock through features and presentation (Phases 3–4)

### Claude's Discretion
- Exact busy-FSM edge cases for enabling Gamble after collectors/night (D-01 timing details)
- Landscape: letterbox only, no rotate-to-play nag unless height makes controls unusable
- Gamble beep event IDs and minor overlay copy tone
- Asset list granularity for VHS PNGs (planner drafts; user generates)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and requirements
- `.planning/ROADMAP.md` — Phase 5 goal, success criteria, UI hint
- `.planning/REQUIREMENTS.md` — GAMBLE-01, GAMBLE-02, BASE-04, PRES-02
- `.planning/PROJECT.md` — VHS SURVIVE/DIE creative lock; Witch Pots mechanics; art pipeline

### Prior phase decisions
- `.planning/phases/04-three-bonuses-combo-nights/04-CONTEXT.md` — feature overlays, busy FSM, deferred gamble/paytable
- `.planning/phases/03-diskette-collectors-trigger-queue/03-CONTEXT.md` — win-cycle → collectors gate; Spin lock
- `.planning/phases/02-hotline-base-playable/02-CONTEXT.md` — portrait-first D-11; Pixi/DOM split; paytable in Zod JSON

### Live / layout references (discussion)
- `.planning/phases/05-gamble-paytable-polish/witch-pots-gamble-ref.png` — Witch Pots gamble panel (CURRENT WIN / GAMBLE TO WIN); HOTLINE uses VHS SURVIVE/DIE, not cards
- `.planning/phases/05-gamble-paytable-polish/witch-pots-mobile-ref.jpg` — Witch Pots mobile spin-centric HUD reference
- https://newslotgames.net/endorphina/3-witch-pots.html#demo — live Endorphina demo for UI cadence

### HOTLINE code to extend
- `src/games/hotline/hud/FeatureOverlay.ts` — DOM overlay pattern for VHS gamble + paytable
- `src/games/hotline/hud/HotlineHud.ts` — Spin / bet strip; add Gamble + Info; mobile spin-centric layout
- `src/games/hotline/session/mountHotlineSession.ts` — busy FSM; gamble offer after settle; Info pause
- `src/games/hotline/logic/HotlineGame.ts` — line wins / wallet credit; gamble math hook
- `src/games/hotline/config/HotlineConfigSchema.ts` + `hotline.config.json` — paytable for live rules overlay; add gamble config if needed
- `src/styles/hud.css` — `.hotline-screen` portrait column; feature overlay styles; responsive rules

### Stack constraints
- `.planning/research/STACK.md` — PixiJS v8, Zod, AudioPort beeps first; no GSAP / pixi-reels

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `mountFeatureOverlay` — splash + locker binder outside canvas; extend or sibling for VHS gamble + rules scroll
- `HotlineHud` Spin enable/disable + last-win tween — gamble button enable ties to settled line win
- Session `busy` flag in `mountHotlineSession` — Info pause and gamble offer gating
- Zod `paytable` already validated and used by `evaluatePaylines` — feed rules overlay

### Established Patterns
- Pixi scene vs DOM HUD split; monetary controls never in `#game-canvas-host`
- Portrait column `max-width: 34rem` with desktop letterbox
- Feature presentation: DOM overlays + Spin lock through busy
- Art: request ASSET-LIST → user drops PNGs under `public/assets/hotline/`

### Integration Points
- After win cycle + collectors/night clear → enable Gamble when `lineWins` total > 0 and not in feature
- Spin click while gamble offered → clear offer, start next spin (win already credited)
- SURVIVE/DIE → update gamble stake / wallet; close overlay; re-enable Gamble or clear on DIE
- Info open → pause busy interactions; close → resume

</code_context>

<specifics>
## Specific Ideas

- Witch Pots gamble panel shows CURRENT WIN vs GAMBLE TO WIN amounts — reuse that chrome language on the VHS overlay even though picks are SURVIVE/DIE buttons, not cards
- User confirmed VHS is double-or-nothing (double / lose win amount), up to 10 rounds
- Mobile reference: large center Spin with compact icons around it (Witch Pots mobile / Winline-style chrome around the demo)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. Howler sample packs and shell deep-link remain prior backlog / v2.

</deferred>

---

*Phase: 5-Gamble + Paytable + Polish*
*Context gathered: 2026-10-11*
