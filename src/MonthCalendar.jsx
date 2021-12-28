import React from "react"
import classNames from "classnames"
import { observer } from "mobx-react"
import { Interval } from "luxon"

const isWeekend = (date) => date.weekday % 6 === 0

const MonthCalendar = ({ className, date, renderDay }) => {
  return (
    <div className={classNames(className, "table border-collapse")}>
      {Interval.fromDateTimes(date.startOf("month"), date.endOf("month"))
        .splitBy({ weeks: 1 })
        .map(({ start: weekStart }) => (
          <div key={weekStart} className="table-row">
            {Interval.fromDateTimes(
              weekStart.startOf("week"),
              weekStart.endOf("week"),
            )
              .splitBy({ days: 1 })
              .map(({ start: monthStart }) =>
                renderDay({
                  date: monthStart,
                  isWeekend: isWeekend(monthStart),
                  isSameMonth: date.hasSame(monthStart, "month"),
                }),
              )}
          </div>
        ))}
    </div>
  )
}

export default observer(MonthCalendar)
