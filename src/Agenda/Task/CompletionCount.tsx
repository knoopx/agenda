import { observer } from "mobx-react";
import { ITask } from "../../models/Task";

interface CompletionCountProps {
  task: ITask;
  className?: string;
}

export const CompletionCount = observer(
  ({ task, className = "" }: CompletionCountProps) => {
    if (!task.isRecurring || !task.completionStats) {
      return null;
    }

    const { total } = task.completionStats;

    if (total === 0) {
      return null;
    }

    return (
      <span
        className={`text-xs text-base-04 bg-base-02 dark:bg-base-02 group-focus-within:text-base-0D group-focus-within:bg-base-0D dark:group-focus-within:bg-base-0D px-2 py-1 rounded-full ${className}`}
      >
        {total}
      </span>
    );
  },
);
