import { observer } from "mobx-react";
import { ITask } from "../../models/Task";

interface CompletionCountProps {
  task: ITask;
  className?: string;
  isSelected?: boolean;
}

export const CompletionCount = observer(({ task, className = "", isSelected }: CompletionCountProps) => {
  if (!task.isRecurring || !task.completionStats) {
    return null;
  }

  const { total } = task.completionStats;

  if (total === 0) {
    return null;
  }

  return (
    <span className={`text-xs ${isSelected ? 'text-base-0D bg-base-0D/10' : 'text-base-04 bg-base-02/30'} px-2 py-1 rounded-full ${className}`}>
      {total}
    </span>
  );
});