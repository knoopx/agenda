import { DateTime, Settings } from "luxon";
import { expect, test } from "vitest";
import { Store, Task } from ".";

Settings.defaultZone = "Europe/Madrid";
const Now = DateTime.local(2020, 1, 1);
Settings.now = () => Now.toMillis();

test("Agenda", () => {
  const store = Store.create();
  const task = Task.create({ expression: "task every monday" });
  store.addTask(task);
  expect(store.agenda.groupEntries).toMatchObject([["next week", [task]]]);
});

test("tasks within groups are sorted by global index for keyboard navigation", () => {
  const store = Store.create();

  // Create tasks with different priorities (some completed, some with different dates)
  const task1 = Task.create({ expression: "urgent task today @work" });
  const task2 = Task.create({ expression: "completed task yesterday", isCompleted: true });
  const task3 = Task.create({ expression: "normal task tomorrow @home" });
  const task4 = Task.create({ expression: "another task today @work" });

  store.addTask(task1);
  store.addTask(task2);
  store.addTask(task3);
  store.addTask(task4);

  // Get tasks grouped by date
  const groups = store.agenda.groupEntries;

  // For each group, verify that tasks are sorted by their global index
  groups.forEach(([, tasks]) => {
    if (tasks.length > 1) {
      // Get the global indices for tasks in this group
      const groupGlobalIndices = tasks.map(task =>
        store.filteredTasks.findIndex(t => t.id === task.id)
      );

      // Verify that the tasks are in ascending global index order
      const sortedIndices = [...groupGlobalIndices].sort((a, b) => a - b);
      expect(groupGlobalIndices).toEqual(sortedIndices);
    }
  });

  // Verify that the first task in the first group has the lowest global index
  if (groups.length > 0 && groups[0][1].length > 0) {
    const firstTaskInFirstGroup = groups[0][1][0];
    const firstTaskGlobalIndex = store.filteredTasks.findIndex(t => t.id === firstTaskInFirstGroup.id);
    expect(firstTaskGlobalIndex).toBe(0); // Should be the first task globally
  }
});

test("selected task index matches agenda component order", () => {
  const store = Store.create();

  // Create tasks with different due dates to test agenda ordering
  const todayTask1 = Task.create({ expression: "today task 1 today" });
  const todayTask2 = Task.create({ expression: "today task 2 today" });
  const tomorrowTask = Task.create({ expression: "tomorrow task tomorrow" });

  store.addTask(todayTask1);
  store.addTask(todayTask2);
  store.addTask(tomorrowTask);

  // Get agenda groups
  const groups = store.agenda.groupEntries;

  // Find the first task in the first group (should be todayTask1 based on sorting)
  const firstGroupTasks = groups[0][1];
  const firstTaskInAgenda = firstGroupTasks[0];

  // This should be the first task in filteredTasks (index 0)
  const firstTaskGlobalIndex = store.filteredTasks.findIndex(t => t.id === firstTaskInAgenda.id);
  expect(firstTaskGlobalIndex).toBe(0);

  // Verify that when we select the first task, it matches the first task in agenda
  store.setSelectedTaskIndex(0);
  expect(store.selectedTaskIndex).toBe(0);
  expect(store.filteredTasks[0].id).toBe(firstTaskInAgenda.id);

  // Test navigation through agenda order
  let currentIndex = 0;
  for (const [, groupTasks] of groups) {
    for (const task of groupTasks) {
      const taskGlobalIndex = store.filteredTasks.findIndex(t => t.id === task.id);
      expect(taskGlobalIndex).toBe(currentIndex);
      currentIndex++;
    }
  }
});

test("agenda component order respects chronological group order", () => {
  const store = Store.create();

  // Create tasks with different dates - use simpler expressions that are more likely to parse correctly
  const todayTask1 = Task.create({ expression: "task today" });
  const todayTask2 = Task.create({ expression: "another task today" });
  const tomorrowTask = Task.create({ expression: "task tomorrow" });

  store.addTask(todayTask1);
  store.addTask(todayTask2);
  store.addTask(tomorrowTask);

  // Get agenda groups
  const groups = store.agenda.groupEntries;

  // Verify groups appear in chronological order
  const groupNames = groups.map(([name]) => name);
  expect(groupNames).toEqual(["today", "tomorrow"]);

  // Verify tasks within each group are sorted by global index
  for (const [, groupTasks] of groups) {
    if (groupTasks.length > 1) {
      const globalIndices = groupTasks.map(task =>
        store.filteredTasks.findIndex(t => t.id === task.id)
      );
      // Check that indices are in ascending order
      for (let i = 1; i < globalIndices.length; i++) {
        expect(globalIndices[i]).toBeGreaterThan(globalIndices[i - 1]);
      }
    }
  }

  // Test that keyboard navigation works correctly with the agenda order
  // The selectedTaskIndex should correspond to the correct task in filteredTasks
  for (let i = 0; i < store.filteredTasks.length; i++) {
    store.setSelectedTaskIndex(i);
    expect(store.selectedTaskIndex).toBe(i);
    expect(store.filteredTasks[i]).toBeDefined();
  }
});

test("agenda groups are in correct chronological order", () => {
  const store = Store.create();

  // Create tasks with different due dates to test group ordering
  const dueTask = Task.create({ expression: "overdue task yesterday" });
  const todayTask = Task.create({ expression: "task today" });
  const tomorrowTask = Task.create({ expression: "task tomorrow" });
  const laterThisWeekTask = Task.create({ expression: "task in 3 days" });
  const nextWeekTask = Task.create({ expression: "task next monday" });
  const upcomingTask = Task.create({ expression: "task in 2 weeks" });

  store.addTask(dueTask);
  store.addTask(todayTask);
  store.addTask(tomorrowTask);
  store.addTask(laterThisWeekTask);
  store.addTask(nextWeekTask);
  store.addTask(upcomingTask);

  const groups = store.agenda.groupEntries;

  // Verify groups appear in the expected chronological order
  const expectedGroupOrder = ["due", "today", "tomorrow", "later this week", "next week", "upcoming"];
  const actualGroupOrder = groups.map(([name]) => name);

  // Filter expected groups to only include those that have tasks
  const expectedGroupsWithTasks = expectedGroupOrder.filter(groupName =>
    actualGroupOrder.includes(groupName)
  );

  expect(actualGroupOrder).toEqual(expectedGroupsWithTasks);
});
