import { DateTime } from "luxon";
import { getParent, Instance, types as t } from "mobx-state-tree";
import { nanoid } from "nanoid";

import Expression from "./Expression";
import dateTime from "./DateTime";

export const Colors = [
  // "amber",
  "yellow",
  "green",
  "orange",
  "blue",
  "red",
  // "emerald",
  // "teal",
  // "cyan",
  "violet",
  "purple",
  "sky",
  "fuchsia",
  "indigo",
  "pink",
  "lime",
  "rose",
];

const Task = Expression.named("Task")
  .props({
    id: t.optional(t.identifier, () => nanoid()),
    createdAt: t.optional(dateTime, () => DateTime.now()),
    lastCompletedAt: t.optional(dateTime, () => DateTime.now()),
  })
  .actions((self) => ({
    update(props: Partial<ITask>) {
      Object.assign(self, props);
    },

    complete() {
      if (self.isRecurring && self.nextAt) {
        self.lastCompletedAt = self.nextAt;
      } else {
        this.remove();
      }
    },

    remove() {
      const { removeTask } = getParent(self, 2);
      removeTask(self);
    },

    reset() {
      self.lastCompletedAt = self.createdAt;
    },
  }))
  .views((self) => {
    return {
      get isValid() {
        return !!(self.output && self.subject);
      },

      get implicitStart(): DateTime {
        return self.lastCompletedAt.toLocal();
      },

      get highlightColor() {
        try {
          const { sortedTasks } = getParent(self, 2);
          return Colors[sortedTasks.indexOf(self) % Colors.length];
        } catch (e) {
          return null
        }
      },
    };
  });

export default Task;

export interface ITask extends Instance<typeof Task> {}
