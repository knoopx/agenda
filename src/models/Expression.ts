import emojiFromWord from "emoji-from-word";

import { types as t } from "mobx-state-tree";
import { DateTime, Duration } from "luxon";

import grammar from "../grammar.pegjs";
import { Dates, Rule } from "../schedule";
import { IRRuleOptions } from "@rschedule/core/rules/ICAL_RULES";
import { LuxonDateAdapter } from "@rschedule/luxon-date-adapter/v2";

import { ICalRuleFrequency } from "@rschedule/core/rules/ICAL_RULES";

import { toExpression } from "../helpers/toExpression";

export type IExpressionAST = {
  start?: DateTime;
  end?: DateTime;
  duration?: Duration;
  subject?: string;
  contexts?: string[];
  tags?: string[];
  interval?: number;
  frequency?: "MINUTELY" | "HOURLY" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  byMinuteOfHour?: number[];
  byHourOfDay?: number[];
  byDayOfMonth?: number[];
  byMonthOfYear?: number[];
  byDayOfWeek?: string[];
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
    get ast(): IExpressionAST | null {
      try {
        const out = grammar.parse(self.expression, {
          grammarSource: "",
          startRule: "Root",
          hours: this.timeOfTheDay,
        });
        self.setError("");
        return out;
      } catch (e) {
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
      return this.contexts[0];
    },

    get contexts() {
      return this.ast?.contexts ?? [];
    },

    get tags() {
      return this.ast?.tags ?? [];
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

    get endAt(): DateTime | null {
      if (this.ast?.end) {
        return this.ast?.end;
      }

      if (this.nextAt && this.duration) {
        return this.nextAt.plus(this.duration);
      }

      return null;
    },

    get duration(): Duration | null {
      return this.ast?.duration ?? null;
    },

    get frequency(): ICalRuleFrequency | undefined {
      return this.ast?.frequency;
    },

    get asRuleOptions(): IRRuleOptions | null {
      if (!this.ast) return null;
      if (!this.frequency) return null;

      const {
        duration,
        start = this.implicitStart,
        ...rrule
      } = this.ast;

      if (Object.keys(rrule).length === 0) return null;

      return {
        ...rrule,
        ...(duration && { duration: duration.toMillis() }),
        start,
      } as IRRuleOptions;
    },

    get rrule() {
      return this.asRuleOptions && new Rule(this.asRuleOptions);
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
        throw new Error("either take or end must be specified");
      }

      if (this.isRecurring && this.rrule) {
        target = this.rrule;
      } else if (this.start) {
        // Ensure consistent timezone handling by converting to the same zone as start
        const normalizedStart = this.start.setZone(start.zone);
        target = new Dates({
          dates: [normalizedStart],
          timezone: start.zoneName,
        });
      } else {
        return [];
      }

      // Ensure all parameters have consistent timezone
      const normalizedEnd = end?.setZone(start.zone);

      return target
        .occurrences({ start, end: normalizedEnd, take })
        .toArray()
        .map((x) => (x as unknown as LuxonDateAdapter).date);
    },

    nextAfter(start: DateTime, skipCurrent: boolean = false): DateTime | null {
      let occ = this.getOccurrences({ start, take: 2 });
      if (skipCurrent) occ = occ.filter((x) => x > start);
      return occ[0];
    },

    get nextAt() {
      return this.nextAfter(this.implicitStart);
    },

    get implicitStart(): DateTime {
      return this.start ?? DateTime.now();
    },

    get simplifiedExpression(): string {
      if (this.ast) {
        return toExpression(this.ast, {
          relative: true,
          timeOfTheDay: this.timeOfTheDay,
        });
      }

      return self.expression;
    },

    get rawExpression(): string {
      if (this.ast) {
        return toExpression(this.ast, {
          relative: false,
          timeOfTheDay: this.timeOfTheDay,
        });
      }

      return self.expression;
    },

    get timeOfTheDay(): { [key: string]: number } {
      throw new Error("Not implemented");
    },

    get emojis() {
      return this.tags
        .map((x) => emojiFromWord(x))
        .filter((x) => x !== undefined && x.emoji && x.emoji.char)
        .map((x) => x!.emoji.char);
    },
  }));

export default Expression;
