import { DateTime, Duration } from "luxon";
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

    get implicitDuration() {
      const now = DateTime.now();

      if (self.duration) {
        return self.duration;
      }

      if (self.start) {
        if (self.endAt) {
          return self.endAt.diff(self.start);
        }

        // next day
        if (
          self.start.toMillis() ===
          now.plus({ days: 1 }).startOf("day").toMillis()
        ) {
          return Duration.fromObject({ days: 1 });
        }

        // next week
        if (
          self.start.toMillis() ===
          now.plus({ weeks: 1 }).startOf("week").toMillis()
        ) {
          return Duration.fromObject({ weeks: 1 });
        }

        // next month
        if (
          self.start.toMillis() ===
          now.plus({ months: 1 }).startOf("month").toMillis()
        ) {
          return Duration.fromObject({ months: 1 });
        }

        // next year
        if (
          self.start.toMillis() ===
          now.plus({ years: 1 }).startOf("year").toMillis()
        ) {
          return Duration.fromObject({ years: 1 });
        }
      }

      if (store.filteredTasks.length) {
        const dates = store.filteredTasks
          .map((x) => x.nextAt)
          .filter(Boolean)
          .sort() as DateTime[];

        if (dates.length) {
          return dates[dates.length - 1].diff(dates[0]);
        }
      }
    },

    get implicitEndAt(): DateTime | null {
      if (self.endAt) {
        return self.endAt;
      }

      if (self.nextAt && this.implicitDuration) {
        return self.nextAt.plus(this.implicitDuration);
      }

      return null;
    },
  };
});

export default Input;
