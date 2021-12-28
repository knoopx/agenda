import _ from "lodash"
import { types as t } from "mobx-state-tree"
import { createContext, useContext } from "react"
import { DateTime, Settings } from "luxon"
import { autorun } from "mobx"

import Expression from "./Expression"
import Task from "./Task"
import Input from "./Input"

const Store = t
  .model("Store", {
    tasks: t.array(Task),
    input: t.optional(Input, { subject: "", expression: "" }),
    locale: t.optional(t.string, "es-ES"),
    timeZone: t.optional(t.string, "Europe/Madrid"),
  })
  .actions((self) => ({
    afterCreate() {
      autorun(() => {
        Settings.locale = self.locale
      })
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
  }))
  .views((self) => ({
    get recurringTasks() {
      return self.tasks.filter((task) => task.isRecurring)
    },
    get nonRecurringTasks() {
      return self.tasks.filter((task) => !task.isRecurring)
    },
    get sortedTasks() {
      return _.orderBy(
        self.tasks,
        [({ nextAt }) => !!nextAt, "nextAt"],
        ["asc", "asc"],
      )
    },
    get dailyTasks() {
      return self.sortedTasks.filter((task) =>
        DateTime.now().hasSame(task.nextAt, "day"),
      )
    },
    get calendarStart() {
      return DateTime.now()
    },
    get calendarEnd() {
      return DateTime.now().plus({ months: 11 }).endOf("month")
    },
    get occurrences() {
      const result = new Map()
      self.tasks.forEach((task) => {
        task
          .occurrences(self.calendarStart, self.calendarEnd)
          .forEach((date) => {
            const existing = result.get(date) ?? []
            result.set(date, [...existing, task])
          })
      })
      return result
    },
  }))

export default Store
export { Task, Expression }
export const Context = createContext()

export function useStore() {
  return useContext(Context)
}
