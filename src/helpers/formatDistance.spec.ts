import { inspect } from "util"

import { expect, it } from "vitest"
import { DateTime } from "luxon"

import { formatDistance } from "."

const Now = DateTime.local(2021, 1, 1)

function testFormatDistance(offset: any, expected: any) {
  it(`${inspect(offset)} ${inspect(expected)}`, () => {
    expect(formatDistance(Now, Now.plus(offset), "UTC")).toEqual(expected)
  })
}

testFormatDistance({ minutes: 1 }, "in 1 min.")
testFormatDistance({ minutes: -1 }, "1 min. ago")

testFormatDistance({ hours: 1 }, "in 1 hr.")
testFormatDistance({ hours: -1 }, "1 hr. ago")

testFormatDistance({ days: 1 }, "tomorrow")
testFormatDistance({ hours: 16 }, "in 16 hr.")

testFormatDistance({ days: 2 }, "Sun")

testFormatDistance({ months: 1 }, "next month")
testFormatDistance({ months: 1, days: 5 }, "Feb 6")

testFormatDistance({ years: 1 }, "next Jan")
testFormatDistance({ years: 1, days: 5 }, "next Jan 6")

testFormatDistance({ years: 3 }, "in 3 yr.")
