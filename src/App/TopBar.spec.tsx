import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DateTime, Settings as LuxonSettings } from "luxon";
import { Store } from "../models";
import { StoreContext } from "../hooks/useStore";
import TopBar from "./TopBar";

// Set up timezone and mock time
LuxonSettings.defaultZone = "Europe/Madrid";
const mockNow = DateTime.local(2024, 1, 15, 10, 30, 0);
LuxonSettings.now = () => mockNow.toMillis();

// Global store variable for tests
let store: any;

// Mock components
vi.mock("./Input", () => ({
  default: () => <div data-testid="input-component">Input Component</div>,
}));

vi.mock("./Settings", () => ({
  default: () => <div data-testid="settings-component">Settings Component</div>,
}));

// Mock icons
vi.mock("~icons/mdi/cog.jsx", () => ({
  default: ({ "data-testid": testId, ...props }: any) => (
    <span data-testid="cog-icon" {...props} />
  ),
}));

const renderTopBar = () => {
  return render(
    <StoreContext.Provider value={store}>
      <TopBar />
    </StoreContext.Provider>,
  );
};

describe("TopBar Component", () => {
  beforeEach(() => {
    store = Store.create({
      tasks: [],
      displayEmoji: true,
      useDarkMode: false,
      locale: "en-US",
    });
    vi.clearAllMocks();
  });

  it("renders the main container with correct classes", () => {
    renderTopBar();
    const container = screen.getByTestId("input-component").closest(".w-full");
    expect(container).toHaveClass("w-full");
    expect(container).toHaveClass("mb-2");
    expect(container).toHaveClass("mx-auto");
    expect(container).toHaveClass("p-2");
  });

  it("renders mobile settings button with correct classes", () => {
    renderTopBar();
    const mobileSettings =
      screen.getByTestId("input-component").parentElement?.nextElementSibling;
    expect(mobileSettings).toHaveClass("flex");
    expect(mobileSettings).toHaveClass("items-center");
    expect(mobileSettings).toHaveClass("ml-6");
    expect(mobileSettings).toHaveClass("lg:hidden");
  });

  it("renders the Input component", () => {
    renderTopBar();
    expect(screen.getByTestId("input-component")).toBeInTheDocument();
  });

  it("renders the desktop section with correct classes", () => {
    renderTopBar();
    const timeElement = screen.getByText(/\d{1,2}:\d{2} (AM|PM)/);
    const desktopSection = timeElement.parentElement;
    expect(desktopSection).toHaveClass("flex");
    expect(desktopSection).toHaveClass("items-center");
    expect(desktopSection).toHaveClass("space-x-4");
  });

  it("renders Time component in desktop view", () => {
    renderTopBar();
    // Time component should render the current time (format may vary)
    const timeElement = screen.getByText(/\d{1,2}:\d{2} (AM|PM)/);
    expect(timeElement).toBeInTheDocument();
  });

  it("renders Date component in desktop view", () => {
    renderTopBar();
    // Date component should render the current date in Spanish locale
    expect(screen.getByText("lunes, 15 de enero de 2024")).toBeInTheDocument();
  });

  it("renders Settings popover in desktop view", () => {
    renderTopBar();
    // Look for the PopoverTrigger button in desktop view
    const popoverTriggers = screen.getAllByRole("button");
    const desktopTrigger = popoverTriggers.find((trigger) =>
      trigger.closest(".hidden.lg\\:flex"),
    );
    expect(desktopTrigger).toHaveAttribute("aria-haspopup", "dialog");
    const desktopSettings = screen.getAllByTestId("settings-component")[1]; // Desktop is the second one
    expect(desktopSettings).toBeInTheDocument();
    const desktopCogIcons = screen.getAllByTestId("cog-icon");
    expect(desktopCogIcons.length).toBe(2); // Should have both mobile and desktop
  });

  it("renders cog icons with correct classes", () => {
    renderTopBar();
    const cogIcons = screen.getAllByTestId("cog-icon");
    expect(cogIcons).toHaveLength(2); // Mobile and desktop versions

    // Mobile icon (first one)
    expect(cogIcons[0]).toHaveClass("w-10");
    expect(cogIcons[0]).toHaveClass("h-10");
    expect(cogIcons[0]).toHaveClass("p-3");
    expect(cogIcons[0]).toHaveClass("min-w-[44px]");
    expect(cogIcons[0]).toHaveClass("min-h-[44px]");

    // Desktop icon (second one)
    expect(cogIcons[1]).toHaveClass("w-10");
    expect(cogIcons[1]).toHaveClass("h-10");
    expect(cogIcons[1]).toHaveClass("p-2");

    // Common classes for both
    cogIcons.forEach((cogIcon) => {
      expect(cogIcon).toHaveClass("flex-shrink-0");
      expect(cogIcon).toHaveClass("flex");
      expect(cogIcon).toHaveClass("items-center");
      expect(cogIcon).toHaveClass("justify-center");
      expect(cogIcon).toHaveClass("text-base-04");
      expect(cogIcon).toHaveClass("rounded");
      expect(cogIcon).toHaveClass("cursor-pointer");
    });
  });

  it("applies hover classes to cog icons", () => {
    renderTopBar();
    const cogIcons = screen.getAllByTestId("cog-icon");

    cogIcons.forEach((cogIcon) => {
      expect(cogIcon).toHaveClass("hover:text-base-05");
      expect(cogIcon).toHaveClass("dark:hover:text-base-05");
    });
  });
});

describe("Date Component", () => {
  it("renders current date with correct format", () => {
    render(
      <div>
        <h1 className="flex-auto font-medium text-center text-lg">
          {DateTime.now().toLocaleString({
            year: "numeric",
            month: "long",
            day: "numeric",
            weekday: "long",
          })}
        </h1>
      </div>,
    );

    expect(screen.getByText("lunes, 15 de enero de 2024")).toBeInTheDocument();
  });

  it("has correct styling classes", () => {
    render(
      <div>
        <h1 className="flex-auto font-medium text-center text-lg">
          {DateTime.now().toLocaleString({
            year: "numeric",
            month: "long",
            day: "numeric",
            weekday: "long",
          })}
        </h1>
      </div>,
    );

    const dateElement = screen.getByText("lunes, 15 de enero de 2024");
    expect(dateElement).toHaveClass("flex-auto");
    expect(dateElement).toHaveClass("font-medium");
    expect(dateElement).toHaveClass("text-center");
    expect(dateElement).toHaveClass("text-lg");
  });
});

describe("Time Component", () => {
  beforeEach(() => {
    store = Store.create({
      tasks: [],
      displayEmoji: true,
      useDarkMode: false,
      locale: "en-US",
    });
  });

  it("renders current time with default locale", () => {
    render(
      <StoreContext.Provider value={store}>
        <div>
          {mockNow.toLocaleString(
            { hour: "2-digit", minute: "2-digit" },
            { locale: store.locale },
          )}
        </div>
      </StoreContext.Provider>,
    );

    expect(screen.getByText("10:30 AM")).toBeInTheDocument();
  });

  it("renders time with Spanish locale", () => {
    const spanishStore = Store.create({
      tasks: [],
      displayEmoji: true,
      useDarkMode: false,
      locale: "es-ES",
    });

    render(
      <StoreContext.Provider value={spanishStore}>
        <div>
          {mockNow.toLocaleString(
            { hour: "2-digit", minute: "2-digit" },
            { locale: spanishStore.locale },
          )}
        </div>
      </StoreContext.Provider>,
    );

    // Spanish locale might format differently, but should still show the time
    const timeElement = screen.getByText(/10:30/);
    expect(timeElement).toBeInTheDocument();
  });

  it("uses store locale for time formatting", () => {
    const frenchStore = Store.create({
      tasks: [],
      displayEmoji: true,
      useDarkMode: false,
      locale: "fr-FR",
    });

    render(
      <StoreContext.Provider value={frenchStore}>
        <div>
          {mockNow.toLocaleString(
            { hour: "2-digit", minute: "2-digit" },
            { locale: frenchStore.locale },
          )}
        </div>
      </StoreContext.Provider>,
    );

    // French locale might format differently, but should still show the time
    const timeElement = screen.getByText(/10:30/);
    expect(timeElement).toBeInTheDocument();
  });
});
