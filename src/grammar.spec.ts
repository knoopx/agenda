import { expect, it } from "vitest";
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
  } catch (e: any) {
    throw new Error(e.message);
  }
}

type AssertFunction = (input: string) => any;

function testRule(name: string, callback: (e: AssertFunction) => void) {
  const makeAssertion = (input: string) => {
    return expect(parse(input, name), `parses ${JSON.stringify(input)}`);
  };

  it(name, () => {
    callback(makeAssertion);
  });
}

testRule("Context", (e) => {
  e("@work").toMatchObject({ contexts: ["work"] });
  e("@home-office").toMatchObject({ contexts: ["home-office"] });
  e("@personal_tasks").toMatchObject({ contexts: ["personal_tasks"] });
  e("@123").toMatchObject({ contexts: ["123"] });
  e("@urgent").toMatchObject({ contexts: ["urgent"] });
  e("@project-alpha").toMatchObject({ contexts: ["project-alpha"] });
});

testRule("Tag", (e) => {
  e("#coffee").toMatchObject({ tags: ["coffee"] });
  e("#urgent-task").toMatchObject({ tags: ["urgent-task"] });
  e("#work_project").toMatchObject({ tags: ["work_project"] });
  e("#1on1").toMatchObject({ tags: ["1on1"] });
  e("#meeting").toMatchObject({ tags: ["meeting"] });
  e("#bug-fix").toMatchObject({ tags: ["bug-fix"] });
});

testRule("TagExpr", (e) => {
  e("#coffee #drinks").toMatchObject({ tags: ["coffee", "drinks"] });
  e("#urgent #important").toMatchObject({ tags: ["urgent", "important"] });
  e("#meeting #standup #daily").toMatchObject({
    tags: ["meeting", "standup", "daily"],
  });
  e("#work #project #frontend").toMatchObject({
    tags: ["work", "project", "frontend"],
  });
});

testRule("ContextOrTagExpr", (e) => {
  e("#tag").toMatchObject({ tags: ["tag"] });
  e("#coffee #drinks").toMatchObject({ tags: ["coffee", "drinks"] });
  e("@context").toMatchObject({ contexts: ["context"] });
  e("@a @b").toMatchObject({ contexts: ["a", "b"] });
  e("#tag @context").toMatchObject({ contexts: ["context"], tags: ["tag"] });
  e("@context #tag").toMatchObject({ contexts: ["context"], tags: ["tag"] });
  e("#coffee #drinks @context").toMatchObject({
    contexts: ["context"],
    tags: ["coffee", "drinks"],
  });
  e("@context #coffee #drinks").toMatchObject({
    contexts: ["context"],
    tags: ["coffee", "drinks"],
  });
  e("#coffee @context #drinks").toMatchObject({
    contexts: ["context"],
    tags: ["coffee", "drinks"],
  });
  e("@work @personal #urgent #meeting").toMatchObject({
    contexts: ["work", "personal"],
    tags: ["urgent", "meeting"],
  });
  e("#project-alpha @work #backend #api").toMatchObject({
    contexts: ["work"],
    tags: ["project-alpha", "backend", "api"],
  });
});

testRule("ForExpr", (e) => {
  e("for 1h").toEqual({ duration: Duration.fromObject({ hours: 1 }) });
  e("for 4 minutes").toEqual({
    duration: Duration.fromObject({ minutes: 4 }),
  });
  e("for 3 months").toEqual({
    duration: Duration.fromObject({ months: 3 }),
  });
  e("for 2 weeks").toEqual({
    duration: Duration.fromObject({ weeks: 2 }),
  });
  e("for 1 year").toEqual({
    duration: Duration.fromObject({ years: 1 }),
  });
  e("for 45 min").toEqual({
    duration: Duration.fromObject({ minutes: 45 }),
  });
  e("for 6 hours").toEqual({
    duration: Duration.fromObject({ hours: 6 }),
  });
  // Test "a" and "an" support
  // Note: These tests may need adjustment based on Duration rule parsing
  e("for a day").toEqual({ duration: Duration.fromObject({ days: 1 }) });
  e("for an hour").toEqual({ duration: Duration.fromObject({ hours: 1 }) });
  e("for a minute").toEqual({ duration: Duration.fromObject({ minutes: 1 }) });
});

testRule("NextExpr", (e) => {
  e("next monday").toEqual(DateTime.local(2021, 1, 4));
  e("next month").toEqual(DateTime.local(2021, 2, 1));
  e("next winter").toEqual(DateTime.local(2021, 9, 1));
  e("next week").toEqual(DateTime.local(2021, 1, 4));
  e("next year").toEqual(DateTime.local(2022, 1, 1));
  e("next friday").toEqual(DateTime.local(2021, 1, 1)); // Jan 1, 2021 is a Friday
  e("next tuesday").toEqual(DateTime.local(2021, 1, 5));
  e("next thursday").toEqual(DateTime.local(2021, 1, 7));
});

testRule("DateExpr", (e) => {
  e("25/12/2020").toEqual(DateTime.local(2020, 12, 25));
  e("25 dec 2020").toEqual(DateTime.local(2020, 12, 25));
  e("25 dec").toEqual(DateTime.local(2021, 12, 25));
  e("dec 25").toEqual(DateTime.local(2021, 12, 25));
  // ISO date format support
  e("2024-01-10").toEqual(DateTime.local(2024, 1, 10));
  e("2023-12-25").toEqual(DateTime.local(2023, 12, 25));
});

testRule("DateTimeExpr", (e) => {
  e("today").toEqual(DateTime.local(2021, 1, 1));
  e("tomorrow").toEqual(DateTime.local(2021, 1, 2));
  e("tomorrow at 11").toEqual(DateTime.local(2021, 1, 2, 11));
  e("tomorrow morning").toEqual(DateTime.local(2021, 1, 2, 9));
  e("this weekend").toEqual(DateTime.local(2021, 1, 2));
  e("10/01 at 12:00").toEqual(DateTime.local(2021, 1, 10, 12));
});

testRule("EverySubExpr", (e) => {
  e("friday").toMatchObject({
    frequency: "WEEKLY",
    byDayOfWeek: ["FR"],
  });

  e("night").toMatchObject({
    frequency: "DAILY",
    byHourOfDay: [22],
    byMinuteOfHour: [0],
  });

  e("friday night").toMatchObject({
    frequency: "WEEKLY",
    byDayOfWeek: ["FR"],
    byHourOfDay: [22],
    byMinuteOfHour: [0],
  });
});

testRule("EveryExpr", (e) => {
  e("every wednesday").toMatchObject({
    frequency: Frequency.WEEKLY,
    byDayOfWeek: ["WE"],
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
  });

  e("every wednesday starting tomorrow").toMatchObject({
    start: DateTime.local(2021, 1, 2),
    frequency: Frequency.WEEKLY,
    byDayOfWeek: ["WE"],
  });

  e("every wednesday for 1h starting tomorrow").toMatchObject({
    start: DateTime.local(2021, 1, 2),
    frequency: Frequency.WEEKLY,
    byDayOfWeek: ["WE"],
    duration: Duration.fromObject({ hours: 1 }),
  });

  e("every wednesday starting tomorrow at 11").toMatchObject({
    start: DateTime.local(2021, 1, 2, 11),
    frequency: Frequency.WEEKLY,
    byDayOfWeek: ["WE"],
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
  });

  e("every month").toMatchObject({
    frequency: Frequency.MONTHLY,
    byDayOfMonth: [1],
  });

  e("every 2 months").toMatchObject({
    frequency: Frequency.MONTHLY,
    interval: 2,
    byDayOfMonth: [1],
  });

  e("every day for 15 min").toMatchObject({
    frequency: Frequency.DAILY,
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

  e("every 29 december").toMatchObject({
    frequency: Frequency.YEARLY,
    byMonthOfYear: [12],
    byDayOfMonth: [29],
  });
});

testRule("AtTimeExpr", (e) => {
  e("at 14").toMatchObject({ hour: 14, minute: 0 });
  e("at 22h").toMatchObject({ hour: 22, minute: 0 });
  e("after diner").toMatchObject({ hour: 22, minute: 0 });
  e("morning").toMatchObject({ hour: 9, minute: 0 });
  e("at night").toMatchObject({ hour: 22, minute: 0 });
});

testRule("RecurringExpr", (e) => {
  e("july and august").toMatchObject({
    frequency: Frequency.MONTHLY,
    byMonthOfYear: [7, 8],
    byDayOfMonth: [1],
  });

  e("monday and wednesday").toMatchObject({
    frequency: Frequency.WEEKLY,
    byDayOfWeek: ["MO", "WE"],
  });
});

testRule("RecurringExprSpecifierExpr", (e) => {
  // at A for B starting C until D
  e("at 14 for 15 min starting tomorrow until next week").toMatchObject({
    start: DateTime.local(2021, 1, 2),
    end: DateTime.local(2021, 1, 4),
    byHourOfDay: [14],
    byMinuteOfHour: [0],
    duration: Duration.fromObject({ minutes: 15 }),
  });

  // at A for B starting C
  e("at 14 for 15 min starting tomorrow").toMatchObject({
    start: DateTime.local(2021, 1, 2),
    byHourOfDay: [14],
    byMinuteOfHour: [0],
    duration: Duration.fromObject({ minutes: 15 }),
  });

  // at A for B
  e("at 14 for 15 min").toMatchObject({
    byHourOfDay: [14],
    byMinuteOfHour: [0],
    duration: Duration.fromObject({ minutes: 15 }),
  });

  // for A starting B until C
  e("for 15 min starting tomorrow until next week").toMatchObject({
    start: DateTime.local(2021, 1, 2),
    end: DateTime.local(2021, 1, 4),
    duration: Duration.fromObject({ minutes: 15 }),
  });

  // for A starting B
  e("for 15 min starting tomorrow").toMatchObject({
    start: DateTime.local(2021, 1, 2),
    duration: Duration.fromObject({ minutes: 15 }),
  });

  // starting A until B
  e("starting tomorrow until next week").toMatchObject({
    start: DateTime.local(2021, 1, 2),
    end: DateTime.local(2021, 1, 4),
  });

  // starting A
  e("starting tomorrow").toMatchObject({
    start: DateTime.local(2021, 1, 2),
  });

  // until A
  e("until next week").toMatchObject({
    end: DateTime.local(2021, 1, 4),
  });

  // for a
  e("for 15 min").toMatchObject({
    duration: Duration.fromObject({ minutes: 15 }),
  });
  e("for 1h").toMatchObject({ duration: Duration.fromObject({ hours: 1 }) });

  // at A
  e("at 14").toMatchObject({ byHourOfDay: [14], byMinuteOfHour: [0] });

  // other
  e("after diner for 5 min").toMatchObject({
    byHourOfDay: [22],
    byMinuteOfHour: [0],
    duration: Duration.fromObject({ minutes: 5 }),
  });

  e("after lunch and after diner").toMatchObject({
    byHourOfDay: [15, 22],
    byMinuteOfHour: [0],
  });
});

testRule("ForExpr", (e) => {
  e("for 15 min").toMatchObject({
    duration: Duration.fromObject({ minutes: 15 }),
  });
  e("for 1h").toMatchObject({ duration: Duration.fromObject({ hours: 1 }) });
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
    contexts: ["personal"],
  });

  e("tomorrow").toMatchObject({
    start: DateTime.local(2021, 1, 2),
  });

  e("#coffee").toMatchObject({
    tags: ["coffee"],
  });

  e("#coffee #drinks").toMatchObject({
    tags: ["coffee", "drinks"],
  });

  e("subject #coffee").toMatchObject({
    subject: "subject",
    tags: ["coffee"],
  });

  e("subject #coffee #drinks").toMatchObject({
    subject: "subject",
    tags: ["coffee", "drinks"],
  });

  e("@home").toMatchObject({
    contexts: ["home"],
  });

  e("#holidays @planning").toMatchObject({
    contexts: ["planning"],
    tags: ["holidays"],
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
  });

  e("buy coffee every month").toMatchObject({
    subject: "buy coffee",
    frequency: Frequency.MONTHLY,
    byDayOfMonth: [1],
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

  e("@work meeting every wednesday at 10").toMatchObject({
    subject: "meeting",
    frequency: "WEEKLY",
    byDayOfWeek: ["WE"],
    byHourOfDay: [10],
    byMinuteOfHour: [0],
    contexts: ["work"],
  });

  e("@personal buy battery 04/01 at 09:00").toMatchObject({
    contexts: ["personal"],
    subject: "buy battery",
    start: DateTime.local(2021, 1, 4, 9),
  });

  e("@work #call peter ").toMatchObject({
    tags: ["call"],
    contexts: ["work"],
    subject: "peter",
  });

  e("@work #call peter").toMatchObject({
    tags: ["call"],
    contexts: ["work"],
    subject: "peter",
  });

  e("on winter").toMatchObject({
    start: DateTime.local(2021, 9, 1),
  });

  e("next winter").toMatchObject({
    start: DateTime.local(2021, 9, 1),
  });

  e("on monday").toMatchObject({
    start: DateTime.local(2021, 1, 4),
  });

  e("next monday").toMatchObject({
    start: DateTime.local(2021, 1, 4),
  });

  // Additional comprehensive test cases
  e(
    "@work #standup daily meeting every monday at 09:00 for 30 min",
  ).toMatchObject({
    subject: "daily meeting",
    contexts: ["work"],
    tags: ["standup"],
    frequency: Frequency.WEEKLY,
    byDayOfWeek: ["MO"],
    byHourOfDay: [9],
    byMinuteOfHour: [0],
    duration: Duration.fromObject({ minutes: 30 }),
  });

  e("@personal #health doctor appointment tomorrow at 15:30").toMatchObject({
    subject: "doctor appointment",
    contexts: ["personal"],
    tags: ["health"],
    start: DateTime.local(2021, 1, 2, 15, 30),
  });

  e(
    "@home #cleaning vacuum living room every saturday morning for 1h",
  ).toMatchObject({
    subject: "vacuum living room",
    contexts: ["home"],
    tags: ["cleaning"],
    frequency: Frequency.WEEKLY,
    byDayOfWeek: ["SA"],
    byHourOfDay: [9],
    byMinuteOfHour: [0],
    duration: Duration.fromObject({ hours: 1 }),
  });

  e("review code @work #urgent #bug").toMatchObject({
    subject: "review code",
    contexts: ["work"],
    tags: ["urgent", "bug"],
  });

  e("call mom about vacation plans").toMatchObject({
    subject: "call mom about vacation plans",
  });

  e("task with numbers 123 and symbols !@#").toMatchObject({
    subject: "task with numbers 123 and symbols !@#",
  });

  e("@multi-word-context task").toMatchObject({
    subject: "task",
    contexts: ["multi-word-context"],
  });

  e("#multi_word_tag task").toMatchObject({
    subject: "task",
    tags: ["multi_word_tag"],
  });

  e("every friday at 17:00 for 2h").toMatchObject({
    frequency: Frequency.WEEKLY,
    byDayOfWeek: ["FR"],
    byHourOfDay: [17],
    byMinuteOfHour: [0],
    duration: Duration.fromObject({ hours: 2 }),
  });

  // Test improved weekend parsing (includes both Saturday and Sunday)
  e("every weekend").toMatchObject({
    frequency: Frequency.WEEKLY,
    byDayOfWeek: ["SA", "SU"],
  });

  e("weekend").toMatchObject({
    frequency: Frequency.WEEKLY,
    byDayOfWeek: ["SA", "SU"],
  });

  e("meeting tomorrow at 09:30").toMatchObject({
    subject: "meeting",
    start: DateTime.local(2021, 1, 2, 9, 30),
  });

  e("@work #1on1 catch up with team lead every 2 weeks").toMatchObject({
    subject: "catch up with team lead",
    contexts: ["work"],
    tags: ["1on1"],
    frequency: Frequency.WEEKLY,
    interval: 2,
  });

  // Test FromToExpr integration
  e("@work project from 2024-01-15 to 2024-03-15").toMatchObject({
    subject: "project",
    contexts: ["work"],
    start: DateTime.local(2024, 1, 15),
    end: DateTime.local(2024, 3, 15),
  });

  e("#personal vacation from tomorrow to next week").toMatchObject({
    subject: "vacation",
    tags: ["personal"],
    start: DateTime.local(2021, 1, 2),
    end: DateTime.local(2021, 1, 4),
  });

  e("task for a day").toMatchObject({
    subject: "task",
    duration: Duration.fromObject({ days: 1 }),
  });

  e("meeting for an hour").toMatchObject({
    subject: "meeting",
    duration: Duration.fromObject({ hours: 1 }),
  });
});
