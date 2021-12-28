import { DateTime, Interval } from "luxon"

export function nextWeekday(start, weekday) {
  let current = start
  while (current.weekday !== weekday) {
    current = current.plus({ days: 1 })
  }
  return current
}

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

export function formatDistance(start, end, timeZone) {
  const isFuture = end > start
  if (!isFuture) {
    ;[end, start] = [start, end]
  }

  const interval = Interval.fromDateTimes(start, end)
  const duration = interval.toDuration([
    "years",
    "months",
    "days",
    "hours",
    "minutes",
  ])

  if (duration.invalid) {
    throw duration.invalid.reason
  }

  const prefixRelative = (text) => (isFuture ? `in ${text}` : `${text} ago`)

  const prefixRelativeConcrete = (text) =>
    isFuture ? `next ${text}` : `past ${text}`

  const prefixDuration = (value, unit) =>
    prefixRelative(`${Math.abs(value)}${unit}`)

  const time = () => {
    const segments = []
    if (duration.hours !== 0) {
      segments.push(prefixDuration(duration.hours, "h"))
    }
    if (duration.minutes !== 0) {
      segments.push(prefixDuration(duration.minutes, "m"))
    }
    return segments.join(" ")
  }

  if (duration.years > 0) {
    if (!end.hasSame(start, "year")) {
      // next year?
      if (end.hasSame(start.plus({ years: 1 }), "year")) {
        // next [month]
        return formatMonthShort(start, "en", timeZone)
      }
      // in [n] years
      return prefixDuration(duration.years, "y")
    }
  }

  // today
  if (end.hasSame(start, "day")) {
    return time()
  }

  // tomorrow/yesterday
  if (end.hasSame(start.plus({ days: 1 }), "day")) {
    if (
      duration.hours > 12 ||
      (duration.hours === 0 && duration.minutes === 0)
    ) {
      return isFuture ? "tomorrow" : "yesterday"
    }
    return time()
  }

  if (end.plus({ weeks: 1 }).hasSame(start, "week")) {
    return prefixRelativeConcrete(formatWeekDay(end, "en", timeZone))
  }

  if (end.hasSame(start, "month")) {
    return prefixDuration(duration.days, "d")
  }

  if (duration.months === 0) {
    return prefixDuration(duration.weeks, "w")
  }

  return "error"
}
