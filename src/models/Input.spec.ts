import { DateTime, Settings } from "luxon";
import { expect, test } from "vitest";
import { Store } from ".";

const Now = DateTime.local(2020, 1, 1);
Settings.now = () => Now.toMillis();

test("Input", () => {
   const store = Store.create();
   store.input.setExpression("task tomorrow");
   expect(store.input.occurrences.length).toEqual(1);
   const occurrence = store.input.occurrences[0];
   expect(occurrence.year).toEqual(2020);
   expect(occurrence.month).toEqual(1);
   expect(occurrence.day).toEqual(2);
   expect(store.input.timeOfTheDay).toEqual(store.timeOfTheDay);
 });
