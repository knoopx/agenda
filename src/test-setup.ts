// Test setup file for Vitest
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock canvas getContext for text width calculations
const mockCanvasContext = {
  measureText: vi.fn((text: string) => ({ width: text.length * 8 })),
  font: "",
  fillStyle: "",
  strokeStyle: "",
};

const mockGetContext = vi.fn((contextType: string) => {
  if (contextType === "2d") {
    return mockCanvasContext;
  }
  return null;
});

Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
  writable: true,
  value: mockGetContext,
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});
