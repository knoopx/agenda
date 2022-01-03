import { types as t } from "mobx-state-tree";
import { DateTime, Duration } from "luxon";

import grammar from "../grammar.pegjs";
import { Schedule } from "../schedule";
import { ITask } from "./Task";

const Expression = t
  .model("Expression", {
    expression: t.string,
  })
  .volatile(() => ({
    error: "",
  }))
  .actions((self) => ({
    setExpression(expression: string) {
      self.expression = expression;
    },
    setError(error: string) {
      self.error = error;
    },
  }))
  .views((self) => ({
    get output() {
      try {
        const out = grammar.parse(self.expression, {
          grammarSource: "",
          startRule: "Root",
        });
        self.setError("");
        return out;
      } catch (e: any) {
        if (e.message) self.setError(e.message);
        return null;
      }
    },

    get isValid() {
      return !!this.output;
    },

    get subject() {
      return this.output?.subject ?? "";
    },

    get isRecurring() {
      return !!this.frequency;
    },

    endAt(): DateTime | null {
      if (this.nextAt && this.duration) {
        return this.nextAt.plus(this.duration);
      }
      return null;
    },

    get duration(): Duration | null {
      return this.output?.duration;
    },

    get frequency() {
      return this.output?.frequency;
    },

    get rrule() {
      if (!this.output) return null;

      const { subject, duration, start = this.implicitStart, ...rrule } = this.output;

      if (Object.keys(rrule).length === 0) return null;

      return {
        start,
        ...rrule,
      };
    },

    get schedule() {
      if (this.isRecurring) {
        return new Schedule<ITask>({ rrules: [this.rrule].filter(Boolean) });
      }
      if (this.output && this.output.start) {
        return new Schedule<ITask>({ rdates: [this.output.start] });
      }
    },

    nextAfter(start: DateTime): DateTime | void {
      if (this.schedule){
        const { value } = this.schedule.occurrences({ start, take: 1 }).next();
        return value?.date;
      }
    },

    get nextAt() {
      return this.nextAfter(DateTime.now());
    },

    get implicitStart() {
      return DateTime.now();
    },
  }));

export default Expression;
