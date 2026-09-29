# Phase 6: enhance and rework UI/buttons/behavior - Context

**Gathered:** 2026-09-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Rework the Crash demo chrome and feel before milestone close: compact no-scroll shell (phone/tablet/desktop), JetX-like control layout (top balance/reset/mute → history → canvas → Auto bet / Auto cash out → BET±/presets), BET↔CASH OUT with live win amount, remove Seed chip (keep silent `?seed=`), mild authoritative climb slowdown, and arcade-centered craft with scrolling graph. No dual-bet panels, no lobby/shell framework, no real-money features.

</domain>

<decisions>
## Implementation Decisions

### Shell / chrome layout
- **D-01:** Full-viewport **100dvh** column: top chrome (money icon + balance, Reset demo, mute) → history strip → canvas (flex grow) → Auto cash out + Auto bet switches → large primary BET/CASH OUT + stake ± input + presets. No page scroll; history may swipe horizontally. — **Reversibility:** costly — reverses Phase 2/4 bottom-bar-only chrome assumptions.
- **D-02:** English labels (BET, CASH OUT, Auto bet, Auto cash out). JetX screenshot is layout/reference only (not Russian copy, not dual-bet / X2).
- **D-03:** Preset chips: **20 / 50 / 100 / ALL** plus free-form via ± input (replace `10/25/50/100/250/500`). ALL = max allowed vs balance/rules.
- **D-04:** Auto cash out UI = **toggle + ± multiplier field** (WALT-04 remains editable).
- **D-05:** Keep Phase 5 polish in compact shell: waiting countdown (canvas), session avg/max near history, Space/Enter cash-out with input-focus guard.

### Primary button / win amount
- **D-06:** Live win amount (stake × current ×) shows **on the CASH OUT button only** (JetX dual-line). — **Reversibility:** costly — primary CTA chrome and enablement styling hang on this.
- **D-07:** Waiting: primary shows **BET + stake amount** (dual-line).
- **D-08:** After personal cash-out (spectator finish): **frozen cashed amount + disabled “CASHED OUT”** until crash → waiting.
- **D-09:** Crash with no cash-out: **snap back to BET + stake** as soon as waiting — no CRASHED button state.

### Auto bet
- **D-10:** Auto bet ON → **auto-place the same stake every waiting round** as soon as waiting allows a bet. — **Reversibility:** one-way — new product behavior; HUD/composition-root auto-place loop and broke handling depend on it.
- **D-11:** Place next stake **immediately when waiting starts** (not after countdown ends).
- **D-12:** On insufficient balance / broke: **stop Auto bet** and emphasize Reset demo.
- **D-13:** While Auto bet ON, player may still edit stake / presets / Auto CO; edits apply to the **next** auto-place.

### Climb feel (GameLogic)
- **D-14:** Mild authoritative slowdown: retune `growthRatePerMs` so ~**2× at ~3.5–4s** (was ~2.5s). — **Reversibility:** costly — settlement timing, tests, and feel all share this constant.
- **D-15:** Crash distribution unchanged (house edge / floor / cap / RNG) — only growth rate changes.
- **D-16:** Soften Phase 3 path mapping as part of arcade camera (not keep steeper-after-~2× as-is).

### Arcade camera / craft
- **D-17:** Craft stays **near screen center**; graph/trail **scrolls under** it (camera follows tip mid-frame). — **Reversibility:** costly — replaces path-tip-follow view contract from Phase 3.
- **D-18:** Craft orientation: **mostly level / gentle tilt** (not hard path-tangent).
- **D-19:** Crash FX unchanged: trail severs red, craft vanishes, brief flash, hold, idle; camera freezes at crash frame.
- **D-20:** Theater × stays **upper third**, clear of the craft.

### Seed surface
- **D-21:** Remove **Seed chip** and on-screen seed UX; keep **silent `?seed=`** boot for QA/replay. — **Reversibility:** costly — adjusts PLSH-03 product contract.
- **D-22:** Missing/invalid `?seed=` → quiet fallback to `"portfolio-demo"` (no on-screen note).
- **D-23:** Adjust PLSH-03 wording to “optional silent `?seed=` boot only; no Seed chip / on-screen seed.”
- **D-24:** Keep `parseBootSeed` helper + tests; delete/stop wiring `seedChip` HUD only.

### Claude's Discretion
- Exact `growthRatePerMs` constant that lands ~2× in the 3.5–4s band.
- Exact soft path-mapping params for arcade scroll camera within D-16/D-17.
- Exact 100dvh zone height budget (top chrome / history / bottom controls) so canvas remains playable on small phones without page scroll.
- Auto-bet implementation site (composition root vs HUD binder) as long as D-10–D-13 hold and GameLogic stays pure.
- ALL chip semantics edge cases (rounding to max affordable within min/max).
- Whether Auto cash-out ± field is disabled or dimmed when Auto cash-out toggle is OFF (recommend dimmed/disabled when OFF).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project scope
- `.planning/PROJECT.md` — HTML + Pixi; GameLogic ≠ Pixi; no DEMO badge; portfolio demo
- `.planning/REQUIREMENTS.md` — WALT/VIS/ARCH/PLSH (PLSH-03 adjusted per D-23)
- `.planning/ROADMAP.md` — Phase 6 entry / goal placeholder to refine in planning

### Prior phase decisions
- `.planning/phases/01-gamelogic-core/01-CONTEXT.md` — growth curve D-09/D-12; continuous waiting D-14; wallet/broke
- `.planning/phases/02-vite-shell-html-hud/02-CONTEXT.md` — HTML monetary chrome (layout superseded by D-01)
- `.planning/phases/03-pixi-hybrid-view/03-CONTEXT.md` — theater ×; crash sever; path mapping (softened by D-16/D-17)
- `.planning/phases/04-mobile-harden/04-CONTEXT.md` — touch targets; safe-area; no page-steal (chrome model updated by D-01)
- `.planning/phases/05-polish/05-CONTEXT.md` — countdown/mute/seed/stats/keyboard (seed chip reversed by D-21)

### Layout reference
- User-attached JetX screenshot (workspace assets) — top balance, history pills, centered craft feel, Auto bet / Auto cash out toggles, ± stake, presets, CASH OUT with amount

### Existing integration (code)
- `src/styles/hud.css` / `index.html` — shell to rebuild for D-01
- `src/games/crash/hud/CrashHud.ts` / `chips.ts` / `enablement.ts` / `seedChip.ts` — chrome rework; remove seed chip wiring
- `src/games/crash/logic/config.ts` / `MultiplierCurve.ts` — growthRatePerMs (D-14)
- `src/games/crash/view/CrashScene.ts` / `pathMapping.ts` / `Rocket.ts` / `CurveGraph.ts` — arcade camera (D-17–D-20)
- `src/shared/boot/parseBootSeed.ts` — keep (D-24)
- `src/main.ts` — composition root; auto-bet loop candidate; seed boot

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CrashHud` enablement / chromeMode — retarget to BET↔CASH OUT dual-line and Autobet toggle
- `PRESET_CHIPS` — replace values; ALL chip needs max-affordable fill helper
- `mutePref` / AudioPort — keep mute in top chrome
- `sessionStats` / `historyStrip` — keep near top history
- `formatWaitCountdown` / TheaterText — keep canvas countdown
- `parseBootSeed` — silent boot only
- `growthRatePerMs` / `multiplierAt` — single knob for D-14
- View pathMapping + Rocket — rewrite follow to camera-centered scroll

### Established Patterns
- GameLogic pure; HUD/view observe snapshots
- Chips fill input only (no placeBet on chip click) — preserve unless ALL implies fill-to-max only
- Broke never auto-resets wallet — Auto bet must stop (D-12)

### Integration Points
- Shell CSS + `index.html` zones for top/history/canvas/bottom
- Composition root ticker: detect waiting edge → auto `placeBet` when Auto bet ON
- Primary button binder: stake/win amount dual-line from snapshot
- Pixi scene sync: camera offset so craft stays mid-frame while trail scrolls

</code_context>

<specifics>
## Specific Ideas

- Reference layout: JetX-style compact controls (balance top-right area, history under header, Auto bet / Auto cash out switches, large green CASH OUT with amount).
- “Aircraft should stay centered while moving smoothly up and down along the graph” → D-17 scrolling graph under fixed craft.
- Delete seed **button** and related **UI** logic; keep silent `?seed=` for QA.

</specifics>

<deferred>
## Deferred Ideas

- Dual simultaneous bets / X2 panel (screenshot has X2 — explicitly out of Phase 6)
- Full removal of `?seed=` boot path (user chose UI-only removal)
- Stronger arcade crash FX (eject/explode) — rejected; keep today’s sever
- Retuning crash RNG distribution — rejected for this phase

</deferred>

---

*Phase: 6-enhance-and-rework-ui-buttons-behavior*
*Context gathered: 2026-09-29*
