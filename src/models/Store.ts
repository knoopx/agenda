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
      (self as any)[name] = hour;
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
    editingTasks: t.array(Task),
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
  .volatile<StoreVolatileProps>((self) => ({
    hoveredTask: null,
  }))
  .views((self) => ({
    get sortedTasks() {
      return _.orderBy(
        self.tasks,
        [({ nextAt }) => nextAt !== null, "nextAt", "lastCompletedAt"],
        ["asc", "asc", "desc"]
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
    addEditingTask(task: ITask) {
      self.editingTasks.push(task);
    },
    removeEditingTask(task: ITask) {
      destroy(task);
    },
    copyListToClipboard() {
      navigator.clipboard.writeText(self.asList.join("\n"));
    },
    importListFromClipboard() {
      navigator.clipboard.readText().then((text) => {
        text.split(/[\r\n]+/).forEach((expression) => {
          if (expression.trim() !== "") {
            const task = Task.create({ expression });
            this.addEditingTask(task);
            const { isValid } = task;
            this.removeEditingTask(task);
            if (isValid) {
              this.addTask(task);
            }
          }
        });
      });
    },
    clearAll() {
      self.tasks.forEach(destroy);
      self.editingTasks.forEach(destroy);
    },
  }));

export default Store;

export interface IStore extends Instance<typeof Store> {}
