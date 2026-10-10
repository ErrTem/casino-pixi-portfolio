---
phase: "02"
slug: hotline-base-playable
status: verified
threats_open: 0
asvs_level: 1
block_on: high
register_authored_at_plan_time: true
created: "2026-10-10"
---

# Phase 02 - Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
> Register source: `<threat_model>` blocks of 02-01 through 02-07 PLAN.md. Each `mitigate` entry was checked against the code at HEAD (6cab17f), not against SUMMARY claims.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| bundled JSON to config loader | `hotline.config.json` is imported at build time and parsed once at session mount (stands in for backend config) | game math, paylines, weights, paytable (not user supplied, no PII) |
| public PNG and TTF to Pixi Assets | static files served from `public/assets/hotline` and the bundled font | image bytes decoded by the browser, never evaluated |
| player input to HUD to game facade | button clicks drive spin and bet step changes | integer step index, no free text |
| game session to shell | session mounts into the shared Pixi app, audio port and router, and must release them on abort | ticker handlers, DOM nodes, window listeners |
| npm registry to repo | dependency installs | `pixi.js`, `seedrandom`, `zod` only |

The client has no network calls, no auth, no storage of user data (only the mute preference), and no backend.

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation / Evidence | Status |
|-----------|----------|-----------|----------|-------------|------------------------|--------|
| T-02-01 | Tampering | loadHotlineConfig / HotlineConfigSchema | medium | mitigate | `loadHotlineConfig.ts:5` calls `HotlineConfigSchema.parse(raw)` with no catch or fallback. Schema locks `rows: z.literal(4)`, `reels: z.literal(5)`, `paylineCount: z.literal(40)`, 40 paylines of 5 rows 0..3, wild present on every reel, paytable ids present on every reel (`HotlineConfigSchema.ts:22-45,79-95`). `HotlineConfigSchema.test.ts:32-56` asserts malformed fixtures throw `ZodError`. `mountHotlineSession.ts:19` parses before any DOM is touched | closed |
| T-02-02 | Tampering | HotlineHud DOM writes | low | mitigate | `HotlineHud.ts:93-97` and `:64` write with `textContent` and `setAttribute` only. Repo wide search of `src` finds no `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `eval(`, `new Function`, `document.write`. `HotlineHud.test.ts:143` asserts the source has no `.innerHTML`. Status line text comes from a closed set of reason strings in `Wallet.ts` | closed |
| T-02-03 | Elevation of Privilege | Wallet / spin | low | accept | See AR-01. Integer cents and step membership checks still hold in code: `Wallet.ts:20-31` (`Number.isInteger`, `betStepsCents.includes`, balance check) and `HotlineGame.ts:78-82` (clamp and finite check on step index) | closed |
| T-02-04 | Denial of Service | mountHotlineSession dispose | medium | mitigate | `mountHotlineSession.ts:106-125`: `disposed` guard makes dispose idempotent, removes abort and menu listeners, removes the ticker handler, disposes HUD, destroys scene and view listeners, clears `resizeTo`, `app.stop()`, removes canvas and screen. It never calls `app.destroy()` or `audio.dispose()`, so the shell app and audio stay alive. Abort listener is registered (`:102`) before the only long await (`:127`), and a post-await `disposed` check (`:129-134`) cleans a late mount. Router calls `controller.abort()` in `goMenu` (`router.ts:50-53`) and on router dispose | closed |
| T-02-05 | Tampering | SfxEvent widen | low | mitigate | `AudioPort.ts:2-9` is a closed string union (adds `spin`, `reel_stop`, `win`). `createBeepAudioPort.ts:38` types `PITCH_HZ: Record<SfxEvent, number>`, so a missing key fails `tsc`. `npx tsc --noEmit` passes at HEAD, so Crash callers still typecheck. `createBeepAudioPort.test.ts` plays every event | closed |
| T-02-06 | Denial of Service | reel ticker and win cycle ticker | medium | mitigate | `src/games/hotline/view` has no `ticker`, `requestAnimationFrame`, `setInterval` or `setTimeout` of its own. Reel and overlay motion run from `scene.sync` / `overlay.tick` inside the single session `onTick` (`mountHotlineSession.ts:139-144`), which dispose removes with `ctx.app.ticker.remove(onTick)` (`:110-113`). `HotlineScene.destroy` (`:213-221`) destroys overlay, reel window and phones, whose own destroy calls tear down their containers (`ReelStrip.ts:225`, `createReelWindow.ts:85`, `WinLinesOverlay.ts:157`, `PhonesLayer.ts:41`) | closed |
| T-02-07 | Information Disclosure | LINE N PAYS text | low | accept | See AR-02. Text is payout of a demo balance, no PII or secrets in the client | closed |
| T-02-08 | Tampering | public/assets/hotline PNGs | low | mitigate | `tests/hotline.assets.test.ts:41-49` reads every URL in `HOTLINE_ASSET_URLS` from `public/` and asserts the 8 byte PNG signature. Asset bytes only go through `Assets.load` and `Texture`; there is no eval or dynamic import of asset content (`loadHotlineAssets.ts`). URLs are fixed constants under `/assets/hotline`, no user derived paths. Test passes (268 of 268 green) | closed |
| T-02-09 | Denial of Service | Assets.load missing files | medium | mitigate | `loadHotlineAssets.ts:62-99` wraps `Assets.load` and the font load in try/catch that rethrow, and `required()` throws on a non Texture, `Texture.EMPTY` or width 1 result for all 14 textures. `mountHotlineView.ts:19` awaits it before building the scene, so the mount rejects. `router.ts:86-90` catches a failed mount, reports it and calls `goMenu()`. The session abort listener is already registered, so `goMenu` aborts and runs dispose | closed |
| T-02-10 | Spoofing | title / HUD copy | low | accept | See AR-03. Static portfolio strings, no user content rendered | closed |
| T-02-SC | Tampering | npm installs (02-01, zod, high) | high | mitigate | 02-01 Task 1 was a blocking human verify of the zod package, approved before install (02-01-SUMMARY.md line 62). `package.json` has `zod ^4.6.5`, lockfile pins `zod 4.6.5` from `registry.npmjs.org` with an integrity hash (`package-lock.json:1798-1802`). `npm audit --omit=dev` reports 0 vulnerabilities. No `howler`, `pixi-reels` or `gsap` in the lockfile | closed |
| T-02-SC | Tampering | npm installs (02-02..02-07) | low | accept | See AR-04. `package.json` dependencies are still only `pixi.js 8.21.0`, `seedrandom` and `zod`, so no later plan added a package | closed |

*Status: open, closed, open (below block_on threshold, non-blocking)*
*Severity: only open threats at or above `block_on: high` count toward `threats_open`*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-01 | T-02-03 | Client demo balance only. There is no real money or backend, and cheating the local wallet has no impact. Integer cent and step membership checks are kept anyway | plan 02-02 threat model (disposition accept) | 2026-10-10 |
| AR-02 | T-02-07 | Payout callouts describe the demo balance only and carry no personal data | plan 02-05 threat model (disposition accept) | 2026-10-10 |
| AR-03 | T-02-10 | Title and HUD copy are static strings shipped in the bundle | plan 02-07 threat model (disposition accept) | 2026-10-10 |
| AR-04 | T-02-SC (02-02..02-07) | No dependency changes in these plans, verified against `package.json` and the lockfile | plans 02-02 to 02-07 threat models (disposition accept) | 2026-10-10 |

---

## Unregistered Flags

SUMMARY.md `## Threat Flags` for 02-06 and 02-07 say "None" and map to T-02-08 and T-02-09. No other summary has a flag section. No unregistered attack surface found.

### Informational notes (not blockers, not counted in threats_open)

These come from `02-REVIEW.md` and were re-checked in code. They are resource cleanup edge cases on error paths, not exploitable security issues, and are below the `high` block threshold.

| Ref | Observation | Related threat | Severity |
|-----|-------------|----------------|----------|
| WR-02 | If `mountHotlineHud` or the menu button lookup throw after `ctx.root.append(screen)` (`mountHotlineSession.ts:31,72,89`), the abort listener does not exist yet, so the screen and canvas stay attached. Only triggers on a broken HTML template, which is bundled and tested. The asset failure path (T-02-09) is not affected | T-02-04 | low |
| WR-03 | `mountHotlineView.ts:30-32` adds `orientationchange` and `visualViewport` listeners before `createHotlineScene` (`:39`), which can throw on a missing symbol texture. A failed mount then leaves the listeners firing `app.resize()` on the shell app | T-02-04 / T-02-09 | low |
| WR-01 | Spin is accepted before the view mounts (functional integrity of the demo balance, no trust impact) | T-02-03 (accepted) | low |
| WR-04 | Schema does not require equal symbol sets per reel, so a late throw is possible inside the ticker | T-02-01 | low |

Recommend fixing WR-02 and WR-03 in a follow up quick task.

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-10 | 12 register rows (11 unique IDs) | 12 | 0 | gsd-security-auditor (retroactive verify, ASVS L1, block_on high) |

Verification run at HEAD 6cab17f: `npx vitest run` 42 files and 268 tests passed, `npx tsc --noEmit` clean, `npm audit --omit=dev` 0 vulnerabilities.

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-10
