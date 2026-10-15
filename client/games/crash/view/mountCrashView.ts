import type { Application } from "pixi.js";
import { loadBackdropTextures } from "./Backdrop.js";
import { createCrashScene, type CrashScene } from "./CrashScene.js";
import { loadExplosionTextures } from "./Explosion.js";
import { loadRocketTextures } from "./Rocket.js";

export interface MountedCrashView {
  scene: CrashScene;
  dispose: () => void;
}

export async function mountCrashView(
  app: Application,
): Promise<MountedCrashView> {
  const [{ cloudTextures, treeTextures }, rocketTextures, explosionTextures] =
    await Promise.all([
      loadBackdropTextures(),
      loadRocketTextures(),
      loadExplosionTextures(),
    ]);

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

  const scene = createCrashScene(app, {
    cloudTextures,
    treeTextures,
    rocketTextures,
    explosionTextures,
  });
  return { scene, dispose };
}
