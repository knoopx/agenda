import { DateTime, Settings } from "luxon";
import { expect, test } from "vitest";
import { Store, Task } from ".";

Settings.defaultZone = "Europe/Madrid";
const Now = DateTime.local(2020, 1, 1);
Settings.now = () => Now.toMillis();

test("Input", () => {
  const store = Store.create();
  store.input.setExpression("task tomorrow");
  expect(store.input.occurrences.length).toEqual(1);
  expect(store.input.occurrencesAtDay(DateTime.local(2020, 1, 1))).toEqual(0);
  expect(store.input.occurrencesAtDay(DateTime.local(2020, 1, 2))).toEqual(1);
  expect(store.input.timeOfTheDay).toEqual(store.timeOfTheDay);
});
