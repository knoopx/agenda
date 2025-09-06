import { DateTime } from "luxon";
import { getParent, types as t } from "mobx-state-tree";
import { IStore } from ".";
import { ITask } from "./Task";

const GroupNames = [
  "due",
  "today",
  "tomorrow",
  "later this week",
  "next week",
  "upcoming",
];

function groupName(start: DateTime | null) {
  const now = DateTime.now().startOf("day");

  if (!start) return "today";

  if (start < now)  return "due"
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

      store.filteredTasks.forEach((task) => {
        groups[groupName(task.nextAt)].push(task);
      });

      // Sort tasks within each group by their global index
      Object.keys(groups).forEach((key) => {
        groups[key].sort((a, b) => {
          const indexA = store.filteredTasks.findIndex((t: ITask) => t.id === a.id);
          const indexB = store.filteredTasks.findIndex((t: ITask) => t.id === b.id);
          return indexA - indexB;
        });
      });

      return GroupNames
        .filter((key) => groups[key].length)
        .map((key) => [key, groups[key]] as [string, ITask[]]);
    },
  };
});
