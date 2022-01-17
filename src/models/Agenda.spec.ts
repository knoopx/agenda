import { expect, test } from "vitest";
import { Store, Task } from ".";

test("Agenda", () => {
  const store = Store.create();
  const task = Task.create({ expression: "task every monday" });
  store.addTask(task);
  expect(store.agenda.groupEntries).toMatchObject([["next week", [task]]]);
});
