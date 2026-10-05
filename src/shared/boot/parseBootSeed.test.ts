import { expect, it } from "vitest";
import { DEFAULT_DEMO_SEED, parseBootSeed } from "./parseBootSeed.js";

it("exports DEFAULT_DEMO_SEED as portfolio-demo", () => {
  expect(DEFAULT_DEMO_SEED).toBe("portfolio-demo");
});

it("missing seed param falls back with fromQuery false", () => {
  expect(parseBootSeed("")).toEqual({
    seed: "portfolio-demo",
    fromQuery: false,
    invalid: false,
  });
  expect(parseBootSeed("?other=1")).toEqual({
    seed: "portfolio-demo",
    fromQuery: false,
    invalid: false,
  });
});

it("empty seed falls back with fromQuery false", () => {
  expect(parseBootSeed("?seed=")).toEqual({
    seed: "portfolio-demo",
    fromQuery: false,
    invalid: false,
  });
});

it("whitespace-only seed falls back as invalid", () => {
  expect(parseBootSeed("?seed=%20%20")).toEqual({
    seed: "portfolio-demo",
    fromQuery: true,
    invalid: true,
  });
});

it("control chars set invalid true and use fallback", () => {
  expect(parseBootSeed("?seed=bad%00seed")).toEqual({
    seed: "portfolio-demo",
    fromQuery: true,
    invalid: true,
  });
});

it("length over 128 sets invalid true and uses fallback", () => {
  const long = "a".repeat(129);
  expect(parseBootSeed(`?seed=${long}`)).toEqual({
    seed: "portfolio-demo",
    fromQuery: true,
    invalid: true,
  });
});

it("valid non-empty trimmed seed is returned unchanged (opaque string)", () => {
  expect(parseBootSeed("?seed=demo-a")).toEqual({
    seed: "demo-a",
    fromQuery: true,
    invalid: false,
  });
  // Opaque - numeric-looking seeds stay strings, never Number()/parseInt
  expect(parseBootSeed("?seed=42")).toEqual({
    seed: "42",
    fromQuery: true,
    invalid: false,
  });
});

it("accepts custom fallback when provided", () => {
  expect(parseBootSeed("", "custom-fallback")).toEqual({
    seed: "custom-fallback",
    fromQuery: false,
    invalid: false,
  });
});
