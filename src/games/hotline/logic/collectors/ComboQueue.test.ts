import { describe, expect, it } from "vitest";
import { createComboQueue, orderComboQueue } from "./ComboQueue.js";

describe("orderComboQueue", () => {
  it("orders fired colors green then red then purple", () => {
    expect(orderComboQueue(["purple", "green", "red"])).toEqual([
      "green",
      "red",
      "purple",
    ]);
    expect(orderComboQueue(new Set(["purple", "red"]))).toEqual(["red", "purple"]);
    expect(orderComboQueue(["purple", "green"])).toEqual(["green", "purple"]);
    expect(orderComboQueue([])).toEqual([]);
  });
});

describe("createComboQueue", () => {
  it("pop drain preserves green red purple order", () => {
    const q = createComboQueue(["purple", "green"]);
    expect(q.list()).toEqual(["green", "purple"]);
    expect(q.peek()).toBe("green");
    expect(q.pop()).toBe("green");
    expect(q.pop()).toBe("purple");
    expect(q.pop()).toBeUndefined();
  });

  it("set reorders to green red purple before drain", () => {
    const q = createComboQueue();
    q.set(["purple", "red", "green"]);
    expect([q.pop(), q.pop(), q.pop()]).toEqual(["green", "red", "purple"]);
  });
});
