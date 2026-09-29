import { describe, expect, it } from "vitest";
import { shouldAutoPlaceBet } from "./autoBet.js";

describe("shouldAutoPlaceBet (D-10..D-13 / UI-03)", () => {
  it("waiting-edge + flag + !hasBet + !broke → true", () => {
    expect(
      shouldAutoPlaceBet({
        autoBetOn: true,
        prevAutoBetOn: true,
        phase: "waiting",
        prevPhase: "flying",
        hasBet: false,
        broke: false,
      }),
    ).toBe(true);
  });

  it("entered waiting from null prevPhase → true", () => {
    expect(
      shouldAutoPlaceBet({
        autoBetOn: true,
        prevAutoBetOn: true,
        phase: "waiting",
        prevPhase: null,
        hasBet: false,
        broke: false,
      }),
    ).toBe(true);
  });

  it("already waiting (prevPhase waiting) without toggle edge → false", () => {
    expect(
      shouldAutoPlaceBet({
        autoBetOn: true,
        prevAutoBetOn: true,
        phase: "waiting",
        prevPhase: "waiting",
        hasBet: false,
        broke: false,
      }),
    ).toBe(false);
  });

  it("hasBet → false even on waiting edge", () => {
    expect(
      shouldAutoPlaceBet({
        autoBetOn: true,
        prevAutoBetOn: true,
        phase: "waiting",
        prevPhase: "flying",
        hasBet: true,
        broke: false,
      }),
    ).toBe(false);
  });

  it("broke → false", () => {
    expect(
      shouldAutoPlaceBet({
        autoBetOn: true,
        prevAutoBetOn: true,
        phase: "waiting",
        prevPhase: "flying",
        hasBet: false,
        broke: true,
      }),
    ).toBe(false);
  });

  it("flag off → false", () => {
    expect(
      shouldAutoPlaceBet({
        autoBetOn: false,
        prevAutoBetOn: false,
        phase: "waiting",
        prevPhase: "flying",
        hasBet: false,
        broke: false,
      }),
    ).toBe(false);
  });

  it("non-waiting phase → false", () => {
    expect(
      shouldAutoPlaceBet({
        autoBetOn: true,
        prevAutoBetOn: true,
        phase: "flying",
        prevPhase: "waiting",
        hasBet: false,
        broke: false,
      }),
    ).toBe(false);
  });

  it("mid-wait toggle ON with no bet → true once (synthetic edge)", () => {
    expect(
      shouldAutoPlaceBet({
        autoBetOn: true,
        prevAutoBetOn: false,
        phase: "waiting",
        prevPhase: "waiting",
        hasBet: false,
        broke: false,
      }),
    ).toBe(true);
  });

  it("mid-wait toggle ON but hasBet → false", () => {
    expect(
      shouldAutoPlaceBet({
        autoBetOn: true,
        prevAutoBetOn: false,
        phase: "waiting",
        prevPhase: "waiting",
        hasBet: true,
        broke: false,
      }),
    ).toBe(false);
  });
});
