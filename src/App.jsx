import { eachMonthOfInterval, intervalToDuration, isSameDay } from "date-fns"
import { MdTimer, MdUpdate, MdCalendarToday } from "react-icons/md"
import { IoMdTime } from "react-icons/io"
import { observer } from "mobx-react"
import { useEffect } from "react"
import { getSnapshot } from "mobx-state-tree"
import classNames from "classnames"

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
          "font-light": !isToday,
          "opacity-25": !isSameMonth,
          "text-white font-bold": highlightClass,
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

function formatDate(date) {
  const duration = intervalToDuration({ start: new Date(), end: date })
  delete duration.seconds
  return Object.keys(duration)
    .reduce(
      (acc, key) => [
        ...acc,
        ...(duration[key] > 0 ? [`${duration[key]}${key[0]}`] : []),
      ],
      [],
    )
    .join(" ")
}

const DateLabel = ({ date }) => (
  <span className="flex items-center space-x-2">
    <MdCalendarToday />
    {formatDate(date)}
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
  <div className={classNames("flex items-center space-x-4", className)}>
    {task.duration && <TimeLabel time={task.duration} />}
    {task.nextAt && <DateLabel date={task.nextAt} />}

    {task.freq && (
      <>
        <span className="flex items-center">
          <MdUpdate />
          {task.freq}
        </span>
      </>
    )}
    {children}
  </div>
)

const Task = ({ task }) => {
  return (
    <div className="flex items-center space-x-2 odd:bg-gray-50">
      <input type="checkbox" className="inline-block" />
      <span className="flex-auto">{task.subject}</span>
      <TaskTimeSummary task={task} />
    </div>
  )
}

function App() {
  const store = useStore()

  const onChange = (e) => {
    const props = { [e.target.name]: e.target.value }
    store.input.task.update(props)
  }

  useEffect(() => {
    const onSubmit = () => {
      const { task } = store.input

      if (!task.repeat && task.output.start) {
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

  const doHighlight = (date) => {
    if (isSameDay(date, store.input.task.nextAt)) return "bg-red-500"

    if (store.input.occurrences.some((o) => isSameDay(o, date)))
      return "bg-green-500"

    return null
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
              autoComplete="off"
              name="expression"
              className="w-full rounded border"
              type="text"
              value={store.input.task.expression}
              onChange={onChange}
            />
            {store.input.task.error && (
              <div className="mt-2 text-xs">{store.input.task.error}</div>
            )}
            <TaskTimeSummary task={store.input.task} className="mt-2 text-xs">
              <span className="flex-auto">{store.input.task.subject}</span>
            </TaskTimeSummary>
          </div>

          <div className="divide-y">
            {store.sortedTasks.map((t) => (
              <Task key={[t.subject, t.expression].join()} task={t} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default observer(App)
