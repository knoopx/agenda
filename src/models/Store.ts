import _ from "lodash";
import {
  destroy,
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

const Store = t
  .model("Store", {
    tasks: t.array(Task),
     editingTask: t.maybe(t.reference(Task)),
    input: t.optional(Input, () => ({ subject: "", expression: "" })),
    locale: t.optional(t.string, "es-ES"),
    timeZone: t.optional(t.string, "Europe/Madrid"),
    agenda: t.optional(Agenda, {}),
    timeOfTheDay: t.optional(TimeOfTheDay, {}),
    useDarkMode: t.optional(
      t.boolean,
      () =>
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
    ),
    displayEmoji: t.optional(t.boolean, true),
  })
  .preProcessSnapshot((snapshot) => {
    // Handle legacy snapshots where editingTask might be a full Task object
    const processed = { ...snapshot };
    if (processed.editingTask && typeof processed.editingTask === 'object' && processed.editingTask.id) {
      processed.editingTask = processed.editingTask.id;
    }
    return processed;
  })
  .postProcessSnapshot((snapshot) => {
    // Convert editingTask reference to just the ID for serialization
    const processed = { ...snapshot };
    if (processed.editingTask && typeof processed.editingTask === 'object') {
      processed.editingTask = (processed.editingTask as any).id;
    }
    return processed;
  })
  .volatile<StoreVolatileProps>(() => ({
    hoveredTask: null,
    selectedTaskIndex: -1,
    mainInputRef: null,
    taskInputRefs: new Map(),
  }))
  .views((self) => ({
    get sortedTasks() {
      return _.orderBy(
        self.tasks,
        [
          "isCompleted",
          ({ nextAt }) => nextAt === null, // Tasks with dates first (null dates last)
          "nextAt", // Sort by date for tasks with dates
          "lastCompletedAt" // Sort by completion date for tasks without dates
        ],
        ["asc", "asc", "asc", "desc"]
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
      return this.calendarStart.plus({ months: 11 }).endOf("month");
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
                "task.id"
              )
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
            const firstTaskIndex = self.filteredTasks.findIndex(task => task.id === firstTaskInFirstGroup.id);

            if (firstTaskIndex !== -1) {
              this.setSelectedTaskIndex(firstTaskIndex);
            }
          }
        }
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
      return self.tasks[index - 1];
    },
    removeTask(task: ITask) {
      self.tasks.remove(task);
    },
    setLocale(locale: string) {
      self.locale = locale;
    },
    setTimeZone(timeZone: string) {
      self.timeZone = timeZone;
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
    setSelectedTaskIndex(index: number) {
      self.selectedTaskIndex = Math.max(-1, Math.min(index, self.filteredTasks.length - 1));
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
      if (self.selectedTaskIndex >= 0 && self.selectedTaskIndex < self.filteredTasks.length) {
        const task = self.filteredTasks[self.selectedTaskIndex];
        task.complete();
      }
    },
    editSelectedTask() {
      if (self.selectedTaskIndex >= 0 && self.selectedTaskIndex < self.filteredTasks.length) {
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
      if (self.selectedTaskIndex >= 0 && self.selectedTaskIndex < self.filteredTasks.length) {
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
  }));

export default Store;

export interface IStore extends Instance<typeof Store> {}
