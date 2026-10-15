/**
 * boot only URL seed parser
 * seed is an opaque string  never Number()/parseInt
 */
export const DEFAULT_DEMO_SEED = "portfolio-demo";

export function parseBootSeed(
  search: string,
  fallback = DEFAULT_DEMO_SEED,
): { seed: string; fromQuery: boolean; invalid: boolean } {
  const raw = new URLSearchParams(
    search.startsWith("?") ? search : `?${search}`,
  ).get("seed");
  if (raw == null || raw === "") {
    return { seed: fallback, fromQuery: false, invalid: false };
  }
  const trimmed = raw.trim();
  const invalid =
    trimmed.length === 0 ||
    trimmed.length > 128 ||
    /[\u0000-\u001F\u007F]/.test(trimmed);
  if (invalid) return { seed: fallback, fromQuery: true, invalid: true };
  return { seed: trimmed, fromQuery: true, invalid: false };
}
