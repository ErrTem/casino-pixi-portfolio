# Architecture Research — Crash Pixi Portfolio

**Researched:** 2026-09-26  
**Confidence:** HIGH

## Separation Rule (non-negotiable)

```
src/game/     → pure TypeScript: RNG, round FSM, wallet, multiplier curve
src/view/     → PixiJS: Application, Graphics curve, Text, ticker bridge
src/ui/       → DOM (or thin Pixi): bet, cash out, balance, DEMO badge
src/audio/    → SFX placeholders (no-op or oscillator stubs)
```

`src/game/**` must never import `pixi.js`. View/UI subscribe to logic events or poll a readonly snapshot.

## Domain Model

```ts
type RoundPhase = 'waiting' | 'flying' | 'crashed' | 'cashed_out';

interface Wallet {
  balance: number; // demo credits
}

interface Round {
  seed: string;
  crashPoint: number;      // e.g. 2.47
  phase: RoundPhase;
  multiplier: number;      // live display, starts 1.00
  betAmount: number | null;
  cashoutMultiplier: number | null;
}

interface GameSnapshot {
  wallet: Wallet;
  round: Round;
  history: number[]; // recent crash points for optional UI strip
}
```

## Round Lifecycle

```
waiting  --placeBet+start-->  flying
flying   --cashOut---------->  cashed_out  → settle (balance += bet * mult)
flying   --hit crashPoint--->  crashed     → settle (bet already deducted)
cashed_out|crashed --reset--> waiting
```

**Timing:** On start, compute `crashPoint` from seed. While flying, advance `elapsedMs` and map to `multiplier = f(elapsedMs)` (e.g. exponential `e^(r*t)` capped by crash). When `multiplier >= crashPoint`, transition to `crashed`. Cash out only valid in `flying` and only if `multiplier < crashPoint`.

## RNG (demo, not provably fair)

1. Seed string → 32-bit state (hash)
2. Mulberry32 (or similar) → `u ∈ [0,1)`
3. Map with house edge `e` (default 0.03):

```
crash = max(1.0, floor(((1 - e) / (1 - u)) * 100) / 100)
```

Expose `seed` in snapshot for reproducibility. Optional UI: “demo seed” field later; v1 can auto-seed per round.

## Pixi View Bridge

```
ticker callback:
  logic.update(deltaMS)
  crashView.sync(logic.getSnapshot())
```

`CrashView` responsibilities:

- Clear/redraw `Graphics` path from sampled multiplier points
- Update centered multiplier `Text` (color by phase)
- Handle canvas resize / DPR

## Extension Seam (later games)

```ts
interface CasinoDemoGame {
  readonly id: string;
  getSnapshot(): unknown;
  update(dtMs: number): void;
  // game-specific commands...
}
```

Crash implements this; future slot/wheel would sit beside it. Wallet can be shared module.

## Control Surface

**Recommendation:** HTML overlay for bet amount, Place Bet, Cash Out, balance, DEMO label. Pixi owns the playfield only. Rationale: faster ship, native inputs on mobile, clear portfolio labeling outside canvas.

## File Sketch

```
src/
  main.ts
  game/
    rng.ts
    wallet.ts
    crashMath.ts
    crashGame.ts
    crashGame.test.ts
  view/
    app.ts
    crashView.ts
  ui/
    controls.ts
    demoBadge.ts
  audio/
    sfx.ts
```

## Confidence

HIGH — matches locked constraints and common FE game structure.
