import { inspect } from "util"

import { expect, describe, it } from "vitest"
import { DateTime, Duration } from "luxon"

import grammar from "./grammar.pegjs"
import { Frequency } from "./types"

const Now = DateTime.local(2021, 1, 1)

function parse(input, startRule = "Root") {
  try {
    return grammar.parse(input, {
      grammarSource: "",
      startRule,
      now: Now,
    })
  } catch (e) {
    if (typeof e.format === "function") {
      throw new Error(e.format([{ source: "", text: input }]))
    } else {
      throw e
    }
  }
}

function testRule(name, cb) {
  const assertions = []
  const assert = (input, expected) => {
    assertions.push([input, expected])
  }

  cb(assert)

  describe(name, () => {
    assertions.forEach(([input, expected]) => {
      it(`parses ${inspect(input)}`, () => {
        expect(parse(input, name)).toEqual(expected)
        expect(parse(input.toUpperCase(), name)).toEqual(expected)
      })
    })
  })
}

// edge cases
// testParse("NaturalTimeExpr", "", {})
// testParse("NaturalTimeExpr", " ", {})

testRule("ForExpr", (assert) => {
  assert("for 1h", { duration: Duration.fromObject({ hours: 1 }) })
  assert("for 4 minutes", { duration: Duration.fromObject({ minutes: 4 }) })
  assert("for 3 months", { duration: Duration.fromObject({ months: 3 }) })
})

testRule("OccurrenceExpr", (assert) => {
  assert("1 time", 1)
  assert("one time", 1)
  assert("twice", 2)
  assert("3 times", 3)
})

testRule("NextExpr", (assert) => {
  assert("next monday", DateTime.local(2021, 1, 4))
  assert("next month", DateTime.local(2021, 2, 1))
})

// testRule("NextSubExpr", (assert) => {
//   assert("today", DateTime.local(2021, 1, 1))
//   assert("tomorrow", DateTime.local(2021, 1, 2))
//   assert("weekend", DateTime.local(2021, 1, 2))
// })

// testRule("RecurringExpr", (assert) => {
//   assert("every wednesday", {
//     frequency: Frequency.WEEKLY,
//     byDayOfWeek: ["WE"],
//     byHourOfDay: [0],
//     byMinuteOfHour: [0],
//   })

//   assert("every wednesday at 11", {
//     frequency: Frequency.WEEKLY,
//     byDayOfWeek: ["WE"],
//     byHourOfDay: [11],
//     byMinuteOfHour: [0],
//   })

//   assert("2 times a week", {
//     frequency: Frequency.DAILY,
//     interval: 2,
//     byHourOfDay: [0],
//     byMinuteOfHour: [0],
//   })
// })

// testRule("RecurringExprWithOption", (assert) => {
//   assert("every wednesday", {
//     frequency: Frequency.WEEKLY,
//     byDayOfWeek: ["WE"],
//     byHourOfDay: [0],
//     byMinuteOfHour: [0],
//   })
//   assert("every wednesday at 11", {
//     frequency: Frequency.WEEKLY,
//     byDayOfWeek: ["WE"],
//     byHourOfDay: [11],
//     byMinuteOfHour: [0],
//   })

//   assert("every wednesday for 1h", {
//     frequency: Frequency.WEEKLY,
//     duration: Duration.fromObject({ hours: 1 }),
//     byDayOfWeek: ["WE"],
//     byHourOfDay: [0],
//     byMinuteOfHour: [0],
//   })

//   assert("every wednesday starting tomorrow", {
//     start: DateTime.local(2021, 1, 2),
//     frequency: Frequency.WEEKLY,
//     byDayOfWeek: ["WE"],
//     byHourOfDay: [0],
//     byMinuteOfHour: [0],
//   })

//   assert("every wednesday for 1h starting tomorrow", {
//     start: DateTime.local(2021, 1, 2),
//     frequency: Frequency.WEEKLY,
//     byDayOfWeek: ["WE"],
//     byHourOfDay: [0],
//     byMinuteOfHour: [0],
//     duration: Duration.fromObject({ hours: 1 }),
//   })

//   assert("every wednesday at 11 for 1h", {
//     start: DateTime.local(2021, 1, 1, 5, 0, 0, 0),
//     frequency: Frequency.WEEKLY,
//     byDayOfWeek: ["WE"],
//     byHourOfDay: [11],
//     byMinuteOfHour: [0],
//   })

//   assert("every wednesday at 11 starting tomorrow", {
//     start: DateTime.local(2021, 1, 1, 5, 0, 0, 0),
//     frequency: Frequency.WEEKLY,
//     byDayOfWeek: ["WE"],
//     byHourOfDay: [11],
//     byMinuteOfHour: [0],
//   })

// assert("every wednesday at 11 for 1h starting tomorrow", {
//   start: DateTime.local(2021, 1, 1, 5, 0, 0, 0),
//   frequency: Frequency.WEEKLY,
//   byDayOfWeek: ["WE"],
//   byHourOfDay: [11],
//   byMinuteOfHour: [0],
// })
// })
