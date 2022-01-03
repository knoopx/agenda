import classNames from "classnames"
import { observer } from "mobx-react"
import { IoMdTrash } from "react-icons/io"
import { MdUpdate } from "react-icons/md"

import { TaskAction } from "./TaskAction"

export const TaskActionGroup = observer(({ className, task }) => {
  return (
    <div
      className={classNames("hidden group-hover:flex items-center", className)}
    >
      {task.isRecurring && (
        <TaskAction
          className="hover:text-red-500"
          onClick={() => task.remove()}
        >
          <IoMdTrash />
        </TaskAction>
      )}

      {task.isRecurring && (
        <TaskAction
          className="hover:text-blue-500"
          onClick={() => task.reset()}
        >
          <MdUpdate className="flip-x" />
        </TaskAction>
      )}
    </div>
  )
})
