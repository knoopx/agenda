import { getParent, types as t } from "mobx-state-tree"
import { nanoid } from "nanoid"

import Expression from "./Expression"

export const Colors = [
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
        return Colors[store.tasks.indexOf(self) % Colors.length]
      } catch {
        return null
      }
    },
  }))

export default Task
