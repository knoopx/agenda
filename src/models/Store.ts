import _ from "lodash";
import { Instance, types as t } from "mobx-state-tree";
import { DateTime, Settings } from "luxon";
import { autorun } from "mobx";

import Task, { ITask } from "./Task";
import Input from "./Input";

import "../schedule";
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

interface VolatileProps {
  hoveredTask: ITask | null;
}

const Store = t
  .model("Store", {
    tasks: t.array(Task),
    input: t.optional(Input, () => ({ subject: "", expression: "" })),
    locale: t.optional(t.string, "es-ES"),
    timeZone: t.optional(t.string, "Europe/Madrid"),
    agenda: t.optional(Agenda, {}),
  })
  .volatile(
    (self) =>
      ({
        hoveredTask: null,
      } as VolatileProps)
  )
  .actions((self) => ({
    afterCreate() {
      // autorun(() => {
      //   Settings.defaultLocale = self.locale
      // })
      autorun(() => {
        Settings.defaultZone = self.timeZone;
      });
    },
    addTask(task: ITask) {
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
    setHoveredTask(task: ITask) {
      self.hoveredTask = task;
    },
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

    get occurrencesByDay() {
      const result = new Map();
      this.sortedTasks.forEach((task) => {
        const occurrences = task.schedule
          ? task.schedule
              .occurrences({
                start: this.calendarStart,
                end: this.calendarEnd,
              })
              .toArray()
          : [];

        occurrences.forEach((occurrence) => {
          const day = occurrence.date.startOf("day").toISODate();
          const existing = result.get(day) ?? [];
          result.set(day, _.uniq([...existing, task]));
        });
      });
      return result;
    },

    getTasksAtDay(day: DateTime): ITask[] {
      return this.occurrencesByDay.get(day.startOf("day").toISODate()) ?? [];
    },

    getContextsAtDay(day: DateTime): string[] {
      return _.uniq(this.getTasksAtDay(day).map((task) => task.context)).filter(Boolean);
    },

    getContextColor(context: string) {
      if (context) {
        return Colors[this.contexts.indexOf(context) % Colors.length];
      }
      return "neutral";
    },
  }));

export default Store;

export interface IStore extends Instance<typeof Store> {}
