export const MUTE_STORAGE_KEY = "crash-demo:mute";

export interface MuteStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** inmemory fallback when storage throws (private mode) */
const memoryFallback = new Map<string, string>();

function memoryStore(): MuteStore {
  return {
    getItem(key: string): string | null {
      return memoryFallback.has(key) ? (memoryFallback.get(key) as string) : null;
    },
    setItem(key: string, value: string): void {
      memoryFallback.set(key, value);
    },
  };
}

/**
 * resolve an injectable store
 * Prefer the caller provided store
 * otherwise try localStorage; on throw fall back to inmemory
 */
function resolveStore(store?: MuteStore): MuteStore {
  if (store) return store;
  try {
    // Prefer injectable store in tests; localStorage via globalThis
    const g = globalThis as { localStorage?: MuteStore };
    if (g.localStorage && typeof g.localStorage.getItem === "function") {
      g.localStorage.getItem(MUTE_STORAGE_KEY);
      return g.localStorage;
    }
  } catch {
  }
  return memoryStore();
}

/**
 * load mute preference. 1 = muted 0 = unmuted
 * missing key -> unmuted (false)
 */
export function loadMutePref(store?: MuteStore): boolean {
  try {
    const s = resolveStore(store);
    return s.getItem(MUTE_STORAGE_KEY) === "1";
  } catch {
    return memoryFallback.get(MUTE_STORAGE_KEY) === "1";
  }
}

/**
 * persist mute preference as "1"|"0" under crash-demo:mute
 * last write wins. Storage throw -> in-memory fallback
 */
export function saveMutePref(muted: boolean, store?: MuteStore): void {
  const value = muted ? "1" : "0";
  try {
    resolveStore(store).setItem(MUTE_STORAGE_KEY, value);
  } catch {
    memoryFallback.set(MUTE_STORAGE_KEY, value);
  }
}
