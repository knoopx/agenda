import React from "react"
import classNames from "classnames"
import { observer } from "mobx-react"
import {
  eachDayOfInterval,
  endOfMonth,
  isSameMonth,
  isWeekend,
  startOfMonth,
  eachWeekOfInterval,
  startOfWeek,
  endOfWeek,
} from "date-fns"
import { range } from "lodash"

const weekStartsOn = 1

export function dateAt(year, month) {
  return new Date(year, month - 1)
}

export function monthName(date, style = "long") {
  return date.toLocaleString("default", { month: style })
}

export function dayName(date, style = "long") {
  return date.toLocaleString("default", { weekday: style })
}

export function weekDays(style = "short") {
  return range(5, 12).map((day) => dayName(new Date(1970, 0, day), style))
}

export function daysBetween(start, end) {
  return eachDayOfInterval({ start, end })
}

export function weeksBetween(start, end) {
  return eachWeekOfInterval({ start, end }, { weekStartsOn })
}

const MonthCalendar = ({ className, date, renderDay }) => {
  const render = (weekDay) => {
    const days = daysBetween(
      startOfWeek(weekDay, { weekStartsOn }),
      endOfWeek(weekDay, { weekStartsOn }),
    )
    return days.map((day) =>
      renderDay({
        date: day,
        isWeekend: isWeekend(day),
        isSameMonth: isSameMonth(date, day),
      }),
    )
  }

  return (
    <div className={classNames(className, "table border-collapse")}>
      {weeksBetween(startOfMonth(date), endOfMonth(date)).map((weekDay) => (
        <div key={weekDay.toISOString()} className="table-row">
          {render(weekDay)}
        </div>
      ))}
    </div>
  )
}

export default observer(MonthCalendar)
