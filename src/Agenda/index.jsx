import { observer } from "mobx-react"
import { groupBy } from "lodash"
import { DateTime } from "luxon"

import { useStore } from "../hooks"

import Group from "./Group"

export const Agenda = observer(() => {
  const store = useStore()
  const now = DateTime.now()

  const groups = groupBy(store.sortedTasks, (task) => {
    if (!task.nextAt) return "anytime"

    if (task.nextAt.hasSame(now, "day")) return "today"
    // if (task.nextAt.hasSame(now.plus({ days: 1 }), "day")) return "tomorrow"
    // if (task.nextAt.hasSame(now, "week")) return "later this week"
    if (
      task.nextAt.hasSame(now.plus({ days: 1 }), "day") ||
      task.nextAt.hasSame(now, "week")
    )
      return "later"

    // if (task.nextAt.hasSame(now.plus({ weeks: 1 }), "week")) return "next week"
    // if (task.nextAt.hasSame(now, "month")) return "later this month"
    return "upcoming"
  })

  if (Object.keys(groups).length === 0) {
    return (
      <div className="flex flex-auto items-center justify-center">
        <h1 className="text-neutral-400 text-xl">No tasks yet</h1>
      </div>
    )
  }

  return (
    <div>
      {Object.keys(groups).map((group) => (
        <Group key={group} name={group} tasks={groups[group]} />
      ))}
    </div>
  )
})
