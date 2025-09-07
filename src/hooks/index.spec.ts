import { describe, it, expect } from "vitest";
import * as hooks from "./index";

describe("hooks/index", () => {
  it("exports useEnterKey function", () => {
    expect(typeof hooks.useEnterKey).toBe("function");
  });

  it("exports useEscapeKey function", () => {
    expect(typeof hooks.useEscapeKey).toBe("function");
  });

  it("exports useEventListener function", () => {
    expect(typeof hooks.useEventListener).toBe("function");
  });

  it("exports useFocus function", () => {
    expect(typeof hooks.useFocus).toBe("function");
  });

  it("exports useHover function", () => {
    expect(typeof hooks.useHover).toBe("function");
  });

  it("exports useKey function", () => {
    expect(typeof hooks.useKey).toBe("function");
  });

  it("exports usePromise function", () => {
    expect(typeof hooks.usePromise).toBe("function");
  });

  it("exports useStore function", () => {
    expect(typeof hooks.useStore).toBe("function");
  });

  it("exports useGlobalKeyboard function", () => {
    expect(typeof hooks.useGlobalKeyboard).toBe("function");
  });

  it("exports all expected hook functions", () => {
    const expectedExports = [
      "useEnterKey",
      "useEscapeKey",
      "useEventListener",
      "useFocus",
      "useHover",
      "useKey",
      "usePromise",
      "useStore",
      "useGlobalKeyboard"
    ];
    const actualExports = Object.keys(hooks);

    expect(actualExports).toEqual(expect.arrayContaining(expectedExports));
  });
});