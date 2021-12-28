import { observer } from "mobx-react"
import { groupBy } from "lodash"
import { DateTime } from "luxon"

import { useStore } from "./store"
import { GroupTaskList } from "./GroupTaskList"

export const Agenda = observer(() => {
  const store = useStore()

  const groups = groupBy(store.sortedTasks, (task) => {
    const now = DateTime.now()

    if (!task.nextAt) return "Anytime"
    if (task.nextAt.hasSame(now, "day")) return "Today"
    if (task.nextAt.hasSame(now.plus({ days: 1 }), "day")) return "Tomorrow"
    return "Later"
  })

  return Object.keys(groups).map((group) => (
    <GroupTaskList key={group} name={group} tasks={groups[group]} />
  ))
})
