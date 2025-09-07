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

it("should complete non-recurring task", () => {
  const task = make("task today");
  expect(task.isCompleted).toBe(false);
  expect(task.completionCount).toBe(0);

  task.complete();

  expect(task.isCompleted).toBe(true);
  expect(task.completionCount).toBe(1);
});

it("should uncomplete task", () => {
  const task = make("task today");
  task.complete();
  expect(task.isCompleted).toBe(true);
  expect(task.completionCount).toBe(1);

  task.complete(); // Should uncomplete

  expect(task.isCompleted).toBe(false);
  expect(task.completionCount).toBe(0);
});

it("should handle recurring task completion when now >= nextAt", () => {
  // Create a recurring task
  const task = make("task every day at 10");

  // Set now to exactly the next occurrence time
  Now = DateTime.local(2020, 1, 2, 10, 0); // 10 AM on Jan 2 (exact time of occurrence)
  Settings.now = () => Now.toMillis();

  expect(task.isRecurring).toBe(true);
  expect(task.nextAt).toBeDefined();

  // Now is exactly at the next occurrence time, so now >= nextAt should trigger the else branch
  task.complete();

  expect(task.isCompleted).toBe(false); // Should not be completed for recurring tasks
  expect(task.lastCompletedAt).toBeDefined(); // Should set lastCompletedAt to now
});

it("should handle recurring task completion when now < nextAt", () => {
  const task = make("task every day at 15"); // 3 PM

  // Set now to be before the next occurrence
  Now = DateTime.local(2020, 1, 1, 10, 0); // 10 AM on Jan 1
  Settings.now = () => Now.toMillis();

  expect(task.isRecurring).toBe(true);
  expect(task.nextAt).toBeDefined();

  task.complete();

  expect(task.isCompleted).toBe(false); // Should not be completed for recurring tasks
  // Should set lastCompletedAt to the next next occurrence
  expect(task.lastCompletedAt).toBeDefined();
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
    frequency: "WEEKLY",
    byDayOfWeek: ["MO"],
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

  expect(task.nextAt?.hasSame(DateTime.local(2020, 1, 13), "day")).toEqual(
    true,
  );
});

it("detached task contextColor fallback", () => {
  const task = Task.create({ expression: "task @work" });
  // Detached task should use fallback color
  expect(task.contextColor).toBe("var(--base03)");
});

it("detached task timeOfTheDay fallback", () => {
  const task = Task.create({ expression: "task" });
  const tod = task.timeOfTheDay;
  expect(tod.morning).toBe(9);
  expect(tod.afternoon).toBe(15);
  expect(tod.evening).toBe(18);
  expect(tod.night).toBe(22);
});

it("reset task", () => {
  const task = make("task every monday");
  task.complete();
  expect(task.completionCount).toBe(1);
  task.reset();
  expect(task.completionCount).toBe(0);
  expect(task.lastCompletedAt).toEqual(task.createdAt);
});

it("completionStats for recurring task", () => {
  const task = make("task every monday");
  expect(task.completionStats).toEqual({ total: 0 });
  task.complete();
  expect(task.completionStats).toEqual({ total: 1 });
});

it("completionStats for non-recurring task", () => {
  const task = make("task today");
  expect(task.completionStats).toBeNull();
});

it("remove task", () => {
  const task = make("task to remove");
  expect(store.tasks.length).toBeGreaterThan(0);
  const initialLength = store.tasks.length;
  task.remove();
  expect(store.tasks.length).toBe(initialLength - 1);
});

it("should update task properties", () => {
  const task = make("task to update");
  const originalCompletionCount = task.completionCount;

  // Update the task with new properties
  task.update({ completionCount: 5 });

  expect(task.completionCount).toBe(5);
  expect(task.completionCount).not.toBe(originalCompletionCount);
});

it("complete non-recurring task", () => {
  const task = make("task today");
  expect(task.isCompleted).toBe(false);
  task.complete();
  expect(task.isCompleted).toBe(true);
});

it("uncomplete task", () => {
  const task = make("task today");
  task.complete();
  expect(task.isCompleted).toBe(true);
  expect(task.completionCount).toBe(1);
  task.complete(); // Uncomplete
  expect(task.isCompleted).toBe(false);
  expect(task.completionCount).toBe(0);
});
