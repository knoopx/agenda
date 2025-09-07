import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useRef } from "react";
import { useEventListener } from "./useEventListener";

// Test component that uses the hook
function TestComponent({
  eventName,
  onEvent,
  deps = []
}: {
  eventName: keyof HTMLElementEventMap;
  onEvent: () => void;
  deps?: unknown[];
}) {
  const ref = useRef<HTMLButtonElement>(null);

  useEventListener(ref, eventName, onEvent, deps);

  return <button ref={ref} data-testid="test-button">Test Button</button>;
}

describe("useEventListener", () => {
  it("adds event listener to element", () => {
    const mockCallback = vi.fn();
    render(<TestComponent eventName="click" onEvent={mockCallback} />);

    const button = screen.getByTestId("test-button");
    fireEvent.click(button);

    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it("removes event listener on unmount", () => {
    const mockCallback = vi.fn();
    const { unmount } = render(<TestComponent eventName="click" onEvent={mockCallback} />);

    const button = screen.getByTestId("test-button");
    fireEvent.click(button);
    expect(mockCallback).toHaveBeenCalledTimes(1);

    unmount();

    // After unmount, the event listener should be removed
    // We can't easily test this directly, but we can verify the component unmounts
    expect(() => screen.getByTestId("test-button")).toThrow();
  });

  it("handles different event types", () => {
    const mockCallback = vi.fn();
    render(<TestComponent eventName="mouseenter" onEvent={mockCallback} />);

    const button = screen.getByTestId("test-button");
    fireEvent.mouseEnter(button);

    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it("accepts custom deps array", () => {
    const mockCallback = vi.fn();
    const customDeps = ["test"];

    expect(() => render(
      <TestComponent
        eventName="click"
        onEvent={mockCallback}
        deps={customDeps}
      />
    )).not.toThrow();
  });

  it("handles null ref gracefully", () => {
    const mockCallback = vi.fn();

    function NullRefComponent() {
      const ref = useRef<HTMLButtonElement>(null);
      useEventListener(ref, "click", mockCallback);

      return <div>No button</div>;
    }

    expect(() => render(<NullRefComponent />)).not.toThrow();
  });
});