import { DateTime } from "luxon";
import {
  getParent,
  Instance,
  SnapshotIn,
  SnapshotOut,
  types as t,
} from "mobx-state-tree";
import { nanoid } from "nanoid";

import Expression from "./Expression";
import dateTime from "./DateTime";
import { IStore } from ".";
import { ITimeOfTheDay } from "./Store";

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
      if (self.isRecurring) {
        const now = DateTime.now();
        let nextAt = self.nextAfter(now);
        if (nextAt) {
          if (now < nextAt) {
            nextAt = self.nextAfter(nextAt, true);
            if (nextAt) {
              self.lastCompletedAt = nextAt;
            }
          } else {
            self.lastCompletedAt = now;
          }
          return;
        }
      }
      this.remove();
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
        return !!(self.ast && self.subject);
      },

      get implicitStart(): DateTime {
        // if (self.start && self.start > self.lastCompletedAt) {
        //   return self.start;
        // }
        return self.lastCompletedAt.toLocal();
      },

      get contextColor(): string {
        const parent = getParent(self, 2) as IStore;
        return parent.getContextColor(self.context);
      },

      get timeOfTheDay(): ITimeOfTheDay {
        const { timeOfTheDay } = getParent(self, 2);
        return timeOfTheDay;
      },
    };
  });

export default Task;

export interface ITask extends Instance<typeof Task> {}
export interface ITaskSnapshotIn extends SnapshotIn<typeof Task> {}
export interface ITaskSnapshotOut extends SnapshotOut<typeof Task> {}
