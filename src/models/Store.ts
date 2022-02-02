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

// export const Colors = ["#06b6d4", "#0ea5e9", "#10b981", "#14b8a6", "#22c55e", "#3b82f6", "#6366f1", "#84cc16", "#8b5cf6", "#a855f7", "#d946ef", "#eab308", "#ec4899", "#ef4444", "#f43f5e", "#f97316"]
// export const Colors = ["#ffbe0b","#fd8a09","#fb5607","#fd2b3b","#ff006e","#c11cad","#8338ec","#5f5ff6","#3a86ff"]
// export const Colors = ["#ff009a","#ff0000","#ff9100","#ffce32","#00c800","#00cccc","#3b78d8","#9900ff","#ec00ec"]
// export const Colors = ["#e63989","#653d8b","#f4e508","#f3aa05","#81d0dc","#e4191f","#b0151d","#ea6c39","#5fb264"]
// export const Colors = ["#54478c", "#2c699a", "#048ba8", "#0db39e", "#16db93", "#83e377", "#b9e769", "#efea5a", "#f1c453", "#f29e4c"]
export const Colors = [
  "#33a8c7",
  "#52e3e1",
  "#a0e426",
  "#fdf148",
  "#ffab00",
  "#f77976",
  "#f050ae",
  "#d883ff",
  "#9336fd",
];

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
      if (name in self) {
        self[name as keyof ITimeOfTheDaySnapshotIn] = hour;
      }
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
      return _.uniq(self.tasks.flatMap((task) => task.contexts)).filter(
        Boolean
      );
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
          const existing = result.get(day) ?? [];
          result.set(
            day,
            _.uniqBy([...existing, new Occurrence(occurrence, task)], "task.id")
          );
        });
      });

      return result;
    },

    getOccurrencesAtDay(day: DateTime): Occurrence[] {
      return _.sortBy(
        this.occurrencesByDay.get(day.startOf("day").toISODate()) ?? [],
        "date"
      );
    },

    getContextColor(context?: string) {
      if (context)
        return Colors[this.contexts.indexOf(context) % Colors.length];
      return self.useDarkMode ? "#444" : "#ccc";
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
