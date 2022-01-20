import { DateTime, Settings } from "luxon";
import { expect, it } from "vitest";

import { Store } from ".";

const Now = DateTime.local(2021, 1, 1, 0, 0, 0);
Settings.now = () => Now.toMillis();

it("works", () => {
  const store = Store.create({
    tasks: [
      { id: "fixed", expression: "task tomorrow @work" },
      { id: "recurring", expression: "task every 2 days at 5 for 1w @home" },
    ],
  });

  expect(store.tasks.length).toEqual(2);
  expect(store.contexts).toMatchObject(["work", "home"]);
  expect(
    Array.from(store.getContextsAtDay(Now.plus({ days: 1 })))
  ).toMatchObject(["work"]);

  expect(Array.from(store.occurrencesByDay.values())[0][0]).toMatchObject({
    date: Now.set({ hour: 5 }),
    task: store.tasks[1],
  });
});
