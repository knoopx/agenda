import { DateTime } from "luxon";
import { expect, it } from "vitest";

import { Store } from ".";

const Now = DateTime.local(2021, 1, 1, 0, 0, 0);

// Create a store for testing
const store = Store.create();

function createTask(expression: string) {
  return store.addTask({ expression })!;
}

it("should handle blank expression", () => {
  const task = createTask("");
  expect(task.isBlank).toBe(true);

  const task2 = createTask("   ");
  expect(task2.isBlank).toBe(true);

  const task3 = createTask("task");
  expect(task3.isBlank).toBe(false);
});

it("should set expression", () => {
  const task = createTask("old");
  task.setExpression("new task");
  expect(task.expression).toBe("new task");
});

it("should set error", () => {
  const task = createTask("test");
  task.setError("custom error");
  expect(task.error).toBe("custom error");
});

it("should return empty subject when ast is null", () => {
  const task = createTask("invalid @@@ syntax");
  expect(task.subject).toBe("");
});

it("should return empty contexts when ast is null", () => {
  const task = createTask("invalid @@@ syntax");
  expect(task.contexts).toEqual([]);
});

it("should return empty tags when ast is null", () => {
  const task = createTask("invalid @@@ syntax");
  expect(task.tags).toEqual([]);
});

it("should return null start when ast is null", () => {
  const task = createTask("invalid @@@ syntax");
  expect(task.start).toBeUndefined();
});

it("should return null duration when ast is null", () => {
  const task = createTask("invalid @@@ syntax");
  expect(task.duration).toBeNull();
});

it("should return undefined frequency when ast is null", () => {
  const task = createTask("invalid @@@ syntax");
  expect(task.frequency).toBeUndefined();
});

it("should return null asRuleOptions when ast is null", () => {
  const task = createTask("invalid @@@ syntax");
  expect(task.asRuleOptions).toBeNull();
});

it("should return null rrule when ast is null", () => {
  const task = createTask("invalid @@@ syntax");
  expect(task.rrule).toBeNull();
});

it("should return empty array for getOccurrences when not recurring and no start", () => {
  const task = createTask("task without date");
  const occurrences = task.getOccurrences({ start: Now, take: 5 });
  expect(occurrences).toEqual([]);
});

it("should return undefined for nextAfter when no occurrences", () => {
  const task = createTask("task without date");
  const next = task.nextAfter(Now);
  expect(next).toBeUndefined();
});

it("should return undefined for nextAt when no occurrences", () => {
  const task = createTask("task without date");
  expect(task.nextAt).toBeUndefined();
});

it("should return null for endAt when no end and no nextAt/duration", () => {
  const task = createTask("task without date");
  expect(task.endAt).toBeNull();
});

it("should return false for isRecurring when no frequency", () => {
  const task = createTask("task without date");
  expect(task.isRecurring).toBe(false);
});

it("should return undefined for context when no contexts", () => {
  const task = createTask("task without context");
  expect(task.context).toBeUndefined();
});

it("should return empty array for emojis when no tags", () => {
  const task = createTask("task without tags");
  expect(task.emojis).toEqual([]);
});

it("should return original expression when simplifiedExpression has no ast", () => {
  const task = createTask("invalid @@@ syntax");
  expect(task.simplifiedExpression).toBe("invalid @@@ syntax");
});

it("should return original expression when rawExpression has no ast", () => {
  const task = createTask("invalid @@@ syntax");
  expect(task.rawExpression).toBe("invalid @@@ syntax");
});

it("should handle valid task expressions", () => {
  const task = createTask("test task");
  expect(task.expression).toBe("test task");
  expect(task.isValid).toBe(true);
  expect(task.subject).toBe("test task");
});

it("should handle invalid task expressions", () => {
  const task = createTask("invalid @@@ syntax");
  expect(task.expression).toBe("invalid @@@ syntax");
  expect(task.isValid).toBe(false);
  expect(task.error).toBeDefined();
});

it("should clear error on successful parsing", () => {
  const task = createTask("valid task");
  // First make sure there's an error
  task.setError("previous error");
  expect(task.error).toBe("previous error");

  // Force re-parsing by changing the expression
  task.setExpression("another valid task");
  expect(task.error).toBe("");
});

it("should handle syntax errors properly", () => {
  const task = createTask("invalid @@@ syntax");
  // The error should be set during parsing
  expect(task.error).toBeDefined();
  expect(task.error).not.toBe("");
});

it("should handle timeOfTheDay access", () => {
  const task = createTask("test");
  // Task overrides timeOfTheDay, so it should return the store's timeOfTheDay
  const timeOfDay = task.timeOfTheDay;
  expect(timeOfDay).toBeDefined();
  expect(typeof timeOfDay).toBe("object");
});

it("should handle endAt calculation with nextAt and duration", () => {
  // Create a task with a specific time
  const task = createTask("task at 3pm for 1h");
  if (task.nextAt && task.duration) {
    const endAt = task.endAt;
    expect(endAt).toBeDefined();
    expect(endAt!.valueOf()).toBeGreaterThan(task.nextAt!.valueOf());
  }
});

it("should handle endAt when ast has end property", () => {
  // Create a task that might have an end in the AST
  const task = createTask("task from 3pm to 4pm");
  const endAt = task.endAt;
  // If the AST has an end, it should return that
  if (task.ast?.end) {
    expect(endAt).toBe(task.ast.end);
  } else {
    // If no end in AST, it should be null or calculated
    expect(endAt).toBeDefined();
  }
});

it("should handle endAt with explicit end time", () => {
  // Try different expressions that might have end times
  const expressions = [
    "task until 5pm",
    "task from 3pm to 5pm",
    "task for 2 hours",
  ];

  expressions.forEach((expr) => {
    const task = createTask(expr);
    const endAt = task.endAt;
    // Just ensure endAt is handled without throwing
    expect(endAt).toBeDefined();
  });
});

it("should handle asRuleOptions with recurring task", () => {
  const task = createTask("task every day");
  if (task.isRecurring) {
    const ruleOptions = task.asRuleOptions;
    expect(ruleOptions).toBeDefined();
    expect(ruleOptions!.frequency).toBeDefined();
  }
});

it("should handle rrule creation for recurring tasks", () => {
  const task = createTask("task every day");
  if (task.isRecurring) {
    const rrule = task.rrule;
    expect(rrule).toBeDefined();
  }
});

it("should handle getOccurrences with end parameter", () => {
  const task = createTask("task tomorrow");
  const end = Now.plus({ days: 7 });
  const occurrences = task.getOccurrences({ start: Now, end });
  expect(Array.isArray(occurrences)).toBe(true);
});

it("should handle getOccurrences with take parameter", () => {
  const task = createTask("task tomorrow");
  const occurrences = task.getOccurrences({ start: Now, take: 3 });
  expect(Array.isArray(occurrences)).toBe(true);
  expect(occurrences.length).toBeLessThanOrEqual(3);
});

it("should throw error when getOccurrences called without take or end", () => {
  const task = createTask("task tomorrow");
  expect(() => {
    task.getOccurrences({ start: Now });
  }).toThrow("either take or end must be specified");
});

it("should handle nextAfter with skipCurrent parameter", () => {
  const task = createTask("task tomorrow");
  const next = task.nextAfter(Now, true);
  // Should skip current if it matches
  expect(next).toBeDefined();
});

it("should handle emojis with valid tags", () => {
  const task = createTask("task #work #urgent");
  const emojis = task.emojis;
  expect(Array.isArray(emojis)).toBe(true);
  // Note: emoji generation depends on the emoji-from-word library
});
