import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DateTime } from "luxon";
import { DateLabel } from "./DateLabel";

describe("DateLabel", () => {
  it("renders formatted date", () => {
    const date = DateTime.local(2024, 1, 15); // Monday, January 15, 2024
    render(<DateLabel date={date} className="test-class" />);

    // The date is formatted in Spanish locale: "lun, 15 ene"
    const label = screen.getByText("lun, 15 ene");
    expect(label).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const date = DateTime.local(2024, 6, 20);
    render(<DateLabel date={date} className="custom-class" />);

    // Spanish: "jue, 20 jun"
    const label = screen.getByText("jue, 20 jun");
    expect(label.parentElement).toHaveClass("custom-class");
  });

  it("formats different dates correctly", () => {
    const testCases = [
      { date: DateTime.local(2024, 12, 25), expected: "mié, 25 dic" },
      { date: DateTime.local(2024, 2, 29), expected: "jue, 29 feb" },
      { date: DateTime.local(2024, 7, 4), expected: "jue, 4 jul" },
    ];

    testCases.forEach(({ date, expected }) => {
      const { rerender } = render(<DateLabel date={date} className="" />);
      expect(screen.getByText(expected)).toBeInTheDocument();
      rerender(<DateLabel date={DateTime.local(2024, 1, 1)} className="" />);
    });
  });
});
