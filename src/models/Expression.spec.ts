import { DateTime, Settings } from "luxon"
import { describe, expect, it } from "vitest"

import Expression from "./Expression"

const Now = DateTime.local(2020, 1, 1, 0, 0, 0)
Settings.now = () => Now.toMillis()

function make(expression: string) {
  return Expression.create({ expression })
}

it("validates", () => {
  expect(make("").isValid).toEqual(false)
  expect(make("something").isValid).toEqual(true)
  expect(make("every monday").isValid).toEqual(true)
  expect(make("task every monday").isValid).toEqual(true)
})
