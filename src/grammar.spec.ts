import { inspect } from "util";

import { expect, describe, it } from "vitest";
import { DateTime, Duration } from "luxon";

import grammar from "./grammar.pegjs";
import { Frequency } from "./types";

const Now = DateTime.local(2021, 1, 1);

function parse(input: string, startRule = "Root") {
  try {
    return grammar.parse(input, {
      grammarSource: "",
      startRule,
      now: Now,
    });
  } catch (e) {
    if (e.format && typeof e.format === "function") {
      throw new Error(e.format([{ source: "", text: input }]));
    } else {
      throw e;
    }
  }
}

type AssertFunction = (input: string) => Chai.Assertion;

interface TestRuleCallback { (e: AssertFunction): void; }

function testRule(name: string, callback: TestRuleCallback) {
  const makeAssertion = (input: string) => {
    return expect(parse(input, name), `parses ${inspect(input)}`);
  }

  it(name, () => {
    callback(makeAssertion);
  });
}

// edge cases
// testParse("NaturalTimeExpr", "", {})
// testParse("NaturalTimeExpr", " ", {})

testRule("ForExpr", (e) => {
  e("for 1h").toEqual({ duration: Duration.fromObject({ hours: 1 }) });
  e("for 4 minutes").toEqual({
    duration: Duration.fromObject({ minutes: 4 }),
  });
  e("for 3 months").toEqual({
    duration: Duration.fromObject({ months: 3 }),
  });
});

testRule("OccurrenceExpr", (e) => {
  e("1 time").toEqual(1);
  e("one time").toEqual(1);
  e("twice").toEqual(2);
  e("3 times").toEqual(3);
});

testRule("NextExpr", (e) => {
  e("next monday").toEqual(DateTime.local(2021, 1, 4));
  e("next month").toEqual(DateTime.local(2021, 2, 1));
});

testRule("DateExpr", (e) => {
  e("today").toEqual(DateTime.local(2021, 1, 1))
  e("tomorrow").toEqual(DateTime.local(2021, 1, 2))
  e("weekend").toEqual(DateTime.local(2021, 1, 2))
})

testRule("NaturalRecurringSubExpr", (e) => {
  e("every wednesday").toEqual({
    frequency: Frequency.WEEKLY,
    byDayOfWeek: ["WE"],
    byHourOfDay: [0],
    byMinuteOfHour: [0],
  })

  e("every wednesday at 11").toEqual({
    frequency: Frequency.WEEKLY,
    byDayOfWeek: ["WE"],
    byHourOfDay: [11],
    byMinuteOfHour: [0],
  })

  // e("2 times a week").toEqual({
  //   frequency: Frequency.DAILY,
  //   interval: 2,
  //   byHourOfDay: [0],
  //   byMinuteOfHour: [0],
  // })
})

testRule("NaturalRecurringSubExpr", (e) => {
  e("every wednesday").toEqual({
    frequency: Frequency.WEEKLY,
    byDayOfWeek: ["WE"],
    byHourOfDay: [0],
    byMinuteOfHour: [0],
  })

  e("every wednesday at 11").toEqual({
    frequency: Frequency.WEEKLY,
    byDayOfWeek: ["WE"],
    byHourOfDay: [11],
    byMinuteOfHour: [0],
  })

  e("every wednesday for 1h").toEqual({
    frequency: Frequency.WEEKLY,
    duration: Duration.fromObject({ hours: 1 }),
    byDayOfWeek: ["WE"],
    byHourOfDay: [0],
    byMinuteOfHour: [0],
  })

  e("every wednesday starting tomorrow").toEqual({
    start: DateTime.local(2021, 1, 2),
    frequency: Frequency.WEEKLY,
    byDayOfWeek: ["WE"],
    byHourOfDay: [0],
    byMinuteOfHour: [0],
  })

  e("every wednesday for 1h starting tomorrow").toEqual({
    start: DateTime.local(2021, 1, 2),
    frequency: Frequency.WEEKLY,
    byDayOfWeek: ["WE"],
    byHourOfDay: [0],
    byMinuteOfHour: [0],
    duration: Duration.fromObject({ hours: 1 }),
  })

  e("every wednesday at 11 for 1h").toEqual({
    start: DateTime.local(2021, 1, 1, 5, 0, 0, 0),
    frequency: Frequency.WEEKLY,
    byDayOfWeek: ["WE"],
    byHourOfDay: [11],
    byMinuteOfHour: [0],
  })

  // e("every wednesday at 11 starting tomorrow").toEqual({
  //   start: DateTime.local(2021, 1, 1, 5, 0, 0, 0),
  //   frequency: Frequency.WEEKLY,
  //   byDayOfWeek: ["WE"],
  //   byHourOfDay: [11],
  //   byMinuteOfHour: [0],
  // })

// e("every wednesday at 11 for 1h starting tomorrow").toEqual({
//   start: DateTime.local(2021, 1, 1, 5, 0, 0, 0),
//   frequency: Frequency.WEEKLY,
//   byDayOfWeek: ["WE"],
//   byHourOfDay: [11],
//   byMinuteOfHour: [0],
// })

e("every monday and wednesday").toEqual({
  frequency: Frequency.WEEKLY,
  byDayOfWeek: ["MO", "WE"],
  byHourOfDay: [0],
  byMinuteOfHour: [0],
})

e("every monday and wednesday at 10").toEqual({
  frequency: Frequency.WEEKLY,
  byDayOfWeek: ["MO", "WE"],
  byHourOfDay: [0],
  byMinuteOfHour: [0],
})
})
