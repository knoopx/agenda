import { observer } from "mobx-react";
import { forwardRef, Ref, useRef } from "react";
import { applySnapshot, clone, getSnapshot } from "mobx-state-tree";

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
    }
  >(({ task, inputRef, isFocused, onComplete, ...props }, ref) => {
    const store = useStore();

    return (
      <tr
        {...props}
        ref={ref}
        className="align-middle hover:bg-base-01/60 dark:hover:bg-base-01/60 border-b dark:border-b-base-02/50 last-of-type:border-0 group transition-colors duration-200 ease-in-out"
      >
        <td className="hidden md:table-cell px-4 text-right text-xs align-middle w-20 text-base-04">
          {task.nextAt && <TimeLabel date={task.nextAt} />}
          {task.duration && <DurationLabel duration={task.duration} />}
        </td>

        <td
          style={{ borderColor: task.contextColor }}
          className="w-full align-middle border-l-4 flex flex-auto items-center px-4 py-3 space-x-3"
        >
          {store.displayEmoji &&
            !isFocused &&
            task.emojis.map((char) => <span key={char}>{char}</span>)}

          {!isFocused && task.isRecurring && (
            <RecurringIcon title={task.frequency} />
          )}

          <SubjectInput ref={inputRef} task={task} isFocused={isFocused} />

          {task.nextAt && (
            <DistanceLabel className="text-xs text-base-04" date={task.nextAt} />
          )}

          {!isFocused && <TaskActionGroup task={task} />}

           <input
             type="checkbox"
             className="w-5 h-5 rounded border-2 border-base-04 bg-base-01 checked:bg-base-0D checked:border-base-0D focus:ring-2 focus:ring-base-0D/50 focus:ring-offset-0 hover:border-base-0D/70 transition-all duration-200 cursor-pointer appearance-none"
             checked={false}
             onChange={onComplete}
           />
        </td>
      </tr>
    );
  })
);

const Task = observer(({ task, ...props }: { task: ITask }) => {
  const store = useStore();
  const ref = useRef<HTMLTableRowElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isFocused = useFocus(inputRef);
  let target: ITask;

  if (isFocused) {
    target = clone(task);
    store.addEditingTask(target);
  } else target = task;

  const onSubmit = () => {
    applySnapshot(task, getSnapshot(target));
    inputRef.current?.blur();
    store.removeEditingTask(target);
  };

  const onComplete = () => {
    if (isFocused) {
      onSubmit();
    }
    task.complete();
  };

  useEnterKey(inputRef, onSubmit, [target]);
  useEscapeKey(inputRef, () => {
    inputRef.current?.blur();
  });

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
      inputRef={inputRef}
      task={target}
      onComplete={onComplete}
      {...props}
    />
  );
});

export default Task;
