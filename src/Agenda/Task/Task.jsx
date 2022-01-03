import { observer } from "mobx-react"
import { forwardRef, useRef } from "react"
import { applySnapshot, clone } from "mobx-state-tree"
import classNames from "classnames"

import {
  useEnterKey,
  useOnBlur,
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
import { CheckBox } from "./CheckBox"

export const Task = observer(
  forwardRef(({ task, inputRef, isFocused, ...props }, ref) => {
    return (
      <div
        {...props}
        ref={ref}
        className="flex flex-auto relative items-center space-x-4 hover:bg-neutral-50 group"
      >
        <div className="flex flex-col items-end justify-center w-20 text-xs">
          {task.nextAt && <TimeLabel date={task.nextAt} />}
          {task.duration && <DurationLabel duration={task.duration} />}
        </div>

        <div
          className={classNames(
            "flex flex-auto items-center px-4 py-2 space-x-2 border-l-4 ",
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

          <TaskActionGroup task={task} />

          <CheckBox {...{ isFocused, task }} />
        </div>
      </div>
    )
  }),
)

const TaskWrapper = observer(({ task, ...props }) => {
  const ref = useRef(null)
  const inputRef = useRef(null)
  const isFocused = useFocus(inputRef)
  const target = isFocused ? clone(task) : task

  const onSubmit = () => {
    // if (target.isValid && target.subject.trim()) {
    applySnapshot(task, target)
    inputRef.current?.blur()
    // }
  }

  const store = useStore()
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
  // useOnBlur(inputRef, () => {
  //   onSubmit()
  // })
  useEscapeKey(inputRef, () => {
    inputRef.current?.blur()
  })

  return (
    <Task
      ref={ref}
      isFocused={isFocused}
      inputRef={inputRef}
      task={target}
      {...props}
    />
  )
})

export default TaskWrapper
