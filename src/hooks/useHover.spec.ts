import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useHover } from "./useHover";

describe("useHover", () => {
  let mockElement: HTMLElement;

  beforeEach(() => {
    mockElement = document.createElement("div");
    document.body.appendChild(mockElement);
  });

  afterEach(() => {
    document.body.removeChild(mockElement);
  });

  it("returns false initially", () => {
    const ref = { current: mockElement };
    const { result } = renderHook(() => useHover(ref));

    expect(result.current).toBe(false);
  });

  it("returns true on mouseover", () => {
    const ref = { current: mockElement };
    const { result } = renderHook(() => useHover(ref));

    act(() => {
      mockElement.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    });

    expect(result.current).toBe(true);
  });

  it("returns false on mouseout", () => {
    const ref = { current: mockElement };
    const { result } = renderHook(() => useHover(ref));

    act(() => {
      mockElement.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    });
    expect(result.current).toBe(true);

    act(() => {
      mockElement.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
    });
    expect(result.current).toBe(false);
  });

  it("handles mouse events correctly", () => {
    const ref = { current: mockElement };
    const { result } = renderHook(() => useHover(ref));

    // Test multiple mouseover/mouseout cycles
    act(() => {
      mockElement.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    });
    expect(result.current).toBe(true);

    act(() => {
      mockElement.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
    });
    expect(result.current).toBe(false);

    act(() => {
      mockElement.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    });
    expect(result.current).toBe(true);
  });
});
