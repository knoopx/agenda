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
        className="align-middle hover:bg-neutral-50 dark:hover:bg-[#292929] border-b dark:border-b-[#333] last-of-type:border-0 group"
      >
        <td className="hidden md:table-cell px-4 text-right text-xs align-middle w-20">
          {task.nextAt && <TimeLabel date={task.nextAt} />}
          {task.duration && <DurationLabel duration={task.duration} />}
        </td>

        <td
          style={{ borderColor: task.contextColor }}
          className="w-full align-middle border-l-4 flex flex-auto items-center px-4 py-2 space-x-2"
        >
          {store.displayEmoji &&
            !isFocused &&
            task.emojis.map((char) => <span key={char}>{char}</span>)}

          {!isFocused && task.isRecurring && (
            <RecurringIcon title={task.frequency} />
          )}

          <SubjectInput ref={inputRef} task={task} isFocused={isFocused} />

          {task.nextAt && (
            <DistanceLabel className="text-xs" date={task.nextAt} />
          )}

          {!isFocused && <TaskActionGroup task={task} />}

          <input
            type="checkbox"
            className="inline-block"
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
