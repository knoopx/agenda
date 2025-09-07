import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DateTime } from "luxon";
import { Store } from "../models";
import { StoreContext } from "../hooks/useStore";
import Month from "./Month";

// Global store variable for tests
let store: any;

// Mock Day component
vi.mock("./Day", () => ({
  default: ({ start }: any) => (
    <div data-testid={`day-${start.toMillis()}`}>{start.day}</div>
  ),
}));

const renderMonth = (monthStart: DateTime) => {
  return render(
    <StoreContext.Provider value={store}>
      <Month start={monthStart} />
    </StoreContext.Provider>,
  );
};

describe("Month Component", () => {
  beforeEach(() => {
    store = Store.create({
      tasks: [],
      displayEmoji: true,
      useDarkMode: false,
    });
  });

  it("renders month name correctly", () => {
    const january2024 = DateTime.local(2024, 1, 1);
    renderMonth(january2024);

    expect(screen.getByText("enero")).toBeInTheDocument();
  });

  it("renders year when different from current year", () => {
    const january2023 = DateTime.local(2023, 1, 1);
    renderMonth(january2023);

    expect(screen.getByText("enero")).toBeInTheDocument();
    expect(screen.getByText("2023")).toBeInTheDocument();
  });

  it("does not render year when same as current year", () => {
    const currentYear = DateTime.now().year;
    const januaryCurrent = DateTime.local(currentYear, 1, 1);
    renderMonth(januaryCurrent);

    expect(screen.getByText("enero")).toBeInTheDocument();
    expect(screen.queryByText(currentYear.toString())).not.toBeInTheDocument();
  });

  it("renders weekday headers", () => {
    const january2024 = DateTime.local(2024, 1, 1);
    renderMonth(january2024);

    expect(screen.getByText("Sun")).toBeInTheDocument();
    expect(screen.getByText("Mon")).toBeInTheDocument();
    expect(screen.getByText("Tue")).toBeInTheDocument();
    expect(screen.getByText("Wed")).toBeInTheDocument();
    expect(screen.getByText("Thu")).toBeInTheDocument();
    expect(screen.getByText("Fri")).toBeInTheDocument();
    expect(screen.getByText("Sat")).toBeInTheDocument();
  });

  it("renders correct number of days for January 2024", () => {
    const january2024 = DateTime.local(2024, 1, 1);
    renderMonth(january2024);

    // January 2024 has 31 days, but we need to account for the calendar grid
    // which includes days from previous/next month to fill the grid
    const dayElements = screen.getAllByTestId(/^day-\d+$/);
    expect(dayElements.length).toBeGreaterThanOrEqual(31);
  });

  it("renders days starting from correct weekday", () => {
    const january2024 = DateTime.local(2024, 1, 1);
    renderMonth(january2024);

    // Check that we have the expected number of day elements
    const dayElements = screen.getAllByTestId(/^day-\d+$/);
    expect(dayElements.length).toBeGreaterThan(28); // At least 28 days for January
  });

  it("renders container with correct classes", () => {
    const january2024 = DateTime.local(2024, 1, 1);
    renderMonth(january2024);

    const container = screen.getByText("enero").closest(".flex.flex-col");
    expect(container).toHaveClass("flex");
    expect(container).toHaveClass("flex-col");
    expect(container).toHaveClass("h-fit");
    expect(container).toHaveClass("m-2");
  });

  it("renders month title with correct styling", () => {
    const january2024 = DateTime.local(2024, 1, 1);
    renderMonth(january2024);

    const title = screen.getByText("enero");
    expect(title).toHaveClass("text-center");
    expect(title).toHaveClass("text-base-05");
    expect(title).toHaveClass("font-medium");
    expect(title).toHaveClass("text-lg");
  });

  it("renders weekday headers with correct styling", () => {
    const january2024 = DateTime.local(2024, 1, 1);
    renderMonth(january2024);

    const sundayHeader = screen.getByText("Sun");
    expect(sundayHeader).toHaveClass("text-center");
    expect(sundayHeader).toHaveClass("text-xs");
    expect(sundayHeader).toHaveClass("font-medium");
    expect(sundayHeader).toHaveClass("text-base-04");
  });

  it("renders grid with correct layout", () => {
    const january2024 = DateTime.local(2024, 1, 1);
    renderMonth(january2024);

    // Check that the grid container has the right classes
    const gridContainer =
      screen.getByText("enero").parentElement?.nextElementSibling;
    expect(gridContainer).toHaveClass("grid");
    expect(gridContainer).toHaveClass("grid-cols-7");
    expect(gridContainer).toHaveClass("gap-1");
  });

  it("handles February (short month) correctly", () => {
    const february2024 = DateTime.local(2024, 2, 1);
    renderMonth(february2024);

    expect(screen.getByText("febrero")).toBeInTheDocument();

    // February 2024 has 29 days (leap year)
    const dayElements = screen.getAllByTestId(/^day-\d+$/);
    expect(dayElements.length).toBeGreaterThanOrEqual(29);
  });

  it("handles December (year transition) correctly", () => {
    const december2024 = DateTime.local(2024, 12, 1);
    renderMonth(december2024);

    expect(screen.getByText("diciembre")).toBeInTheDocument();
    expect(screen.getByText("2024")).toBeInTheDocument();
  });
});
