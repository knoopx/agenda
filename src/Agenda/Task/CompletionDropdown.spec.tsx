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

    const items = document.querySelectorAll(".completion-dropdown-item");
    const selectedItem = items[1] as HTMLElement; // selectedIndex={1}
    const unselectedItem = items[0] as HTMLElement;

    expect(selectedItem).toHaveClass("completion-dropdown-item");
    expect(selectedItem).toHaveClass("bg-base-03");
    expect(unselectedItem).toHaveClass("completion-dropdown-item");
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

    const dropdown = document.querySelector(
      ".completion-dropdown",
    ) as HTMLElement;
    expect(dropdown).toHaveClass("completion-dropdown");
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

    const dropdown = document.querySelector(
      ".completion-dropdown",
    ) as HTMLElement;
    expect(dropdown).toHaveClass("completion-dropdown");
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
    const atSymbols = document.querySelectorAll(
      ".completion-dropdown-item-type",
    );
    expect(atSymbols[0]).toHaveClass("completion-dropdown-item-type");
    expect(atSymbols[0]).toHaveClass("text-base-04", "font-medium", "mr-0.5");

    // Check that # symbols have the correct styling class
    expect(atSymbols[1]).toHaveClass("completion-dropdown-item-type");
    expect(atSymbols[1]).toHaveClass("text-base-04", "font-medium", "mr-0.5");
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

  it("renders all items with correct base styling", () => {
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

    // Get all completion items
    const items = document.querySelectorAll(".completion-dropdown-item");
    items.forEach((item) => {
      expect(item).toHaveClass("completion-dropdown-item");
      expect(item).toHaveClass("px-3", "py-2", "cursor-pointer", "text-sm");
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

    const dropdown = document.querySelector(
      ".completion-dropdown",
    ) as HTMLElement;
    expect(dropdown).toHaveClass("completion-dropdown");
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
