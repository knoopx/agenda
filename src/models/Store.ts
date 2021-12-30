import _ from "lodash";
import { Instance, types as t } from "mobx-state-tree";
import { DateTime, Settings } from "luxon";
import { autorun, toJS } from "mobx";

import { now } from "../helpers";
import { Schedule } from "../schedule";

import Task, { ITask } from "./Task";
import Input from "./Input";

import "../schedule"

const Store = t
  .model("Store", {
    tasks: t.array(Task),
    input: t.optional(Input, () => ({ subject: "", expression: "" })),
    locale: t.optional(t.string, "es-ES"),
    timeZone: t.optional(t.string, "Europe/Madrid"),
    hoveredTask: t.maybeNull(t.reference(Task)),
  })
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
    get schedule() {
      return new Schedule({
        timezone: self.timeZone,
        rrules: self.tasks.map((task) => task.rrule).filter(Boolean),
      });
    },
    get occurrences() {
      console.log({
        start: this.calendarStart.zone,
        end: this.calendarEnd.zone,
        rrule: self.tasks.map((task) => task.rrule).filter(Boolean).map(x => x.start.zone),
      })
      return (
        this.schedule
          .occurrences({
            start: this.calendarStart,
            end: this.calendarEnd,
          })
          .toArray()
      );
    },

    get occurrencesByDay() {
      const result = new Map();
      this.occurrences.forEach((occurence) => {
        const day = occurence.date.startOf("day").toISODate();
        const task = null;
        const existing = result.get(day) ?? [];
        result.set(day, Array.from(new Set([...existing, task])));
      });
      return result;
    },

    getTasksAtDay(day: DateTime): ITask[] {
      return this.occurrencesByDay.get(day.startOf("day").toISODate()) ?? [];
    },
  }));

export default Store;

export interface IStore extends Instance<typeof Store> {}
