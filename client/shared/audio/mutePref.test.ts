import { expect, it } from "vitest";
import {
  LEGACY_MUTE_STORAGE_KEY,
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

it("MUTE_STORAGE_KEY is portfolio-demo:mute", () => {
  expect(MUTE_STORAGE_KEY).toBe("portfolio-demo:mute");
  expect(LEGACY_MUTE_STORAGE_KEY).toBe("crash-demo:mute");
});

it("save then load round-trips muted=true as portfolio-demo:mute=1", () => {
  const store = memoryStore();
  saveMutePref(true, store);
  expect(store.getItem(MUTE_STORAGE_KEY)).toBe("1");
  expect(loadMutePref(store)).toBe(true);
});

it("save then load round-trips muted=false as portfolio-demo:mute=0", () => {
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

it("migrates legacy muted=1 into portfolio-demo:mute", () => {
  const store = memoryStore({ [LEGACY_MUTE_STORAGE_KEY]: "1" });
  expect(loadMutePref(store)).toBe(true);
  expect(store.getItem(MUTE_STORAGE_KEY)).toBe("1");
  expect(store.getItem(LEGACY_MUTE_STORAGE_KEY)).toBe("1");
});

it("migrates legacy muted=0 into portfolio-demo:mute", () => {
  const store = memoryStore({ [LEGACY_MUTE_STORAGE_KEY]: "0" });
  expect(loadMutePref(store)).toBe(false);
  expect(store.getItem(MUTE_STORAGE_KEY)).toBe("0");
  expect(store.getItem(LEGACY_MUTE_STORAGE_KEY)).toBe("0");
});

it("new key wins when both keys exist", () => {
  const store = memoryStore({
    [MUTE_STORAGE_KEY]: "0",
    [LEGACY_MUTE_STORAGE_KEY]: "1",
  });
  expect(loadMutePref(store)).toBe(false);
  expect(store.getItem(MUTE_STORAGE_KEY)).toBe("0");
  expect(store.getItem(LEGACY_MUTE_STORAGE_KEY)).toBe("1");
});

it("malformed legacy value is ignored and new key stays absent", () => {
  const store = memoryStore({ [LEGACY_MUTE_STORAGE_KEY]: "yes" });
  expect(loadMutePref(store)).toBe(false);
  expect(store.getItem(MUTE_STORAGE_KEY)).toBeNull();
});

it("empty store returns false and writes nothing", () => {
  const store = memoryStore();
  expect(loadMutePref(store)).toBe(false);
  expect(store.getItem(MUTE_STORAGE_KEY)).toBeNull();
  expect(store.getItem(LEGACY_MUTE_STORAGE_KEY)).toBeNull();
});
