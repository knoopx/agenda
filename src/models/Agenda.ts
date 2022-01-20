import { DateTime } from "luxon";
import { getParent, types as t } from "mobx-state-tree";
import { IStore } from ".";
import { ITask } from "./Task";

const GroupNames = [
  "today",
  "anytime",
  "tomorrow",
  "later this week",
  "next week",
  "upcoming",
];

function groupName(start: DateTime | null) {
  const now = DateTime.now().startOf("day");

  if (!start) return "anytime";

  if (start.hasSame(now, "day")) return "today";

  if (start.hasSame(now.plus({ days: 1 }), "day")) return "tomorrow";
  if (start.hasSame(now, "week")) return "later this week";
  if (start.hasSame(now.plus({ weeks: 1 }).startOf("week"), "week"))
    return "next week";

  return "upcoming";
}

export default t.model("Agenda", {}).views((self) => {
  const store = getParent(self) as IStore;
  return {
    get groupEntries(): [string, ITask[]][] {
      const groups = GroupNames.reduce((res, key) => {
        res[key] = [];
        return res;
      }, {} as { [key: string]: ITask[] });

      const tasks = store.filteredTasks.length
        ? store.filteredTasks
        : store.sortedTasks;

      tasks.forEach((task) => {
        groups[groupName(task.nextAt)].push(task);
      });

      return Object.keys(groups)
        .filter((key) => groups[key].length)
        .map((key) => [key, groups[key]]);
    },
  };
});
