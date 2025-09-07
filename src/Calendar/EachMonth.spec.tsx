import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DateTime } from "luxon";
import { Store } from "../models";
import { StoreContext } from "../hooks/useStore";
import EachMonth from "./EachMonth";

describe("EachMonth Component", () => {
  it("renders Interval with correct props for months", () => {
    const store = Store.create({
      tasks: [],
      displayEmoji: true,
      useDarkMode: false,
      locale: "en-US",
    });

    const start = DateTime.local(2024, 1, 1);
    const end = DateTime.local(2024, 3, 31);

    const children = vi.fn((interval: any) => (
      <div
        key={interval.start?.toMillis() || 0}
        data-testid={`month-${interval.start?.month || 1}`}
      >
        Month {interval.start?.month || 1}
      </div>
    ));

    render(
      <StoreContext.Provider value={store}>
        <EachMonth start={start} end={end}>
          {children}
        </EachMonth>
      </StoreContext.Provider>,
    );

    expect(screen.getByTestId("month-1")).toBeInTheDocument(); // January
    expect(screen.getByTestId("month-2")).toBeInTheDocument(); // February
    expect(screen.getByTestId("month-3")).toBeInTheDocument(); // March
  });

  it("applies grid layout for multi-month view", () => {
    const store = Store.create({
      tasks: [],
      displayEmoji: true,
      useDarkMode: false,
      locale: "en-US",
      input: {
        expression: "task from 2024-01-01 to 2024-02-28",
      },
    });

    const start = DateTime.local(2024, 1, 1);
    const end = DateTime.local(2024, 2, 28);

    render(
      <StoreContext.Provider value={store}>
        <EachMonth start={start} end={end}>
          {(interval: any) => <div>Month {interval.start?.month || 1}</div>}
        </EachMonth>
      </StoreContext.Provider>,
    );

    const container = screen.getByText("Month 1").parentElement;
    expect(container).toHaveClass("grid");
    expect(container).toHaveClass("grid-cols-2");
  });

  it("passes through additional props", () => {
    const store = Store.create({
      tasks: [],
      displayEmoji: true,
      useDarkMode: false,
      locale: "en-US",
    });

    const start = DateTime.local(2024, 1, 1);
    const end = DateTime.local(2024, 1, 31);

    render(
      <StoreContext.Provider value={store}>
        <EachMonth start={start} end={end} className="custom-class">
          {(interval: any) => <div>Month {interval.start?.month || 1}</div>}
        </EachMonth>
      </StoreContext.Provider>,
    );

    const container = screen.getByText("Month 1").parentElement;
    expect(container).toHaveClass("custom-class");
  });
});
