import Tracer from "pegjs-backtrace";

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
      tracer,
    });
  } catch (e) {
    throw new Error([e.message, tracer.getBacktraceString()].join("\n"));
  }
}

type AssertFunction = (input: string) => Chai.VitestAssertion;

function testRule(name: string, callback: (e: AssertFunction) => void) {
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
  e("every wednesday").toMatchObject({
    frequency: Frequency.WEEKLY,
    byDayOfWeek: ["WE"],
    byHourOfDay: [0],
    byMinuteOfHour: [0],
  });

  e("every wednesday at 11").toMatchObject({
    frequency: Frequency.WEEKLY,
    byDayOfWeek: ["WE"],
    byHourOfDay: [11],
    byMinuteOfHour: [0],
  });

  e("every monday after work").toMatchObject({
    frequency: Frequency.WEEKLY,
    byDayOfWeek: ["MO"],
    byHourOfDay: [18],
    byMinuteOfHour: [0],
  });

  e("every wednesday for 1h").toMatchObject({
    frequency: Frequency.WEEKLY,
    duration: Duration.fromObject({ hours: 1 }),
    byDayOfWeek: ["WE"],
    byHourOfDay: [0],
    byMinuteOfHour: [0],
  });

  e("every wednesday starting tomorrow").toMatchObject({
    start: DateTime.local(2021, 1, 2),
    frequency: Frequency.WEEKLY,
    byDayOfWeek: ["WE"],
    byHourOfDay: [0],
    byMinuteOfHour: [0],
  });

  e("every wednesday starting tomorrow for 1h").toMatchObject({
    start: DateTime.local(2021, 1, 2),
    frequency: Frequency.WEEKLY,
    byDayOfWeek: ["WE"],
    byHourOfDay: [0],
    byMinuteOfHour: [0],
    duration: Duration.fromObject({ hours: 1 }),
  });

  e("every wednesday starting tomorrow at 11").toMatchObject({
    start: DateTime.local(2021, 1, 2, 11),
    frequency: Frequency.WEEKLY,
    byDayOfWeek: ["WE"],
    byHourOfDay: [0],
    byMinuteOfHour: [0],
  });

  e("every wednesday at 11 for 1h starting tomorrow").toMatchObject({
    start: DateTime.local(2021, 1, 2, 0, 0),
    frequency: Frequency.WEEKLY,
    byDayOfWeek: ["WE"],
    byHourOfDay: [11],
    byMinuteOfHour: [0],
    duration: Duration.fromObject({ hours: 1 }),
  });

  e("every monday and wednesday").toMatchObject({
    frequency: Frequency.WEEKLY,
    byDayOfWeek: ["MO", "WE"],
    byHourOfDay: [0],
    byMinuteOfHour: [0],
  });

  e("every monday and wednesday at 10").toMatchObject({
    frequency: Frequency.WEEKLY,
    byDayOfWeek: ["MO", "WE"],
    byHourOfDay: [10],
    byMinuteOfHour: [0],
  });

  e("every month").toMatchObject({
    frequency: Frequency.MONTHLY,
    byDayOfMonth: [1],
    byHourOfDay: [0],
    byMinuteOfHour: [0],
  });

  e("every month").toMatchObject({
    frequency: Frequency.MONTHLY,
    byDayOfMonth: [1],
    byHourOfDay: [0],
    byMinuteOfHour: [0],
  });

  e("every 2 months").toMatchObject({
    frequency: Frequency.MONTHLY,
    interval: 2,
    byDayOfMonth: [1],
    byHourOfDay: [0],
    byMinuteOfHour: [0],
  });

  e("every day for 15 min").toMatchObject({
    frequency: Frequency.DAILY,
    byHourOfDay: [0],
    byMinuteOfHour: [0],
    duration: Duration.fromObject({ minutes: 15 }),
  });

  e("every day at 19").toMatchObject({
    frequency: Frequency.DAILY,
    byHourOfDay: [19],
    byMinuteOfHour: [0],
  });

  e("every day at 19 for 15 min").toMatchObject({
    frequency: Frequency.DAILY,
    byHourOfDay: [19],
    byMinuteOfHour: [0],
    duration: Duration.fromObject({ minutes: 15 }),
  });

  e("every morning").toMatchObject({
    frequency: Frequency.DAILY,
    byHourOfDay: [9],
    byMinuteOfHour: [0],
  });

  e("every morning and afternoon").toMatchObject({
    frequency: Frequency.DAILY,
    byHourOfDay: [9, 15],
    byMinuteOfHour: [0],
  });
});

testRule("AtTimeExpr", (e) => {
  e("at 14").toMatchObject({ hour: 14, minute: 0 });
  e("at 22h").toMatchObject({ hour: 22, minute: 0 });
  e("after diner").toMatchObject({ hour: 22, minute: 0 });
  e("morning").toMatchObject({ hour: 9, minute: 0 });
  e("at night").toMatchObject({ hour: 22, minute: 0 });
});

testRule("EverySubExprListExpr", (e) => {
  e("july and august").toMatchObject({
    frequency: Frequency.MONTHLY,
    byMonthOfYear: [7, 8],
    byDayOfMonth: [1],
    byHourOfDay: [0],
    byMinuteOfHour: [0],
  });

  e("monday and wednesday").toMatchObject({
    frequency: Frequency.WEEKLY,
    byDayOfWeek: ["MO", "WE"],
    byHourOfDay: [0],
    byMinuteOfHour: [0],
  });
});

testRule("EveryExprEndAtTimeOrForExpr", (e) => {
  e("after diner for 5 min").toMatchObject({
    byHourOfDay: [22],
    byMinuteOfHour: [0],
    duration: Duration.fromObject({ minutes: 5 }),
  });
  e("at 22h for 15 min").toMatchObject({
    byHourOfDay: [22],
    byMinuteOfHour: [0],
    duration: Duration.fromObject({ minutes: 15 }),
  });
  e("at 14 for 1h").toMatchObject({
    byHourOfDay: [14],
    byMinuteOfHour: [0],
    duration: Duration.fromObject({ hours: 1 }),
  });
  e("at 12 and 16").toMatchObject({ byHourOfDay: [12, 16], byMinuteOfHour: [0] });
  e("after lunch and after diner").toMatchObject({
    byHourOfDay: [15, 22],
    byMinuteOfHour: [0],
  });
});

testRule("ForExpr", (e) => {
  e("for 15 min").toMatchObject({ duration: Duration.fromObject({ minutes: 15 }) });
  e("for 1h").toMatchObject({ duration: Duration.fromObject({ hours: 1 }) });
});

testRule("EveryExprEnd", (e) => {
  e("at 14").toMatchObject({ byHourOfDay: [14], byMinuteOfHour: [0] });
  e("for 1h").toMatchObject({ duration: Duration.fromObject({ hours: 1 }) });
  e("at 14 for 1h").toMatchObject({
    byHourOfDay: [14],
    byMinuteOfHour: [0],
    duration: Duration.fromObject({ hours: 1 }),
  });
});

testRule("Root", (e) => {
  e("").toMatchObject({});
  e(" ").toMatchObject({});

  e("something").toMatchObject({
    subject: "something",
  });

  e("something ").toMatchObject({
    subject: "something",
  });

  e(" something").toMatchObject({
    subject: "something",
  });

  e(" something ").toMatchObject({
    subject: "something",
  });

  e("something @personal").toMatchObject({
    subject: "something",
    context: "personal"
  });

  e("task at 12").toMatchObject({
    subject: "task",
    start: DateTime.local(2021, 1, 1, 12),
  });

  e("task for 1h").toMatchObject({
    subject: "task",
    duration: Duration.fromObject({ hours: 1 }),
  });

  e("task in 2 days").toMatchObject({
    subject: "task",
    start: DateTime.local(2021, 1, 3),
  });

  e("task tomorrow").toMatchObject({
    subject: "task",
    start: DateTime.local(2021, 1, 2),
  });

  e("task tomorrow at 17").toMatchObject({
    subject: "task",
    start: DateTime.local(2021, 1, 2, 17),
  });

  e("task every wednesday").toMatchObject({
    subject: "task",
    frequency: Frequency.WEEKLY,
    byDayOfWeek: ["WE"],
    byHourOfDay: [0],
    byMinuteOfHour: [0],
  });

  e("buy coffee every month").toMatchObject({
    subject: "buy coffee",
    frequency: Frequency.MONTHLY,
    byDayOfMonth: [1],
    byHourOfDay: [0],
    byMinuteOfHour: [0],
  });

  e("exercise every tuesday after work for 15 min").toMatchObject({
    subject: "exercise",
    frequency: Frequency.WEEKLY,
    byDayOfWeek: ["TU"],
    byHourOfDay: [18],
    byMinuteOfHour: [0],
    duration: Duration.fromObject({ minutes: 15 }),
  });

  e("brush teeth every day after lunch and after diner").toMatchObject({
    byHourOfDay: [15, 22],
    byMinuteOfHour: [0],
    frequency: "DAILY",
    subject: "brush teeth",
  });

  e("meeting every wednesday at 10 @work").toMatchObject({
    subject: "meeting",
    frequency: "WEEKLY",
    byDayOfWeek: ["WE"],
    byHourOfDay: [10],
    byMinuteOfHour: [0],
    context: "work",
  })

  e("buy battery 04/01 at 09:00 @personal").toMatchObject({
    context: "personal",
    start: DateTime.local(2021, 1, 4, 9),
    subject: "buy battery",
  });
});
