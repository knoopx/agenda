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
    get ast() {
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
      return !!this.ast;
    },

    get isBlank() {
      return self.expression.trim() === "";
    },

    get context(){
      return this.ast?.context
    },

    get subject() {
      return this.ast?.subject ?? "";
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
      return this.ast?.duration;
    },

    get frequency() {
      return this.ast?.frequency;
    },

    get rrule() {
      if (!this.ast) return null;

      const { subject, duration, start = this.implicitStart, ...rrule } = this.ast;

      if (Object.keys(rrule).length === 0) return null;

      return {
        start,
        ...(duration && {duration: duration.toMillis()}),
        ...rrule,
      };
    },

    get schedule() {
      if (this.isRecurring) {
        return new Schedule<ITask>({ rrules: [this.rrule].filter(Boolean) });
      }
      if (this.ast && this.ast.start) {
        return new Schedule<ITask>({ rdates: [this.ast.start] });
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

    get simplifiedExpression(){
      let parts = [this.ast.subject]

      if (this.ast.start.year === DateTime.now().year) {
        parts.push(this.ast.start.toFormat("dd/MM"))
      } else {
        parts.push(this.ast.start.toFormat("dd/MM/YYYY"))
      }

      if (!(this.ast.start.hour === 0 && this.ast.start.minute === 0)) {
        parts = [
          ...parts,
          "at",
          this.ast.start.toLocaleString({
            hour: "2-digit",
            minute: "2-digit",
            hourCycle: "h23",
          }),
        ]
      }

      if (this.context)
        parts.push("@" + this.context)

      return parts.join(" ")
    }
  }));

export default Expression;
