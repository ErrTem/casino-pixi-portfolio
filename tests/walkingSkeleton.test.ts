import { describe, expect, it } from "vitest";
import { createGame } from "../src/games/crash/logic/CrashGame.js";
import { CRASH_CONFIG } from "../src/games/crash/logic/config.js";

describe("walking skeleton — createGame → placeBet → wait → fly → settle", () => {
  it("seeded bet→fly→settle path with continuous auto-launch (D-14)", () => {
    const game = createGame({ seed: "demo-1" });

    const start = game.getSnapshot();
    expect(start.phase).toBe("waiting");
    expect(start.balance).toBe(CRASH_CONFIG.startingBalanceCents / 100);
    expect(start.waitRemainingMs).toBe(CRASH_CONFIG.waitDurationMs);

    const betResult = game.placeBet(100);
    expect(betResult).toEqual({ ok: true });

    const afterBet = game.getSnapshot();
    expect(afterBet.phase).toBe("waiting");
    expect(afterBet.bet).toBe(100);
    expect(afterBet.balance).toBe(4900);

    // D-14: wait expiry always starts a round
    game.tick(5000);
    const flying = game.getSnapshot();
    expect(flying.phase).toBe("flying");
    expect(flying.crashAt).not.toBeNull();
    expect(flying.multiplier).toBe(1);
    const crashAt = flying.crashAt!;

    // crashAt stable across further ticks
    game.tick(200);
    expect(game.getSnapshot().crashAt).toBe(crashAt);
    expect(game.getSnapshot().phase).toBe("flying");
    expect(game.getSnapshot().multiplier).toBeGreaterThan(1);

    // D-16: cash-out credits once and stays cashed_out; history waits for crash
    game.requestCashOut();
    game.tick(CRASH_CONFIG.maxDeltaMs);
    const cashed = game.getSnapshot();
    expect(cashed.phase).toBe("cashed_out");
    expect(cashed.cashOutAt).not.toBeNull();
    expect(cashed.balance).toBeGreaterThan(4900);
    expect(cashed.history.length).toBe(0);

    // Spectator finish: climb until crashAt
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

    // Spectator round: no bet → balance unchanged after crash
    game.tick(
      CRASH_CONFIG.waitDurationMs + CRASH_CONFIG.crashDisplayMs,
    );
    expect(game.getSnapshot().phase).toBe("flying");
    const spectatorCrashAt = game.getSnapshot().crashAt!;

    // Tick until this round settles (avoid overshooting into the next auto-launch)
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

  it("placeBet only succeeds in waiting", () => {
    const game = createGame({ seed: "demo-1" });
    game.tick(5000);
    expect(game.getSnapshot().phase).toBe("flying");
    expect(game.placeBet(100)).toEqual({ ok: false, reason: "not_waiting" });
  });
});
