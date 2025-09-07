import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskActionButton } from "./TaskActionButton";

describe("TaskActionButton", () => {
  it("renders a button with default classes", () => {
    render(<TaskActionButton />);

    const button = screen.getByRole("button");
    expect(button).toHaveClass(
      "flex",
      "items-center",
      "justify-center",
      "w-8",
      "h-8",
      "text-base-04",
      "hover:text-base-05",
      "hover:bg-base-02",
      "dark:hover:bg-base-03",
      "rounded-lg",
      "cursor-pointer",
    );
  });

  it("applies custom className", () => {
    render(<TaskActionButton className="custom-class" />);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("custom-class");
  });

  it("passes through other props", () => {
    const handleClick = vi.fn();
    render(
      <TaskActionButton onClick={handleClick} data-testid="action-button" />,
    );

    const button = screen.getByTestId("action-button");
    expect(button).toBeInTheDocument();
  });

  it("handles click events", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<TaskActionButton onClick={handleClick} />);

    const button = screen.getByRole("button");
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("has correct button type", () => {
    render(<TaskActionButton />);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("type", "button");
  });
});
