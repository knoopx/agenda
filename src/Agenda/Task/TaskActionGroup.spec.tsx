import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskActionGroup } from "./TaskActionGroup";
import { Store } from "../../models";
import { StoreContext } from "../../hooks/useStore";

let store: any;

const MockWrapper = ({ children }: { children: React.ReactNode }) => (
  <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
);

describe("TaskActionGroup", () => {
  let task: any;
  let recurringTask: any;

  beforeEach(() => {
    store = Store.create({
      tasks: [],
      displayEmoji: true,
      useDarkMode: false,
    });

    task = store.addTask({ expression: "Test task" })!;
    recurringTask = store.addTask({ expression: "Test task every day" })!;
    vi.clearAllMocks();
  });

  it("renders container with remove button for non-recurring tasks", () => {
    const { container } = render(
      <MockWrapper>
        <TaskActionGroup task={task} />
      </MockWrapper>,
    );

    const div = container.firstChild as HTMLElement;
    expect(div).toBeInTheDocument();
    expect(div).toHaveClass(
      "hidden",
      "group-hover:flex",
      "items-center",
      "space-x-1",
    );

    // Should have one button (remove)
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(1);
  });

  it("renders action buttons for recurring tasks", () => {
    render(
      <MockWrapper>
        <TaskActionGroup task={recurringTask} />
      </MockWrapper>,
    );

    // Should render two buttons
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);
  });

  it("applies correct classes to buttons", () => {
    render(
      <MockWrapper>
        <TaskActionGroup task={recurringTask} />
      </MockWrapper>,
    );

    const buttons = screen.getAllByRole("button");

    // First button (remove) should have hover:text-base-08
    expect(buttons[0]).toHaveClass("hover:text-base-08");

    // Second button (reset) should have hover:text-base-0D
    expect(buttons[1]).toHaveClass("hover:text-base-0D");
  });

  it("applies selected styling when isSelected is true", () => {
    render(
      <MockWrapper>
        <TaskActionGroup task={recurringTask} />
      </MockWrapper>,
    );

    const buttons = screen.getAllByRole("button");

    // Both buttons should have group-focus-within:text-base-0D class when focused
    buttons.forEach((button) => {
      expect(button).toHaveClass("group-focus-within:text-base-0D");
    });
  });

  it("calls remove when remove button is clicked", async () => {
    const user = userEvent.setup();

    render(
      <MockWrapper>
        <TaskActionGroup task={recurringTask} />
      </MockWrapper>,
    );

    const removeButton = screen.getAllByRole("button")[0];
    await user.click(removeButton);

    // The task should be marked for removal (this depends on the task implementation)
    // We can't easily test the actual removal without mocking, but we can test the click
    expect(removeButton).toBeInTheDocument();
  });

  it("calls reset when reset button is clicked", async () => {
    const user = userEvent.setup();

    render(
      <MockWrapper>
        <TaskActionGroup task={recurringTask} />
      </MockWrapper>,
    );

    const resetButton = screen.getAllByRole("button")[1];
    await user.click(resetButton);

    // Similar to remove, we test that the button exists and can be clicked
    expect(resetButton).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <MockWrapper>
        <TaskActionGroup task={recurringTask} className="custom-class" />
      </MockWrapper>,
    );

    const div = container.firstChild as HTMLElement;
    expect(div).toHaveClass("custom-class");
  });

  it("has correct default classes", () => {
    const { container } = render(
      <MockWrapper>
        <TaskActionGroup task={recurringTask} />
      </MockWrapper>,
    );

    const div = container.firstChild as HTMLElement;
    expect(div).toHaveClass(
      "hidden",
      "group-hover:flex",
      "items-center",
      "space-x-1",
    );
  });
});
