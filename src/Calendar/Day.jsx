import classNames from "classnames"
import { observer } from "mobx-react"
import { useMemo } from "react"
import { DateTime } from "luxon"

import { useStore } from "../Store"

import DayTask from "./DayTask"

const Day = observer(({ start, isSameMonth }) => {
  const store = useStore()

  // const tasks = Array.from(store.occurrences.entries())
  //   .filter(([d]) => start.hasSame(d, "day"))
  //   .map(([, [task]]) => task)

  const isToday = DateTime.now().hasSame(start, "day")

  const highlightClass = useMemo(() => {
    if (store.input.occurrences.some((o) => start.hasSame(o, "day")))
      return "outline-auto"

    return null
  }, [start, store.input.occurrences])

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
        <h6>{start.day}</h6>
        {/* {isSameMonth && (
          <div className="flex justify-self-end space-x-1">
            {tasks.map((task) => (
              <DayTask key={task.id} task={task} />
            ))}
          </div>
        )} */}
      </div>
    </div>
  )
})

export default Day
