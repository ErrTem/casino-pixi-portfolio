import { describe, expect, it } from "vitest";
import { GAMES, MENU_COPY } from "./gameRegistry.js";

const BANNED =
  /deposit|withdraw|real money|redeem|prize|jackpot|win big|hurry|streak/i;

describe("gameRegistry (SHELL-01 / SHELL-04)", () => {
  it("lists crash then hotline with unique ids", () => {
    expect(GAMES.map((g) => g.id)).toEqual(["crash", "hotline"]);
    expect(new Set(GAMES.map((g) => g.id)).size).toBe(GAMES.length);
  });

  it("crash is enabled with mount and crash icon path", () => {
    const crash = GAMES.find((g) => g.id === "crash");
    expect(crash).toBeDefined();
    expect(crash!.enabled).toBe(true);
    expect(typeof crash!.mount).toBe("function");
    expect(crash!.iconUrl).toBe("/assets/menu/icon-crash.png");
  });

  it("hotline is disabled stub with hotline icon path and no mount", () => {
    const hotline = GAMES.find((g) => g.id === "hotline");
    expect(hotline).toBeDefined();
    expect(hotline!.title).toBe("HOTLINE");
    expect(hotline!.enabled).toBe(false);
    expect(hotline!.mount).toBeUndefined();
    expect(hotline!.iconUrl).toBe("/assets/menu/icon-hotline.png");
  });

  it("every title and blurb is non-empty and at most 40 chars", () => {
    for (const game of GAMES) {
      expect(game.title.length).toBeGreaterThan(0);
      expect(game.title.length).toBeLessThanOrEqual(40);
      expect(game.blurb.length).toBeGreaterThan(0);
      expect(game.blurb.length).toBeLessThanOrEqual(40);
    }
  });

  it("MENU_COPY title is non-empty and subtitle mentions play money", () => {
    expect(MENU_COPY.title.length).toBeGreaterThan(0);
    expect(MENU_COPY.subtitle).toMatch(/play money/i);
  });

  it("menu and tile copy avoid real-money and hype wording", () => {
    expect(MENU_COPY.title).not.toMatch(BANNED);
    expect(MENU_COPY.subtitle).not.toMatch(BANNED);
    for (const game of GAMES) {
      expect(game.title).not.toMatch(BANNED);
      expect(game.blurb).not.toMatch(BANNED);
    }
  });
});
