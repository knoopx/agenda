import { DateTime } from "luxon"
import { getParent } from "mobx-state-tree"

import Expression from "./Expression"

const Input = Expression.named("Input").views((self) => {
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
    get occurrencesByDay() {
      const result = new Map()
      self.occurrences.forEach((date) => {
        const day = DateTime.fromJSDate(date).startOf("day").toISO()
        result.set(day, result.get(day) ?? 0 + 1)
      })
      return result
    },
    occurrencesAtDay(day) {
      return self.occurrencesByDay.get(day.startOf("day").toISO()) ?? 0
    },
  }
})

export default Input
