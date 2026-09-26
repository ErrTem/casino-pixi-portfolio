import { Application } from "pixi.js";
import { createCrashScene, type CrashScene } from "./CrashScene.js";
import { VIEW_CONFIG } from "./viewConfig.js";

export interface MountedCrashView {
  app: Application;
  scene: CrashScene;
}

/**
 * Async Pixi Application bootstrap into #game-canvas-host.
 * Does not register a ticker callback — composition root owns the clock.
 */
export async function mountCrashView(
  host: HTMLElement,
): Promise<MountedCrashView> {
  const app = new Application();
  await app.init({
    resizeTo: host,
    background: VIEW_CONFIG.BACKGROUND,
    antialias: true,
    autoDensity: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    preference: "webgl",
    autoStart: true,
    sharedTicker: false,
  });
  host.replaceChildren(app.canvas);
  app.resize();
  const scene = createCrashScene(app);
  return { app, scene };
}
