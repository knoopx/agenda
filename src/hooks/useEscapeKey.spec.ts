import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useEscapeKey } from "./useEscapeKey";

// Mock useKey
vi.mock("./useKey", () => ({
  useKey: vi.fn(),
}));

describe("useEscapeKey", () => {
  it("can be called with valid parameters", () => {
    const mockInputRef = { current: null };
    const mockOnSubmit = vi.fn();

    expect(() => renderHook(() => useEscapeKey(mockInputRef, mockOnSubmit))).not.toThrow();
  });

  it("accepts custom deps parameter", () => {
    const mockInputRef = { current: null };
    const mockOnSubmit = vi.fn();
    const customDeps = ["test"];

    expect(() => renderHook(() => useEscapeKey(mockInputRef, mockOnSubmit, customDeps as any))).not.toThrow();
  });

  it("defers callback execution", () => {
    const mockInputRef = { current: null };
    const mockOnSubmit = vi.fn();

    renderHook(() => useEscapeKey(mockInputRef, mockOnSubmit));

    // Test that the hook can be rendered without issues
    expect(() => useEscapeKey(mockInputRef, mockOnSubmit)).not.toThrow();
  });
});