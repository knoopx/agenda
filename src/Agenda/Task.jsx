import { observer } from "mobx-react"
import { forwardRef, useRef } from "react"
import { applySnapshot, clone } from "mobx-state-tree"
import { MdUpdate } from "react-icons/md"
import { IoMdTrash } from "react-icons/io"
import classNames from "classnames"

import { useFocus, useEnterKey, useOnBlur, useEscapeKey } from "../hooks"

import { TimeLabel, DurationLabel, DistanceLabel } from "./Label"

const CheckBox = ({ isFocused, task }) => {
  return (
    <input
      type="checkbox"
      className="inline-block"
      checked={false}
      disabled={isFocused}
      onChange={() => task.complete()}
    />
  )
}

const SubjectInput = forwardRef(({ isFocused, task }, ref) => {
  return (
    <input
      ref={ref}
      type="text"
      value={isFocused ? task.expression : task.subject}
      className={classNames(
        "flex-auto font-medium bg-transparent outline-none",
        {
          "text-red-500": !task.isValid,
        },
      )}
      onChange={(e) => {
        task.update({ expression: e.target.value })
      }}
    />
  )
})

const RecurringIcon = (props) => {
  return (
    <span className="flex items-center" {...props}>
      <MdUpdate />
    </span>
  )
}

const TaskActions = ({ task, isFocused }) => {
  return (
    <div className="flex absolute right-0 invisible group-hover:visible w-24">
      <button
        type="button"
        className="flex items-center justify-center h-10 w-10 text-gray-500 hover:bg-gray-50 rounded cursor-pointer"
        onClick={() => task.remove()}
      >
        <IoMdTrash />
      </button>

      {!isFocused && task.isRecurring && (
        <button
          type="button"
          className="flex items-center justify-center h-10 w-10 text-gray-500 hover:bg-gray-50 rounded cursor-pointer"
          onClick={() => task.reset()}
        >
          <MdUpdate />
        </button>
      )}
    </div>
  )
}

export const Task = observer(({ task, inputRef, isFocused, ...props }) => {
  return (
    <div {...props} className="flex relative group">
      <div className="flex flex-auto items-center mr-24 space-x-4">
        <div className="flex items-center">
          <CheckBox {...{ isFocused, task }} />
          <div className="flex flex-col items-end justify-center w-20 text-xs">
            {task.nextAt && <TimeLabel date={task.nextAt} />}
            {task.duration && <DurationLabel time={task.duration} />}
          </div>
        </div>

        <div
          className={classNames(
            "flex flex-auto items-center px-4 py-2 space-x-2 border-l-4",
            `border-${task.highlightColor}-500`, // border-red-500 border-orange-500 border-amber-500 border-yellow-500 border-lime-500 border-green-500 border-emerald-500 border-teal-500 border-cyan-500 border-sky-500 border-blue-500 border-indigo-500 border-violet-500 border-purple-500 border-fuchsia-500 border-pink-500 border-rose-500
          )}
        >
          {!isFocused && task.isRecurring && (
            <RecurringIcon title={task.freq} />
          )}
          <SubjectInput ref={inputRef} task={task} isFocused={isFocused} />

          <div className="flex items-center space-x-4 text-xs">
            {task.nextAt && <DistanceLabel date={task.nextAt} />}
          </div>
        </div>
      </div>

      <TaskActions task={task} isFocused={isFocused} />
    </div>
  )
})

const TaskWrapper = observer(({ task, ...props }) => {
  const inputRef = useRef(null)
  const isFocused = useFocus(inputRef)
  const target = isFocused ? clone(task) : task

  const onSubmit = () => {
    if (target.isValid) {
      applySnapshot(task, target)
      inputRef.current?.blur()
    }
  }

  useEnterKey(inputRef, onSubmit, [target])
  useOnBlur(onSubmit)
  useEscapeKey(inputRef, () => {
    inputRef.current?.blur()
  })

  return (
    <Task isFocused={isFocused} inputRef={inputRef} task={target} {...props} />
  )
})

export default TaskWrapper
