---
phase: "04"
slug: "three-bonuses-combo-nights"
status: verified
threats_open: 0
asvs_level: 1
created: "2026-10-11"
---

# Phase 04 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|-----------------|
| Bundled JSON to Zod parse | Feature knobs enter typed runtime at loadHotlineConfig | spins, chances, weights, caps |
| DOM overlay to session | Continue / locker taps cross into night presenter | click indices, continue gestures |
| Config holdAndWin to respin loop | landChance and weights drive respin loop | RNG rolls, lives |
| Pixi scene mode to session | setHoldMode must pair true and false | hold chrome flag |
| Night snapshot to DOM combo strip | Path state rendered as HTML spans | path labels |
| Session to AudioPort | Feature SFX events | SfxEvent union strings |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-04-01 | Denial of Service | createNight retrigger loop | medium | mitigate | maxRetriggers Zod + createNight cap | closed |
| T-04-02 | Tampering | HotlineConfigSchema freeSpins/holdAndWin | medium | mitigate | Zod bounds on chances/weights/literals | closed |
| T-04-03 | Tampering | FeatureOverlay splash text | low | mitigate | textContent only | closed |
| T-04-04 | Tampering | Double credit of feature wins | medium | mitigate | credit once in spinFree / feature_exit | closed |
| T-04-05 | Denial of Service | overlay listener or presenter timer leak | low | mitigate | dispose removes handlers; ticker deltaMS | closed |
| T-04-06 | Elevation of Privilege | client wallet and night state | low | accept | client-only portfolio demo | closed |
| T-04-07 | Tampering | HotlineHud setFeatureLine | low | mitigate | textContent + pure formatter | closed |
| T-04-08 | Denial of Service | fs_gap timer after background tab | low | mitigate | finite deltaMS + 100ms clamp | closed |
| T-04-09 | Tampering | pick(index) from DOM | medium | mitigate | ignore OOB/duplicate/post-done picks | closed |
| T-04-10 | Tampering | FeatureOverlay prize text | low | mitigate | textContent only | closed |
| T-04-11 | Tampering | Double credit on purple | medium | mitigate | settle once; wallet on feature_exit | closed |
| T-04-12 | Denial of Service | Locker listener leak | low | mitigate | hideLockers/dispose remove listeners | closed |
| T-04-13 | Denial of Service | hold respin loop | medium | mitigate | landChance 0/1 termination tests; lives cap | closed |
| T-04-14 | Tampering | scene left in hold mode | high | mitigate | setHoldMode false on exit/idle/dispose/destroy | closed |
| T-04-15 | Tampering | Double credit hold total | medium | mitigate | settleFeature once when hold done | closed |
| T-04-16 | Spoofing | jackpot label vs config tier | low | accept | display mapping only; payouts use config keys | closed |
| T-04-17 | Tampering | combo strip HTML | low | mitigate | createElement + textContent in setComboPath | closed |
| T-04-18 | Denial of Service | npm test gate | low | accept | client demo; npm test is ship check | closed |
| T-04-19 | Tampering | session source grep drift | medium | mitigate | collectPresentation.test.ts kept in sync | closed |
| T-04-SC | Tampering | npm installs | low | accept | no new packages this phase | closed |

*Status: open · closed · open — below high threshold (non-blocking)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-04-01 | T-04-06 | Client-only portfolio demo; no real-money wallet or server authority | plan accept (04-01) | 2026-10-11 |
| AR-04-02 | T-04-16 | Jackpot strip labels are display mapping; payouts keyed from config | plan accept (04-04) | 2026-10-11 |
| AR-04-03 | T-04-18 | No production SLA; `npm test` is the ship gate for this demo | plan accept (04-05) | 2026-10-11 |
| AR-04-04 | T-04-SC | Phase adds no new npm packages; stack stays pixi/seedrandom/zod | plan accept (all plans) | 2026-10-11 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-11 | 20 | 20 | 0 | gsd-security-auditor + verify-work |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-11
