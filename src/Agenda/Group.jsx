import { observer } from "mobx-react"

import TaskWrapper from "./Task"

const GroupTaskList = observer(({ name, tasks }) => (
  <div>
    <div className="flex items-center mb-4 space-x-9 font-medium">
      <div className="w-16 font-normal text-right text-neutral-500 text-sm">
        {tasks.length}
      </div>
      <div className="font-bold">{name}</div>
    </div>
    <div className="divide-y">
      {tasks.map((t) => (
        <TaskWrapper key={t.id} task={t} />
      ))}
    </div>
  </div>
))

export default GroupTaskList
