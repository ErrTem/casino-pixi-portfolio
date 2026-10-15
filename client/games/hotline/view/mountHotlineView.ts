import type { Application } from "pixi.js";
import type { HotlineConfig } from "../../../../math/hotline/config/HotlineConfigSchema.js";
import {
  createHotlineScene,
  type HotlineScene,
  type HotlineSceneHooks,
} from "./HotlineScene.js";
import { loadHotlineAssets } from "./loadHotlineAssets.js";

export interface MountedHotlineView {
  scene: HotlineScene;
  dispose: () => void;
}

// loads art and the title font first, a missing file rejects before anything is drawn
export async function mountHotlineView(
  app: Application,
  config: HotlineConfig,
  hooks: HotlineSceneHooks = {},
): Promise<MountedHotlineView> {
  const textures = await loadHotlineAssets();

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

  const scene = createHotlineScene(app, config, textures, hooks);
  return { scene, dispose };
}
