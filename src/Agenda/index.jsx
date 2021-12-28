import { observer } from "mobx-react"
import { groupBy } from "lodash"
import { DateTime } from "luxon"

import { useStore } from "../Store"

import Group from "./Group"

export const Agenda = observer(() => {
  const store = useStore()

  const groups = groupBy(store.sortedTasks, (task) => {
    const now = DateTime.now()

    if (!task.nextAt) return "anytime"
    if (task.nextAt.hasSame(now, "day")) return "today"
    if (task.nextAt.hasSame(now.plus({ days: 1 }), "day")) return "tomorrow"
    if (task.nextAt.hasSame(now, "week")) return "later this week"
    if (task.nextAt.hasSame(now, "month")) return "later this month"
    return "later"
  })

  return (
    <div>
      {Object.keys(groups).map((group) => (
        <Group key={group} name={group} tasks={groups[group]} />
      ))}
    </div>
  )
})
