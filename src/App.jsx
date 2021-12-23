import {
  eachMonthOfInterval,
  endOfYear,
  isSameDay,
  startOfYear,
} from "date-fns"
import { MdTimer, MdUpdate, MdCalendarToday } from "react-icons/md"
import { IoMdTime } from "react-icons/io"
import { observer } from "mobx-react"
import { useEffect } from "react"
import { getSnapshot } from "mobx-state-tree"
import classNames from "classnames"

import MonthCalendar from "./components/MonthCalendar"
import { useStore } from "./Store"

const CalendarDay = ({ date: d, isHighlighted, isSameMonth }) => {
  const isToday = isSameDay(d, new Date())
  return (
    <div
      className={classNames(
        "table-cell text-right text-xs p-1 leading-none border",
        {
          "font-bold": isToday,
          "font-light": !isToday,
          "opacity-25": !isSameMonth,
          "text-white bg-red-500 font-bold": isHighlighted,
        },
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

const TaskTimeSummary = ({ task, className }) => (
  <div className={classNames("flex items-center space-x-4", className)}>
    {task.duration && (
      <span className="flex items-center">
        <MdTimer />
        {formatDuration(task.duration)}
      </span>
    )}

    {task.start && (
      <span className="flex items-center space-x-2">
        <MdCalendarToday />
        {task.start.toLocaleDateString("default", {
          date: "short",
        })}
        <IoMdTime />
        {task.start
          .toTimeString()
          .split(" ")[0]
          .split(":")
          .slice(0, 2)
          .join(":")}
      </span>
    )}

    {task.repeat && (
      <span className="flex items-center">
        <MdUpdate />
      </span>
    )}
  </div>
)

const Task = ({ task }) => {
  return (
    <label className="flex items-center space-x-2 odd:bg-gray-50">
      <input type="checkbox" className="inline-block" />
      <span className="flex-auto">{task.subject}</span>
      <TaskTimeSummary task={task} />
    </label>
  )
}

function App() {
  const store = useStore()

  const onChange = (e) => {
    store.input.task.update({ [e.target.name]: e.target.value })
  }

  useEffect(() => {
    const onSubmit = () => {
      const { task } = store.input

      if (!task.repeat && task.output.start) {
        const expression = [
          task.output.start.toLocaleDateString("default", {
            date: "short",
          }),
          "at",
          task.output.start
            .toTimeString()
            .split(" ")[0]
            .split(":")
            .slice(0, 2)
            .join(":"),
        ].join(" ")

        task.update({
          expression,
        })
      }

      store.addTask(getSnapshot(task))

      store.input.task.update({ subject: "", expression: "" })
    }

    const listener = (event) => {
      if (event.code === "Enter" || event.code === "NumpadEnter") {
        event.preventDefault()
        onSubmit(event)
      }
    }
    document.addEventListener("keydown", listener)
    return () => {
      document.removeEventListener("keydown", listener)
    }
  })

  return (
    <div className="container mx-auto py-8 font-sans-serif">
      <div className="grid grid-cols-2">
        <div className="max-w-fit">
          <h5 className="mb-4 font-bold text-center text-lg">
            {store.calendarStart.toLocaleString("default", { year: "numeric" })}
          </h5>
          <div className="grid flex-none grid-cols-3">
            {eachMonthOfInterval({
              start: startOfYear(store.calendarStart),
              end: endOfYear(store.calendarStart),
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
                      isHighlighted={isSameDay(
                        props.date,
                        store.input.task.date,
                      )}
                    />
                  )}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-start mb-4 space-x-2">
            <input
              name="subject"
              className="rounded border"
              type="text"
              value={store.input.task.subject}
              onChange={onChange}
            />
            <div>
              <input
                name="expression"
                className="rounded border"
                type="text"
                value={store.input.task.expression}
                onChange={onChange}
              />
              {store.input.task.error && (
                <div className="mt-2 text-xs">{store.input.task.error}</div>
              )}
              {store.input.task.start && (
                <TaskTimeSummary
                  task={store.input.task}
                  className="mt-2 text-xs"
                />
              )}
            </div>
          </div>

          {/* <ObjectInspector data={store.input.task.output} expandLevel={10} /> */}

          <div className="divide-y">
            {store.tasks.map((t) => (
              <Task key={[t.subject, t.expression].join()} task={t} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default observer(App)
