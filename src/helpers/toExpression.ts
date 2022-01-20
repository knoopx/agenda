import { DateTime } from "luxon";
import { IExpressionResult as IExpressionAST } from "../models/Expression";
import { DateAdapter, RuleOption } from "../schedule";
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

function toAndExpr(parts: any[]): string {
  return parts.filter(Boolean).join(" and ");
}

function toTimeOfTheDayExpr(
  byHourOfDay: RuleOption.ByHourOfDay[],
  byMinuteOfHour: RuleOption.ByMinuteOfHour[],
  timeOfTheDay: { [key: string]: number }
): string | null {
  const parts: string[] = [];

  byHourOfDay.forEach((hour) => {
    byMinuteOfHour.forEach((minute) => {
      if (minute === 0) {
        const match = Object.keys(timeOfTheDay).find(
          (k) => timeOfTheDay[k] === hour
        );
        if (match) parts.push(match);
      }
    });
  });

  if (parts) return toAndExpr(parts);

  return null;
}

function toDayOfWeekExpr(
  byDayOfWeek: RuleOption.ByDayOfWeek[],
  interval: number
) {
  function toWeekDay(dayOfWeek: RuleOption.ByDayOfWeek, interval: number) {
    let name;
    if (typeof dayOfWeek === "number") {
      name = WeekDayNames[dayOfWeek];
    } else if (typeof dayOfWeek === "string") {
      name = WeekDayNames[ShortWeekDays.indexOf(dayOfWeek)];
    }
    if (interval > 1) return name + "s";
    return name;
  }

  return toAndExpr(byDayOfWeek.map((weekDay) => toWeekDay(weekDay, interval)));
}

function toMonthOfYearExpr(byMonthOfYear: RuleOption.ByMonthOfYear[]) {
  function toMonthDay(monthOfYear: RuleOption.ByMonthOfYear) {
    let name;
    if (typeof monthOfYear === "number") {
      name = MonthNames[monthOfYear - 1];
    } else if (typeof monthOfYear === "string") {
      name = monthOfYear;
    }
    return name;
  }

  return toAndExpr(byMonthOfYear.map((month) => toMonthDay(month)))
}

function toRecurrentExpression(
  ast: Partial<IExpressionAST>,
  timeOfTheDay: { [key: string]: number }
): string {
  const parts = ["every"];

  let timeOfTheDayMatch;
  switch (ast.frequency) {
    case "MINUTELY":
      if (ast.interval && ast.interval > 1) {
        parts.push(ast.interval.toString(), "min");
      } else {
        parts.push("min");
      }
      break;
    case "DAILY":
      if (ast.byHourOfDay) {
        const byMinuteOfHour = ast.byMinuteOfHour || [0];
        timeOfTheDayMatch = toTimeOfTheDayExpr(
          ast.byHourOfDay,
          byMinuteOfHour,
          timeOfTheDay
        );
      } else {
        if (ast.interval && ast.interval > 1) {
          parts.push(ast.interval.toString(), "days");
        } else {
          parts.push("day");
        }
      }
      break;
    case "WEEKLY":
      if (ast.interval && ast.interval > 1) {
        parts.push(ast.interval.toString());
      }
      if (ast.byDayOfWeek?.length) {
        parts.push(toDayOfWeekExpr(ast.byDayOfWeek, ast.interval || 1));
      } else {
        parts.push("week");
      }
      break;
    case "MONTHLY":
      if (ast.byMonthOfYear?.length) {
        parts.push(toMonthOfYearExpr(ast.byMonthOfYear));

      } else {
      // 5 months
      if (ast.interval && ast.interval > 1) {
        parts.push(ast.interval.toString(), "months");
      } else {
        // month
        parts.push("month");
      }}
      break;
    case "YEARLY":
      if (ast.byMonthOfYear?.length) {
        // 5 august
        if (ast.byDayOfMonth?.length) {
          const dayOfMonth = ast.byDayOfMonth[0];
          if (dayOfMonth > 1) {
            parts.push(dayOfMonth.toString(), toMonthOfYearExpr(ast.byMonthOfYear));
          } else {
            parts.push(toMonthOfYearExpr(ast.byMonthOfYear));
          }
        } else {
          // august
          parts.push(toMonthOfYearExpr(ast.byMonthOfYear));
        }
      }
  }

  if (timeOfTheDayMatch) {
    parts.push(timeOfTheDayMatch);
  } else {
    if (ast.byHourOfDay) {
      const byMinuteOfHour = ast.byMinuteOfHour || [0];
      const times = ast.byHourOfDay
        .filter((hour) => hour !== 0)
        .flatMap((hour) =>
          byMinuteOfHour.map((minute) => toTimeExpr(hour, minute))
        )
        .join(" and ");

      if (times.length) {
        parts.push("at", times);
      }
    }
  }

  return parts.join(" ");
}

function toTimeExpr(hour: number, minute: number): string {
  if (minute === 0) {
    return hour.toString();
  } else {
    return `${hour}:${minute}`;
  }
}

function toStartingExpression(ast: Partial<IExpressionAST>) {
  const parts = [];
  const tomorrow = DateTime.now().startOf("day").plus({ days: 1 });

  if (!ast.start) return;

  if (tomorrow.hasSame(ast.start, "day")) {
    parts.push("tomorrow");
  } else {
    if (ast.start.year === DateTime.now().year) {
      parts.push(ast.start.toFormat("d LLLL").toLowerCase());
    } else {
      parts.push(ast.start.toFormat("dd/MM/yyyy"));
    }
  }

  if (!(ast.start.hour === 0 && ast.start.minute === 0)) {
    parts.push("at", toTimeExpr(ast.start.hour, ast.start.minute));
  }
  return parts.join(" ");
}

export function toExpression(
  ast: Partial<IExpressionAST>,
  timeOfTheDay: { [key: string]: number }
): string {
  let parts = [ast.subject];

  if (ast.frequency) {
    parts.push(toRecurrentExpression(ast, timeOfTheDay));
  }

  if (ast.start) {
    parts.push(toStartingExpression(ast));
  }

  if (ast.context) parts.push("@" + ast.context);

  return parts.filter(Boolean).join(" ");
}
