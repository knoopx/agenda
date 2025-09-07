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
    lastModified: t.optional(dateTime, () => DateTime.now()),
    isCompleted: t.optional(t.boolean, false),
    completionCount: t.optional(t.number, 0),
  })
  .actions((self) => ({
    update(props: Partial<ITask>) {
      Object.assign(self, props);
      self.lastModified = DateTime.now();
    },

    complete() {
      const now = DateTime.now();

      if (self.isCompleted) {
        // Uncomplete the task - decrement count if > 0
        self.isCompleted = false;
        if (self.completionCount > 0) {
          self.completionCount--;
        }
        self.lastModified = now;
        return;
      }

      // Add completion
      self.completionCount++;

      if (self.isRecurring) {
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
          self.lastModified = now;
          return;
        }
      }
      // For non-recurring tasks, set lastCompletedAt to completion time
      self.lastCompletedAt = now;
      self.isCompleted = true;
      self.lastModified = now;
    },

    remove() {
      const parent = getParent(self, 2) as IStore;
      parent.removeTask(self as ITask);
    },

     reset() {
       self.lastCompletedAt = self.createdAt;
       self.completionCount = 0;
     },

     finalizeExpression() {
       if (self.ast) {
         self.expression = self.simplifiedExpression.trim();
       } else {
         self.expression = self.expression.trim();
       }
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
        try {
          const parent = getParent(self, 2) as IStore;
          return parent.getContextColor(self.context);
        } catch {
          // Fallback for detached tasks (e.g., during editing)
          return "var(--base03)";
        }
      },

      get timeOfTheDay(): ITimeOfTheDay {
        try {
          const parent = getParent(self, 2) as IStore;
          return parent.timeOfTheDay;
        } catch {
          // Fallback for detached tasks (e.g., during editing)
          return {
            morning: 9,
            afternoon: 15,
            evening: 18,
            night: 22,
            set: () => {}, // Add set method to satisfy ITimeOfTheDay interface
          };
        }
      },

      get completionStats() {
        if (!self.isRecurring) return null;

        // For recurring tasks, calculate total time spent across all completions
        let totalTimeSpent = null;
        if (self.createdAt && self.lastCompletedAt && self.completionCount > 0) {
          totalTimeSpent = self.lastCompletedAt.diff(self.createdAt);
        }

        return {
          total: self.completionCount,
          totalTimeSpent,
        };
      },

      get parsedUrls() {
        return self.urls.map((url) => {
          try {
            const parsed = new URL(url);
            const parts = parsed.hostname.split(".");
            const domain =
              parts.length >= 2 ? parts.slice(-2).join(".") : parsed.hostname;
            return { url, domain };
          } catch {
            return { url, domain: null };
          }
        });
      },
    };
  });

export default Task;

export interface ITask extends Instance<typeof Task> {}
export interface ITaskSnapshotIn extends SnapshotIn<typeof Task> {}
export interface ITaskSnapshotOut extends SnapshotOut<typeof Task> {}
