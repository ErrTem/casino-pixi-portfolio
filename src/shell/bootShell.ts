import { Application, Ticker } from "pixi.js";
import { createBeepAudioPort } from "../shared/audio/createBeepAudioPort.js";
import { loadMutePref } from "../shared/audio/mutePref.js";
import { parseBootSeed } from "../shared/boot/parseBootSeed.js";
import { VIEW_CONFIG } from "../games/crash/view/viewConfig.js";
import { GAMES } from "./gameRegistry.js";
import { mountMenu } from "./menu/mountMenu.js";
import { createContextFactory, createRouter } from "./router.js";

export async function bootShell(): Promise<() => void> {
  const root = document.querySelector("#app");
  if (!(root instanceof HTMLElement)) throw new Error("#app missing");

  const { seed } = parseBootSeed(window.location.search);
  const audio = createBeepAudioPort({ muted: loadMutePref() });

  const app = new Application();
  await app.init({
    background: VIEW_CONFIG.BACKGROUND,
    antialias: true,
    autoDensity: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    preference: "webgl",
    autoStart: false,
    sharedTicker: false,
  });
  app.ticker.minFPS = 10;

  if (import.meta.env.DEV) {
    const g = globalThis as typeof globalThis & {
      __PIXI_APP__?: Application;
      __shellDebug?: {
        sharedTickers: () => number;
        stageChildren: () => number;
      };
    };
    g.__PIXI_APP__ = app;
    g.__shellDebug = {
      sharedTickers: () => Ticker.shared.count,
      stageChildren: () => app.stage.children.length,
    };
  }

  const router = createRouter({
    games: GAMES,
    showMenu: (onLaunch) => mountMenu(root, { games: GAMES, onLaunch }),
    buildContext: createContextFactory({ app, root, audio, seed }),
  });
  router.start();

  let disposed = false;
  return () => {
    if (disposed) return;
    disposed = true;
    router.dispose();
    audio.dispose();
    app.destroy(
      { removeView: true, releaseGlobalResources: true },
      { children: true },
    );
  };
}
