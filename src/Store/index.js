import _ from "lodash"
import { types as t } from "mobx-state-tree"
import { createContext, useContext } from "react"
import { DateTime, Settings } from "luxon"
import { autorun } from "mobx"

import { now } from "../helpers"

import Expression from "./Expression"
import Task from "./Task"
import Input from "./Input"

const Store = t
  .model("Store", {
    tasks: t.array(Task),
    input: t.optional(Input, { subject: "", expression: "" }),
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
        Settings.defaultZone = self.timeZone
      })
    },
    addTask(task) {
      self.tasks.push(task)
    },
    removeTask(task) {
      self.tasks.remove(task)
    },
    setLocale(locale) {
      self.locale = locale
    },
    setTimeZone(timeZone) {
      self.timeZone = timeZone
    },
    setHoveredTask(task) {
      self.hoveredTask = task
    },
  }))
  .views((self) => ({
    get sortedTasks() {
      return _.orderBy(
        self.tasks,
        [({ nextAt }) => !!nextAt, "nextAt"],
        ["asc", "asc"],
      )
    },
    get now() {
      return now(60 * 1000)
    },
    get calendarStart() {
      return self.now
    },
    get calendarEnd() {
      return self.now.plus({ months: 11 }).endOf("month")
    },
    get occurrencesByDay() {
      const result = new Map()
      self.tasks.forEach((task) => {
        task
          .occurrences(self.calendarStart, self.calendarEnd)
          .forEach((date) => {
            const day = DateTime.fromJSDate(date).startOf("day").toISO()
            const existing = result.get(day) ?? []
            result.set(day, Array.from(new Set([...existing, task])))
          })
      })
      return result
    },
    getTasksAtDay(day) {
      return self.occurrencesByDay.get(day.startOf("day").toISO()) ?? []
    },
  }))

export default Store
export { Task, Expression }
export const Context = createContext()

export function useStore() {
  return useContext(Context)
}
