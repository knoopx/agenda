import classNames from "classnames"
import { observer } from "mobx-react"

import { useStore } from "../hooks"
import { now } from "../helpers"

import Indicator from "./Indicator"

const Day = observer(({ start, isSameMonth }) => {
  const store = useStore()

  const contexts = store.getContextsAtDay(start)

  const isToday = now(5000).hasSame(start, "day")

  const shouldHighlight = store.input.occurrencesAtDay(start) > 0

  return (
    <div
      className={classNames(
        "table-cell text-right text-xs p-1 leading-none rounded-[2px] w-[calc(100%/7)] h-[calc(100%/5)]",
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
            {contexts.map((context) => (
              <Indicator key={context} color={store.getContextColor(context)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
})

export default Day
