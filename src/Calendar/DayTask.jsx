import classNames from "classnames"
import { observer } from "mobx-react"

//
const DayTask = observer(({ task }) => {
  return (
    <div
      title={task.subject}
      className={classNames(
        "m-[.05em] h-1 w-1 rounded-full",
        `bg-${task.highlightColor}-500`, // bg-red-500 bg-orange-500 bg-amber-500 bg-yellow-500 bg-lime-500 bg-green-500 bg-emerald-500 bg-teal-500 bg-cyan-500 bg-sky-500 bg-blue-500 bg-indigo-500 bg-violet-500 bg-purple-500 bg-fuchsia-500 bg-pink-500 bg-rose-500
      )}
    />
  )
})

export default DayTask
