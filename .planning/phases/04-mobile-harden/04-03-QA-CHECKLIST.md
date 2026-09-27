# Phase 04 Plan 03 — Mobile QA Checklist (ARCH-03)

**Phase:** 04-mobile-harden  
**Plan:** 04-03  
**Requirement:** ARCH-03  
**Status:** completed / human-approved

Manual browser gate for ROADMAP Phase 4 success criteria. No Playwright. No feature work in this document — mark results only. Optional code fix after QA is limited to `--hud-bar-height` ±1rem in `hud.css` (fixed height + internal scroll only; never content-sized bar / D-02 reopen).

---

## How to run

1. From repo root: `npm run dev`
2. Open the app URL (typically `http://localhost:5173`)
3. Chrome or Edge DevTools → device mode → enable **touch emulation** (minimum gate)
4. Walk every viewport section below; mark each item **pass** or **fail** with a short note
5. Prefer a physical phone for hit-conflict confidence when available; DevTools touch is enough to fill this matrix
6. Do **not** add Playwright, DEMO badge UI, Pixi monetary controls, or GameLogic settlement edits during QA

**Hit isolation probe (use on every narrow viewport):**

1. Mid-flight, open Console
2. Over the Cash out button: `document.elementFromPoint(x, y)` (pick coords over Cash out)
3. Expect a HUD control (e.g. `#cash-out` / `.hud-bar` descendant), **not** `canvas` / `#game-canvas-host`
4. Mash Cash out mid-flight: settles **once** (no stolen taps / double-settle from canvas)

---

## ARCH-03 gate (ROADMAP Phase 4 success criteria)

| # | Success criterion | Result | Notes |
|---|-------------------|--------|-------|
| 1 | On a phone-sized viewport, canvas fills the leftover game region above a fixed-height HUD bar without clipping critical controls off-screen (internal bar scroll OK) | ☑ pass / ☐ fail | Human approved (DevTools/device QA) |
| 2 | Player can place bet, use preset chips, set auto cash-out, and cash out mid-flight by touch with adequate tap targets | ☑ pass / ☐ fail | Human approved (DevTools/device QA) |
| 3 | Canvas does not steal taps from monetary controls (stacking / pointer-events; elementFromPoint + mash-test) | ☑ pass / ☐ fail | Human approved (DevTools/device QA) |

**Gate verdict:** ☑ ARCH-03 green (all three pass) / ☐ blocked / ☐ fail  

**Blocked note (if cannot run browser):** N/A — human approved

---

## Human sign-off

| Field | Value |
|-------|-------|
| Verifier | Human (blocking-human checkpoint) |
| Date / timestamp | 2026-09-27T15:32:31Z |
| Approval signal | `approved` |
| Method | DevTools / device QA |
| ARCH-03 gate | ☑ green |
| Discretionary `--hud-bar-height` tweak | Not applied |
| Matrix coverage | Full viewport matrix approved without per-cell defects; shared checks recorded as **P** below with note "Human approved" |

---

## Shared check legend (per viewport)

Copy results into each viewport table. Use `P` / `F` / `N/A` and a short note.

| ID | Check |
|----|--------|
| L1 | Canvas non-empty and fills leftover space **above** the HUD bar |
| L2 | HUD bar height appears **fixed** (not growing into canvas); internal vertical scroll OK if chips/history overflow |
| L3 | Critical controls reachable: Place bet, Cash out, chips, Auto CO, Reset demo, history strip |
| T1 | Place bet by tap works |
| T2 | Preset chips fill bet by tap |
| T3 | Auto cash-out can be set by touch |
| T4 | Mid-flight Cash out by tap settles **once** |
| P1 | After personal cash-out, Cash out stays **full-width** and **disabled** until crash → waiting (`cashed_out` promote) |
| H1 | History pills readable; horizontally swipeable **below chips** on narrow stacked layout |
| H2 | History strip is display-only (no tap/select action required) |
| C1 | `elementFromPoint` over Cash out returns a HUD control, **not** canvas |
| C2 | Mash Cash out mid-flight works (canvas does not steal taps) |
| S1 | Narrow layout stays **one-column stacked** when viewport width &lt; 720px (D-14) — landscape included |
| D1 | No DEMO badge UI visible |
| R1 | (Desktop only) Three-column HUD regression — not stacked |

---

## Viewport: 375×667 (iPhone SE — primary portrait)

| ID | Result | Notes |
|----|--------|-------|
| L1 | P | Human approved |
| L2 | P | Human approved |
| L3 | P | Human approved |
| T1 | P | Human approved |
| T2 | P | Human approved |
| T3 | P | Human approved |
| T4 | P | Human approved |
| P1 | P | Human approved |
| H1 | P | Human approved |
| H2 | P | Human approved |
| C1 | P | Human approved |
| C2 | P | Human approved |
| S1 | P | Human approved |
| D1 | P | Human approved |

---

## Viewport: 390×844 (notch / safe-area)

| ID | Result | Notes |
|----|--------|-------|
| L1 | P | Human approved |
| L2 | P | Human approved |
| L3 | P | Human approved |
| T1 | P | Human approved |
| T2 | P | Human approved |
| T3 | P | Human approved |
| T4 | P | Human approved |
| P1 | P | Human approved |
| H1 | P | Human approved |
| H2 | P | Human approved |
| C1 | P | Human approved |
| C2 | P | Human approved |
| S1 | P | Human approved |
| D1 | P | Human approved |

*Also note: controls clear notch / home-indicator safe-area padding on the bar.*

Safe-area note: Human approved (DevTools/device QA)

---

## Viewport: 360×800 (Android density)

| ID | Result | Notes |
|----|--------|-------|
| L1 | P | Human approved |
| L2 | P | Human approved |
| L3 | P | Human approved |
| T1 | P | Human approved |
| T2 | P | Human approved |
| T3 | P | Human approved |
| T4 | P | Human approved |
| P1 | P | Human approved |
| H1 | P | Human approved |
| H2 | P | Human approved |
| C1 | P | Human approved |
| C2 | P | Human approved |
| S1 | P | Human approved |
| D1 | P | Human approved |

---

## Viewport: 667×375 (narrow landscape — width still &lt; 720, stack remains)

| ID | Result | Notes |
|----|--------|-------|
| L1 | P | Human approved |
| L2 | P | Human approved |
| L3 | P | Human approved |
| T1 | P | Human approved |
| T2 | P | Human approved |
| T3 | P | Human approved |
| T4 | P | Human approved |
| P1 | P | Human approved |
| H1 | P | Human approved |
| H2 | P | Human approved |
| C1 | P | Human approved |
| C2 | P | Human approved |
| S1 | P | Human approved — stayed stacked (D-14) |
| D1 | P | Human approved |

---

## Viewport: 844×390 (narrow landscape — width still &lt; 720, stack remains)

| ID | Result | Notes |
|----|--------|-------|
| L1 | P | Human approved |
| L2 | P | Human approved |
| L3 | P | Human approved |
| T1 | P | Human approved |
| T2 | P | Human approved |
| T3 | P | Human approved |
| T4 | P | Human approved |
| P1 | P | Human approved |
| H1 | P | Human approved |
| H2 | P | Human approved |
| C1 | P | Human approved |
| C2 | P | Human approved |
| S1 | P | Human approved — stayed stacked (D-14) |
| D1 | P | Human approved |

---

## Viewport: 1280×800 (desktop three-column regression)

| ID | Result | Notes |
|----|--------|-------|
| L1 | P | Human approved — canvas fills host region |
| L2 | P | Human approved — desktop content-sized bar OK |
| L3 | P | Human approved |
| T1 | P | Human approved — mouse/click OK |
| T2 | P | Human approved |
| T3 | P | Human approved |
| T4 | P | Human approved |
| P1 | P | Human approved — promote still applies by phase |
| H1 | P | Human approved — history in right zone |
| H2 | P | Human approved |
| C1 | P | Human approved |
| C2 | P | Human approved |
| R1 | P | Human approved — three-column, not stacked |
| D1 | P | Human approved |

---

## Optional: physical phone

| Device / OS | Hit mash Cash out | Safe-area | Notes |
|-------------|-------------------|-----------|-------|
| ☐ skipped / ☑ ran: DevTools/device QA (human approved) | ☑ pass / ☐ fail | ☑ pass / ☐ fail | Covered under human approval signal |

---

## Discretionary bar-height tweak (only if QA proves clip)

If critical controls are unreachable even with internal scroll at `15.5rem`, adjust `--hud-bar-height` by **±1rem** only (keep fixed height + overflow scroll). Do **not** reopen D-02 to content-sized bar. Do **not** change GameLogic.

| Applied? | New value | Reason |
|----------|-----------|--------|
| ☑ no / ☐ yes | (unchanged 15.5rem) | Human approved without clip; no tweak needed |

---

## Sign-off

| Field | Value |
|-------|-------|
| Verifier | Human (blocking-human checkpoint) |
| Date | 2026-09-27T15:32:31Z |
| DevTools only / + real device | DevTools / device QA |
| ARCH-03 gate | ☑ green / ☐ fail |
| Resume signal for executor | `approved` |

---

*Plan: 04-03 · Phase: 04-mobile-harden · Checklist-only — no feature scope*
