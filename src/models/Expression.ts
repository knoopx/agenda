import { types as t } from "mobx-state-tree";
import { DateTime, Duration } from "luxon";

import grammar from "../grammar.pegjs";
import { Dates, IOccurrencesArgs, Rule } from "../schedule";
import { IRuleOptions } from "@rschedule/core";
import type { parser } from "peggy";

import {
  ICalRuleFrequency,
  INormRRuleOptions,
} from "@rschedule/core/rules/ICAL_RULES";
import { toExpression } from "../helpers/toExpression";

export type IExpressionResult = Omit<
  Omit<INormRRuleOptions, "start">,
  "duration"
> & {
  subject: string;
  start: DateTime;
  context: string;
  duration: Duration;
};

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
    get ast(): IExpressionResult | null {
      try {
        const out = grammar.parse(self.expression, {
          grammarSource: "",
          startRule: "Root",
          hours: this.timeOfTheDay,
        });
        self.setError("");
        return out;
      } catch (e: any) {
        if (e instanceof grammar.SyntaxError) {
          if (e.message) self.setError(e.message);
          return null;
        } else {
          throw e;
        }
      }
    },

    get isValid() {
      return !!this.ast;
    },

    get isBlank() {
      return self.expression.trim() === "";
    },

    get context() {
      return this.ast?.context;
    },

    get subject() {
      return this.ast?.subject ?? "";
    },

    get isRecurring() {
      return !!this.frequency;
    },

    get start() {
      return this.ast?.start;
    },

    // endAt(): DateTime | null {
    //   if (this.nextAt && this.duration) {
    //     return this.nextAt.plus(this.duration);
    //   }
    //   return null;
    // },

    get duration(): Duration | void {
      return this.ast?.duration;
    },

    get frequency(): ICalRuleFrequency | undefined {
      return this.ast?.frequency;
    },

    get asObject(): IRuleOptions | null {
      if (!this.ast) return null;

      const {
        subject,
        duration,
        start = this.implicitStart,
        ...rrule
      } = this.ast;

      if (Object.keys(rrule).length === 0) return null;

      return {
        ...rrule,
        ...(duration && { duration: duration.toMillis() }),
        start,
      };
    },

    get rrule() {
      return this.asObject && new Rule(this.asObject);
    },

    getOccurrences({
      start = DateTime.now(),
      take,
      end,
    }: {
      start: DateTime;
      take?: number;
      end?: DateTime;
    }): DateTime[] {
      let target;

      if (!take && !end) {
        throw new Error("Either take or end must be specified");
      }

      if (this.isRecurring && this.rrule) {
        target = this.rrule;
      } else if (this.start) {
        target = new Dates({ dates: [this.start] });
      } else {
        return [];
      }

      let index = 1;
      const matches = [] as DateTime[];
      for (const { date } of target.occurrences()) {
        if (take && index > take) break;
        if (end && date > end) break;
        if (date > start) {
          matches.push(date as DateTime);
        }
        ++index;
      }

      return matches;
    },

    nextAfter(start: DateTime): DateTime | null {
      return this.getOccurrences({ start, take: 2 })[0];
    },

    get nextAt() {
      return this.nextAfter(this.implicitStart);
    },

    get implicitStart(): DateTime {
      return DateTime.now();
    },

    get simplifiedExpression(): string {
      if (this.ast) {
        return toExpression(this.ast, this.timeOfTheDay);
      }

      return self.expression;
    },

    timeOfTheDay(): { [key: string]: number } {
      throw new Error("Not implemented");
    },

    get completions() {
      try {
        grammar.parse(self.expression, {
          grammarSource: "",
        });
      } catch (e) {
        if (e instanceof grammar.SyntaxError) {
          const completions = [] as string[];
          if (e.expected) {
            const start = self.expression.substring(0, e.location.start.offset);
            e.expected.forEach((expected: parser.Expectation) => {
              if (expected.type != "literal") return;
              const completion = start + expected;
              if (
                completion.substr(0, self.expression.length) == self.expression
              ) {
                completions.push(completion);
              }
            });
          }
          return completions;
        }
      }
    },
  }));

export default Expression;
