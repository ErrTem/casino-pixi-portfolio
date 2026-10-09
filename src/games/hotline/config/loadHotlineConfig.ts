import raw from "./hotline.config.json" with { type: "json" };
import { HotlineConfigSchema, type HotlineConfig } from "./HotlineConfigSchema.js";

// parse throws on bad config, no soft fallback
export function loadHotlineConfig(): HotlineConfig {
  return HotlineConfigSchema.parse(raw);
}
