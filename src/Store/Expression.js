import { types as t } from "mobx-state-tree"
import RRule from "rrule"
import { DateTime } from "luxon"

import grammar from "../grammar.pegjs"

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

export default Expression
