import { Assets, Container, Graphics, Sprite, Texture } from "pixi.js";
import { VIEW_CONFIG } from "./viewConfig.js";

export interface Backdrop {
  container: Container;
  /** Rebuild layers only when screen size changes — never clear every sync frame. */
  rebuildIfNeeded: (width: number, height: number) => void;
  /**
   * Advance parallax while climbing.
   * @param scrolling when false (waiting/crash), layers stay frozen
   * @param speed01 0..1 extra scroll rate on top of base (smooth — no period remaps)
   */
  tick: (deltaMS: number, scrolling?: boolean, speed01?: number) => void;
}

/** Bundled cloud sprites (white bodies, transparent bg) for tinting. */
export const CLOUD_ASSET_URLS = [
  "/assets/clouds/cloud-a.png",
  "/assets/clouds/cloud-b.png",
  "/assets/clouds/cloud-c.png",
] as const;

/** Bundled tree silhouettes (white bodies) for ground strip tinting. */
export const TREE_ASSET_URLS = [
  "/assets/trees/tree-a.png",
  "/assets/trees/tree-b.png",
  "/assets/trees/tree-c.png",
] as const;

function clamp01(t: number): number {
  if (!Number.isFinite(t)) return 0;
  return Math.min(1, Math.max(0, t));
}

function fillStarDust(
  g: Graphics,
  count: number,
  w: number,
  h: number,
  yBand: { top: number; span: number },
  seed: number,
  dustish: boolean,
): void {
  for (let i = 0; i < count; i++) {
    const u = ((i * 47 + seed * 13) % 97) / 97;
    const v = ((i * 31 + seed * 17 + 13) % 89) / 89;
    const x = u * w * 2;
    const y = h * (yBand.top + v * yBand.span);
    if (dustish && i % 4 === 0) {
      const rx = 1.2 + (i % 3) * 0.8;
      const ry = 0.5 + (i % 2) * 0.35;
      g.ellipse(x, y, rx, ry).fill({
        color: 0xc8c4ff,
        alpha: 0.1 + (i % 5) * 0.03,
      });
    } else {
      const r = 0.55 + (i % 3) * 0.35;
      g.circle(x, y, r).fill({
        color: 0xffffff,
        alpha: 0.16 + (i % 5) * 0.05,
      });
    }
  }
}

export interface BackdropOptions {
  /** Preloaded cloud textures (same order as CLOUD_ASSET_URLS). */
  cloudTextures?: readonly Texture[];
  /** Preloaded tree textures (same order as TREE_ASSET_URLS). */
  treeTextures?: readonly Texture[];
}

/**
 * Flat night field + parallax stars + clouds + ground strip with trees.
 * Scroll only while climbing; phase accumulates continuously (no intensity-period jumps).
 */
export function createBackdrop(
  width: number,
  height: number,
  options: BackdropOptions = {},
): Backdrop {
  const container = new Container();
  let lastW = -1;
  let lastH = -1;
  /** Continuous wrap phases in [0, ∞); position = -(phase % 1) * screenW. */
  let farPhase = 0;
  let midPhase = 0;
  let nearPhase = 0;
  let cloudPhase = 0;
  let treePhase = 0;
  let bobMs = 0;
  let farLayer: Graphics | null = null;
  let midLayer: Graphics | null = null;
  let nearLayer: Graphics | null = null;
  let clouds: Container | null = null;
  let trees: Container | null = null;
  let screenW = width;
  const cloudTextures = (options.cloudTextures ?? []).filter(
    (t) => t && t !== Texture.EMPTY,
  );
  const treeTextures = (options.treeTextures ?? []).filter(
    (t) => t && t !== Texture.EMPTY,
  );

  function placeCloudSprites(layer: Container, w: number, h: number): void {
    if (cloudTextures.length === 0) return;

    const groundH = Math.max(18, h * VIEW_CONFIG.GROUND_HEIGHT_RATIO);
    const clearance = 10;
    const specs = [
      { cx: w * 0.18, cy: h * 0.72, width: w * 0.224 },
      { cx: w * 0.48, cy: h * 0.76, width: w * 0.272 },
      { cx: w * 0.78, cy: h * 0.7, width: w * 0.208 },
      { cx: w * 0.62, cy: h * 0.78, width: w * 0.24 },
      // Duplicate strip for seamless wrap (2× wide scroll).
      { cx: w * 1.18, cy: h * 0.74, width: w * 0.224 },
      { cx: w * 1.48, cy: h * 0.77, width: w * 0.256 },
      { cx: w * 1.78, cy: h * 0.71, width: w * 0.192 },
    ];

    for (let i = 0; i < specs.length; i++) {
      const spec = specs[i]!;
      const tex = cloudTextures[i % cloudTextures.length]!;
      const sprite = new Sprite(tex);
      sprite.anchor.set(0.5);
      sprite.tint = VIEW_CONFIG.CLOUD_TINT;
      sprite.alpha = VIEW_CONFIG.CLOUD_ALPHA;
      const scale = spec.width / Math.max(1, tex.width);
      sprite.scale.set(scale);
      // Keep sprite bottom above the ground strip (desktop overlap fix).
      const halfH = (tex.height * scale) / 2;
      const maxCy = h - groundH - clearance - halfH;
      sprite.position.set(spec.cx, Math.min(spec.cy, maxCy));
      layer.addChild(sprite);
    }
  }

  function placeTreeSprites(layer: Container, w: number, h: number): void {
    if (treeTextures.length === 0) return;

    const mobile = w <= VIEW_CONFIG.TREE_MOBILE_MAX_W;
    const groundH = Math.max(18, h * VIEW_CONFIG.GROUND_HEIGHT_RATIO);
    const groundTop = h - groundH;
    // Plant trunks slightly into the strip so they sit on the ground.
    const plantY = groundTop + groundH * 0.35;
    const heightRatio = mobile
      ? VIEW_CONFIG.TREE_HEIGHT_RATIO_MOBILE
      : VIEW_CONFIG.TREE_HEIGHT_RATIO;
    const targetH = Math.max(22, h * heightRatio);

    // Fewer trees on narrow screens; duplicate for 2× wrap strip.
    const fracXs = mobile
      ? [0.15, 0.5, 0.82]
      : [0.08, 0.22, 0.38, 0.55, 0.7, 0.88];
    const xs = [
      ...fracXs.map((u) => w * u),
      ...fracXs.map((u) => w * (1 + u)),
    ];

    for (let i = 0; i < xs.length; i++) {
      const tex = treeTextures[i % treeTextures.length]!;
      const sprite = new Sprite(tex);
      sprite.anchor.set(0.5, 1);
      sprite.tint = VIEW_CONFIG.TREE_TINT;
      sprite.alpha = VIEW_CONFIG.TREE_ALPHA;
      const scale = targetH / Math.max(1, tex.height);
      // Slight size variation along the row
      const vary = 0.85 + (i % 3) * 0.1;
      sprite.scale.set(scale * vary);
      sprite.position.set(xs[i]!, plantY);
      layer.addChild(sprite);
    }
  }

  function rebuild(w: number, h: number): void {
    container.removeChildren();
    screenW = w;

    const sky = new Graphics();
    sky.rect(0, 0, w, h).fill({ color: VIEW_CONFIG.BACKGROUND });
    container.addChild(sky);

    farLayer = new Graphics();
    fillStarDust(farLayer, 40, w, h, { top: 0.02, span: 0.5 }, 1, false);
    container.addChild(farLayer);

    midLayer = new Graphics();
    fillStarDust(midLayer, 48, w, h, { top: 0.04, span: 0.48 }, 2, true);
    container.addChild(midLayer);

    nearLayer = new Graphics();
    fillStarDust(nearLayer, 36, w, h, { top: 0.06, span: 0.44 }, 3, true);
    container.addChild(nearLayer);

    clouds = new Container();
    placeCloudSprites(clouds, w, h);
    container.addChild(clouds);

    // Screen-fixed ground strip.
    const groundH = Math.max(18, h * VIEW_CONFIG.GROUND_HEIGHT_RATIO);
    const ground = new Graphics();
    ground.rect(0, h - groundH, w, groundH).fill({
      color: VIEW_CONFIG.GROUND_COLOR,
      alpha: 0.1,
    });
    const lip = VIEW_CONFIG.GROUND_LIP_PX;
    ground.rect(0, h - groundH, w, lip).fill({
      color: VIEW_CONFIG.GROUND_LIP_COLOR,
      alpha: 0.1,
    });
    container.addChild(ground);

    // Trees sit on the ground; scroll horizontally with climb.
    trees = new Container();
    placeTreeSprites(trees, w, h);
    container.addChild(trees);

    lastW = w;
    lastH = h;
    applyPositions();
  }

  function wrapX(phase: number): number {
    const w = screenW > 0 ? screenW : 1;
    const u = phase - Math.floor(phase);
    return -u * w;
  }

  function applyPositions(): void {
    if (farLayer) {
      farLayer.position.set(
        wrapX(farPhase),
        Math.sin((bobMs * 2 * Math.PI) / 28_000) * 3,
      );
    }
    if (midLayer) {
      midLayer.position.set(
        wrapX(midPhase),
        Math.sin((bobMs * 2 * Math.PI) / 18_000) * 4,
      );
    }
    if (nearLayer) {
      nearLayer.position.set(
        wrapX(nearPhase),
        Math.sin((bobMs * 2 * Math.PI) / 12_000) * 5,
      );
    }
    if (clouds) {
      clouds.position.set(
        wrapX(cloudPhase),
        Math.sin((bobMs * 2 * Math.PI) / 9_000) * 5,
      );
    }
    if (trees) {
      // Horizontal scroll only — keep planted on the ground strip.
      trees.position.set(wrapX(treePhase), 0);
    }
  }

  rebuild(width, height);

  return {
    container,
    rebuildIfNeeded(nextW: number, nextH: number): void {
      if (nextW !== lastW || nextH !== lastH) {
        rebuild(nextW, nextH);
      }
    },
    tick(deltaMS: number, scrolling = false, speed01 = 0): void {
      if (!scrolling) {
        applyPositions();
        return;
      }

      const dt = Number.isFinite(deltaMS) ? Math.max(0, deltaMS) : 0;
      bobMs += dt;
      // Rate multiplies smoothly — never remaps wrap period (avoids ~12–13× hitch).
      const rate =
        1 +
        (VIEW_CONFIG.PARALLAX_SPEED_BOOST - 1) * clamp01(speed01);

      farPhase += (dt / VIEW_CONFIG.PARALLAX_FAR_PERIOD_MS) * rate;
      midPhase += (dt / VIEW_CONFIG.PARALLAX_MID_PERIOD_MS) * rate;
      nearPhase += (dt / VIEW_CONFIG.PARALLAX_NEAR_PERIOD_MS) * rate;
      cloudPhase += (dt / 28_000) * rate;
      // Trees scroll a bit faster than clouds (near-ground parallax).
      treePhase += (dt / 18_000) * rate;

      applyPositions();
    },
  };
}

/** Load cloud + tree textures for Backdrop (call once before createCrashScene). */
export async function loadBackdropTextures(): Promise<{
  cloudTextures: Texture[];
  treeTextures: Texture[];
}> {
  const urls = [...CLOUD_ASSET_URLS, ...TREE_ASSET_URLS];
  const textures = await Assets.load(urls);
  const pick = (list: readonly string[]): Texture[] =>
    list.map((url) => {
      const t = textures[url];
      return t instanceof Texture ? t : Texture.EMPTY;
    });
  return {
    cloudTextures: pick(CLOUD_ASSET_URLS),
    treeTextures: pick(TREE_ASSET_URLS),
  };
}

/** @deprecated Prefer loadBackdropTextures — kept for call-site clarity. */
export async function loadCloudTextures(): Promise<Texture[]> {
  const { cloudTextures } = await loadBackdropTextures();
  return cloudTextures;
}
