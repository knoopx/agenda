import { scaleOrdinal } from "d3-scale"
import {
  addMinutes,
  addMonths,
  endOfYear,
  isSameDay,
  startOfYear,
} from "date-fns"
import _, { uniqueId } from "lodash"
import { getParent, types as t } from "mobx-state-tree"
import { createContext, useContext } from "react"
import RRule from "rrule"

import parser from "./parser"

const COLORS = [
  "zinc",
  "neutral",
  "stone",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
]

const Task = t
  .model("Task", {
    id: t.optional(t.identifier, () => uniqueId("task")),
    expression: t.string,
    lastCompletedAt: t.maybeNull(t.Date),
  })
  .volatile(() => ({
    error: "",
  }))
  .actions((self) => ({
    complete() {
      if (self.isRecurring) {
        self.lastCompletedAt = self.nextAt
      } else {
        self.remove()
      }
    },
    reset() {
      self.lastCompletedAt = null
    },
    remove() {
      getParent(self, 2).removeTask(self)
    },
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
      if (self.expression.length === 0) return true
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
    get highlightColor() {
      const sum = Array.from(self.expression)
        .map((x) => x.charCodeAt(0))
        .reduce((acc, x) => acc + x, 0)

      return COLORS[sum % COLORS.length]
    },
    get start() {
      const val = self.output?.start
      if (val && val instanceof Date) return val
      return null
    },
    get endAt() {
      if (self.duration) {
        return addMinutes(self.nextAt, self.duration)
      }
      return null
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
      if (self.start) {
        return self.start
      }
      return self.nextAfter(self.lastCompletedAt ?? new Date())
    },

    nextAfter(start) {
      return self.rrule?.after(start)
    },

    occurrences(start, end) {
      return self.freq ? self.rrule.between(start, end) : [self.start]
    },
  }))

const Input = t
  .model("Input", {
    task: t.optional(Task, { subject: "", expression: "" }),
    calendarStart: t.optional(t.Date, () => new Date()),
    calendarEnd: t.optional(t.Date, () => addMonths(new Date(), 11)),
  })
  .views((self) => ({
    get occurrences() {
      return self.task.occurrences(self.calendarStart, self.calendarEnd)
    },
  }))

export default t
  .model("Store", {
    tasks: t.array(Task),
    input: t.optional(Input, { subject: "", expression: "" }),
    locale: t.optional(t.string, "es-ES"),
    timezone: t.optional(t.string, "Europe/Madrid"),
  })
  .actions((self) => ({
    addTask(task) {
      self.tasks.push(task)
    },
    removeTask(task) {
      self.tasks.remove(task)
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
    formatMonth(date) {
      return self.dateTimeFormat({ month: "long" }).format(date)
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
