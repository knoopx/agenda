import { DateTime, Settings } from "luxon";
import { expect, test } from "vitest";
import { Store, Task } from ".";

Settings.defaultZone = "Europe/Madrid";
const Now = DateTime.local(2020, 1, 1);
Settings.now = () => Now.toMillis();

test("Agenda", () => {
  const store = Store.create();
  const task = Task.create({ expression: "task every monday" });
  store.addTask(task);
  expect(store.agenda.groupEntries).toMatchObject([["next week", [task]]]);
});
