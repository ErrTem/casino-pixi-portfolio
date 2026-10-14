import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(import.meta.dirname, "..");
const html = readFileSync(join(ROOT, "index.html"), "utf8");
const css = readFileSync(join(ROOT, "src/styles/hud.css"), "utf8");

/** Extract inner HTML of an element with the given id (string parse - no DOM). */
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

/** Monetary control selectors - must live outside #game-canvas-host (VIS-02). */
const MONETARY_SELECTORS = [
  { kind: "action" as const, name: "primary" },
  { kind: "action" as const, name: "reset-wallet" },
  { kind: "action" as const, name: "autoplay" },
  { kind: "field" as const, name: "bet-input" },
  { kind: "field" as const, name: "auto-co" },
  { kind: "field" as const, name: "auto-co-toggle" },
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

  it("uses dual bet panels with primary CTA - no separate place-bet / cash-out primaries", () => {
    expect(html).toMatch(/data-slot\s*=\s*["']0["']/);
    expect(html).toMatch(/data-slot\s*=\s*["']1["']/);
    expect(html).toMatch(/data-action\s*=\s*["']primary["']/);
    expect(html).not.toMatch(/data-action\s*=\s*["']place-bet["']/);
    expect(html).not.toMatch(/data-action\s*=\s*["']cash-out["']/);
    const primaries = html.match(/data-action\s*=\s*["']primary["']/g) ?? [];
    expect(primaries.length).toBe(2);
  });

  it("omits seed-chip host (D-21 / PLSH-03Δ - silent ?seed= only)", () => {
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

  it("places primary / bet-input / auto-co / chips / autoplay under #hud-bar", () => {
    const bar = innerById(html, "hud-bar");
    for (const name of ["primary", "autoplay"] as const) {
      expect(hasAttr(bar, "action", name)).toBe(true);
    }
    for (const name of [
      "bet-input",
      "auto-co",
      "auto-co-toggle",
      "chips",
    ] as const) {
      expect(hasAttr(bar, "field", name)).toBe(true);
    }
    expect(hasAttr(bar, "action", "auto-co-dec")).toBe(true);
    expect(hasAttr(bar, "action", "auto-co-inc")).toBe(true);
  });

  it("places reset-wallet under #top-chrome and history under #history-band", () => {
    const top = innerById(html, "top-chrome");
    const hist = innerById(html, "history-band");
    expect(hasAttr(top, "action", "reset-wallet")).toBe(true);
    expect(hasAttr(hist, "field", "history")).toBe(true);
    expect(hasAttr(hist, "field", "session-stats")).toBe(true);
  });

  it("places Menu (data-action=menu) under #top-chrome and not under canvas host (D-14)", () => {
    const top = innerById(html, "top-chrome");
    const host = innerById(html, "game-canvas-host");
    expect(hasAttr(top, "action", "menu")).toBe(true);
    expect(hasAttr(host, "action", "menu")).toBe(false);
    expect(host).not.toMatch(/data-action\s*=/);
  });

  it("keeps empty #app and crash screen template for session clone", () => {
    expect(html).toMatch(/id=["']crash-screen-template["']/);
    expect(html).toMatch(/id=["']crash-screen["']/);
    expect(innerById(html, "app").trim()).toBe("");
  });
});

describe("hotline screen template (D-09 / D-13 / BASE-02)", () => {
  const tpl = (): string => innerById(html, "hotline-screen-template");

  it("defines the hotline template with the shared zone ids", () => {
    expect(html).toMatch(/id=["']hotline-screen-template["']/);
    expect(html).toMatch(/id=["']hotline-screen["']/);
    const t = tpl();
    expect(t).toMatch(/id=["']top-chrome["']/);
    expect(t).toMatch(/id=["']game-canvas-host["']/);
    expect(t).toMatch(/id=["']hud-bar["']/);
  });

  it("keeps the hotline canvas host free of data-action and data-field nodes", () => {
    const host = innerById(tpl(), "game-canvas-host");
    expect(host).not.toMatch(/data-action\s*=/);
    expect(host).not.toMatch(/data-field\s*=/);
  });

  it("puts balance, last win, menu and mute under top-chrome", () => {
    const top = innerById(tpl(), "top-chrome");
    expect(hasAttr(top, "field", "balance")).toBe(true);
    expect(hasAttr(top, "field", "last-win")).toBe(true);
    expect(hasAttr(top, "action", "menu")).toBe(true);
    expect(hasAttr(top, "action", "mute")).toBe(true);
  });

  it("puts spin, bet steppers and bet readout under hud-bar with no lines readout", () => {
    const bar = innerById(tpl(), "hud-bar");
    expect(hasAttr(bar, "action", "spin")).toBe(true);
    expect(hasAttr(bar, "action", "bet-dec")).toBe(true);
    expect(hasAttr(bar, "action", "bet-inc")).toBe(true);
    expect(hasAttr(bar, "field", "bet")).toBe(true);
    expect(hasAttr(bar, "field", "lines")).toBe(false);
    expect(bar).not.toMatch(/hotline-ticker/);
    expect(bar).not.toMatch(/40 LINES ACTIVE/);
  });

  it("adds no free text bet input to the hotline template", () => {
    expect(tpl()).not.toMatch(/data-field\s*=\s*["']bet-input["']/);
  });
});

describe("hotline spin hub layout (PRES-02 / D-13 / D-14 / D-15 / D-16)", () => {
  const tpl = (): string => innerById(html, "hotline-screen-template");

  /** body of the first at-rule block that starts with the given media prefix */
  function mediaBlock(prefix: string): string {
    const at = css.indexOf(prefix);
    if (at < 0) throw new Error(`${prefix} not found in hud.css`);
    const open = css.indexOf("{", at);
    let depth = 1;
    let i = open + 1;
    while (i < css.length && depth > 0) {
      if (css[i] === "{") depth += 1;
      if (css[i] === "}") depth -= 1;
      i += 1;
    }
    return css.slice(open + 1, i - 1);
  }

  it("keeps info, turbo, auto and gamble in an actions row above the bar, outside the canvas host", () => {
    const hud = innerById(tpl(), "hud-bar");
    const host = innerById(tpl(), "game-canvas-host");
    const actions = hud.slice(
      hud.indexOf('class="hotline-actions"'),
      hud.indexOf('class="hotline-bar"'),
    );
    for (const name of ["gamble", "info", "turbo", "auto", "spin", "bet-dec", "bet-inc"] as const) {
      expect(hasAttr(hud, "action", name), `${name} lives in the hud bar`).toBe(true);
      expect(hasAttr(host, "action", name), `${name} stays out of the canvas host`).toBe(false);
    }
    expect(actions).toMatch(/hotline-actions__left/);
    expect(actions).toMatch(/hotline-actions__right/);
    expect(actions.indexOf("data-action=\"info\"")).toBeLessThan(actions.indexOf("hotline-actions__right"));
    expect(actions.indexOf("data-action=\"gamble\"")).toBeGreaterThan(actions.indexOf("hotline-actions__right"));
    expect(actions.indexOf("data-action=\"auto\"")).toBeLessThan(actions.indexOf("data-action=\"gamble\""));
    const barOnly = hud.slice(hud.indexOf("hotline-bar"));
    expect(hasAttr(barOnly, "action", "info")).toBe(false);
    expect(hasAttr(barOnly, "action", "gamble")).toBe(false);
    expect(hud).not.toMatch(/hotline-icon-btn__label/);
    expect(innerById(tpl(), "top-chrome")).not.toMatch(/data-action\s*=\s*["']info["']/);
  });

  it("keeps the desktop stake plus spin row at the narrow breakpoint", () => {
    const narrow = mediaBlock("@media (max-width: 480px)");
    expect(narrow).toMatch(/\.hotline-bar\s*\{[^}]*display:\s*flex/);
    expect(narrow).not.toMatch(/grid-template-areas/);
    expect(narrow).not.toMatch(/"dec spin inc"/);
    expect(narrow).not.toMatch(/"stake stake stake"/);
    expect(narrow).toMatch(/\.hotline-bar \.primary-cta\s*\{[^}]*min-height:\s*2\.85rem/);
  });

  it("sizes action icon controls to at least 44 by 44 css px", () => {
    expect(css).toMatch(/\.hotline-icon-btn\s*\{[^}]*min-width:\s*2\.75rem[^}]*min-height:\s*2\.75rem/);
    const narrow = mediaBlock("@media (max-width: 480px)");
    expect(narrow).toMatch(/\.hotline-icon-btn\s*\{[^}]*height:\s*2\.75rem/);
    expect(narrow).toMatch(/\.hotline-icon-btn:not\(\.hotline-mode-btn\)\s*\{[^}]*width:\s*2\.75rem/);
  });

  it("matches hotline menu and mute chrome to the balance pill", () => {
    expect(css).toMatch(
      /\.hotline-screen \.top-chrome\s*\{[^}]*align-items:\s*stretch/,
    );
    expect(css).toMatch(
      /\.hotline-screen \.mute-toggle,\s*\.hotline-screen \.menu-back\s*\{[^}]*box-shadow:\s*var\(--hl-bloom-ice\)/,
    );
    expect(css).toMatch(
      /\.hotline-screen \.mute-toggle,\s*\.hotline-screen \.menu-back\s*\{[^}]*padding:\s*0\.4rem 0\.65rem/,
    );
  });

  it("guards the bar and every hotline overlay against horizontal overflow (D-14)", () => {
    expect(css).toMatch(/\.hotline-screen\s*\{[^}]*min-width:\s*0[^}]*overflow-x:\s*hidden/);
    expect(css).toMatch(/\.hotline-bar\s*\{[^}]*min-width:\s*0[^}]*max-width:\s*100%/);
    for (const sel of [
      ".hotline-feature-overlay",
      ".hotline-gamble-overlay",
      ".hotline-paytable-overlay",
    ]) {
      const re = new RegExp(`${sel.replace(".", "\\.")}\\s*\\{([^}]*)\\}`);
      const block = re.exec(css);
      expect(block, `${sel} rule exists`).toBeTruthy();
      expect(block![1]).toMatch(/overflow:\s*hidden/);
    }
    expect(css).toMatch(/\.hotline-gamble-panel\s*\{[^}]*width:\s*min\(100%/);
    expect(css).toMatch(/\.hotline-paytable-sheet\s*\{[^}]*width:\s*min\(100%/);
    expect(css).toMatch(/\.hotline-paytable-sheet\s*\{[^}]*min-width:\s*0/);
  });

  it("keeps the 34rem portrait column and never enables pointer events on the canvas host", () => {
    expect(css).toMatch(/\.hotline-screen\s*\{[^}]*max-width:\s*34rem/);
    expect(css).toMatch(/\.canvas-host\s*\{[^}]*pointer-events:\s*none/);
    expect(css).toMatch(/\.canvas-host canvas\s*\{[^}]*pointer-events:\s*none/);
    expect(css).not.toMatch(/\.canvas-host[^{]*\{[^}]*pointer-events:\s*(auto|all)/);
  });

  it("locks stitch neon tokens and LAST WIN chrome on the hotline screen", () => {
    expect(css).toMatch(/\.hotline-screen\s*\{[^}]*--hl-neon-pink:\s*#ff2e93/);
    expect(css).toMatch(/--hl-neon-cyan:\s*#39ffe8/);
    expect(css).toMatch(/--hl-gold:\s*#ffe566/);
    expect(css).toMatch(/--hl-ice:\s*#9be7ff/);
    expect(tpl()).toMatch(/LAST WIN/);
    expect(tpl()).not.toMatch(/hotline-ticker/);
    expect(css).toMatch(/\.hotline-bar \.primary-cta\s*\{[^}]*border-radius:\s*0/);
  });

  it("shapes the vhs gamble panel as a stitch cassette with collect exit", () => {
    const t = tpl();
    const overlay = t.slice(t.indexOf('data-field="gamble-overlay"'));
    expect(overlay).toMatch(/hotline-gamble-panel__hazard/);
    expect(overlay).toMatch(/HOTLINE CASSETTE SYSTEM/);
    expect(overlay).toMatch(/T-120 HQ \/\/ HI-FI/);
    expect(overlay).toMatch(/VHS GAMBLE/);
    expect(overlay).toMatch(/CHOOSE YOUR FATE/);
    expect(overlay).toMatch(/hotline-gamble-panel__crt/);
    expect(overlay).toMatch(/MULTIPLIER:\s*2X/);
    expect(hasAttr(overlay, "field", "gamble-current")).toBe(true);
    expect(hasAttr(overlay, "field", "gamble-to-win")).toBe(true);
    expect(hasAttr(overlay, "field", "gamble-result")).toBe(true);
    expect(hasAttr(overlay, "field", "gamble-collect")).toBe(true);
    expect(hasAttr(overlay, "action", "survive")).toBe(true);
    expect(hasAttr(overlay, "action", "die")).toBe(true);
    expect(hasAttr(overlay, "action", "collect")).toBe(true);
    expect(overlay).toMatch(/TAKE RISK \(50%\)/);
    expect(overlay).toMatch(/COLLECT/);
    expect(css).toMatch(/\.hotline-gamble-panel__hazard\s*\{/);
    expect(css).toMatch(/\.hotline-gamble-panel__btn--collect\s*\{/);
  });
});

describe("portfolio chrome (SHELL-04 / D-13)", () => {
  it("page title names the portfolio, not Crash Demo", () => {
    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    expect(titleMatch).toBeTruthy();
    const title = titleMatch![1];
    expect(title).toMatch(/portfolio/i);
    expect(title).not.toMatch(/Crash Demo/);
  });

  it("hud.css loads Retro Computer and menu tile chip / menu-back styles", () => {
    expect(css).toMatch(/@font-face/);
    expect(css).toMatch(/retrocomputerrusbydaymarius\.ttf/);
    expect(css).toMatch(/\.menu-tile__chip/);
    expect(css).toMatch(/\.menu-back/);
  });

  it("index.html has no persistent demo banner or disclaimer element", () => {
    expect(html).not.toMatch(/\bid=["'][^"']*(banner|disclaimer)[^"']*["']/i);
    expect(html).not.toMatch(
      /\bclass=["'][^"']*(banner|disclaimer)[^"']*["']/i,
    );
  });
});

