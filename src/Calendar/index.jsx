import { observer } from "mobx-react"

import { useStore } from "../Store"

import EachMonth from "./EachMonth"
import Month from "./Month"

const Calendar = observer(() => {
  const store = useStore()

  let prevYear

  return (
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
  )
})

export default Calendar
