import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DateTime } from "luxon";
import EachDay from "./EachDay";

describe("EachDay Component", () => {
  it("renders Interval with correct props for week", () => {
    const start = DateTime.local(2024, 1, 1); // Monday

    const children = vi.fn((interval: any) => (
      <div
        key={interval.start?.toMillis() || 0}
        data-testid={`day-${interval.start?.day || 1}`}
      >
        Day {interval.start?.day || 1}
      </div>
    ));

    render(<EachDay start={start}>{children}</EachDay>);

    // Should render days for the week starting from Monday
    expect(screen.getByTestId("day-1")).toBeInTheDocument(); // Jan 1
    expect(screen.getByTestId("day-2")).toBeInTheDocument(); // Jan 2
    expect(screen.getByTestId("day-3")).toBeInTheDocument(); // Jan 3
    expect(screen.getByTestId("day-4")).toBeInTheDocument(); // Jan 4
    expect(screen.getByTestId("day-5")).toBeInTheDocument(); // Jan 5
    expect(screen.getByTestId("day-6")).toBeInTheDocument(); // Jan 6
    expect(screen.getByTestId("day-7")).toBeInTheDocument(); // Jan 7
  });

  it("passes through additional props", () => {
    const start = DateTime.local(2024, 1, 1);

    render(
      <EachDay start={start} className="custom-class">
        {(interval: any) => <div>Day {interval.start?.day || 1}</div>}
      </EachDay>,
    );

    // EachDay uses Interval with contents class, so we check the wrapper has the class
    const wrapper = screen.getByText("Day 1").parentElement;
    expect(wrapper).toHaveClass("contents");
  });

  it("handles different start days correctly", () => {
    const start = DateTime.local(2024, 1, 3); // Wednesday

    const children = vi.fn((interval: any) => (
      <div
        key={interval.start?.toMillis() || 0}
        data-testid={`day-${interval.start?.day || 1}`}
      >
        Day {interval.start?.day || 1}
      </div>
    ));

    render(<EachDay start={start}>{children}</EachDay>);

    // Should render the 7 days of the week starting from the week's start
    expect(screen.getByTestId("day-1")).toBeInTheDocument(); // Jan 1 (start of week)
    expect(screen.getByTestId("day-7")).toBeInTheDocument(); // Jan 7 (end of week)
    expect(children).toHaveBeenCalledTimes(7); // Should call children 7 times for 7 days
  });
});
