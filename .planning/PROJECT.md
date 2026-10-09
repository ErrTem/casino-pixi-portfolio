# casino-pixi-portfolio (HOTLINE + Crash)

## What This Is

Client-only PixiJS v8 portfolio of casino-style game demos. Crash (Aviator-like) already ships. Next focus is **HOTLINE** — a 5x4 / 40-line slot whose math and feature flow mirror Endorphina's **3 Witch Pots**, reskinned as Hotline Miami (motel rooftop at sunset, CRT/VHS monitor frame, neon 80s). A shared game menu lets the player pick Crash, HOTLINE, and later other demos.

## Core Value

A portfolio visitor can open the menu, launch **HOTLINE**, and feel the full Witch Pots loop (base spins, colored diskette tokens into three rotary phones, three bonuses including combos, VHS gamble) in a Hotline Miami look — with working JSON configs shaped like backend-driven game config.

## Business Context

- **Customer**: Hiring managers / studios reviewing a Pixi game portfolio
- **Revenue model**: None (showcase)
- **Success metric**: Clear, playable demos that look hand-authored and production-aware
- **Strategy notes**: Same repo as multi-game portfolio; Crash stays; add shell + HOTLINE

## Requirements

### Validated

- ✓ Crash game demo (logic, Pixi view, HUD, seeded RNG, client wallet) — existing
- ✓ Shared audio/mute, money helpers, boot seed parsing — existing
- ✓ Vite + TypeScript + PixiJS 8.21 + Vitest toolchain — existing
- ✓ Shared game menu / shell to choose Crash, HOTLINE (stub), and future games — Phase 1
- ✓ Crash session adapter with leak-free leave; one shell-owned Pixi Application — Phase 1
- ✓ Portfolio mute key (`portfolio-demo:mute`) + boot seed reuse across launches — Phase 1
- ✓ Menu tile icons (user-supplied) for Crash and HOTLINE — Phase 1

### Active

- [ ] HOTLINE slot: 5x4 grid, 40 fixed paylines, left-to-right wins
- [ ] Three rotary-phone meters on motel rooftop; colored diskette tokens fill them
- [ ] Green line: 24 free spins with extra Wild masks on reels 2-5
- [ ] Red line: Hold & Win respins with cash symbols and jackpot path
- [ ] Purple line: Pick'em over lockers with instant cash prizes
- [ ] Bonuses can trigger together (combo nights)
- [ ] Gamble: VHS SURVIVE/DIE double-or-nothing (up to 10 rounds)
- [ ] Game math/feature weights via JSON config in a backend-like shape (example, not live API)
- [ ] Hotline Miami presentation: motel rooftop sunset, monitor/VHS chrome, Retro Computer font already in repo

### Out of Scope

- Live backend / real money / KYC — portfolio client demo only
- Full production RTP certification or certified RNG — configs are illustrative but runnable
- Extra slot engines (Megaways, cascades, buy-feature) in v1 — keep Witch Pots 1:1
- Replacing or rewriting Crash gameplay — Crash is done; only wire into menu
- Shipping final art pack without user — agent requests assets; user generates and drops files

## Context

**Brownfield repo:** `D:\pixi\casino-pixi-portfolio`. Structure is multi-game: `src/shell/`, `src/games/crash/`, `src/shared/`. Shell boots the menu; Crash mounts as a session on the shell-owned Application.

**Mechanics reference (3 Witch Pots):**
- Field 5x4, 40 fixed lines, wins left-to-right from reel 1
- Tokens (elixirs) on symbols fly into three pots; pots grow; trigger can fire randomly on token land; multiple pots can fire together
- Green: 24 free games, more Wild on reels 2-5
- Red: Hold & Win on 5x4, start with 5 locked scatters, 3 respins, reset on new cash symbol, full grid / jackpot path
- Purple: pick among hidden items for cash
- Gamble: classic card compare in original; here replaced by VHS SURVIVE/DIE

**Locked creative direction:**
- Title: **HOTLINE**
- Collectors: three rotary phones on motel rooftop
- Tokens: colored diskettes
- Wild: animal mask
- Purple pick: lockers
- Gamble: VHS SURVIVE/DIE
- Backdrop: dirty neon motel roof at sunset; reels framed like a dirty CRT/VHS monitor

**Font:** `src/shared/fonts/retrocomputerrusbydaymarius.ttf` (Retro Computer / Hotline-style) — already added.

**Sibling:** `D:\pixi\cosmic-spinner` is a separate project; not in this roadmap.

## Constraints

- **Tech stack**: PixiJS v8, TypeScript, Vite, Vitest — match existing Crash patterns (`logic` / `view` / `hud`, shared audio/rng/money)
- **Client-only**: no real backend; JSON config files stand in for "config from server"
- **Art pipeline**: when graphics are needed, ask the user with a clear asset list; user generates and places files
- **Code comments**: lowercase; no trailing period; no special symbols (arrows, em dashes, etc.)
- **Portfolio voice**: minimize AI fingerprints in code, copy, commit messages, and README tone — prefer short human phrasing
- **Font**: use the Retro Computer TTF already in `src/shared/fonts/`
- **Scope discipline**: Witch Pots feature set only for HOTLINE v1; menu must leave room for more games later

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Stay in this repo (not a new project) | Portfolio already multi-game shaped; Crash reuse | Locked |
| Game title HOTLINE | Short, on-brand, easy to menu-label | Locked |
| Three rotary phones 1:1 with Witch Pots | Familiar feature map; clear UI | — Pending (Phase 3+) |
| Diskette tokens | Readable color flight; Miami/tech flavor | — Pending (Phase 3+) |
| VHS SURVIVE/DIE gamble | Replaces card gamble; brand-fit; simple 50/50 UX | — Pending (Phase 5) |
| Menu shell for Crash + HOTLINE (+ future) | Portfolio needs one entry; Crash stays playable | Shipped Phase 1 (HOTLINE stub) |
| One long-lived shell-owned Pixi Application | Avoid remount churn; Crash is a thin session | Shipped Phase 1 |
| Mute under `portfolio-demo:mute` with legacy migrate | Shared preference across demos | Shipped Phase 1 |
| JSON backend-shaped configs | Shows real iGaming config thinking without a server | — Pending (Phase 2) |
| User owns art generation | Keeps visual quality and authorship | Confirmed Phase 1 (menu icons) |
| Retro Computer font in shared/fonts | Hotline Miami typography locked | Used on menu Phase 1 |
| Comment / anti-AI style rules | Cleaner portfolio review | Locked |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-10-09 after Phase 1*
