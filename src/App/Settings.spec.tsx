import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DateTime, Settings as LuxonSettings } from "luxon";
import * as Popover from "@radix-ui/react-popover";
import { Store } from "../models";
import { StoreContext } from "../hooks/useStore";
import Settings, { Button, Select } from "./Settings";

// Set up timezone and mock time
LuxonSettings.defaultZone = "Europe/Madrid";
const mockNow = DateTime.local(2024, 1, 15, 10, 0, 0);
LuxonSettings.now = () => mockNow.toMillis();

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Global store variable for tests
let store: any;

// Mock icons
vi.mock("~icons/mdi/update.jsx", () => ({
  default: ({ "data-testid": testId, ...props }: any) => (
    <span data-testid="recurring-icon" {...props} />
  ),
}));

vi.mock("~icons/mdi/weather-sunny.jsx", () => ({
  default: ({ "data-testid": testId, ...props }: any) => (
    <span data-testid="sunny-icon" {...props} />
  ),
}));

vi.mock("~icons/mdi/weather-night.jsx", () => ({
  default: ({ "data-testid": testId, ...props }: any) => (
    <span data-testid="night-icon" {...props} />
  ),
}));

vi.mock("~icons/mdi/content-copy.jsx", () => ({
  default: ({ "data-testid": testId, ...props }: any) => (
    <span data-testid="copy-icon" {...props} />
  ),
}));

vi.mock("~icons/mdi/content-paste.jsx", () => ({
  default: ({ "data-testid": testId, ...props }: any) => (
    <span data-testid="paste-icon" {...props} />
  ),
}));

vi.mock("~icons/mdi/trash-can-outline.jsx", () => ({
  default: ({ "data-testid": testId, ...props }: any) => (
    <span data-testid="trash-icon" {...props} />
  ),
}));

vi.mock("~icons/mdi/cog.jsx", () => ({
  default: ({ "data-testid": testId, ...props }: any) => (
    <span data-testid="cog-icon" {...props} />
  ),
}));

const renderSettings = () => {
  return render(
    <StoreContext.Provider value={store}>
      <Popover.Root open={true}>
        <Settings />
      </Popover.Root>
    </StoreContext.Provider>,
  );
};

describe("Settings Component", () => {
  beforeEach(() => {
    store = Store.create({
      tasks: [],
      displayEmoji: true,
      useDarkMode: false,
      timeOfTheDay: {
        morning: 9,
        afternoon: 14,
        evening: 18,
        night: 22,
      },
      locale: "en-US",
      timeZone: "UTC",
    });

    // Mock store methods that modify state
    store.copyListToClipboard = vi.fn();
    store.importListFromClipboard = vi.fn();
    store.clearAll = vi.fn();

    vi.clearAllMocks();
  });

  it("renders settings content", () => {
    renderSettings();
    expect(screen.getByText("Times of the day")).toBeInTheDocument();
  });

  it("displays time of the day settings", () => {
    renderSettings();
    expect(screen.getByText("Times of the day")).toBeInTheDocument();
    expect(screen.getByText("morning")).toBeInTheDocument();
    expect(screen.getByText("afternoon")).toBeInTheDocument();
    expect(screen.getByText("evening")).toBeInTheDocument();
    expect(screen.getByText("night")).toBeInTheDocument();
  });

  it("allows changing time of the day values", () => {
    renderSettings();
    const morningSelect = screen.getByDisplayValue("9:00") as HTMLSelectElement;

    fireEvent.change(morningSelect, { target: { value: "8" } });

    expect(store.timeOfTheDay.morning).toBe(8);
  });

  it("displays time format setting", () => {
    renderSettings();
    expect(screen.getByText("Time format")).toBeInTheDocument();
    const localeSelect = screen.getByDisplayValue("en-US");
    expect(localeSelect).toBeInTheDocument();
  });

  it("allows changing locale", () => {
    renderSettings();
    const localeSelect = screen.getByDisplayValue("en-US");

    fireEvent.change(localeSelect, { target: { value: "es-ES" } });

    expect(store.locale).toBe("es-ES");
  });

  it("displays time zone setting", () => {
    renderSettings();
    expect(screen.getByText("Time zone")).toBeInTheDocument();
    const timeZoneSelect = screen.getByDisplayValue("UTC");
    expect(timeZoneSelect).toBeInTheDocument();
  });

  it("allows changing time zone", () => {
    renderSettings();
    const timeZoneSelect = screen.getByDisplayValue("UTC");

    fireEvent.change(timeZoneSelect, { target: { value: "Europe/Madrid" } });

    expect(store.timeZone).toBe("Europe/Madrid");
  });

  it("displays emoji toggle", () => {
    renderSettings();
    expect(screen.getByText("show emoji")).toBeInTheDocument();
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeChecked();
  });

  it("allows toggling emoji display", () => {
    renderSettings();
    const checkbox = screen.getByRole("checkbox");

    fireEvent.click(checkbox);

    expect(store.displayEmoji).toBe(false);
  });

  it("displays action buttons", () => {
    renderSettings();
    expect(screen.getByTestId("night-icon")).toBeInTheDocument();
    expect(screen.getByTestId("copy-icon")).toBeInTheDocument();
    expect(screen.getByTestId("paste-icon")).toBeInTheDocument();
    expect(screen.getByTestId("trash-icon")).toBeInTheDocument();
  });

  it("toggles dark mode when sun/moon button is clicked", () => {
    renderSettings();
    const themeButton = screen.getByTestId("night-icon").closest("button");

    fireEvent.click(themeButton!);

    expect(store.useDarkMode).toBe(true);
  });

  it("copies list to clipboard when copy button is clicked", () => {
    renderSettings();
    const copyButton = screen.getByTestId("copy-icon").closest("button");

    fireEvent.click(copyButton!);

    expect(store.copyListToClipboard).toHaveBeenCalled();
  });

  it("imports list from clipboard when paste button is clicked", () => {
    renderSettings();
    const pasteButton = screen.getByTestId("paste-icon").closest("button");

    fireEvent.click(pasteButton!);

    expect(store.importListFromClipboard).toHaveBeenCalled();
  });

  it("clears all tasks when trash button is clicked", () => {
    renderSettings();
    const clearButton = screen.getByTestId("trash-icon").closest("button");

    fireEvent.click(clearButton!);

    expect(store.clearAll).toHaveBeenCalled();
  });

  it("has correct styling classes", () => {
    renderSettings();
    // Find the main content div by its classes
    const content = document.querySelector(
      ".flex.flex-auto.flex-col.p-4.text-xs",
    );
    expect(content).toHaveClass("flex");
    expect(content).toHaveClass("flex-auto");
    expect(content).toHaveClass("flex-col");
    expect(content).toHaveClass("p-4");
    expect(content).toHaveClass("text-xs");
  });

  describe("Button component", () => {
    it("renders with default classes", () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole("button", { name: "Click me" });
      expect(button).toHaveClass("flex");
      expect(button).toHaveClass("items-center");
      expect(button).toHaveClass("justify-center");
      expect(button).toHaveClass("text-base-04");
      expect(button).toHaveClass("hover:text-base-05");
      expect(button).toHaveClass("rounded");
      expect(button).toHaveClass("cursor-pointer");
    });

    it("applies additional className", () => {
      render(<Button className="custom-class">Click me</Button>);
      const button = screen.getByRole("button", { name: "Click me" });
      expect(button).toHaveClass("custom-class");
    });

    it("passes through other props", () => {
      const onClick = vi.fn();
      render(<Button onClick={onClick}>Click me</Button>);
      const button = screen.getByRole("button", { name: "Click me" });
      fireEvent.click(button);
      expect(onClick).toHaveBeenCalled();
    });
  });

  describe("Select component", () => {
    it("renders with default classes", () => {
      render(
        <Select>
          <option value="1">Option 1</option>
        </Select>,
      );
      const select = screen.getByRole("combobox");
      expect(select).toHaveClass("bg-base-01");
      expect(select).toHaveClass("rounded");
      expect(select).toHaveClass("px-2");
      expect(select).toHaveClass("py-1");
      expect(select).toHaveClass("border-none");
      expect(select).toHaveClass("appearance-none");
      expect(select).toHaveClass("outline-none");
    });

    it("applies additional className", () => {
      render(
        <Select className="custom-class">
          <option value="1">Option 1</option>
        </Select>,
      );
      const select = screen.getByRole("combobox");
      expect(select).toHaveClass("custom-class");
    });

    it("passes through other props", () => {
      const onChange = vi.fn();
      render(
        <Select onChange={onChange}>
          <option value="1">Option 1</option>
        </Select>,
      );
      const select = screen.getByRole("combobox");
      fireEvent.change(select, { target: { value: "1" } });
      expect(onChange).toHaveBeenCalled();
    });
  });
});
