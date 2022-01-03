import { DateTime, Settings } from "luxon";
import { expect, it } from "vitest";

import { Store } from ".";

const Now = DateTime.local(2021, 1, 1, 0, 0, 0);
Settings.now = () => Now.toMillis();

it("works", () => {
  const store = Store.create({
    tasks: [
      { id: "recurring", expression: "task every 2 days at 5 for 1w @home" },
      { id: "fixed", expression: "task tomorrow @work" },
    ],
  });

  expect(store.tasks.length).toEqual(2);
  expect(store.contexts).toEqual(["home", "work"]);
  expect(Array.from(store.getContextsAtDay(Now.plus({ days: 1 })))).toEqual([
    "work",
  ]);

  expect(Array.from(store.occurrencesByDay.values())[0][0]).toEqual(
    store.tasks[0]
  );
});
