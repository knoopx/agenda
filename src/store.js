import { addMinutes, addMonths, endOfMonth, isSameDay } from "date-fns"
import _ from "lodash"
import { getParent, types as t } from "mobx-state-tree"
import { createContext, useContext } from "react"
import RRule from "rrule"
import { nanoid } from "nanoid"

import parser from "./parser"

const COLORS = [
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
]

const Expression = t
  .model("Expression", {
    expression: t.string,
  })
  .volatile(() => ({
    error: "",
  }))
  .actions((self) => ({
    setExpression(expression) {
      self.expression = expression
    },

    setError(error) {
      self.error = error
    },
  }))
  .views((self) => ({
    get isValid() {
      if (self.expression.length === 0) return true
      return self.error === "" && self.subject
    },

    get output() {
      if (self.expression.trim() === "") return {}

      try {
        const out = parser.parse(self.expression)
        self.setError("")
        return out
      } catch (e) {
        self.setError(e.message)
        return {}
      }
    },

    get subject() {
      return self.output?.subject
    },

    get isRecurring() {
      return !!self.output?.freq
    },

    endAt() {
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

    get rrule() {
      if (self.output) {
        const { subject, duration, ...rest } = self.output
        if (Object.keys(rest).length === 0) return null
        try {
          return new RRule(rest)
        } catch {
          return null
        }
      }
      return null
    },

    get nextAt() {
      return self.nextAfter(self.lastCompletedAt ?? new Date())
    },

    nextAfter(start) {
      return self.rrule?.after(start)
    },

    occurrences(start, end) {
      return self.rrule?.between(start, end) ?? []
    },
  }))

const Task = Expression.named("Task")
  .props({
    id: t.optional(t.identifier, () => nanoid()),
    lastCompletedAt: t.maybeNull(t.Date),
  })
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
  }))
  .views((self) => ({
    get highlightColor() {
      try {
        const store = getParent(self, 2)
        return COLORS[store.tasks.indexOf(self) % COLORS.length]
      } catch {
        return null
      }
    },
  }))

const Input = Expression.named("Input").views((self) => {
  const expressionOccurrences = self.occurrences
  return {
    get occurrences() {
      const root = getParent(self)
      return expressionOccurrences(root.calendarStart, root.calendarEnd)
    },
  }
})

export default t
  .model("Store", {
    tasks: t.array(Task),
    input: t.optional(Input, { subject: "", expression: "" }),
    locale: t.optional(t.string, "es-ES"),
    timeZone: t.optional(t.string, "Europe/Madrid"),
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
      return new Date()
    },
    get calendarEnd() {
      return addMonths(endOfMonth(new Date()), 2)
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

export const Context = createContext()

export function useStore() {
  return useContext(Context)
}
