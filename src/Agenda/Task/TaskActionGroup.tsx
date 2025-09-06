import classNames from "classnames";
import { observer } from "mobx-react";
import { HTMLAttributes } from "react";
import { ITask } from "../../models/Task";

import { TaskActionButton } from "./TaskActionButton";

export const TaskActionGroup = observer(
  ({ className, task }: { task: ITask } & HTMLAttributes<HTMLDivElement>) => {
    return (
      <div
        className={classNames(
          "hidden group-hover:flex items-center space-x-1",
          className
        )}
      >
        {task.isRecurring && (
          <TaskActionButton
            className="hover:text-base-08"
            onClick={() => {
              task.remove();
            }}
          >
            <IconMdiTrashCan />
          </TaskActionButton>
        )}

        {task.isRecurring && (
          <TaskActionButton
            className="hover:text-base-0D"
            onClick={() => {
              task.reset();
            }}
          >
            <IconMdiUpdate className="flip-x" />
          </TaskActionButton>
        )}
      </div>
    );
  }
);
