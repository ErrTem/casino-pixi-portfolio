# Walking Skeleton — casino-pixi-portfolio (HOTLINE + Crash)

**Phase:** 1
**Generated:** 2026-10-09

## Capability Proven End-to-End

A visitor opens the page, lands on a dark demo menu, launches Crash on the shell-owned Pixi `Application`, plays, clicks **Menu**, and is back on the menu with Crash fully torn down (no ticks, no window listeners, no canvas) — mute and the boot `?seed=` carry across every hop.

Proven by plan 01-01 task 1 (tracer), hardened by 01-01 task 2, completed by 01-02 / 01-03, signed off in 01-04.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | PixiJS `8.21.0` (pinned) + plain DOM shell + Vite 6 + TypeScript 5.8 | Crash already ships on this stack; DOM menu matches the Crash HUD voice; no React/Vue (locked) |
| Data layer | None (client-only). `localStorage` holds one key: `portfolio-demo:mute` (`"1"`/`"0"`), migrated once from `crash-demo:mute` (D-16) | Portfolio demo with no backend; game balances are per-session and in memory only (D-09, per-game balances) |
| Auth | None | Public static demo |
| Deployment target | Static `dist/` from `npm run build`; local full run is `npm run dev` (port 5173) or `npm run build && npm run preview` | No server; any static host works |
| Directory layout | `src/shell/` (DOM shell, router, menu, boot), `src/games/<id>/{logic,view,hud,session}`, `src/shared/` stays DOM-free (architecture test bans `document.`/`window.` there) | Shell needs DOM; keeps the ARCH-02 boundary intact; new games drop in under `src/games/` |
| Game contract | `GameDefinition { id, title, blurb, iconUrl, enabled, mount? }`, `mount(ctx: ShellContext) => Promise<GameSession>`, `GameSession { dispose() }` idempotent | Same contract for HOTLINE in Phase 2; router never imports game internals |
| Ownership | Shell owns one `Application` (created once at boot, `autoStart: false`, `sharedTicker: false`), one `AudioPort` (created once, D-12), and the boot seed string (parsed once, D-11) | Locked: long-lived app; sessions borrow, never destroy or dispose shell resources |
| Shell context | `ShellContext { app, root, audio, seed, signal, requestMenu }` | `signal` (AbortSignal) lets a session cancel itself when the visitor leaves while it is still loading |
| Routing | Pure router state machine in `src/shell/router.ts` (`idle` / `menu` / `launching` / `game` / `disposed`), epoch counter plus per-launch `AbortController`; no DOM, no pixi value imports | Node Vitest can prove dispose counts and launch races without a browser |
| Game loading | Registry `mount` uses dynamic `import()` of the session module | Keeps the registry free of pixi/DOM at module load (node-testable) and lets later games load on demand |
| Screen markup | Each game screen is a `<template>` in `index.html` cloned per launch into `#app`; the clone root carries `.app-shell` | Fresh DOM every launch satisfies D-09; per-screen `hud-zone--broke` dies with the clone |
| Canvas lifecycle per session | Mount: `host.replaceChildren(app.canvas)`, `app.resizeTo = host`, `app.start()`. Leave: ticker callback off, HUD dispose, scene destroy (`children: true`, textures kept), view listeners off, `resizeTo` cleared, `app.stop()`, canvas removed, screen removed | Enumerated leak sources from research (Ticker.shared AnimatedSprites, window keydown, rAF tween, orientation/visualViewport, ResizePlugin listener) |
| Menu | DOM built with `createElement` / `textContent` only; Retro Computer TTF via CSS `@font-face`; native `<button disabled>` for HOTLINE stub | No HTML-string injection; D-03 font; D-05 not clickable by construction |
| Audio | Existing `createBeepAudioPort` behind `AudioPort`; one shared mute binder for the menu, CrashHud keeps its own identical label code | One backend per stack notes; Howler arrives with HOTLINE SFX later |
| Testing | Vitest in `node` env; pure modules tested with hand-rolled fakes; DOM/source invariants as string-level tests (`tests/shell.hud-layout.test.ts`, `tests/architecture.shell.test.ts`); no jsdom/happy-dom | Matches existing repo style; no new dependencies |

## Stack Touched in Phase 1

- [x] Project scaffold (framework, build, lint, test runner) — existing Vite + TS + Vitest; `npm run build` restored to green (Rocket interface fix in 01-01, sessionStats label fix in 01-02)
- [ ] Routing — menu screen and Crash screen, with Menu back (01-01)
- [ ] Persistence — mute read at boot and written on toggle under `portfolio-demo:mute`, legacy key migrated once (01-02, 01-03)
- [ ] UI — Crash tile launches Crash; Menu button returns; menu mute toggles the shared `AudioPort` (01-01, 01-03)
- [ ] Deployment — `npm run build` green and `npm run dev` full local run verified by the visitor checklist (01-04)

## Out of Scope (Deferred to Later Slices)

- HOTLINE gameplay of any kind (Phase 2+); HOTLINE is a disabled tile only
- `?game=` deep link (SHELL-V2-01) and shared wallet across games (SHELL-V2-02)
- Persistent demo / no-real-money banner (D-13 rejects it; voice lives in page title, menu subtitle, Reset demo)
- Seed chip or any on-screen seed display (existing D-21 rule, layout test keeps it out)
- Howler, zod, jsdom / happy-dom, any new npm package
- Resuming a Crash session after leaving (D-09 fresh session every launch)
- Pixi `8.22.0` bump

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering its architectural decisions:

- Phase 2: HOTLINE base playable — add `src/games/hotline/` with a `mount(ctx)` session and a `<template>` screen, flip the registry entry to `enabled: true`, Zod-validated JSON config, 5x4 / 40-line base spins
- Phase 3: Diskette collectors and trigger queue inside the HOTLINE session
- Phase 4: Three bonuses and combo nights
- Phase 5: VHS gamble, paytable overlay, responsive polish

## Artifacts This Phase Produces

| Path | Symbols | Plan |
|---|---|---|
| `src/shell/types.ts` | `GameId`, `ShellContext`, `GameSession`, `GameDefinition`, `Disposable` | 01-01 |
| `src/shell/router.ts` | `createRouter`, `createContextFactory`, `Router`, `RouterDeps`, `RouterState` | 01-01 |
| `src/shell/router.test.ts` | router happy path, seed/audio identity, launch races | 01-01 |
| `src/shell/gameRegistry.ts` | `GAMES`, `MENU_COPY` | 01-01, 01-03 |
| `src/shell/gameRegistry.test.ts` | order, stub, copy voice | 01-03 |
| `src/shell/bootShell.ts` | `bootShell` | 01-01, 01-03 |
| `src/shell/menu/mountMenu.ts` | `mountMenu`, `MountMenuOptions` | 01-01, 01-03 |
| `src/shell/muteBinding.ts` | `bindMuteButton`, `muteLabel`, `MuteButton` | 01-03 |
| `src/shell/muteBinding.test.ts` | menu mute behavior | 01-03 |
| `src/games/crash/session/mountCrashSession.ts` | `mountCrashSession` | 01-01 |
| `src/games/crash/view/mountCrashView.ts` | `mountCrashView(app)`, `MountedCrashView { scene, dispose }` | 01-01 |
| `src/games/crash/view/CrashScene.ts` | `CrashScene.destroy` | 01-01 |
| `src/games/crash/hud/CrashHud.ts` | `CrashHud.dispose` | 01-01 |
| `src/shared/audio/mutePref.ts` | `MUTE_STORAGE_KEY = "portfolio-demo:mute"`, `LEGACY_MUTE_STORAGE_KEY` | 01-02 |
| `tests/shell.seedReuse.test.ts` | seed replay across launches | 01-02 |
| `tests/architecture.shell.test.ts` | shell DOM-injection ban, session teardown contract | 01-01 |
| `index.html` | `#app` mount, `#crash-screen-template`, Menu button, portfolio `<title>` | 01-01, 01-03 |
| `src/styles/hud.css` | `@font-face` Retro Computer, `.menu-*`, `.menu-back` | 01-03 |
| `public/assets/menu/icon-crash.png`, `icon-hotline.png` | user-supplied tile icons | 01-04 |
