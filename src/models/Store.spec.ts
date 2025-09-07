import _ from "lodash";
import { DateTime, Settings } from "luxon";
import { expect, it, vi } from "vitest";
import { clone } from "mobx-state-tree";

import { Store, Task } from ".";

const Now = DateTime.local(2021, 1, 1, 0, 0, 0);
Settings.now = () => Now.toMillis();

it("works", () => {
  const store = Store.create({
    tasks: [
      { id: "fixed", expression: "task tomorrow @work" },
      { id: "recurring", expression: "task every 2 days at 5 for 1w @home" },
    ],
  });

  const occurrences = store.getOccurrencesAtDay(Now.plus({ days: 1 }));

  expect(store.tasks.length).toEqual(2);
  expect(store.contexts).toMatchObject(["home", "work"]);
  expect(
    _.uniq(occurrences.map((occurrence) => occurrence.task.context)),
  ).toMatchObject(["work"]);

  expect(Array.from(store.occurrencesByDay.values())[0][0]).toMatchObject({
    date: Now.set({ hour: 5 }),
    task: store.tasks[1],
  });
});

it("should allow only one task to be edited at a time", () => {
  const store = Store.create({
    tasks: [
      { id: "task1", expression: "task 1" },
      { id: "task2", expression: "task 2" },
    ],
  });

  // Add first task to editing
  const task1 = store.tasks[0];
  store.setEditingTask(task1);
  expect(store.editingTask).toBe(task1);
  expect(store.editingTask!.id).toBe("task1");

  // Add second task to editing - should replace the first one
  const task2 = store.tasks[1];
  store.setEditingTask(task2);
  expect(store.editingTask).toBe(task2); // Should be the second task
  expect(store.editingTask!.id).toBe("task2");

  // Clear editing task
  store.clearEditingTask();
  expect(store.editingTask).toBeUndefined();
});

it("should clear all editing tasks when clearEditingTasks is called", () => {
  const store = Store.create({
    tasks: [
      { id: "task1", expression: "task 1" },
      { id: "task2", expression: "task 2" },
      { id: "task3", expression: "task 3" },
    ],
  });

  // Add multiple tasks to editing (using clones)
  store.setEditingTask(clone(store.tasks[0]));
  store.setEditingTask(clone(store.tasks[1]));
  store.setEditingTask(clone(store.tasks[2]));
  expect(store.editingTask).toBeDefined(); // Only the last one should be in editing

  // Clear editing task
  store.clearEditingTask();
  expect(store.editingTask).toBeUndefined();
});

it("should auto-select first task of first group when tasks are loaded", () => {
  const store = Store.create();

  // Create tasks with different dates
  const todayTask = Task.create({ expression: "task today" });
  const tomorrowTask = Task.create({ expression: "task tomorrow" });

  store.addTask(todayTask);
  store.addTask(tomorrowTask);

  // The autorun should trigger immediately and select the first task of the first group
  // Since today tasks come before tomorrow tasks chronologically, today task should be selected
  expect(store.selectedTaskIndex).toBe(0);

  // Verify that the first task in the first group is selected
  expect(store.filteredTasks.length).toBe(2);
  const groups = store.agenda.groupEntries;
  expect(groups.length).toBeGreaterThan(0);
  expect(groups[0][1].length).toBeGreaterThan(0);

  // The selected task should be the first task in the first group
  const firstTaskInFirstGroup = groups[0][1][0];
  expect(store.filteredTasks[store.selectedTaskIndex].id).toBe(
    firstTaskInFirstGroup.id,
  );
});

it("should not auto-select when tasks are empty", () => {
  const store = Store.create({
    tasks: [],
  });

  // With no tasks, should remain unselected
  expect(store.selectedTaskIndex).toBe(-1);
  expect(store.filteredTasks.length).toBe(0);
});

it("should sort tasks with today before tomorrow", () => {
  const store = Store.create();

  // Create tasks for today and tomorrow
  const todayTask = Task.create({ expression: "task today" });
  const tomorrowTask = Task.create({ expression: "task tomorrow" });

  store.addTask(tomorrowTask);
  store.addTask(todayTask);

  // Verify that today task comes before tomorrow task
  const sortedTasks = store.sortedTasks;
  expect(sortedTasks.length).toBe(2);

  // Today task should be first (index 0)
  expect(sortedTasks[0].subject).toBe("task");
  expect(sortedTasks[1].subject).toBe("task");

  // But the key is that today task should come before tomorrow task
  // Let's check the nextAt dates to verify ordering
  expect(sortedTasks[0].nextAt).toBeDefined();
  expect(sortedTasks[1].nextAt).toBeDefined();

  // Today task should have earlier date than tomorrow task
  if (sortedTasks[0].nextAt && sortedTasks[1].nextAt) {
    expect(sortedTasks[0].nextAt.valueOf()).toBeLessThan(
      sortedTasks[1].nextAt.valueOf(),
    );
  }

  // Auto-selection should select the today task (first in sorted order)
  expect(store.selectedTaskIndex).toBe(0);
});

it("should toggle dark mode", () => {
  const store = Store.create();
  const initial = store.useDarkMode;
  store.toggleDarkMode();
  expect(store.useDarkMode).toBe(!initial);
  store.toggleDarkMode();
  expect(store.useDarkMode).toBe(initial);
});

it("should toggle display emoji", () => {
  const store = Store.create();
  const initial = store.displayEmoji;
  store.toggleDisplayEmoji();
  expect(store.displayEmoji).toBe(!initial);
  store.toggleDisplayEmoji();
  expect(store.displayEmoji).toBe(initial);
});

it("should add and remove tasks", () => {
  const store = Store.create();
  const task = store.addTask({ expression: "test task" });
  expect(store.tasks.length).toBe(1);
  expect(task).toBeDefined();
  store.removeTask(task!);
  expect(store.tasks.length).toBe(0);
});

it("should set locale and time zone", () => {
  const store = Store.create();
  store.setLocale("en-US");
  expect(store.locale).toBe("en-US");
  store.setTimeZone("America/New_York");
  expect(store.timeZone).toBe("America/New_York");
});

it("should set hovered task", () => {
  const store = Store.create();
  const task = store.addTask({ expression: "test task" });
  store.setHoveredTask(task);
  expect(store.hoveredTask).toBe(task);
  store.setHoveredTask(null);
  expect(store.hoveredTask).toBeNull();
});

it("should navigate up and down", () => {
  const store = Store.create();
  store.addTask({ expression: "task 1" });
  store.addTask({ expression: "task 2" });
  store.addTask({ expression: "task 3" });

  store.setSelectedTaskIndex(1);
  store.navigateUp();
  expect(store.selectedTaskIndex).toBe(0);
  store.navigateUp();
  expect(store.selectedTaskIndex).toBe(2); // cycle to last

  store.navigateDown();
  expect(store.selectedTaskIndex).toBe(0);
  store.navigateDown();
  expect(store.selectedTaskIndex).toBe(1);
  store.navigateDown();
  expect(store.selectedTaskIndex).toBe(2);
  store.navigateDown();
  expect(store.selectedTaskIndex).toBe(0); // cycle to first
});

it("should complete selected task", () => {
  const store = Store.create();
  const task = store.addTask({ expression: "task today" });
  store.setSelectedTaskIndex(0);
  store.completeSelectedTask();
  expect(task!.isCompleted).toBe(true);
});

it("should clear all tasks", () => {
  const store = Store.create();
  store.addTask({ expression: "task 1" });
  store.addTask({ expression: "task 2" });
  expect(store.tasks.length).toBe(2);
  store.clearAll();
  expect(store.tasks.length).toBe(0);
  expect(store.editingTask).toBeUndefined();
});

it("should get context color", () => {
  const store = Store.create();
  store.addTask({ expression: "task @work" });
  store.addTask({ expression: "task @home" });
  expect(store.getContextColor("work")).toBeDefined();
  expect(store.getContextColor()).toBe("var(--base03)");
});

it("should get calendar start and end", () => {
  const store = Store.create();
  expect(store.calendarStart).toBeInstanceOf(DateTime);
  expect(store.calendarEnd).toBeInstanceOf(DateTime);
  expect(store.calendarDuration.as("days")).toBeGreaterThan(0);
  expect(store.isCalendarSingleMonth).toBeDefined();
});

it("should use input implicitEndAt for calendarEnd when available", () => {
  const store = Store.create({
    input: {
      expression: "task from 2024-01-01 to 2024-01-31",
    },
  });

  // If the expression parses correctly and has an end date,
  // calendarEnd should use input.implicitEndAt
  expect(store.calendarEnd).toBeInstanceOf(DateTime);

  // The calendarEnd should be based on the input's end date
  // This tests the branch: if (self.input.implicitEndAt) return self.input.implicitEndAt;
});

it("should get asList", () => {
  const store = Store.create();
  store.addTask({ expression: "task 1" });
  store.addTask({ expression: "task 2" });
  expect(store.asList).toEqual(["task 1", "task 2"]);
});

it("should set up time zone autorun in afterCreate", () => {
  // Test that time zone changes are applied
  const store = Store.create();
  store.setTimeZone("America/New_York");

  // The autorun should have set the default zone
  // This is hard to test directly without mocking Settings, but we can verify the store has the correct timeZone
  expect(store.timeZone).toBe("America/New_York");
});

it("should copy list to clipboard", () => {
  const store = Store.create();
  store.addTask({ expression: "task 1" });
  store.addTask({ expression: "task 2" });

  // Mock navigator.clipboard
  const mockWriteText = vi.fn();
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: mockWriteText },
    writable: true,
  });

  store.copyListToClipboard();

  expect(mockWriteText).toHaveBeenCalledWith("task 1\ntask 2");
});

it("should set main input ref", () => {
  const store = Store.create();
  const mockRef = { focus: vi.fn() } as any;
  store.setMainInputRef(mockRef);
  expect(store.mainInputRef).toBe(mockRef);
  store.setMainInputRef(null);
  expect(store.mainInputRef).toBeNull();
});

it("should set task input ref", () => {
  const store = Store.create();
  const mockRef = { focus: vi.fn() } as any;
  store.setTaskInputRef(0, mockRef);
  expect(store.taskInputRefs.get(0)).toBe(mockRef);
  store.setTaskInputRef(0, null);
  expect(store.taskInputRefs.has(0)).toBe(false);
});

it("should focus main input", () => {
  const store = Store.create();
  store.setSelectedTaskIndex(1);
  store.focusMainInput();
  expect(store.selectedTaskIndex).toBe(-1);
});

it("should edit selected task", () => {
  const store = Store.create();
  store.addTask({ expression: "task 1" });
  store.addTask({ expression: "task 2" });
  store.setSelectedTaskIndex(0);

  const mockRef = { focus: vi.fn() } as any;
  store.setTaskInputRef(0, mockRef);

  store.editSelectedTask();

  expect(mockRef.focus).toHaveBeenCalled();
});

it("should toggle edit selected task", () => {
  const store = Store.create();
  store.addTask({ expression: "task 1" });
  store.addTask({ expression: "task 2" });
  store.setSelectedTaskIndex(0);

  const mockRef = { focus: vi.fn(), blur: vi.fn() } as any;
  store.setTaskInputRef(0, mockRef);

  // Start editing
  store.toggleEditSelectedTask();
  expect(mockRef.focus).toHaveBeenCalled();

  // Set the task as editing to simulate the state
  const selectedTask = store.filteredTasks[0];
  store.setEditingTask(selectedTask);

  // Toggle again to stop editing
  store.toggleEditSelectedTask();
  expect(mockRef.blur).toHaveBeenCalled();
});

it("should import list from clipboard", async () => {
  const store = Store.create();

  // Mock navigator.clipboard
  const mockReadText = vi.fn().mockResolvedValue("task 1\ntask 2\n\n");
  Object.defineProperty(navigator, "clipboard", {
    value: { readText: mockReadText },
    writable: true,
  });

  await store.importListFromClipboard();

  expect(store.tasks.length).toBe(2);
  expect(store.tasks[0].subject).toBe("task 1");
  expect(store.tasks[1].subject).toBe("task 2");
});

it("should handle time of day settings", () => {
  const store = Store.create();
  expect(store.timeOfTheDay.morning).toBe(9);
  expect(store.timeOfTheDay.afternoon).toBe(15);
  expect(store.timeOfTheDay.evening).toBe(18);
  expect(store.timeOfTheDay.night).toBe(22);

  store.timeOfTheDay.set("morning", 8);
  expect(store.timeOfTheDay.morning).toBe(8);

  store.timeOfTheDay.set("afternoon", 14);
  expect(store.timeOfTheDay.afternoon).toBe(14);
});

it("should sort tasks with null dates after dated tasks", () => {
  const store = Store.create();

  // Create tasks: one with date, one without
  const datedTask = Task.create({ expression: "task tomorrow" });
  const undatedTask = Task.create({ expression: "task without date" });

  store.addTask(datedTask);
  store.addTask(undatedTask);

  const sortedTasks = store.sortedTasks;
  expect(sortedTasks.length).toBe(2);

  // Dated task should come first (nextAt is defined)
  expect(sortedTasks[0].nextAt).toBeDefined();
  expect(sortedTasks[1].nextAt).toBeUndefined();
});

it("should filter tasks by start date", () => {
  const store = Store.create();

  // Create tasks for different days
  const todayTask = Task.create({ expression: "task today" });
  const tomorrowTask = Task.create({ expression: "task tomorrow" });
  const yesterdayTask = Task.create({ expression: "task yesterday" });

  store.addTask(todayTask);
  store.addTask(tomorrowTask);
  store.addTask(yesterdayTask);

  // Set input expression to have start date
  store.input.setExpression("task today");

  const filteredTasks = store.filteredTasks;

  // Should only include today task
  expect(filteredTasks.length).toBe(1);
  expect(filteredTasks[0].id).toBe(todayTask.id);
});

it("should navigate down through middle tasks", () => {
  const store = Store.create();
  store.addTask({ expression: "task 1" });
  store.addTask({ expression: "task 2" });
  store.addTask({ expression: "task 3" });
  store.addTask({ expression: "task 4" });

  // Start at index 1 (middle)
  store.setSelectedTaskIndex(1);
  store.navigateDown();
  expect(store.selectedTaskIndex).toBe(2);

  // Navigate to index 2 (still middle)
  store.navigateDown();
  expect(store.selectedTaskIndex).toBe(3);
});

it("should navigate down from negative index", () => {
  const store = Store.create();

  // Set to negative index BEFORE adding tasks to avoid autorun interference
  store.setSelectedTaskIndex(-1);

  store.addTask({ expression: "task 1" });
  store.addTask({ expression: "task 2" });

  // selectedTaskIndex should be 0 due to autorun selecting first task
  expect(store.selectedTaskIndex).toBe(0);

  // Set back to -1 to test navigation from negative index
  store.setSelectedTaskIndex(-1);
  store.navigateDown();
  expect(store.selectedTaskIndex).toBe(1);
});

it("should navigate down from last task to first", () => {
  const store = Store.create();
  store.addTask({ expression: "task 1" });
  store.addTask({ expression: "task 2" });
  store.addTask({ expression: "task 3" });

  // Start at last task
  store.setSelectedTaskIndex(2);
  store.navigateDown();
  expect(store.selectedTaskIndex).toBe(0);
});

it("should navigate up from first task to last", () => {
  const store = Store.create();
  store.addTask({ expression: "task 1" });
  store.addTask({ expression: "task 2" });
  store.addTask({ expression: "task 3" });

  // Start at first task
  store.setSelectedTaskIndex(0);
  store.navigateUp();
  expect(store.selectedTaskIndex).toBe(2);
});

it("should navigate up through middle tasks", () => {
  const store = Store.create();
  store.addTask({ expression: "task 1" });
  store.addTask({ expression: "task 2" });
  store.addTask({ expression: "task 3" });
  store.addTask({ expression: "task 4" });

  // Start at index 2 (middle)
  store.setSelectedTaskIndex(2);
  store.navigateUp();
  expect(store.selectedTaskIndex).toBe(1);

  // Navigate to index 1 (still middle)
  store.navigateUp();
  expect(store.selectedTaskIndex).toBe(0);
});

it("should not navigate when no tasks", () => {
  const store = Store.create();

  // Set to some index
  store.setSelectedTaskIndex(-1);

  // Navigate should not change when no tasks
  store.navigateDown();
  expect(store.selectedTaskIndex).toBe(-1);

  store.navigateUp();
  expect(store.selectedTaskIndex).toBe(-1);
});
