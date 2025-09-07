import classNames from "classnames";
import { observer } from "mobx-react";
import { HTMLAttributes } from "react";
import { ITask } from "../../models/Task";

import { TaskActionButton } from "./TaskActionButton";

export const TaskActionGroup = observer(
  ({
    className,
    task,
    isSelected,
  }: {
    task: ITask;
    isSelected?: boolean;
  } & HTMLAttributes<HTMLDivElement>) => {
    return (
      <div
        className={classNames(
          "hidden group-hover:flex items-center space-x-1",
          className,
        )}
      >
        {task.isRecurring && (
          <TaskActionButton
            className={`${isSelected ? "text-base-0D" : ""} hover:text-base-08`}
            onClick={() => {
              task.remove();
            }}
          >
            <IconMdiTrashCan />
          </TaskActionButton>
        )}

        {task.isRecurring && (
          <TaskActionButton
            className={`${isSelected ? "text-base-0D" : ""} hover:text-base-0D`}
            onClick={() => {
              task.reset();
            }}
          >
            <IconMdiUpdate className="flip-x" />
          </TaskActionButton>
        )}
      </div>
    );
  },
);
