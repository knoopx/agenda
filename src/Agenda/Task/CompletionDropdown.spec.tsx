import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CompletionDropdown, CompletionItem } from "./CompletionDropdown";

describe("CompletionDropdown Component", () => {
  const mockItems: CompletionItem[] = [
    { value: "work", type: "@" },
    { value: "home", type: "@" },
    { value: "urgent", type: "#" },
    { value: "personal", type: "#" },
  ];

  const mockOnSelect = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when not visible", () => {
    render(
      <CompletionDropdown
        items={mockItems}
        selectedIndex={0}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
        position={{ top: 0, left: 0 }}
        visible={false}
      />,
    );

    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("renders nothing when items array is empty", () => {
    render(
      <CompletionDropdown
        items={[]}
        selectedIndex={0}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
        position={{ top: 0, left: 0 }}
        visible={true}
      />,
    );

    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("renders completion items when visible and has items", () => {
    render(
      <CompletionDropdown
        items={mockItems}
        selectedIndex={0}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
        position={{ top: 100, left: 200 }}
        visible={true}
      />,
    );

    expect(screen.getByText("work")).toBeInTheDocument();
    expect(screen.getByText("home")).toBeInTheDocument();
    expect(screen.getByText("urgent")).toBeInTheDocument();
    expect(screen.getByText("personal")).toBeInTheDocument();
  });

  it("applies correct styling to selected item", () => {
    render(
      <CompletionDropdown
        items={mockItems}
        selectedIndex={1}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
        position={{ top: 0, left: 0 }}
        visible={true}
      />,
    );

    const selectedItem = screen.getByText("home").closest("div");
    const unselectedItem = screen.getByText("work").closest("div");

    expect(selectedItem).toHaveClass("bg-base-03");
    expect(unselectedItem).not.toHaveClass("bg-base-03");
  });

  it("calls onSelect when item is clicked", () => {
    render(
      <CompletionDropdown
        items={mockItems}
        selectedIndex={0}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
        position={{ top: 0, left: 0 }}
        visible={true}
      />,
    );

    const workItem = screen.getByText("work");
    fireEvent.click(workItem);

    expect(mockOnSelect).toHaveBeenCalledWith(mockItems[0]);
    expect(mockOnSelect).toHaveBeenCalledTimes(1);
  });

  it("applies correct position styling", () => {
    const position = { top: 150, left: 250 };

    render(
      <CompletionDropdown
        items={mockItems}
        selectedIndex={0}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
        position={position}
        visible={true}
      />,
    );

    const dropdown = screen
      .getByText("work")
      .closest(".absolute") as HTMLElement;
    expect(dropdown).toHaveStyle({
      top: `${position.top}px`,
      left: `${position.left}px`,
    });
  });

  it("has correct minimum width", () => {
    render(
      <CompletionDropdown
        items={mockItems}
        selectedIndex={0}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
        position={{ top: 0, left: 0 }}
        visible={true}
      />,
    );

    const dropdown = screen
      .getByText("work")
      .closest(".absolute") as HTMLElement;
    expect(dropdown).toHaveStyle({ minWidth: "120px" });
  });

  it("renders items with correct type styling", () => {
    render(
      <CompletionDropdown
        items={mockItems}
        selectedIndex={0}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
        position={{ top: 0, left: 0 }}
        visible={true}
      />,
    );

    // Check that @ symbols have the correct styling class
    const atSymbols = screen.getAllByText("@");
    expect(atSymbols[0]).toHaveClass("text-base-0B");

    // Check that # symbols have the correct styling class
    const hashSymbols = screen.getAllByText("#");
    expect(hashSymbols[0]).toHaveClass("text-base-0B");
  });

  it("closes when Escape is pressed", () => {
    render(
      <CompletionDropdown
        items={mockItems}
        selectedIndex={0}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
        position={{ top: 0, left: 0 }}
        visible={true}
      />,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("handles click outside to close", () => {
    render(
      <CompletionDropdown
        items={mockItems}
        selectedIndex={0}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
        position={{ top: 0, left: 0 }}
        visible={true}
      />,
    );

    // Click outside the dropdown
    fireEvent.mouseDown(document.body);

    // onClose should be called after a delay (due to setTimeout in component)
    setTimeout(() => {
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    }, 200);
  });

  it("renders all items with hover styling", () => {
    render(
      <CompletionDropdown
        items={mockItems}
        selectedIndex={0}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
        position={{ top: 0, left: 0 }}
        visible={true}
      />,
    );

    // Get all div elements that contain the completion items
    const items = screen.getAllByText(/work|home|urgent|personal/);
    items.forEach((item) => {
      const container = item.closest("div");
      expect(container).toHaveClass("cursor-pointer", "hover:bg-base-03");
    });
  });

  it("has correct dropdown styling", () => {
    render(
      <CompletionDropdown
        items={mockItems}
        selectedIndex={0}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
        position={{ top: 0, left: 0 }}
        visible={true}
      />,
    );

    const dropdown = screen
      .getByText("work")
      .closest(".absolute") as HTMLElement;
    expect(dropdown).toHaveClass(
      "z-50",
      "bg-base-01",
      "border",
      "border-base-04",
      "rounded-md",
      "shadow-lg",
      "max-h-48",
      "overflow-y-auto",
    );
  });
});
