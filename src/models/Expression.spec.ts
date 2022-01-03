import { DateTime, Settings } from "luxon"
import { describe, expect, test, it } from "vitest"

import Expression from "./Expression"

const Now = DateTime.local(2020, 1, 1, 0, 0, 0)
Settings.now = () => Now.toMillis()

function make(expression: string) {
  return Expression.create({ expression })
}

test("isValid", () => {
  expect(make("").isValid).toEqual(true)
  expect(make("something").isValid).toEqual(true)
  expect(make("every monday").isValid).toEqual(true)
  expect(make("task every monday").isValid).toEqual(true)
})

test("ast", () => {
  const expr = make("something")
  expect(expr.error).toEqual("")
  expect(expr.ast).toEqual({
    subject: "something",
  })
})