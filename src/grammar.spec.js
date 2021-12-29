import { inspect } from "util"

import { test, expect } from "vitest"
import { DateTime, Duration } from "luxon"

import grammar from "./grammar.pegjs"
import { Frequency } from "./types"

const Now = DateTime.local(2021, 1, 1, 0, 0, 0, 0)

function parse(input, startRule = "Root") {
  return grammar.parse(input, { now: Now, startRule })
}

function testParse(startRule, input, expected) {
  test(`${startRule} parses ${inspect(input)}`, async () => {
    const result = parse(input, startRule)
    expect(result).toEqual(expected)
  }, 50)
}

// edge cases
// testParse("TimeConstructExpr", "", {})
// testParse("TimeConstructExpr", " ", {})

// simple
testParse("TimeConstructExpr", "at 5", {
  dtstart: DateTime.local(2021, 1, 1, 5, 0, 0, 0),
})

testParse("TimeConstructExpr", "in 2 months", {
  dtstart: DateTime.local(2021, 3, 1, 0, 0, 0, 0),
})

testParse("TimeConstructExpr", "tomorrow", {
  dtstart: Now.plus({ days: 1 }).startOf("day"),
})

testParse("TimeConstructExpr", "tomorrow at 8h", {
  dtstart: Now.startOf("day").plus({ days: 1 }).set({ hour: 8 }),
})

testParse("TimeConstructExpr", "today afternoon for 1h", {
  dtstart: Now.set({ hour: 15 }),
  duration: Duration.fromObject({ hours: 1 }),
})

testParse("TimeConstructExpr", "next week", {
  dtstart: DateTime.local(2021, 1, 4, 0, 0, 0, 0),
})

testParse("TimeConstructExpr", "next week at 17", {
  dtstart: DateTime.local(2021, 1, 4, 17, 0, 0, 0),
})

test("TimeConstructExpr parses 'next monday'", () => {
  const result = parse("next monday", "TimeConstructExpr")
  expect(result.dtstart.c).toEqual(Now.plus({ weeks: 1 }).set({ weekday: 1 }).c)
})

// testParse("TimeConstructExpr", "next monday", {
//   dtstart: DateTime.local(2021, 1, 4, 0, 0, 0, 0),
//   byhour: 0,
//   byminute: 0,
//   count: 1,
// })

testParse("TimeConstructExpr", "next monday morning", {
  dtstart: DateTime.local(2021, 1, 4, 9, 0, 0, 0),
})

// recurring

// testParse(
//   "TimeConstructExpr",
//   "every 5 weeks on monday and friday until end of month",
//   {},
// )

testParse("TimeConstructExpr", "every 2 mondays", {
  freq: Frequency.WEEKLY,
  byweekday: 1,
  interval: 2,
})

// testParse("TimeConstructExpr", "every year on the 1st friday", {},)

testParse("TimeConstructExpr", "every 2 days", {
  freq: Frequency.DAILY,
  interval: 2,
})

testParse("TimeConstructExpr", "every 2 thursdays at 11h", {
  freq: Frequency.WEEKLY,
  byweekday: 4,
  byhour: 11,
  byminute: 0,
  interval: 2,
})

testParse("TimeConstructExpr", "every 29/12", {
  freq: Frequency.YEARLY,
  bymonthday: 29,
  bymonth: 12,
})

testParse("TimeConstructExpr", "every 29 december", {
  freq: Frequency.YEARLY,
  bymonthday: 29,
  bymonth: 12,
})

testParse("TimeConstructExpr", "every august", {
  freq: Frequency.MONTHLY,
  bymonth: 8,
  bymonthday: 1,
})

testParse("TimeConstructExpr", "every day at 10", {
  freq: Frequency.DAILY,
  byhour: 10,
  byminute: 0,
})

testParse("TimeConstructExpr", "every month", {
  freq: Frequency.MONTHLY,
  bymonthday: 1,
})

testParse("TimeConstructExpr", "every day starting next month", {
  freq: Frequency.DAILY,
  dtstart: DateTime.local(2021, 2, 1, 0, 0, 0, 0),
})

testParse("TimeConstructExpr", "every day after lunch", {
  freq: Frequency.DAILY,
  byhour: 15,
  byminute: 0,
})

testParse("TimeConstructExpr", "every day after wake up", {
  freq: Frequency.DAILY,
  byhour: 9,
  byminute: 0,
})

testParse("TimeConstructExpr", "every day at 2h for 1h", {
  freq: Frequency.DAILY,
  byhour: 2,
  byminute: 0,
  duration: Duration.fromObject({ hours: 1 }),
})

testParse("TimeConstructExpr", "every day for 15m", {
  freq: Frequency.DAILY,
  duration: Duration.fromObject({ minutes: 15 }),
})

testParse("TimeConstructExpr", "every monday after work", {
  freq: Frequency.WEEKLY,
  byweekday: 1,
  byhour: 18,
  byminute: 0,
})

testParse("TimeConstructExpr", "every wednesday at 11h", {
  freq: Frequency.WEEKLY,
  byweekday: 3,
  byhour: 11,
  byminute: 0,
})

testParse("TimeConstructExpr", "every 2 days at 10h", {
  freq: Frequency.DAILY,
  interval: 2,
  byhour: 10,
  byminute: 0,
})

// testParse("every day except mondays", {})
// testParse("every weekday from 9h to 14h and 15h to 18h", {})

testParse("TimeConstructExpr", "every weekend for 1h", {
  duration: Duration.fromObject({ hours: 1 }),
  freq: Frequency.WEEKLY,
  byweekday: 6,
})

testParse("TimeConstructExpr", "once a day", {
  freq: Frequency.DAILY,
  interval: 1,
})

testParse("TimeConstructExpr", "23/12/2022 at 20:50", {
  dtstart: DateTime.local(2022, 12, 23, 20, 50, 0, 0),
})

testParse("TimeConstructExpr", "after work", {
  dtstart: DateTime.local(2021, 1, 1, 18, 0, 0, 0),
})

testParse("TimeConstructExpr", "26/12/2021 after work", {
  dtstart: DateTime.local(2021, 12, 26, 18, 0, 0, 0),
})

testParse("DateFull", "1/1/2022", DateTime.local(2022, 1, 1, 0, 0, 0, 0))

testParse("Root", "word every 2 thursdays at 11h", {
  freq: Frequency.WEEKLY,
  interval: 2,
  byweekday: 4,
  byhour: 11,
  byminute: 0,
  subject: "word",
})

testParse("Root", "two words every day", {
  freq: Frequency.DAILY,
  subject: "two words",
})

testParse("Root", "exercise every day for 15m", {
  freq: Frequency.DAILY,
  subject: "exercise",
  duration: Duration.fromObject({ minutes: 15 }),
})

testParse("Root", "very long sentence", {
  subject: "very long sentence",
})

testParse("Root", "event 11 september", {
  subject: "event",
  dtstart: DateTime.local(2021, 9, 11, 0, 0, 0, 0),
})

testParse("Root", "birthday every 11 september", {
  freq: Frequency.YEARLY,
  subject: "birthday",
  bymonth: 9,
  bymonthday: 11,
})
