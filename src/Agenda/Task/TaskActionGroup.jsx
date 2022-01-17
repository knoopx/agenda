import classNames from "classnames"
import { observer } from "mobx-react"

import { TaskActionButton } from "./TaskActionButton"

export const TaskActionGroup = observer(({ className, task }) => {
  return (
    <div
      className={classNames(
        "hidden group-hover:flex items-center space-x-1",
        className,
      )}
    >
      {task.isRecurring && (
        <TaskActionButton
          className="hover:text-red-500"
          onClick={() => task.remove()}
        >
          <IconMdiTrashCan />
        </TaskActionButton>
      )}

      {task.isRecurring && (
        <TaskActionButton
          className="hover:text-blue-500"
          onClick={() => task.reset()}
        >
          <IconMdiUpdate className="flip-x" />
        </TaskActionButton>
      )}
    </div>
  )
})
