import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Indicator from "./Indicator";

describe("Indicator Component", () => {
  it("renders with correct color and size", () => {
    render(<Indicator color="#ff0000" size="1rem" data-testid="indicator" />);

    const indicator = screen.getByTestId("indicator");
    expect(indicator).toHaveStyle({
      backgroundColor: "#ff0000",
      width: "1rem",
      height: "1rem",
    });
  });

  it("renders with numeric size", () => {
    render(<Indicator color="#00ff00" size={16} data-testid="indicator" />);

    const indicator = screen.getByTestId("indicator");
    expect(indicator).toHaveStyle({
      backgroundColor: "#00ff00",
      width: "16px",
      height: "16px",
    });
  });

  it("applies custom className", () => {
    render(
      <Indicator
        color="#0000ff"
        size="0.5rem"
        className="custom-class"
        data-testid="indicator"
      />,
    );

    const indicator = screen.getByTestId("indicator");
    expect(indicator).toHaveClass("rounded-full");
    expect(indicator).toHaveClass("custom-class");
  });

  it("applies additional props", () => {
    render(
      <Indicator color="#ff00ff" size="2rem" data-testid="custom-indicator" />,
    );

    const indicator = screen.getByTestId("custom-indicator");
    expect(indicator).toHaveStyle({
      backgroundColor: "#ff00ff",
      width: "2rem",
      height: "2rem",
    });
  });

  it("forwards ref correctly", () => {
    const ref = { current: null };
    render(<Indicator ref={ref} color="#ffff00" size="1.5rem" />);

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("renders as div element", () => {
    render(<Indicator color="#ff0000" size="1rem" data-testid="indicator" />);

    const indicator = screen.getByTestId("indicator");
    expect(indicator.tagName).toBe("DIV");
  });

  it("has rounded-full class by default", () => {
    render(<Indicator color="#ff0000" size="1rem" data-testid="indicator" />);

    const indicator = screen.getByTestId("indicator");
    expect(indicator).toHaveClass("rounded-full");
  });

  it("preserves additional style props", () => {
    render(
      <Indicator
        color="#ff0000"
        size="1rem"
        style={{ border: "1px solid black", opacity: 0.5 }}
        data-testid="indicator"
      />,
    );

    const indicator = screen.getByTestId("indicator");
    expect(indicator).toHaveStyle({
      backgroundColor: "#ff0000",
      width: "1rem",
      height: "1rem",
      border: "1px solid black",
      opacity: "0.5",
    });
  });
});
