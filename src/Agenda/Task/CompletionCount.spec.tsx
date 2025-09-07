import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CompletionCount } from "./CompletionCount";
import { Store } from "../../models";
import { StoreContext } from "../../hooks/useStore";

let store: any;

const MockWrapper = ({ children }: { children: React.ReactNode }) => (
  <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
);

describe("CompletionCount", () => {
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

  it("returns null for non-recurring tasks", () => {
    const { container } = render(
      <MockWrapper>
        <CompletionCount task={task} />
      </MockWrapper>,
    );

    expect(container.firstChild).toBeNull();
  });

  it("returns null for recurring tasks with zero completions", () => {
    // Ensure the task has zero completions
    recurringTask.reset(); // completionCount = 0

    const { container } = render(
      <MockWrapper>
        <CompletionCount task={recurringTask} />
      </MockWrapper>,
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders completion count when total > 0", () => {
    // Reset the task and complete it once
    recurringTask.reset(); // completionCount = 0
    recurringTask.complete(); // completionCount = 1

    const { container } = render(
      <MockWrapper>
        <CompletionCount task={recurringTask} />
      </MockWrapper>,
    );

    expect(container.firstChild).not.toBeNull();
    const span = screen.getByText("1");
    expect(span).toBeInTheDocument();
  });

  it("renders completion count when total > 0", () => {
    recurringTask.complete(); // completionCount = 1

    render(
      <MockWrapper>
        <CompletionCount task={recurringTask} />
      </MockWrapper>,
    );

    const span = screen.getByText("1");
    expect(span).toBeInTheDocument();
    expect(span).toHaveClass(
      "text-xs",
      "text-base-04",
      "bg-base-02/30",
      "px-2",
      "py-1",
      "rounded-full",
    );
  });

  it("applies selected styling when isSelected is true", () => {
    recurringTask.complete(); // completionCount = 1

    render(
      <MockWrapper>
        <CompletionCount task={recurringTask} isSelected={true} />
      </MockWrapper>,
    );

    const span = screen.getByText("1");
    expect(span).toHaveClass("text-base-0D", "bg-base-0D/10");
  });

  it("applies custom className", () => {
    recurringTask.complete(); // completionCount = 1

    render(
      <MockWrapper>
        <CompletionCount task={recurringTask} className="custom-class" />
      </MockWrapper>,
    );

    const span = screen.getByText("1");
    expect(span).toHaveClass("custom-class");
  });
});
