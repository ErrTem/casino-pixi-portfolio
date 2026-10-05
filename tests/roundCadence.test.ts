import { describe, expect, it } from "vitest";
import { createGame } from "../src/games/crash/logic/CrashGame.js";
import { CRASH_CONFIG } from "../src/games/crash/logic/config.js";
import { History } from "../src/games/crash/logic/History.js";

describe("round cadence - PLAY-01 / PLAY-05 / D-13..D-15", () => {
  it("tick totaling 5000ms in waiting with a locked bet enters flying (PLAY-01)", () => {
    const game = createGame({ seed: "cadence-bet" });
    expect(game.placeBet(0, 50)).toEqual({ ok: true });
    expect(game.getSnapshot().phase).toBe("waiting");
    game.tick(CRASH_CONFIG.waitDurationMs);
    const snap = game.getSnapshot();
    expect(snap.phase).toBe("flying");
    expect(snap.crashAt).not.toBeNull();
    expect(snap.bet).toBe(50);
  });

  it("spectator round (no bet) still flies and crashes; balance unchanged; history gains crashAt (D-15)", () => {
    const game = createGame({ seed: "cadence-spectator" });
    const balanceBefore = game.getSnapshot().balance;
    expect(game.getSnapshot().history.length).toBe(0);

    game.tick(CRASH_CONFIG.waitDurationMs);
    expect(game.getSnapshot().phase).toBe("flying");
    expect(game.getSnapshot().bet).toBeNull();
    const crashAt = game.getSnapshot().crashAt!;
    expect(crashAt).toBeGreaterThanOrEqual(CRASH_CONFIG.crashFloor);

    let guard = 0;
    while (game.getSnapshot().phase === "flying" && guard < 300_000) {
      game.tick(CRASH_CONFIG.maxDeltaMs);
      guard += CRASH_CONFIG.maxDeltaMs;
    }
    const after = game.getSnapshot();
    expect(after.phase).toBe("waiting");
    expect(after.balance).toBe(balanceBefore);
    expect(after.history.length).toBe(1);
    expect(after.history[0]).toBe(crashAt);
    expect(after.waitRemainingMs).toBe(
      CRASH_CONFIG.waitDurationMs + CRASH_CONFIG.crashDisplayMs,
    );
  });

  it("after terminal settle, waiting opens with crash-display pad + 5s countdown", () => {
    const game = createGame({ seed: "cadence-return" });
    expect(game.placeBet(0, 25)).toEqual({ ok: true });
    game.tick(CRASH_CONFIG.waitDurationMs);
    expect(game.getSnapshot().phase).toBe("flying");
    game.requestCashOut(0);
    game.tick(CRASH_CONFIG.maxDeltaMs);
    let guard = 0;
    while (
      game.getSnapshot().phase !== "waiting" &&
      guard < 300_000
    ) {
      game.tick(CRASH_CONFIG.maxDeltaMs);
      guard += CRASH_CONFIG.maxDeltaMs;
    }
    const after = game.getSnapshot();
    expect(after.phase).toBe("waiting");
    expect(after.waitRemainingMs).toBe(
      CRASH_CONFIG.waitDurationMs + CRASH_CONFIG.crashDisplayMs,
    );
  });

  it("placeBet while flying is rejected (PLAY-01)", () => {
    const game = createGame({ seed: "cadence-flying-bet" });
    game.tick(CRASH_CONFIG.waitDurationMs);
    expect(game.getSnapshot().phase).toBe("flying");
    const balance = game.getSnapshot().balance;
    expect(game.placeBet(0, 100)).toEqual({
      ok: false,
      reason: "not_waiting",
    });
    expect(game.getSnapshot().balance).toBe(balance);
    expect(game.getSnapshot().bet).toBeNull();
  });

  it("history ring keeps at most historySize (20) entries", () => {
    const history = new History(CRASH_CONFIG.historySize);
    expect(CRASH_CONFIG.historySize).toBe(20);
    for (let i = 1; i <= 25; i++) {
      history.push(1 + i / 100);
    }
    expect(history.length).toBe(20);
    const arr = history.toArray();
    expect(arr[0]).toBe(1 + 6 / 100);
    expect(arr[arr.length - 1]).toBe(1 + 25 / 100);

    const game = createGame({ seed: "cadence-history-ring" });
    const waitToLaunch =
      CRASH_CONFIG.waitDurationMs + CRASH_CONFIG.crashDisplayMs;
    for (let r = 0; r < 22; r++) {
      const wait =
        game.getSnapshot().history.length === 0
          ? CRASH_CONFIG.waitDurationMs
          : waitToLaunch;
      game.tick(wait);
      let guard = 0;
      while (game.getSnapshot().phase === "flying" && guard < 300_000) {
        game.tick(CRASH_CONFIG.maxDeltaMs);
        guard += CRASH_CONFIG.maxDeltaMs;
      }
      while (
        game.getSnapshot().phase === "cashed_out" &&
        guard < 300_000
      ) {
        game.tick(CRASH_CONFIG.maxDeltaMs);
        guard += CRASH_CONFIG.maxDeltaMs;
      }
      expect(game.getSnapshot().phase).toBe("waiting");
    }
    expect(game.getSnapshot().history.length).toBe(20);
  });

  it("history push ignores non-finite crashAt (spectator history integrity)", () => {
    const history = new History(CRASH_CONFIG.historySize);
    history.push(2.5);
    history.push(Number.NaN);
    history.push(Number.POSITIVE_INFINITY);
    history.push(Number.NEGATIVE_INFINITY);
    expect(history.length).toBe(1);
    expect(history.toArray()[0]).toBe(2.5);
  });
});
