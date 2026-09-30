import { Application } from "pixi.js";
import { loadBackdropTextures } from "./Backdrop.js";
import { createCrashScene, type CrashScene } from "./CrashScene.js";
import { loadExplosionTextures } from "./Explosion.js";
import { loadRocketTextures } from "./Rocket.js";
import { VIEW_CONFIG } from "./viewConfig.js";

export interface MountedCrashView {
  app: Application;
  scene: CrashScene;
  /** Removes orientation / visualViewport listeners. Call before app.destroy. */
  dispose: () => void;
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

  // Harden: orientation / iOS chrome show-hide may miss ResizePlugin alone.
  const refresh = (): void => {
    const next = Math.min(window.devicePixelRatio || 1, 2);
    if (app.renderer.resolution !== next) {
      app.renderer.resolution = next;
    }
    app.resize();
  };
  window.addEventListener("orientationchange", refresh);
  const vv = window.visualViewport;
  vv?.addEventListener("resize", refresh);

  const dispose = (): void => {
    window.removeEventListener("orientationchange", refresh);
    vv?.removeEventListener("resize", refresh);
  };

  const [{ cloudTextures, treeTextures }, rocketTextures, explosionTextures] =
    await Promise.all([
      loadBackdropTextures(),
      loadRocketTextures(),
      loadExplosionTextures(),
    ]);
  const scene = createCrashScene(app, {
    cloudTextures,
    treeTextures,
    rocketTextures,
    explosionTextures,
  });
  return { app, scene, dispose };
}
