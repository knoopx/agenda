import { observer } from "mobx-react"

import { Task } from "./Task"

export const GroupTaskList = observer(({ name, tasks }) => (
  <div>
    <h1 className="py-2 font-medium">
      {name}
      <span className="ml-3 font-normal text-gray-500 text-xs">
        {tasks.length}
      </span>
    </h1>
    <div>
      {tasks.map((t) => (
        <Task key={t.id} task={t} />
      ))}
    </div>
  </div>
))
