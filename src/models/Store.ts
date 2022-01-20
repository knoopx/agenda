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

export const Colors = [
  // "amber",
  "yellow",
  "green",
  "orange",
  "blue",
  "red",
  // "emerald",
  // "teal",
  // "cyan",
  "violet",
  "purple",
  "sky",
  "fuchsia",
  "indigo",
  "pink",
  "lime",
  "rose",
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
        [({ nextAt }) => !!nextAt, "nextAt"],
        ["asc", "asc"]
      );
    },
    get calendarStart() {
      return DateTime.now();
    },

    get calendarEnd() {
      return this.calendarStart.plus({ months: 11 }).endOf("month");
    },

    get contexts() {
      return _.uniq(self.tasks.map((task) => task.context)).filter(Boolean);
    },
    get asList() {
      return this.sortedTasks.map((task) => task.simplifiedExpression);
    },

    get occurrencesByDay(): Map<string, Occurrence[]> {
      const result = new Map();
      this.sortedTasks.forEach((task) => {
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
      return this.occurrencesByDay.get(day.startOf("day").toISODate()) ?? [];
    },

    getContextsAtDay(day: DateTime): string[] {
      return _.uniq(
        this.getOccurrencesAtDay(day)
          .map((o) => o.task.context!)
          .filter(Boolean)
      );
    },

    getContextColor(context: string | undefined) {
      return (
        Colors[this.contexts.indexOf(context) % Colors.length] ?? "neutral"
      );
    },
  }))
  .actions((self) => ({
    afterCreate() {
      // autorun(() => {
      //   Settings.defaultLocale = self.locale
      // })
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
    addTask(task: ITaskSnapshotIn) {
      self.tasks.push(task);
      return task;
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
