import { autorun } from "mobx"
import { types as t } from "mobx-state-tree"
import { createContext, useContext } from "react"

import parser from "./parser"

const Repeat = t.model("Repeat", {
  // seconds: t.maybeNull(t.string),
  minute: t.maybeNull(t.union(t.string, t.number)),
  hour: t.maybeNull(t.union(t.string, t.number)),
  day: t.maybeNull(t.union(t.string, t.number)),
  weekDay: t.maybeNull(t.union(t.string, t.number)),
  month: t.maybeNull(t.union(t.string, t.number)),
  year: t.maybeNull(t.union(t.string, t.number)),
})

const Task = t
  .model("Task", {
    subject: t.string,
    expression: t.string,
    error: t.optional(t.string, ""),
  })
  .actions((self) => ({
    update(props) {
      Object.assign(self, props)
    },
    setError(error) {
      self.error = error
    },
  }))
  .views((self) => ({
    get start() {
      return self.output.start
    },
    get duration() {
      return self.output.duration
    },
    get repeat() {
      return self.output.repeat
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
    get date() {
      const date = self.output.start
      if (date && date instanceof Date && !isNaN(date)) {
        return date
      }
      return null
    },
  }))

const Input = t.model("Input", {
  task: t.optional(Task, { subject: "", expression: "" }),
})

export default t
  .model("Store", {
    tasks: t.array(Task),
    input: t.optional(Input, { subject: "", expression: "" }),
  })
  .actions((self) => ({
    addTask(task) {
      self.tasks.push(task)
    },
  }))
  .views((self) => ({
    get calendarStart() {
      if (self.input.dateValid) {
        return self.input.date
      }
      return new Date()
    },
  }))

export const Context = createContext()

export function useStore() {
  return useContext(Context)
}
