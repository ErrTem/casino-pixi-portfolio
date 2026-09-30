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

type ScrollNode = {
  node: Container;
  /** Resting Y (bob is applied on top). */
  baseY: number;
  /** Half-width used so wrap happens after the sprite fully leaves the screen. */
  wrapPad: number;
};

function clamp01(t: number): number {
  if (!Number.isFinite(t)) return 0;
  return Math.min(1, Math.max(0, t));
}

/** Create individual star/dust Graphics — each wraps independently (never rebuilt on tick). */
function spawnStarDust(
  layer: Container,
  count: number,
  w: number,
  h: number,
  yBand: { top: number; span: number },
  seed: number,
  dustish: boolean,
): ScrollNode[] {
  const nodes: ScrollNode[] = [];
  for (let i = 0; i < count; i++) {
    const u = ((i * 47 + seed * 13) % 97) / 97;
    const v = ((i * 31 + seed * 17 + 13) % 89) / 89;
    const x = u * w;
    const y = h * (yBand.top + v * yBand.span);
    const g = new Graphics();
    let pad = 2;
    if (dustish && i % 4 === 0) {
      const rx = 1.2 + (i % 3) * 0.8;
      const ry = 0.5 + (i % 2) * 0.35;
      g.ellipse(0, 0, rx, ry).fill({
        color: 0xc8c4ff,
        alpha: 0.1 + (i % 5) * 0.03,
      });
      pad = rx;
    } else {
      const r = 0.55 + (i % 3) * 0.35;
      g.circle(0, 0, r).fill({
        color: 0xffffff,
        alpha: 0.16 + (i % 5) * 0.05,
      });
      pad = r;
    }
    g.position.set(x, y);
    layer.addChild(g);
    nodes.push({ node: g, baseY: y, wrapPad: pad });
  }
  return nodes;
}

/** Shift nodes left; when fully off-screen, wrap to the right — seamless infinite scroll. */
function scrollWrapX(nodes: readonly ScrollNode[], dx: number, screenW: number): void {
  const span = screenW > 0 ? screenW : 1;
  for (const item of nodes) {
    item.node.x -= dx;
    if (item.node.x < -item.wrapPad) {
      item.node.x += span + item.wrapPad * 2;
    }
  }
}

function applyBobY(nodes: readonly ScrollNode[], bobY: number): void {
  for (const item of nodes) {
    item.node.y = item.baseY + bobY;
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
 * Each sprite/star scrolls and wraps individually (infinite) — no layer recreate on tick.
 */
export function createBackdrop(
  width: number,
  height: number,
  options: BackdropOptions = {},
): Backdrop {
  const container = new Container();
  let lastW = -1;
  let lastH = -1;
  let bobMs = 0;
  let screenW = width;

  let farStars: ScrollNode[] = [];
  let midStars: ScrollNode[] = [];
  let nearStars: ScrollNode[] = [];
  let cloudNodes: ScrollNode[] = [];
  let treeNodes: ScrollNode[] = [];

  const cloudTextures = (options.cloudTextures ?? []).filter(
    (t) => t && t !== Texture.EMPTY,
  );
  const treeTextures = (options.treeTextures ?? []).filter(
    (t) => t && t !== Texture.EMPTY,
  );

  function placeCloudSprites(layer: Container, w: number, h: number): ScrollNode[] {
    const placed: ScrollNode[] = [];
    if (cloudTextures.length === 0) return placed;

    const groundH = Math.max(18, h * VIEW_CONFIG.GROUND_HEIGHT_RATIO);
    const clearance = 10;
    const specs = [
      { cx: w * 0.18, cy: h * 0.72, width: w * 0.224 },
      { cx: w * 0.48, cy: h * 0.76, width: w * 0.272 },
      { cx: w * 0.78, cy: h * 0.7, width: w * 0.208 },
      { cx: w * 0.62, cy: h * 0.78, width: w * 0.24 },
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
      const halfH = (tex.height * scale) / 2;
      const halfW = (tex.width * scale) / 2;
      const maxCy = h - groundH - clearance - halfH;
      const cy = Math.min(spec.cy, maxCy);
      sprite.position.set(spec.cx, cy);
      layer.addChild(sprite);
      placed.push({ node: sprite, baseY: cy, wrapPad: halfW });
    }
    return placed;
  }

  function placeTreeSprites(layer: Container, w: number, h: number): ScrollNode[] {
    const placed: ScrollNode[] = [];
    if (treeTextures.length === 0) return placed;

    const mobile = w <= VIEW_CONFIG.TREE_MOBILE_MAX_W;
    const groundH = Math.max(18, h * VIEW_CONFIG.GROUND_HEIGHT_RATIO);
    const groundTop = h - groundH;
    const plantY = groundTop + groundH * 0.35;
    const heightRatio = mobile
      ? VIEW_CONFIG.TREE_HEIGHT_RATIO_MOBILE
      : VIEW_CONFIG.TREE_HEIGHT_RATIO;
    const targetH = Math.max(22, h * heightRatio);

    const fracXs = mobile
      ? [0.15, 0.5, 0.82]
      : [0.08, 0.22, 0.38, 0.55, 0.7, 0.88];

    for (let i = 0; i < fracXs.length; i++) {
      const tex = treeTextures[i % treeTextures.length]!;
      const sprite = new Sprite(tex);
      sprite.anchor.set(0.5, 1);
      sprite.tint = VIEW_CONFIG.TREE_TINT;
      sprite.alpha = VIEW_CONFIG.TREE_ALPHA;
      const scale = targetH / Math.max(1, tex.height);
      const vary = 0.85 + (i % 3) * 0.1;
      const s = scale * vary;
      sprite.scale.set(s);
      const halfW = (tex.width * s) / 2;
      const x = w * fracXs[i]!;
      sprite.position.set(x, plantY);
      layer.addChild(sprite);
      placed.push({ node: sprite, baseY: plantY, wrapPad: halfW });
    }
    return placed;
  }

  function rebuild(w: number, h: number): void {
    container.removeChildren();
    screenW = w;

    const sky = new Graphics();
    sky.rect(0, 0, w, h).fill({ color: VIEW_CONFIG.BACKGROUND });
    container.addChild(sky);

    const farLayer = new Container();
    farStars = spawnStarDust(farLayer, 40, w, h, { top: 0.02, span: 0.5 }, 1, false);
    container.addChild(farLayer);

    const midLayer = new Container();
    midStars = spawnStarDust(midLayer, 48, w, h, { top: 0.04, span: 0.48 }, 2, true);
    container.addChild(midLayer);

    const nearLayer = new Container();
    nearStars = spawnStarDust(nearLayer, 36, w, h, { top: 0.06, span: 0.44 }, 3, true);
    container.addChild(nearLayer);

    const clouds = new Container();
    cloudNodes = placeCloudSprites(clouds, w, h);
    container.addChild(clouds);

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

    const trees = new Container();
    treeNodes = placeTreeSprites(trees, w, h);
    container.addChild(trees);

    lastW = w;
    lastH = h;
    applyBob();
  }

  function applyBob(): void {
    applyBobY(farStars, Math.sin((bobMs * 2 * Math.PI) / 28_000) * 3);
    applyBobY(midStars, Math.sin((bobMs * 2 * Math.PI) / 18_000) * 4);
    applyBobY(nearStars, Math.sin((bobMs * 2 * Math.PI) / 12_000) * 5);
    applyBobY(cloudNodes, Math.sin((bobMs * 2 * Math.PI) / 9_000) * 5);
    // Trees stay planted — no vertical bob.
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
        applyBob();
        return;
      }

      const dt = Number.isFinite(deltaMS) ? Math.max(0, deltaMS) : 0;
      bobMs += dt;
      const rate =
        1 +
        (VIEW_CONFIG.PARALLAX_SPEED_BOOST - 1) * clamp01(speed01);
      const w = screenW > 0 ? screenW : 1;

      // px/frame from the old phase→wrapX model: (dt/period)*rate*w
      scrollWrapX(
        farStars,
        (dt / VIEW_CONFIG.PARALLAX_FAR_PERIOD_MS) * rate * w,
        w,
      );
      scrollWrapX(
        midStars,
        (dt / VIEW_CONFIG.PARALLAX_MID_PERIOD_MS) * rate * w,
        w,
      );
      scrollWrapX(
        nearStars,
        (dt / VIEW_CONFIG.PARALLAX_NEAR_PERIOD_MS) * rate * w,
        w,
      );
      scrollWrapX(cloudNodes, (dt / 28_000) * rate * w, w);
      scrollWrapX(treeNodes, (dt / 18_000) * rate * w, w);

      applyBob();
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
