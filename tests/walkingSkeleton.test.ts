import { describe, expect, it } from "vitest";
import { createGame } from "../src/games/crash/logic/CrashGame.js";
import { CRASH_CONFIG } from "../src/games/crash/logic/config.js";

describe("walking skeleton - createGame -> placeBet -> wait -> fly -> settle", () => {
  it("seeded bet->fly->settle path with continuous auto-launch (D-14)", () => {
    const game = createGame({ seed: "demo-1" });

    const start = game.getSnapshot();
    expect(start.phase).toBe("waiting");
    expect(start.balance).toBe(CRASH_CONFIG.startingBalanceCents / 100);
    expect(start.waitRemainingMs).toBe(CRASH_CONFIG.waitDurationMs);

    const betResult = game.placeBet(0, 100);
    expect(betResult).toEqual({ ok: true });

    const afterBet = game.getSnapshot();
    expect(afterBet.phase).toBe("waiting");
    expect(afterBet.bet).toBe(100);
    expect(afterBet.bets[0].amount).toBe(100);
    expect(afterBet.balance).toBe(4900);

    game.tick(5000);
    const flying = game.getSnapshot();
    expect(flying.phase).toBe("flying");
    expect(flying.crashAt).not.toBeNull();
    expect(flying.multiplier).toBe(1);
    const crashAt = flying.crashAt!;

    game.tick(200);
    expect(game.getSnapshot().crashAt).toBe(crashAt);
    expect(game.getSnapshot().phase).toBe("flying");
    expect(game.getSnapshot().multiplier).toBeGreaterThan(1);

    game.requestCashOut(0);
    game.tick(CRASH_CONFIG.maxDeltaMs);
    const cashed = game.getSnapshot();
    expect(cashed.phase).toBe("cashed_out");
    expect(cashed.cashOutAt).not.toBeNull();
    expect(cashed.bets[0].cashedOut).toBe(true);
    expect(cashed.balance).toBeGreaterThan(4900);
    expect(cashed.history.length).toBe(0);

    let guard = 0;
    while (game.getSnapshot().phase === "cashed_out" && guard < 200_000) {
      game.tick(CRASH_CONFIG.maxDeltaMs);
      guard += CRASH_CONFIG.maxDeltaMs;
    }
    const settled = game.getSnapshot();
    expect(settled.phase).toBe("waiting");
    expect(settled.waitRemainingMs).toBe(
      CRASH_CONFIG.waitDurationMs + CRASH_CONFIG.crashDisplayMs,
    );
    expect(settled.history.length).toBe(1);
    expect(settled.history[0]).toBe(crashAt);
    expect(settled.balance).toBeGreaterThan(4900);

    const balanceAfterWin = settled.balance;
    const historyAfterWin = settled.history.length;

    game.tick(
      CRASH_CONFIG.waitDurationMs + CRASH_CONFIG.crashDisplayMs,
    );
    expect(game.getSnapshot().phase).toBe("flying");
    const spectatorCrashAt = game.getSnapshot().crashAt!;

    guard = 0;
    while (game.getSnapshot().phase === "flying" && guard < 200_000) {
      game.tick(CRASH_CONFIG.maxDeltaMs);
      guard += CRASH_CONFIG.maxDeltaMs;
    }
    const afterSpectator = game.getSnapshot();
    expect(afterSpectator.phase).toBe("waiting");
    expect(afterSpectator.balance).toBe(balanceAfterWin);
    expect(afterSpectator.history.length).toBe(historyAfterWin + 1);
    expect(afterSpectator.history).toContain(spectatorCrashAt);
  });

  it("dual placeBet on both slots in waiting", () => {
    const game = createGame({ seed: "dual-place" });
    expect(game.placeBet(0, 50)).toEqual({ ok: true });
    expect(game.placeBet(1, 75)).toEqual({ ok: true });
    const snap = game.getSnapshot();
    expect(snap.bets[0].amount).toBe(50);
    expect(snap.bets[1].amount).toBe(75);
    expect(snap.balance).toBe(5000 - 50 - 75);
  });

  it("placeBet only succeeds in waiting", () => {
    const game = createGame({ seed: "demo-1" });
    game.tick(5000);
    expect(game.getSnapshot().phase).toBe("flying");
    expect(game.placeBet(0, 100)).toEqual({
      ok: false,
      reason: "not_waiting",
    });
  });
});
