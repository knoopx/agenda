/* eslint-disable max-classes-per-file */

export class Frequency {
  static MINUTELY = "MINUTELY"

  static DAILY = "DAILY"

  static WEEKLY = "WEEKLY"

  static MONTHLY = "MONTHLY"

  static YEARLY = "YEARLY"

  static fromUnit(unit) {
    return {
      minutes: this.MINUTELY,
      hours: this.HOURLY,
      days: this.DAILY,
      weeks: this.WEEKLY,
      months: this.MONTHLY,
      years: this.YEARLY,
    }[unit]
  }
}

export class Recurrency {
  static fromDurationLike({ value: interval, unit }) {
    return {
      minutes: this.minutely({ interval }),
      hours: this.hourly({ interval }),
      days: this.daily({ interval }),
      weeks: this.weekly({ interval }),
      months: this.monthly({ interval }),
      years: this.yearly({ interval }),
    }[unit]
  }

  static make(frequency, { interval, ...rest }) {
    return {
      frequency,
      ...(interval && { interval }),
      ...rest,
    }
  }

  static onceAt(start, rest = {}) {
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
    return { start, ...rest }
  }

  static minutely(rest) {
    return this.make(Frequency.MINUTELY, rest)
  }

  static hourly(rest) {
    return this.make(Frequency.HOURLY, {
      byHourOfDay: [0],
      byMinuteOfHour: [0],
      ...rest,
    })
  }

  static daily(rest) {
    return this.make(Frequency.DAILY, {
      byHourOfDay: [0],
      byMinuteOfHour: [0],
      ...rest,
    })
  }

  static weekly(rest) {
    return this.make(Frequency.WEEKLY, {
      byDayOfWeek: ["MO"],
      byHourOfDay: [0],
      byMinuteOfHour: [0],
      ...rest,
    })
  }

  static monthly(rest) {
    return this.make(Frequency.MONTHLY, {
      byDayOfMonth: [1],
      byHourOfDay: [0],
      byMinuteOfHour: [0],
      ...rest,
    })
  }

  static yearly(rest) {
    return this.make(Frequency.YEARLY, {
      byMonthOfYear: [1],
      byHourOfDay: [0],
      byMinuteOfHour: [0],
      ...rest,
    })
  }
}
