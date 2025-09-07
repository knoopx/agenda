import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { DateTime } from "luxon";
import { TimeLabel } from "./TimeLabel";
import { Store } from "../../models";
import { StoreContext } from "../../hooks/useStore";

let store: any;

const MockWrapper = ({ children }: { children: React.ReactNode }) => (
  <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
);

describe("TimeLabel", () => {
  beforeEach(() => {
    store = Store.create({
      tasks: [],
      displayEmoji: true,
      useDarkMode: false,
    });
  });

  it("returns null for midnight time", () => {
    const midnight = DateTime.local(2024, 1, 15, 0, 0);
    const { container } = render(
      <MockWrapper>
        <TimeLabel date={midnight} />
      </MockWrapper>,
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders time for non-midnight time", () => {
    const time = DateTime.local(2024, 1, 15, 14, 30);
    render(
      <MockWrapper>
        <TimeLabel date={time} />
      </MockWrapper>,
    );

    // Should render time in 24-hour format
    const timeText = screen.getByText("14:30");
    expect(timeText).toBeInTheDocument();
  });

  it("applies selected styling when isSelected is true", () => {
    const time = DateTime.local(2024, 1, 15, 9, 15);
    render(
      <MockWrapper>
        <TimeLabel date={time} isSelected={true} />
      </MockWrapper>,
    );

    const label = screen.getByText("9:15").parentElement;
    expect(label).toHaveClass("text-base-0D");
  });

  it("applies custom className", () => {
    const time = DateTime.local(2024, 1, 15, 16, 45);
    render(
      <MockWrapper>
        <TimeLabel date={time} className="custom-class" />
      </MockWrapper>,
    );

    const label = screen.getByText("16:45").parentElement;
    expect(label).toHaveClass("custom-class");
  });

  it("handles different times correctly", () => {
    const testCases = [
      { time: DateTime.local(2024, 1, 15, 0, 1), expected: "0:01" }, // Just after midnight
      { time: DateTime.local(2024, 1, 15, 11, 59), expected: "11:59" },
      { time: DateTime.local(2024, 1, 15, 12, 0), expected: "12:00" }, // Noon
      { time: DateTime.local(2024, 1, 15, 23, 59), expected: "23:59" },
    ];

    testCases.forEach(({ time, expected }) => {
      render(
        <MockWrapper>
          <TimeLabel date={time} />
        </MockWrapper>,
      );
      expect(screen.getByText(expected)).toBeInTheDocument();
    });
  });
});
