import { DateTime, Settings } from "luxon"
import { expect, it } from "vitest"

import { Store } from "."

const Now = DateTime.local(2020, 1, 1, 0, 0, 0)
Settings.now = () => Now.toMillis()

it("works", () => {
  const store = Store.create({
    tasks: [{ id: "1", expression: "every monday" }],
  })

  expect(store.tasks.length).toEqual(1)
  expect(store.occurrences).toEqual(1)
})
