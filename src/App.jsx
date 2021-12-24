import {
  addDays,
  eachMonthOfInterval,
  formatDistance,
  isSameDay,
} from "date-fns"
import { MdTimer, MdUpdate } from "react-icons/md"
import { IoMdTime, IoMdTrash } from "react-icons/io"
import { observer } from "mobx-react"
import { useEffect, useRef } from "react"
import { getSnapshot } from "mobx-state-tree"
import classNames from "classnames"
import { groupBy } from "lodash"

import MonthCalendar from "./components/MonthCalendar"
import { useStore } from "./Store"

const CalendarDay = ({ date: d, highlight, isSameMonth }) => {
  const isToday = isSameDay(d, new Date())
  const highlightClass = highlight(d)

  return (
    <div
      className={classNames(
        "table-cell text-right text-xs p-1 leading-none border",
        {
          "font-bold": isToday,
          "font-light": !highlightClass && !isToday,
          "opacity-25": !isSameMonth,
        },
        highlightClass,
      )}
    >
      <span className={classNames({})}>{d.getDate()}</span>
    </div>
  )
}

// format duration as "5d 1h 30m"
function formatDuration(duration) {
  const segments = []

  const days = Math.floor(duration / (60 * 24))
  if (days > 0) {
    segments.push(`${days}d`)
  }

  const hours = Math.floor((duration % (60 * 24)) / 60)
  if (hours > 0) {
    segments.push(`${hours}h`)
  }
  const minutes = Math.floor(duration % 60)
  if (minutes > 0) {
    segments.push(`${minutes}m`)
  }

  return segments.join(" ")
}

const DateLabel = ({ date }) => (
  <span className="flex items-center space-x-2">
    <span
      className={classNames({
        "text-red-500": date.getTime() - new Date().getTime() < 0,
      })}
    >
      {formatDistance(date, new Date(), { addSuffix: true })}
    </span>
    <IoMdTime />
    {useStore().formatTime(date)}
  </span>
)

const TimeLabel = ({ time }) => (
  <span className="flex items-center">
    <MdTimer />
    {formatDuration(time)}
  </span>
)

const TaskTimeSummary = ({ task, className, children }) => (
  <div className={classNames("flex items-center space-x-4 text-sm", className)}>
    {children}
    {task.duration && <TimeLabel time={task.duration} />}
    {task.nextAt && <DateLabel date={task.nextAt} />}

    {task.freq && (
      <>
        <button
          type="button"
          className="flex items-center"
          onClick={() => {
            task.reset()
          }}
        >
          <MdUpdate />
          {task.freq}
        </button>
      </>
    )}
  </div>
)

const Task = ({ task }) => {
  return (
    <div className="flex items-center px-4 py-2 space-x-2 odd:bg-gray-50">
      <input
        type="checkbox"
        className="inline-block"
        checked={false}
        onChange={() => task.complete()}
      />
      <span className="flex-auto">{task.subject}</span>
      {/* <span className="flex-auto">
        {formatDistance(task.lastCompletedAt, new Date(), { addSuffix: true })}
      </span> */}
      <TaskTimeSummary task={task} />
      <button
        type="button"
        className="inline-block"
        onClick={() => task.remove()}
      >
        <IoMdTrash />
      </button>
    </div>
  )
}

function App() {
  const store = useStore()
  const inputRef = useRef()

  const onChange = (e) => {
    const props = { [e.target.name]: e.target.value }
    store.input.task.update(props)
  }

  useEffect(() => {
    const onSubmit = () => {
      const { task } = store.input

      if (task.isValid) {
        if (!task.isRecurring && task.start) {
          const expression = [
            task.subject,
            store.formatDate(task.output.start),
            "at",
            store.formatTime(task.output.start),
          ].join(" ")

          task.update({
            expression,
          })
        }

        store.addTask(getSnapshot(task))

        store.input.task.update({ expression: "" })
      }
    }

    const listener = (event) => {
      if (event.code === "Enter" || event.code === "NumpadEnter") {
        event.preventDefault()
        onSubmit(event)
      }
    }
    inputRef.current.addEventListener("keydown", listener)
    return () => {
      inputRef.current.removeEventListener("keydown", listener)
    }
  })

  const doHighlight = (date) => {
    if (isSameDay(date, store.input.task.nextAt))
      return "bg-red-500 text-white font-bold"

    if (store.input.occurrences.some((o) => isSameDay(o, date)))
      return "bg-red-500 text-white font-bold"

    if (
      store.tasks.some((t) =>
        t
          .occurrences(store.input.calendarStart, store.input.calendarEnd)
          .some((o) => isSameDay(o, date)),
      )
    )
      return "bg-yellow-200"

    return null
  }

  const renderTasks = () => {
    const groups = groupBy(store.sortedTasks, (task) => {
      if (!task.nextAt) return "Anytime"
      if (isSameDay(task.nextAt, new Date())) return "Today"
      if (isSameDay(task.nextAt, addDays(new Date(), 1))) return "Tomorrow"
      return "Later"
    })

    return Object.keys(groups).map((group) => (
      <div key={group}>
        <h1 className="py-2 font-medium">{group}</h1>
        {groups[group].map((t) => (
          <Task key={[t.subject, t.expression].join()} task={t} />
        ))}
      </div>
    ))
  }

  return (
    <div className="container mx-auto py-8 font-sans-serif">
      <div className="mb-8">
        <input
          value={store.locale}
          onChange={(e) => store.setLocale(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2">
        <div className="max-w-fit">
          <h5 className="mb-4 font-bold text-center text-lg">
            {store.formatYear(store.input.calendarStart)}
          </h5>
          <div className="grid flex-none grid-cols-3">
            {eachMonthOfInterval({
              start: store.input.calendarStart,
              end: store.input.calendarEnd,
            }).map((monthDate) => (
              <div key={monthDate.toISOString()} className="flex flex-col m-2">
                {monthDate.toLocaleString("default", { month: "long" })}
                <MonthCalendar
                  className="flex-auto"
                  date={monthDate}
                  renderDay={(props) => (
                    <CalendarDay
                      {...props}
                      key={props.date.toISOString()}
                      highlight={doHighlight}
                    />
                  )}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <input
              ref={inputRef}
              autoComplete="off"
              name="expression"
              className={classNames("w-full border py-2 rounded b px-2", {
                "outline-red-500": !store.input.task.isValid,
              })}
              type="text"
              value={store.input.task.expression}
              onChange={onChange}
            />
            {!store.input.task.isValid && (
              <div className="mt-2 text-red-500 text-xs">
                {store.input.task.error}
              </div>
            )}
            <TaskTimeSummary task={store.input.task} className="mt-2 text-xs">
              <span className="flex-auto font-medium">
                {store.input.task.subject}
              </span>
            </TaskTimeSummary>
          </div>

          <div className="divide-y">{renderTasks()}</div>
        </div>
      </div>
    </div>
  )
}

export default observer(App)
