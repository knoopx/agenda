import { DateTime } from "luxon";
import { getParent } from "mobx-state-tree";

import Store, { IStore } from "./Store";
import Expression from "./Expression";
import { DateAdapter } from "../schedule";

const Input = Expression.named("Input").views((self) => {
  const store: IStore = getParent(self);

  return {
    get isValid() {
      return !!(self.output && self.subject);
    },

    get implicitStart() {
      return DateTime.now();
    },

    get occurrences(): DateAdapter[] {
      return self.schedule
        .occurrences({
          start: store.calendarStart,
          end: store.calendarEnd,
        })
        .toArray();
    },

    get occurrencesByDay() {
      const result = new Map();
      this.occurrences.forEach((occurence) => {
        const day = occurence.date.startOf("day").toISO();
        result.set(day, result.get(day) ?? 0 + 1);
      });
      return result;
    },

    occurrencesAtDay(day: DateTime) {
      return this.occurrencesByDay.get(day.startOf("day").toISO()) ?? 0;
    },
  };
});

export default Input;
