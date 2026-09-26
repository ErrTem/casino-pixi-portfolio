# Roadmap — Crash Pixi Portfolio

**Created:** 2026-09-26  
**Granularity:** fine  
**Milestone:** v1 — Playable demo Crash (client-only)

## Overview

Ship a recruiter-ready Crash demo in five small phases: boot the Pixi shell, prove pure game logic with tests, settle the demo wallet, wire a playable loop, then polish the graph visual + SFX stubs + folder seams.

## Phases

- [ ] **Phase 1: Boot shell + DEMO frame** — Vite/TS/PixiJS v8 page with responsive canvas and DEMO labeling
- [ ] **Phase 2: Pure GameLogic + tests** — Seeded RNG, round FSM, multiplier advance; no Pixi imports
- [ ] **Phase 3: Demo wallet settle** — Start balance, bet debit, cash-out credit, crash loss
- [ ] **Phase 4: Playable loop wired** — UI controls + ticker bridge; bet → fly → cash out/crash works end-to-end
- [ ] **Phase 5: Graph polish + stubs + seams** — Curve+number visual, SFX placeholders, `game`/`view`/`ui` layout

## Phase Details

### Phase 1: Boot shell + DEMO frame

**Goal:** `npm run dev` shows a single-page Pixi canvas with unmistakable DEMO/portfolio framing and a mobile-friendly layout.

**Requirements:** BOOT-01, BOOT-02, BOOT-03

**Success criteria:**

1. Fresh install/run path documented in README (`npm install` → `npm run dev`)
2. PixiJS v8 Application initializes and renders something visible (e.g. solid stage or placeholder text)
3. “DEMO / portfolio — no real money” is visible without opening menus
4. Narrow viewport (~375px) keeps canvas and label usable (no horizontal clip of controls area)

**Plans:** TBD (`/gsd-plan-phase 1`)

---

### Phase 2: Pure GameLogic + tests

**Goal:** Crash round rules live in pure TypeScript with seeded outcomes and unit tests — zero Pixi dependency.

**Requirements:** LOGIC-01, LOGIC-02, LOGIC-03, LOGIC-04, LOGIC-05

**Success criteria:**

1. `src/game/**` contains RNG, crash math, and round state machine
2. Same seed → same crash point (asserted in tests)
3. Tests cover: start round, multiplier rises with `update(dt)`, cash-out path, crash path, reject actions in wrong phase
4. No `pixi.js` import in `src/game/`

**Plans:** TBD (`/gsd-plan-phase 2`)

---

### Phase 3: Demo wallet settle

**Goal:** Demo credits start, deduct on bet, pay on cash-out, stay lost on crash — still pure logic.

**Requirements:** WALLET-01, WALLET-02, WALLET-03, WALLET-04

**Success criteria:**

1. Configurable starting balance (sensible default, e.g. 1000 credits)
2. Bet rejected when balance insufficient or phase ≠ waiting
3. Cash-out increases balance by `bet × multiplier` (stable 2-decimal credits)
4. Crash after bet leaves net loss of bet amount
5. Unit tests cover win and loss settle

**Plans:** TBD (`/gsd-plan-phase 3`)

---

### Phase 4: Playable loop wired

**Goal:** Human can play a full round in the browser: place bet, watch multiplier, cash out or lose, see balance update.

**Requirements:** VIEW-01, VIEW-03, VIEW-04

**Success criteria:**

1. Place Bet starts a flying round and shows live multiplier text
2. Cash Out before crash updates balance upward
3. Letting it crash updates balance as a loss
4. Controls disable/enable by phase (no double-bet / cash-out when invalid)
5. Ticker calls `logic.update(deltaMS)`; UI reads snapshots only

**Plans:** TBD (`/gsd-plan-phase 4`)

---

### Phase 5: Graph polish + stubs + seams

**Goal:** Visual reads as a small polished crash graph; SFX stubs exist; folders are ready for more demo games later.

**Requirements:** VIEW-02, SFX-01, ARCH-01

**Success criteria:**

1. Rising curve/graph redraws with the multiplier (Graphics — no third-party casino art)
2. SFX module exposes bet/fly/cash-out/crash hooks (implementation may be no-op)
3. Directory layout matches `game` / `view` / `ui` (+ `audio` if used)
4. README states how to extend with another game demo later
5. v1 Definition of Done in REQUIREMENTS.md satisfied

**Plans:** TBD (`/gsd-plan-phase 5`)

---

## Progress

| Phase | Plans complete | Status |
|-------|----------------|--------|
| 1. Boot shell + DEMO frame | 0/TBD | Not started |
| 2. Pure GameLogic + tests | 0/TBD | Not started |
| 3. Demo wallet settle | 0/TBD | Not started |
| 4. Playable loop wired | 0/TBD | Not started |
| 5. Graph polish + stubs + seams | 0/TBD | Not started |

## Next

Run `/gsd-plan-phase 1` to plan and execute the boot shell.

## Notes

- **Textures:** v1 does not require image assets. If a plane/rocket look is desired later, ask the user for textures before scaffolding an asset pipeline.
- **UI approach:** Prefer HTML overlay for bet/cash-out/balance; Pixi for playfield (see research/ARCHITECTURE.md).
- **Research:** See `.planning/research/` for stack, architecture, features, pitfalls.

---
*Roadmap created: 2026-09-26*
