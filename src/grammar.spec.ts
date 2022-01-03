import Tracer from 'pegjs-backtrace'

import { inspect } from "util";

import { expect, describe, it } from "vitest";
import { DateTime, Duration } from "luxon";

import grammar from "./grammar.pegjs?trace";
import { Frequency } from "./types";

const Now = DateTime.local(2021, 1, 1);

function parse(input: string, startRule = "Root") {
  const tracer = new Tracer(input); // input text is required.
  try {
    return grammar.parse(input, {
      grammarSource: "",
      startRule,
      now: Now,
      tracer
    });
  } catch (e) {
    throw new Error([e.message, tracer.getBacktraceString()].join("\n"))
  }
}

type AssertFunction = (input: string) => Chai.Assertion;

interface TestRuleCallback {
  (e: AssertFunction): void;
}

function testRule(name: string, callback: TestRuleCallback) {
  const makeAssertion = (input: string) => {
    return expect(parse(input, name), `parses ${inspect(input)}`);
  };

  it(name, () => {
    callback(makeAssertion);
  });
}

testRule("Date", (e) => {
  e("25/12/2020").toEqual(DateTime.local(2020, 12, 25));
  e("9/1/2022").toEqual(DateTime.local(2022, 1, 9));
});

testRule("ForExpr", (e) => {
  e("for 1h").toEqual({ duration: Duration.fromObject({ hours: 1 }) });
  e("for 4 minutes").toEqual({
    duration: Duration.fromObject({ minutes: 4 }),
  });
  e("for 3 months").toEqual({
    duration: Duration.fromObject({ months: 3 }),
  });
});

testRule("NextExpr", (e) => {
  e("next monday").toEqual(DateTime.local(2021, 1, 4));
  e("next month").toEqual(DateTime.local(2021, 2, 1));
});

testRule("DateExpr", (e) => {
  e("today").toEqual(DateTime.local(2021, 1, 1));
  e("tomorrow").toEqual(DateTime.local(2021, 1, 2));
  e("tomorrow at 11").toEqual(DateTime.local(2021, 1, 2, 11));
  e("tomorrow morning").toEqual(DateTime.local(2021, 1, 2, 9));
  e("this weekend").toEqual(DateTime.local(2021, 1, 2));
  e("10/01 at 12:00").toEqual(DateTime.local(2021, 1, 10, 12));
});

testRule("EveryExpr", (e) => {
  e("every wednesday").toEqual({
    frequency: Frequency.WEEKLY,
    byDayOfWeek: ["WE"],
    byHourOfDay: [0],
    byMinuteOfHour: [0],
  });

  e("every wednesday at 11").toEqual({
    frequency: Frequency.WEEKLY,
    byDayOfWeek: ["WE"],
    byHourOfDay: [11],
    byMinuteOfHour: [0],
  });

  e("every monday after work").toEqual({
    frequency: Frequency.WEEKLY,
    byDayOfWeek: ["MO"],
    byHourOfDay: [18],
    byMinuteOfHour: [0],
  });

  e("every wednesday for 1h").toEqual({
    frequency: Frequency.WEEKLY,
    duration: Duration.fromObject({ hours: 1 }),
    byDayOfWeek: ["WE"],
    byHourOfDay: [0],
    byMinuteOfHour: [0],
  });

  e("every wednesday starting tomorrow").toEqual({
    start: DateTime.local(2021, 1, 2),
    frequency: Frequency.WEEKLY,
    byDayOfWeek: ["WE"],
    byHourOfDay: [0],
    byMinuteOfHour: [0],
  });

  e("every wednesday starting tomorrow for 1h").toEqual({
    start: DateTime.local(2021, 1, 2),
    frequency: Frequency.WEEKLY,
    byDayOfWeek: ["WE"],
    byHourOfDay: [0],
    byMinuteOfHour: [0],
    duration: Duration.fromObject({ hours: 1 }),
  });

  e("every wednesday starting tomorrow at 11").toEqual({
    start: DateTime.local(2021, 1, 2, 11),
    frequency: Frequency.WEEKLY,
    byDayOfWeek: ["WE"],
    byHourOfDay: [0],
    byMinuteOfHour: [0],
  });

  e("every wednesday at 11 for 1h starting tomorrow").toEqual({
    start: DateTime.local(2021, 1, 2, 0, 0),
    frequency: Frequency.WEEKLY,
    byDayOfWeek: ["WE"],
    byHourOfDay: [11],
    byMinuteOfHour: [0],
    duration: Duration.fromObject({ hours: 1 }),
  });

  e("every monday and wednesday").toEqual({
    frequency: Frequency.WEEKLY,
    byDayOfWeek: ["MO", "WE"],
    byHourOfDay: [0],
    byMinuteOfHour: [0],
  });

  e("every monday and wednesday at 10").toEqual({
    frequency: Frequency.WEEKLY,
    byDayOfWeek: ["MO", "WE"],
    byHourOfDay: [10],
    byMinuteOfHour: [0],
  });

  e("every month").toEqual({
    frequency: Frequency.MONTHLY,
    byDayOfMonth: [1],
    byHourOfDay: [0],
    byMinuteOfHour: [0],
  });

  e("every month").toEqual({
    frequency: Frequency.MONTHLY,
    byDayOfMonth: [1],
    byHourOfDay: [0],
    byMinuteOfHour: [0],
  });

  e("every 2 months").toEqual({
    frequency: Frequency.MONTHLY,
    interval: 2,
    byDayOfMonth: [1],
    byHourOfDay: [0],
    byMinuteOfHour: [0],
  });

  e("every day for 15 min").toEqual({
    frequency: Frequency.DAILY,
    byHourOfDay: [0],
    byMinuteOfHour: [0],
    duration: Duration.fromObject({ minutes: 15 }),
  });

  e("every day at 19").toEqual({
    frequency: Frequency.DAILY,
    byHourOfDay: [19],
    byMinuteOfHour: [0],
  });

  e("every day at 19 for 15 min").toEqual({
    frequency: Frequency.DAILY,
    byHourOfDay: [19],
    byMinuteOfHour: [0],
    duration: Duration.fromObject({ minutes: 15 }),
  });
});

testRule("AtTimeExpr", (e) => {
  e("at 14").toEqual({ hour: 14, minute: 0 });
  e("at 22h").toEqual({ hour: 22, minute: 0 });
  e("after diner").toEqual({ hour: 22, minute: 0 });
  e("morning").toEqual({ hour: 9, minute: 0 });
  e("at night").toEqual({ hour: 22, minute: 0 });
})


testRule("EverySubExprListExpr", (e) => {
  e("july and august").toEqual({
    frequency: Frequency.MONTHLY,
    byMonthOfYear: [7, 8],
    byDayOfMonth: [1],
    byHourOfDay: [0],
    byMinuteOfHour: [0],
  })

  e("monday and wednesday").toEqual({
    frequency: Frequency.WEEKLY,
    byDayOfWeek: ["MO", "WE"],
    byHourOfDay: [0],
    byMinuteOfHour: [0],
  })
})

testRule("EveryExprEndAtTimeOrForExpr", (e) => {
  e("after diner for 5 min").toEqual({ byHourOfDay: [22], byMinuteOfHour: [0], duration: Duration.fromObject({ minutes: 5 }) })
  e("at 22h for 15 min").toEqual({ byHourOfDay: [22], byMinuteOfHour: [0], duration: Duration.fromObject({ minutes: 15 }) });
  e("at 14 for 1h").toEqual({ byHourOfDay: [14], byMinuteOfHour: [0], duration: Duration.fromObject({ hours: 1 }) });
  e("at 12 and 16").toEqual({ byHourOfDay: [12, 16], byMinuteOfHour: [0] });
  e("after lunch and after diner").toEqual({
    byHourOfDay: [15, 22],
    byMinuteOfHour: [0],
  })
})

testRule("ForExpr", (e) => {
  e("for 15 min").toEqual({ duration: Duration.fromObject({ minutes: 15 }) });
  e("for 1h").toEqual({ duration: Duration.fromObject({ hours: 1 }) });
})

testRule("EveryExprEnd", (e) => {
  e("at 14").toEqual({ byHourOfDay: [14], byMinuteOfHour: [0] });
  e("for 1h").toEqual({ duration: Duration.fromObject({ hours: 1 }) });
  e("at 14 for 1h").toEqual({ byHourOfDay: [14], byMinuteOfHour: [0], duration: Duration.fromObject({ hours: 1 }) });
})

testRule("Root", (e) => {
  e("").toEqual({});
  e(" ").toEqual({});

  e("something").toEqual({
    subject: "something",
  });

  e("something ").toEqual({
    subject: "something",
  });

  e(" something").toEqual({
    subject: "something",
  });

  e(" something ").toEqual({
    subject: "something",
  });

  e("task at 12").toEqual({
    subject: "task",
    start: DateTime.local(2021, 1, 1, 12),
  });

  e("task for 1h").toEqual({
    subject: "task",
    duration: Duration.fromObject({ hours: 1 }),
  });

  e("task in 2 days").toEqual({
    subject: "task",
    start: DateTime.local(2021, 1, 3),
  });

  e("task tomorrow").toEqual({
    subject: "task",
    start: DateTime.local(2021, 1, 2),
  });

  e("task tomorrow at 17").toEqual({
    subject: "task",
    start: DateTime.local(2021, 1, 2, 17),
  });

  e("task every wednesday").toEqual({
    subject: "task",
    frequency: Frequency.WEEKLY,
    byDayOfWeek: ["WE"],
    byHourOfDay: [0],
    byMinuteOfHour: [0],
  });

  e("buy coffee every month").toEqual({
    subject: "buy coffee",
    frequency: Frequency.MONTHLY,
    byDayOfMonth: [1],
    byHourOfDay: [0],
    byMinuteOfHour: [0],
  });

  e("exercise every tuesday after work for 15 min").toEqual({
    subject: "exercise",
    frequency: Frequency.WEEKLY,
    byDayOfWeek: ["TU"],
    byHourOfDay: [18],
    byMinuteOfHour: [0],
    duration: Duration.fromObject({ minutes: 15 }),
  });

  // e("brush teeth every day after lunch and after diner").toEqual({
  // })
});
