import { DateTime, Settings } from "luxon";
import { expect, it } from "vitest";

import { Store, Task } from ".";
import { ITask } from "./Task";

Settings.defaultZone = "Europe/Madrid";
let Now = DateTime.local(2020, 1, 1);
Settings.now = () => Now.toMillis();

const store = Store.create();
function make(expression: string) {
  return store.addTask({ expression })!;
}

function test(expr: string, callback: (e: ITask) => void) {
  it(expr, () => {
    callback(make(expr));
  });
}

it("timeOfTheDay", () => {
  expect(make("").timeOfTheDay).toEqual(store.timeOfTheDay);
});

it("isValid", () => {
  expect(make("").isValid).toEqual(false);
  expect(make("something").isValid).toEqual(true);
  expect(make("every monday").isValid).toEqual(false);
  expect(make("task every monday").isValid).toEqual(true);
});

test("ast", () => {
  const expr = make("something");
  expect(expr.error).toEqual("");
  expect(expr.ast).toMatchObject({
    subject: "something",
  });
});

test("nextAfter", () => {
  const expr = make("something");
  expect(expr.error).toEqual("");
  expect(expr.ast).toMatchObject({
    subject: "something",
  });
});

test("task every monday starting next month", (task) => {
  expect(task.nextAt).toEqual(DateTime.local(2020, 2, 3));
});

test("task every monday", (task) => {
  expect(task.isRecurring).toEqual(true);

  expect(task.ast).toMatchObject({
    subject: "task",
    frequency: "WEEKLY",
    byDayOfWeek: ["MO"],
  });

  expect(task.asRuleOptions).toMatchObject({
    start: Now,
    frequency: "WEEKLY",
    byDayOfWeek: ["MO"],
  });

  const { createdAt, implicitStart, nextAt, lastCompletedAt } = task;

  expect(createdAt).toEqual(Now);
  expect(lastCompletedAt).toEqual(Now);
  expect(implicitStart).toEqual(Now);

  expect(nextAt).toEqual(DateTime.local(2020, 1, 6));

  expect(task.asRuleOptions).toMatchObject({
    start: DateTime.local(2020, 1, 1),
    frequency: "WEEKLY",
    byDayOfWeek: ["MO"],
    byHourOfDay: [0],
    byMinuteOfHour: [0],
  });

  Now = implicitStart.plus({ days: 1 });

  task.complete();

  const ruleOptions = task.asRuleOptions! as any;
  expect(ruleOptions.frequency).toEqual("WEEKLY");
  expect(ruleOptions.byDayOfWeek).toEqual(["MO"]);
  expect(ruleOptions.byHourOfDay).toEqual([0]);
  expect(ruleOptions.byMinuteOfHour).toEqual([0]);
  // Check that start date is January 13, 2020
  const startDate = ruleOptions.start as any;
  expect(startDate.year).toEqual(2020);
  expect(startDate.month).toEqual(1);
  expect(startDate.day).toEqual(13);

  expect(task.nextAt?.hasSame(DateTime.local(2020, 1, 13), "day")).toEqual(true);
});
