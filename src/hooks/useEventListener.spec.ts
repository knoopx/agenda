import { describe, it, expect } from "vitest";
import { useEventListener } from "./useEventListener";

describe("useEventListener", () => {
  it("is a function", () => {
    expect(typeof useEventListener).toBe("function");
  });

  it("has correct function signature", () => {
    expect(useEventListener.length).toBe(3); // ref, eventName, listener (deps is optional)
  });

  it("can be imported", () => {
    expect(useEventListener).toBeDefined();
  });
});