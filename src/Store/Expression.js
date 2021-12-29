import { types as t } from "mobx-state-tree"
import RRule from "rrule"
import { DateTime } from "luxon"

import grammar from "../grammar.pegjs"
import { Frequency } from "../types"

function freqToRRule(freq) {
  switch (freq) {
    case Frequency.MINUTELY:
      return RRule.MINUTELY
    case Frequency.HOURLY:
      return RRule.HOURLY
    case Frequency.DAILY:
      return RRule.DAILY
    case Frequency.WEEKLY:
      return RRule.WEEKLY
    case Frequency.MONTHLY:
      return RRule.MONTHLY
    case Frequency.YEARLY:
      return RRule.YEARLY
    default:
      throw new Error(`Unknown freq: ${freq}`)
  }
}

function asRRule(rule) {
  const { dtstart, freq, byweekday, bymonth, ...rest } = rule

  return {
    ...(freq && { freq: freqToRRule(freq) }),
    ...(byweekday && { byweekday: [6, 1, 2, 3, 4, 5, 0][byweekday] }),
    ...(bymonth && { bymonth: bymonth - 1 }),
    ...(dtstart && { dtstart: dtstart.toJSDate() }),
    ...rest,
  }
}

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
      return !self.error
    },

    get output() {
      if (self.expression.trim() === "") return { subject: "" }

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
      return self.output?.subject ?? ""
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

      try {
        const rrule = new RRule(asRRule(rule))
        self.setError(null)
        return rrule
      } catch (err) {
        self.setError(err.message)
        return null
      }
    },

    get nextAt() {
      const date = DateTime.fromJSDate(
        self.nextAfter(DateTime.fromJSDate(self.lastCompletedAt ?? new Date())),
      )
      return date.isValid ? date : null
    },

    nextAfter(start) {
      return self.rrule?.after(start.toJSDate())
    },

    occurrences(start, end) {
      return self.rrule?.between(start.toJSDate(), end.toJSDate()) ?? []
    },
  }))

export default Expression
