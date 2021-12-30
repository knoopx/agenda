import { DateTime } from "luxon";
import { getParent, Instance, types as t } from "mobx-state-tree";
import { nanoid } from "nanoid";

import Expression from "./Expression";
import dateTime from "./DateTime";
import { IStore } from "./Store";
import { toJS } from "mobx";

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

    update(props: Partial<ITask>) {
      Object.assign(self, props);
    },
  }))
  .views((self) => {
    return {
      get isValid() {
        return !!(self.output && self.subject);
      },

      get implicitStart(): DateTime {
        return self.createdAt;
      },

      get highlightColor() {
        const { sortedTasks } = getParent(self, 2);
        return Colors[sortedTasks.indexOf(self) % Colors.length];
      },
    };
  });

export default Task;

export interface ITask extends Instance<typeof Task> {}
