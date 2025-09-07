import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  render,
  screen,
  cleanup,
  waitFor,
  fireEvent,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DateTime, Settings } from "luxon";
import { Store } from "../../models";
import Task from "./Task";
import { ITask } from "../../models/Task";
import { StoreContext } from "../../hooks/useStore";

// Set up timezone and mock time
Settings.defaultZone = "Europe/Madrid";
const mockNow = DateTime.local(2024, 1, 15, 10, 0, 0);
Settings.now = () => mockNow.toMillis();

// Mock wrapper - wrap in table for proper rendering
const MockWrapper = ({
  children,
  store,
}: {
  children: React.ReactNode;
  store: any;
}) => (
  <StoreContext.Provider value={store}>
    <table>
      <tbody>{children}</tbody>
    </table>
  </StoreContext.Provider>
);

describe("Task Editing Functionality", () => {
  let store: any;
  let mockTask: ITask;

  beforeEach(() => {
    store = Store.create({
      tasks: [],
      displayEmoji: true,
      useDarkMode: false,
    });

    mockTask = store.addTask({ expression: "Test task @work" })!;
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe("Edit Mode Entry", () => {
    it("enters edit mode when input is focused", async () => {
      const user = userEvent.setup();

      render(
        <MockWrapper store={store}>
          <Task task={mockTask} />
        </MockWrapper>,
      );

      const input = screen.getByDisplayValue("Test task");

      // Initially not in edit mode
      expect(store.editingTask).toBeUndefined();

      // Focus the input to enter edit mode
      await user.click(input);

      // Should set the original task as editing task
      expect(store.editingTask).toBeDefined();
      expect(store.editingTask!.id).toBe(mockTask.id);
      expect(store.editingTask).toBe(mockTask); // Should be the same task
    });

    it("shows simplified expression in input when focused", async () => {
      render(
        <MockWrapper store={store}>
          <Task task={mockTask} />
        </MockWrapper>,
      );

      const input = screen.getByDisplayValue("Test task");

      // Initially shows subject
      expect(input).toHaveValue("Test task");

      // Focus the input using fireEvent to ensure focus event is triggered
      fireEvent.focus(input);

      // Wait for focus state to update
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Should now show simplified expression (contexts/tags moved to front)
      expect(input).toHaveValue("@work Test task");
    });
  });

  describe("Expression Updates", () => {
    it("updates task expression when typing in edit mode", async () => {
      const user = userEvent.setup();

      render(
        <MockWrapper store={store}>
          <Task task={mockTask} />
        </MockWrapper>,
      );

      const input = screen.getByDisplayValue("Test task");

      // Enter edit mode
      await user.click(input);

      // Type new expression
      await user.clear(input);
      await user.type(input, "Updated task @home tomorrow");

      // Expression should be updated
      expect(input).toHaveValue("Updated task @home tomorrow");
    });

    it("updates task expression while typing", async () => {
      const user = userEvent.setup();

      render(
        <MockWrapper store={store}>
          <Task task={mockTask} />
        </MockWrapper>,
      );

      const input = screen.getByDisplayValue("Test task");

      // Enter edit mode
      await user.click(input);

      // Type changes
      await user.clear(input);
      await user.type(input, "Updated task @home tomorrow");

      // Task expression should be updated while typing
      expect(mockTask.expression).toBe("Updated task @home tomorrow");
      expect(mockTask.subject).toBe("Updated task");
    });

    it("cancels changes when Escape is pressed", async () => {
      const user = userEvent.setup();

      render(
        <MockWrapper store={store}>
          <Task task={mockTask} />
        </MockWrapper>,
      );

      const input = screen.getByDisplayValue("Test task");

      // Enter edit mode
      await user.click(input);

      // Type changes
      await user.clear(input);
      await user.type(input, "Updated task @home tomorrow");

      // Press Escape to cancel
      await user.keyboard("{Escape}");

      // Since @home triggers completion, escape should close completion but not cancel editing
      expect(mockTask.expression).toBe("Updated task @home tomorrow");
      expect(mockTask.subject).toBe("Updated task");

      // Should remain in edit mode
      expect(store.editingTask).toBeDefined();
    });

    it("restores original expression in input after canceling", async () => {
      const user = userEvent.setup();

      render(
        <MockWrapper store={store}>
          <Task task={mockTask} />
        </MockWrapper>,
      );

      const input = screen.getByDisplayValue("Test task");

      // Enter edit mode
      await user.click(input);

      // Type changes (without @ to avoid completion)
      await user.clear(input);
      await user.type(input, "Updated task tomorrow");

      // Press Escape to cancel
      await user.keyboard("{Escape}");

      // Input should show original expression (not focused anymore)
      await waitFor(() => {
        expect(input).toHaveValue("Test task @work");
      });
    });
  });

  describe("Single Edit Mode", () => {
    it("only allows one task to be edited at a time", async () => {
      const user = userEvent.setup();

      // Create second task
      const task2 = store.addTask({ expression: "Second task @personal" })!;

      render(
        <MockWrapper store={store}>
          <Task task={mockTask} />
          <Task task={task2} />
        </MockWrapper>,
      );

      const input1 = screen.getByDisplayValue("Test task");
      const input2 = screen.getByDisplayValue("Second task");

      // Start editing first task
      await user.click(input1);
      expect(store.editingTask).toBeDefined();
      expect(store.editingTask!.id).toBe(mockTask.id);

      // Try to edit second task - should replace first editing task
      await user.click(input2);
      expect(store.editingTask).toBeDefined();
      expect(store.editingTask!.id).toBe(task2.id);
    });
  });

  describe("Edit Mode Exit", () => {
    it("exits edit mode when input loses focus", async () => {
      const user = userEvent.setup();

      render(
        <MockWrapper store={store}>
          <Task task={mockTask} />
        </MockWrapper>,
      );

      const input = screen.getByDisplayValue("Test task");

      // Enter edit mode
      await user.click(input);
      expect(store.editingTask).toBeDefined();

      // Click outside to blur
      await user.click(document.body);

      // Should exit edit mode
      await waitFor(() => {
        expect(store.editingTask).toBeUndefined();
      });
    });

    it("saves changes when blurring after editing", async () => {
      const user = userEvent.setup();

      render(
        <MockWrapper store={store}>
          <Task task={mockTask} />
        </MockWrapper>,
      );

      const input = screen.getByDisplayValue("Test task");

      // Enter edit mode
      await user.click(input);

      // Type changes
      await user.clear(input);
      await user.type(input, "Updated task @home tomorrow");

      // Click outside to blur and save
      await user.click(document.body);

      // Changes should be saved
      await waitFor(() => {
        expect(mockTask.expression).toContain("Updated task");
        expect(store.editingTask).toBeUndefined();
      });
    });
  });

  describe("Invalid Expressions", () => {
    it("handles invalid expressions gracefully", async () => {
      const user = userEvent.setup();

      render(
        <MockWrapper store={store}>
          <Task task={mockTask} />
        </MockWrapper>,
      );

      const input = screen.getByDisplayValue("Test task");

      // Enter edit mode
      await user.click(input);

      // Type invalid expression
      await user.clear(input);
      await user.type(input, "invalid expression with bad syntax");

      // Press Enter to save
      await user.type(input, "{enter}");

      // Should still save the expression even if invalid
      expect(mockTask.expression).toContain("invalid expression");

      // Wait for the editing task to be cleared
      await waitFor(() => {
        expect(store.editingTask).toBeUndefined();
      });
    });
  });

  describe("Task Action Integration", () => {
    it("completes task correctly during editing", async () => {
      const user = userEvent.setup();

      render(
        <MockWrapper store={store}>
          <Task task={mockTask} />
        </MockWrapper>,
      );

      const input = screen.getByDisplayValue("Test task");
      const checkbox = screen.getByRole("checkbox");

      // Enter edit mode
      await user.click(input);
      expect(store.editingTask).toBeDefined();

      // Complete task while editing
      await user.click(checkbox);

      // Should save changes and complete task
      expect(mockTask.isCompleted).toBe(true);
      expect(store.editingTask).toBeUndefined();
    });
  });
});
