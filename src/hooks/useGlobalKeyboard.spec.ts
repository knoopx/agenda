import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useGlobalKeyboard } from "./useGlobalKeyboard";

// Mock the store for hook testing
const mockStore = {
  mainInputRef: null as HTMLInputElement | null,
  selectedTaskIndex: -1,
  editingTask: null as any,
  focusMainInput: vi.fn(),
  navigateUp: vi.fn(),
  navigateDown: vi.fn(),
  editSelectedTask: vi.fn(),
  completeSelectedTask: vi.fn(),
};

vi.mock("./useStore", () => ({
  useStore: () => mockStore,
}));

describe("useGlobalKeyboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.selectedTaskIndex = -1;
    mockStore.mainInputRef = null;
    mockStore.editingTask = null;
  });

  afterEach(() => {
    // Clean up any event listeners
    document.removeEventListener("keydown", vi.fn());
  });

  describe("Event Listener Setup", () => {
    it("adds keydown event listener on mount", () => {
      const addEventListenerSpy = vi.spyOn(document, "addEventListener");

      renderHook(() => useGlobalKeyboard());

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "keydown",
        expect.any(Function),
      );
    });

    it("removes keydown event listener on unmount", () => {
      const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");

      const { unmount } = renderHook(() => useGlobalKeyboard());
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "keydown",
        expect.any(Function),
      );
    });
  });

  describe("Input Focus Guard", () => {
    it("processes keyboard events when focused on non-main input", () => {
      renderHook(() => useGlobalKeyboard());

      // Mock an input element that's not the main input
      const mockInput = document.createElement("input");
      Object.defineProperty(document, "activeElement", {
        get: () => mockInput,
        configurable: true,
      });

      const event = new KeyboardEvent("keydown", { key: "Escape" });
      document.dispatchEvent(event);

      expect(mockStore.focusMainInput).toHaveBeenCalled();
    });

    it("ignores keyboard events when focused on main input", () => {
      const mockMainInput = document.createElement("input");
      mockStore.mainInputRef = mockMainInput;

      renderHook(() => useGlobalKeyboard());

      Object.defineProperty(document, "activeElement", {
        get: () => mockMainInput,
        configurable: true,
      });

      const event = new KeyboardEvent("keydown", { key: "Escape" });
      document.dispatchEvent(event);

      expect(mockStore.focusMainInput).not.toHaveBeenCalled();
    });

    it("processes keyboard events when not focused on any input", () => {
      renderHook(() => useGlobalKeyboard());

      Object.defineProperty(document, "activeElement", {
        get: () => document.body,
        configurable: true,
      });

      const event = new KeyboardEvent("keydown", { key: "Escape" });
      document.dispatchEvent(event);

      expect(mockStore.focusMainInput).toHaveBeenCalled();
    });
  });

  describe("Escape Key", () => {
    it("calls focusMainInput on Escape key when not editing a task", () => {
      mockStore.editingTask = null;
      renderHook(() => useGlobalKeyboard());

      const event = new KeyboardEvent("keydown", { key: "Escape" });
      Object.defineProperty(event, "preventDefault", {
        value: vi.fn(),
        writable: true,
      });

      document.dispatchEvent(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockStore.focusMainInput).toHaveBeenCalledTimes(1);
    });

    it("does not call focusMainInput on Escape key when editing a task", () => {
      mockStore.editingTask = { id: "1" }; // Simulate editing a task
      renderHook(() => useGlobalKeyboard());

      const event = new KeyboardEvent("keydown", { key: "Escape" });
      Object.defineProperty(event, "preventDefault", {
        value: vi.fn(),
        writable: true,
      });

      document.dispatchEvent(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockStore.focusMainInput).not.toHaveBeenCalled();
    });
  });

  describe("Arrow Key Navigation", () => {
    it("calls navigateUp on ArrowUp key", () => {
      renderHook(() => useGlobalKeyboard());

      const event = new KeyboardEvent("keydown", { key: "ArrowUp" });
      Object.defineProperty(event, "preventDefault", {
        value: vi.fn(),
        writable: true,
      });

      document.dispatchEvent(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockStore.navigateUp).toHaveBeenCalledTimes(1);
    });

    it("calls navigateDown on ArrowDown key", () => {
      renderHook(() => useGlobalKeyboard());

      const event = new KeyboardEvent("keydown", { key: "ArrowDown" });
      Object.defineProperty(event, "preventDefault", {
        value: vi.fn(),
        writable: true,
      });

      document.dispatchEvent(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockStore.navigateDown).toHaveBeenCalledTimes(1);
    });
  });

  describe("Enter Key", () => {
    it("calls editSelectedTask when task is selected and not editing", () => {
      mockStore.selectedTaskIndex = 0;
      mockStore.editingTask = null;
      renderHook(() => useGlobalKeyboard());

      const event = new KeyboardEvent("keydown", { key: "Enter" });
      Object.defineProperty(event, "preventDefault", {
        value: vi.fn(),
        writable: true,
      });

      document.dispatchEvent(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockStore.editSelectedTask).toHaveBeenCalledTimes(1);
    });

    it("does not call editSelectedTask when task is selected but already editing", () => {
      mockStore.selectedTaskIndex = 0;
      mockStore.editingTask = { id: "1" }; // Simulate editing a task
      renderHook(() => useGlobalKeyboard());

      const event = new KeyboardEvent("keydown", { key: "Enter" });
      Object.defineProperty(event, "preventDefault", {
        value: vi.fn(),
        writable: true,
      });

      document.dispatchEvent(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(mockStore.editSelectedTask).not.toHaveBeenCalled();
    });

    it("does not call editSelectedTask when no task is selected", () => {
      mockStore.selectedTaskIndex = -1;
      renderHook(() => useGlobalKeyboard());

      const event = new KeyboardEvent("keydown", { key: "Enter" });
      Object.defineProperty(event, "preventDefault", {
        value: vi.fn(),
        writable: true,
      });

      document.dispatchEvent(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(mockStore.editSelectedTask).not.toHaveBeenCalled();
    });
  });

  describe("Space Key", () => {
    it("calls completeSelectedTask when task is selected", () => {
      mockStore.selectedTaskIndex = 1;
      renderHook(() => useGlobalKeyboard());

      const event = new KeyboardEvent("keydown", { key: " " });
      Object.defineProperty(event, "preventDefault", {
        value: vi.fn(),
        writable: true,
      });

      document.dispatchEvent(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockStore.completeSelectedTask).toHaveBeenCalledTimes(1);
    });

    it("does not call completeSelectedTask when no task is selected", () => {
      mockStore.selectedTaskIndex = -1;
      renderHook(() => useGlobalKeyboard());

      const event = new KeyboardEvent("keydown", { key: " " });
      Object.defineProperty(event, "preventDefault", {
        value: vi.fn(),
        writable: true,
      });

      document.dispatchEvent(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(mockStore.completeSelectedTask).not.toHaveBeenCalled();
    });
  });

  describe("Other Keys", () => {
    it("ignores unhandled keys", () => {
      renderHook(() => useGlobalKeyboard());

      const event = new KeyboardEvent("keydown", { key: "a" });
      Object.defineProperty(event, "preventDefault", {
        value: vi.fn(),
        writable: true,
      });

      document.dispatchEvent(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(mockStore.focusMainInput).not.toHaveBeenCalled();
      expect(mockStore.navigateUp).not.toHaveBeenCalled();
      expect(mockStore.navigateDown).not.toHaveBeenCalled();
      expect(mockStore.editSelectedTask).not.toHaveBeenCalled();
      expect(mockStore.completeSelectedTask).not.toHaveBeenCalled();
    });
  });
});
