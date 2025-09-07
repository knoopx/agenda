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
      if (self.input.start) {
        // Filter is applied, use original logic
        return this.calendarStart.plus({ months: 3 }).endOf("month");
      }
      // No filter applied, show only current month
      return this.calendarStart.endOf("month");
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
        if (typeof document !== "undefined" && document.documentElement) {
          if (self.useDarkMode) {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
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

      // Create backup before sync
      const backupData = this.createBackup();

      try {
        // Minimal sync data - only what's strictly necessary
        const dataToSync = {
          // Core application data (essential)
          tasks: self.tasks.map((task) => getSnapshot(task)),
          deletedTaskIds: self.sync.deletedTaskIds.slice(),

          // Sync metadata (essential for conflict resolution)
          lastSync: new Date().toISOString(),
        };
        const data = JSON.stringify(dataToSync, null, 2);

        return webdavService
          .uploadData(data)
          .then(() => {
            self.webdav.setLastSync(new Date());
            self.webdav.setPendingChanges(false);
            self.sync.markSynced(); // Clear deleted task IDs after successful sync
            console.log("Sync to WebDAV completed successfully");
          })
          .catch((error) => {
            console.error("Sync to WebDAV failed:", error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
            self.webdav.setSyncError(errorMessage);
            // Attempt to restore from backup if sync fails
            this.restoreFromBackup(backupData);
            throw error;
          })
          .finally(() => {
            self.webdav.setSyncing(false);
          });
      } catch (error) {
        console.error("Failed to prepare sync data:", error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to prepare sync data';
        self.webdav.setSyncError(errorMessage);
        self.webdav.setSyncing(false);
        throw error;
      }
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

      // Create backup before downloading
      const backupData = this.createBackup();

      return webdavService
        .downloadData()
        .then((data) => {
          return this.mergeRemoteData(data);
        })
        .then(() => {
          self.webdav.setLastSync(new Date());
          self.webdav.setPendingChanges(false);
          self.sync.markSynced(); // Clear deleted task IDs after successful sync
          console.log("Sync from WebDAV completed successfully");
        })
        .catch((error) => {
          console.error("Sync from WebDAV failed:", error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
          self.webdav.setSyncError(errorMessage);
          // Attempt to restore from backup if sync fails
          this.restoreFromBackup(backupData);
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

    async mergeRemoteData(remoteDataString: string): Promise<void> {
      return new Promise((resolve, reject) => {
        try {
          // Validate that remoteDataString is a valid JSON string
          if (typeof remoteDataString !== 'string' || remoteDataString.trim() === '') {
            throw new Error('Remote data is not a valid string');
          }

          const remoteStore = JSON.parse(remoteDataString);

          // Validate remote store structure
          if (typeof remoteStore !== 'object' || remoteStore === null) {
            throw new Error('Remote data is not a valid object');
          }

          // Only merge tasks, not settings
          this.mergeTasks(
            remoteStore.tasks || [],
            remoteStore.deletedTaskIds || [],
          );

          // Update remote last modified if available and valid
          if (remoteStore.lastSync) {
            const lastSyncDate = new Date(remoteStore.lastSync);
            if (!isNaN(lastSyncDate.getTime())) {
              self.webdav.setRemoteLastModified(lastSyncDate);
            }
          }

          resolve();
        } catch (error) {
          console.error('Failed to merge remote data:', error);
          reject(new Error(`Invalid remote data format: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      });
    },

    // Validate and sanitize tasks array
    validateAndSanitizeTasks(tasks: any[]): any[] {
      if (!Array.isArray(tasks)) {
        console.warn('Remote tasks is not an array, using empty array');
        return [];
      }

      return tasks.filter((task, index) => {
        if (!task || typeof task !== 'object') {
          console.warn(`Skipping invalid task at index ${index}: not an object`);
          return false;
        }

        if (!task.id || typeof task.id !== 'string') {
          console.warn(`Skipping task at index ${index}: missing or invalid id`);
          return false;
        }

        // Ensure required fields have valid defaults
        if (!task.expression || typeof task.expression !== 'string') {
          console.warn(`Task ${task.id} has invalid expression, setting default`);
          task.expression = `Task ${task.id}`;
        }

        // Validate and normalize timestamps
        if (task.createdAt) {
          const createdDate = new Date(task.createdAt);
          if (isNaN(createdDate.getTime())) {
            console.warn(`Task ${task.id} has invalid createdAt, using current time`);
            task.createdAt = new Date().toISOString();
          } else {
            task.createdAt = createdDate.toISOString();
          }
        }

        if (task.lastModified) {
          const modifiedDate = new Date(task.lastModified);
          if (isNaN(modifiedDate.getTime())) {
            console.warn(`Task ${task.id} has invalid lastModified, using createdAt or current time`);
            task.lastModified = task.createdAt || new Date().toISOString();
          } else {
            task.lastModified = modifiedDate.toISOString();
          }
        }

        // Ensure boolean fields are properly typed
        task.isCompleted = Boolean(task.isCompleted);
        task.completionCount = typeof task.completionCount === 'number' ? Math.max(0, task.completionCount) : 0;

        // Ensure array fields are properly typed
        task.tags = Array.isArray(task.tags) ? task.tags.filter((tag: any) => typeof tag === 'string') : [];

        return true;
      });
    },

    // Validate and sanitize deleted task IDs
    validateAndSanitizeDeletedIds(deletedIds: any[]): string[] {
      if (!Array.isArray(deletedIds)) {
        console.warn('Remote deletedTaskIds is not an array, using empty array');
        return [];
      }

      return deletedIds.filter((id, index) => {
        if (typeof id !== 'string' || id.trim() === '') {
          console.warn(`Skipping invalid deleted task ID at index ${index}: not a valid string`);
          return false;
        }
        return true;
      });
    },

    mergeTasks(remoteTasks: any[], remoteDeletedTaskIds: string[] = []) {
      const localTasks = self.tasks;
      const mergedTasks = new Map();
      const processedIds = new Set<string>();

      // Validate and sanitize remote data
      const sanitizedRemoteTasks = this.validateAndSanitizeTasks(remoteTasks);
      const sanitizedRemoteDeletedIds = this.validateAndSanitizeDeletedIds(remoteDeletedTaskIds);

      // Index local tasks by ID
      localTasks.forEach((task) => {
        mergedTasks.set(task.id, { local: task, remote: null });
      });

      // Index remote tasks by ID, but skip deleted ones and invalid tasks
      sanitizedRemoteTasks.forEach((remoteTask) => {
        // Skip tasks that were deleted locally
        if (self.sync.deletedTaskIds.includes(remoteTask.id)) {
          console.log(`Skipping remote task ${remoteTask.id} - deleted locally`);
          return;
        }

        const existing = mergedTasks.get(remoteTask.id);
        if (existing) {
          existing.remote = remoteTask;
        } else {
          mergedTasks.set(remoteTask.id, { local: null, remote: remoteTask });
        }
      });

      // Handle remote deletions with enhanced conflict resolution
      sanitizedRemoteDeletedIds.forEach((deletedId) => {
        const existing = mergedTasks.get(deletedId);
        if (existing && existing.local && !existing.remote) {
          // This task exists locally but was deleted remotely
          const localTask = existing.local;
          const shouldDelete = this.shouldDeleteLocalTask(localTask, deletedId);

          if (shouldDelete) {
            const taskIndex = self.tasks.findIndex((task) => task.id === deletedId);
            if (taskIndex !== -1) {
              console.log(`Deleting local task ${deletedId} - deleted remotely`);
              // Clear editingTask if it's the task being removed
              if (self.editingTask && self.editingTask.id === deletedId) {
                self.editingTask = undefined;
              }
              self.tasks.splice(taskIndex, 1);
            }
            mergedTasks.delete(deletedId);
          } else {
            console.log(`Keeping local task ${deletedId} - local version is newer`);
          }
        }
        processedIds.add(deletedId);
      });

      // Process merges with enhanced conflict resolution
      mergedTasks.forEach(({ local, remote }, taskId) => {
        if (processedIds.has(taskId)) return; // Already processed as deletion

        if (local && remote) {
          // Both exist - use last-writer-wins approach
          this.mergeTask(local, remote);
        } else if (remote && !local) {
          // Only remote exists - add it (unless it was recently deleted locally)
          if (!self.sync.deletedTaskIds.includes(remote.id)) {
            console.log(`Adding remote task ${remote.id}`);
            self.tasks.push(remote);
          }
        } else if (local && !remote) {
          // Only local exists - check if it should be deleted or kept
          this.handleLocalOnlyTask(local);
        }
      });

      console.log(`Merge completed: ${mergedTasks.size} tasks processed`);
    },

    mergeTask(localTask: any, remoteTask: any) {
      // Last-writer-wins approach: replace entire task with the most recently modified version
      const localModified = localTask.lastModified || localTask.createdAt;
      const remoteModified = remoteTask.lastModified || remoteTask.createdAt;

      const comparison = this.compareTimestampsRobust(localModified, remoteModified);

      // Always favor the last edited version (newer timestamp wins)
      if (comparison === 'local') {
        // Local is newer, keep entire local version
        return;
      }

      // Remote is newer or equal, replace entire local task with remote version

      // Use the Task's update method which handles MobX State Tree properly
      const updateData: any = {};

      // Update core properties that can be changed
      if (remoteTask.expression !== undefined) {
        updateData.expression = remoteTask.expression;
      }
      if (remoteTask.isCompleted !== undefined) {
        updateData.isCompleted = Boolean(remoteTask.isCompleted);
      }
      if (remoteTask.completionCount !== undefined) {
        updateData.completionCount = Math.max(0, Number(remoteTask.completionCount) || 0);
      }

      // Update timestamps using proper DateTime objects
      if (remoteTask.createdAt) {
        try {
          updateData.createdAt = this.parseDateTime(remoteTask.createdAt);
        } catch (error) {
          console.warn(`Could not parse createdAt for task ${localTask.id}:`, error);
        }
      }
      if (remoteTask.lastModified) {
        try {
          updateData.lastModified = this.parseDateTime(remoteTask.lastModified);
        } catch (error) {
          console.warn(`Could not parse lastModified for task ${localTask.id}:`, error);
        }
      }
      if (remoteTask.lastCompletedAt) {
        try {
          updateData.lastCompletedAt = this.parseDateTime(remoteTask.lastCompletedAt);
        } catch (error) {
          console.warn(`Could not parse lastCompletedAt for task ${localTask.id}:`, error);
        }
      }

      // Apply the updates using the Task's update method
      if (Object.keys(updateData).length > 0) {
        localTask.update(updateData);
      }
    },

    // Parse various timestamp formats into DateTime objects
    parseDateTime(timestamp: any): any {
      if (!timestamp) return DateTime.now();

      if (DateTime.isDateTime(timestamp)) return timestamp;

      if (timestamp instanceof Date) return DateTime.fromJSDate(timestamp);

      if (typeof timestamp === 'string') {
        const parsed = DateTime.fromISO(timestamp);
        if (parsed.isValid) return parsed;
      }

      if (typeof timestamp === 'number') {
        return DateTime.fromMillis(timestamp);
      }

      return DateTime.now();
    },

    // Sanitize task data to ensure consistency and validity
    sanitizeTaskData(task: any) {
      // Ensure boolean fields are properly typed
      task.isCompleted = Boolean(task.isCompleted);
      task.completionCount = typeof task.completionCount === 'number' ? Math.max(0, task.completionCount) : 0;

      // Ensure array fields are properly typed
      task.tags = Array.isArray(task.tags) ? task.tags.filter((tag: any) => typeof tag === 'string') : [];

      // Ensure string fields are properly typed
      task.expression = typeof task.expression === 'string' ? task.expression : '';
      task.context = typeof task.context === 'string' ? task.context : undefined;
      task.priority = typeof task.priority === 'string' ? task.priority : undefined;
    },

    // Determine if a local task should be deleted when it was deleted remotely
    shouldDeleteLocalTask(localTask: any, taskId: string): boolean {
      const lastSync = self.webdav.lastSync;
      if (!lastSync) {
        // No sync history - this means it's the first sync, so we should delete
        // tasks that don't exist remotely (they were never synced)
        console.log(`First sync - will delete local task ${taskId} that doesn't exist remotely`);
        return true;
      }

      const taskCreatedAt = new Date(localTask.createdAt || 0);
      const taskLastModified = new Date(localTask.lastModified || localTask.createdAt || 0);

      // If the task was created after the last sync, it means it was created locally
      // and hasn't been synced yet, so we should keep it
      if (taskCreatedAt > lastSync) {
        console.log(`Keeping local task ${taskId} - created after last sync`);
        return false;
      }

      // If the task was modified after the last sync, it means local changes haven't been synced
      // In this case, we should keep the local version (last-writer-wins) UNLESS
      // the task was explicitly deleted remotely (which is a stronger signal)
      // For now, we'll keep it to be safe - the user can manually resolve if needed
      if (taskLastModified > lastSync) {
        console.log(`Keeping local task ${taskId} - modified after last sync (potential conflict)`);
        return false;
      }

      // Task was created and last modified before the last sync, so it was deleted remotely
      // and we should delete it locally
      console.log(`Will delete local task ${taskId} - appears to be deleted remotely`);
      return true;
    },

    // Enhanced completion status merging with conflict resolution
    mergeCompletionStatus(localTask: any, remoteTask: any, originalLocalCompleted: boolean, originalLocalCompletionCount: number) {
      const remoteCompleted = remoteTask.isCompleted;
      const remoteCompletionCount = remoteTask.completionCount || 0;

      // If both have the same completion state, no conflict
      if (originalLocalCompleted === remoteCompleted && originalLocalCompletionCount === remoteCompletionCount) {
        return;
      }

      // If remote shows completion and local doesn't, apply remote completion
      if (remoteCompleted && !originalLocalCompleted) {
        localTask.isCompleted = true;
        localTask.completionCount = Math.max(originalLocalCompletionCount, remoteCompletionCount);
        if (remoteTask.lastCompletedAt) {
          localTask.lastCompletedAt = this.normalizeTimestamp(remoteTask.lastCompletedAt);
        }
        console.log(`Applied remote completion for task ${localTask.id}`);
      }
      // If local is completed but remote isn't, keep local completion (preserves user actions)
      else if (!remoteCompleted && originalLocalCompleted) {
        // Keep local completion state - user action takes precedence
        console.log(`Preserved local completion for task ${localTask.id}`);
      }
      // Both completed - merge completion counts and use the higher count
      else if (remoteCompleted && originalLocalCompleted) {
        localTask.completionCount = Math.max(originalLocalCompletionCount, remoteCompletionCount);
        // Use the more recent completion time
        if (remoteTask.lastCompletedAt && localTask.lastCompletedAt) {
          const remoteCompletionTime = this.normalizeTimestamp(remoteTask.lastCompletedAt);
          const localCompletionTime = this.normalizeTimestamp(localTask.lastCompletedAt);
          localTask.lastCompletedAt = remoteCompletionTime > localCompletionTime ? remoteCompletionTime : localCompletionTime;
        } else if (remoteTask.lastCompletedAt) {
          localTask.lastCompletedAt = this.normalizeTimestamp(remoteTask.lastCompletedAt);
        }
        console.log(`Merged completion data for task ${localTask.id}`);
      }
    },

    // Robust timestamp comparison utility with improved timezone and precision handling
    compareTimestampsRobust(localTime: any, remoteTime: any): 'local' | 'remote' | 'equal' {
      // Handle various timestamp formats and ensure UTC comparison
      const parseTimestamp = (timestamp: any): Date | null => {
        if (!timestamp) return null;

        // Handle Luxon DateTime objects
        if (timestamp && typeof timestamp === 'object' && timestamp.isLuxonDateTime) {
          return timestamp.toJSDate();
        }

        if (timestamp instanceof Date) return timestamp;

        if (typeof timestamp === 'string') {
          // Handle ISO strings and other formats
          const parsed = new Date(timestamp);
          return isNaN(parsed.getTime()) ? null : parsed;
        }

        if (typeof timestamp === 'number') {
          return new Date(timestamp);
        }

        return null;
      };

      const localDate = parseTimestamp(localTime);
      const remoteDate = parseTimestamp(remoteTime);

      // If either timestamp is invalid, consider them equal (fallback behavior)
      if (!localDate || !remoteDate) {
        console.log(`Invalid timestamps - local: ${localTime}, remote: ${remoteTime}`);
        return 'equal';
      }

      // Convert both to UTC milliseconds for accurate comparison
      const localUTC = localDate.getTime();
      const remoteUTC = remoteDate.getTime();

      // Account for potential clock skew (increased tolerance for real-world scenarios)
      const timeDiff = Math.abs(localUTC - remoteUTC);
      const clockSkewTolerance = 30000; // 30 seconds tolerance for clock differences

      if (timeDiff <= clockSkewTolerance) {
        return 'equal';
      }

      return localUTC > remoteUTC ? 'local' : 'remote';
    },

    // Normalize timestamp to ISO string format
    normalizeTimestamp(timestamp: any): string {
      if (!timestamp) return new Date().toISOString();

      if (timestamp instanceof Date) return timestamp.toISOString();

      if (typeof timestamp === 'string') {
        const parsed = new Date(timestamp);
        return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
      }

      if (typeof timestamp === 'number') {
        return new Date(timestamp).toISOString();
      }

      return new Date().toISOString();
    },

    handleLocalOnlyTask(localTask: any) {
      // Enhanced handling for tasks that exist only locally
      const lastSync = self.webdav.lastSync;
      if (!lastSync) {
        // No sync history - keep the task (it's a new local task)
        console.log(`Keeping local-only task ${localTask.id} - no sync history`);
        return;
      }

      const taskCreatedAt = new Date(localTask.createdAt || 0);
      const taskLastModified = new Date(localTask.lastModified || localTask.createdAt || 0);

      // If the task was created after the last sync, it's a new local task - keep it
      if (taskCreatedAt > lastSync) {
        console.log(`Keeping local-only task ${localTask.id} - created after last sync`);
        return;
      }

      // If the task was modified after the last sync, it has local changes - keep it
      if (taskLastModified > lastSync) {
        console.log(`Keeping local-only task ${localTask.id} - modified after last sync`);
        return;
      }

      // Task exists locally but not remotely and was last modified before last sync
      // This suggests it was deleted remotely, so remove it locally
      console.log(`Removing local-only task ${localTask.id} - appears to be deleted remotely`);
      const taskIndex = self.tasks.findIndex((task) => task.id === localTask.id);
      if (taskIndex !== -1) {
        // Clear editingTask if it's the task being removed
        if (self.editingTask && self.editingTask.id === localTask.id) {
          self.editingTask = undefined;
        }
        self.tasks.splice(taskIndex, 1);
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

      // Create backup before any sync operations
      const backupData = this.createBackup();

      return webdavService
        .getLastModified()
        .then((remoteLastModified) => {
          if (remoteLastModified) {
            // Remote file exists - check if we need to sync
            const localLastModified = self.sync.lastModified;

            if (localLastModified && remoteLastModified <= localLastModified) {
              // Local is up to date or newer, upload local changes
              console.log("Local data is up to date or newer, uploading...");
              return this.syncToWebDAV();
            } else {
              // Remote is newer, download and merge
              console.log("Remote data is newer, downloading and merging...");
              return webdavService.downloadData().then((remoteData) => {
                return this.mergeRemoteData(remoteData).then(() => {
                  // After merging, upload the resolved data
                  return this.syncToWebDAV();
                });
              });
            }
          } else {
            // No remote file - upload local data
            console.log("No remote data found, uploading local data...");
            return this.syncToWebDAV();
          }
        })
        .catch((error) => {
          console.error("Sync operation failed:", error);
          const errorMessage = this.getDetailedErrorMessage(error);
          self.webdav.setSyncError(errorMessage);
          // Restore from backup on failure
          this.restoreFromBackup(backupData);
          throw error;
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
          self.webdav.setSyncError(error instanceof Error ? error.message : 'Unknown error');
          return false;
        })
        .finally(() => {
          self.webdav.setSyncing(false);
        });
    },

    // Backup and restore methods
    createBackup(): any {
      return {
        tasks: self.tasks.map((task) => getSnapshot(task)),
        deletedTaskIds: self.sync.deletedTaskIds.slice(),
        timestamp: new Date().toISOString(),
        version: '1.0',
      };
    },

    restoreFromBackup(backup: any): void {
      if (!backup || !backup.tasks) {
        console.error("Invalid backup data");
        return;
      }

      try {
        // Clear existing tasks
        self.tasks.forEach(destroy);

        // Restore tasks from backup
        backup.tasks.forEach((taskData: any) => {
          self.tasks.push(taskData);
        });

        // Restore deleted task IDs
        if (backup.deletedTaskIds) {
          self.sync.deletedTaskIds.clear();
          backup.deletedTaskIds.forEach((id: string) => {
            self.sync.deletedTaskIds.push(id);
          });
        }

        console.log("Restored from backup successfully");
      } catch (error) {
        console.error("Failed to restore from backup:", error);
      }
    },

    getDeviceId(): string {
      // Generate or retrieve a unique device ID
      const storageKey = 'simply-do-device-id';
      let deviceId = localStorage.getItem(storageKey);

      if (!deviceId) {
        deviceId = `device-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        localStorage.setItem(storageKey, deviceId);
      }

      return deviceId;
    },

    // Enhanced error message generation
    getDetailedErrorMessage(error: any): string {
      if (!error) return 'Unknown error occurred';

      const errorMessage = error instanceof Error ? error.message : String(error);

      // Categorize error and provide helpful suggestions
      if (errorMessage.includes('401') || errorMessage.includes('403') || errorMessage.includes('Unauthorized')) {
        return 'Authentication failed. Please check your WebDAV credentials and try again.';
      }

      if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
        return 'WebDAV server or file not found. Please verify your server URL and ensure the sync directory exists.';
      }

      if (errorMessage.includes('500') || errorMessage.includes('502') || errorMessage.includes('503')) {
        return 'WebDAV server error. The server may be temporarily unavailable. Please try again later.';
      }

      if (errorMessage.includes('Network') || errorMessage.includes('fetch') || errorMessage.includes('connection')) {
        return 'Network connection failed. Please check your internet connection and try again.';
      }

      if (errorMessage.includes('corrupted') || errorMessage.includes('invalid') || errorMessage.includes('parse')) {
        return 'Sync data appears to be corrupted. The system has restored from backup. Please try syncing again.';
      }

      if (errorMessage.includes('timeout')) {
        return 'Sync operation timed out. This may be due to a slow connection or server issues. Please try again.';
      }

      return `Sync failed: ${errorMessage}`;
    },
  }));

export default Store;

export interface IStore extends Instance<typeof Store> {}
