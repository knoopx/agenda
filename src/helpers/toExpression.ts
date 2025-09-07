import { DateTime } from "luxon";
import { IExpressionAST } from "../models/Expression";
import { DateAdapter } from "@rschedule/core/DateAdapter";
import { MonthNames, WeekDayNames } from "../types";

const ShortWeekDays: DateAdapter.Weekday[] = [
  "MO",
  "TU",
  "WE",
  "TH",
  "FR",
  "SA",
  "SU",
];

function toAndExpr(parts: string[]): string {
  return parts.join(" and ");
}

function toEveryExpr(parts: string | string[]): string[] {
  parts = [parts].flat();
  if (!parts) return [];
  return ["every", ...parts];
}

function toAtRecurringTimeExpr(
  hours?: number[],
  minutes?: number[],
  options: {
    relative?: boolean;
    timeOfTheDay?: { [key: string]: number };
  } = { relative: false, timeOfTheDay: {} },
): string[] | null {
  if (!hours || !minutes) return null;
  if (hours.every((x) => x === 0) && minutes.every((x) => x === 0)) return null;

  const times = hours
    .filter((hour) => hour !== 0)
    .flatMap((hour) =>
      minutes.map((minute) => toTimeExpr(hour, minute, options)),
    )
    .filter(Boolean);

  return ["at", toAndExpr(times)];
}

function toTimeOfTheDay(
  hour: number,
  minute: number,
  options: {
    timeOfTheDay?: { [key: string]: number };
  },
): string | null {
  if (options.timeOfTheDay && minute === 0) {
    const match = Object.keys(options.timeOfTheDay).find(
      (k) => options.timeOfTheDay![k] === hour,
    );
    if (match) return match;
  }

  return null;
}

export function toEveryDayOfWeekExpr(
  byDayOfWeek?: string[],
  interval: number = 1,
): string[] | null {
  function toWeekDay(dayOfWeek: string, interval: number) {
    let name =
      WeekDayNames[ShortWeekDays.indexOf(dayOfWeek as DateAdapter.Weekday)];
    if (interval > 1) return `${interval} ${name}s`;
    return name;
  }

  if (!byDayOfWeek) return null;

  return toEveryExpr(
    toAndExpr(byDayOfWeek.map((weekDay) => toWeekDay(weekDay, interval))),
  );
}

export function toEveryMonthOfYearExpr(
  byMonthOfYear?: number[],
): string[] | null {
  if (!byMonthOfYear) return null;

  return toEveryExpr(
    toAndExpr(byMonthOfYear.map((month) => MonthNames[month - 1])),
  );
}

export function toEveryIntervalExpr(
  interval: number = 1,
  frequency: string,
): string[] | null {
  const map: {
    [key: string]: [string, string];
  } = {
    MINUTELY: ["min", "min"],
    HOURLY: ["hour", "hours"],
    DAILY: ["day", "days"],
    WEEKLY: ["week", "weeks"],
    MONTHLY: ["month", "months"],
    YEARLY: ["year", "years"],
  };

  const match = map[frequency.toUpperCase()];

  if (!match) return null;

  if (interval === 1) return toEveryExpr(match[0]);
  return toEveryExpr([interval.toString(), match[1]]);
}

export function toEveryDateExpr(
  byDayOfMonth?: number[],
  byMonthDay?: number[],
): string[] | null {
  if (!byDayOfMonth || !byMonthDay) return null;
  if (byDayOfMonth.length !== 1 && byMonthDay.length !== 1) return null;
  const day = byDayOfMonth[0];
  const month = byMonthDay[0];
  const date = DateTime.local().set({ day, month });
  if (day > 1) {
    return toEveryExpr(date.toFormat("d LLLL").toLowerCase());
  } else {
    return toEveryExpr(date.toFormat("LLLL").toLowerCase());
  }
}

export function toRecurringExpression(
  ast: IExpressionAST,
  options: {
    relative?: boolean;
    timeOfTheDay?: { [key: string]: number };
  },
): string | string[] | null {
  const timeOfTheDay =
    ast.byHourOfDay &&
    ast.byMinuteOfHour &&
    ast.byHourOfDay.length === 1 &&
    ast.byMinuteOfHour.length === 1 &&
    toTimeOfTheDay(ast.byHourOfDay[0], ast.byMinuteOfHour[0], options);

  const expr =
    // every monday
    toEveryDayOfWeekExpr(ast.byDayOfWeek, ast.interval) ||
    // every 29 december
    toEveryDateExpr(ast.byDayOfMonth, ast.byMonthOfYear) ||
    // every january
    toEveryMonthOfYearExpr(ast.byMonthOfYear);

  if (expr) {
    const at = toAtRecurringTimeExpr(
      ast.byHourOfDay,
      ast.byMinuteOfHour,
      options,
    );
    if (at) {
      return [...expr, ...at];
    }
    return expr;
  }

  if (timeOfTheDay) {
    return toEveryExpr(timeOfTheDay);
  }
  return toEveryIntervalExpr(ast.interval, ast.frequency!);
}

function toTimeExpr(
  hour: number,
  minute: number,
  options?: {
    relative?: boolean;
    timeOfTheDay?: { [key: string]: number };
  },
): string {
  if (options?.relative) {
    const timeOfTheDay = toTimeOfTheDay(hour, minute, options);
    if (timeOfTheDay) return timeOfTheDay;
  }
  if (minute === 0) {
    return hour.toString();
  } else {
    return `${hour}:${minute}`;
  }
}

function toDateExpr(
  date?: DateTime,
  options?: {
    relative?: boolean;
    timeOfTheDay?: { [key: string]: number };
  },
) {
  if (!date) return null;

  if (options?.relative) {
    const tomorrow = DateTime.now().startOf("day").plus({ days: 1 });
    if (date.hasSame(tomorrow, "day")) return "tomorrow";

    if (date.year === DateTime.now().year)
      return date.toFormat("d LLLL").toLowerCase();
  }

  return date.toFormat("dd/MM/yyyy");
}

function toAtTimeExpr(
  start?: DateTime,
  options?: {
    relative?: boolean;
    timeOfTheDay?: { [key: string]: number };
  },
) {
  if (!start) return null;

  if (start.hour == 0 && start.minute == 0) {
    return null;
  }
  return ["at", toTimeExpr(start.hour, start.minute, options)].join(" ");
}

export function toExpression(
  ast: IExpressionAST,
  options: {
    relative?: boolean;
    timeOfTheDay?: { [key: string]: number };
  } = { relative: false, timeOfTheDay: {} },
): string {
  const contexts = ast?.contexts?.map((tag) => `@${tag}`).join(" ");
  const tags = ast?.tags?.map((tag) => `#${tag}`).join(" ");

  return [
    contexts,
    tags,
    ast.subject,
    ast.frequency
      ? toRecurringExpression(ast, options)
      : [toDateExpr(ast.start, options), toAtTimeExpr(ast.start, options)],
  ]
    .flat()
    .filter(Boolean)
    .join(" ");
}
