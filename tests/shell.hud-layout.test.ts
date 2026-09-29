import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(import.meta.dirname, "..");
const html = readFileSync(join(ROOT, "index.html"), "utf8");
const css = readFileSync(join(ROOT, "src/styles/hud.css"), "utf8");

/** Extract inner HTML of an element with the given id (string parse — no DOM). */
function innerById(source: string, id: string): string {
  const open = new RegExp(`<[^>]+\\bid=["']${id}["'][^>]*>`, "i");
  const openMatch = open.exec(source);
  if (!openMatch) {
    throw new Error(`#${id} not found in index.html`);
  }
  const start = openMatch.index + openMatch[0].length;
  const tagMatch = /^<\s*([a-zA-Z0-9-]+)/.exec(openMatch[0]);
  if (!tagMatch) {
    throw new Error(`Could not parse open tag for #${id}`);
  }
  const tag = tagMatch[1];
  const token = new RegExp(`<\\/?\\s*${tag}\\b[^>]*>`, "gi");
  const rest = source.slice(start);
  let depth = 1;
  let match: RegExpExecArray | null;
  while ((match = token.exec(rest)) !== null) {
    const isClose = match[0].startsWith("</");
    depth += isClose ? -1 : 1;
    if (depth === 0) {
      return rest.slice(0, match.index);
    }
  }
  throw new Error(`Closing </${tag}> for #${id} not found`);
}

/** Monetary control selectors — must live outside #game-canvas-host (VIS-02). */
const MONETARY_SELECTORS = [
  { kind: "action" as const, name: "primary" },
  { kind: "action" as const, name: "reset-wallet" },
  { kind: "field" as const, name: "bet-input" },
  { kind: "field" as const, name: "auto-co" },
  { kind: "field" as const, name: "auto-co-toggle" },
  { kind: "field" as const, name: "auto-bet-toggle" },
  { kind: "field" as const, name: "chips" },
  { kind: "field" as const, name: "history" },
];

function hasAttr(fragment: string, kind: "action" | "field", name: string): boolean {
  const attr = kind === "action" ? "data-action" : "data-field";
  const re = new RegExp(`${attr}\\s*=\\s*["']${name}["']`, "i");
  return re.test(fragment);
}

describe("shell HUD layout (UI-01 / VIS-02 / D-01)", () => {
  it("defines 100dvh column zones: top-chrome, history-band, canvas-host, hud-bar", () => {
    expect(html).toMatch(/id=["']top-chrome["']/);
    expect(html).toMatch(/id=["']history-band["']/);
    expect(html).toMatch(/id=["']game-canvas-host["']/);
    expect(html).toMatch(/id=["']hud-bar["']/);
  });

  it("uses single primary CTA — no separate place-bet / cash-out primaries", () => {
    expect(html).toMatch(/data-action\s*=\s*["']primary["']/);
    expect(html).not.toMatch(/data-action\s*=\s*["']place-bet["']/);
    expect(html).not.toMatch(/data-action\s*=\s*["']cash-out["']/);
  });

  it("omits seed-chip host (D-21 — full delete in 06-04)", () => {
    expect(html).not.toMatch(/seed-chip/);
  });

  it("sets overflow hidden and 100dvh shell height in hud.css", () => {
    expect(css).toMatch(/overflow:\s*hidden/);
    expect(css).toMatch(/100dvh/);
  });

  it("keeps #game-canvas-host free of monetary data-action / data-field controls", () => {
    const host = innerById(html, "game-canvas-host");
    for (const sel of MONETARY_SELECTORS) {
      expect(
        hasAttr(host, sel.kind, sel.name),
        `#game-canvas-host must not contain ${sel.kind === "action" ? "data-action" : "data-field"}="${sel.name}"`,
      ).toBe(false);
    }
    expect(host).not.toMatch(/data-action\s*=/);
    expect(host).not.toMatch(/data-field\s*=/);
  });

  it("places primary / bet-input / auto-co / chips under #hud-bar", () => {
    const bar = innerById(html, "hud-bar");
    for (const name of ["primary"] as const) {
      expect(hasAttr(bar, "action", name)).toBe(true);
    }
    for (const name of ["bet-input", "auto-co", "auto-co-toggle", "auto-bet-toggle", "chips"] as const) {
      expect(hasAttr(bar, "field", name)).toBe(true);
    }
  });

  it("places reset-wallet under #top-chrome and history under #history-band", () => {
    const top = innerById(html, "top-chrome");
    const hist = innerById(html, "history-band");
    expect(hasAttr(top, "action", "reset-wallet")).toBe(true);
    expect(hasAttr(hist, "field", "history")).toBe(true);
    expect(hasAttr(hist, "field", "session-stats")).toBe(true);
  });
});
