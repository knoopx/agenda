import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useKey } from "./useKey";

// Mock useEventListener
vi.mock("./useEventListener", () => ({
  useEventListener: vi.fn(),
}));

describe("useKey", () => {
  it("can be called with string key", () => {
    const mockRef = { current: null };
    const mockCallback = vi.fn();

    expect(() => renderHook(() => useKey(mockRef, "Enter", mockCallback))).not.toThrow();
  });

  it("can be called with number key", () => {
    const mockRef = { current: null };
    const mockCallback = vi.fn();

    expect(() => renderHook(() => useKey(mockRef, 13, mockCallback))).not.toThrow();
  });

  it("can be called with array of keys", () => {
    const mockRef = { current: null };
    const mockCallback = vi.fn();

    expect(() => renderHook(() => useKey(mockRef, ["Enter", "Space"], mockCallback))).not.toThrow();
  });

  it("accepts custom deps parameter", () => {
    const mockRef = { current: null };
    const mockCallback = vi.fn();
    const customDeps = ["test"];

    expect(() => renderHook(() => useKey(mockRef, "Enter", mockCallback, customDeps))).not.toThrow();
  });

  it("handles callback that returns false", () => {
    const mockRef = { current: null };
    const mockCallback = vi.fn(() => false);

    expect(() => renderHook(() => useKey(mockRef, "Enter", mockCallback))).not.toThrow();
  });
});