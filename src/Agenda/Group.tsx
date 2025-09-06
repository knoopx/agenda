import { observer } from "mobx-react";
import { ITask } from "../models/Task";
import { useStore } from "../hooks";

import Task from "./Task";

const GroupTaskList = observer(
  ({ name, tasks }: { name: string; tasks: ITask[] }) => {
    const store = useStore();

    // Sort tasks within the group by their global index to maintain keyboard navigation order
    const sortedTasks = tasks.slice().sort((a, b) => {
      const indexA = store.filteredTasks.findIndex(task => task.id === a.id);
      const indexB = store.filteredTasks.findIndex(task => task.id === b.id);
      return indexA - indexB;
    });

    return (
      <>
        <thead className="group">
          <tr>
            <th className="hidden md:table-cell" />
            <th className="pb-4 pt-6 px-4 group-first:pt-0 space-x-2 text-left align-middle">
              <span>{name}</span>
              <span className="font-normal text-base-04 text-sm">
                {tasks.length}
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedTasks.map((t) => {
            const globalIndex = store.filteredTasks.findIndex(task => task.id === t.id);
            return (
              <Task key={t.id} task={t} index={globalIndex} />
            );
          })}
        </tbody>
      </>
    );
  }
);

export default GroupTaskList;
