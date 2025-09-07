import { DateTime, Settings } from "luxon";
import { describe, expect, test } from "vitest";
import { Store } from "../models";
import {
  toEveryDateExpr,
  toEveryDayOfWeekExpr,
  toEveryIntervalExpr,
  toEveryMonthOfYearExpr,
  toRecurringExpression,
  toExpression,
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
  "@personal task every monday",
);

testSimplifiedExpression("task every 2 days", "task every 2 days");

// todo: get rid of "at"
testSimplifiedExpression(
  "task every friday night",
  "task every friday at night",
);

// todo: get rid of "at"
testSimplifiedExpression(
  "task every monday at 9:00 @personal",
  "@personal task every monday at morning",
);

testRawExpression(
  "task every monday at 9:00 @personal",
  "@personal task every monday at 9",
);

testSimplifiedExpression(
  "task every 2 mondays @personal",
  "@personal task every 2 mondays",
);

testSimplifiedExpression(
  "task every monday and tuesday @personal",
  "@personal task every monday and tuesday",
);

testSimplifiedExpression(
  "task 2/1/2020 at 5 @personal",
  "@personal task tomorrow at 5",
);

testRawExpression(
  "task tomorrow at 5 @personal",
  "@personal task 02/01/2020 at 5",
);

testSimplifiedExpression(
  "task 31/12/2019 at 5 @personal",
  "@personal task 31/12/2019 at 5",
);

testSimplifiedExpression(
  "task next month at 5 @personal",
  "@personal task 1 february at 5",
);

testRawExpression(
  "task next month at 5 @personal",
  "@personal task 01/02/2020 at 5",
);

testSimplifiedExpression("task every 15 minutes", "task every 15 min");

testSimplifiedExpression("task every august", "task every august");

testSimplifiedExpression("task every 1 august", "task every august");

testSimplifiedExpression(
  "birthday every 29 december",
  "birthday every 29 december",
);

testSimplifiedExpression(
  "task every morning @personal",
  "@personal task every morning",
);

testSimplifiedExpression(
  "task https://example.com @personal",
  "@personal task https://example.com",
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
    }),
  ).toEqual(["every", "15", "min"]);
});

describe("toEveryMonthOfYearExpr", () => {
  test("should return null for undefined input", () => {
    expect(toEveryMonthOfYearExpr()).toBeNull();
  });

  test("should handle empty array", () => {
    expect(toEveryMonthOfYearExpr([])).toEqual(["every", ""]);
  });

  test("should return expression for single month", () => {
    expect(toEveryMonthOfYearExpr([1])).toEqual(["every", "january"]);
    expect(toEveryMonthOfYearExpr([12])).toEqual(["every", "december"]);
  });

  test("should return expression for multiple months", () => {
    expect(toEveryMonthOfYearExpr([1, 3, 5])).toEqual([
      "every",
      "january and march and may",
    ]);
  });
});

describe("toEveryIntervalExpr", () => {
  test("should return null for unknown frequency", () => {
    expect(toEveryIntervalExpr(1, "UNKNOWN")).toBeNull();
  });

  test("should return expression for interval 1", () => {
    expect(toEveryIntervalExpr(1, "DAILY")).toEqual(["every", "day"]);
    expect(toEveryIntervalExpr(1, "WEEKLY")).toEqual(["every", "week"]);
    expect(toEveryIntervalExpr(1, "MONTHLY")).toEqual(["every", "month"]);
  });

  test("should return expression for interval > 1", () => {
    expect(toEveryIntervalExpr(2, "DAILY")).toEqual(["every", "2", "days"]);
    expect(toEveryIntervalExpr(3, "WEEKLY")).toEqual(["every", "3", "weeks"]);
  });

  test("should handle case insensitive frequency", () => {
    expect(toEveryIntervalExpr(1, "daily")).toEqual(["every", "day"]);
    expect(toEveryIntervalExpr(2, "hourly")).toEqual(["every", "2", "hours"]);
  });
});

describe("toEveryDateExpr", () => {
  test("should return null for undefined inputs", () => {
    expect(toEveryDateExpr()).toBeNull();
    expect(toEveryDateExpr(undefined, [1])).toBeNull();
    expect(toEveryDateExpr([1])).toBeNull();
  });

  test("should return null only when both arrays have multiple values", () => {
    expect(toEveryDateExpr([1, 2], [1, 2])).toBeNull();
  });

  test("should handle single day with multiple months", () => {
    const result = toEveryDateExpr([1], [1, 2]);
    expect(result).toEqual(["every", "january"]);
  });

  test("should handle multiple days with single month", () => {
    const result = toEveryDateExpr([1, 2], [1]);
    expect(result).toEqual(["every", "january"]);
  });

  test("should return expression for day > 1", () => {
    const result = toEveryDateExpr([15], [6]);
    expect(result).toEqual(["every", "15 june"]);
  });

  test("should return expression for day = 1", () => {
    const result = toEveryDateExpr([1], [6]);
    expect(result).toEqual(["every", "june"]);
  });
});

describe("toRecurringExpression", () => {
  const timeOfTheDay = { morning: 9, afternoon: 15, evening: 18, night: 22 };

  test("should handle day of week recurring", () => {
    const ast = {
      byDayOfWeek: ["MO"],
      interval: 1,
      frequency: "WEEKLY" as const,
    };
    const result = toRecurringExpression(ast, { timeOfTheDay });
    expect(result).toEqual(["every", "monday"]);
  });

  test("should handle date recurring", () => {
    const ast = {
      byDayOfMonth: [15],
      byMonthOfYear: [6],
      frequency: "YEARLY" as const,
    };
    const result = toRecurringExpression(ast, { timeOfTheDay });
    expect(result).toEqual(["every", "15 june"]);
  });

  test("should handle month recurring", () => {
    const ast = {
      byMonthOfYear: [1],
      frequency: "YEARLY" as const,
    };
    const result = toRecurringExpression(ast, { timeOfTheDay });
    expect(result).toEqual(["every", "january"]);
  });

  test("should handle time of day recurring", () => {
    const ast = {
      byHourOfDay: [9],
      byMinuteOfHour: [0],
      frequency: "DAILY" as const,
    };
    const result = toRecurringExpression(ast, { timeOfTheDay });
    expect(result).toEqual(["every", "morning"]);
  });

  test("should handle interval recurring", () => {
    const ast = {
      interval: 2,
      frequency: "DAILY" as const,
    };
    const result = toRecurringExpression(ast, { timeOfTheDay });
    expect(result).toEqual(["every", "2", "days"]);
  });

  test("should handle recurring with time", () => {
    const ast = {
      byDayOfWeek: ["MO"],
      byHourOfDay: [9],
      byMinuteOfHour: [30],
      interval: 1,
      frequency: "WEEKLY" as const,
    };
    const result = toRecurringExpression(ast, { timeOfTheDay });
    expect(result).toEqual(["every", "monday", "at", "9:30"]);
  });
});

describe("toExpression", () => {
  const timeOfTheDay = { morning: 9, afternoon: 15, evening: 18, night: 22 };

  test("should handle simple task", () => {
    const ast = {
      subject: "test task",
    };
    const result = toExpression(ast, { timeOfTheDay });
    expect(result).toBe("test task");
  });

  test("should handle task with contexts and tags", () => {
    const ast = {
      subject: "test task",
      contexts: ["work", "personal"],
      tags: ["urgent", "important"],
    };
    const result = toExpression(ast, { timeOfTheDay });
    expect(result).toBe("@work @personal #urgent #important test task");
  });

  test("should handle task with start date", () => {
    const start = DateTime.local(2023, 6, 15, 14, 30);
    const ast = {
      subject: "test task",
      start,
    };
    const result = toExpression(ast, { timeOfTheDay });
    expect(result).toBe("test task 15/06/2023 at 14:30");
  });

  test("should handle task with start date and relative formatting", () => {
    const tomorrow = DateTime.now().startOf("day").plus({ days: 1 });
    const ast = {
      subject: "test task",
      start: tomorrow,
    };
    const result = toExpression(ast, { relative: true, timeOfTheDay });
    expect(result).toBe("test task tomorrow");
  });

  test("should handle recurring task", () => {
    const ast = {
      subject: "test task",
      frequency: "DAILY" as const,
      interval: 1,
    };
    const result = toExpression(ast, { timeOfTheDay });
    expect(result).toBe("test task every day");
  });

  test("should handle empty ast", () => {
    const ast = {};
    const result = toExpression(ast, { timeOfTheDay });
    expect(result).toBe("");
  });

  test("should handle task with URLs", () => {
    const ast = {
      subject: "test task",
      urls: ["https://example.com", "https://github.com/user/repo"],
    };
    const result = toExpression(ast, { timeOfTheDay });
    expect(result).toBe(
      "test task https://example.com https://github.com/user/repo",
    );
  });

  test("should handle task with contexts, tags, and URLs", () => {
    const ast = {
      subject: "test task",
      contexts: ["work"],
      tags: ["urgent"],
      urls: ["https://example.com"],
    };
    const result = toExpression(ast, { timeOfTheDay });
    expect(result).toBe("@work #urgent test task https://example.com");
  });
});
