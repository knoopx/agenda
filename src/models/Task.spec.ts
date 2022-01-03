import { DateTime, Settings } from "luxon";
import { describe, expect, it } from "vitest";
import { DateAdapterBase } from "../schedule";

import { Expression, Store, Task } from ".";
import { ITask } from "./Task";

Settings.defaultZone = "Europe/Madrid";
const Now = DateTime.local(2021, 1, 1);
Settings.now = () => Now.toMillis();

const store = Store.create();
function make(expression: string) {
  return store.addTask(Task.create({expression}));
}

function test(expr: string, callback: (e: ITask) => void) {
  it(expr, () => {
    callback(make(expr));
  });
}

it("validates", () => {
  expect(make("").isValid).toEqual(false);
  expect(make("something").isValid).toEqual(true);
  expect(make("every monday").isValid).toEqual(false);
  expect(make("task every monday").isValid).toEqual(true);
});

test("task every monday starting next month", (task) => {
  expect(task.nextAt).toEqual(DateTime.local(2021, 2, 1));
});

test("task every monday", (task) => {
  expect(task.isRecurring).toEqual(true)

  expect(task.ast).toEqual({
    subject: "task",
    frequency: "WEEKLY",
    byDayOfWeek: ["MO"],
    byHourOfDay: [0],
    byMinuteOfHour: [0],
  });

  expect(task.rrule).toEqual({
    start: Now,
    frequency: "WEEKLY",
    byDayOfWeek: ["MO"],
    byHourOfDay: [0],
    byMinuteOfHour: [0],
  });

  const {
    createdAt,
    implicitStart,
    nextAt,
    lastCompletedAt,
    rrule: { start },
  } = task;

  expect(createdAt).toEqual(Now);
  expect(lastCompletedAt).toEqual(Now);
  expect(implicitStart).toEqual(Now);

  expect(start).toEqual(Now);
  expect(lastCompletedAt).toEqual(Now);
  expect(nextAt).toEqual(DateTime.local(2021, 1, 4));
  expect(task.nextAfter(Now)).toEqual(nextAt);

  // Settings.now = () => DateTime.local(2021, 1, 4, 1).toMillis();
  // task.complete();

  // expect(task.rrule.start).toEqual(nextAt);
  // expect(task.lastCompletedAt).toEqual(nextAt);
  // expect(task.implicitStart).toEqual(nextAt);

  // expect(task.nextAfter(Now)).toEqual(DateTime.local(2021, 1, 11));
  // expect(task.nextAt).toEqual(task.nextAfter(Now));
});
