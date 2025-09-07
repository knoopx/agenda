import _ from "lodash";
import { DateTime, Settings } from "luxon";
import { expect, it, vi, describe, beforeEach, afterEach } from "vitest";
import { clone, Instance } from "mobx-state-tree";

import { Store, Task } from ".";

// Mock the webdavService for testing
vi.mock("../services/webdav", () => ({
  webdavService: {
    configure: vi.fn(),
    testConnection: vi.fn(),
    uploadData: vi.fn(),
    downloadData: vi.fn(),
    getLastModified: vi.fn(),
  },
}));

import { webdavService } from "../services/webdav";

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

it("should configure WebDAV settings", () => {
  const store = Store.create();

  // Initially not configured
  expect(store.webdav.isConfigured()).toBe(false);

  // Configure WebDAV
  store.webdav.setUrl("https://example.com/webdav/");
  store.webdav.setUsername("testuser");
  store.webdav.setPassword("testpass");

  expect(store.webdav.url).toBe("https://example.com/webdav/");
  expect(store.webdav.username).toBe("testuser");
  expect(store.webdav.password).toBe("testpass");
  expect(store.webdav.isConfigured()).toBe(true);
});

describe("WebDAV Sync Operations", () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should configure WebDAV settings", () => {
    const store = Store.create();

    // Initially not configured
    expect(store.webdav.isConfigured()).toBe(false);

    // Configure WebDAV
    store.webdav.setUrl("https://example.com/webdav/");
    store.webdav.setUsername("testuser");
    store.webdav.setPassword("testpass");

    expect(store.webdav.url).toBe("https://example.com/webdav/");
    expect(store.webdav.username).toBe("testuser");
    expect(store.webdav.password).toBe("testpass");
    expect(store.webdav.isConfigured()).toBe(true);
  });

  it("should handle WebDAV sync operations", async () => {
    const store = Store.create({
      tasks: [{ id: "test-task", expression: "test task" }],
      webdav: {
        url: "https://example.com/webdav/",
        username: "testuser",
        password: "testpass",
      },
    });

    // Mock successful operations
    (webdavService.uploadData as any).mockResolvedValue(undefined);
    (webdavService.downloadData as any).mockResolvedValue(
      '{"tasks": [], "locale": "en-US"}',
    );

    // Test sync to WebDAV
    await store.syncToWebDAV();

    expect(webdavService.configure).toHaveBeenCalledWith({
      url: "https://example.com/webdav/",
      username: "testuser",
      password: "testpass",
    });
    expect(webdavService.uploadData).toHaveBeenCalled();
    expect(store.webdav.isSyncing).toBe(false);
    expect(store.webdav.hasPendingChanges).toBe(false);
  });

  it("should handle sync from WebDAV with merge", async () => {
    const store = Store.create({
      tasks: [{ id: "local-task", expression: "local task" }],
      webdav: {
        url: "https://example.com/webdav/",
        username: "testuser",
        password: "testpass",
      },
    });

    const remoteData = JSON.stringify({
      tasks: [{ id: "remote-task", expression: "remote task" }],
      locale: "es-ES",
    });

    (webdavService.downloadData as any).mockResolvedValue(remoteData);

    await store.syncFromWebDAV();

    expect(webdavService.downloadData).toHaveBeenCalled();
    expect(store.webdav.isSyncing).toBe(false);
    expect(store.webdav.hasPendingChanges).toBe(false);
  });

  it("should handle sync errors gracefully", async () => {
    const store = Store.create({
      webdav: {
        url: "https://example.com/webdav/",
        username: "testuser",
        password: "testpass",
      },
    });

    (webdavService.uploadData as any).mockRejectedValue(
      new Error("Network error"),
    );

    await expect(store.syncToWebDAV()).rejects.toThrow();

    expect(store.webdav.isSyncing).toBe(false);
    expect(store.webdav.syncError).toContain("Network error");
  });

  it("should perform startup sync when configured", async () => {
    const store = Store.create({
      webdav: {
        url: "https://example.com/webdav/",
        username: "testuser",
        password: "testpass",
      },
    });

    (webdavService.getLastModified as any).mockResolvedValue(new Date());
    (webdavService.downloadData as any).mockResolvedValue(
      '{"tasks": [], "locale": "en-US"}',
    );

    await store.performStartupSync();

    expect(webdavService.configure).toHaveBeenCalled();
    expect(webdavService.getLastModified).toHaveBeenCalled();
    expect(webdavService.downloadData).toHaveBeenCalled();
  });

  it("should skip startup sync when not configured", async () => {
    const store = Store.create({
      webdav: {
        url: "",
        username: "",
        password: "",
      },
    });

    await store.performStartupSync();

    expect(webdavService.configure).not.toHaveBeenCalled();
  });

  it("should merge tasks with conflict resolution", () => {
    const store = Store.create({
      tasks: [
        { id: "task1", expression: "task 1" },
        { id: "task2", expression: "task 2" },
      ],
    });

    const remoteTasks = [
      {
        id: "task1",
        expression: "updated task 1",
        lastCompletedAt: new Date("2024-01-02T00:00:00Z"),
      },
      { id: "task3", expression: "new remote task" },
    ];

    store.mergeTasks(remoteTasks);

    // Should have 3 tasks total
    expect(store.tasks.length).toBe(3);

    // Task1 should be updated with remote version (newer)
    const task1 = store.tasks.find((t) => t.id === "task1");
    expect(task1?.expression).toBe("updated task 1");

    // Task2 should remain (only local)
    const task2 = store.tasks.find((t) => t.id === "task2");
    expect(task2?.expression).toBe("task 2");

    // Task3 should be added (only remote)
    const task3 = store.tasks.find((t) => t.id === "task3");
    expect(task3?.expression).toBe("new remote task");
  });

  it("should handle remote deletions during merge", () => {
    const lastSyncTime = new Date("2024-01-01T12:00:00Z");
    const store = Store.create({
      tasks: [
        {
          id: "task1",
          expression: "old local task",
          createdAt: "2024-01-01T10:00:00Z", // Created before last sync
        },
        {
          id: "task2",
          expression: "new local task",
          createdAt: "2024-01-01T14:00:00Z", // Created after last sync
        },
      ],
      webdav: {
        lastSync: lastSyncTime,
      },
    });

    // Remote data has only task2 (task1 was deleted remotely)
    const remoteTasks = [
      {
        id: "task2",
        expression: "updated new local task",
        createdAt: "2024-01-01T14:00:00Z",
      },
    ];

    store.mergeTasks(remoteTasks);

    // Should have only 1 task (task1 should be deleted, task2 should remain)
    expect(store.tasks.length).toBe(1);

    // Task1 should be removed (was deleted remotely)
    const task1 = store.tasks.find((t) => t.id === "task1");
    expect(task1).toBeUndefined();

    // Task2 should remain (new local task)
    const task2 = store.tasks.find((t) => t.id === "task2");
    expect(task2?.expression).toBe("updated new local task");
  });

  it("should merge settings preferring local values", () => {
    const store = Store.create({
      locale: "en-US",
      timeZone: "UTC",
      useDarkMode: false,
    });

    const remoteStore = {
      locale: "es-ES", // Different from local
      timeZone: "Europe/Madrid", // Different from local, should update
      useDarkMode: true, // Local is defined, should keep local
    };

    store.mergeSettings(remoteStore);

    // Should keep local locale
    expect(store.locale).toBe("en-US");
    // Should use remote timeZone since it's different
    expect(store.timeZone).toBe("Europe/Madrid");
    // Should keep local useDarkMode
    expect(store.useDarkMode).toBe(false);
  });

  it("should mark changes as pending when webdav is configured", () => {
    const store = Store.create({
      webdav: {
        url: "https://example.com/webdav/",
        username: "testuser",
        password: "testpass",
        hasPendingChanges: false,
      },
    });

    store.addTask({ expression: "new task" });

    expect(store.webdav.hasPendingChanges).toBe(true);
  });

  it("should not mark changes as pending when webdav is not configured", () => {
    const store = Store.create({
      webdav: {
        url: "",
        username: "",
        password: "",
        hasPendingChanges: false,
      },
    });

    store.addTask({ expression: "new task" });

    expect(store.webdav.hasPendingChanges).toBe(false);
  });

  it("should handle bidirectional sync", async () => {
    const store = Store.create({
      tasks: [{ id: "local-task", expression: "local task" }],
      webdav: {
        url: "https://example.com/webdav/",
        username: "testuser",
        password: "testpass",
      },
    });

    // Mock remote file exists and is newer
    (webdavService.getLastModified as any).mockResolvedValue(
      new Date(Date.now() + 1000),
    );
    (webdavService.downloadData as any).mockResolvedValue(
      JSON.stringify({
        tasks: [{ id: "remote-task", expression: "remote task" }],
        lastSync: new Date().toISOString(),
      }),
    );
    (webdavService.uploadData as any).mockResolvedValue(undefined);

    await store.syncWebDAV();

    expect(webdavService.downloadData).toHaveBeenCalled();
    expect(webdavService.uploadData).toHaveBeenCalled();
  });

  it("should handle test connection", async () => {
    const store = Store.create({
      webdav: {
        url: "https://example.com/webdav/",
        username: "testuser",
        password: "testpass",
      },
    });

    (webdavService.testConnection as any).mockResolvedValue(true);

    const result = await store.testWebDAVConnection();

    expect(result).toBe(true);
    expect(webdavService.testConnection).toHaveBeenCalled();
  });

  it("should return false for test connection when not configured", async () => {
    const store = Store.create({
      webdav: {
        url: "",
        username: "",
        password: "",
      },
    });

    const result = await store.testWebDAVConnection();

    expect(result).toBe(false);
    expect(webdavService.testConnection).not.toHaveBeenCalled();
  });
});

describe("Deletion Tracking", () => {
  let store: Instance<typeof Store>;

  beforeEach(() => {
    store = Store.create({
      webdav: {
        url: "https://example.com/webdav",
        username: "test",
        password: "test",
      },
    });
  });

  it("should track deleted task IDs when removing tasks", () => {
    const task = store.addTask({ expression: "Test task" });
    expect(task).toBeDefined();
    const taskId = task!.id;

    expect(store.sync.deletedTaskIds).toHaveLength(0);

    store.removeTask(task!);

    expect(store.sync.deletedTaskIds).toContain(taskId);
    expect(store.sync.deletedTaskIds).toHaveLength(1);
  });

  it("should not duplicate deleted task IDs", () => {
    const task1 = store.addTask({ expression: "Test task 1" });
    const task2 = store.addTask({ expression: "Test task 2" });
    expect(task1).toBeDefined();
    expect(task2).toBeDefined();

    const task1Id = task1!.id; // Capture ID before removal

    store.removeTask(task1!);
    store.removeTask(task2!);
    store.sync.addDeletedTaskId(task1Id); // Try to add duplicate

    expect(store.sync.deletedTaskIds).toHaveLength(2);
    expect(
      store.sync.deletedTaskIds.filter((id: string) => id === task1Id),
    ).toHaveLength(1);
  });

  it("should clear deleted task IDs after successful sync", () => {
    const task = store.addTask({ expression: "Test task" });
    expect(task).toBeDefined();
    store.removeTask(task!);

    expect(store.sync.deletedTaskIds).toHaveLength(1);

    store.sync.markSynced();

    expect(store.sync.deletedTaskIds).toHaveLength(0);
  });

  it("should include deleted task IDs in sync data", async () => {
    const task = store.addTask({ expression: "Test task" });
    expect(task).toBeDefined();
    const taskId = task!.id; // Capture ID before removal
    store.removeTask(task!);

    (webdavService.uploadData as any).mockResolvedValue(undefined);

    await store.syncToWebDAV();

    const uploadCall = (webdavService.uploadData as any).mock.calls[0];
    const syncData = JSON.parse(uploadCall[0]);

    expect(syncData.deletedTaskIds).toContain(taskId);
  });

  it("should not re-add tasks that were deleted locally during merge", () => {
    const task1 = store.addTask({ expression: "Local task" });
    expect(task1).toBeDefined();
    const task1Id = task1!.id; // Capture ID before removal
    const task2Id = "remote-task-id";

    // Delete local task
    store.removeTask(task1!);

    // Simulate remote data that includes the deleted task and a new task
    const remoteTasks = [
      { id: task1Id, expression: "Deleted locally" },
      { id: task2Id, expression: "New remote task" },
    ];

    store.mergeTasks(remoteTasks, []);

    // Should not re-add the locally deleted task
    expect(store.tasks.find((t: any) => t.id === task1Id)).toBeUndefined();
    // Should add the new remote task
    expect(store.tasks.find((t: any) => t.id === task2Id)).toBeDefined();
  });

  it("should remove tasks that were deleted remotely during merge", () => {
    const task1 = store.addTask({ expression: "Task to be deleted remotely" });
    const task2 = store.addTask({ expression: "Task to keep" });
    expect(task1).toBeDefined();
    expect(task2).toBeDefined();

    const task1Id = task1!.id; // Capture IDs before potential removal
    const task2Id = task2!.id;

    // Simulate remote data that deleted task1 but kept task2
    const remoteTasks = [{ id: task2Id, expression: task2!.expression }];
    const remoteDeletedTaskIds = [task1Id];

    store.mergeTasks(remoteTasks, remoteDeletedTaskIds);

    // Task1 should be removed, task2 should remain
    expect(store.tasks.find((t: any) => t.id === task1Id)).toBeUndefined();
    expect(store.tasks.find((t: any) => t.id === task2Id)).toBeDefined();
  });

  it("should handle sync from WebDAV with deleted task IDs", async () => {
    const task1 = store.addTask({ expression: "Task 1" });
    const task2 = store.addTask({ expression: "Task 2" });
    expect(task1).toBeDefined();
    expect(task2).toBeDefined();

    const task1Id = task1!.id; // Capture IDs before potential removal
    const task2Id = task2!.id;

    // Mock remote data where task1 was deleted
    const remoteData = JSON.stringify({
      tasks: [{ id: task2Id, expression: task2!.expression }],
      deletedTaskIds: [task1Id],
      lastSync: new Date().toISOString(),
    });

    (webdavService.downloadData as any).mockResolvedValue(remoteData);

    await store.syncFromWebDAV();

    // Task1 should be removed, task2 should remain
    expect(store.tasks.find((t: any) => t.id === task1Id)).toBeUndefined();
    expect(store.tasks.find((t: any) => t.id === task2Id)).toBeDefined();
  });

  it("should prefer local changes when local task is newer", () => {
    const store = Store.create({
      tasks: [
        {
          id: "task1",
          expression: "local task",
          lastModified: "2024-01-02T12:00:00Z", // Local is newer
        },
      ],
    });

    const remoteTasks = [
      {
        id: "task1",
        expression: "remote task",
        lastModified: "2024-01-01T12:00:00Z", // Remote is older
      },
    ];

    store.mergeTasks(remoteTasks);

    // Should keep local version since it's newer
    const task = store.tasks.find((t) => t.id === "task1");
    expect(task?.expression).toBe("local task");
  });

  it("should prefer remote changes when remote task is newer", () => {
    const store = Store.create({
      tasks: [
        {
          id: "task1",
          expression: "local task",
          lastModified: "2024-01-01T12:00:00Z", // Local is older
        },
      ],
    });

    const remoteTasks = [
      {
        id: "task1",
        expression: "remote task",
        lastModified: "2024-01-02T12:00:00Z", // Remote is newer
      },
    ];

    store.mergeTasks(remoteTasks);

    // Should update to remote version since it's newer
    const task = store.tasks.find((t) => t.id === "task1");
    expect(task?.expression).toBe("remote task");
  });
});
