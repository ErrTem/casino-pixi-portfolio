import { expect, it } from "vitest";
import {
  MUTE_STORAGE_KEY,
  loadMutePref,
  saveMutePref,
  type MuteStore,
} from "./mutePref.js";

function memoryStore(initial: Record<string, string> = {}): MuteStore {
  const map = new Map<string, string>(Object.entries(initial));
  return {
    getItem(key: string): string | null {
      return map.has(key) ? (map.get(key) as string) : null;
    },
    setItem(key: string, value: string): void {
      map.set(key, value);
    },
  };
}

it("save then load round-trips muted=true as crash-demo:mute=1", () => {
  const store = memoryStore();
  saveMutePref(true, store);
  expect(store.getItem(MUTE_STORAGE_KEY)).toBe("1");
  expect(loadMutePref(store)).toBe(true);
});

it("save then load round-trips muted=false as crash-demo:mute=0", () => {
  const store = memoryStore();
  saveMutePref(false, store);
  expect(store.getItem(MUTE_STORAGE_KEY)).toBe("0");
  expect(loadMutePref(store)).toBe(false);
});

it("loadMutePref defaults to unmuted when key missing", () => {
  expect(loadMutePref(memoryStore())).toBe(false);
});

it("last write wins when toggling mute then unmute", () => {
  const store = memoryStore();
  saveMutePref(true, store);
  saveMutePref(false, store);
  expect(store.getItem(MUTE_STORAGE_KEY)).toBe("0");
  expect(loadMutePref(store)).toBe(false);
});
