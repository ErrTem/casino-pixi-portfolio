import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadHotlineConfig } from "../config/loadHotlineConfig.js";
import { paytableSheetModel } from "./paytableSheetModel.js";

describe("paytableSheetModel (BASE-04, D-10, D-11)", () => {
  const config = loadHotlineConfig();
  const sections = paytableSheetModel(config);

  it("stacks symbols then phones and bonuses then gamble", () => {
    expect(sections.length).toBeGreaterThanOrEqual(3);
    expect(sections.map((s) => s.id).slice(0, 3)).toEqual([
      "symbols",
      "phones",
      "gamble",
    ]);
    for (const section of sections) {
      expect(section.title.length).toBeGreaterThan(0);
      expect(section.rows.length).toBeGreaterThan(0);
    }
  });

  it("pistol row carries the 3 4 and 5 multipliers from config.paytable", () => {
    const symbols = sections.find((s) => s.id === "symbols");
    const row = symbols?.rows.find((r) => /pistol/i.test(r.label));
    expect(row).toBeDefined();
    const pay = config.paytable.pistol;
    expect(row!.detail).toContain(`x${pay["3"]}`);
    expect(row!.detail).toContain(`x${pay["4"]}`);
    expect(row!.detail).toContain(`x${pay["5"]}`);
  });

  it("symbols lead with wildSymbolId then paytable entries in config order", () => {
    const symbols = sections.find((s) => s.id === "symbols");
    const wild = config.math.wildSymbolId;
    const ids = Object.keys(config.paytable);
    expect(symbols?.rows).toHaveLength(ids.length + 1);
    expect(symbols!.rows[0].symbolId).toBe(wild);
    expect(symbols!.rows[0].label.toUpperCase()).toContain(wild.toUpperCase());
    expect(symbols!.rows[0].detail.toLowerCase()).toMatch(/wild/);
    expect(symbols!.rows[0].detail.toLowerCase()).toMatch(/substitut/);
    ids.forEach((id, index) => {
      expect(symbols!.rows[index + 1].label.toLowerCase()).toBe(id.toLowerCase());
      expect(symbols!.rows[index + 1].symbolId).toBe(id);
    });
  });

  it("phone and gamble rows carry no symbol id", () => {
    for (const id of ["phones", "gamble"] as const) {
      const section = sections.find((s) => s.id === id);
      for (const row of section!.rows) expect(row.symbolId).toBeUndefined();
    }
  });

  it("follows a changed paytable instead of fixed numbers", () => {
    const edited = structuredClone(config);
    edited.paytable.pistol = { "3": 7.5, "4": 33, "5": 777 };
    const row = paytableSheetModel(edited)
      .find((s) => s.id === "symbols")
      ?.rows.find((r) => /pistol/i.test(r.label));
    expect(row!.detail).toContain("x7.5");
    expect(row!.detail).toContain("x33");
    expect(row!.detail).toContain("x777");
  });

  it("gamble copy mentions maxRounds from config", () => {
    const edited = structuredClone(config);
    edited.features.gamble.maxRounds = 7;
    const gamble = paytableSheetModel(edited).find((s) => s.id === "gamble");
    const text = gamble!.rows.map((r) => `${r.label} ${r.detail}`).join(" ");
    expect(text).toMatch(/\b7\b/);
    expect(text).toMatch(/SURVIVE/);
    expect(text).toMatch(/DIE/);
  });

  it("phones section describes cassette strip decks without phone feature labels", () => {
    const phones = sections.find((s) => s.id === "phones");
    expect(phones!.id).toBe("phones");
    expect(phones!.title.toLowerCase()).toMatch(/cassette/);
    const text = phones!.rows.map((r) => `${r.label} ${r.detail}`).join(" ");
    expect(text).toMatch(/green/i);
    expect(text).toMatch(/red/i);
    expect(text).toMatch(/purple/i);
    expect(text).toMatch(/free spins/i);
    expect(text).toMatch(/hold/i);
    expect(text).toMatch(/locker/i);
    expect(text.toLowerCase()).toMatch(/cassette strip/);
    expect(text).not.toMatch(/GREEN PHONE/);
    expect(text).not.toMatch(/RED PHONE/);
    expect(text).not.toMatch(/PURPLE PHONE/);
  });

  it("DISKETTES row ties feature start to filling the meter to meterTarget", () => {
    const phones = sections.find((s) => s.id === "phones");
    const row = phones?.rows.find((r) => /diskette/i.test(r.label));
    expect(row).toBeDefined();
    const detail = row!.detail.toLowerCase();
    expect(detail).toContain(String(config.features.tokenOdds.meterTarget));
    expect(detail).toMatch(/fill/);
    expect(detail).toMatch(/feature/);
  });

  it("module has no pixi and no document", () => {
    const src = readFileSync(
      join(import.meta.dirname, "paytableSheetModel.ts"),
      "utf8",
    );
    expect(src).not.toMatch(/from\s+["']pixi\.js["']/);
    expect(src).not.toMatch(/\bdocument\b/);
  });
});
