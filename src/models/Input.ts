import { DateTime } from "luxon";
import { getParent } from "mobx-state-tree";

import { IStore, ITimeOfTheDay } from "./Store";
import Expression from "./Expression";

const Input = Expression.named("Input").views((self) => {
  const store: IStore = getParent(self);

  return {
    get isValid() {
      return !!(self.ast && self.subject);
    },

    get occurrences(): DateTime[] {
      return self.getOccurrences({
        start: store.calendarStart,
        end: store.calendarEnd,
      });
    },

    get occurrencesByDay() {
      const result = new Map();
      this.occurrences.forEach((occurence) => {
        const day = occurence.startOf("day").toISO();
        result.set(day, result.get(day) ?? 0 + 1);
      });
      return result;
    },

    occurrencesAtDay(day: DateTime) {
      return this.occurrencesByDay.get(day.startOf("day").toISO()) ?? 0;
    },

    get timeOfTheDay(): ITimeOfTheDay {
      const { timeOfTheDay } = store;
      return timeOfTheDay;
    },
  };
});

export default Input;
