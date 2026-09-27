export const MUTE_STORAGE_KEY = "crash-demo:mute";

export interface MuteStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/**
 * Load mute preference. Values: "1" = muted, "0" = unmuted.
 * RED stub: always unmuted so round-trip tests fail until GREEN.
 */
export function loadMutePref(_store?: MuteStore): boolean {
  return false;
}

/**
 * Persist mute preference. RED stub: no-op so round-trip tests fail until GREEN.
 */
export function saveMutePref(_muted: boolean, _store?: MuteStore): void {
  // intentionally empty (RED)
}
