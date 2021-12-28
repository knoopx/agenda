import { Interval } from "luxon"

export function formatDuration(duration) {
  const segments = []

  const days = Math.floor(duration / (60 * 24))
  if (days > 0) {
    segments.push(`${days}d`)
  }

  const hours = Math.floor((duration % (60 * 24)) / 60)
  if (hours > 0) {
    segments.push(`${hours}h`)
  }
  const minutes = Math.floor(duration % 60)
  if (minutes > 0) {
    segments.push(`${minutes}m`)
  }

  return segments.join(" ")
}

export function formatDistance(start, end, timeZone) {
  const isFuture = end > start
  const relative = end.toRelative({ base: start, style: "short" })
  if (!isFuture) [end, start] = [start, end]

  const interval = Interval.fromDateTimes(start, end)
  const duration = interval.toDuration([
    "years",
    "months",
    "days",
    "hours",
    "minutes",
  ])

  const concat = (...args) => args.filter(Boolean).join(" ")
  const nextOrPast = (text) => concat(isFuture ? `next` : `past`, text)
  const tomorrowOrYesterday = (text) =>
    concat(isFuture ? `tomorrow` : `yesterday`, text)

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

  // next week
  if (end.plus({ weeks: 1 }).hasSame(start, "week")) {
    return nextOrPast(formatWeekDay(end, "en", timeZone))
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

    // next week
    if (end.hasSame(start.plus({ weeks: 1 }), "week")) {
      return nextOrPast(end.weekdayShort)
    }
  }

  return relative
}
