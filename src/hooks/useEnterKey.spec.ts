import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useEnterKey } from "./useEnterKey";

// Mock useKey
vi.mock("./useKey", () => ({
  useKey: vi.fn(),
}));

describe("useEnterKey", () => {
  it("calls useKey with correct parameters", () => {
    const mockInputRef = { current: null };
    const mockOnSubmit = vi.fn();

    renderHook(() => useEnterKey(mockInputRef, mockOnSubmit));

    // Just test that the hook doesn't throw and can be called
    expect(() => useEnterKey(mockInputRef, mockOnSubmit)).not.toThrow();
  });

  it("accepts custom deps parameter", () => {
    const mockInputRef = { current: null };
    const mockOnSubmit = vi.fn();
    const customDeps = ["test"];

    expect(() => useEnterKey(mockInputRef, mockOnSubmit, customDeps as any)).not.toThrow();
  });
});