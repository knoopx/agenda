import Day from "./Day"
import EachDay from "./EachDay"
import EachWeek from "./EachWeek"

export default function Month({ start: monthStart, displayYear }) {
  return (
    <div className="flex flex-col m-2">
      <div className="flex items-center justify-between space-x-2">
        <span>{monthStart.monthLong}</span>
        {displayYear && (
          <span className="text-gray-500 text-xs">{monthStart.year}</span>
        )}
      </div>
      <EachWeek start={monthStart}>
        {({ start: weekStart }) => (
          <EachDay key={weekStart} start={weekStart}>
            {({ start: dayStart }) => (
              <Day
                key={dayStart}
                start={dayStart.startOf("day")}
                end={dayStart.endOf("day")}
                isSameMonth={dayStart.hasSame(monthStart, "month")}
              />
            )}
          </EachDay>
        )}
      </EachWeek>
    </div>
  )
}
