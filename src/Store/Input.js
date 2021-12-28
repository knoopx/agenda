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
  }
})

export default Input
