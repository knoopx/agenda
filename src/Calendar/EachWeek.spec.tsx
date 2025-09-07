import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DateTime } from "luxon";
import EachWeek from "./EachWeek";

describe("EachWeek Component", () => {
  it("renders Interval with correct props for weeks", () => {
    const start = DateTime.local(2024, 1, 1); // Monday

    const children = vi.fn((interval: any) => (
      <div
        key={interval.start?.toMillis() || 0}
        data-testid={`week-${interval.start?.weekNumber || 1}`}
      >
        Week {interval.start?.weekNumber || 1}
      </div>
    ));

    render(<EachWeek start={start}>{children}</EachWeek>);

    expect(screen.getByTestId("week-1")).toBeInTheDocument(); // Week 1
    expect(screen.getByTestId("week-2")).toBeInTheDocument(); // Week 2
    expect(screen.getByTestId("week-3")).toBeInTheDocument(); // Week 3
  });

  it("passes through additional props", () => {
    const start = DateTime.local(2024, 1, 1);

    render(
      <EachWeek start={start} className="custom-class">
        {(interval: any) => <div>Week {interval.start?.weekNumber || 1}</div>}
      </EachWeek>,
    );

    const container = screen.getByText("Week 1").parentElement;
    expect(container).toHaveClass("contents");
  });
});
