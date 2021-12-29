import classNames from "classnames"
import { observer } from "mobx-react"

import { useStore } from "../Store"
import { now } from "../helpers"

import DayTask from "./DayTask"

const Day = observer(({ start, isSameMonth }) => {
  const store = useStore()

  const tasks = store.getTasksAtDay(start)

  const isToday = now(5000).hasSame(start, "day")
  const shouldHighlight =
    store.input.occurrencesAtDay(start) > 0 || tasks.includes(store.hoveredTask)

  return (
    <div
      className={classNames(
        "table-cell text-right text-xs p-1 leading-none border w-[calc(100%/7)] h-[calc(100%/5)]",
        {
          "font-bold": isToday,
          "font-light": !shouldHighlight && !isToday,
          "opacity-25": !isSameMonth,
          "bg-gray-100": isSameMonth && shouldHighlight,
        },
      )}
    >
      <div className="flex flex-col items-between space-y-1">
        <h6>{start.day}</h6>
        {isSameMonth && (
          <div className="flex flex-auto flex-wrap">
            {tasks.map((task) => (
              <DayTask key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
})

export default Day
