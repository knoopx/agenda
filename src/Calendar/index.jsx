import { useStore } from "../store"

import Day from "./Day"
import Interval from "./Interval"

const Calendar = () => {
  const store = useStore()

  let prevYear

  return (
    <Interval
      className="grid flex-none grid-cols-3"
      start={store.calendarStart}
      end={store.calendarEnd}
      splitBy={{ months: 1 }}
    >
      {({ start: monthStart }) => {
        const shouldDisplayYear = monthStart.year !== prevYear
        prevYear = monthStart.year

        return (
          <div className="flex flex-col m-2">
            <div className="flex items-center justify-between space-x-2">
              <span>{monthStart.monthLong}</span>
              {shouldDisplayYear && (
                <span className="text-gray-500 text-xs">{monthStart.year}</span>
              )}
            </div>
            <Interval
              className="table flex-auto border-collapse"
              start={monthStart.startOf("month")}
              end={monthStart.endOf("month")}
              splitBy={{ weeks: 1 }}
            >
              {({ start: weekStart }) => (
                <Interval
                  className="table-row"
                  start={weekStart.startOf("week")}
                  end={weekStart.endOf("week")}
                  splitBy={{ days: 1 }}
                >
                  {({ start: dayStart, end: dayEnd }) => (
                    <Day
                      start={dayStart}
                      end={dayEnd}
                      isSameMonth={dayStart.hasSame(monthStart, "month")}
                    />
                  )}
                </Interval>
              )}
            </Interval>
          </div>
        )
      }}
    </Interval>
  )
}

export default Calendar
