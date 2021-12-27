import { addDays, isSameDay } from "date-fns"
import { observer } from "mobx-react"
import { groupBy } from "lodash"

import { useStore } from "./store"
import { GroupTaskList } from "./GroupTaskList"

export const Agenda = observer(() => {
  const store = useStore()

  const groups = groupBy(store.sortedTasks, (task) => {
    if (!task.nextAt) return "Anytime"
    if (isSameDay(task.nextAt, new Date())) return "Today"
    if (isSameDay(task.nextAt, addDays(new Date(), 1))) return "Tomorrow"
    return "Later"
  })

  return Object.keys(groups).map((group) => (
    <GroupTaskList key={group} name={group} tasks={groups[group]} />
  ))
})
