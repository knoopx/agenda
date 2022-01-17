import classNames from "classnames"
import { observer } from "mobx-react"

import { useStore } from "../hooks"

import EachMonth from "./EachMonth"
import Month from "./Month"

const Calendar = observer(({ className }) => {
  const store = useStore()

  let prevYear

  return (
    <div
      className={classNames("flex flex-col overflow-y-auto -m-2", className)}
    >
      <EachMonth start={store.calendarStart} end={store.calendarEnd}>
        {({ start: monthStart }) => {
          const shouldDisplayYear = monthStart.year !== prevYear
          prevYear = monthStart.year
          return (
            <Month
              key={monthStart}
              start={monthStart}
              displayYear={shouldDisplayYear}
            />
          )
        }}
      </EachMonth>
    </div>
  )
})

export default Calendar
