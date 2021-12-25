const fs = require("fs")
const { inspect } = require("util")

const {
  startOfDay,
  setHours,
  addHours,
  startOfWeek,
  addWeeks,
} = require("date-fns")
const peggy = require("peggy")
const RRule = require("rrule").default

const { parse } = peggy.generate(
  fs.readFileSync("./src/parser/grammar.pegjs", "utf8"),
  { allowedStartRules: ["Root", "TimeConstructExpr", "DateExpr", "DateFull"] },
)

const now = new Date(2021, 0, 1, 0, 0, 0, 0)

function testParse(startRule, input, expected) {
  test(`${startRule} parses ${inspect(input)}`, () => {
    const result = parse(input, { now, startRule })
    expect(result).toEqual(expected)
  })
}

// edge cases
// testParse("TimeConstructExpr", "", {})
// testParse("TimeConstructExpr", " ", {})

// simple
testParse("TimeConstructExpr", "at 5", {
  start: new Date(2021, 0, 1, 5, 0, 0, 0),
})
testParse("TimeConstructExpr", "in 2 months", {
  start: new Date(2021, 2, 1, 0, 0, 0, 0),
})
testParse("TimeConstructExpr", "tomorrow", {
  start: setHours(addHours(startOfDay(now), 24), 0),
})
testParse("TimeConstructExpr", "tomorrow at 8h", {
  start: setHours(addHours(startOfDay(now), 24), 8),
})
testParse("TimeConstructExpr", "today afternoon for 1h", {
  start: setHours(startOfDay(now), 15),
  duration: 60,
})
testParse("TimeConstructExpr", "next week at 5", {
  start: setHours(startOfWeek(addWeeks(now, 1), { weekStartsOn: 1 }), 5),
})
testParse("TimeConstructExpr", "next monday at 5", {
  start: new Date(2021, 0, 4, 5, 0, 0, 0),
})

// recurring

// test_parses("every 5 weeks on monday and friday until end of month", {},)

testParse("TimeConstructExpr", "every 2 mondays", {
  freq: RRule.WEEKLY,
  byweekday: 0,
  interval: 2,
})

// test_parses("every year on the 1st friday", {},)

testParse("TimeConstructExpr", "every 2 days", {
  freq: RRule.DAILY,
  interval: 2,
})

// test_parses("every 2 thursday at 11h", {},)

testParse("TimeConstructExpr", "every 29/12", {
  freq: RRule.YEARLY,
  bymonthday: 29,
  bymonth: 12,
  byhour: 0,
  byminute: 0,
})

testParse("TimeConstructExpr", "every 29 december", {
  freq: RRule.YEARLY,
  bymonthday: 29,
  bymonth: 12,
  byhour: 0,
  byminute: 0,
})

testParse("TimeConstructExpr", "every august", {
  freq: RRule.MONTHLY,
  bymonth: 8,
  bymonthday: 1,
  byhour: 0,
  byminute: 0,
})

testParse("TimeConstructExpr", "every day at 10", {
  freq: RRule.DAILY,
  byhour: 10,
  byminute: 0,
})

testParse("TimeConstructExpr", "every day starting next month", {
  freq: RRule.DAILY,
  dtstart: new Date(2021, 1, 1, 0, 0, 0, 0),
  byhour: 0,
  byminute: 0,
})

testParse("TimeConstructExpr", "every day after lunch", {
  freq: RRule.DAILY,
  byhour: 15,
  byminute: 0,
})

testParse("TimeConstructExpr", "every day after wake up", {
  freq: RRule.DAILY,
  byhour: 9,
  byminute: 0,
})

testParse("TimeConstructExpr", "every day at 2h for 1h", {
  freq: RRule.DAILY,
  byhour: 2,
  byminute: 0,
  duration: 60,
})

testParse("TimeConstructExpr", "every day for 15m", {
  freq: RRule.DAILY,
  duration: 15,
  byhour: 0,
  byminute: 0,
})

testParse("TimeConstructExpr", "every monday after work", {
  freq: RRule.WEEKLY,
  byweekday: 0,
  byhour: 18,
  byminute: 0,
})

testParse("TimeConstructExpr", "every wednesday at 11h", {
  freq: RRule.WEEKLY,
  byweekday: 2,
  byhour: 11,
  byminute: 0,
})

testParse("TimeConstructExpr", "every 2 days at 10h", {
  freq: RRule.DAILY,
  interval: 2,
  byhour: 10,
  byminute: 0,
})

// test_parses("every 2 thursdays at 10h", {},)

testParse("TimeConstructExpr", "every week for 4h", {
  freq: RRule.WEEKLY,
  byweekday: 0,
  byhour: 0,
  byminute: 0,
  duration: 240,
})

// test_parses("every day except mondays", {})
// test_parses("every weekday from 9h to 14h and 15h to 18h", {})

testParse("TimeConstructExpr", "every weekend for 1h", {
  duration: 60,
  freq: RRule.WEEKLY,
  byweekday: 5,
})

testParse("TimeConstructExpr", "once a day", {
  freq: RRule.DAILY,
  interval: 1,
})

testParse("TimeConstructExpr", "23/12/2022 at 20:50", {
  start: new Date(2022, 11, 23, 20, 50, 0, 0),
})

testParse("TimeConstructExpr", "after work", {
  start: new Date(2021, 0, 1, 18, 0, 0, 0),
})
testParse("TimeConstructExpr", "26/12/2021 after work", {
  start: new Date(2021, 11, 26, 18, 0, 0, 0),
})

testParse("DateFull", "1/1/2022", new Date(2022, 0, 1, 0, 0, 0, 0))

testParse("Root", "word every 2 thursdays at 11h", {
  freq: RRule.WEEKLY,
  interval: 2,
  byweekday: 3,
  byhour: 11,
  byminute: 0,
  subject: "word",
})

testParse("Root", "two words every day", {
  freq: RRule.DAILY,
  subject: "two words",
  byhour: 0,
  byminute: 0,
})

testParse("Root", "very long sentence", {
  subject: "very long sentence",
})

testParse("Root", "event 11 september", {
  subject: "event",
  start: new Date(2021, 8, 11, 0, 0, 0, 0),
})

testParse("Root", "birthday every 11 september", {
  freq: RRule.YEARLY,
  subject: "birthday",
  bymonth: 9,
  bymonthday: 11,
  byhour: 0,
  byminute: 0,
})
