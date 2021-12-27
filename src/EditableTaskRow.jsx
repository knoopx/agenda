import { MdUpdate } from "react-icons/md"
import { IoMdTrash } from "react-icons/io"
import { observer } from "mobx-react"
import classNames from "classnames"

import { TimeLabel, DurationLabel, DistanceLabel } from "./Label"

/*
  border-red-500 border-orange-500 border-amber-500 border-yellow-500 border-lime-500 border-green-500 border-emerald-500 border-teal-500 border-cyan-500 border-sky-500 border-blue-500 border-indigo-500 border-violet-500 border-purple-500 border-fuchsia-500 border-pink-500 border-rose-500
*/

export const EditableTaskRow = observer(
  ({ task, inputRef, isFocused, ...props }) => {
    return (
      <div {...props} className="flex relative group">
        <div className="flex flex-auto items-center mr-24 space-x-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              className="inline-block"
              checked={false}
              disabled={isFocused}
              onChange={() => task.complete()}
            />
            <div className="flex flex-col items-end justify-center w-20 text-xs">
              {task.nextAt && <TimeLabel date={task.nextAt} />}
              {task.duration && <DurationLabel time={task.duration} />}
            </div>
          </div>

          <div
            className={classNames(
              "flex flex-auto items-center px-4 py-2 space-x-2 border-l-4",
              `border-${task.highlightColor}-500`,
            )}
          >
            {!isFocused && task.freq && (
              <span className="flex items-center" title={task.freq}>
                <MdUpdate />
              </span>
            )}
            <input
              ref={inputRef}
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
            <div className="flex items-center space-x-4 text-xs">
              {task.nextAt && <DistanceLabel date={task.nextAt} />}
            </div>
          </div>
        </div>

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
      </div>
    )
  },
)
