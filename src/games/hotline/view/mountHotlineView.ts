import type { Application } from "pixi.js";
import type { HotlineConfig } from "../config/HotlineConfigSchema.js";
import {
  createHotlineScene,
  type HotlineScene,
  type HotlineSceneHooks,
} from "./HotlineScene.js";

export interface MountedHotlineView {
  scene: HotlineScene;
  dispose: () => void;
}

// placeholder view, textures and fonts load here once the presentation plan lands
export async function mountHotlineView(
  app: Application,
  config: HotlineConfig,
  hooks: HotlineSceneHooks = {},
): Promise<MountedHotlineView> {
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

  const scene = createHotlineScene(app, config, hooks);
  return { scene, dispose };
}
