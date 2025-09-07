import { describe, it, expect } from "vitest";
import * as helpers from "./index";

describe("helpers/index", () => {
  it("exports now function", () => {
    expect(typeof helpers.now).toBe("function");
  });

  it("exports toDistanceExpr function", () => {
    expect(typeof helpers.toDistanceExpr).toBe("function");
  });

  it("exports emojiFromKeyword function", () => {
    expect(typeof helpers.emojiFromKeyword).toBe("function");
  });

  it("exports formatDuration function", () => {
    expect(typeof helpers.formatDuration).toBe("function");
  });

  it("exports all expected functions", () => {
    const expectedExports = ["now", "toDistanceExpr", "emojiFromKeyword", "formatDuration"];
    const actualExports = Object.keys(helpers);

    expect(actualExports).toEqual(expect.arrayContaining(expectedExports));
  });
});