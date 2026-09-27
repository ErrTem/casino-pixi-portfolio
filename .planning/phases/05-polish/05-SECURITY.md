---
phase: "05"
slug: polish
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: "2026-09-27"
---

# Phase 05 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| GameLogic snapshot → CrashScene theater | Countdown is presentation of `waitRemainingMs`; logic remains cadence authority | Snapshot fields (waitRemainingMs, phase) |
| ViewMode idle vs crash hold | Gate must not flash tenths over crash × | viewMode.mode |
| Snapshot transition → AudioPort.play | Edges are observation-only; settle stays in GameLogic | Phase transitions / SfxEvent |
| Mute preference → localStorage | Preference only — not account or wallet | `crash-demo:mute` "1"/"0" |
| URL query `?seed=` → parseBootSeed → createGame | Untrusted string bounded before RNG / UI | Opaque seed string |
| Seed string → HUD DOM | Reflection XSS surface — textContent only | Seed display string |
| Keyboard → requestCashOut | Must match button gate; never fire while typing | Keydown → cash-out intent |
| snapshot.history → session stats | Display-only aggregation; settle unchanged | Finite crash multipliers |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-5-01-01 | Tampering | CrashScene countdown vs settle | high | mitigate | No GameLogic edits; `formatWaitCountdown(waitRemainingMs)` only; climb/crash paths unchanged | closed |
| T-5-01-02 | Spoofing | Theater digits mistaken for live × | low | accept | No × suffix; white waiting tint; clears on flight (D-03/D-04) | closed |
| T-5-01-03 | Denial of service | Per-frame Text texture upload | medium | mitigate | Reuse TheaterText BitmapText; no new Text/HTMLText | closed |
| T-5-02 | Tampering | mutePref localStorage | medium | mitigate | Key `crash-demo:mute` only; never wallet/seed; injectable store for tests | closed |
| T-5-02-01 | Denial of service | Autoplay spam / tick SFX | medium | mitigate | Four SfxEvents only; edge-detect once per transition; no countdown tick SFX; mute no-op | closed |
| T-5-02-02 | Tampering | Audio driving settle | high | mitigate | Audio outside `logic/`; edges read-only; no audio imports in GameLogic | closed |
| T-5-02-03 | Elevation / supply chain | Howler without assets | medium | mitigate | No Howler; oscillators only behind AudioPort | closed |
| T-5-01 | Tampering / XSS | Seed chip DOM | high | mitigate | textContent only; reject control chars + length >128; never innerHTML | closed |
| T-5-03-01 | Information disclosure | Clipboard | medium | mitigate | Copy only on chip click; copies seed string only | closed |
| T-5-03-02 | Spoofing | Provably-fair claims | medium | mitigate | Chip/aria: demo session seed only; no crypto fairness language | closed |
| T-5-03-03 | Tampering | Mid-session URL seed | medium | mitigate | Boot-only `parseBootSeed` in main; no popstate listener | closed |
| T-5-04-01 | Tampering | Keyboard cash-out while typing | high | mitigate | `isEditableTarget` guard; `canCashOut` gate; preventDefault only when cashing out | closed |
| T-5-04-02 | Tampering | Alternate settle path from keys | high | mitigate | Same `game.requestCashOut` as button; enablement.ts unmodified; no logic/ edits | closed |
| T-5-04-03 | Information disclosure / XSS | Stats / labels DOM | medium | mitigate | textContent only; history finite-filtered in `sessionStatsFrom` | closed |
| T-5-04-04 | Denial of service | Bar growth / canvas collapse | medium | mitigate | Thin stats row; `--hud-bar-height: 15.5rem` ≤720px; overflow-y auto | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on (high) count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-05-01 | T-5-01-02 | Theater countdown digits may briefly resemble a multiplier; mitigated by no × suffix, white tint, and clear-on-flight — residual confusion accepted for polish UX | plan disposition (05-01) | 2026-09-27 |

*Accepted risks do not resurface in future audit runs.*

---

## Evidence (L1 ASVS)

| Threat ID | Evidence |
|-----------|----------|
| T-5-01-01 | `CrashScene.ts` imports `formatWaitCountdown`; no audio/GameLogic edits for countdown |
| T-5-01-02 | `formatWaitCountdown` returns tenths without ×; accepted at plan time |
| T-5-01-03 | TheaterText BitmapText reuse; architecture tests ban `.innerHTML` / Text churn |
| T-5-02 | `MUTE_STORAGE_KEY = "crash-demo:mute"` in `mutePref.ts` |
| T-5-02-01 | `SfxEvent` union of four keys; `sfxEdges` edge-detect; no countdown tick |
| T-5-02-02 | No `shared/audio` imports under `src/games/crash/logic/` |
| T-5-02-03 | No Howler dependency; `createBeepAudioPort` oscillators |
| T-5-01 | `seedChip.ts` + `parseBootSeed` length/control-char reject; textContent only |
| T-5-03-01 | `copyBtn` → `clipboard.writeText(seed)` on click only |
| T-5-03-02 | `aria-label="Demo session seed"`; RNG comments say not provably fair |
| T-5-03-03 | `parseBootSeed` called once from `main.ts`; no `popstate` |
| T-5-04-01 | `isEditableTarget` + `canCashOut` before Space/Enter cash-out |
| T-5-04-02 | Keydown calls same `game.requestCashOut()` as button |
| T-5-04-03 | `statAvg`/`statMax` via textContent; `sessionStatsFrom` filters non-finite |
| T-5-04-04 | `hud.css` keeps `--hud-bar-height: 15.5rem` on ≤720px |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-09-27 | 15 | 15 | 0 | gsd-secure-phase (ASVS L1, plan-time register) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-09-27

*ASVS level 1 short-circuit: `threats_open: 0` + `register_authored_at_plan_time: true` — L1 grep-depth verification sufficient; auditor not required.*
