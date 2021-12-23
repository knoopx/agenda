const fs = require("fs")
const { inspect } = require("util")

const {
  startOfDay,
  setHours,
  addDays,
  addHours,
  startOfWeek,
} = require("date-fns")
const peggy = require("peggy")

const { parse } = peggy.generate(fs.readFileSync("./src/grammar.pegjs", "utf8"))

const now = new Date(2020, 0, 1, 0, 0, 0, 0)

const TEST_CASES = {
  "": {},
  "every 5 weeks on Monday, Friday until January 31, 2013": {},
  "every year on the 1st friday": {},
  "every 2 days": {
    at: { day: "*/2" },
  },
  "end of month": {},
  "end of march": {},
  // "every 2 thursday at 11h": {},
  "every 29/12": { at: { day: 29, month: 12 } },
  "every 29 december": { at: { day: 29, month: 12 } },
  "every august": { at: { month: 8 } },
  "every day starting next month": {
    at: { day: "*" },
    start: new Date(2020, 1, 1, 0, 0, 0, 0),
  },
  "every day after lunch": { at: { day: "*", hour: 15, minute: 0 } },
  "every day after wake up": { at: { day: "*", hour: 9, minute: 0 } },
  "every day at 2h for 1h": {
    at: { day: "*", hour: 2, minute: 0 },
    duration: 60,
  },
  "every day for 15min": {
    at: { day: "*" }, // todo: hour: 0, minute: 0 ?
    duration: 15,
  },
  "every end of month": {
    at: { day: "L" },
  },
  "every monday after work": {
    at: { hour: 18, minute: 0, weekDay: 1 },
  },
  "every wednesday at 11h": {
    at: {
      hour: 11,
      minute: 0,
      weekDay: 3,
    },
  },
  "every 2 days at 10h": {
    at: {
      hour: 10,
      minute: 0,
      day: "*/2",
    },
  },
  // "every 2 thursdays at 10h": {},
  "every week for 4h": {
    at: { weekDay: 1 },
    duration: 240,
  },
  // "every day except mondays": {},
  // "every weekday from 9h to 14h and 15h to 18h": {},
  "every weekend for 1h": {
    at: { weekDay: 6 },
    duration: 60,
  },
  "in 2 months": {
    start: new Date(2020, 2, 1, 0, 0, 0, 0),
  },
  "tomorrow at 8h": {
    start: setHours(addHours(startOfDay(now), 24), 8),
  },
  "today afternoon for 1h": {
    start: setHours(startOfDay(now), 15),
    duration: 60,
  },
  "next week at 5": {
    start: setHours(startOfWeek(addDays(startOfDay(now), 7)), 5),
  },
  "next monday at 5": {
    start: new Date(2020, 0, 6, 5, 0, 0, 0),
  },
  "at 5": {
    start: new Date(2020, 0, 6, 5, 0, 0, 0),
  },
  "once a day": {
    at: { day: "*" },
  },
}

for (const [input, expected] of Object.entries(TEST_CASES)) {
  test(`parses ${inspect(input)}`, () => {
    const result = parse(input, { now })
    expect(result).toEqual(expected)
  })
}
