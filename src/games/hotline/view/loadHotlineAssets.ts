import { Assets, Texture } from "pixi.js";
import retroFontUrl from "../../../shared/fonts/retrocomputerrusbydaymarius.ttf?url";

const BASE = "/assets/hotline";

export const HOTLINE_FONT_FAMILY = "Retro Computer";

export const BACKDROP_URL = `${BASE}/backdrop-rooftop.png`;
export const FRAME_URL = `${BASE}/frame-crt.png`;

export const PHONE_URLS = {
  green: `${BASE}/phone-green.png`,
  red: `${BASE}/phone-red.png`,
  purple: `${BASE}/phone-purple.png`,
} as const;

/** symbol id from hotline.config.json to its png */
export const SYMBOL_URLS: Readonly<Record<string, string>> = {
  mask: `${BASE}/sym-wild-mask.png`,
  pistol: `${BASE}/sym-hi-pistol.png`,
  cassette: `${BASE}/sym-hi-cassette.png`,
  car: `${BASE}/sym-hi-car.png`,
  ace: `${BASE}/sym-lo-ace.png`,
  king: `${BASE}/sym-lo-king.png`,
  queen: `${BASE}/sym-lo-queen.png`,
  jack: `${BASE}/sym-lo-jack.png`,
  ten: `${BASE}/sym-lo-ten.png`,
};

/** every png the base game needs, all of them are required */
export const HOTLINE_ASSET_URLS: readonly string[] = [
  BACKDROP_URL,
  FRAME_URL,
  PHONE_URLS.green,
  PHONE_URLS.red,
  PHONE_URLS.purple,
  ...Object.values(SYMBOL_URLS),
];

export interface HotlineTextures {
  backdrop: Texture;
  frame: Texture;
  phones: { green: Texture; red: Texture; purple: Texture };
  /** keyed by config symbol id */
  symbols: Record<string, Texture>;
  /** family registered for Pixi Text, ready to use */
  fontFamily: string;
}

function required(
  loaded: Record<string, unknown>,
  url: string,
): Texture {
  const tex = loaded[url];
  if (!(tex instanceof Texture) || tex === Texture.EMPTY || tex.width <= 1) {
    throw new Error(`hotline assets: missing or empty texture ${url}`);
  }
  return tex;
}

/** loads every hotline png and the title font, throws if any of it is missing */
export async function loadHotlineAssets(): Promise<HotlineTextures> {
  let loaded: Record<string, unknown>;
  try {
    loaded = (await Assets.load([...HOTLINE_ASSET_URLS])) as Record<
      string,
      unknown
    >;
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new Error(`hotline assets: load failed, ${reason}`);
  }

  try {
    await Assets.load({
      alias: "hotline-title-font",
      src: retroFontUrl,
      parser: "web-font",
      data: { family: HOTLINE_FONT_FAMILY },
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new Error(`hotline assets: title font failed, ${reason}`);
  }

  const symbols: Record<string, Texture> = {};
  for (const [id, url] of Object.entries(SYMBOL_URLS)) {
    symbols[id] = required(loaded, url);
  }

  return {
    backdrop: required(loaded, BACKDROP_URL),
    frame: required(loaded, FRAME_URL),
    phones: {
      green: required(loaded, PHONE_URLS.green),
      red: required(loaded, PHONE_URLS.red),
      purple: required(loaded, PHONE_URLS.purple),
    },
    symbols,
    fontFamily: HOTLINE_FONT_FAMILY,
  };
}
