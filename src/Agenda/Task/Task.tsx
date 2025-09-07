import { observer } from "mobx-react";
import { forwardRef, Ref, useRef, useEffect, useCallback } from "react";

import {
  useFocus,
  useStore,
  useEventListener,
  useEscapeKey,
} from "../../hooks";
import IconMdiLink from "~icons/mdi/link.jsx";

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
      onComplete: () => void;
      onSubmit?: () => void;
      onCancel?: () => void;
      index?: number;
    }
  >(
    (
      {
        task,
        inputRef,
        isFocused,
        onComplete,
        onSubmit,
        onCancel,
        index,
        ...props
      },
      ref,
    ) => {
      const store = useStore();

      return (
        <tr
          {...props}
          ref={ref}
          data-task-index={index}
          className={`h-14 align-middle border-b dark:border-b-base-03 last-of-type:border-0 group ${
            task.isCompleted ? "text-base-03" : ""
          } focus-within:bg-base-02 dark:focus-within:bg-base-02`}
        >
           <td className="hidden md:table-cell px-4 text-right text-xs align-middle w-20 h-14 text-base-04 group-focus-within:text-base-0D">
             {task.nextAt && (
               <TimeLabel date={task.nextAt} className="text-xs" />
             )}
             {task.duration && (
               <DurationLabel duration={task.duration} className="text-xs" />
             )}
             {task.isCompleted && task.createdAt && task.lastCompletedAt && (
               <div className="flex flex-col items-end space-y-1">
                 <DurationLabel
                   duration={task.lastCompletedAt.diff(task.createdAt)}
                   className="text-xs text-base-0B font-medium"
                 />
                 {task.isRecurring && task.completionStats && task.completionStats.total > 1 && (
                   <span className="text-xs text-base-04">
                     {task.completionStats.total} completions
                   </span>
                 )}
               </div>
             )}
           </td>

          <td
            style={{ borderColor: task.contextColor }}
            className="w-full align-middle border-l-4 flex flex-auto items-center px-4 h-14 space-x-3"
          >
            {store.displayEmoji &&
              !isFocused &&
              task.emojis.map((char) => <span key={char}>{char}</span>)}

            <SubjectInput
              ref={inputRef}
              task={task}
              isFocused={isFocused}
              onSubmit={onSubmit}
              onCancel={onCancel}
              tabIndex={index !== undefined ? index + 2 : undefined}
            />

            {!isFocused &&
              task.parsedUrls.map(({ url, domain }, index) =>
                domain ? (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    tabIndex={-1}
                    className="flex items-center space-x-1 text-xs text-base-04 hover:text-base-0D ml-1"
                    title={url}
                  >
                    <IconMdiLink className="w-4 h-4" />
                    <span>{domain}</span>
                  </a>
                ) : null,
              )}

            {!isFocused && task.isRecurring && (
              <RecurringIcon title={task.frequency} className="text-base-04" />
            )}

            {task.nextAt && (
              <DistanceLabel
                className="text-xs text-base-04"
                date={task.nextAt}
              />
            )}

            {!isFocused && <TaskActionGroup task={task} />}

            {!isFocused && task.isRecurring && <CompletionCount task={task} />}

            <input
              type="checkbox"
              tabIndex={-1}
              className="w-5 h-5 rounded border-2 border-base-04 bg-base-01 dark:bg-base-01 group-focus-within:border-base-0D group-focus-within:bg-base-01 dark:group-focus-within:bg-base-01 checked:bg-base-0D checked:border-base-0D focus:ring-2 focus:ring-base-0D focus:ring-offset-0 cursor-pointer appearance-none relative checked:after:content-['✓'] checked:after:absolute checked:after:inset-0 checked:after:flex checked:after:items-center checked:after:justify-center checked:after:text-base-00 checked:after:font-bold"
              checked={task.isCompleted}
              onChange={onComplete}
            />
          </td>
        </tr>
      );
    },
  ),
);

const Task = observer(
  ({ task, index, ...props }: { task: ITask; index?: number }) => {
    const store = useStore();
    const ref = useRef<HTMLTableRowElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const isFocused = useFocus(inputRef);
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

    // Register/unregister the row ref with the store when index changes
    useEffect(() => {
      if (index !== undefined && ref.current) {
        store.setTaskRowRef(index, ref.current);
      }
      return () => {
        if (index !== undefined) {
          store.setTaskRowRef(index, null);
        }
      };
    }, [store, index]);

    if (isFocused) {
      // Only allow editing if no other task is currently being edited
      if (!store.editingTask) {
        store.setEditingTask(task);
      }
      target = task;
    } else target = task;

    const onSubmit = useCallback(
      (_e?: Event) => {
        originalSnapshot.current = null;
        store.clearEditingTask();
      },
      [store],
    );

    const onCancel = useCallback(
      (e?: Event) => {
        const input = e?.target as HTMLInputElement;
        const value = input?.value || "";
        // Don't cancel if completions might be showing (input contains @ or #)
        if (value.includes("@") || value.includes("#")) {
          return;
        }
        // Restore original task values if we have a stored snapshot
        if (originalSnapshot.current) {
          task.update({ expression: originalSnapshot.current.expression });
          originalSnapshot.current = null;
        }
        store.clearEditingTask();
      },
      [store, task],
    );

    const onComplete = () => {
      if (isFocused) {
        onSubmit();
      }
      task.complete();
    };

    useEscapeKey(inputRef, onCancel as EventListener, []);

    useEventListener(ref, "mouseover", () => {
      store.setHoveredTask(task);
    });

    useEventListener(ref, "mouseout", () => {
      if (store.hoveredTask === task) store.setHoveredTask(null);
    });

    useEventListener(inputRef, "focus", () => {
      // Store snapshot before any editing happens
      if (!originalSnapshot.current) {
        originalSnapshot.current = { expression: task.expression };
      }

      // Show simplified expression for all valid tasks when editing
      if (task.ast) {
        task.setExpression(task.simplifiedExpression);
      }
    });

    return (
      <TaskContent
        ref={ref}
        isFocused={isFocused}
        inputRef={inputRef}
        task={target}
        onComplete={onComplete}
        onSubmit={onSubmit}
        onCancel={onCancel}
        index={index}
        {...props}
      />
    );
  },
);

export default Task;
