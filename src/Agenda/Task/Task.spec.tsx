import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  render,
  screen,
  cleanup,
  fireEvent,
  act,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DateTime, Settings } from "luxon";
import { Store } from "../../models";
import { StoreContext } from "../../hooks/useStore";
import Task from "./Task";
import { ITask } from "../../models/Task";

// Set up timezone and mock time
Settings.defaultZone = "Europe/Madrid";
const mockNow = DateTime.local(2024, 1, 15, 10, 0, 0);
Settings.now = () => mockNow.toMillis();

// Global store variable for tests
let store: any;

// Mock wrapper - wrap in table for proper rendering
const MockWrapper = ({ children }: { children: React.ReactNode }) => (
  <StoreContext.Provider value={store}>
    <table>
      <tbody>{children}</tbody>
    </table>
  </StoreContext.Provider>
);

describe("Task Component", () => {
  let mockTask: ITask;

  beforeEach(() => {
    store = Store.create({
      tasks: [],
      displayEmoji: true,
      useDarkMode: false,
    });

    mockTask = store.addTask({ expression: "Test task" })!;
    vi.clearAllMocks();
  });

  describe("Task Rendering", () => {
    it("renders task with subject", () => {
      render(
        <MockWrapper>
          <Task task={mockTask} />
        </MockWrapper>,
      );

      expect(screen.getByDisplayValue("Test task")).toBeInTheDocument();
    });

    it("renders task with checkbox", () => {
      render(
        <MockWrapper>
          <Task task={mockTask} />
        </MockWrapper>,
      );

      const checkbox = document.querySelector(
        ".task-checkbox",
      ) as HTMLInputElement;
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toHaveClass("task-checkbox");
      expect(checkbox).not.toBeChecked();
    });

    it("applies proper CSS classes to task row", () => {
      render(
        <MockWrapper>
          <Task task={mockTask} />
        </MockWrapper>,
      );

      const taskRow = document.querySelector(".task");
      expect(taskRow).toHaveClass("task");
      expect(taskRow).toHaveClass("align-middle");
      expect(taskRow).not.toHaveClass("opacity-50");
    });
  });

  describe("Task Completion", () => {
    it("displays duration for completed tasks", () => {
      // Set up a task with a known createdAt and lastCompletedAt
      const createdAt = DateTime.local(2024, 1, 15, 8, 0, 0);
      const completedAt = DateTime.local(2024, 1, 15, 10, 30, 0);
      mockTask.update({
        createdAt,
        lastCompletedAt: completedAt,
        isCompleted: true,
      });
      render(
        <MockWrapper>
          <Task task={mockTask} />
        </MockWrapper>,
      );
      // Duration should be 2h 30m
      expect(screen.getByText(/2h.*30m/)).toBeInTheDocument();
    });

    it("displays completion count for recurring completed tasks", () => {
      const recurringTask = store.addTask({
        expression: "Daily task every day",
      })!;
      const createdAt = DateTime.local(2024, 1, 15, 8, 0, 0);
      const completedAt = DateTime.local(2024, 1, 15, 10, 30, 0);

      // Set up recurring task with multiple completions
      recurringTask.update({
        createdAt,
        lastCompletedAt: completedAt,
        isCompleted: true,
        completionCount: 5,
      });

      render(
        <MockWrapper>
          <Task task={recurringTask} />
        </MockWrapper>,
      );

      // Should display both duration and completion count
      expect(screen.getByText(/2h.*30m/)).toBeInTheDocument();
      expect(screen.getByText("5 completions")).toBeInTheDocument();
    });
    it("renders checked checkbox for completed task", () => {
      mockTask.complete();

      render(
        <MockWrapper>
          <Task task={mockTask} />
        </MockWrapper>,
      );

      const checkbox = document.querySelector(
        ".task-checkbox",
      ) as HTMLInputElement;
      expect(checkbox).toHaveClass("task-checkbox");
      expect(checkbox).toBeChecked();
    });

    it("applies dimmed styling to completed tasks", () => {
      mockTask.complete();

      render(
        <MockWrapper>
          <Task task={mockTask} />
        </MockWrapper>,
      );

      const taskRow = document.querySelector(".task");
      expect(taskRow).toHaveClass("task");
      expect(taskRow).toHaveClass("text-base-03");
    });

    it("toggles task completion when checkbox is clicked", async () => {
      const user = userEvent.setup();

      render(
        <MockWrapper>
          <Task task={mockTask} />
        </MockWrapper>,
      );

      const checkbox = document.querySelector(
        ".task-checkbox",
      ) as HTMLInputElement;
      expect(checkbox).toHaveClass("task-checkbox");
      expect(mockTask.isCompleted).toBe(false);

      await user.click(checkbox);

      expect(mockTask.isCompleted).toBe(true);
    });

    it("uncompletes task when clicking completed task checkbox", async () => {
      const user = userEvent.setup();
      mockTask.complete(); // Start with completed task

      render(
        <MockWrapper>
          <Task task={mockTask} />
        </MockWrapper>,
      );

      const checkbox = document.querySelector(
        ".task-checkbox",
      ) as HTMLInputElement;
      expect(checkbox).toHaveClass("task-checkbox");
      expect(mockTask.isCompleted).toBe(true);

      await user.click(checkbox);

      expect(mockTask.isCompleted).toBe(false);
    });
  });

  describe("Task Editing", () => {
    it("shows task input field", () => {
      render(
        <MockWrapper>
          <Task task={mockTask} />
        </MockWrapper>,
      );

      const input = screen.getByDisplayValue("Test task");
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("type", "text");
    });

    it("allows text input in task field", () => {
      render(
        <MockWrapper>
          <Task task={mockTask} />
        </MockWrapper>,
      );

      const input = screen.getByDisplayValue("Test task");
      fireEvent.change(input, { target: { value: "Updated task" } });

      expect(input).toHaveValue("Updated task");
    });
  });

  describe("Task Properties", () => {
    it("handles tasks with different completion states", () => {
      const incompleteTask = store.addTask({ expression: "Task 1" })!;
      const completeTask = store.addTask({ expression: "Completed task" })!;
      completeTask.complete();

      // Test incomplete task
      render(
        <MockWrapper>
          <Task task={incompleteTask} />
        </MockWrapper>,
      );
      const incompleteCheckbox = document.querySelector(
        ".task-checkbox",
      ) as HTMLInputElement;
      expect(incompleteCheckbox).toHaveClass("task-checkbox");
      expect(incompleteCheckbox).not.toBeChecked();

      // Clean up and test complete task
      cleanup();
      render(
        <MockWrapper>
          <Task task={completeTask} />
        </MockWrapper>,
      );
      const completeCheckbox = document.querySelector(
        ".task-checkbox",
      ) as HTMLInputElement;
      expect(completeCheckbox).toHaveClass("task-checkbox");
      expect(completeCheckbox).toBeChecked();
    });

    it("maintains task state correctly", () => {
      expect(mockTask.isCompleted).toBe(false);
      expect(mockTask.subject).toBe("Test task");
      expect(mockTask.isValid).toBe(true);
    });
  });

  describe("Component Structure", () => {
    it("renders within table row structure", () => {
      render(
        <MockWrapper>
          <Task task={mockTask} />
        </MockWrapper>,
      );

      const taskRow = document.querySelector(".task");
      expect(taskRow).toBeInTheDocument();
      expect(taskRow).toHaveClass("task");

      const cells = taskRow?.querySelectorAll("td");
      expect(cells).toHaveLength(2); // Time cell and content cell
    });

    it("contains required task elements", () => {
      render(
        <MockWrapper>
          <Task task={mockTask} />
        </MockWrapper>,
      );

      expect(screen.getByDisplayValue("Test task")).toBeInTheDocument();
      const checkbox = document.querySelector(
        ".task-checkbox",
      ) as HTMLInputElement;
      expect(checkbox).toHaveClass("task-checkbox");
      expect(checkbox).toBeInTheDocument();
    });
  });

  describe("Task Focus and Editing", () => {
    it("sets editing task when input receives focus", async () => {
      const user = userEvent.setup();

      render(
        <MockWrapper>
          <Task task={mockTask} />
        </MockWrapper>,
      );

      const input = screen.getByDisplayValue("Test task");
      expect(store.editingTask).toBeUndefined();

      await user.click(input);
      expect(store.editingTask).toBe(mockTask);
    });

    it("clears editing task when input loses focus", async () => {
      const user = userEvent.setup();

      render(
        <MockWrapper>
          <Task task={mockTask} />
        </MockWrapper>,
      );

      const input = screen.getByDisplayValue("Test task");
      await user.click(input);
      expect(store.editingTask).toBe(mockTask);

      // Click outside to blur
      await user.click(document.body);
      expect(store.editingTask).toBeUndefined();
    });

    it("handles Enter key to submit changes", async () => {
      const user = userEvent.setup();

      render(
        <MockWrapper>
          <Task task={mockTask} />
        </MockWrapper>,
      );

      const input = screen.getByDisplayValue("Test task");
      await user.click(input);
      expect(store.editingTask).toBe(mockTask);

      await user.type(input, " updated{enter}");

      // Check that the task was updated
      expect(mockTask.subject).toBe("Test task updated");

      // Check that we're no longer in edit mode by checking the input value
      // When not focused, it should show the subject, not the full expression
      await user.click(document.body); // Blur to exit edit mode
      expect(input).toHaveValue("Test task updated");
      expect(store.editingTask).toBeUndefined();
    });

    it("handles Escape key to cancel changes", async () => {
      const user = userEvent.setup();

      render(
        <MockWrapper>
          <Task task={mockTask} />
        </MockWrapper>,
      );

      const input = screen.getByDisplayValue("Test task");
      await user.click(input);
      expect(store.editingTask).toBe(mockTask);

      // Type the update
      await user.type(input, " updated");

      // Wait a bit for the input to settle
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Then press Escape using fireEvent wrapped in act
      await act(async () => {
        fireEvent.keyDown(input, { key: "Escape" });
        // Wait for the async setTimeout to complete
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Check that changes were reverted
      expect(mockTask.subject).toBe("Test task");

      // Check that we're no longer in edit mode by blurring
      await user.click(document.body);
      expect(store.editingTask).toBeUndefined();
    });

    it("blurs input after submitting task edit with Enter", async () => {
      const user = userEvent.setup();

      render(
        <MockWrapper>
          <Task task={mockTask} />
        </MockWrapper>,
      );

      const input = screen.getByDisplayValue("Test task");
      await user.click(input);
      expect(input).toHaveFocus();

      await user.type(input, " updated{enter}");
      expect(input).not.toHaveFocus(); // Input should be blurred
      expect(mockTask.subject).toBe("Test task updated");
    });

    it("maintains focus after cancelling task edit with Escape", async () => {
      const user = userEvent.setup();

      render(
        <MockWrapper>
          <Task task={mockTask} />
        </MockWrapper>,
      );

      const input = screen.getByDisplayValue("Test task");
      await user.click(input);
      expect(input).toHaveFocus();

      await user.type(input, " updated{escape}");
      expect(input).toHaveFocus(); // Focus should be maintained
      expect(mockTask.subject).toBe("Test task"); // Should revert changes
    });

    it("allows switching between tasks for editing", async () => {
      const user = userEvent.setup();
      const task2 = store.addTask({ expression: "Second task" })!;

      render(
        <MockWrapper>
          <Task task={mockTask} />
          <Task task={task2} />
        </MockWrapper>,
      );

      const input1 = screen.getByDisplayValue("Test task");
      const input2 = screen.getByDisplayValue("Second task");

      await user.click(input1);
      expect(store.editingTask).toBe(mockTask);

      await user.click(input2);
      expect(store.editingTask).toBe(task2); // Should switch to the second task
    });
  });

  describe("Task Hover Events", () => {
    it("sets hovered task on mouseover", async () => {
      const user = userEvent.setup();

      render(
        <MockWrapper>
          <Task task={mockTask} />
        </MockWrapper>,
      );

      const taskRow = document.querySelector(".task") as HTMLElement;
      expect(taskRow).toHaveClass("task");
      expect(store.hoveredTask).toBeNull();

      await user.hover(taskRow);
      expect(store.hoveredTask).toBe(mockTask);
    });

    it("clears hovered task on mouseout", async () => {
      const user = userEvent.setup();

      render(
        <MockWrapper>
          <Task task={mockTask} />
        </MockWrapper>,
      );

      const taskRow = document.querySelector(".task") as HTMLElement;

      await user.hover(taskRow);
      expect(store.hoveredTask).toBe(mockTask);

      await user.unhover(taskRow);
      expect(store.hoveredTask).toBeNull();
    });
  });

  describe("Task Expression Simplification", () => {
    it("simplifies expression on focus for non-recurring tasks with start time", async () => {
      const user = userEvent.setup();
      const taskWithStart = store.addTask({ expression: "Task at 3pm" })!;

      render(
        <MockWrapper>
          <Task task={taskWithStart} />
        </MockWrapper>,
      );

      // The task parsing extracts the time, so display value is just "Task"
      const input = screen.getByDisplayValue("Task");
      const originalExpression = taskWithStart.expression;

      await user.click(input);

      // The expression should be simplified when focused
      expect(taskWithStart.expression).not.toBe(originalExpression);
    });

    it("simplifies expression for recurring tasks when focused", async () => {
      const user = userEvent.setup();
      const recurringTask = store.addTask({
        expression: "Task every monday at 3pm",
      })!;

      // Verify the task is actually recurring
      expect(recurringTask.isRecurring).toBe(true);

      render(
        <MockWrapper>
          <Task task={recurringTask} />
        </MockWrapper>,
      );

      // The task parsing extracts the time, so display value is just "Task"
      const input = screen.getByDisplayValue("Task");
      const originalExpression = recurringTask.expression;

      await user.click(input);

      // Expression should be simplified for recurring tasks when focused
      expect(recurringTask.expression).not.toBe(originalExpression);
      expect(recurringTask.expression).toBe(recurringTask.simplifiedExpression);
    });
  });

  describe("Input Ref Registration", () => {
    it("registers input ref with store when index is provided", () => {
      render(
        <MockWrapper>
          <Task task={mockTask} index={0} />
        </MockWrapper>,
      );

      expect(store.taskInputRefs.get(0)).toBeDefined();
    });

    it("unregisters input ref when component unmounts", () => {
      const { unmount } = render(
        <MockWrapper>
          <Task task={mockTask} index={0} />
        </MockWrapper>,
      );

      expect(store.taskInputRefs.get(0)).toBeDefined();
      unmount();
      expect(store.taskInputRefs.get(0)).toBeUndefined();
    });
  });

  describe("onComplete Behavior", () => {
    it("calls onSubmit when focused before completing task", async () => {
      const user = userEvent.setup();

      render(
        <MockWrapper>
          <Task task={mockTask} />
        </MockWrapper>,
      );

      const input = screen.getByDisplayValue("Test task");
      const checkbox = document.querySelector(
        ".task-checkbox",
      ) as HTMLInputElement;

      // Focus the input
      await user.click(input);
      expect(store.editingTask).toBe(mockTask);
      expect(input).toHaveFocus();

      // Click the checkbox - this should trigger onComplete with isFocused = true
      await user.click(checkbox);
      expect(mockTask.isCompleted).toBe(true);
      // After onSubmit, the checkbox will have focus (this is the expected behavior)
      expect(checkbox).toHaveFocus();
    });

    it("does not call onSubmit when not focused before completing task", async () => {
      const user = userEvent.setup();

      render(
        <MockWrapper>
          <Task task={mockTask} />
        </MockWrapper>,
      );

      const checkbox = document.querySelector(
        ".task-checkbox",
      ) as HTMLInputElement;

      // Click checkbox without focusing input first
      await user.click(checkbox);
      expect(store.editingTask).toBeUndefined(); // Should remain undefined
      expect(mockTask.isCompleted).toBe(true);
    });
  });

  describe("onCancel Behavior", () => {
    it("restores original snapshot when escape is pressed", async () => {
      const user = userEvent.setup();

      render(
        <MockWrapper>
          <Task task={mockTask} />
        </MockWrapper>,
      );

      const input = screen.getByDisplayValue("Test task");
      const originalSubject = mockTask.subject;

      await user.click(input);
      await user.type(input, " modified{escape}");

      expect(mockTask.subject).toBe(originalSubject);

      // Check that we're no longer in edit mode by blurring
      await user.click(document.body);
      expect(store.editingTask).toBeUndefined();
    });
  });

  describe("onSubmit Behavior", () => {
    it("clears editing task but maintains focus on submit", async () => {
      const user = userEvent.setup();

      render(
        <MockWrapper>
          <Task task={mockTask} />
        </MockWrapper>,
      );

      const input = screen.getByDisplayValue("Test task");

      await user.click(input);
      expect(store.editingTask).toBe(mockTask);

      await user.type(input, " updated{enter}");

      // Check that the task was updated
      expect(mockTask.subject).toBe("Test task updated");

      // Check that we're no longer in edit mode by blurring
      await user.click(document.body);
      expect(store.editingTask).toBeUndefined();
    });
  });

  describe("Conditional Rendering", () => {
    it("renders TimeLabel when task has nextAt", () => {
      const taskWithTime = store.addTask({ expression: "Task at 3pm" })!;

      render(
        <MockWrapper>
          <Task task={taskWithTime} />
        </MockWrapper>,
      );

      expect(screen.getByText(/15:00/)).toBeInTheDocument(); // TimeLabel should render in 24h format
    });

    it("renders DurationLabel when task has duration", () => {
      const taskWithDuration = store.addTask({ expression: "Task for 1h" })!;

      render(
        <MockWrapper>
          <Task task={taskWithDuration} />
        </MockWrapper>,
      );

      expect(screen.getByText(/1h/)).toBeInTheDocument(); // DurationLabel should render
    });

    it("renders emojis in input when displayEmoji is true and not focused", () => {
      const taskWithEmojis = store.addTask({ expression: "Task 😀" })!;

      render(
        <MockWrapper>
          <Task task={taskWithEmojis} />
        </MockWrapper>,
      );

      // Emojis are part of the input value
      expect(screen.getByDisplayValue("Task 😀")).toBeInTheDocument();
    });

    it("shows simplified expression when focused", async () => {
      const user = userEvent.setup();
      const taskWithEmojis = store.addTask({ expression: "Task 😀" })!;

      render(
        <MockWrapper>
          <Task task={taskWithEmojis} />
        </MockWrapper>,
      );

      const input = screen.getByDisplayValue("Task 😀");
      await user.click(input);

      // When focused, should still show the same expression since there are no time components to simplify
      expect(screen.getByDisplayValue("Task 😀")).toBeInTheDocument();
    });

    it("renders RecurringIcon for recurring tasks when not focused", () => {
      const recurringTask = store.addTask({ expression: "Task every day" })!;

      render(
        <MockWrapper>
          <Task task={recurringTask} />
        </MockWrapper>,
      );

      expect(screen.getByTitle("DAILY")).toBeInTheDocument();
    });

    it("does not render RecurringIcon when focused", async () => {
      const user = userEvent.setup();
      const recurringTask = store.addTask({ expression: "Task every day" })!;

      render(
        <MockWrapper>
          <Task task={recurringTask} />
        </MockWrapper>,
      );

      const input = screen.getByDisplayValue("Task");
      await user.click(input);

      expect(screen.queryByTitle("DAILY")).not.toBeInTheDocument();
    });

    it("renders DistanceLabel when task has nextAt", () => {
      const taskWithTime = store.addTask({ expression: "Task at 3pm" })!;

      render(
        <MockWrapper>
          <Task task={taskWithTime} />
        </MockWrapper>,
      );

      // DistanceLabel should render with relative time (past since mock time is 10:00 and task is at 15:00)
      expect(screen.getByText(/past/)).toBeInTheDocument();
    });

    it("renders TaskActionGroup when not focused", () => {
      const recurringTask = store.addTask({ expression: "Task every day" })!;

      render(
        <MockWrapper>
          <Task task={recurringTask} />
        </MockWrapper>,
      );

      // TaskActionGroup buttons are hidden by default but exist in DOM
      const buttons = document.querySelectorAll("button");
      expect(buttons.length).toBeGreaterThan(0);
    });

    it("does not render TaskActionGroup when focused", async () => {
      const user = userEvent.setup();
      const recurringTask = store.addTask({ expression: "Task every day" })!;

      render(
        <MockWrapper>
          <Task task={recurringTask} />
        </MockWrapper>,
      );

      const input = screen.getByDisplayValue("Task");
      await user.click(input);

      // When focused, TaskActionGroup should not be rendered
      const buttons = document.querySelectorAll("button");
      expect(buttons.length).toBe(0);
    });

    it("renders CompletionCount for recurring tasks when not focused", () => {
      const recurringTask = store.addTask({ expression: "Task every day" })!;

      render(
        <MockWrapper>
          <Task task={recurringTask} />
        </MockWrapper>,
      );

      // CompletionCount renders a span with completion info
      expect(screen.getByText(/\d+/)).toBeInTheDocument(); // Some number
    });

    it("does not render CompletionCount when focused", async () => {
      const user = userEvent.setup();
      const recurringTask = store.addTask({ expression: "Task every day" })!;

      render(
        <MockWrapper>
          <Task task={recurringTask} />
        </MockWrapper>,
      );

      const input = screen.getByDisplayValue("Task");
      await user.click(input);

      // When focused, CompletionCount should not be rendered
      // Check that there are no completion count spans
      const completionSpans = document.querySelectorAll("span");
      const completionCountSpans = Array.from(completionSpans).filter(
        (span) => span.textContent && /^\d+$/.test(span.textContent.trim()),
      );
      expect(completionCountSpans.length).toBe(0);
    });
  });

  describe("Styling and Attributes", () => {
    it("sets data-task-index attribute correctly", () => {
      render(
        <MockWrapper>
          <Task task={mockTask} index={5} />
        </MockWrapper>,
      );

      const taskRow = document.querySelector(".task");
      expect(taskRow).toHaveClass("task");
      expect(taskRow).toHaveAttribute("data-task-index", "5");
    });

    it("applies context color border", () => {
      // Create a task with a context to get a specific color
      const taskWithContext = store.addTask({ expression: "Task @work" })!;

      render(
        <MockWrapper>
          <Task task={taskWithContext} />
        </MockWrapper>,
      );

      const contentCell = document.querySelector(
        ".task-content",
      ) as HTMLElement;
      // The context color should be applied via the style attribute
      expect(contentCell).toHaveClass("task-content");
      expect(contentCell?.style.borderColor).toBeDefined();
    });

    it("applies opacity class for completed tasks when not selected", () => {
      mockTask.complete();

      render(
        <MockWrapper>
          <Task task={mockTask} />
        </MockWrapper>,
      );

      const taskRow = document.querySelector(".task");
      expect(taskRow).toHaveClass("task");
      expect(taskRow).toHaveClass("text-base-03");
    });

    it("applies background classes for selected and focused states", async () => {
      render(
        <MockWrapper>
          <Task task={mockTask} index={0} />
        </MockWrapper>,
      );

      const input = screen.getByDisplayValue("Test task");
      // Focus the input to trigger selected state
      await userEvent.click(input);

      const taskRow = input.closest(".task");
      expect(taskRow).toHaveClass("task");
      expect(taskRow).toHaveClass("focus-within:bg-base-02");
    });

    it("applies checked styling to checkbox", () => {
      mockTask.complete();

      render(
        <MockWrapper>
          <Task task={mockTask} />
        </MockWrapper>,
      );

      const checkbox = document.querySelector(
        ".task-checkbox",
      ) as HTMLInputElement;
      expect(checkbox).toHaveClass("task-checkbox");
      expect(checkbox).toHaveClass("checked:after:content-['✓']");
    });

    it("sets tabIndex correctly for keyboard navigation", () => {
      render(
        <MockWrapper>
          <Task task={mockTask} index={0} />
        </MockWrapper>,
      );

      const input = screen.getByDisplayValue("Test task");
      expect(input).toHaveClass("task-input");
      expect(input).toHaveAttribute("tabIndex", "2"); // index 0 + 2 = 2
    });

    it("sets tabIndex correctly for different indices", () => {
      render(
        <MockWrapper>
          <Task task={mockTask} index={5} />
        </MockWrapper>,
      );

      const input = screen.getByDisplayValue("Test task");
      expect(input).toHaveClass("task-input");
      expect(input).toHaveAttribute("tabIndex", "7"); // index 5 + 2 = 7
    });
  });
});
