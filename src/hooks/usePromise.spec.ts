import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { usePromise } from "./usePromise";

describe("usePromise", () => {
  it("returns initial state as null values", () => {
    const promise = new Promise(() => {}); // Never resolves
    const { result } = renderHook(() => usePromise(promise));

    expect(result.current).toEqual([null, null]);
  });

  it("returns resolved value", async () => {
    const testValue = "test result";
    const promise = Promise.resolve(testValue);
    const { result } = renderHook(() => usePromise(promise));

    await waitFor(() => {
      expect(result.current[0]).toBe(testValue);
    });
    expect(result.current[1]).toBe(null);
  });

  it("returns error on rejection", async () => {
    const testError = new Error("test error");
    const promise = Promise.reject(testError);
    const { result } = renderHook(() => usePromise(promise));

    await waitFor(() => {
      expect(result.current[1]).toBe(testError);
    });
    expect(result.current[0]).toBe(null);
  });

  it("handles different promise types", async () => {
    // Test with number
    const numberPromise = Promise.resolve(42);
    const { result: numberResult } = renderHook(() =>
      usePromise(numberPromise),
    );

    await waitFor(() => {
      expect(numberResult.current[0]).toBe(42);
    });

    // Test with object
    const objectPromise = Promise.resolve({ key: "value" });
    const { result: objectResult } = renderHook(() =>
      usePromise(objectPromise),
    );

    await waitFor(() => {
      expect(objectResult.current[0]).toEqual({ key: "value" });
    });
  });

  it("handles promise that resolves to undefined", async () => {
    const promise = Promise.resolve(undefined);
    const { result } = renderHook(() => usePromise(promise));

    await waitFor(() => {
      expect(result.current[0]).toBe(undefined);
    });
    expect(result.current[1]).toBe(null);
  });
});
