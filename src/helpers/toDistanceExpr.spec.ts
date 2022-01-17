import { inspect } from "util"

import { expect, it } from "vitest"
import { DateTime } from "luxon"

import { toDistanceExpr } from "."

const Now = DateTime.local(2021, 1, 1)

function testtoDistanceExpr(offset: any, expected: any) {
  it(`${inspect(offset)} ${inspect(expected)}`, () => {
    expect(toDistanceExpr(Now, Now.plus(offset))).toEqual(expected)
  })
}

testtoDistanceExpr({ minutes: 1 }, "in 1 min.")
testtoDistanceExpr({ minutes: -1 }, "1 min. ago")

testtoDistanceExpr({ hours: 1 }, "in 1 hr.")
testtoDistanceExpr({ hours: -1 }, "1 hr. ago")

testtoDistanceExpr({ days: 1 }, "tomorrow")
testtoDistanceExpr({ hours: 16 }, "in 16 hr.")

testtoDistanceExpr({ days: 2 }, "Sun")
testtoDistanceExpr({ days: 15 }, "in 2 wk.")

testtoDistanceExpr({ months: 1 }, "next month")
testtoDistanceExpr({ months: 1, days: 5 }, "Feb 6")

testtoDistanceExpr({ years: 1 }, "next Jan")
testtoDistanceExpr({ years: 1, days: 5 }, "next Jan 6")

testtoDistanceExpr({ years: 3 }, "in 3 yr.")
