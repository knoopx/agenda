import _ from "lodash"
import { getParent, types as t } from "mobx-state-tree"
import { createContext, useContext } from "react"
import RRule from "rrule"
import { nanoid } from "nanoid"
import { DateTime, Settings } from "luxon"
import { autorun } from "mobx"

import grammar from "./grammar.pegjs"

export const COLORS = [
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

export const Expression = t
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
        const out = grammar.parse(self.expression)
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
        return self.nextAt.plus(self.duration)
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
      if (!self.output) return null

      const { subject, duration, ...rule } = self.output

      if (Object.keys(rule).length === 0) return null

      const { dtstart, freq, ...rest } = rule

      const props = {
        ...(dtstart && { dtstart: dtstart.toJSDate() }),
        ...rest,
      }

      try {
        return new RRule(props)
      } catch (err) {
        self.setError(err.message)
        return null
      }
    },

    get nextAt() {
      return DateTime.fromJSDate(
        self.nextAfter(DateTime.fromJSDate(self.lastCompletedAt ?? new Date())),
      )
    },

    nextAfter(start) {
      return self.rrule?.after(start.toJSDate())
    },

    occurrences(start, end) {
      return self.rrule?.between(start.toJSDate(), end.toJSDate()) ?? []
    },
  }))

export const Task = Expression.named("Task")
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

export const Input = Expression.named("Input").views((self) => {
  const expressionOccurrences = self.occurrences
  return {
    get root() {
      return getParent(self)
    },
    get occurrences() {
      return expressionOccurrences(
        self.root.calendarStart,
        self.root.calendarEnd,
      )
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
      return DateTime.now().plus({ months: 2 }).endOf("month")
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
