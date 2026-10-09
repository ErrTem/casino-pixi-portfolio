import type { GameSession, ShellContext } from "../../../shell/types.js";
import { loadHotlineConfig } from "../config/loadHotlineConfig.js";
import { mountHotlineHud } from "../hud/HotlineHud.js";
import { createHotlineGame } from "../logic/index.js";
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

  const hud = mountHotlineHud(screen, game, {
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
  let view: Awaited<ReturnType<typeof mountHotlineView>> | null = null;
  let onTick: (() => void) | null = null;

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

  view = await mountHotlineView(ctx.app, config);
  if (disposed) {
    view.scene.destroy();
    view.dispose();
    view = null;
    return { dispose };
  }

  hud.render(game.getSnapshot());

  onTick = (): void => {
    const snap = game.getSnapshot();
    hud.render(snap);
    view!.scene.sync(snap);
  };
  ctx.app.ticker.add(onTick);
  ctx.app.start();

  return { dispose };
}
