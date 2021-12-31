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
      })
    })
  })
}

// edge cases
// testParse("TimeConstructExpr", "", {})
// testParse("TimeConstructExpr", " ", {})

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

testRule("NextDateExpr", (assert) => {
  assert("next monday", DateTime.local(2021, 1, 4))
  assert("next month", DateTime.local(2021, 2, 1))
})

testRule("DateRelativeExpr", (assert) => {
  assert("today", DateTime.local(2021, 1, 1))
  assert("tomorrow", DateTime.local(2021, 1, 2))
  assert("weekend", DateTime.local(2021, 1, 2))
})

testRule("RecurringExpr", (assert) => {
  assert("every wednesday", {
    frequency: Frequency.WEEKLY,
    byDayOfWeek: ["WE"],
    byHourOfDay: [0],
    byMinuteOfHour: [0],
  })

  assert("every wednesday at 11", {
    frequency: Frequency.WEEKLY,
    byDayOfWeek: ["WE"],
    byHourOfDay: [11],
    byMinuteOfHour: [0],
  })
})

testRule("RecurringExprWithOption", (assert) => {
  assert("every wednesday", {
    frequency: Frequency.WEEKLY,
    byDayOfWeek: ["WE"],
    byHourOfDay: [0],
    byMinuteOfHour: [0],
  })
  assert("every wednesday at 11", {
    frequency: Frequency.WEEKLY,
    byDayOfWeek: ["WE"],
    byHourOfDay: [11],
    byMinuteOfHour: [0],
  })

  assert("every wednesday for 1h", {
    frequency: Frequency.WEEKLY,
    duration: Duration.fromObject({ hours: 1 }),
    byDayOfWeek: ["WE"],
    byHourOfDay: [0],
    byMinuteOfHour: [0],
  })

  assert("every wednesday starting tomorrow", {
    start: DateTime.local(2021, 1, 2),
    frequency: Frequency.WEEKLY,
    byDayOfWeek: ["WE"],
    byHourOfDay: [0],
    byMinuteOfHour: [0],
  })

  assert("every wednesday for 1h starting tomorrow", {
    start: DateTime.local(2021, 1, 2),
    frequency: Frequency.WEEKLY,
    byDayOfWeek: ["WE"],
    byHourOfDay: [0],
    byMinuteOfHour: [0],
    duration: Duration.fromObject({ hours: 1 }),
  })

  assert("every wednesday at 11 for 1h", {
    start: DateTime.local(2021, 1, 1, 5, 0, 0, 0),
    frequency: Frequency.WEEKLY,
    byDayOfWeek: ["WE"],
    byHourOfDay: [11],
    byMinuteOfHour: [0],
  })

  assert("every wednesday at 11 starting tomorrow", {
    start: DateTime.local(2021, 1, 1, 5, 0, 0, 0),
    frequency: Frequency.WEEKLY,
    byDayOfWeek: ["WE"],
    byHourOfDay: [11],
    byMinuteOfHour: [0],
  })

  // assert("every wednesday at 11 for 1h starting tomorrow", {
  //   start: DateTime.local(2021, 1, 1, 5, 0, 0, 0),
  //   frequency: Frequency.WEEKLY,
  //   byDayOfWeek: ["WE"],
  //   byHourOfDay: [11],
  //   byMinuteOfHour: [0],
  // })
})

// // simple
// testParse("TimeConstructExpr", "at 5", {
//   start: DateTime.local(2021, 1, 1, 5, 0, 0, 0),
// })

// testParse("TimeConstructExpr", "at 5:00", {
//   start: DateTime.local(2021, 1, 1, 5, 0, 0, 0),
// })

// testParse("TimeConstructExpr", "at 5am", {
//   start: DateTime.local(2021, 1, 1, 5, 0, 0, 0),
// })

// testParse("TimeConstructExpr", "at 5:00 am", {
//   start: DateTime.local(2021, 1, 1, 5, 0, 0, 0),
// })

// testParse("TimeConstructExpr", "at 5pm", {
//   start: DateTime.local(2021, 1, 1, 17, 0, 0, 0),
// })

// testParse("TimeConstructExpr", "in 2 months", {
//   start: DateTime.local(2021, 3, 1),
// })

// testParse("TimeConstructExpr", "tomorrow", {
//   start: Now.plus({ days: 1 }).startOf("day"),
// })

// testParse("TimeConstructExpr", "tomorrow at 8h", {
//   start: Now.startOf("day").plus({ days: 1 }).set({ hour: 8 }),
// })

// testParse("TimeConstructExpr", "today afternoon for 1h", {
//   start: Now.set({ hour: 15 }),
//   duration: Duration.fromObject({ hours: 1 }),
// })

// testParse("TimeConstructExpr", "next week", {
//   start: DateTime.local(2021, 1, 4),
// })

// testParse("TimeConstructExpr", "next week at 17", {
//   start: DateTime.local(2021, 1, 4, 17, 0, 0, 0),
// })

// test("TimeConstructExpr parses 'next monday'", () => {
//   const result = parse("next monday", "TimeConstructExpr")
//   expect(result.start.c).toEqual(Now.plus({ weeks: 1 }).set({ weekday: 1 }).c)
// })

// // testParse("TimeConstructExpr", "next monday", {
// //   start: DateTime.local(2021, 1, 4),
// //   byHourOfDay: [0],
// //   byMinuteOfHour: [0],
// //   count: 1,
// // })

// testParse("TimeConstructExpr", "next monday morning", {
//   start: DateTime.local(2021, 1, 4, 9, 0, 0, 0),
// })

// // recurring

// // testParse(
// //   "TimeConstructExpr",
// //   "every 5 weeks on monday and friday until end of month",
// //   {},
// // )

// testParse("TimeConstructExpr", "every 2 mondays", {
//   frequency: Frequency.WEEKLY,
//   interval: 2,
//   byDayOfWeek: ["MO"],
//   byHourOfDay: [0],
//   byMinuteOfHour: [0],
// })

// // testParse("TimeConstructExpr", "every year on the 1st friday", {},)

// testParse("TimeConstructExpr", "every 2 days", {
//   frequency: Frequency.DAILY,
//   interval: 2,
//   byHourOfDay: [0],
//   byMinuteOfHour: [0],
// })

// testParse("TimeConstructExpr", "every 2 thursdays at 11h", {
//   frequency: Frequency.WEEKLY,
//   interval: 2,
//   byDayOfWeek: ["TH"],
//   byHourOfDay: [11],
//   byMinuteOfHour: [0],
// })

// testParse("TimeConstructExpr", "every 29/12", {
//   frequency: Frequency.YEARLY,
//   byDayOfMonth: [29],
//   byMonthOfYear: [12],
//   byHourOfDay: [0],
//   byMinuteOfHour: [0],
// })

// testParse("TimeConstructExpr", "every 29 december", {
//   frequency: Frequency.YEARLY,
//   byDayOfMonth: [29],
//   byMonthOfYear: [12],
//   byHourOfDay: [0],
//   byMinuteOfHour: [0],
// })

// testParse("TimeConstructExpr", "every august", {
//   frequency: Frequency.MONTHLY,
//   byMonthOfYear: [8],
//   byDayOfMonth: [1],
//   byHourOfDay: [0],
//   byMinuteOfHour: [0],
// })

// testParse("TimeConstructExpr", "every day at 10", {
//   frequency: Frequency.DAILY,
//   byHourOfDay: [10],
//   byMinuteOfHour: [0],
// })

// testParse("TimeConstructExpr", "every month", {
//   frequency: Frequency.MONTHLY,
//   byDayOfMonth: [1],
//   byHourOfDay: [0],
//   byMinuteOfHour: [0],
// })

// testParse("TimeConstructExpr", "every day starting next month", {
//   frequency: Frequency.DAILY,
//   byHourOfDay: [0],
//   byMinuteOfHour: [0],
//   start: DateTime.local(2021, 2, 1),
// })

// testParse("TimeConstructExpr", "every day after lunch", {
//   frequency: Frequency.DAILY,
//   byHourOfDay: [15],
//   byMinuteOfHour: [0],
// })

// testParse("TimeConstructExpr", "every day after wake up", {
//   frequency: Frequency.DAILY,
//   byHourOfDay: [9],
//   byMinuteOfHour: [0],
// })

// testParse("TimeConstructExpr", "every day at 2h for 1h", {
//   frequency: Frequency.DAILY,
//   byHourOfDay: [2],
//   byMinuteOfHour: [0],
//   duration: Duration.fromObject({ hours: 1 }),
// })

// testParse("TimeConstructExpr", "every day for 15min", {
//   frequency: Frequency.DAILY,
//   byHourOfDay: [0],
//   byMinuteOfHour: [0],
//   duration: Duration.fromObject({ minutes: 15 }),
// })

// testParse("TimeConstructExpr", "every monday after work", {
//   frequency: Frequency.WEEKLY,
//   byDayOfWeek: ["MO"],
//   byHourOfDay: [18],
//   byMinuteOfHour: [0],
// })

// testParse("TimeConstructExpr", "every 2 days at 10h", {
//   frequency: Frequency.DAILY,
//   interval: 2,
//   byHourOfDay: [10],
//   byMinuteOfHour: [0],
// })

// // testParse("every day except mondays", {})
// // testParse("every weekday from 9h to 14h and 15h to 18h", {})

// testParse("TimeConstructExpr", "every weekend for 1h", {
//   duration: Duration.fromObject({ hours: 1 }),
//   frequency: Frequency.WEEKLY,
//   byDayOfWeek: ["SA"],
//   byHourOfDay: [0],
//   byMinuteOfHour: [0],
// })

// testParse("TimeConstructExpr", "once a day", {
//   frequency: Frequency.DAILY,
//   interval: 1,
//   byHourOfDay: [0],
//   byMinuteOfHour: [0],
// })

// testParse("TimeConstructExpr", "23/12/2022 at 20:50", {
//   start: DateTime.local(2022, 12, 23, 20, 50, 0, 0),
// })

// testParse("TimeConstructExpr", "after work", {
//   start: DateTime.local(2021, 1, 1, 18, 0, 0, 0),
// })

// testParse("TimeConstructExpr", "26/12/2021 after work", {
//   start: DateTime.local(2021, 12, 26, 18, 0, 0, 0),
// })

// testParse("TimeConstructExpr", "every 2 days at 5 for 1w", {
//   start: DateTime.local(2021, 12, 26, 18, 0, 0, 0),
// })

// testParse("DateFull", "1/1/2022", DateTime.local(2022, 1, 1))

// testParse("Root", "word every 2 thursdays at 11h", {
//   frequency: Frequency.WEEKLY,
//   interval: 2,
//   byDayOfWeek: ["TH"],
//   byHourOfDay: [11],
//   byMinuteOfHour: [0],
//   subject: "word",
// })

// testParse("Root", "two words every day", {
//   subject: "two words",
//   frequency: Frequency.DAILY,
//   byHourOfDay: [0],
//   byMinuteOfHour: [0],
// })

// testParse("Root", "exercise every day for 15min", {
//   subject: "exercise",
//   frequency: Frequency.DAILY,
//   byHourOfDay: [0],
//   byMinuteOfHour: [0],
//   duration: Duration.fromObject({ minutes: 15 }),
// })

// testParse("Root", "very long sentence", {
//   subject: "very long sentence",
// })

// testParse("Root", "event 11 september", {
//   subject: "event",
//   start: DateTime.local(2021, 9, 11),
// })

// testParse("Root", "brush teeth every day after lunch and after diner", {
//   subject: "brush teeth",
//   frequency: "DAILY",
//   byHourOfDay: [15, 22],
//   byMinuteOfHour: [0],
// })

// testParse("Root", "yoga every tuesday and wednesday at 6", {
//   subject: "yoga",
//   frequency: "WEEKLY",
//   byDayOfWeek: ["TU", "WE"],
//   byHourOfDay: [6],
//   byMinuteOfHour: [0],
// })

// testParse("Root", "holidays every july and august", {
//   subject: "holidays",
//   frequency: "MONTHLY",
//   byDayOfMonth: [1],
//   byHourOfDay: [0],
//   byMinuteOfHour: [0],
//   byMonthOfYear: [7, 8],
// })

// testParse("Root", "birthday every 11 september", {
//   frequency: Frequency.YEARLY,
//   subject: "birthday",
//   byMonthOfYear: [9],
//   byDayOfMonth: [11],
//   byHourOfDay: [0],
//   byMinuteOfHour: [0],
// })

// // testParse("Root", "sleep every day at 23 for 8h", {
// //   subject: "sleep",
// //   frequency: Frequency.DAILY,
// //   byHourOfDay: 23,
// //   byMinuteOfHour: [0],
// //   duration: Duration.fromObject({ hours: 8 }),
// // })
