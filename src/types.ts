/* eslint-disable max-classes-per-file */

import {
  ICalRuleFrequency,
  INormRRuleOptions,
} from "@rschedule/core/rules/ICAL_RULES";
import { DateTime, DateTimeUnit } from "luxon";

export const MonthNames = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

export const WeekDayNames = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export class Frequency {
  public static MINUTELY: ICalRuleFrequency = "MINUTELY";
  public static HOURLY: ICalRuleFrequency = "HOURLY";
  public static DAILY: ICalRuleFrequency = "DAILY";
  public static WEEKLY: ICalRuleFrequency = "WEEKLY";
  public static MONTHLY: ICalRuleFrequency = "MONTHLY";
  public static YEARLY: ICalRuleFrequency = "YEARLY";

  static fromUnit(unit: DateTimeUnit): string | undefined {
    return {
      minutes: this.MINUTELY,
      hours: this.HOURLY,
      days: this.DAILY,
      weeks: this.WEEKLY,
      months: this.MONTHLY,
      years: this.YEARLY,
    }[unit.toUpperCase()];
  }
}

interface IDurationLike {
  value: number;
  unit: string;
}

export class Recurrence {
  static fromDurationLike({
    value: interval,
    unit,
  }: IDurationLike): Partial<INormRRuleOptions> {
    return (
      {
        minutes: this.minutely({ interval }),
        hours: this.hourly({ interval }),
        days: this.daily({ interval }),
        weeks: this.weekly({ interval }),
        months: this.monthly({ interval }),
        years: this.yearly({ interval }),
      }[unit] ?? {}
    );
  }

  static make(
    frequency: ICalRuleFrequency,
    { interval, ...rest }: Partial<INormRRuleOptions>
  ): Partial<INormRRuleOptions> {
    return {
      frequency,
      ...(interval && { interval }),
      ...rest,
    };
  }

  static onceAt(start: DateTime, rest: Partial<INormRRuleOptions> = {}) {
    // return this.make(Frequency.DAILY, {
    //   start,
    //   byMinuteOfHour: [start.minute],
    //   byHourOfDay: [start.hour],
    //   byDayOfMonth: [start.day],
    //   byMonthOfYear: [start.month],
    //   byYear: [start.year],
    //   count: 1,
    //   ...rest,
    // })
    return { start, ...rest };
  }

  static minutely(rest: Partial<INormRRuleOptions> = {}) {
    return this.make(Frequency.MINUTELY, rest);
  }

  static hourly(rest: Partial<INormRRuleOptions> = {}) {
    return this.make(Frequency.HOURLY, {
      byHourOfDay: [0],
      byMinuteOfHour: [0],
      ...rest,
    });
  }

  static daily(rest: Partial<INormRRuleOptions> = {}) {
    return this.make(Frequency.DAILY, {
      byHourOfDay: [0],
      byMinuteOfHour: [0],
      ...rest,
    });
  }

  static weekly(rest: Partial<INormRRuleOptions> = {}) {
    return this.make(Frequency.WEEKLY, {
      byDayOfWeek: ["MO"],
      byHourOfDay: [0],
      byMinuteOfHour: [0],
      ...rest,
    });
  }

  static monthly(rest: Partial<INormRRuleOptions> = {}) {
    return this.make(Frequency.MONTHLY, {
      byDayOfMonth: [1],
      byHourOfDay: [0],
      byMinuteOfHour: [0],
      ...rest,
    });
  }

  static yearly(rest: Partial<INormRRuleOptions> = {}) {
    return this.make(Frequency.YEARLY, {
      byMonthOfYear: [1],
      byHourOfDay: [0],
      byMinuteOfHour: [0],
      ...rest,
    });
  }
}
