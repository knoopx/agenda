import { observer } from "mobx-react";
import { forwardRef, Ref, useRef, useEffect } from "react";
import { applySnapshot, getSnapshot } from "mobx-state-tree";

import {
  useEnterKey,
  useEscapeKey,
  useFocus,
  useStore,
  useEventListener,
} from "../../hooks";

import { TimeLabel } from "./TimeLabel";
import { DurationLabel } from "./DurationLabel";
import { DistanceLabel } from "./DistanceLabel";
import { RecurringIcon } from "./RecurringIcon";
import { CompletionCount } from "./CompletionCount";
import { SubjectInput } from "./SubjectInput";
import { TaskActionGroup } from "./TaskActionGroup";
import { ITask } from "../../models/Task";

export const TaskContent = observer(
  forwardRef<
    HTMLTableRowElement,
    {
      task: ITask;
      inputRef: Ref<HTMLInputElement>;
      isFocused: boolean;
      isSelected: boolean;
      onComplete: () => void;
      onSubmit?: () => void;
      index?: number;
    }
  >(({ task, inputRef, isFocused, isSelected, onComplete, onSubmit, index, ...props }, ref) => {
    const store = useStore();

    return (
      <tr
        {...props}
        ref={ref}
        data-task-index={index}
        className={`h-14 align-middle border-b dark:border-b-base-02/50 last-of-type:border-0 group ${task.isCompleted && !isSelected ? 'opacity-50' : ''} ${isSelected ? 'bg-base-0D/10 dark:bg-base-0D/20' : ''} ${isFocused ? 'bg-base-0D/10 dark:bg-base-0D/20' : ''}`}
      >
         <td className={`hidden md:table-cell px-4 text-right text-xs align-middle w-20 h-14 ${isSelected ? 'text-base-0D' : 'text-base-04'}`}>
            {task.nextAt && <TimeLabel date={task.nextAt} isSelected={isSelected} className="text-xs" />}
            {task.duration && <DurationLabel duration={task.duration} isSelected={isSelected} className="text-xs" />}
         </td>

        <td
          style={{ borderColor: task.contextColor }}
          className="w-full align-middle border-l-4 flex flex-auto items-center px-4 h-14 space-x-3"
        >
          {store.displayEmoji &&
            !isFocused &&
            task.emojis.map((char) => <span key={char}>{char}</span>)}

          {!isFocused && task.isRecurring && (
            <RecurringIcon title={task.frequency} />
          )}

           <SubjectInput ref={inputRef} task={task} isFocused={isFocused} isSelected={isSelected} onSubmit={onSubmit} />

            {task.nextAt && (
              <DistanceLabel className="text-xs" date={task.nextAt} isSelected={isSelected} />
            )}

           {!isFocused && <TaskActionGroup task={task} isSelected={isSelected} />}

           {!isFocused && task.isRecurring && (
             <CompletionCount task={task} isSelected={isSelected} />
           )}

            <input
              type="checkbox"
              className={`w-5 h-5 rounded border-2 ${isSelected ? 'border-base-0D bg-base-0D/5' : 'border-base-04 bg-base-01'} checked:bg-base-0D checked:border-base-0D focus:ring-2 focus:ring-base-0D/50 focus:ring-offset-0 cursor-pointer appearance-none relative checked:after:content-['✓'] checked:after:absolute checked:after:inset-0 checked:after:flex checked:after:items-center checked:after:justify-center checked:after:text-white checked:after:font-bold checked:after:text-sm`}
              checked={task.isCompleted}
              onChange={onComplete}
            />
        </td>
      </tr>
    );
  })
);

const Task = observer(({ task, index, ...props }: { task: ITask; index?: number }) => {
  const store = useStore();
  const ref = useRef<HTMLTableRowElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isFocused = useFocus(inputRef);
  const isSelected = index !== undefined && store.selectedTaskIndex === index;
  let target: ITask;
  const originalSnapshot = useRef<any>(null);

  // Register/unregister the input ref with the store when index changes
  useEffect(() => {
    if (index !== undefined && inputRef.current) {
      store.setTaskInputRef(index, inputRef.current);
    }
    return () => {
      if (index !== undefined) {
        store.setTaskInputRef(index, null);
      }
    };
  }, [store, index]);

  if (isFocused) {
    // Only allow editing if no other task is currently being edited
    if (!store.editingTask) {
      // Store original snapshot before editing
      originalSnapshot.current = getSnapshot(task);
      store.setEditingTask(task);
    }
    target = task;
  } else target = task;

  const onSubmit = (_e?: Event) => {
    originalSnapshot.current = null;
    inputRef.current?.blur();
    store.clearEditingTask();
  };

  const onCancel = (_e: Event) => {
    // Restore original task values if we have a stored snapshot
    if (originalSnapshot.current) {
      applySnapshot(task, originalSnapshot.current);
      originalSnapshot.current = null;
    }
    inputRef.current?.blur();
    store.clearEditingTask();
  };

  const onComplete = () => {
    if (isFocused) {
      onSubmit();
    }
    task.complete();
  };

  useEnterKey(inputRef, onSubmit);
  useEscapeKey(inputRef, onCancel);

  useEventListener(ref, "mouseover", () => {
    store.setHoveredTask(task);
  });

  useEventListener(ref, "mouseout", () => {
    if (store.hoveredTask === task) store.setHoveredTask(null);
  });

  useEventListener(inputRef, "focus", () => {
    if (task.ast && !task.isRecurring && task.ast.start) {
      task.setExpression(task.simplifiedExpression);
    }
  });

  return (
    <TaskContent
      ref={ref}
      isFocused={isFocused}
      isSelected={isSelected}
      inputRef={inputRef}
      task={target}
      onComplete={onComplete}
      onSubmit={onSubmit}
      index={index}
      {...props}
    />
  );
});

export default Task;
