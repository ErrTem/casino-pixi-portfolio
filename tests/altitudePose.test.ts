import { describe, expect, it } from "vitest";
import {
  computeAltitudePose,
  smoothstep,
} from "../src/games/crash/view/altitudePose.js";
import { VIEW_CONFIG } from "../src/games/crash/view/viewConfig.js";

describe("smoothstep", () => {
  it("is 0 below edge0 and 1 above edge1", () => {
    expect(smoothstep(1, 10, 1)).toBe(0);
    expect(smoothstep(1, 10, 10)).toBe(1);
    expect(smoothstep(1, 10, 0)).toBe(0);
    expect(smoothstep(1, 10, 20)).toBe(1);
  });

  it("is mid-valued inside the band", () => {
    const mid = smoothstep(1, 10, 5.5);
    expect(mid).toBeGreaterThan(0.4);
    expect(mid).toBeLessThan(0.6);
  });
});

describe("computeAltitudePose", () => {
  const H = 800;

  it("keeps earth planted and opaque at takeoff (×1)", () => {
    const pose = computeAltitudePose(1, H);
    expect(pose.earthY).toBe(0);
    expect(pose.earthAlpha).toBe(1);
    expect(pose.cloudY).toBe(0);
    expect(pose.spaceAlpha).toBeCloseTo(
      VIEW_CONFIG.ALTITUDE_SPACE_ALPHA_MIN,
      5,
    );
    expect(pose.spaceY).toBeLessThan(0);
  });

  it("slides earth off and fades it by earth-end (×10)", () => {
    const pose = computeAltitudePose(VIEW_CONFIG.ALTITUDE_EARTH_END_M, H);
    expect(pose.earthAlpha).toBe(0);
    expect(pose.earthY).toBeCloseTo(
      H * VIEW_CONFIG.ALTITUDE_EARTH_SLIDE_RATIO,
      5,
    );
    expect(pose.cloudY).toBe(0);
  });

  it("drifts clouds downward across the cloud band (×10 -> ×30)", () => {
    const atStart = computeAltitudePose(VIEW_CONFIG.ALTITUDE_EARTH_END_M, H);
    const atMid = computeAltitudePose(20, H);
    const atEnd = computeAltitudePose(VIEW_CONFIG.ALTITUDE_CLOUD_END_M, H);

    expect(atStart.cloudY).toBe(0);
    expect(atMid.cloudY).toBeGreaterThan(atStart.cloudY);
    expect(atMid.cloudY).toBeLessThan(atEnd.cloudY);
    expect(atEnd.cloudY).toBeCloseTo(
      H * VIEW_CONFIG.ALTITUDE_CLOUD_SCROLL_RATIO,
      5,
    );
  });

  it("settles and brightens space by cloud-end, full by space-full", () => {
    const takeoff = computeAltitudePose(1, H);
    const cloudEnd = computeAltitudePose(VIEW_CONFIG.ALTITUDE_CLOUD_END_M, H);
    const deep = computeAltitudePose(VIEW_CONFIG.ALTITUDE_SPACE_FULL_M, H);

    expect(cloudEnd.spaceY).toBeCloseTo(0, 10);
    expect(cloudEnd.spaceAlpha).toBeGreaterThan(takeoff.spaceAlpha);
    expect(cloudEnd.spaceAlpha).toBeCloseTo(
      VIEW_CONFIG.ALTITUDE_SPACE_ALPHA_MID,
      5,
    );
    expect(deep.spaceAlpha).toBe(1);
    expect(deep.cloudAlpha).toBeLessThan(1);
  });

  it("clamps non-finite / sub-1 multipliers to grounded pose", () => {
    const a = computeAltitudePose(Number.NaN, H);
    const b = computeAltitudePose(0.5, H);
    const grounded = computeAltitudePose(1, H);
    expect(a).toEqual(grounded);
    expect(b).toEqual(grounded);
  });
});
