import { observer } from "mobx-react"
import { useMemo } from "react"
import classNames from "classnames"
import { DateTime } from "luxon"

import { MonthCalendarDayTask } from "./MonthCalendarDayTask"

export const MonthCalendarDay = observer(
  ({ date: d, highlight, tasks, isSameMonth }) => {
    const isToday = DateTime.now().hasSame(d, "day")
    const highlightClass = useMemo(() => highlight(d), [highlight, d])

    return (
      <div
        className={classNames(
          "table-cell text-right text-xs p-1 leading-none border",
          {
            "font-bold": isToday,
            "font-light": !highlightClass && !isToday,
            "opacity-25": !isSameMonth,
            [highlightClass]: isSameMonth,
          },
        )}
      >
        <div className="flex flex-col items-between space-y-1">
          <h6>{d.day}</h6>
          {isSameMonth && (
            <div className="flex justify-self-end space-x-1">
              {tasks.map((task) => (
                <MonthCalendarDayTask task={task} key={task.id} />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  },
)
