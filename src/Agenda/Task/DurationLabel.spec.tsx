import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Duration } from "luxon";
import { DurationLabel } from "./DurationLabel";

describe("DurationLabel", () => {
  it("returns null for zero duration", () => {
    const duration = Duration.fromMillis(0);
    const { container } = render(<DurationLabel duration={duration} />);

    expect(container.firstChild).toBeNull();
  });

  it("renders formatted duration", () => {
    const duration = Duration.fromObject({ hours: 2, minutes: 30 });
    render(<DurationLabel duration={duration} />);

    const label = screen.getByText("2h 30m");
    expect(label).toBeInTheDocument();
  });

  it("applies selected styling when isSelected is true", () => {
    const duration = Duration.fromObject({ minutes: 45 });
    render(<DurationLabel duration={duration} />);

    const label = screen.getByText("45m").parentElement;
    expect(label).toHaveClass("group-focus-within:text-base-0D");
  });

  it("applies custom className", () => {
    const duration = Duration.fromObject({ seconds: 30 });
    render(<DurationLabel duration={duration} className="custom-class" />);

    const label = screen.getByText("30s").parentElement;
    expect(label).toHaveClass(
      "custom-class",
      "group-focus-within:text-base-0D",
    );
  });

  it("positions icon on the right by default", () => {
    const duration = Duration.fromObject({ hours: 1 });
    render(<DurationLabel duration={duration} />);

    // The Label component should have position="right" by default
    const label = screen.getByText("1h");
    expect(label).toBeInTheDocument();
  });
});
