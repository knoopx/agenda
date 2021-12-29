import classNames from "classnames"
import { observer } from "mobx-react"

import { useStore } from "../Store"
import { now } from "../helpers"

import DayTask from "./DayTask"

const Day = observer(({ start, isSameMonth }) => {
  const store = useStore()

  const tasks = store.getTasksAtDay(start) // .filter((t) => !t.isRecurring)

  const isToday = now(5000).hasSame(start, "day")

  const shouldHighlight = store.input.occurrencesAtDay(start) > 0

  return (
    <div
      className={classNames(
        "table-cell text-right text-xs p-1 leading-none rounded w-[calc(100%/7)] h-[calc(100%/5)]",
        {
          "font-bold": isToday,
          "font-light": !shouldHighlight && !isToday,
          "bg-white": isSameMonth,
          // "opacity-60": !isSameMonth || start < now(5000),
          "border border-black": isSameMonth && shouldHighlight,
        },
      )}
    >
      {isSameMonth && (
        <div className="flex flex-col items-between space-y-1">
          <h6>{start.day}</h6>
          <div className="flex flex-auto flex-wrap">
            {tasks.map((task) => (
              <DayTask key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
})

export default Day
