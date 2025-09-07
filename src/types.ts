import {
  ICalRuleFrequency,
  INormRRuleOptions,
} from "@rschedule/core/rules/ICAL_RULES";
import { DateTime, DateTimeUnit } from "luxon";

// Custom interface that includes all rrule properties
export interface IRecurrenceOptions extends Partial<INormRRuleOptions> {
  interval?: number;
  byMinuteOfHour?: number[];
  byHourOfDay?: number[];
  byDayOfWeek?: string[];
  byDayOfMonth?: number[];
  byMonthOfYear?: number[];
  frequency?: ICalRuleFrequency;
  start?: DateTime;
  end?: DateTime;
  count?: number;
}

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

export const MonthNamesShort = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
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

export const WeekDayNamesShort = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];

export class Frequency {
  public static MINUTELY: ICalRuleFrequency = "MINUTELY";
  public static HOURLY: ICalRuleFrequency = "HOURLY";
  public static DAILY: ICalRuleFrequency = "DAILY";
  public static WEEKLY: ICalRuleFrequency = "WEEKLY";
  public static MONTHLY: ICalRuleFrequency = "MONTHLY";
  public static YEARLY: ICalRuleFrequency = "YEARLY";

  static fromUnit(unit: DateTimeUnit): string | undefined {
    const mapping: Partial<Record<DateTimeUnit, ICalRuleFrequency>> = {
      minute: this.MINUTELY,
      hour: this.HOURLY,
      day: this.DAILY,
      week: this.WEEKLY,
      month: this.MONTHLY,
      year: this.YEARLY,
    };
    return mapping[unit];
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
  }: IDurationLike): IRecurrenceOptions {
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
    { interval, ...rest }: IRecurrenceOptions,
  ): IRecurrenceOptions {
    return {
      frequency,
      ...(interval && { interval }),
      ...rest,
    };
  }

  static onceAt(start: DateTime, rest: IRecurrenceOptions = {}) {
    return { start, ...rest };
  }

  static minutely(rest: IRecurrenceOptions = {}) {
    return this.make(Frequency.MINUTELY, rest);
  }

  static hourly(rest: IRecurrenceOptions = {}) {
    return this.make(Frequency.HOURLY, {
      byMinuteOfHour: [0],
      ...rest,
    });
  }

  static daily(rest: IRecurrenceOptions = {}) {
    return this.make(Frequency.DAILY, {
      byHourOfDay: [0],
      byMinuteOfHour: [0],
      ...rest,
    });
  }

  static weekly(rest: IRecurrenceOptions = {}) {
    return this.make(Frequency.WEEKLY, {
      byDayOfWeek: ["MO"],
      byHourOfDay: [0],
      byMinuteOfHour: [0],
      ...rest,
    });
  }

  static monthly(rest: IRecurrenceOptions = {}) {
    return this.make(Frequency.MONTHLY, {
      byDayOfMonth: [1],
      byHourOfDay: [0],
      byMinuteOfHour: [0],
      ...rest,
    });
  }

  static yearly(rest: IRecurrenceOptions = {}) {
    return this.make(Frequency.YEARLY, {
      byMonthOfYear: [1],
      byHourOfDay: [0],
      byMinuteOfHour: [0],
      ...rest,
    });
  }
}
