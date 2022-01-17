import { DateTime, Settings } from "luxon";
import { describe, expect, it, test } from "vitest";
import { Store, Task } from "../models";
import { toExpression } from "./toExpression";

Settings.defaultZone = "Europe/Madrid";
const Now = DateTime.local(2020, 1, 1);
Settings.now = () => Now.toMillis();

describe("simplifiedExpression", () => {
  test("task every monday @personal", () => {
    expect(
      toExpression(
        {
          subject: "task",
          context: "personal",
          byDayOfWeek: ["MO"],
          frequency: "WEEKLY",
        },
        {}
      )
    ).toEqual("task every monday @personal");
  });

  test("task every monday at 10:00 @personal", () => {
    expect(
      toExpression(
        {
          subject: "task",
          frequency: "WEEKLY",
          byDayOfWeek: ["MO"],
          byHourOfDay: [10],
          byMinuteOfHour: [0],
          context: "personal",
        },
        {}
      )
    ).toEqual("task every monday at 10 @personal");
  });

  test("task every 2 mondays @personal", () => {
    expect(
      toExpression(
        {
          subject: "task",
          context: "personal",
          byDayOfWeek: ["MO"],
          frequency: "WEEKLY",
          interval: 2,
        },
        {}
      )
    ).toEqual("task every 2 mondays @personal");
  });

  test("task every monday and tuesday @personal", () => {
    expect(
      toExpression(
        {
          subject: "task",
          context: "personal",
          byDayOfWeek: ["MO", "TU"],
          frequency: "WEEKLY",
        },
        {}
      )
    ).toEqual("task every monday and tuesday @personal");
  });

  test("task tomorrow at 5 @personal", () => {
    expect(
      toExpression(
        {
          subject: "task",
          context: "personal",
          start: Now.plus({ days: 1 }).set({ hour: 5 }),
        },
        {}
      )
    ).toEqual("task tomorrow at 5 @personal");
  });

  test("task yesterday at 5 @personal", () => {
    expect(
      toExpression(
        {
          subject: "task",
          context: "personal",
          start: Now.plus({ days: -1 }).set({ hour: 5 }),
        },
        {}
      )
    ).toEqual("task 31/12/2019 at 5 @personal");
  });


  test("task next month at 5 @personal", () => {
    expect(
      toExpression(
        {
          subject: "task",
          context: "personal",
          start: Now.plus({ month: 1 }).set({ hour: 5 }),
        },
        {}
      )
    ).toEqual("task 1 february at 5 @personal");
  });


  test("task every 15 minutes", () => {
    expect(
      toExpression(
        {
          subject: "task",
          interval: 15,
          frequency: "MINUTELY",
        },
        {}
      )
    ).toEqual("task every 15 min");
  });

  test("task every august", () => {
    expect(
      toExpression(
        {
          subject: "task",
          byMonthOfYear: [8],
          frequency: "YEARLY",
        },
        {}
      )
    ).toEqual("task every august");
  });

  test("task every 1 august", () => {
    expect(
      toExpression(
        {
          subject: "task",
          byMonthOfYear: [8],
          byDayOfMonth: [1],
          frequency: "YEARLY",
        },
        {}
      )
    ).toEqual("task every august");
  });

  test("birthday every 29 december", () => {
    expect(
      toExpression(
        {
          subject: "task",
          byDayOfMonth: [29],
          byMonthOfYear: [12],
          frequency: "YEARLY",
        },
        {}
      )
    ).toEqual("task every 29 december");
  });

  test("task every morning @personal", () => {
    expect(
      toExpression(
        {
          subject: "task",
          context: "personal",
          byDayOfWeek: ["MO"],
          byHourOfDay: [9],
          byMinuteOfHour: [0],
          frequency: "DAILY",
        },
        {
          morning: 9,
        }
      )
    ).toEqual("task every morning @personal");
  });
});
