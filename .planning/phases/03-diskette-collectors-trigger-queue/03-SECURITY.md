---
phase: "03"
slug: "diskette-collectors-trigger-queue"
status: verified
threats_open: 0
asvs_level: 1
created: "2026-10-10"
---

# Phase 03 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|----------------|
| public/assets → disk / Pixi | User-supplied PNGs land in repo and load via Assets | diskette/phone textures |
| Bundled JSON → Zod parse | Feature chances enter typed runtime at loadHotlineConfig | tokenOdds / triggerChance |
| Logic → DOM combo strip | Queue labels render in HUD outside canvas | combo strip copy |
| Session → AudioPort | SFX event IDs cross game/session into shared audio | collector beep events |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-03-01 | Tampering | public/assets/hotline diskette PNGs | low | mitigate | `tests/hotline.assets.test.ts` asserts 8-byte PNG signature for diskette-green/red/purple; no eval of asset bytes | closed |
| T-03-01b | Tampering | loadHotlineAssets diskette textures | low | mitigate | `required()` rejects empty/missing textures in `loadHotlineAssets.ts`; URLs are fixed constants | closed |
| T-03-02 | Tampering | HotlineConfigSchema tokenOdds / triggerChance | medium | mitigate | `chance01 = z.number().min(0).max(1)` in `HotlineConfigSchema.ts`; unit tests reject out-of-range | closed |
| T-03-03 | Tampering | HotlineHud combo strip | medium | mitigate | `setCombo` uses `textContent` only; `HotlineHud.test.ts` asserts no `.innerHTML` | closed |
| T-03-04 | Elevation of Privilege | Client meters / balance | low | accept | Client-only portfolio demo; logic kept consistent for honesty | closed |
| T-03-05 | Denial of Service | createBeepAudioPort | low | accept | Short beeps only; dispose on session teardown already established | closed |
| T-03-SC | Tampering | npm installs | low | accept | No new packages across 03-01..03-05; zod/pixi/Howler not newly introduced | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on (high) count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-03-01 | T-03-04 | Client-only demo; meters/balance not a server trust boundary | plan accept | 2026-10-10 |
| R-03-02 | T-03-05 | Short beeps; teardown dispose already in session pattern | plan accept | 2026-10-10 |
| R-03-03 | T-03-SC | No new npm packages in phase plans | plan accept | 2026-10-10 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-10 | 7 | 7 | 0 | verify-work / secure-phase (ASVS L1) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-10
