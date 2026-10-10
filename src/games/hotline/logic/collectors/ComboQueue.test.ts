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
});
