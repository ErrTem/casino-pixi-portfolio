---
phase: "05"
slug: "gamble-paytable-polish"
status: verified
threats_open: 0
asvs_level: 1
created: "2026-10-12"
---

# Phase 5 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Config JSON → Zod parse | Untrusted static game config crosses into runtime math | hotline.config.json → HotlineConfig |
| DOM overlay clicks → Wallet | Player clicks can credit or debit demo balance | SURVIVE/DIE → integer cents |
| Config paytable → DOM text | Parsed multipliers rendered into the rules sheet | HotlineConfig → textContent nodes |
| Info dismiss → session busy | Overlay close restores interaction | boolean busy flag |
| CSS media queries → layout | Client viewport width drives control reflow | viewport → HUD CSS |
| Static /assets/hotline img URLs → DOM | Optional PNGs loaded as plain images | fixed path strings |
| AudioPort event ids → beep engine | Closed union must stay exhaustive | SfxEvent → PITCH_HZ |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-05-01 | Tampering | hotline.config.json / HotlineConfigSchema | medium | mitigate | Required features.gamble via Zod; invalid surviveChance or missing object throws at mount | closed |
| T-05-02 | Tampering | GambleOverlay / resolve path | medium | mitigate | Busy lock while present is gamble; resolve once per click; integer cents credit/debit only | closed |
| T-05-03 | Elevation | Wallet.debit | low | mitigate | debit rejects non-integer, non-positive, and over-balance amounts | closed |
| T-05-04 | Information | Demo balance in DOM | low | accept | Portfolio demo only; no secrets; SHELL-04 demo label already present | closed |
| T-05-05 | Tampering | PaytableOverlay render | medium | mitigate | createElement and textContent only; never assign HTML strings to innerHTML | closed |
| T-05-06 | Tampering | paytableSheetModel | low | mitigate | Consume Zod-parsed HotlineConfig only; no second unvalidated JSON parse | closed |
| T-05-07 | Denial of service | Info pause | low | accept | Local demo; user dismisses sheet; no server impact | closed |
| T-05-08 | Tampering | VHS img src paths | low | mitigate | Fixed static paths under /assets/hotline/; CSS fallback if missing | closed |
| T-05-08b | Tampering | HUD template structure | low | accept | Static portfolio markup; no user-supplied CSS | closed |
| T-05-09 | Denial of service | Large PNG decode | low | accept | Three small PNGs; demo only | closed |
| T-05-10 | Tampering | SfxEvent union drift | medium | mitigate | Exhaustive PITCH_HZ and ALL_EVENTS tests fail closed on missing ids | closed |
| T-05-SC | Tampering | npm installs | high | accept | No new packages in phase 5 plans; Howler remains deferred | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-05-01 | T-05-SC | No new npm packages in this phase; supply-chain legitimacy N/A | plan accept | 2026-10-12 |
| AR-05-02 | T-05-04 | Demo balance is not a secret; portfolio label already present | plan accept | 2026-10-12 |
| AR-05-03 | T-05-07 | Local-only Info pause; user dismisses; no server DoS surface | plan accept | 2026-10-12 |
| AR-05-04 | T-05-08b | Static markup and CSS; no user-supplied styles | plan accept | 2026-10-12 |
| AR-05-05 | T-05-09 | Three small optional PNGs; decode cost is demo-only | plan accept | 2026-10-12 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-12 | 12 | 12 | 0 | verify-work → secure-phase (ASVS L1 short-circuit) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-12
