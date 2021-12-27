import {
  addDays,
  addWeeks,
  addYears,
  differenceInCalendarISOWeeks,
  differenceInMonths,
  differenceInYears,
  isSameDay,
  isSameISOWeek,
  isSameMonth,
  isSameYear,
} from "date-fns"

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

export function formatWeekDay(date, locale, timeZone) {
  return date.toLocaleString(locale, { weekday: "short", timeZone })
}

export function formatMonth(date, locale, timeZone) {
  return date.toLocaleString(locale, { month: "long", timeZone })
}

export function formatMonthShort(date, locale, timeZone) {
  return date.toLocaleString(locale, { month: "short", timeZone })
}

export function formatTime(date, locale, timeZone) {
  return date.toLocaleString(locale, { timeStyle: "short", timeZone })
}

export function formatDate(date, locale, timeZone) {
  return date.toLocaleDateString(locale, { date: "short", timeZone })
}

export function formatYear(date, locale, timeZone) {
  return date.toLocaleString(locale, { year: "numeric", timeZone })
}

export function formatDistance(endAt, now = new Date(), timeZone) {
  const minutes = Math.floor((endAt - now) / (60 * 1000))
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = differenceInCalendarISOWeeks(endAt, now)
  const months = differenceInMonths(endAt, now)
  const years = differenceInYears(endAt, now)

  const prefixDuration = (value, unit) =>
    value > 0 ? `in ${value}${unit}` : `${Math.abs(value)}${unit} ago`

  if (!isSameYear(now, endAt)) {
    // next year?
    if (isSameYear(addYears(now, 1), endAt)) {
      // next [month]
      return formatMonthShort(now, "en", timeZone)
    }
    // in [n] years
    return formatDuration(years, "y")
  }

  // today
  if (isSameDay(now, endAt)) {
    if (hours !== 0) {
      return prefixDuration(hours, "h")
    }
    return prefixDuration(minutes, "m")
  }

  // tomorrow
  if (isSameDay(addDays(now, 1), endAt)) {
    if (hours !== 0) {
      return prefixDuration(hours, "h")
    }
    return prefixDuration(minutes, "m")
  }

  // this week
  if (isSameISOWeek(now, endAt)) {
    return formatWeekDay(endAt, "en", timeZone)
  }

  if (isSameISOWeek(addWeeks(now, 1), endAt)) {
    return `next ${formatWeekDay(endAt, "en", timeZone)}`
  }

  if (isSameMonth()) {
    return prefixDuration(days, "d")
  }

  if (months === 0) {
    return prefixDuration(weeks, "w")
  }
  return "next month"
}
