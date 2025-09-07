import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DateTime, Interval } from "luxon";
import IntervalBlock from "./Interval";

describe("IntervalBlock Component", () => {
  it("renders children for each interval split", () => {
    const start = DateTime.local(2024, 1, 1);
    const end = DateTime.local(2024, 1, 3); // 3 days

    const children = vi.fn((interval: Interval) => {
      const day = interval.start?.day || 1;
      return (
        <div
          key={interval.start?.toMillis() || 0}
          data-testid={`interval-${day}`}
        >
          Day {day}
        </div>
      );
    });

    render(
      <IntervalBlock start={start} end={end} splitBy={{ days: 1 }}>
        {children}
      </IntervalBlock>,
    );

    expect(screen.getByTestId("interval-1")).toBeInTheDocument();
    expect(screen.getByTestId("interval-2")).toBeInTheDocument();
    expect(children).toHaveBeenCalledTimes(2); // 2 intervals for 3 days
  });

  it("splits by weeks correctly", () => {
    const start = DateTime.local(2024, 1, 1); // Monday
    const end = DateTime.local(2024, 1, 15); // Should span 2-3 weeks

    const children = vi.fn((interval: Interval) => {
      const weekNum = interval.start?.weekNumber || 1;
      return (
        <div
          key={interval.start?.toMillis() || 0}
          data-testid={`week-${weekNum}`}
        >
          Week {weekNum}
        </div>
      );
    });

    render(
      <IntervalBlock start={start} end={end} splitBy={{ weeks: 1 }}>
        {children}
      </IntervalBlock>,
    );

    // Should have intervals for weeks containing Jan 1-15, 2024
    expect(screen.getByTestId("week-1")).toBeInTheDocument(); // Week 1 (Jan 1-7)
    expect(screen.getByTestId("week-2")).toBeInTheDocument(); // Week 2 (Jan 8-14)
  });

  it("splits by months correctly", () => {
    const start = DateTime.local(2024, 1, 1);
    const end = DateTime.local(2024, 3, 31);

    const children = vi.fn((interval: Interval) => {
      const month = interval.start?.month || 1;
      return (
        <div
          key={interval.start?.toMillis() || 0}
          data-testid={`month-${month}`}
        >
          Month {month}
        </div>
      );
    });

    render(
      <IntervalBlock start={start} end={end} splitBy={{ months: 1 }}>
        {children}
      </IntervalBlock>,
    );

    expect(screen.getByTestId("month-1")).toBeInTheDocument(); // January
    expect(screen.getByTestId("month-2")).toBeInTheDocument(); // February
    expect(screen.getByTestId("month-3")).toBeInTheDocument(); // March
  });

  it("handles single interval correctly", () => {
    const start = DateTime.local(2024, 1, 1);
    const end = DateTime.local(2024, 1, 1, 23, 59); // Same day

    const children = vi.fn((interval: Interval) => (
      <div key={interval.start?.toMillis() || 0} data-testid="single-interval">
        Single interval
      </div>
    ));

    render(
      <IntervalBlock start={start} end={end} splitBy={{ days: 1 }}>
        {children}
      </IntervalBlock>,
    );

    expect(screen.getByTestId("single-interval")).toBeInTheDocument();
    expect(children).toHaveBeenCalledTimes(1);
  });

  it("passes through additional props to container", () => {
    const start = DateTime.local(2024, 1, 1);
    const end = DateTime.local(2024, 1, 2);

    render(
      <IntervalBlock
        start={start}
        end={end}
        splitBy={{ days: 1 }}
        className="custom-class"
        data-testid="interval-container"
      >
        {(interval: Interval) => <div>Day {interval.start?.day || 1}</div>}
      </IntervalBlock>,
    );

    const container = screen.getByTestId("interval-container");
    expect(container).toHaveClass("custom-class");
  });

  it("calls children with correct interval objects", () => {
    const start = DateTime.local(2024, 1, 1);
    const end = DateTime.local(2024, 1, 2);

    const children = vi.fn((interval: Interval) => (
      <div key={interval.start?.toMillis() || 0}>
        {interval.start?.toFormat("yyyy-MM-dd") || ""}
      </div>
    ));

    render(
      <IntervalBlock start={start} end={end} splitBy={{ days: 1 }}>
        {children}
      </IntervalBlock>,
    );

    expect(children).toHaveBeenCalledTimes(1);
    const calledInterval = children.mock.calls[0][0];
    expect(calledInterval).toBeInstanceOf(Interval);
    expect(calledInterval.start?.toFormat("yyyy-MM-dd")).toBe("2024-01-01");
  });
});
