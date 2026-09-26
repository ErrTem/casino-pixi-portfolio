# Pitfalls Research

**Domain:** Browser Crash-style portfolio demo (PixiJS v8 + TypeScript + Vite, client-only)
**Researched:** 2026-09-26
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Animation-Driven Crash Timing (Ticker Owns the Outcome)

**What goes wrong:**
The crash point or live multiplier is advanced by “whatever the rocket animation did this frame.” On a 30fps phone, background tab, or after a hitch, the multiplier jumps, skips past auto cash-out, or crashes late/early relative to the intended seed. Recruiters see non-reproducible rounds; tests flake.

**Why it happens:**
Demos treat Pixi’s ticker as the game clock. `deltaTime` is mistaken for milliseconds, or the curve length is driven by sprite X instead of an authoritative elapsed-time / progress function. Tab throttling freezes `requestAnimationFrame`, then a huge `deltaMS` is applied unchecked.

**How to avoid:**
- Keep **GameLogic** pure: given `(seed, bet, elapsedMs)` → `{ multiplier, phase, crashAt }`. View only samples and draws.
- Advance with **clamped real time** (`performance.now()` or capped `ticker.deltaMS`), not frame count or sprite position.
- Cap max step (e.g. 50–100ms) so background resume cannot skip past auto cash-out without resolution.
- Crash and cash-out decisions run in logic **before** the frame render.

**Warning signs:**
- Same seed produces different crash multipliers across machines/FPS.
- Auto cash-out at 2.00x sometimes pays 2.05x or never fires.
- Multiplier freezes when the tab is hidden, then leaps on focus.

**Phase to address:**
Phase 1 — Core round loop / GameLogic (before any Pixi polish).

---

### Pitfall 2: Unseeded or Post-Hoc RNG

**What goes wrong:**
`Math.random()` is called mid-flight, or the crash point is rolled only when the player cashes out / when the animation “ends.” Rounds cannot be replayed; “provably fair” claims appear in copy without any verifiable seed; debugging is impossible.

**Why it happens:**
Portfolio haste + copying blog snippets that roll crash on timer expiry. Confusion between “demo RNG is OK” (project decision) and “any random call anytime is OK.”

**How to avoid:**
- Roll **crash multiplier (or crash time) once at round start** from a seeded PRNG; store `seed` + `crashAt` on the round record.
- Expose seed in a debug panel or URL query for recruiter/demo reproducibility.
- Never re-roll after `flying` begins. Never use visual “when rocket leaves screen” as the RNG event.
- Do **not** claim certified / crypto provably-fair unless implemented; label as **seeded demo RNG**.

**Warning signs:**
- No `seed` field on round state.
- Crash value appears only after cash-out attempt.
- History strip cannot be regenerated from stored seeds.

**Phase to address:**
Phase 1 — RNG + round state machine.

---

### Pitfall 3: Floating-Point Multiplier Comparisons

**What goes wrong:**
Display shows `2.00x` but internal value is `1.9999998`; auto cash-out at `2.00` never triggers, or `=== 2` fails. Payouts use float multiplication (`balance += bet * mult`) producing `10.0000000002` in the wallet UI. History shows `1.999999x`.

**Why it happens:**
Exponential Crash curves and continuous time integration produce binary floats. UI formatting hides the error; settlement uses raw floats.

**How to avoid:**
- Treat multipliers as **fixed-point** (e.g. integer hundredths: `200` = 2.00x) **or** compare with thresholds: cash out when `mult >= target` using a single rounded comparison.
- Round for **display and settlement** to a fixed decimal places (typically 2) in one shared formatter used by wallet, history, and canvas text.
- Auto cash-out: evaluate `rounded(live) >= rounded(target)` in GameLogic on each tick **before** checking crash (`live >= crashAt` → crash wins if both true — see Pitfall 4).

**Warning signs:**
- Wallet shows many decimal places.
- Auto cash-out “misses” exact targets.
- Unit tests fail only on some platforms due to float noise.

**Phase to address:**
Phase 1 — Settlement + display formatting helpers (shared module).

---

### Pitfall 4: Auto Cash-Out vs Crash Race

**What goes wrong:**
On the same tick, live multiplier crosses both auto cash-out target and crash point. Player is paid **and** marked crashed, balance double-updates, or UI shows win then immediately loss. Manual cash-out click arrives one frame after crash → ghost win.

**Why it happens:**
Separate handlers for “auto cash-out check,” “crash check,” and “button click” mutate wallet without a single transition function. Async UI events interleave with ticker updates.

**How to avoid:**
- One pure transition: `resolveTick(state, now) → nextState` with **ordered rules**: if already terminal, no-op; else if `mult >= crashAt` → CRASHED; else if auto enabled and `mult >= autoTarget` → CASHED_OUT; else continue.
- Manual cash-out is an **intent** applied through the same resolver (`cashOutRequested`), not a direct balance write from the HTML button.
- Idempotent settlement: wallet mutates only on entering a terminal phase, once per round id.

**Warning signs:**
- Two balance changes in one round.
- “Cashed out” toast after crash animation.
- Auto cash-out tests flake when target ≈ crashAt.

**Phase to address:**
Phase 1–2 — Round resolver + auto cash-out feature; verify with seeded edge cases (`autoTarget === crashAt`).

---

### Pitfall 5: Logic Entangled in the Pixi View

**What goes wrong:**
Bet validation, balance, crash RNG, and history live inside sprite/`Graphics` update methods. Adding a second game or writing unit tests requires a WebGL context. Refactors break settlement. Recruiters who skim architecture see a “toy” not a portfolio-grade separation.

**Why it happens:**
Fastest path to a moving rocket is putting `balance -= bet` next to `rocket.x = …`. Project explicitly requires pure TS GameLogic separate from Pixi view — easy to violate under deadline.

**How to avoid:**
- Hard boundary: **GameLogic** (no `pixi.js` imports) owns phases, wallet, RNG, history; **CrashView** subscribes to state snapshots / events and renders.
- HTML controls call logic commands (`placeBet`, `requestCashOut`, `setAutoCashOut`); they never touch Pixi objects.
- CI/unit tests run logic without canvas; view smoke-tested separately.

**Warning signs:**
- `import from 'pixi.js'` inside wallet or RNG modules.
- Cannot replay a round in a Node test.
- Cash-out button handler reaches into `app.stage`.

**Phase to address:**
Phase 0/1 — Scaffold architecture; enforce in every later phase PR.

---

### Pitfall 6: Canvas Resize / HiDPI Layout Breakage

**What goes wrong:**
Blurry curve on Retina; blacklist letterboxing; rocket flies off-screen after rotate; HTML control bar overlaps the canvas hit area; `resizeTo: window` ignores the demo chrome height so the graph is clipped under the wallet bar.

**Why it happens:**
Init without `resolution: devicePixelRatio` + `autoDensity: true`. Layout uses fixed 1920×1080 coordinates. Resize listener updates renderer size but not curve control points / text scale. Mixing full-window resize with a fixed-height HTML overlay.

**How to avoid:**
- `app.init({ resizeTo: gameContainer, resolution: Math.min(devicePixelRatio, 2), autoDensity: true })` — resize to the **game region**, not raw `window`, when HTML chrome exists.
- On resize: recompute graph bounds from `app.screen`; rebuild or rescale path; keep rocket on the parameterized curve (progress 0–1), not absolute pixels baked at start.
- Debounce via `queueResize`; re-layout after orientation change.
- CSS: canvas `width/height` 100% of container; avoid transforming the canvas with CSS scale (fights Pixi resolution).

**Warning signs:**
- Soft text on phone; sharp on desktop.
- After rotate, crash animation starts mid-screen.
- Cash-out button overlaps the rocket path.

**Phase to address:**
Phase 2 — Pixi shell + hybrid curve view; re-verify in mobile polish phase.

---

### Pitfall 7: Mobile Input / Overlay Hit Conflicts

**What goes wrong:**
Cash-out taps miss (canvas sits on top of HTML controls, or `touch-action` / scroll steals gestures). Double-firing place-bet from both Pixi `pointertap` and HTML `click`. 300ms-feel lag or accidental scroll during a round. Safe-area notches clip the DEMO badge and bet chips.

**Why it happens:**
Stacking context mistakes (`z-index`, full-bleed canvas). Duplicate controls in Pixi and HTML. Using mouse-only events. Ignoring `env(safe-area-inset-*)`.

**How to avoid:**
- **v1 decision:** betting/cash-out/balance live in **HTML overlay**; Pixi is display-only for interactions (or only decorative hit areas). One input path per action.
- Prefer Pointer Events; large cash-out hit target (≥44px); `touch-action: manipulation` on controls.
- Ensure overlay is above canvas; canvas `pointer-events: none` if fully non-interactive.
- Test iOS Safari + Android Chrome: place bet, rapid cash-out, rotate mid-flight.

**Warning signs:**
- Desktop works; phone cannot cash out in time.
- Bet places twice per tap.
- Page rubber-bands while flying.

**Phase to address:**
Phase 2–3 — HTML controls + mobile layout QA.

---

### Pitfall 8: Missing or Weak DEMO / Portfolio Labeling

**What goes wrong:**
Page looks like a real casino product. Stores, compliance reviewers, or employers flag it; App Store / hosting ToS risk; candidate appears careless about gambling regulation optics.

**Why it happens:**
Focus on “looking like Aviator.” DEMO badge deferred as “polish.” Title/meta still say “casino crash win real money” from template copy.

**How to avoid:**
- Persistent **DEMO** badge in the control bar (always visible, not only splash).
- Page title + meta description: portfolio / demo / no real money.
- On-load or footer one-liner: no real-money gambling; fictional balance.
- Do not deep-link to payment, KYC, or “deposit” language — even as jokes in UI strings.

**Warning signs:**
- Screenshot of first viewport has no DEMO mark.
- README/marketing omit “demo only.”
- Button labels: “Deposit,” “Withdraw,” “Play for real.”

**Phase to address:**
Phase 2 (chrome) and Phase 4 (ship checklist) — treat as release blocker.

---

### Pitfall 9: Commercial IP / Lookalike Branding

**What goes wrong:**
Copied rocket, fonts, SFX, or “Aviator”-style wordmarks from Spribe/other providers; Endorphina-like assets. Portfolio becomes a liability; recruiter legal hesitation; GitHub DMCA.

**Why it happens:**
Asset packs and YouTube clones ship ripped sprites. “Inspired by” drifts into trademarked UI chrome.

**How to avoid:**
- Original or explicitly user-provided assets only (project constraint).
- Generic naming (“Crash Demo,” personal brand) — not provider product names in the logo.
- Procedural curve + simple rocket shape / licensed CC0 art; placeholder SFX OK.
- If referencing commercial games in README, say “genre inspiration,” never ship their assets.

**Warning signs:**
- Binary assets with unknown provenance in `/public`.
- Color/layout clones of a named commercial Crash UI.
- Audio filenames matching a known studio pack.

**Phase to address:**
Phase 2 (visuals) — asset intake gate before polish.

---

### Pitfall 10: Phase Machine Gaps (Waiting / Flying / Terminal)

**What goes wrong:**
Player can bet during `flying`, cash out during `waiting`, or start two rounds. Balance goes negative. History appends incomplete rounds. UI buttons stay enabled in wrong phases.

**Why it happens:**
Boolean flags (`isFlying`, `hasBet`) instead of an explicit state enum; HTML buttons not disabled from state.

**How to avoid:**
- Explicit phases: `idle | betting | waiting | flying | cashed_out | crashed` (collapse as needed, but one source of truth).
- Commands no-op or error if illegal; UI enabled flags derived from phase.
- Round id increments only on successful start; settlement keyed by round id.

**Warning signs:**
- Negative balance in manual mash tests.
- Double history entries per round.
- Cash-out enabled before takeoff.

**Phase to address:**
Phase 1 — state machine; Phase 3 — control enablement wired to state.

---

### Pitfall 11: Unbounded Curve Geometry / History Growth

**What goes wrong:**
Graph `Graphics` redraws the entire path every frame with thousands of points; history array grows forever; GC hitch mid-flight on low-end phones — ironic for a “performance” portfolio piece.

**Why it happens:**
Appending a point per ticker callback without decimation; keeping all-time history for the strip.

**How to avoid:**
- Parameterize curve mathematically; draw with fixed segment count or rebuild only when resolution/bounds change; move rocket by sampling `f(t)`.
- History: ring buffer of last N (requirement: last N multipliers).
- Avoid per-frame `Graphics.clear()` of massive paths if a simpler line+sprite works.

**Warning signs:**
- FPS drops as multiplier climbs.
- Memory climbs across long demo sessions.
- History DOM node count unbounded.

**Phase to address:**
Phase 2 (curve render strategy); Phase 3 (history strip).

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Settlement math inside Pixi `ticker.add` | Fast first playable | Untestable; races; second game blocked | Never for wallet/RNG |
| `Math.random()` without seed | Fewer lines | Non-reproducible demos/tests | Never (seeded demo RNG is a locked requirement) |
| CSS-scale the canvas for “responsive” | Quick mobile fit | Blurry + wrong hit targets | Never — use Pixi resize + layout |
| Duplicate cash-out in Pixi and HTML | Feels complete | Double-settle bugs | Never — one input path |
| Placeholder DEMO only on splash | Ships chrome faster | Looks like real gambling in screenshots | Only for hours of local WIP; blocker before share/deploy |
| Float multipliers everywhere | Simpler types | Auto cash-out / display bugs | Prefer fixed-point or single round helper from day one |
| `resizeTo: window` with HTML bar | One-liner init | Clipped graph / overlap | Acceptable only if chrome is overlay with `pointer-events` and graph padded; prefer `resizeTo: #game-root` |
| Skip auto cash-out edge-case tests | Faster Phase 3 | Heisenbugs in live demo | Never skip `target ≈ crashAt` |

## Integration Gotchas

Client-only v1 — few external services; still easy to get “integrations” wrong internally.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Pixi ticker ↔ GameLogic | Logic reads sprites / `deltaTime` as truth | Logic: time + seed; view: read-only snapshot |
| HTML controls ↔ state | Direct DOM balance text edits | Render balance from state subscribe; commands only |
| Vite static assets | Hotlink commercial CDN art | Local original/user assets under `/public` |
| `devicePixelRatio` | Listen once at boot only | Re-read on resize / `matchMedia` DPR change when possible |
| Visibility API | Ignore `document.hidden` | Pause or clamp catch-up; never apply multi-second `deltaMS` raw |

## Performance Traps

Portfolio scale is one concurrent player — traps are **device** and **session length**, not user count.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Per-frame full path rebuild | Jank as mult ↑ | Sample curve; limited segments | Mid-range phones ~1–2 min flight / dense points |
| Uncapped DPR (3x/4x) | GPU heat, thermal throttle | `Math.min(dpr, 2)` | High-DPI Android tablets |
| Unbounded history DOM | Scroll lag | Fixed N strip | After hundreds of rounds in one tab |
| Filters on whole stage | Fill-rate death | Prefer simple sprites/Graphics | Mobile Safari |
| Audio decode on first cash-out | Glitch at climax | Preload or defer politely | First interaction on slow network |

## Security Mistakes

Not a real-money system — risks are **trust, compliance optics, and self-XSS in demo tools**.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Implying real-money or “provably fair crypto” without implementation | Legal/employer trust damage | Accurate DEMO copy; seeded demo RNG only |
| Shipping ripped commercial assets | IP / DMCA | Asset provenance gate |
| `eval` / raw `innerHTML` for debug seed UI | XSS if link shared | Controlled inputs; textContent |
| Persisting “wallet” in localStorage as if valuable | False sense of account security | Fine for UX; never call it real funds |
| Open redirect “Play for real” links | Reputation | Omit entirely |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Crash with no readable multiplier | Recruiter misses the point of the genre | Large live mult + clear crash flash |
| Cash-out too small / far from thumb | Missed cashes on mobile | Primary cash-out in HTML bar, large tap target |
| No waiting phase feedback | Feels broken before takeoff | Short waiting state + disabled cash-out |
| History without crash vs cash distinction | Confused round outcomes | Mark crashed vs cashed (e.g. color) |
| Silent auto cash-out | “Why did it stop?” | Brief confirmation in UI when auto fires |
| Bet > balance allowed | Negative / NaN wallet | Validate in GameLogic; disable chips |
| Instant restart with no beat | Chaotic mash demo | Brief terminal pause before next bet |

## "Looks Done But Isn't" Checklist

- [ ] **Seeded RNG:** Same seed → same `crashAt`; seed visible for demo/debug — verify replay test
- [ ] **Time-based flight:** FPS change does not change crash multiplier — verify at throttled CPU
- [ ] **Auto cash-out:** Fires at target; when `target >= crashAt`, crash wins; no double settle — verify unit table
- [ ] **Manual cash-out race:** Click after crash is no-op — verify
- [ ] **Multiplier formatting:** Display, history, and payout share one rounder — verify `2.00` not `1.999`
- [ ] **Phase guards:** Cannot bet mid-flight / cash out in waiting — verify button disabled states
- [ ] **Resize:** Rotate phone + desktop DPR — curve and rocket stay in bounds
- [ ] **Mobile cash-out:** One tap settles once; no scroll steal — verify on real device
- [ ] **DEMO labeling:** Badge + meta + README — verify first-viewport screenshot
- [ ] **IP:** No commercial assets/names in logo — verify asset list
- [ ] **Architecture:** GameLogic has zero `pixi.js` imports — verify lint/grep in CI
- [ ] **History:** Last N only; values match settled rounds — verify
- [ ] **Destroy/hot reload:** `app.destroy` with textures cleaned if HMR remounts — verify no WebGL context leak in dev

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Animation-owned timing | HIGH | Extract time+seed resolver; make view dumb; add seed replay tests |
| Float / auto cash-out races | MEDIUM | Introduce fixed rounder + single `resolveTick`; add edge-case tests |
| Logic in view | HIGH | Strangle: move wallet/RNG first; leave sprites calling facade until thin |
| Resize/layout | MEDIUM | Container `resizeTo` + progress-based rocket; delete CSS canvas hacks |
| DEMO / IP issues | LOW–MEDIUM | Copy pass + asset purge/replace before any public link |
| Mobile input | MEDIUM | HTML-only controls; `pointer-events: none` on canvas; retest devices |

## Pitfall-to-Phase Mapping

Suggested phase names for roadmap (adjust numbering when ROADMAP locks).

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Animation-driven timing | Phase 1 — GameLogic round loop | Seeded replay identical across FPS caps |
| Unseeded / mid-flight RNG | Phase 1 — RNG | Round record includes seed + crashAt at start |
| Float multipliers | Phase 1 — settlement helpers | Shared format tests; auto at exact hundredths |
| Auto vs crash race | Phase 1–2 — resolver + auto cash-out | Table: target &lt;/ = / &gt; crashAt |
| Logic in Pixi view | Phase 0/1 — architecture scaffold | Grep: no pixi in logic; Node unit tests |
| Canvas resize / HiDPI | Phase 2 — Pixi shell + curve | Manual rotate + DPR checklist |
| Mobile input / overlay | Phase 2–3 — HTML controls | Device cash-out mash test |
| Phase machine gaps | Phase 1 + Phase 3 controls | Illegal command tests; disabled UI |
| Curve/history perf | Phase 2–3 | Long-flight FPS; history length === N |
| DEMO labeling | Phase 2 chrome + Phase 4 ship | First-viewport + meta audit |
| Commercial IP | Phase 2 assets | Provenance list; no trademarked marks |

## Sources

- Project constraints: `.planning/PROJECT.md` (DEMO labeling, IP, seeded RNG, GameLogic/Pixi split, HTML overlay, auto cash-out)
- PixiJS v8 Application / ResizePlugin / ticker semantics (`resizeTo`, `resolution` + `autoDensity`, `deltaTime` vs `deltaMS`, destroy/HMR leaks) — PixiJS application & ticker skill references
- Known Crash-genre failure modes: time-vs-frame progression, crash/cash-out same-tick ambiguity, float display vs settlement (industry demo/postmortem patterns)
- Browser realities: rAF throttling in background tabs; mobile overlay/`touch-action`; HiDPI canvas sizing
- Gambling-demo optics: clear non-real-money labeling; avoid provider IP/trademarks in portfolio clones

---
*Pitfalls research for: PixiJS Crash-style portfolio demo*
*Researched: 2026-09-26*
