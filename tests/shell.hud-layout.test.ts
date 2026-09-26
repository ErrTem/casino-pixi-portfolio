import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(import.meta.dirname, "..");
const html = readFileSync(join(ROOT, "index.html"), "utf8");

/** Extract inner HTML of an element with the given id (string parse — no DOM). */
function innerById(source: string, id: string): string {
  const open = new RegExp(`<[^>]+\\bid=["']${id}["'][^>]*>`, "i");
  const openMatch = open.exec(source);
  if (!openMatch) {
    throw new Error(`#${id} not found in index.html`);
  }
  const start = openMatch.index + openMatch[0].length;
  // Match the opening tag's element name so we can find its close.
  const tagMatch = /^<\s*([a-zA-Z0-9-]+)/.exec(openMatch[0]);
  if (!tagMatch) {
    throw new Error(`Could not parse open tag for #${id}`);
  }
  const tag = tagMatch[1];
  const close = new RegExp(`</\\s*${tag}\\s*>`, "i");
  const rest = source.slice(start);
  const closeMatch = close.exec(rest);
  if (!closeMatch) {
    throw new Error(`Closing </${tag}> for #${id} not found`);
  }
  return rest.slice(0, closeMatch.index);
}

/** Monetary control selectors that must live in #hud-bar (VIS-02 / D-04). */
const MONETARY_SELECTORS = [
  { kind: "action" as const, name: "place-bet" },
  { kind: "action" as const, name: "cash-out" },
  { kind: "action" as const, name: "clear-auto-co" },
  { kind: "action" as const, name: "reset-wallet" },
  { kind: "field" as const, name: "bet-input" },
  { kind: "field" as const, name: "auto-co" },
  { kind: "field" as const, name: "chips" },
  { kind: "field" as const, name: "history" },
];

function hasAttr(fragment: string, kind: "action" | "field", name: string): boolean {
  const attr = kind === "action" ? "data-action" : "data-field";
  const re = new RegExp(
    `${attr}\\s*=\\s*["']${name}["']`,
    "i",
  );
  return re.test(fragment);
}

describe("shell HUD layout (VIS-02 / D-04)", () => {
  it("keeps #game-canvas-host free of monetary data-action / data-field controls", () => {
    const host = innerById(html, "game-canvas-host");
    for (const sel of MONETARY_SELECTORS) {
      expect(
        hasAttr(host, sel.kind, sel.name),
        `#game-canvas-host must not contain ${sel.kind === "action" ? "data-action" : "data-field"}="${sel.name}"`,
      ).toBe(false);
    }
    // Any monetary-looking data-action / data-field is banned in the host.
    expect(host).not.toMatch(/data-action\s*=/);
    expect(host).not.toMatch(/data-field\s*=/);
  });

  it("places place-bet / cash-out / bet-input / auto-co / chips / history / reset under #hud-bar", () => {
    const bar = innerById(html, "hud-bar");
    for (const sel of MONETARY_SELECTORS) {
      expect(
        hasAttr(bar, sel.kind, sel.name),
        `#hud-bar must contain ${sel.kind === "action" ? "data-action" : "data-field"}="${sel.name}"`,
      ).toBe(true);
    }
  });
});
