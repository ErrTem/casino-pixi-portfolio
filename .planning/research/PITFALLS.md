# Pitfalls Research

**Domain:** PixiJS v8 portfolio — Witch Pots–like slot (HOTLINE: Hold & Win, FS wild density, pick’em, token meters, gamble) + multi-game shell over existing Crash
**Researched:** 2026-10-09
**Confidence:** MEDIUM

## Critical Pitfalls

### Pitfall 1: Destroying or forking Application per game switch

**What goes wrong:**
Menu launches Crash then HOTLINE by creating a second `Application`, or by `destroy()`ing Crash’s app with global resource teardown. Textures flicker, batchers die, or the next game renders black / garbage. Orphaned `ticker` callbacks from `main.ts` keep ticking Crash logic under HOTLINE.

**Why it happens:**
Crash currently owns `Application` inside `mountCrashView` and registers the game loop in `main.ts`. HMR-only teardown (`releaseGlobalResources: true`) is easy to copy as “the way to leave a game.” PixiJS v8 GPU pools are not fully isolated across applications (see pixijs#11694).

**How to avoid:**
Prefer **one** `Application` for the portfolio session and swap scene roots (menu / Crash / HOTLINE). If recreate-is-required, remove ticker handlers first, dispose DOM HUD + audio listeners, destroy with `releaseGlobalResources: false` until final tab exit, and never leave Crash’s `onTick` registered. Give every game a `mount` / `unmount` contract that mirrors Crash’s `dispose` but covers ticker + HUD + scene.

**Warning signs:**
- Second launch shows blank canvas, WebGL errors, or “texture already destroyed”
- FPS drops after switching games twice
- Crash auto-bet / HUD still updating while HOTLINE is visible
- Memory climbs with each menu visit

**Phase to address:**
**Phase: Multi-game shell / menu** — before HOTLINE mounts. Verify Crash → menu → Crash and Crash → HOTLINE → Crash without GPU corruption.

---

### Pitfall 2: Dual math — UI re-rolls Hold & Win / bonuses

**What goes wrong:**
Respin outcomes, cash values, or jackpot path are decided again in the Pixi driver (or in a second RNG stream). Settlement totals disagree with the logic module; seeded replay diverges; “demo looks rigged” in review.

**Why it happens:**
Teams animate first, then “also need a coin here,” copy the decide loop into the view. Portfolio pressure favors visible motion over a pure event stream.

**How to avoid:**
One pure logic source of truth: inject RNG once, emit an ordered event list (`lock`, `respin`, `land`, `resetCounter`, `fullGrid`, `end`). View **replays** only. Vitest pins seeded transcripts byte-stable. Never call `Math.random` from view code.

**Warning signs:**
- Same `?seed=` yields different H&W totals on refresh
- UI total ≠ logic total after a full-grid path
- “Fix animation” PRs that touch RNG draw order

**Phase to address:**
**Phase: Red Hold & Win** (also applies to base spin / FS / pick / gamble). Establish event-stream pattern in base spin phase so bonuses inherit it.

---

### Pitfall 3: Hold & Win locked-cell contamination

**What goes wrong:**
Locked cash symbols flicker, shift reel indices, or get overwritten on respin. Counter resets on value upgrades or collectors instead of **new** cash landings. Full grid never awards, or feature never ends.

**Why it happens:**
One mutable 5×4 grid mixes “locked ledger” and “spinning cells.” Termination checked only at feature start. Reset rules guessed from other titles.

**How to avoid:**
Separate ledger (locked positions + values) from free-cell spin set. After each respin wave: if any new qualifying land → counter = 3; else decrement; if counter = 0 or all 20 filled → terminate. Seed trigger with locked symbols from the triggering spin (reference: five bonus symbols onto 5×4). Config owns jackpot / cash tables — illustrative JSON, not certified RTP.

**Warning signs:**
- Locked sprites tween with free reels
- Counter resets when only a jackpot upgrade animation plays
- Feature stuck “spinning” with zero free cells

**Phase to address:**
**Phase: Red Hold & Win.**

---

### Pitfall 4: Token meters as visual fill gates (wrong trigger model)

**What goes wrong:**
Phones only fire when a meter “looks full,” or flight VFX invents which phone triggers. Combo nights never happen, or three bonuses start in the same frame and corrupt wallet / reel FSM. Reviewers notice meters that don’t match outcomes.

**Why it happens:**
Power-Combo marketing shows fill → trigger. Witch Pots–family behavior is closer to: token lands → pot grows → **random trigger may fire on land**; multiple phones can queue (HOTLINE locked: combo nights). Animation teams let flight completion “decide” settlement.

**How to avoid:**
Math ledger owns token counts + trigger rolls **before** animation. Diskette flight and phone growth are presentation of already-decided events. Combo = ordered **feature queue** (play Green then Red then Purple, or nested FS policy), never parallel mutation of one reel machine. Define meter reset rules when leaving a bonus.

**Warning signs:**
- Trigger without a matching token event in the spin transcript
- Two bonuses’ HUDs active and both accepting spin
- Meter UI “full” but logic count differs

**Phase to address:**
**Phase: Token → phone collectors** (queue plumbing). Extend in **Combo nights**.

---

### Pitfall 5: Free-spins wild density via boolean soup

**What goes wrong:**
Green 24 FS uses base reel strips, or “extra wilds” applied as sticky flags that leak into base game. Retriggers double-count. Nested Red/Purple from FS re-enters FS recursively. Skip/turbo leaves FS counter wrong.

**Why it happens:**
`isFreeSpin` booleans multiply (`isWildBoost`, `isBonus`, …) instead of an explicit FSM. Wild density tuned by eye without a separate FS reel / mask config.

**How to avoid:**
Separate machines or clear phases: `base` | `fsIntro` | `fsSpin` | `fsOutro` | `bonusNested`. FS config keys for wild mask weights on reels **2–5** only. Retrigger adds spins; nested Hold/Pick is a push onto the feature stack, not a recursive call. Skip = “finish immediately” on presentation stages; never skip ledger commits.

**Warning signs:**
- Wild masks still elevated after FS outro
- FS remaining goes negative or jumps
- Nested bonus returns to base instead of remaining FS

**Phase to address:**
**Phase: Green Free Spins** (FSM shell earlier in base spin).

---

### Pitfall 6: Gamble without win-lock / control lock

**What goes wrong:**
Player spins while VHS gamble is open; win credited twice on Collect; loss steals balance beyond the risked pot; no Collect path; rounds exceed 10; autoplay auto-gambles.

**Why it happens:**
Gamble treated as a decorative overlay. Win already banked into wallet before risk, or never banked until after — inconsistent.

**How to avoid:**
Post-win state: amount sits in a **gamble pot** (not free balance) until Collect or bust. Lock spin / bet / autoplay while open. Show amount at risk, SURVIVE/DIE, attempts left (max 10). Collect → credit pot to wallet and exit. Lose → pot = 0, return to idle. Cap forces Collect. Document whether bonus totals are gamble-eligible (Endorphina Classic Risk is typically line-win flavored — lock a rule in JSON/rules overlay).

**Warning signs:**
- Balance jumps on both Collect and next spin
- Space/spin hotkey starts a spin during VHS
- Gamble button on jackpot / ineligible wins without explanation

**Phase to address:**
**Phase: VHS gamble.**

---

### Pitfall 7: Bolting the menu by rewriting Crash

**What goes wrong:**
Crash gameplay, HUD, or wallet refactored “for the shell.” Regressions in a validated demo. Portfolio review sees broken Aviator-like game plus unfinished slot.

**Why it happens:**
`main.ts` boots Crash only; temptation is to merge everything into a shared mega-engine or rewrite Crash to a new scene API in one PR.

**How to avoid:**
Thin registry: `{ id, mount(host), unmount() }`. Adapt Crash with a wrapper that extracts today’s `main.ts` loop into `games/crash/mount.ts` **without** changing `CrashGame` math. Shared seams only where already shared (mute, seed, money helpers, audio port). No Megaways / cascades / buy-feature scope creep.

**Warning signs:**
- Large diffs under `games/crash/logic/`
- Crash bet enablement tests failing after “menu work”
- Shared “SlotEngine” abstractions with no Crash consumer

**Phase to address:**
**Phase: Multi-game shell / menu** — acceptance: Crash playable end-to-end unchanged in feel.

---

### Pitfall 8: Pick’em honesty and reference-number drift

**What goes wrong:**
Locker picks feel skill-based but outcomes are predetermined (or the reverse) without a consistent reveal of unpicked prizes. Grid size / match rule copied from conflicting reviews (16 vs 20 picks; three-of-a-kind end). RTP marketing numbers pasted into README as if certified.

**Why it happens:**
Third-party writeups disagree; official page vs news differ on cosmetic counts and jackpot multipliers. Portfolio urge to “look certified.”

**How to avoid:**
Lock pick model in JSON: true-pick (prizes assigned to lockers, player choice selects) **or** presentational pick — and match UX (reveal others only if model allows). Prefer Endorphina **mechanics** from official news + PROJECT locks; treat prize multipliers as **illustrative config**. Never claim live RTP certification.

**Warning signs:**
- Hardcoded `16` / `20` / `500x` in three files that disagree
- README cites “96.07% RTP” as this demo’s math
- Unpicked lockers never revealed after a “skill” framing

**Phase to address:**
**Phase: Purple Pick’em** + **JSON config** phase for numbers.

---

### Pitfall 9: AI-fingerprint portfolio code and invented art

**What goes wrong:**
Hiring managers smell generic abstractions, emoji-laden copy, over-commented engines, purple glow UI. Agent invents placeholder art that ships. Comments use arrows, em dashes, Title Case sentences.

**Why it happens:**
Default LLM style + “complete the scene” pressure when assets are missing.

**How to avoid:**
Match Crash voice: short human names, logic/view/hud split, lowercase comments with no trailing period and no special unicode. When graphics needed, **ask the user** with an asset list; wait for drops under agreed paths. Prefer boring explicit FSMs over a framework-shaped slot SDK.

**Warning signs:**
- New `AbstractBonusOrchestratorFactory` with one implementer
- Comments that read like blog posts
- Checked-in “temp neon gradient” pretending to be final art

**Phase to address:**
**All phases** — enforce in shell + first HOTLINE base PR; re-check at presentation polish.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcode Crash in `main.ts` | Ships Fast | Blocks menu; leaky lifecycle | Only until shell phase starts |
| One shared mutable `gameState` bag | Quick flags | Illegal flag combos; combo bugs | Never for bonuses |
| View owns RNG for “juicier” H&W | Fast VFX | Replay/settlement lies | Never |
| Duplicate wallet per game with silent reset | Isolation | Player confusion; review questions | OK if labeled “per-game demo balance” |
| Placeholder rectangles for symbols | Unblocks layout | Ships looking unfinished / AI | Only behind explicit TODO + user art request |
| Single boolean `inBonus` | Simple | Nested FS + H&W impossible | Never once combo/FS nesting is in scope |
| Copy Endorphina RTP into UI | Looks pro | False certification claim | Never — illustrative JSON only |
| Recreate `Application` each launch | Clean mental model | v8 global pool bugs | Avoid; last resort with careful destroy flags |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| PixiJS v8 `Application.destroy` | Always `releaseGlobalResources: true` between games | Release globals only on final teardown; prefer scene swap |
| `app.ticker` | Add in mount, forget remove on unmount | Same function reference `add`/`remove`; no remove-after-destroy |
| DOM HUD (`#app`) + canvas host | Leave Crash DOM nodes when mounting HOTLINE | Unmount clears HUD root; each game mounts its own chrome |
| Shared mute pref | HOTLINE ignores Crash mute key | One `AudioPort` / mutePref at shell |
| Boot `?seed=` | Only Crash reads seed | Shell parses once; pass into active game factory |
| JSON “backend” config | Fetch fake API that 404s in static host | Import/static JSON shaped like server payload |
| User art pipeline | Agent generates final assets | Request list → user drops files → code wires paths |
| HMR dispose | Copy Crash HMR destroy into production switch | Separate HMR path from in-app unmount |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| New textures per spin / per token flight | GC stutter, mobile heat | Pool sprites; reuse textures; unload unused bundles on game switch | ~minutes of play on mid phones |
| Unbounded particle / trail on diskette flights | Frame drops during “busy” spins | Cap concurrent flights; simplify under turbo | Combo token storms |
| Full stage rebuild each respin | H&W hitch every land | Diff locked cells only | 20-cell near-full boards |
| Multiple Applications | Context thrash | One app | First game switch |
| CSS HUD + Pixi both layout thrashing | Resize jank | Debounce resize; Crash already caps DPR at 2 — keep it | Orientation changes |

*Scale note: this is a portfolio demo (1 concurrent player). Optimize for clean teardown and mid-tier mobile FPS, not 1M users.*

## Security Mistakes

Domain-specific for a **client-only demo** (not real-money):

| Mistake | Risk | Prevention |
|---------|------|------------|
| Presenting illustrative RTP / “provably fair” claims | Misleads reviewers; compliance optics | Label “portfolio demo / no real money”; configs are examples |
| Deep-linking seeds that look like server auth tokens | Confuses threat model | Keep `?seed=` as demo replay only |
| Shipping scraped Endorphina art / audio | Copyright | User-authored Hotline Miami–inspired pack only |
| Fake deposit / login chrome | Looks like unlicensed gambling product | Menu = game picker only |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No return-to-menu mid-feature | Soft-locked in H&W / pick | Menu affordance + “round in progress” confirm |
| Meters that don’t explain random trigger | Feels broken when “half full” fires | Rules overlay: tokens can ring a phone on land |
| Gamble without Collect | Panic after SURVIVE | Always show Collect + attempts left |
| Combo starts with no queue UI | Overlapping overlays | “Phone queue” / sequential intros |
| Crash controls visible on HOTLINE | Confused input | Full HUD unmount |
| CRT frame clips spin button on mobile | Unplayable in interview | Safe area + responsive HUD like Crash |

## "Looks Done But Isn't" Checklist

- [ ] **Game switch:** Crash → menu → HOTLINE → menu → Crash — no ticker/HUD leaks — verify DevTools listeners + no dual canvas
- [ ] **H&W:** Locked cells immutable across respins; counter reset only on new cash; full grid + counter-zero both terminate — verify seeded transcript
- [ ] **Tokens:** Trigger events exist in logic before flight ends — verify meter count matches ledger
- [ ] **FS wilds:** Elevated masks only in FS; base restored after outro — verify snapshot flag / reel set id
- [ ] **Combo:** Two phones → sequential features without wallet double-pay — verify balance delta
- [ ] **Pick’em:** End condition (three match) + prize from config — verify cannot pick after resolve
- [ ] **Gamble:** Controls locked; Collect banks once; bust clears pot only; max 10 — verify enablement matrix
- [ ] **Config:** JSON loads; changing a weight changes outcomes — verify not hardcoded duplicate
- [ ] **Art:** User assets wired; no agent placeholders in release path — verify asset list checked off
- [ ] **Voice:** Comments / copy pass anti-AI style rules — verify spot-check on new files
- [ ] **Crash:** Existing Vitest suite still green after shell — verify CI / local

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Dual Application / GPU pool corruption | MEDIUM | Collapse to single app + scene manager; destroy once; clear texture caches deliberately |
| View RNG drift | HIGH | Delete view-side decide paths; regenerate event stream API; re-pin seeds |
| Locked-cell contamination | HIGH | Introduce ledger type; rewrite H&W driver to replay; add wave tests |
| Meter/visual trigger desync | MEDIUM | Move trigger to pre-anim resolve; meters become pure view of counts |
| FS flag leak | MEDIUM | Replace booleans with phase enum; add outro assert `reelSet === base` |
| Crash rewrite regressions | HIGH | Revert logic diffs; wrap mount only; restore from git if needed |
| Gamble double-credit | LOW–MEDIUM | Introduce pot account; audit credit call sites |
| Wrong pick grid size | LOW | Single config constant; update art layout once |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Application / ticker teardown | Multi-game shell / menu | Switch games 5×; no WebGL errors; Crash tests green |
| Rewriting Crash | Multi-game shell / menu | Diff excludes `crash/logic` gameplay changes |
| Dual math / view RNG | Base spin + all bonus phases | Seeded Vitest transcripts |
| Token visual≠ledger / wrong fill gate | Token → phone collectors | Event log before VFX; combo queue stub |
| FS wild boolean soup | Green Free Spins | Mask density only in FS; nesting stack test |
| H&W locked contamination + reset rules | Red Hold & Win | Wave reducer tests; full-grid path |
| Pick’em model + number drift | Purple Pick’em + JSON config | One config source; rules text matches |
| Combo parallel mutation | Combo nights | Dual-trigger integration test |
| Gamble lock / pot accounting | VHS gamble | Enablement matrix tests (like Crash HUD) |
| AI fingerprints / invented art | Presentation polish (+ every PR) | Style checklist; asset handoff complete |
| Fake RTP certification tone | JSON config + README/rules | Demo-only label; no certified claims |

## Sources

- PixiJS v8 GC guide: [Garbage Collection](https://pixijs.com/8.x/guides/concepts/garbage-collection) — destroy / unload / TextureGC — MEDIUM (official docs, webfetch)
- PixiJS issue [#11694](https://github.com/pixijs/pixi.js/issues/11694) — Application destroy / global resources / TexturePool — MEDIUM (verified community + maintainer notes)
- PixiJS ticker destroy/remove [#5653](https://github.com/pixijs/pixi.js/issues/5653) — do not use ticker after destroy — MEDIUM
- Scene-swap pattern: [Create a scene system for PixiJS](https://coderevue.net/posts/create-scene-system-pixijs/) — MEDIUM
- Hold & Win architecture / reset semantics: [Hold and Spin implementation](https://sblsc1977.com/hold-and-spin-mechanic-implementation-architecture/), [Hold and Win explained](https://www.casinocenter.com/hold-and-win-slots-explained/), pure event-stream refactors in open demos — MEDIUM
- Slot client FSM / skip semantics: [Spark layered slot architecture](https://www.sparkgametech.com/en/blog/client-framework-architecture) — MEDIUM
- Free-spins EV / separate reel sets: [Bonus round math notes](https://neon-royale.com/dev/slot-math/the-mathematics-of-bonus-rounds) — MEDIUM (math education; apply as “separate FS config,” not certification)
- Token / multi-pot combo genre: Power Combo reviews (meters + concurrent features) — MEDIUM for presentation patterns; HOTLINE trigger policy follows PROJECT (random on land + combo queue)
- Gamble UX: [DemoJoy gamble guide](https://demojoy.com/en/guides/gamble-double-up-feature/), operator rule PDFs (attempts, Collect, locks) — MEDIUM
- Pick’em true-pick vs predetermined: industry explainers (ACGB / player forums) — MEDIUM; lock model explicitly for demo
- Endorphina [3 Witch Pots](https://endorphina.com/games/3-witch-pots) + official news — MEDIUM; marketing multipliers can disagree — do not treat as certified demo RTP
- Brownfield evidence: `src/main.ts`, `src/games/crash/view/mountCrashView.ts` — HIGH for shell lifecycle risks
- Locked product: `.planning/PROJECT.md` — HIGH for combo nights, art ownership, comment style, illustrative JSON

---
*Pitfalls research for: HOTLINE Witch Pots–like Pixi slot + multi-game portfolio shell*
*Researched: 2026-10-09*
