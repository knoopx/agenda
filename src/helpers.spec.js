import { inspect } from "util"

import { expect, describe, it } from "vitest"
import { DateTime } from "luxon"

import { formatDistance } from "./helpers"

const Now = DateTime.local(2021, 1, 1)

function testFormatDistance(offset, expected) {
  it(`${inspect(offset)} ${inspect(expected)}`, () => {
    expect(formatDistance(Now, Now.plus(offset), "UTC")).toEqual(expected)
  })
}

describe("formatDistance", () => {
  testFormatDistance({ minutes: 1 }, "in 1m")
  testFormatDistance({ minutes: -1 }, "1m ago")

  testFormatDistance({ hours: 1 }, "in 1h")
  testFormatDistance({ hours: -1 }, "1h ago")

  testFormatDistance({ days: 1 }, "tomorrow")

  testFormatDistance({ years: 1, months: 1 }, "next february")
  testFormatDistance({ years: 1, months: 1, days: 5 }, "next february")
  testFormatDistance({ years: 3 }, "in 3y")
})
