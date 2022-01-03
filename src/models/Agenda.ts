import { DateTime } from 'luxon'
import { getParent, types as t } from 'mobx-state-tree'
import { IStore } from '.'
import { ITask } from './Task'

function groupName(start: DateTime | void) {
    const now = DateTime.now()

    if (!start) return "anytime"

    if (start.hasSame(now, "day")) return "today"

    if (start.hasSame(now.plus({ days: 1 }), "day")) return "tomorrow"
    if (start.hasSame(now, "week")) return "later this week"

    // if (
    //   start.hasSame(now.plus({ days: 1 }), "day") ||
    //   start.hasSame(now, "week")
    // )
    //   return "later"

    // if (start.hasSame(now.plus({ weeks: 1 }), "week")) return "next week"
    // if (start.hasSame(now, "month")) return "later this month"
    return "upcoming"
  }

export default t.model("Agenda", {

}).views(self => {
    return ({
        get groupEntries(): [string, ITask[]][] {
            const groups = {
                anytime: []  ,
                today: [],
                tomorrow: [],
                "later this week": [],
                later: [],
                upcoming: [],
            } as { [key: string]: ITask[] }

            const { sortedTasks } = getParent(self) as IStore
            sortedTasks.forEach((task) => {
                groups[groupName(task.nextAt)].push(task)
            })

            return Object.keys(groups).filter(key => groups[key].length).map(key => [key, groups[key]])
        }
    })
})