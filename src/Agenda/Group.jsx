import { observer } from "mobx-react"

import TaskWrapper from "./Task"

const GroupTaskList = observer(({ name, tasks }) => (
  <div>
    <h1 className="py-2 space-x-2 font-medium">
      <span className="font-normal text-gray-500 text-xs">{tasks.length}</span>
      <span>{name}</span>
    </h1>
    <div>
      {tasks.map((t) => (
        <TaskWrapper key={t.id} task={t} />
      ))}
    </div>
  </div>
))

export default GroupTaskList
