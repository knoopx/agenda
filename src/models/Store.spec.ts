import _ from "lodash";
import { DateTime, Settings } from "luxon";
import { expect, it } from "vitest";
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
    _.uniq(
      occurrences.map((occurrence) => occurrence.task.context)
    )

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
    expect(store.filteredTasks[store.selectedTaskIndex].id).toBe(firstTaskInFirstGroup.id);
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
      expect(sortedTasks[0].nextAt.valueOf()).toBeLessThan(sortedTasks[1].nextAt.valueOf());
    }

    // Auto-selection should select the today task (first in sorted order)
    expect(store.selectedTaskIndex).toBe(0);
  });
