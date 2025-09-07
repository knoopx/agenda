import classNames from "classnames";
import { observer } from "mobx-react";
import { HTMLAttributes } from "react";
import { ITask } from "../../models/Task";

import { TaskActionButton } from "./TaskActionButton";
import { Tooltip } from "./Tooltip";
import IconMdiTrashCan from "~icons/mdi/trash-can.jsx";
import IconMdiUpdate from "~icons/mdi/update.jsx";

export const TaskActionGroup = observer(
  ({
    className,
    task,
  }: {
    task: ITask;
  } & HTMLAttributes<HTMLDivElement>) => {
    return (
      <div
        className={classNames(
          "hidden group-hover:flex items-center space-x-1",
          className,
        )}
        tabIndex={-1}
      >
        <Tooltip content="Delete task">
          <TaskActionButton
            className="hover:text-base-08 group-focus-within:text-base-0D"
            onClick={() => {
              task.remove();
            }}
          >
            <IconMdiTrashCan />
          </TaskActionButton>
        </Tooltip>

        {task.isRecurring && (
          <Tooltip content="Reset recurring task">
            <TaskActionButton
              className="hover:text-base-0D group-focus-within:text-base-0D"
              onClick={() => {
                task.reset();
              }}
            >
              <IconMdiUpdate className="flip-x" />
            </TaskActionButton>
          </Tooltip>
        )}
      </div>
    );
  },
);
