import classNames from "classnames"
import { observer } from "mobx-react"

const DayTask = observer(({ task }) => {
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

export default DayTask
