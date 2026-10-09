import type { Ticker } from "pixi.js";
import type { GameSession, ShellContext } from "../../../shell/types.js";
import { loadHotlineConfig } from "../config/loadHotlineConfig.js";
import { mountHotlineHud } from "../hud/HotlineHud.js";
import {
  createHotlineGame,
  type HotlineGame,
  type HotlineSnapshot,
  type SpinResult,
} from "../logic/index.js";
import { mountHotlineView } from "../view/mountHotlineView.js";

export async function mountHotlineSession(
  ctx: ShellContext,
): Promise<GameSession> {
  // a bad config throws here, before any dom or app state is touched
  const config = loadHotlineConfig();
  const game = createHotlineGame({ seed: ctx.seed, config });

  const tpl = document.querySelector(
    "#hotline-screen-template",
  ) as HTMLTemplateElement | null;
  const cloned = tpl?.content.firstElementChild?.cloneNode(true);
  if (!(cloned instanceof HTMLElement)) {
    throw new Error("hotline session: #hotline-screen-template missing");
  }
  const screen = cloned;

  ctx.root.append(screen);

  const host = screen.querySelector("#game-canvas-host");
  if (!(host instanceof HTMLElement)) {
    throw new Error("hotline session: #game-canvas-host missing");
  }

  host.replaceChildren(ctx.app.canvas);
  ctx.app.resizeTo = host;

  let view: Awaited<ReturnType<typeof mountHotlineView>> | null = null;

  // the math settles in one call, the reels play it back afterwards
  const hudGame: HotlineGame = {
    spin(): SpinResult {
      // a spin mid motion is ignored quietly, the empty reason clears the status line
      if (view?.scene.isSpinning()) return { ok: false, reason: "" };
      const result = game.spin();
      if (result.ok && view) {
        ctx.audio.unlock();
        ctx.audio.play("spin");
        view.scene.startSpin(game.getSnapshot().grid);
      }
      return result;
    },
    setBetStepIndex: (index) => game.setBetStepIndex(index),
    getSnapshot: () => visibleSnapshot(game.getSnapshot()),
  };

  // last win stays hidden until the last reel lands
  function visibleSnapshot(snap: HotlineSnapshot): HotlineSnapshot {
    if (view?.scene.isSpinning()) return { ...snap, phase: "idle" };
    return snap;
  }

  const hud = mountHotlineHud(screen, hudGame, {
    audio: ctx.audio,
    betStepCount: config.math.betStepsCents.length,
  });

  const menuEl = screen.querySelector("[data-action=menu]");
  if (!(menuEl instanceof HTMLButtonElement)) {
    throw new Error("hotline session: data-action=menu missing");
  }
  const menuBtn: HTMLButtonElement = menuEl;
  const onMenuClick = (): void => {
    ctx.requestMenu();
  };
  menuBtn.addEventListener("click", onMenuClick);

  let disposed = false;
  let onTick: ((ticker: Ticker) => void) | null = null;

  const onAbort = (): void => {
    dispose();
  };
  ctx.signal.addEventListener("abort", onAbort, { once: true });

  function dispose(): void {
    if (disposed) return;
    disposed = true;
    ctx.signal.removeEventListener("abort", onAbort);
    menuBtn.removeEventListener("click", onMenuClick);
    if (onTick) {
      ctx.app.ticker.remove(onTick);
      onTick = null;
    }
    hud.dispose();
    if (view) {
      view.scene.destroy();
      view.dispose();
      view = null;
    }
    (ctx.app as { resizeTo: Window | HTMLElement | null }).resizeTo = null;
    ctx.app.stop();
    ctx.app.canvas.remove();
    screen.remove();
  }

  view = await mountHotlineView(ctx.app, config, {
    onReelStop: () => ctx.audio.play("reel_stop"),
  });
  if (disposed) {
    view.scene.destroy();
    view.dispose();
    view = null;
    return { dispose };
  }

  hud.render(hudGame.getSnapshot());

  onTick = (ticker: Ticker): void => {
    // scene first so the hud reads the motion state after this frame
    view!.scene.sync(game.getSnapshot(), ticker.deltaMS);
    hud.render(hudGame.getSnapshot());
  };
  ctx.app.ticker.add(onTick);
  ctx.app.start();

  return { dispose };
}
