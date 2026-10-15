import { describe, expect, it } from "vitest";
import { createPhoneMeters } from "./PhoneMeters.js";

describe("createPhoneMeters", () => {
  it("soft caps display at meterTarget while counts may exceed", () => {
    const meters = createPhoneMeters(3);
    meters.increment("green");
    meters.increment("green");
    meters.increment("green");
    meters.increment("green");
    expect(meters.getCount("green")).toBe(4);
    expect(meters.getDisplay("green")).toBe(3);
  });

  it("reset clears one phone only", () => {
    const meters = createPhoneMeters(6);
    meters.increment("green");
    meters.increment("red");
    meters.increment("purple");
    meters.reset("red");
    expect(meters.getCount("green")).toBe(1);
    expect(meters.getCount("red")).toBe(0);
    expect(meters.getCount("purple")).toBe(1);
  });
});
