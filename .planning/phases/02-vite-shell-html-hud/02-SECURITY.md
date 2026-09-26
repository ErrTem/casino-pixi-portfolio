---
phase: "02"
slug: "vite-shell-html-hud"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: "2026-09-26"
---

# Phase 02 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Browser DOM inputs → CrashGame commands | Untrusted bet / auto-CO numbers from HTML inputs | Numeric strings → facade commands |
| HUD render ← CrashSnapshot | Snapshot trusted in-session; HUD must not invent balance/history | CrashSnapshot fields → DOM text |
| Chip buttons → bet input | Static presets still submitted via placeBet validation | Preset numbers → input value only |
| snapshot.history → DOM text | In-session multipliers; XSS if rendered via innerHTML | number[] → textContent |
| package.json deps → runtime | Vite install expands supply chain; pixi.js deferred | npm lock → node_modules |
| logic/shared ↔ hud/ | ARCH-02: logic stays free of DOM/pixi | Import / API surface only |
| Enablement flags → DOM disabled | Derived UX; facade still no-ops illegal commands | CrashSnapshot → button.disabled |
| Reset demo click → resetWallet | User-triggered wallet restore; no auto top-up | Click → resetWallet() |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-02-01 | Tampering | CrashHud placeBet path | medium | mitigate | Coerce `Number(bet.value)` then `game.placeBet`; surface `PlaceBetResult.reason` via textContent (`CrashHud.ts`) | closed |
| T-02-02 | Tampering | #game-canvas-host | medium | mitigate | Empty slot + placeholder only in `index.html`; monetary controls live in `#hud-bar` (VIS-02 / D-04) | closed |
| T-02-03 | Information Disclosure | History/status DOM | low | accept | Demo-only session; no PII; status shows logic reasons | closed |
| T-02-04 | Tampering | logic/ after Vite lands | high | mitigate | `tests/architecture.no-pixi.test.ts` forbids pixi/DOM in logic+shared; package.json must not list pixi.js | closed |
| T-02-SC | Tampering | npm vite install | high | mitigate | Pin `vite@6.4.3` (lockfile resolved); no pixi.js; no unexpected runtime deps | closed |
| T-02-05 | Tampering | auto-co input | medium | mitigate | Empty→`null`; else `Number(raw)` → `setAutoCashOut` (`CrashHud.ts`); GameLogic stores/validates | closed |
| T-02-06 | Elevation of Privilege | resetWallet | low | accept | Demo-only session restore; no auth; always user-initiated click | closed |
| T-02-07 | Spoofing | enablement disabled attrs | low | mitigate | `enablementFrom` sets UX disabled only; comment + facade remain authority (`CrashHud.ts`, `enablement.ts`) | closed |
| T-02-08 | Tampering | broke UX path | medium | mitigate | Emphasize Reset demo; Wallet documents no auto top-up (D-03); no auto-refill path | closed |
| T-02-09 | Tampering | chip → placeBet path | medium | mitigate | Chips fill `bet.value` only; never call `placeBet` (`CrashHud.ts` / `chips.ts`) | closed |
| T-02-10 | XSS (Injection) | history strip DOM | high | mitigate | `createElement` + `textContent` only; never `innerHTML` (`historyStrip.ts`) | closed |
| T-02-11 | Tampering | HUD-local history | medium | mitigate | `renderHistoryStrip(history, snap.history)` only; no parallel store / localStorage | closed |
| T-02-12 | Information Disclosure | history multipliers | low | accept | Demo crash points only; no PII | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on (`high`) count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*
*register_authored_at_plan_time: true — threat models present in 02-01/02-02/02-03 PLAN.md*
*Note: T-02-SC “no new deps” accept entries from 02-02/02-03 are covered by the stronger T-02-SC mitigate (pinned vite, no pixi).*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-02-01 | T-02-03 | Demo-only session HUD; status/history expose in-session game reasons/multipliers, not PII | plan disposition (02-01) | 2026-09-26 |
| AR-02-02 | T-02-06 | `resetWallet` is intentional demo restore with no auth boundary | plan disposition (02-02) | 2026-09-26 |
| AR-02-03 | T-02-12 | History strip shows demo crash multipliers only | plan disposition (02-03) | 2026-09-26 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-09-26 | 13 | 13 | 0 | gsd-secure-phase (L1 short-circuit) |

### Evidence (L1)

| Threat ID | Evidence |
|-----------|----------|
| T-02-01 | `src/games/crash/hud/CrashHud.ts` placeBet click: `Number(bet.value)` + `game.placeBet` + reason → `textContent` |
| T-02-02 | `index.html` `#game-canvas-host` empty aside placeholder; bet/cash-out/reset in `#hud-bar` |
| T-02-04 | `tests/architecture.no-pixi.test.ts` scans logic/shared; asserts no `pixi.js` in package.json |
| T-02-SC | `package.json` / lockfile `vite@6.4.3`; `pixi.js` absent |
| T-02-05 | `CrashHud.ts` `applyAutoCo`: empty→null else `Number(raw)` |
| T-02-07 | `enablementFrom` + `*.disabled = !en.*`; facade still invoked on clicks |
| T-02-08 | Broke emphasis on Reset; `Wallet.ts` “No auto top-up (D-03)” |
| T-02-09 | Chip click sets `bet.value` only |
| T-02-10 | `historyStrip.ts` createElement + textContent; no `innerHTML` under `src/` |
| T-02-11 | `render(snap)` calls `renderHistoryStrip(history, snap.history)` only |

ASVS level 1 + plan-time register + threats_open 0 → auditor spawn skipped per secure-phase short-circuit.

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-09-26
