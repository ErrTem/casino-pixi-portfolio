---
phase: "03"
slug: "pixi-hybrid-view"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: "2026-09-27"
---

# Phase 03 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| npm registry → package.json | pixi.js install crosses the supply-chain boundary | Exact version pin `8.21.0` |
| CrashSnapshot → Pixi scene | Snapshot numbers are untrusted for drawing; the scene is read-only | Multiplier, phase, cashOutAt, crashAt |
| Canvas host → #hud-bar | Canvas must stay in the column above the HUD, not over the controls | DOM layout / CSS containment |
| Ticker → CrashGame.tick | One callback may pass only capped milliseconds | `ticker.deltaMS` (capped via minFPS) |
| resolveTick → wallet and history | Only flying→cashed_out may credit; only crash may push history | Payout cents / crashAt |
| Snapshot strings → theater text | Multiplier display is canvas text, not DOM HTML | `formatMult` → BitmapText.text |
| HUD enablement ← phase | cashed_out must not reopen place-bet | Phase + enablement flags |
| Future texture → rocket sprite | setBodyTexture accepts a Texture the caller already holds | Texture object (no network) |
| View timers → settlement | Hold, fade, flash, and bob must not call tick or credit the wallet | deltaMS clocks only |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-03-SC | Tampering | npm install pixi.js | high | mitigate | Exact pin `pixi.js@8.21.0` in package.json; Task 1 blocking-human gate before install | closed |
| T-03-01 | Tampering | CrashScene.sync | high | mitigate | sync takes snapshot + deltaMS only; no wallet.credit / sampleCrashAt / placeBet / multiplierAt under `src/games/crash/view` | closed |
| T-03-02 | Tampering | pathMapping | medium | mitigate | Non-finite multipliers return plot origin and tangent 0 (`pathMapping.ts`) | closed |
| T-03-03 | Denial of service | app.ticker | medium | mitigate | `app.ticker.minFPS = 10`; composition root passes `ticker.deltaMS` only (`main.ts`) | closed |
| T-03-04 | Tampering | hud.css canvas | medium | mitigate | `.canvas-host { position: relative; overflow: hidden }` — no fixed canvas over `#hud-bar` | closed |
| T-03-05 | Tampering | resolveTick cash-out | high | mitigate | Credit only in `cashOutToSpectator` when leaving flying with `lockedBetCents > 0`; cashed_out ticks update multiplier only | closed |
| T-03-06 | Information disclosure | History.push timing | medium | mitigate | `history.push(crashAt)` only in `crashIntoWaiting`; cash-out leaves history unchanged | closed |
| T-03-07 | Tampering | TheaterText | medium | mitigate | Live/frozen strings via `formatMult` → BitmapText.text; no innerHTML / HTML parser in view | closed |
| T-03-08 | Tampering | Rocket.setBodyTexture | medium | mitigate | Seam stores a caller-held Texture; no `Assets.load` / network URL in this phase | closed |
| T-03-09 | Tampering | Crash flash | low | accept | Flash is Graphics rect alpha only; stage.x / stage.y untouched. Pointer-event hardening deferred to Phase 4 | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on (`high`) count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-03-01 | T-03-09 | Crash flash is Graphics alpha only and does not move stage/HUD hit targets. Full pointer-event hardening is Phase 4 scope per plan disposition `accept`. | plan + secure-phase audit | 2026-09-27 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-09-27 | 10 | 10 | 0 | gsd-secure-phase (L1 ASVS short-circuit) |

### Evidence (L1)

| Threat ID | Evidence |
|-----------|----------|
| T-03-SC | `package.json` dependency `"pixi.js": "8.21.0"` |
| T-03-01 | No `wallet.credit` / `sampleCrashAt` / `placeBet` / `multiplierAt` under `src/games/crash/view` |
| T-03-02 | `pathMapping.ts` returns origin / tangent `0` when `!Number.isFinite(multiplier)` |
| T-03-03 | `src/main.ts`: `app.ticker.minFPS = 10`; `game.tick(ticker.deltaMS)` / `scene.sync(..., ticker.deltaMS)` |
| T-03-04 | `src/styles/hud.css` `.canvas-host` relative + overflow hidden |
| T-03-05 | `resolveTick.ts` `cashOutToSpectator` credits once; cashed_out branch updates elapsed/multiplier only |
| T-03-06 | `history.push` only in `crashIntoWaiting` |
| T-03-07 | `TheaterText.ts` BitmapText.text assignment; comment bans innerHTML |
| T-03-08 | `Rocket.ts` `setBodyTexture` assigns Texture; no `Assets.load` in view |
| T-03-09 | `CrashScene.ts` flash Graphics alpha; comments forbid stage.x/y writes |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-09-27
