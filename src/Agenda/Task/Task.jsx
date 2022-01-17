import { observer } from "mobx-react"
import { forwardRef, useRef } from "react"
import { applySnapshot, clone, getSnapshot } from "mobx-state-tree"
import classNames from "classnames"

import {
  useEnterKey,
  useEscapeKey,
  useFocus,
  useOnMouseOut,
  useOnMouseOver,
  useStore,
  useOnFocus,
} from "../../hooks"
import { TimeLabel, DurationLabel, DistanceLabel } from "../Label"

import { RecurringIcon } from "./RecurringIcon"
import { SubjectInput } from "./SubjectInput"
import { TaskActionGroup } from "./TaskActionGroup"

export const TaskContent = observer(
  forwardRef(({ task, inputRef, isFocused, onComplete, ...props }, ref) => {
    return (
      <tr
        {...props}
        ref={ref}
        className="align-middle hover:bg-neutral-50 border-b last-of-type:border-0 group"
      >
        <td className="px-4 w-0 text-right text-xs align-middle">
          {task.nextAt && <TimeLabel date={task.nextAt} />}
          {task.duration && <DurationLabel duration={task.duration} />}
        </td>

        <td
          className={classNames(
            "w-full align-middle border-l-4 flex flex-auto items-center px-4 py-2 space-x-2",
            `border-${task.highlightColor}-500`, // border-red-500 border-orange-500 border-amber-500 border-yellow-500 border-lime-500 border-green-500 border-emerald-500 border-teal-500 border-cyan-500 border-sky-500 border-blue-500 border-indigo-500 border-violet-500 border-purple-500 border-fuchsia-500 border-pink-500 border-rose-500
          )}
        >
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
    )
  }),
)

const Task = observer(({ task, ...props }) => {
  const store = useStore()
  const ref = useRef(null)
  const inputRef = useRef(null)
  const isFocused = useFocus(inputRef)
  let target

  if (isFocused) {
    target = clone(task)
    store.addEditingTask(target)
  } else target = task

  const onSubmit = () => {
    // if (target.isValid && target.subject.trim()) {
    applySnapshot(task, getSnapshot(target))
    inputRef.current?.blur()
    store.removeEditingTask(target)
    // }
  }

  const onComplete = () => {
    if (isFocused) {
      onSubmit()
    }
    task.complete()
  }

  useEnterKey(inputRef, onSubmit, [target])

  useOnMouseOver(ref, () => {
    store.setHoveredTask(task)
  })
  useOnMouseOut(ref, () => {
    if (store.hoveredTask === task) store.setHoveredTask(null)
  })

  useOnFocus(inputRef, () => {
    if (task.ast && !task.isRecurring && task.ast.start) {
      task.setExpression(task.simplifiedExpression)
    }
  })

  useEscapeKey(inputRef, () => {
    inputRef.current?.blur()
  })

  return (
    <TaskContent
      ref={ref}
      isFocused={isFocused}
      inputRef={inputRef}
      task={target}
      onComplete={onComplete}
      {...props}
    />
  )
})

export default Task
