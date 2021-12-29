import { inspect } from "util"

import { DateTime } from "luxon"
import { describe, expect, it } from "vitest"

import Expression from "./Expression"

const Now = DateTime.local(2021, 1, 1, 0, 0, 0)

function e(expression) {
  return Expression.create({ expression })
}

function testOutput(expression, expected) {
  it(`${inspect(expression)} outputs ${inspect(expected)}`, () => {
    const { output } = e(expression)
    expect(output).toEqual(expected)
  })
}

describe("output", () => {
  testOutput("every monday", {
    freq: "weekly",
    byweekday: 1,
    byhour: 0,
    byminute: 0,
  })
})

it.skip("nextAfter", () => {
  expect(e("task every monday").nextAfter(Now)).toEqual(
    DateTime.local(2021, 12, 29),
  )
})
