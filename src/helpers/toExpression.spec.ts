import { DateTime, Settings } from "luxon";
import { describe, expect, test } from "vitest";
import { Store } from "../models";
import {
  toEveryDateExpr,
  toEveryDayOfWeekExpr,
  toEveryIntervalExpr,
  toRecurringExpression,
} from "./toExpression";

Settings.defaultZone = "Europe/Madrid";
const Now = DateTime.local(2020, 1, 1);
Settings.now = () => Now.toMillis();

const store = Store.create();

function make(expression: string) {
  const task = store.addTask({ expression })!;
  expect(task.isValid).toBeTruthy();
  return task;
}

function testSimplifiedExpression(expression: string, expected: string) {
  test("simplifiedExpression: " + expression + " -> " + expected, () => {
    expect(make(expression).simplifiedExpression).toEqual(expected);
  });
}

function testRawExpression(expression: string, expected: string) {
  test("rawExpression: " + expression + " -> " + expected, () => {
    expect(make(expression).rawExpression).toEqual(expected);
  });
}

testSimplifiedExpression(
  "task every monday @personal",
  "@personal task every monday"
);

testSimplifiedExpression("task every 2 days", "task every 2 days");

// todo: get rid of "at"
testSimplifiedExpression("task every friday night", "task every friday at night");

// todo: get rid of "at"
testSimplifiedExpression(
  "task every monday at 9:00 @personal",
  "@personal task every monday at morning"
);

testRawExpression(
  "task every monday at 9:00 @personal",
  "@personal task every monday at 9"
);

testSimplifiedExpression(
  "task every 2 mondays @personal",
  "@personal task every 2 mondays"
);

testSimplifiedExpression(
  "task every monday and tuesday @personal",
  "@personal task every monday and tuesday"
);

testSimplifiedExpression(
  "task 2/1/2020 at 5 @personal",
  "@personal task tomorrow at 5"
);

testRawExpression(
  "task tomorrow at 5 @personal",
  "@personal task 02/01/2020 at 5"
);

testSimplifiedExpression(
  "task 31/12/2019 at 5 @personal",
  "@personal task 31/12/2019 at 5"
);

testSimplifiedExpression(
  "task next month at 5 @personal",
  "@personal task 1 february at 5"
);

testRawExpression(
  "task next month at 5 @personal",
  "@personal task 01/02/2020 at 5"
);

testSimplifiedExpression("task every 15 minutes", "task every 15 min");

testSimplifiedExpression("task every august", "task every august");

testSimplifiedExpression("task every 1 august", "task every august");

testSimplifiedExpression(
  "birthday every 29 december",
  "birthday every 29 december"
);

testSimplifiedExpression(
  "task every morning @personal",
  "@personal task every morning"
);

test("task every 15 min", () => {
  const task = make("task every 15 min");
  const { ast } = task;
  expect(ast).toMatchObject({
    interval: 15,
    frequency: "MINUTELY",
  });

  expect(toEveryDayOfWeekExpr(ast?.byDayOfWeek, ast?.interval)).toBeNull();
  expect(toEveryDateExpr(ast?.byDayOfMonth, ast?.byMonthOfYear)).toBeNull();
  expect(toEveryIntervalExpr(ast!.interval, ast!.frequency!)).toEqual([
    "every",
    "15",
    "min",
  ]);
  expect(
    toRecurringExpression(ast!, {
      relative: false,
      timeOfTheDay: store.timeOfTheDay as unknown as { [key: string]: number },
    })
  ).toEqual([
    "every",
    "15",
    "min",
  ]);
});
