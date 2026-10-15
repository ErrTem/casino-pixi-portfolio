import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createRng } from "../../../../math/rng/createRng.js";
import { loadHotlineConfig } from "../../../../math/hotline/config/loadHotlineConfig.js";
import { createHotlineGame } from "../../../../math/hotline/index.js";
import type { CollectorSpawn } from "../../../../math/hotline/collectors/resolveCollectors.js";
import type { NightSnapshot } from "../../../../math/hotline/index.js";
import * as collectPresentation from "./collectPresentation.js";
import {
  baselineFromMeterFills,
  formatComboStrip,
  progressiveDisplayFills,
} from "./collectPresentation.js";

function nightWithFs(
  spinsLeft: number,
  totalCents: number,
): NightSnapshot {
  return {
    path: [{ color: "green", nested: false, state: "active" }],
    activeIndex: 0,
    fs: {
      spinsLeft,
      spinsDone: 0,
      totalSpins: 24,
      retriggers: 0,
      totalCents,
    },
    totalCents: 0,
    featureBetCents: 100,
  };
}

function spawn(color: CollectorSpawn["color"]): CollectorSpawn {
  return { color, cell: { reel: 0, row: 0 } };
}

describe("progressiveDisplayFills (COLL-02)", () => {
  it("grows one land at a time from a pre-spin baseline", () => {
    const baseline = { green: 1, red: 0, purple: 2 };
    const target = 6;
    expect(progressiveDisplayFills(baseline, [], target)).toEqual([1, 0, 2]);
    expect(
      progressiveDisplayFills(baseline, [spawn("green")], target),
    ).toEqual([2, 0, 2]);
    expect(
      progressiveDisplayFills(
        baseline,
        [spawn("green"), spawn("red"), spawn("green")],
        target,
      ),
    ).toEqual([3, 1, 2]);
  });

  it("soft caps each color at meterTarget", () => {
    const baseline = { green: 5, red: 0, purple: 0 };
    expect(progressiveDisplayFills(baseline, [spawn("green")], 3)).toEqual([
      3, 0, 0,
    ]);
  });
});

describe("formatComboStrip (D-10, D-11)", () => {
  it("formats green to red to purple labels", () => {
    expect(formatComboStrip(["green", "purple"])).toBe("COMBO: Green → Purple");
    expect(formatComboStrip([])).toBe("");
  });
});

describe("formatFeatureLine (D-02)", () => {
  it("returns empty when night or fs frame is absent", () => {
    expect(typeof collectPresentation.formatFeatureLine).toBe("function");
    expect(collectPresentation.formatFeatureLine(null)).toBe("");
    expect(
      collectPresentation.formatFeatureLine({
        path: [{ color: "green", nested: false, state: "active" }],
        activeIndex: 0,
        fs: null,
        totalCents: 0,
        featureBetCents: 100,
      }),
    ).toBe("");
  });

  it("formats remaining spins and running free spin win", () => {
    expect(typeof collectPresentation.formatFeatureLine).toBe("function");
    expect(collectPresentation.formatFeatureLine(nightWithFs(12, 1840))).toBe(
      "FREE SPINS 12 LEFT  WIN 18.40",
    );
  });

  it("formats zero spins left with the running total", () => {
    expect(typeof collectPresentation.formatFeatureLine).toBe("function");
    expect(collectPresentation.formatFeatureLine(nightWithFs(0, 250))).toBe(
      "FREE SPINS 0 LEFT  WIN 2.50",
    );
  });
});

describe("baselineFromMeterFills", () => {
  it("uses raw counts so this spin is not already booked", () => {
    expect(
      baselineFromMeterFills({
        green: { count: 4, display: 3 },
        red: { count: 0, display: 0 },
        purple: { count: 1, display: 1 },
      }),
    ).toEqual({ green: 4, red: 0, purple: 1 });
  });
});

describe("mountHotlineSession collect path contracts (D-12, D-14)", () => {
  it("session source locks busy through flights and stub without double booking", () => {
    const src = readFileSync(
      join(import.meta.dirname, "mountHotlineSession.ts"),
      "utf8",
    );
    expect(src).toMatch(/setBusy\s*\(\s*true\s*\)/);
    expect(src).toMatch(/startCollectors/);
    expect(src).toMatch(/progressiveDisplayFills/);
    expect(src).toMatch(/formatComboStrip/);
    expect(src).toMatch(/resetPhoneMeter/);
    expect(src).toMatch(/nextNightStep/);
    expect(src).toMatch(/spinFree/);
    expect(src).toMatch(/mountFeatureOverlay/);
    expect(src).toMatch(/setFeatureLine/);
    expect(src).toMatch(/formatFeatureLine/);
    expect(src).toMatch(/setWinCycleMs/);
    expect(src).toMatch(/FS_WIN_CYCLE_MS/);
    expect(src).toMatch(/FS_GAP_MS/);
    expect(src).toMatch(/pickLocker/);
    expect(src).toMatch(/showLockerGrid/);
    expect(src).toMatch(/hideLockers/);
    expect(src).toMatch(/setHoldMode/);
    expect(src).toMatch(/stepHoldRespin/);
    expect(src).toMatch(/hold_respin/);
    expect(src).toMatch(/HoldLayer|syncHold/);
    expect(src).toMatch(/setComboPath/);
    expect(src).toMatch(/buildComboStripCells/);
    expect(src).toMatch(/night_total/);
    expect(src).toMatch(/COMBO NIGHT/);
    expect(src).not.toMatch(/FEATURE_BEAT_MS/);
    expect(src).not.toMatch(/\.increment\s*\(/);
    const overlaySrc = readFileSync(
      join(import.meta.dirname, "../hud/FeatureOverlay.ts"),
      "utf8",
    );
    expect(overlaySrc).toMatch(/locker-pick/);
    expect(overlaySrc).not.toMatch(/\.innerHTML\s*=/);
  });

  it("session source plays collector beep events on presentation edges (D-16)", () => {
    const src = readFileSync(
      join(import.meta.dirname, "mountHotlineSession.ts"),
      "utf8",
    );
    expect(src).toMatch(/play\s*\(\s*["']token_spawn["']\s*\)/);
    expect(src).toMatch(/play\s*\(\s*["']token_land["']\s*\)/);
    expect(src).toMatch(/play\s*\(\s*["']phone_trigger["']\s*\)/);
    expect(src).toMatch(/unlock\s*\(\s*\)/);
  });

  it("session source plays feature beep events on bonus edges (04-05)", () => {
    const src = readFileSync(
      join(import.meta.dirname, "mountHotlineSession.ts"),
      "utf8",
    );
    expect(src).toMatch(/play\s*\(\s*["']feature_start["']\s*\)/);
    expect(src).toMatch(/play\s*\(\s*["']feature_end["']\s*\)/);
    expect(src).toMatch(/play\s*\(\s*["']hold_land["']\s*\)/);
    expect(src).toMatch(/play\s*\(\s*["']hold_respin["']\s*\)/);
    expect(src).toMatch(/play\s*\(\s*["']pick_reveal["']\s*\)/);
    expect(src).toMatch(/play\s*\(\s*["']jackpot["']\s*\)/);
  });
});

describe("mountHotlineSession gamble contracts (GAMBLE-01, GAMBLE-02)", () => {
  const read = (p: string): string =>
    readFileSync(join(import.meta.dirname, p), "utf8");

  it("enterIdle offers gamble from the snapshot and spin clears it first", () => {
    const src = read("mountHotlineSession.ts");
    expect(src).toMatch(/setGambleEnabled/);
    expect(src).toMatch(/getGambleSnapshot/);
    expect(src).toMatch(/mountGambleOverlay/);
    expect(src).toMatch(/resolveGamble/);
    expect(src).toMatch(/:gamble/);
    expect(src).toMatch(/"gamble"/);
    const spinAt = src.indexOf("const result = game.spin()");
    const clearAt = src.lastIndexOf("clearGambleOffer", spinAt);
    expect(spinAt).toBeGreaterThan(0);
    expect(clearAt).toBeGreaterThan(0);
  });

  it("onCollect clears the open offer then returns to idle without resolve", () => {
    const src = read("mountHotlineSession.ts");
    const mountAt = src.indexOf("mountGambleOverlay");
    const openAt = src.indexOf("function openGamble");
    expect(mountAt).toBeGreaterThan(0);
    expect(openAt).toBeGreaterThan(mountAt);
    const mountBlock = src.slice(mountAt, openAt);
    expect(mountBlock).toMatch(/onCollect\s*:/);
    expect(mountBlock).toMatch(/clearGambleOffer\s*\(\s*\)/);
    expect(mountBlock).toMatch(/enterIdle\s*\(\s*\)/);
    expect(mountBlock).toMatch(
      /present !== ["']gamble["']\s*\|\|\s*gambleShowingResult\s*\|\|\s*infoOpen/,
    );
    expect(mountBlock).not.toMatch(/resolveGamble/);
  });

  it("html has the gamble overlay and hud control outside the canvas host", () => {
    const html = readFileSync(join(import.meta.dirname, "../../../../index.html"), "utf8");
    const tpl = html.slice(html.indexOf('id="hotline-screen-template"'));
    expect(tpl).toMatch(/data-field="gamble-overlay"/);
    expect(tpl).toMatch(/data-action="gamble"/);
    expect(tpl).toMatch(/data-action="survive"/);
    expect(tpl).toMatch(/data-action="die"/);
    expect(tpl).toMatch(/CURRENT WIN/);
    expect(tpl).toMatch(/GAMBLE TO WIN/);
    const hostOpen = tpl.indexOf('id="game-canvas-host"');
    const hostClose = tpl.indexOf("</div>", hostOpen);
    const inside = tpl.slice(hostOpen, hostClose);
    expect(inside).not.toMatch(/gamble|survive|die/);
  });

  it("overlay binder writes text only and binds collect with a collect amount field", () => {
    const src = read("../hud/GambleOverlay.ts");
    expect(src).toMatch(/mountGambleOverlay/);
    expect(src).toMatch(/textContent/);
    expect(src).not.toMatch(/\.innerHTML\s*=/);
    expect(src).toMatch(/onCollect/);
    expect(src).toMatch(/data-action=collect/);
    expect(src).toMatch(/data-field=gamble-collect/);
  });
});

// walks seeds until a base line win is offered with no night running
function gameWithOffer(prefix: string) {
  const config = loadHotlineConfig();
  for (let n = 0; n < 60; n += 1) {
    const seed = `${prefix}-${n}`;
    const game = createHotlineGame({ seed, config });
    for (let i = 0; i < 300; i += 1) {
      if (game.isNightActive()) break;
      game.spin();
      if (game.getGambleSnapshot().offered && !game.isNightActive()) {
        return { game, seed };
      }
    }
  }
  throw new Error("no gamble offer found in test seeds");
}

describe("gamble session edges (D-02, D-03, D-04, GAMBLE-02)", () => {
  const src = readFileSync(join(import.meta.dirname, "mountHotlineSession.ts"), "utf8");

  it("offer gate keeps gamble off while a night is active", () => {
    expect(src).toMatch(
      /setGambleEnabled\(\s*gambleSnap\.offered\s*&&\s*!game\.isNightActive\(\)\s*\)/,
    );
    expect(src).toMatch(/!snap\.offered\s*\|\|\s*game\.isNightActive\(\)/);
  });

  it("die and survive share one resolve path that shows a result then auto closes", () => {
    expect(src).toMatch(/HOLD_RESPIN_MS\s*=\s*800/);
    expect(src).toMatch(/GAMBLE_SURVIVE_RESULT_MS\s*=\s*1800/);
    expect(src).toMatch(/GAMBLE_DIE_RESULT_MS\s*=\s*750/);
    expect(src).not.toMatch(/\bGAMBLE_RESULT_MS\b/);
    expect(src).toMatch(/gambleOverlay\.showResult/);
    expect(src).toMatch(/gambleShowingResult/);
    expect(src).toMatch(/present === "gamble" && gambleShowingResult/);
    // result ticker picks the hold matching the last showResult outcome
    expect(src).toMatch(/gambleElapsed\s*<\s*gambleResultHoldMs/);
    // auto close returns through enterIdle
    expect(src).toMatch(/enterIdle\(\)/);
    // only the idle entry hides the overlay again, no sticky phase between rounds
    expect(src).toMatch(/gambleOverlay\.hide\(\)/);
  });

  it("playGambleRound blocks while a result beat is already showing", () => {
    const playAt = src.indexOf("function playGambleRound");
    expect(playAt).toBeGreaterThan(0);
    const splashAt = src.indexOf("function showSplash", playAt);
    const body = src.slice(playAt, splashAt > playAt ? splashAt : playAt + 800);
    expect(body).toMatch(
      /if \(present !== "gamble" \|\| gambleShowingResult \|\| infoOpen\) return/,
    );
  });

  it("playGambleRound records survive versus die result hold ms", () => {
    const playAt = src.indexOf("function playGambleRound");
    const splashAt = src.indexOf("function showSplash", playAt);
    const body = src.slice(playAt, splashAt > playAt ? splashAt : playAt + 900);
    expect(body).toMatch(/gambleResultHoldMs\s*=\s*res\.survived/);
    expect(body).toMatch(/GAMBLE_SURVIVE_RESULT_MS/);
    expect(body).toMatch(/GAMBLE_DIE_RESULT_MS/);
    expect(src).toMatch(/HOLD_RESPIN_MS\s*=\s*800/);
    expect(src).toMatch(/GAMBLE_SURVIVE_RESULT_MS\s*=\s*1800/);
    expect(src).toMatch(/GAMBLE_DIE_RESULT_MS\s*=\s*750/);
  });

  it("spin bank path drops the offer first before resolving the spin", () => {
    const spinAt = src.indexOf("const result = game.spin()");
    const clearAt = src.lastIndexOf("game.clearGambleOffer()", spinAt);
    const offAt = src.lastIndexOf("hud.setGambleEnabled(false)", spinAt);
    expect(clearAt).toBeGreaterThan(src.indexOf("spin(): SpinResult"));
    expect(offAt).toBeGreaterThan(clearAt);
  });

  it("spin keeps the credited win and clears the offer in the game facade", () => {
    const { game } = gameWithOffer("gamble-edge");

    const pot = game.getGambleSnapshot().stakeCents;
    const before = Math.round(Number.parseFloat(game.getSnapshot().balanceDisplay) * 100);
    game.clearGambleOffer();
    expect(game.getGambleSnapshot().offered).toBe(false);
    expect(Math.round(Number.parseFloat(game.getSnapshot().balanceDisplay) * 100)).toBe(before);
    expect(pot).toBeGreaterThan(0);
  });

  it("die debits the pot once through the seeded gamble stream", () => {
    const { game, seed } = gameWithOffer("gamble-edge-die");
    const rng = createRng(`:gamble`);

    const before = Math.round(Number.parseFloat(game.getSnapshot().balanceDisplay) * 100);
    const stake = game.getGambleSnapshot().stakeCents;
    const res = game.resolveGamble(rng);
    expect(res).not.toBeNull();
    const after = Math.round(Number.parseFloat(game.getSnapshot().balanceDisplay) * 100);
    expect(after).toBe(res!.survived ? before + stake : before - stake);
    if (!res!.survived) expect(game.getGambleSnapshot().offered).toBe(false);
  });
});
describe("info sheet session and markup (BASE-04, D-09, D-12)", () => {
  const read = (p: string): string =>
    readFileSync(join(import.meta.dirname, p), "utf8");

  it("html has the paytable overlay and info control outside the canvas host", () => {
    const html = readFileSync(join(import.meta.dirname, "../../../../index.html"), "utf8");
    const tpl = html.slice(html.indexOf('id="hotline-screen-template"'));
    expect(tpl).toMatch(/data-field="paytable-overlay"/);
    expect(tpl).toMatch(/data-field="paytable-body"/);
    expect(tpl).toMatch(/data-action="info"/);
    expect(tpl).toMatch(/data-action="paytable-close"/);
    const hostOpen = tpl.indexOf('id="game-canvas-host"');
    const hostClose = tpl.indexOf("</div>", hostOpen);
    const inside = tpl.slice(hostOpen, hostClose);
    expect(inside).not.toMatch(/paytable|info/);
  });

  it("overlay binder builds rows with createElement textContent and replaceChildren only", () => {
    const src = read("../hud/PaytableOverlay.ts");
    expect(src).toMatch(/mountPaytableOverlay/);
    expect(src).toMatch(/createElement/);
    expect(src).toMatch(/textContent/);
    expect(src).toMatch(/replaceChildren/);
    expect(src).not.toMatch(/innerHTML|insertAdjacentHTML/);
  });

  it("session opens the sheet from the live model and pauses play until dismiss", () => {
    const src = read("mountHotlineSession.ts");
    expect(src).toMatch(/mountPaytableOverlay/);
    expect(src).toMatch(/paytableSheetModel\(\s*config\s*\)/);
    expect(src).toMatch(/onInfo/);
    const openAt = src.indexOf("function openInfo");
    const closeAt = src.indexOf("function closeInfo");
    expect(openAt).toBeGreaterThan(0);
    expect(closeAt).toBeGreaterThan(openAt);
    expect(src.slice(openAt, closeAt)).toMatch(/hud\.setBusy\(\s*true\s*\)/);
    expect(src.slice(closeAt, closeAt + 900)).toMatch(/hud\.setBusy\(\s*busy\s*\)/);
    expect(src).toMatch(/infoOpen/);
  });

  it("spin gamble round and feature taps are inert while the sheet is open", () => {
    const src = read("mountHotlineSession.ts");
    expect(src).toMatch(/if \(busy \|\| infoOpen/);
    expect(src).toMatch(/if \(infoOpen\) return/);
    expect(src).toMatch(/if \(present !== "gamble" \|\| gambleShowingResult \|\| infoOpen\)/);
  });
});
describe("gamble beeps and vhs art hooks (PRES-02, D-08)", () => {
  const read = (p: string): string =>
    readFileSync(join(import.meta.dirname, p), "utf8");

  it("session plays open survive and die beeps on the matching edges", () => {
    const src = read("mountHotlineSession.ts");
    const openAt = src.indexOf("function openGamble");
    const playAt = src.indexOf("function playGambleRound");
    const splashAt = src.indexOf("function showSplash");
    expect(src.slice(openAt, playAt)).toMatch(/audio\.play\(\s*"gamble_open"\s*\)/);
    const round = src.slice(playAt, splashAt);
    expect(round).toMatch(/audio\.play\(\s*"gamble_survive"\s*\)/);
    expect(round).toMatch(/audio\.play\(\s*"gamble_die"\s*\)/);
  });

  it("overlay disables survive and die before invoking resolve handlers", () => {
    const src = read("../hud/GambleOverlay.ts");
    const surviveAt = src.indexOf("const onSurviveClick");
    const dieAt = src.indexOf("const onDieClick");
    const collectAt = src.indexOf("const onCollectClick");
    expect(surviveAt).toBeGreaterThan(0);
    expect(dieAt).toBeGreaterThan(surviveAt);
    const surviveBody = src.slice(surviveAt, dieAt);
    const dieBody = src.slice(dieAt, collectAt > dieAt ? collectAt : dieAt + 200);
    expect(surviveBody).toMatch(/setButtons\(\s*true\s*\)/);
    expect(surviveBody.indexOf("setButtons")).toBeLessThan(surviveBody.indexOf("options.onSurvive"));
    expect(dieBody).toMatch(/setButtons\(\s*true\s*\)/);
    expect(dieBody.indexOf("setButtons")).toBeLessThan(dieBody.indexOf("options.onDie"));
  });

  it("overlay hooks the three optional vhs pngs with fixed static paths", () => {
    const src = read("../hud/GambleOverlay.ts");
    expect(src).toMatch(/\/assets\/hotline\/vhs-gamble-panel\.png/);
    expect(src).toMatch(/\/assets\/hotline\/vhs-btn-survive\.png/);
    expect(src).toMatch(/\/assets\/hotline\/vhs-btn-die\.png/);
    expect(src).not.toMatch(/\.innerHTML\s*=/);
  });

  it("vhs pngs stay out of the pixi loader list", () => {
    const src = read("../view/loadHotlineAssets.ts");
    expect(src).not.toMatch(/vhs-/);
  });

  it("asset list names the three vhs files and forbids loader edits", () => {
    const listPath = join(
      import.meta.dirname,
      "../../../../.planning/phases/05-gamble-paytable-polish/05-ASSET-LIST.md",
    );
    if (!existsSync(listPath)) {
      // planning docs are optional in this checkout
      return;
    }
    const list = readFileSync(listPath, "utf8");
    expect(list).toMatch(/vhs-gamble-panel\.png/);
    expect(list).toMatch(/vhs-btn-survive\.png/);
    expect(list).toMatch(/vhs-btn-die\.png/);
    expect(list).toMatch(/HOTLINE_ASSET_URLS/);
  });
});

describe("center win callout blank settle (sz5)", () => {
  const read = (p: string): string =>
    readFileSync(join(import.meta.dirname, p), "utf8");

  it("onReelsSettled clears wins when paid is 0", () => {
    const src = read("mountHotlineSession.ts");
    const fnAt = src.indexOf("function onReelsSettled");
    expect(fnAt).toBeGreaterThan(0);
    const nextFn = src.indexOf("\n  function ", fnAt + 1);
    const body = src.slice(fnAt, nextFn > fnAt ? nextFn : fnAt + 400);
    expect(body).toMatch(/paid\s*===\s*0/);
    expect(body).toMatch(/clearWins\s*\(/);
  });

  it("HotlineScene wires clearWins and the win callout gate", () => {
    const src = read("../view/HotlineScene.ts");
    expect(src).toMatch(/shouldShowWinCallout|winCalloutGate/);
    expect(src).toMatch(/clearWins\s*\(/);
    expect(src).toMatch(/clearWinScales/);
    expect(src).not.toMatch(/stickyLastWin/);
    expect(src).not.toMatch(/lastWinDisplay/);
  });

  it("WinLinesOverlay never uses sticky last-win fields", () => {
    const src = read("../view/WinLinesOverlay.ts");
    expect(src).not.toMatch(/stickyLastWin/);
    expect(src).not.toMatch(/lastWinDisplay/);
    expect(src).toMatch(/formatWinCallout/);
  });
});

describe("center win callout keeps looping through idle (tzl)", () => {
  const read = (p: string): string =>
    readFileSync(join(import.meta.dirname, p), "utf8");

  it("enterIdle does not wipe the center win overlay", () => {
    const src = read("mountHotlineSession.ts");
    const fnAt = src.indexOf("function enterIdle");
    expect(fnAt).toBeGreaterThan(0);
    const nextFn = src.indexOf("\n  function ", fnAt + 1);
    const body = src.slice(fnAt, nextFn > fnAt ? nextFn : fnAt + 800);
    expect(body).not.toMatch(/clearWins\s*\(/);
  });

  it("HotlineScene showWins cycles without a reveal gate", () => {
    const src = read("../view/HotlineScene.ts");
    expect(src).not.toMatch(/winReveal|setWinReveal/);
    expect(src).toMatch(/showCycle/);
    const showAt = src.indexOf("function showWins");
    expect(showAt).toBeGreaterThan(0);
    const nextFn = src.indexOf("\n  function ", showAt + 1);
    const body = src.slice(showAt, nextFn > showAt ? nextFn : showAt + 500);
    expect(body).toMatch(/showCycle/);
    expect(body).toMatch(/shouldShowWinCallout/);
    expect(src).not.toMatch(/stickyLastWin/);
    expect(src).not.toMatch(/lastWinDisplay/);
  });

  it("startSpin clears wins and blank settle still clears", () => {
    const scene = read("../view/HotlineScene.ts");
    const startAt = scene.indexOf("startSpin(");
    expect(startAt).toBeGreaterThan(0);
    const startBody = scene.slice(startAt, startAt + 280);
    expect(startBody).toMatch(/clearWins\s*\(/);

    const mount = read("mountHotlineSession.ts");
    const fnAt = mount.indexOf("function onReelsSettled");
    expect(fnAt).toBeGreaterThan(0);
    const nextFn = mount.indexOf("\n  function ", fnAt + 1);
    const body = mount.slice(fnAt, nextFn > fnAt ? nextFn : fnAt + 600);
    expect(body).toMatch(/paid\s*===\s*0/);
    expect(body).toMatch(/clearWins\s*\(/);
    expect(body).not.toMatch(/setWinReveal/);
  });

  it("empty collector spawns skip win_hold and go afterFreeSpinOrNight", () => {
    const src = read("mountHotlineSession.ts");
    expect(src).not.toMatch(/win_hold|"win_hold"/);
    const fnAt = src.indexOf("function beginFlights");
    expect(fnAt).toBeGreaterThan(0);
    const nextFn = src.indexOf("\n  function ", fnAt + 1);
    const body = src.slice(fnAt, nextFn > fnAt ? nextFn : fnAt + 700);
    expect(body).toMatch(/spawns\.length\s*===\s*0/);
    expect(body).toMatch(/afterFreeSpinOrNight/);
    expect(body).not.toMatch(/win_hold/);
  });
});

describe("blank settle clear blanks callout + hold-off ownership (u99)", () => {
  const read = (p: string): string =>
    readFileSync(join(import.meta.dirname, p), "utf8");

  it("WinLinesOverlay.clear blanks label text", () => {
    const src = read("../view/WinLinesOverlay.ts");
    const clearAt = src.indexOf("clear(): void");
    expect(clearAt).toBeGreaterThan(0);
    const nextMethod = src.indexOf("\n    destroy():", clearAt);
    const body = src.slice(clearAt, nextMethod > clearAt ? nextMethod : clearAt + 300);
    expect(body).toMatch(/label\.text\s*=\s*["']["']/);
  });

  it("applyHoldMode force-hides overlay only when entering hold", () => {
    const src = read("../view/HotlineScene.ts");
    const fnAt = src.indexOf("function applyHoldMode");
    expect(fnAt).toBeGreaterThan(0);
    const nextFn = src.indexOf("\n  return {", fnAt);
    const body = src.slice(fnAt, nextFn > fnAt ? nextFn : fnAt + 500);
    // hold-on must hide the overlay
    expect(body).toMatch(/overlay\.container\.visible\s*=\s*false/);
    // hold-off must not force-show (no visible = !on or visible = true)
    expect(body).not.toMatch(/overlay\.container\.visible\s*=\s*!on/);
    expect(body).not.toMatch(/overlay\.container\.visible\s*=\s*true/);
  });
});
