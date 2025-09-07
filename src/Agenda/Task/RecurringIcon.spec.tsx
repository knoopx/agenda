import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecurringIcon } from "./RecurringIcon";

describe("RecurringIcon", () => {
  it("renders the update icon", () => {
    render(<RecurringIcon />);

    // Check for the SVG icon by its path content
    const icon = document.querySelector('svg path[d*="21 10.12"]');
    expect(icon).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<RecurringIcon className="custom-class" />);

    const span = document.querySelector("span");
    expect(span).toHaveClass("custom-class");
  });

  it("passes through other props", () => {
    render(<RecurringIcon data-testid="recurring-icon" />);

    const span = screen.getByTestId("recurring-icon");
    expect(span).toBeInTheDocument();
  });
});
