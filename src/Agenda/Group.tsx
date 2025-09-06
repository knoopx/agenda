import { observer } from "mobx-react";
import { ITask } from "../models/Task";

import Task from "./Task";

const GroupTaskList = observer(
  ({ name, tasks }: { name: string; tasks: ITask[] }) => (
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
        {tasks.map((t) => (
          <Task key={t.id} task={t} />
        ))}
      </tbody>
    </>
  )
);

export default GroupTaskList;
