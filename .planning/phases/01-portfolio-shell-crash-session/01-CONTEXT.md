# Phase 1: Portfolio Shell + Crash Session - Context

**Gathered:** 2026-10-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Visitor opens a shared DOM game menu, launches Crash, and returns without leaking tickers or audio handlers. Shared mute, boot `?seed=`, and portfolio-demo voice work across the shell. One long-lived Pixi `Application` is owned by the shell; Crash is a thin session adapter. HOTLINE appears as a disabled menu stub only — no HOTLINE gameplay in this phase.

</domain>

<decisions>
## Implementation Decisions

### Menu composition
- **D-01:** First screen is a **minimal game list** on a dark shell (not a full-bleed branded landing)
- **D-02:** Games are **compact tiles with a game icon** (not text-only rows)
- **D-03:** Menu has a **named Retro Computer header** (portfolio / demos title), then tiles below
- **D-04:** While the menu is open, use an **empty dark shell** — no idle Pixi scene behind the menu; canvas host blank or hidden

### HOTLINE stub
- **D-05:** HOTLINE tile is **visible but disabled** — not clickable; no placeholder launch screen
- **D-06:** Disabled tile shows a short **“Coming soon”** status chip
- **D-07:** **Request real menu icons now** — agent provides a clear asset list; user generates and places files in Phase 1 (Crash + HOTLINE tile icons)
- **D-08:** Tile order: **Crash first, HOTLINE second**

### Crash session on leave
- **D-09:** **Fresh Crash session every launch** — leaving to menu tears down Crash logic + view; next launch resets balance/history — **Reversibility:** costly — session lifecycle and dispose paths assume ephemeral mounts; switching to resume-in-memory would rework shell adapter teardown
- **D-10:** Mid-round leave **abandons cleanly** — stop ticker work, drop in-flight state, no force cash-out / settle before menu
- **D-11:** Every Crash launch in the same page load **reuses the seed parsed at page boot** from `?seed=` (reproducible across menu hops)
- **D-12:** **Shell owns `AudioPort`** — create once at boot; Crash only unlocks/plays; mute survives leave without recreating the port — **Reversibility:** costly — mute persistence and unlock lifecycle are shell-scoped

### Shell chrome
- **D-13:** **No dedicated demo / no-real-money banner** — SHELL-04 is met by existing portfolio-demo voice (page title, Reset demo, menu copy). Do not add a persistent disclaimer label
- **D-14:** While Crash is open, **“Menu” button in top chrome** (alongside mute / Reset demo) returns to the menu
- **D-15:** **Mute control on the menu** as well as in Crash; same preference
- **D-16:** Rename mute storage key from `crash-demo:mute` to **`portfolio-demo:mute`**, with a **one-time migrate** from the old key if present — **Reversibility:** one-way — published localStorage key change; migration is a one-shot read of the old key

### Carried from prior planning (do not reopen)
- One long-lived Pixi `Application` owned by the shell; Crash thin adapter only
- Per-game demo balances for v1 (no shared wallet)
- DOM menu (not React/Vue)
- Crash gameplay not rewritten — wire into menu only
- HOTLINE may stay stub until Phase 2

### Claude's Discretion
- Exact menu title string and tile microcopy (keep short, human, Retro Computer)
- Exact “Coming soon” chip styling within the minimal HUD voice
- Precise mute-key migration helper shape (read old → write new → prefer new)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and requirements
- `.planning/ROADMAP.md` — Phase 1 goal, success criteria, requirements SHELL-01..04 + CFG-02
- `.planning/REQUIREMENTS.md` — SHELL-01..04, CFG-02 traceability; SHELL-V2 deep-link deferred
- `.planning/PROJECT.md` — portfolio constraints, DOM shell, art pipeline, comment/style rules
- `.planning/STATE.md` — locked: long-lived Pixi app, per-game balances

### Existing boot / audio / Crash mount
- `src/main.ts` — current Crash-only boot, ticker, HMR dispose
- `src/shared/boot/parseBootSeed.ts` — `?seed=` parse seam (CFG-02)
- `src/shared/audio/mutePref.ts` — mute load/save; key rename target in D-16
- `src/shared/audio/AudioPort.ts` — shared audio contract
- `src/shared/audio/createBeepAudioPort.ts` — beep adapter used today
- `src/games/crash/view/mountCrashView.ts` — currently creates its own `Application` (must move ownership to shell)
- `src/games/crash/hud/CrashHud.ts` — mute + top chrome patterns for Menu button
- `index.html` — `#app` / `#game-canvas-host` shell layout
- `src/styles/hud.css` — HUD / shell styles to extend for menu
- `tests/shell.hud-layout.test.ts` — layout invariants (canvas host free of monetary controls)

### Stack constraints
- `AGENTS.md` / research stack notes — DOM menu, no React; one AudioPort backend; Retro Computer font

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `parseBootSeed` — shell parses once at boot; Crash launches reuse that seed string
- `loadMutePref` / `saveMutePref` — extend with new key + migrate; keep injectable store for tests
- `createBeepAudioPort` — shell-owned instance passed into Crash HUD/session
- `mountCrashHud` / `mountCrashView` — adapt so view mounts into shell-owned `Application` (or shell creates app and Crash attaches scene only)
- Existing `#top-chrome` actions pattern — add Menu button beside mute / Reset demo

### Established Patterns
- Crash HUD is plain DOM in `#app`; Pixi stays in `#game-canvas-host`
- HMR dispose removes ticker, disposes audio, destroys app — menu leave must mirror leak-free teardown for game session without destroying shell-owned app/audio
- Vitest covers boot seed, mute pref, HUD layout — extend similarly for shell routing / dispose

### Integration Points
- Replace Crash-only `main.ts` boot with shell router: menu ↔ Crash session
- `mountCrashView` currently `new Application()` — Phase 1 must invert ownership per STATE / D-12 related shell ownership
- Mute button already in Crash HUD; menu needs equivalent wired to same `AudioPort`

</code_context>

<specifics>
## Specific Ideas

- User will **generate menu icons** after receiving an asset list (two small tile icons: Crash, HOTLINE)
- Prefer **minimal** presentation over marketing landing — hiring-manager clarity without overbuilt chrome
- User explicitly rejected a dedicated always-visible DEMO disclaimer; Crash never had one

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

Related v2 (already in REQUIREMENTS, not this phase):
- `?game=` deep-link (SHELL-V2-01)
- Shared wallet across games (SHELL-V2-02)

</deferred>

---

*Phase: 1-Portfolio Shell + Crash Session*
*Context gathered: 2026-10-09*
