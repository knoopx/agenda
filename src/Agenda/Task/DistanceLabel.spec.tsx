import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DateTime } from "luxon";
import { DistanceLabel } from "./DistanceLabel";

describe("DistanceLabel", () => {
  it("renders distance for future date", () => {
    const futureDate = DateTime.now().plus({ hours: 2 });
    render(<DistanceLabel date={futureDate} />);

    // Should render some distance text containing "in"
    const label = screen.getByText(/in/);
    expect(label).toBeInTheDocument();
  });

  it("applies due styling when date is in the past", () => {
    const pastDate = DateTime.now().minus({ hours: 2 });
    render(<DistanceLabel date={pastDate} />);

    const label = screen.getByText(/\d/).parentElement;
    expect(label).toHaveClass("text-base-08");
  });

  it("applies selected styling when isSelected is true", () => {
    const pastDate = DateTime.now().minus({ hours: 2 });
    render(<DistanceLabel date={pastDate} />);

    const label = screen.getByText(/\d/).parentElement;
    expect(label).toHaveClass("group-focus-within:text-base-0D");
  });

  it("applies custom className", () => {
    const futureDate = DateTime.now().plus({ minutes: 30 });
    render(<DistanceLabel date={futureDate} className="custom-class" />);

    const label = screen.getByText(/in/).parentElement;
    expect(label).toHaveClass("custom-class");
  });

  it("handles current time (due = false)", () => {
    const currentDate = DateTime.now();
    render(<DistanceLabel date={currentDate} />);

    const label = screen.getByText(/min/).parentElement;
    expect(label).toBeInTheDocument();
  });

  it("handles very recent past time", () => {
    const veryRecentPast = DateTime.now().minus({ seconds: 30 });
    render(<DistanceLabel date={veryRecentPast} />);

    const label = screen.getByText(/\d/).parentElement;
    expect(label).toHaveClass("text-base-08");
  });
});
