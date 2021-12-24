import { endOfYear, isSameDay, startOfYear } from "date-fns"
import _ from "lodash"
import { types as t } from "mobx-state-tree"
import { createContext, useContext } from "react"
import RRule from "rrule"

import parser from "./parser"

const Task = t
  .model("Task", {
    expression: t.string,
    lastCompletedAt: t.maybeNull(t.Date),
  })
  .volatile((self) => ({
    error: "",
  }))
  .actions((self) => ({
    update(props) {
      Object.assign(self, props)
    },
    setError(error) {
      self.error = error
    },
  }))
  .views((self) => ({
    get subject() {
      return self.output?.subject
    },
    get isValid() {
      return self.error === "" && self.subject
    },
    get isRecurring() {
      return !!self.output.freq
    },
    get isActionable() {
      // TODO
      if (self.isRecurring) {
        return self.lastCompletedAt && self.lastCompletedAt < new Date()
      }
      return true
    },
    get start() {
      return self.output?.start
    },
    get duration() {
      return self.output?.duration
    },
    get freq() {
      return self.rrule?.toText()
    },
    get output() {
      try {
        const out = parser.parse(self.expression)
        self.setError("")
        return out
      } catch (e) {
        self.setError(e.message)
        return {}
      }
    },
    get rrule() {
      if (self.isRecurring) {
        const { start, subject, duration, ...rest } = self.output
        return new RRule(rest)
      }
      return null
    },

    get nextAt() {
      return self.start ?? self.rrule?.after(new Date())
    },
  }))

const Input = t
  .model("Input", {
    task: t.optional(Task, { subject: "", expression: "" }),
    calendarStart: t.optional(t.Date, () => startOfYear(new Date())),
    calendarEnd: t.optional(t.Date, () => endOfYear(new Date())),
  })
  .views((self) => ({
    get occurrences() {
      return self.task.freq
        ? self.task.rrule.between(self.calendarStart, self.calendarEnd)
        : []
    },
  }))

export default t
  .model("Store", {
    tasks: t.array(Task),
    input: t.optional(Input, { subject: "", expression: "" }),
    locale: t.optional(t.string, "es-ES"),
  })
  .actions((self) => ({
    addTask(task) {
      self.tasks.push(task)
    },
    setLocale(locale) {
      self.locale = locale
    },
  }))
  .views((self) => ({
    dateTimeFormat(opts) {
      try {
        return new Intl.DateTimeFormat(self.locale, opts)
      } catch {
        return new Intl.DateTimeFormat("default", opts)
      }
    },
    formatTime(date) {
      return self.dateTimeFormat({ timeStyle: "short" }).format(date)
    },
    formatDate(date) {
      return self.dateTimeFormat({ date: "short" }).format(date)
    },
    formatYear(date) {
      return self.dateTimeFormat({ year: "numeric" }).format(date)
    },
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
        isSameDay(task.nextAt, new Date()),
      )
    },
    get calendarStart() {
      if (self.input.task.nextAt) {
        return self.input.task.nextAt
      }
      return new Date()
    },
  }))

export const Context = createContext()

export function useStore() {
  return useContext(Context)
}
