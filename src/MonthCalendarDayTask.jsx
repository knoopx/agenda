import { observer } from "mobx-react"
import classNames from "classnames"

export const MonthCalendarDayTask = observer(({ task }) => {
  return (
    <div
      title={task.subject}
      className={classNames(
        "h-1 w-1 rounded-full",
        `bg-${task.highlightColor}-500`,
      )}
    />
  )
})
