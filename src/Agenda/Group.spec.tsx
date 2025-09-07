import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Store } from "../models";
import { StoreContext } from "../hooks/useStore";
import GroupTaskList from "./Group";

// Mock Task component
vi.mock("./Task", () => ({
  default: ({ task, index }: any) => (
    <tr data-testid={`task-${task.id}`}>
      <td>Task: {task.subject}</td>
      <td>Index: {index}</td>
    </tr>
  ),
}));

const renderGroup = (name: string, tasks: any[]) => {
  const store = Store.create({
    tasks: tasks.map((task) => ({ ...task, expression: task.subject })),
    displayEmoji: true,
    useDarkMode: false,
    locale: "en-US",
  });

  return render(
    <StoreContext.Provider value={store}>
      <table>
        <GroupTaskList name={name} tasks={tasks} />
      </table>
    </StoreContext.Provider>,
  );
};

describe("GroupTaskList Component", () => {
  it("renders group header with name and task count", () => {
    const tasks = [
      { id: "1", subject: "Task 1" },
      { id: "2", subject: "Task 2" },
      { id: "3", subject: "Task 3" },
    ];

    renderGroup("Work", tasks);

    expect(screen.getByText("Work")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders group header with correct styling", () => {
    const tasks = [{ id: "1", subject: "Task 1" }];

    renderGroup("Personal", tasks);

    const headerCell = screen.getByText("Personal").closest("th");
    expect(headerCell).toHaveClass("pb-4");
    expect(headerCell).toHaveClass("pt-6");
    expect(headerCell).toHaveClass("px-4");
    expect(headerCell).toHaveClass("text-left");
    expect(headerCell).toHaveClass("align-middle");
  });

  it("renders task count with correct styling", () => {
    const tasks = [
      { id: "1", subject: "Task 1" },
      { id: "2", subject: "Task 2" },
    ];

    renderGroup("Urgent", tasks);

    const countElement = screen.getByText("2");
    expect(countElement).toHaveClass("font-normal");
    expect(countElement).toHaveClass("text-base-04");
    expect(countElement).toHaveClass("text-sm");
  });

  it("renders all tasks in the group", () => {
    const tasks = [
      { id: "1", subject: "Task 1" },
      { id: "2", subject: "Task 2" },
      { id: "3", subject: "Task 3" },
    ];

    renderGroup("Test Group", tasks);

    expect(screen.getByTestId("task-1")).toBeInTheDocument();
    expect(screen.getByTestId("task-2")).toBeInTheDocument();
    expect(screen.getByTestId("task-3")).toBeInTheDocument();
  });

  it("renders tasks with correct subject", () => {
    const tasks = [
      { id: "1", subject: "Buy groceries" },
      { id: "2", subject: "Call dentist" },
    ];

    renderGroup("Daily", tasks);

    expect(screen.getByText("Task: Buy groceries")).toBeInTheDocument();
    expect(screen.getByText("Task: Call dentist")).toBeInTheDocument();
  });

  it("renders empty group correctly", () => {
    const tasks: any[] = [];

    renderGroup("Empty Group", tasks);

    expect(screen.getByText("Empty Group")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();

    // Should not render any task rows
    expect(screen.queryByTestId(/^task-/)).not.toBeInTheDocument();
  });

  it("renders single task group correctly", () => {
    const tasks = [{ id: "1", subject: "Single task" }];

    renderGroup("Single", tasks);

    expect(screen.getByText("Single")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByTestId("task-1")).toBeInTheDocument();
  });

  it("renders tbody with correct structure", () => {
    const tasks = [{ id: "1", subject: "Test task" }];

    renderGroup("Test", tasks);

    const tbody = screen.getByTestId("task-1").closest("tbody");
    expect(tbody).toBeInTheDocument();
  });

  it("handles tasks with different IDs correctly", () => {
    const tasks = [
      { id: "abc", subject: "Task ABC" },
      { id: "xyz", subject: "Task XYZ" },
    ];

    renderGroup("Mixed", tasks);

    expect(screen.getByTestId("task-abc")).toBeInTheDocument();
    expect(screen.getByTestId("task-xyz")).toBeInTheDocument();
  });

  it("renders group name and count in correct order", () => {
    const tasks = [
      { id: "1", subject: "Task 1" },
      { id: "2", subject: "Task 2" },
    ];

    renderGroup("My Group", tasks);

    const headerCell = screen.getByText("My Group").closest("th");
    const nameElement = screen.getByText("My Group");
    const countElement = screen.getByText("2");

    expect(headerCell).toContainElement(nameElement);
    expect(headerCell).toContainElement(countElement);
  });

  it("handles group with many tasks", () => {
    const tasks = Array.from({ length: 10 }, (_, i) => ({
      id: `${i + 1}`,
      subject: `Task ${i + 1}`,
    }));

    renderGroup("Large Group", tasks);

    expect(screen.getByText("Large Group")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();

    // Check that all tasks are rendered
    for (let i = 1; i <= 10; i++) {
      expect(screen.getByTestId(`task-${i}`)).toBeInTheDocument();
    }
  });
});
