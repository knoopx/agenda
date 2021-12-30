import { DateTime, Settings } from "luxon"
import { expect, it } from "vitest"

import { Store } from "."

const Now = DateTime.local(2021, 1, 1, 0, 0, 0)
Settings.now = () => Now.toMillis()

it("works", () => {
  const store = Store.create({
    tasks: [{ id: "1", expression: "task every monday" }],
  })

  expect(store.tasks.length).toEqual(1)
  expect(Array.from(store.occurrencesByDay.entries()).length).toEqual(52)
  expect(Array.from(store.occurrencesByDay.values())[0][0]).toEqual(store.tasks[0])
})