/* eslint-disable max-classes-per-file */

export class Frequency {
  static MINUTELY = "minutely"

  static DAILY = "daily"

  static WEEKLY = "weekly"

  static MONTHLY = "monthly"

  static YEARLY = "yearly"

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

  static make(freq, { interval, ...rest }) {
    return {
      freq,
      ...(interval && { interval }),
      ...rest,
    }
  }

  static minutely(rest) {
    return this.make(Frequency.MINUTELY, rest)
  }

  static hourly(rest) {
    return this.make(Frequency.HOURLY, rest)
  }

  static daily(rest) {
    return this.make(Frequency.DAILY, rest)
  }

  static weekly(rest) {
    return this.make(Frequency.WEEKLY, { byweekday: 1, ...rest })
  }

  static monthly(rest) {
    return this.make(Frequency.MONTHLY, { bymonthday: 1, ...rest })
  }

  static yearly(rest) {
    return this.make(Frequency.YEARLY, { bymonth: 1, ...rest })
  }
}
