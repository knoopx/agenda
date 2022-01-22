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
    byHourOfDay: [0],
    byMinuteOfHour: [0],
  });

  expect(task.asObject).toMatchObject({
    start: Now,
    frequency: "WEEKLY",
    byDayOfWeek: ["MO"],
    byHourOfDay: [0],
    byMinuteOfHour: [0],
  });

  const { createdAt, implicitStart, nextAt, lastCompletedAt } = task;

  expect(createdAt).toEqual(Now);
  expect(lastCompletedAt).toEqual(Now);
  expect(implicitStart).toEqual(Now);

  expect(nextAt).toEqual(DateTime.local(2020, 1, 6));

  task.complete();

  expect(task.asObject).toMatchObject({
    start: nextAt,
    frequency: "WEEKLY",
    byDayOfWeek: ["MO"],
    byHourOfDay: [0],
    byMinuteOfHour: [0],
  });

  expect(task.implicitStart).toEqual(nextAt);
  expect(task.lastCompletedAt).toEqual(nextAt);

  // expect(task.nextAt).toEqual(DateTime.local(2020, 1, 13));
});
