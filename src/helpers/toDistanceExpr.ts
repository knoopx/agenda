import { DateTime, Interval, ToRelativeUnit } from "luxon"

export function toDistanceExpr(start: DateTime, end: DateTime) {
  const unit = [
    "years",
    "months",
    "weeks",
    "days",
    "hours",
    "minutes",
  ] as ToRelativeUnit[];

  const isFuture = end > start
  const relative = end.toRelative({ base: start, style: "short", unit })
  if (!isFuture) [end, start] = [start, end]

  const interval = Interval.fromDateTimes(start, end)
  const duration = interval.toDuration(unit)

  const concat = (...args: any[]) => args.filter(Boolean).join(" ")
  const nextOrPast = (text?: string) => concat(isFuture ? `next` : `past`, text)
  const tomorrowOrYesterday = (text?: string) => concat(isFuture ? `tomorrow` : `yesterday`, text)

  const monthAndDay = concat(end.monthShort, end.day)

  if (duration.years > 0) {
    // next year
    if (end.hasSame(start.plus({ years: 1 }), "year")) {
      // next [month], next [month] [day]
      return nextOrPast(end.day > 1 ? monthAndDay : end.monthShort)
    }
  }

  // next month
  if (duration.months > 0) {
    if (end.hasSame(start.plus({ months: 1 }), "month")) {
      if (
        duration.days === 0 &&
        duration.hours === 0 &&
        duration.minutes === 0
      ) {
        return nextOrPast("month")
      }

      if (duration.days > 0) {
        return monthAndDay
      }
    }
  }

  // tomorrow/yesterday
  if (end.hasSame(start.plus({ days: 1 }), "day")) {
    if (duration.hours === 0 && duration.minutes === 0) {
      return tomorrowOrYesterday()
    }
  }

  if (duration.days > 0) {
    // this week
    if (end.hasSame(start, "week")) {
      return end.weekdayShort
    }

    // next Tue
    if (end.hasSame(start.plus({ weeks: 1 }), "week")) {
      return nextOrPast(end.weekdayShort)
    }
  }

  if (duration.months > 1)  {
    return monthAndDay
  }

  return relative
}
