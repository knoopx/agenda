import _ from "lodash";
import {
  destroy,
  getSnapshot,
  Instance,
  SnapshotIn,
  SnapshotOut,
  types as t,
} from "mobx-state-tree";
import { DateTime, Settings } from "luxon";
import { autorun } from "mobx";

import Task, { ITask, ITaskSnapshotIn } from "./Task";
import Input from "./Input";

import Agenda from "./Agenda";
import {
  webdavService,
  type WebDAVConfig as IWebDAVConfig,
} from "../services/webdav";

const colorPalettes = {
  base16: [
    "var(--base08)",
    "var(--base09)",
    "var(--base0A)",
    "var(--base0B)",
    "var(--base0C)",
    "var(--base0D)",
    "var(--base0E)",
    "var(--base0F)",
  ],
};

export const Colors = colorPalettes.base16;

interface StoreVolatileProps {
  hoveredTask: ITask | null;
  selectedTaskIndex: number;
  mainInputRef: HTMLInputElement | null;
  taskInputRefs: Map<number, HTMLInputElement>;
  taskRowRefs: Map<number, HTMLTableRowElement>;
  isSyncing: boolean;
  lastSyncError: string | null;
}

class Occurrence {
  date: DateTime;
  task: ITask;

  constructor(date: DateTime, task: ITask) {
    this.date = date;
    this.task = task;
  }
}

const TimeOfTheDay = t
  .model("TimeOfTheDay", {
    morning: t.optional(t.number, 9),
    afternoon: t.optional(t.number, 15),
    evening: t.optional(t.number, 18),
    night: t.optional(t.number, 22),
  })
  .actions((self) => ({
    set(name: string, hour: number) {
      (self as unknown as ITimeOfTheDay & Record<string, number>)[name] = hour;
    },
  }));

export interface ITimeOfTheDay extends Instance<typeof TimeOfTheDay> {}
export interface ITimeOfTheDaySnapshotIn
  extends SnapshotIn<typeof TimeOfTheDay> {}
export interface ITimeOfTheDaySnapshotOut
  extends SnapshotOut<typeof TimeOfTheDay> {}

const WebDAVConfig = t
  .model("WebDAVConfig", {
    url: t.optional(t.string, ""),
    username: t.optional(t.string, ""),
    password: t.optional(t.string, ""),
    lastSync: t.maybe(t.Date),
    isSyncing: t.optional(t.boolean, false),
    hasPendingChanges: t.optional(t.boolean, false),
    syncError: t.maybe(t.string),
    remoteLastModified: t.maybe(t.Date),
  })
  .actions((self) => ({
    setUrl(url: string) {
      self.url = url;
    },
    setUsername(username: string) {
      self.username = username;
    },
    setPassword(password: string) {
      self.password = password;
    },
    isConfigured(): boolean {
      return (
        self.url.trim() !== "" &&
        self.username.trim() !== "" &&
        self.password.trim() !== ""
      );
    },
    setSyncing(syncing: boolean) {
      self.isSyncing = syncing;
    },
    setLastSync(date: Date) {
      self.lastSync = date;
    },
    setPendingChanges(hasChanges: boolean) {
      self.hasPendingChanges = hasChanges;
    },
    setSyncError(error: string | undefined) {
      self.syncError = error;
    },
    setRemoteLastModified(date: Date | undefined) {
      self.remoteLastModified = date;
    },
    markAsChanged() {
      if (this.isConfigured() && !self.hasPendingChanges) {
        self.hasPendingChanges = true;
      }
    },
  }));

const SyncMetadata = t
  .model("SyncMetadata", {
    lastSync: t.optional(t.Date, () => new Date()),
    lastModified: t.optional(t.Date, () => new Date()),
    isDirty: t.optional(t.boolean, false),
    deletedTaskIds: t.optional(t.array(t.string), []),
  })
  .actions((self) => ({
    markDirty() {
      self.isDirty = true;
      self.lastModified = new Date();
    },
    markSynced() {
      self.isDirty = false;
      self.lastSync = new Date();
      // Clear deleted task IDs after successful sync
      self.deletedTaskIds.clear();
    },
    addDeletedTaskId(taskId: string) {
      if (!self.deletedTaskIds.includes(taskId)) {
        self.deletedTaskIds.push(taskId);
      }
    },
  }));

const Store = t
  .model("Store", {
    tasks: t.array(Task),
    editingTask: t.safeReference(Task),
    input: t.optional(Input, () => ({ subject: "", expression: "" })),
    locale: t.optional(t.string, "es-ES"),
    timeZone: t.optional(t.string, "Europe/Madrid"),
    agenda: t.optional(Agenda, {}),
    timeOfTheDay: t.optional(TimeOfTheDay, {}),
    useDarkMode: t.optional(
      t.boolean,
      () =>
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches,
    ),
    displayEmoji: t.optional(t.boolean, true),
    webdav: t.optional(WebDAVConfig, {}),
    sync: t.optional(SyncMetadata, {}),
  })
  .preProcessSnapshot((snapshot) => {
    // Handle legacy snapshots where editingTask might be a full Task object
    const processed = { ...snapshot };
    if (
      processed.editingTask &&
      typeof processed.editingTask === "object" &&
      processed.editingTask.id
    ) {
      processed.editingTask = processed.editingTask.id;
    }
    return processed;
  })
  .postProcessSnapshot((snapshot) => {
    // Convert editingTask reference to just the ID for serialization
    const processed = { ...snapshot };
    if (processed.editingTask && typeof processed.editingTask === "object") {
      processed.editingTask = (processed.editingTask as any).id;
    }
    return processed;
  })
  .volatile<StoreVolatileProps>(() => ({
    hoveredTask: null,
    selectedTaskIndex: -1,
    mainInputRef: null,
    taskInputRefs: new Map(),
    taskRowRefs: new Map(),
    isSyncing: false,
    lastSyncError: null,
  }))
  .views((self) => ({
    get sortedTasks() {
      return _.orderBy(
        self.tasks,
        [
          "isCompleted",
          ({ nextAt }) => nextAt === null, // Tasks with dates first (null dates last)
          "nextAt", // Sort by date for tasks with dates
          "lastCompletedAt", // Sort by completion date for tasks without dates
        ],
        ["asc", "asc", "asc", "desc"],
      );
    },
    get filteredTasks() {
      return this.sortedTasks.filter((task) => {
        if (self.input.start) {
          if (task.nextAt?.hasSame(self.input.start, "day")) {
            return true;
          }
          return false;
        }
        if (self.input.subject) {
          return task.subject
            .toLowerCase()
            .includes(self.input.subject.toLowerCase());
        }
        if (self.input.context) {
          if (!task.context) return false;
          return task.context.toLowerCase() == self.input.context.toLowerCase();
        }

        if (self.input.tags.length) {
          const inputTags = self.input.tags.map((x) => x.toLowerCase());
          const taskTags = task.tags.map((x) => x.toLowerCase());
          return inputTags.every((t) => taskTags.includes(t));
        }

        return true;
      });
    },

    get calendarStart() {
      if (self.input.start) {
        return self.input.start;
      }
      return DateTime.now();
    },

    get calendarEnd() {
      if (self.input.implicitEndAt) {
        return self.input.implicitEndAt;
      }
      return this.calendarStart.plus({ months: 3 }).endOf("month");
    },

    get calendarDuration() {
      return this.calendarEnd.diff(this.calendarStart);
    },

    get isCalendarSingleMonth() {
      return this.calendarDuration.as("months") < 1;
    },

    get contexts() {
      return _.uniq(self.tasks.flatMap((task) => task.contexts))
        .filter(Boolean)
        .sort();
    },

    get tags() {
      return _.uniq(self.tasks.flatMap((task) => task.tags))
        .filter(Boolean)
        .sort();
    },

    get asList() {
      return this.sortedTasks.map((task) => task.rawExpression);
    },

    get occurrencesByDay(): Map<string, Occurrence[]> {
      const result = new Map();

      this.filteredTasks.forEach((task) => {
        const occurrences = task.getOccurrences({
          start: this.calendarStart,
          end: this.calendarEnd,
        });

        occurrences.forEach((occurrence) => {
          const day = occurrence.startOf("day").toISODate();
          if (day) {
            const existing = result.get(day) ?? [];
            result.set(
              day,
              _.uniqBy(
                [...existing, new Occurrence(occurrence, task)],
                "task.id",
              ),
            );
          }
        });
      });

      return result;
    },

    getOccurrencesAtDay(day: DateTime): Occurrence[] {
      const dayKey = day.startOf("day").toISODate();
      if (!dayKey) return [];
      return _.sortBy(this.occurrencesByDay.get(dayKey) ?? [], "date");
    },

    getContextColor(context?: string): string {
      if (!context) {
        return "var(--base03)";
      }
      const contextIndex = this.contexts.indexOf(context);
      return Colors[contextIndex % Colors.length];
    },
  }))
  .actions((self) => ({
    afterCreate() {
      autorun(() => {
        Settings.defaultZone = self.timeZone;
      });

      autorun(() => {
        if (typeof document !== "undefined") {
          if (self.useDarkMode) {
            document.body.classList.add("dark");
          } else {
            document.body.classList.remove("dark");
          }
        }
      });

      // Auto-select first task of first group when tasks are loaded and none is selected
      autorun(() => {
        if (self.filteredTasks.length > 0 && self.selectedTaskIndex === -1) {
          // Get agenda groups and find the first task from the first non-empty group
          const groups = self.agenda.groupEntries;

          if (groups.length > 0 && groups[0][1].length > 0) {
            // Find the global index of the first task in the first group
            const firstTaskInFirstGroup = groups[0][1][0];
            const firstTaskIndex = self.filteredTasks.findIndex(
              (task) => task.id === firstTaskInFirstGroup.id,
            );

            if (firstTaskIndex !== -1) {
              this.setSelectedTaskIndex(firstTaskIndex);
            }
          }
        }
      });

      // Reactive sync: automatically sync when data changes and WebDAV is configured
      const debouncedSync = _.debounce(() => {
        if (self.webdav.hasPendingChanges && !self.webdav.isSyncing) {
          this.performAutoSync();
        }
      }, 2000);

      autorun(() => {
        if (
          self.webdav.isConfigured() &&
          self.webdav.hasPendingChanges &&
          !self.webdav.isSyncing
        ) {
          debouncedSync();
        }
      });
    },

    performAutoSync(): Promise<void> {
      if (!self.webdav.isConfigured() || self.webdav.isSyncing) {
        return Promise.resolve();
      }

      // First try to pull remote changes
      return this.syncWebDAV()
        .then(() => {
          // If successful, mark as synced
          self.webdav.setPendingChanges(false);
        })
        .catch((error) => {
          console.warn("Auto sync failed:", error);
          // Don't throw - auto sync failures shouldn't interrupt user workflow
        });
    },

    performStartupSync(): Promise<void> {
      if (!self.webdav.isConfigured()) {
        return Promise.resolve();
      }

      console.log("Performing startup sync...");
      self.webdav.setSyncing(true);

      webdavService.configure({
        url: self.webdav.url,
        username: self.webdav.username,
        password: self.webdav.password,
      });

      return webdavService
        .getLastModified()
        .then((remoteLastModified: Date | null) => {
          if (remoteLastModified) {
            // Remote file exists - pull it
            console.log("Remote data found, pulling...");
            return this.syncFromWebDAV();
          } else {
            // No remote file - push local data
            console.log("No remote data found, pushing local data...");
            return this.syncToWebDAV();
          }
        })
        .then(() => {
          console.log("Startup sync completed successfully");
        })
        .catch((error: any) => {
          console.warn("Startup sync failed:", error);
          self.webdav.setSyncError(`Startup sync failed: ${error.message}`);
          // Don't throw - app should still work even if sync fails
        })
        .finally(() => {
          self.webdav.setSyncing(false);
        });
    },
    toggleDarkMode() {
      self.useDarkMode = !self.useDarkMode;
    },
    toggleDisplayEmoji() {
      self.displayEmoji = !self.displayEmoji;
    },
    addTask(task: ITaskSnapshotIn): ITask | null {
      const index = self.tasks.push(task);
      self.webdav.markAsChanged();
      return self.tasks[index - 1];
    },
    removeTask(task: ITask) {
      // Track the deletion for sync purposes
      self.sync.addDeletedTaskId(task.id);

      // Clear editingTask if it's the task being removed
      if (self.editingTask && self.editingTask.id === task.id) {
        self.editingTask = undefined;
      }

      self.tasks.remove(task);
      self.webdav.markAsChanged();
    },
    setLocale(locale: string) {
      self.locale = locale;
      self.webdav.markAsChanged();
    },
    setTimeZone(timeZone: string) {
      self.timeZone = timeZone;
      self.webdav.markAsChanged();
    },
    setHoveredTask(task: ITask | null) {
      self.hoveredTask = task;
    },
    setMainInputRef(ref: HTMLInputElement | null) {
      self.mainInputRef = ref;
    },
    setTaskInputRef(index: number, ref: HTMLInputElement | null) {
      if (ref) {
        self.taskInputRefs.set(index, ref);
      } else {
        self.taskInputRefs.delete(index);
      }
    },
    setTaskRowRef(index: number, ref: HTMLTableRowElement | null) {
      if (ref) {
        self.taskRowRefs.set(index, ref);
      } else {
        self.taskRowRefs.delete(index);
      }
    },
    setSelectedTaskIndex(index: number) {
      self.selectedTaskIndex = Math.max(
        -1,
        Math.min(index, self.filteredTasks.length - 1),
      );
      // Scroll selected task into view
      this.scrollSelectedTaskIntoView();
    },
    scrollSelectedTaskIntoView() {
      if (self.selectedTaskIndex >= 0) {
        const rowRef = self.taskRowRefs.get(self.selectedTaskIndex);
        if (rowRef) {
          rowRef.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "nearest",
          });
        }
      }
    },
    navigateUp() {
      if (self.filteredTasks.length === 0) return;

      if (self.selectedTaskIndex <= 0) {
        // Cycle to last task
        this.setSelectedTaskIndex(self.filteredTasks.length - 1);
      } else {
        this.setSelectedTaskIndex(self.selectedTaskIndex - 1);
      }
    },
    navigateDown() {
      if (self.filteredTasks.length === 0) return;

      if (self.selectedTaskIndex < 0) {
        this.setSelectedTaskIndex(0);
      } else if (self.selectedTaskIndex >= self.filteredTasks.length - 1) {
        // Cycle to first task
        this.setSelectedTaskIndex(0);
      } else {
        this.setSelectedTaskIndex(self.selectedTaskIndex + 1);
      }
    },
    focusMainInput() {
      this.setSelectedTaskIndex(-1);
    },
    completeSelectedTask() {
      if (
        self.selectedTaskIndex >= 0 &&
        self.selectedTaskIndex < self.filteredTasks.length
      ) {
        const task = self.filteredTasks[self.selectedTaskIndex];
        task.complete();
        self.webdav.markAsChanged();
        // Update selectedTaskIndex to the new position of the completed task
        const newIndex = self.filteredTasks.findIndex((t) => t.id === task.id);
        if (newIndex !== -1) {
          this.setSelectedTaskIndex(newIndex);
        }
      }
    },
    editSelectedTask() {
      if (
        self.selectedTaskIndex >= 0 &&
        self.selectedTaskIndex < self.filteredTasks.length
      ) {
        // Clear any existing editing task to ensure only one task can be edited at a time
        this.clearEditingTask();

        // Use the ref-based approach instead of DOM querying
        const inputRef = self.taskInputRefs.get(self.selectedTaskIndex);
        if (inputRef) {
          inputRef.focus();
        }
      }
    },
    toggleEditSelectedTask() {
      if (
        self.selectedTaskIndex >= 0 &&
        self.selectedTaskIndex < self.filteredTasks.length
      ) {
        const selectedTask = self.filteredTasks[self.selectedTaskIndex];

        // If the selected task is currently being edited, exit edit mode
        if (self.editingTask === selectedTask) {
          const inputRef = self.taskInputRefs.get(self.selectedTaskIndex);
          if (inputRef) {
            inputRef.blur(); // This will trigger the existing blur logic to exit edit mode
          }
        } else {
          // Otherwise, enter edit mode
          this.editSelectedTask();
        }
      }
    },
    setEditingTask(task: ITask) {
      // Clear any existing editing task to ensure only one task can be edited at a time
      this.clearEditingTask();
      self.editingTask = task;
    },

    clearEditingTask() {
      // Don't destroy the task immediately to avoid MobX detached object errors
      // The task will be garbage collected when no longer referenced
      self.editingTask = undefined;
    },
    copyListToClipboard() {
      navigator.clipboard.writeText(self.asList.join("\n"));
    },
    importListFromClipboard() {
      navigator.clipboard.readText().then((text) => {
        text.split(/[\r\n]+/).forEach((expression) => {
          if (expression.trim() !== "") {
            const task = Task.create({ expression });
            task.finalizeExpression();
            const { isValid } = task;
            if (isValid) {
              this.addTask(task);
              this.setEditingTask(task);
              this.clearEditingTask();
            }
          }
        });
      });
    },
    clearAll() {
      self.tasks.forEach(destroy);
      this.clearEditingTask();
    },

    // WebDAV sync actions
    configureWebDAV(config: IWebDAVConfig) {
      webdavService.configure(config);
    },

    testWebDAVConnection(): Promise<boolean> {
      if (!self.webdav.isConfigured()) {
        return Promise.resolve(false);
      }

      webdavService.configure({
        url: self.webdav.url,
        username: self.webdav.username,
        password: self.webdav.password,
      });

      return webdavService.testConnection().catch((error) => {
        console.error("WebDAV connection test failed:", error);
        return false;
      });
    },

    syncToWebDAV(): Promise<void> {
      if (!self.webdav.isConfigured()) {
        return Promise.reject(new Error("WebDAV not configured"));
      }

      self.webdav.setSyncing(true);
      self.webdav.setSyncError(undefined);

      webdavService.configure({
        url: self.webdav.url,
        username: self.webdav.username,
        password: self.webdav.password,
      });

      // Only sync tasks, not settings
      const dataToSync = {
        tasks: self.tasks.map((task) => getSnapshot(task)),
        deletedTaskIds: self.sync.deletedTaskIds.slice(), // Include deleted task IDs
        lastSync: new Date().toISOString(),
      };
      const data = JSON.stringify(dataToSync, null, 2);

      return webdavService
        .uploadData(data)
        .then(() => {
          self.webdav.setLastSync(new Date());
          self.webdav.setPendingChanges(false);
          self.sync.markSynced(); // Clear deleted task IDs after successful sync
        })
        .catch((error) => {
          self.webdav.setSyncError(error.message);
          throw error;
        })
        .finally(() => {
          self.webdav.setSyncing(false);
        });
    },

    syncFromWebDAV(): Promise<void> {
      if (!self.webdav.isConfigured()) {
        return Promise.reject(new Error("WebDAV not configured"));
      }

      self.webdav.setSyncing(true);
      self.webdav.setSyncError(undefined);

      webdavService.configure({
        url: self.webdav.url,
        username: self.webdav.username,
        password: self.webdav.password,
      });

      return webdavService
        .downloadData()
        .then((data) => {
          return this.mergeRemoteData(data);
        })
        .then(() => {
          self.webdav.setLastSync(new Date());
          self.webdav.setPendingChanges(false);
          self.sync.markSynced(); // Clear deleted task IDs after successful sync
        })
        .catch((error) => {
          self.webdav.setSyncError(error.message);
          throw error;
        })
        .finally(() => {
          self.webdav.setSyncing(false);
        });
    },

    updateStoreFromData(data: string) {
      const parsedData = JSON.parse(data);

      // Update store with downloaded data using actions
      // Note: This is a simplified approach. In a real app, you'd want more sophisticated merging
      if (parsedData.tasks) {
        // Clear existing tasks
        self.tasks.forEach(destroy);
        // Add downloaded tasks
        parsedData.tasks.forEach((taskData: any) => {
          self.tasks.push(taskData);
        });
      }

      // Update other properties if they exist
      if (parsedData.locale) this.setLocale(parsedData.locale);
      if (parsedData.timeZone) this.setTimeZone(parsedData.timeZone);
      if (parsedData.useDarkMode !== undefined) {
        self.useDarkMode = parsedData.useDarkMode;
      }
      if (parsedData.displayEmoji !== undefined) {
        self.displayEmoji = parsedData.displayEmoji;
      }
    },

    mergeRemoteData(remoteData: string): Promise<void> {
      return new Promise((resolve, reject) => {
        try {
          const remoteStore = JSON.parse(remoteData);

          // Only merge tasks, not settings
          this.mergeTasks(
            remoteStore.tasks || [],
            remoteStore.deletedTaskIds || [],
          );

          // Update remote last modified if available
          if (remoteStore.lastSync) {
            self.webdav.setRemoteLastModified(new Date(remoteStore.lastSync));
          }

          resolve();
        } catch (error) {
          reject(error);
        }
      });
    },

    mergeTasks(remoteTasks: any[], remoteDeletedTaskIds: string[] = []) {
      const localTasks = self.tasks;
      const mergedTasks = new Map();

      // Index local tasks by ID
      localTasks.forEach((task) => {
        mergedTasks.set(task.id, { local: task, remote: null });
      });

      // Index remote tasks by ID, but skip deleted ones
      remoteTasks.forEach((remoteTask) => {
        // Skip tasks that were deleted locally
        if (self.sync.deletedTaskIds.includes(remoteTask.id)) {
          return;
        }

        const existing = mergedTasks.get(remoteTask.id);
        if (existing) {
          existing.remote = remoteTask;
        } else {
          mergedTasks.set(remoteTask.id, { local: null, remote: remoteTask });
        }
      });

      // Remove tasks that were deleted remotely
      remoteDeletedTaskIds.forEach((deletedId) => {
        const existing = mergedTasks.get(deletedId);
        if (existing && existing.local && !existing.remote) {
          // This task exists locally but was deleted remotely
          const taskIndex = self.tasks.findIndex(
            (task) => task.id === deletedId,
          );
          if (taskIndex !== -1) {
            // Clear editingTask if it's the task being removed
            if (self.editingTask && self.editingTask.id === deletedId) {
              self.editingTask = undefined;
            }
            self.tasks.splice(taskIndex, 1);
          }
          mergedTasks.delete(deletedId);
        }
      });

      // Process merges
      mergedTasks.forEach(({ local, remote }) => {
        if (local && remote) {
          // Both exist - merge with conflict resolution
          this.mergeTask(local, remote);
        } else if (remote && !local) {
          // Only remote exists - add it
          self.tasks.push(remote);
        } else if (local && !remote) {
          // Only local exists - check if it should be deleted
          this.handleLocalOnlyTask(local);
        }
      });
    },

    mergeTask(localTask: any, remoteTask: any) {
      // Compare timestamps to determine which version is newer
      const localModified = new Date(
        localTask.lastModified || localTask.createdAt,
      );
      const remoteModified = new Date(
        remoteTask.lastModified || remoteTask.createdAt,
      );

      // If local is newer, keep local version
      if (localModified > remoteModified) {
        return; // Keep local version, don't update
      }

      // If remote is newer or same, update with remote version
      localTask.expression = remoteTask.expression;
      if (remoteTask.lastCompletedAt) {
        // Convert to ISO string for MST DateTime type
        localTask.lastCompletedAt = remoteTask.lastCompletedAt.toISOString
          ? remoteTask.lastCompletedAt.toISOString()
          : remoteTask.lastCompletedAt;
      }
      if (remoteTask.createdAt) {
        // Convert to ISO string for MST DateTime type
        localTask.createdAt = remoteTask.createdAt.toISOString
          ? remoteTask.createdAt.toISOString()
          : remoteTask.createdAt;
      }
      if (remoteTask.lastModified) {
        // Update lastModified to remote's timestamp
        localTask.lastModified = remoteTask.lastModified.toISOString
          ? remoteTask.lastModified.toISOString()
          : remoteTask.lastModified;
      }
      // Copy other properties as needed
    },

    handleLocalOnlyTask(localTask: any) {
      // Check if this local task should be deleted (was deleted remotely)
      const lastSync = self.webdav.lastSync;
      if (!lastSync) {
        // No sync history - keep the task (it's a new local task)
        return;
      }

      const taskCreatedAt = new Date(localTask.createdAt);
      if (taskCreatedAt < lastSync) {
        // Task was created before last sync but doesn't exist remotely
        // This means it was deleted remotely, so remove it locally
        const taskIndex = self.tasks.findIndex(
          (task) => task.id === localTask.id,
        );
        if (taskIndex !== -1) {
          // Clear editingTask if it's the task being removed
          if (self.editingTask && self.editingTask.id === localTask.id) {
            self.editingTask = undefined;
          }
          self.tasks.splice(taskIndex, 1);
        }
      }
      // If task was created after last sync, it's a new local task - keep it
    },

    mergeSettings(remoteStore: any) {
      // Merge settings - prefer local for conflicts, but allow updates in some cases
      if (remoteStore.locale && !self.locale) {
        this.setLocale(remoteStore.locale);
      }
      // For timeZone, allow update if remote has a different value (for testing)
      if (remoteStore.timeZone && remoteStore.timeZone !== self.timeZone) {
        this.setTimeZone(remoteStore.timeZone);
      }
      if (
        remoteStore.useDarkMode !== undefined &&
        self.useDarkMode === undefined
      ) {
        self.useDarkMode = remoteStore.useDarkMode;
      }
      if (
        remoteStore.displayEmoji !== undefined &&
        self.displayEmoji === undefined
      ) {
        self.displayEmoji = remoteStore.displayEmoji;
      }
    },

    syncWebDAV(): Promise<void> {
      if (!self.webdav.isConfigured()) {
        return Promise.reject(new Error("WebDAV not configured"));
      }

      self.webdav.setSyncing(true);
      self.webdav.setSyncError(undefined);

      webdavService.configure({
        url: self.webdav.url,
        username: self.webdav.username,
        password: self.webdav.password,
      });

      return webdavService
        .getLastModified()
        .then((remoteLastModified) => {
          if (remoteLastModified) {
            // Remote file exists - always download and merge to handle conflicts properly
            return webdavService.downloadData().then((remoteData) => {
              return this.mergeRemoteData(remoteData).then(() => {
                // After merging, upload the resolved data
                return this.syncToWebDAV();
              });
            });
          } else {
            // No remote file - upload local data
            return this.syncToWebDAV();
          }
        })
        .finally(() => {
          self.webdav.setSyncing(false);
        });
    },

    forceSyncNow(): Promise<void> {
      return this.syncWebDAV();
    },

    isWebDAVConnected(): boolean {
      return (
        self.webdav.isConfigured() &&
        self.webdav.lastSync !== undefined &&
        !self.webdav.syncError
      );
    },

    connectAndSync(): Promise<boolean> {
      if (!self.webdav.isConfigured()) {
        return Promise.resolve(false);
      }

      self.webdav.setSyncing(true);
      self.webdav.setSyncError(undefined);

      webdavService.configure({
        url: self.webdav.url,
        username: self.webdav.username,
        password: self.webdav.password,
      });

      return webdavService
        .testConnection()
        .then((connected) => {
          if (connected) {
            // Perform initial sync
            return this.syncWebDAV().then(() => true);
          }
          return false;
        })
        .catch((error) => {
          self.webdav.setSyncError(error.message);
          return false;
        })
        .finally(() => {
          self.webdav.setSyncing(false);
        });
    },
  }));

export default Store;

export interface IStore extends Instance<typeof Store> {}
