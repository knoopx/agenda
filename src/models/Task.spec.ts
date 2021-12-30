import { DateTime, Settings } from "luxon";
import { describe, expect, it } from "vitest";
import { DateAdapterBase } from "../schedule";

import { Task } from ".";

const Now = DateTime.local(2021, 1, 1);
Settings.now = () => Now.toMillis();

function make(expression: string) {
  return Task.create({ expression });
}

it("validates", () => {
  expect(make("").isValid).toEqual(false);
  expect(make("something").isValid).toEqual(true);
  expect(make("every monday").isValid).toEqual(false);
  expect(make("task every monday").isValid).toEqual(true);
});

it("nextAfter", () => {
  expect(DateTime.now()).toEqual(Now);
  expect(DateAdapterBase.adapter.name).toEqual("LuxonDateAdapter");
  DateAdapterBase.adapter.fromDate(Now).toDateTime()

  const task = make("task every monday");
  expect(task.createdAt).toEqual(Now);
  expect(task.lastCompletedAt).toEqual(Now);
  expect(task.implicitStart).toEqual(Now);

  expect(task.rrule).toEqual({
    start: Now,
    frequency: "WEEKLY",
    byDayOfWeek: ["MO"],
    byHourOfDay: [0],
    byMinuteOfHour: [0],
  })

  expect(task.nextAfter(Now)).toEqual(DateTime.local(2021, 1, 4));
  // expect(task.nextAt).toEqual(task.nextAfter(Now))
});
