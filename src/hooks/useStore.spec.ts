import { describe, it, expect } from "vitest";
import { useStore } from "./useStore";

describe("useStore", () => {
  it("is a function", () => {
    expect(typeof useStore).toBe("function");
  });

  it("has correct function signature", () => {
    expect(useStore.length).toBe(0); // no parameters
  });

  it("can be imported", () => {
    expect(useStore).toBeDefined();
  });
});