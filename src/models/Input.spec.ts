import { DateTime, Settings } from "luxon";
import { expect, test, describe } from "vitest";
import { Store } from ".";

const Now = DateTime.local(2020, 1, 1);
Settings.now = () => Now.toMillis();

describe("Input", () => {
  test("basic occurrences", () => {
    const store = Store.create();
    store.input.setExpression("task tomorrow");
    expect(store.input.occurrences.length).toEqual(1);
    const occurrence = store.input.occurrences[0];
    expect(occurrence.year).toEqual(2020);
    expect(occurrence.month).toEqual(1);
    expect(occurrence.day).toEqual(2);
    expect(store.input.timeOfTheDay).toEqual(store.timeOfTheDay);
  });

  test("occurrencesByDay and occurrencesAtDay", () => {
    const store = Store.create();
    store.input.setExpression("task tomorrow");
    const day = DateTime.local(2020, 1, 2);
    expect(store.input.occurrencesAtDay(day)).toEqual(1);
    expect(store.input.occurrencesByDay.get(day.toISO())).toEqual(1);
  });

  test("implicitDuration with explicit duration", () => {
    const store = Store.create();
    store.input.setExpression("task tomorrow for 2 hours");
    expect(store.input.implicitDuration?.as("hours")).toEqual(2);
  });

  test("implicitDuration with start and endAt", () => {
    const store = Store.create();
    store.input.setExpression("task from tomorrow to day after tomorrow");
    const duration = store.input.implicitDuration;
    expect(duration?.as("days")).toEqual(1);
    expect(duration?.as("days")).toEqual(1);
  });

  test("implicitEndAt with explicit endAt", () => {
    const store = Store.create();
    store.input.setExpression("task from tomorrow to day after tomorrow");
    const endAt = store.input.implicitEndAt;
    expect(endAt).toBeDefined();
    expect(endAt?.day).toEqual(3);
  });

  test("implicitEndAt with nextAt and implicitDuration", () => {
    const store = Store.create();
    store.input.setExpression("task tomorrow for 2 hours");
    const endAt = store.input.implicitEndAt;
    expect(endAt).toBeDefined();
    expect(endAt?.hour).toEqual(2); // assuming default time
  });

  test("implicitEndAt with nextAt and implicitDuration", () => {
    const store = Store.create();
    store.input.setExpression("task tomorrow");
    const endAt = store.input.implicitEndAt;
    expect(endAt).toBeDefined();
    expect(endAt?.day).toEqual(3); // tomorrow + 1 day
  });

  test("implicitDuration with start matching next day", () => {
    const store = Store.create();
    store.input.setExpression("task tomorrow");
    const duration = store.input.implicitDuration;
    expect(duration?.as("days")).toEqual(1);
  });

  test("implicitDuration with start matching next week", () => {
    const store = Store.create();
    store.input.setExpression("task next week");
    const duration = store.input.implicitDuration;
    expect(duration?.as("weeks")).toEqual(1);
  });

  test("implicitDuration with start matching next month", () => {
    const store = Store.create();
    store.input.setExpression("task next month");
    const duration = store.input.implicitDuration;
    expect(duration?.as("months")).toEqual(1);
  });

  test("implicitDuration with start matching next year", () => {
    const store = Store.create();
    store.input.setExpression("task next year");
    const duration = store.input.implicitDuration;
    expect(duration?.as("years")).toEqual(1);
  });

  test("implicitDuration fallback with filteredTasks", () => {
    const store = Store.create();
    // Create tasks with different nextAt times
    store.addTask({ expression: "task tomorrow" });
    store.addTask({ expression: "task in 3 days" });

    // Check implicitDuration when filteredTasks is not empty (before setting input)
    const duration = store.input.implicitDuration;
    // Should calculate duration based on the difference between the latest and earliest nextAt
    expect(duration).toBeDefined();
    expect(duration?.as("days")).toBe(2); // 3 days - 1 day = 2 days difference
  });
});
