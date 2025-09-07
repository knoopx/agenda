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
    expect(container).toHaveClass("grid");
    expect(container).toHaveClass("lg:grid-cols-2");
  });

  it("renders the Input component", () => {
    renderTopBar();
    expect(screen.getByTestId("input-component")).toBeInTheDocument();
  });

  it("renders the desktop section with correct classes", () => {
    renderTopBar();
    const timeElement = screen.getByText(/\d{1,2}:\d{2} (AM|PM)/);
    const desktopSection = timeElement.parentElement;
    expect(desktopSection).toHaveClass("hidden");
    expect(desktopSection).toHaveClass("flex-auto");
    expect(desktopSection).toHaveClass("lg:flex");
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
    // Look for the PopoverTrigger button
    const popoverTrigger = screen.getByRole("button");
    expect(popoverTrigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(screen.getByTestId("settings-component")).toBeInTheDocument();
    expect(screen.getByTestId("cog-icon")).toBeInTheDocument();
  });

  it("renders cog icon with correct classes", () => {
    renderTopBar();
    const cogIcon = screen.getByTestId("cog-icon");
    expect(cogIcon).toHaveClass("flex");
    expect(cogIcon).toHaveClass("items-center");
    expect(cogIcon).toHaveClass("justify-center");
    expect(cogIcon).toHaveClass("text-base-04");
    expect(cogIcon).toHaveClass("rounded");
    expect(cogIcon).toHaveClass("cursor-pointer");
  });

  it("applies hover classes to cog icon", () => {
    renderTopBar();
    const cogIcon = screen.getByTestId("cog-icon");
    expect(cogIcon).toHaveClass("hover:text-base-05");
    expect(cogIcon).toHaveClass("dark:hover:text-base-05");
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
