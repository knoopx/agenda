import {
  addDays,
  addWeeks,
  eachMonthOfInterval,
  isSameDay,
  isSameWeek,
} from "date-fns"
import { MdTimer, MdUpdate } from "react-icons/md"
import { IoMdTime, IoMdTrash } from "react-icons/io"
import { observer } from "mobx-react"
import { useEffect, useRef, useState } from "react"
import { applySnapshot, clone, getSnapshot } from "mobx-state-tree"
import classNames from "classnames"
import { groupBy } from "lodash"

import MonthCalendar from "./components/MonthCalendar"
import { useStore } from "./Store"

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

function formatDistance(endAt, now = new Date()) {
  const minutes = (endAt - now) / (60 * 1000)
  const hours = (endAt - now) / (60 * minutes)

  const prefix = (value, unit) =>
    value > 0 ? `in ${value}${unit}` : `${Math.abs(value)}${unit} ago`

  // today
  if (isSameDay(now, endAt)) {
    if (hours !== 0) {
      return prefix(hours, "h")
    }
    return prefix(minutes, "m")
  }

  // tomorrow
  if (isSameDay(addDays(now, 1), endAt)) {
    if (hours !== 0) {
      return prefix(hours, "h")
    }
    return prefix(minutes, "m")
  }

  // next week
  if (isSameWeek(addWeeks(now, 1), endAt)) {
    return "next week"
  }

  return endAt.toString()
}

function useKeys(inputRef, keys, onSubmit) {
  const listener = (event) => {
    if (keys.includes(event.code)) {
      event.preventDefault()
      onSubmit(event)
    }
  }

  return useEffect(() => {
    const node = inputRef.current
    node?.addEventListener("keydown", listener)
    return () => {
      node?.removeEventListener("keydown", listener)
    }
  })
}

function useEnterKey(inputRef, onSubmit) {
  return useKeys(inputRef, ["Enter", "NumpadEnter"], onSubmit)
}

function useEscapeKey(inputRef, onSubmit) {
  return useKeys(inputRef, ["Escape"], onSubmit)
}

function useFocus(ref) {
  const [state, setState] = useState()

  const focus = () => {
    setState(true)
  }
  const blur = () => {
    setState(false)
  }

  useEffect(() => {
    const node = ref.current
    node?.addEventListener("focus", focus)
    node?.addEventListener("blur", blur)
    return () => {
      node?.removeEventListener("focus", focus)
      node?.removeEventListener("blur", blur)
    }
  })

  return state
}

const CalendarDay = observer(({ date: d, highlight, isSameMonth }) => {
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
})

const DateLabel = observer(({ date }) => (
  <span
    className={classNames("flex items-center", {
      "text-red-500": date.getTime() - new Date().getTime() < 0,
    })}
  >
    {formatDistance(date, new Date())}
  </span>
))

const TimeLabel = observer(({ date, className }) => (
  <span className={classNames("flex items-center", className)}>
    <IoMdTime />
    &nbsp;
    {useStore().formatTime(date)}
  </span>
))

const DurationLabel = observer(({ time }) => (
  <span className="flex items-center">
    <MdTimer />
    &nbsp;
    {formatDuration(time)}
  </span>
))

const TaskTimeSummary = observer(({ task, className, children }) => (
  <div className={classNames("flex items-center space-x-4 text-xs", className)}>
    {children}
    {task.nextAt && <DateLabel date={task.nextAt} />}
    {task.freq && (
      <span className="flex items-center">
        <MdUpdate />
        &nbsp;
        {task.freq}
      </span>
    )}
  </div>
))

/*
  border-slate-500 border-gray-500 border-zinc-500 border-neutral-500 border-stone-500 border-red-500 border-orange-500 border-amber-500 border-yellow-500 border-lime-500 border-green-500 border-emerald-500 border-teal-500 border-cyan-500 border-sky-500 border-blue-500 border-indigo-500 border-violet-500 border-purple-500 border-fuchsia-500 border-pink-500 border-rose-500
*/
const EditableTaskRow = observer(({ task, inputRef, isFocused, ...props }) => {
  return (
    <div {...props} className="flex items-center space-x-4 group">
      <div className="flex items-center">
        <input
          type="checkbox"
          className="inline-block"
          checked={false}
          disabled={isFocused}
          onChange={() => task.complete()}
        />
        <div className="flex flex-col items-end justify-center w-20 text-xs">
          <TimeLabel date={task.nextAt} />
          {task.duration && <DurationLabel time={task.duration} />}
        </div>
      </div>
      <div
        className={classNames(
          "flex flex-auto items-center px-4 py-2 space-x-2 group-odd:bg-gray-50 border-l-4",
          `border-${task.highlightColor}-500`,
        )}
      >
        <input
          ref={inputRef}
          type="text"
          value={isFocused ? task.expression : task.subject}
          className="flex-auto font-medium bg-transparent"
          onChange={(e) => {
            task.update({ expression: e.target.value })
          }}
        />
        <TaskTimeSummary task={task} />
      </div>
      <div className="flex invisible group-hover:visible">
        {task.isRecurring && (
          <button
            type="button"
            className="flex items-center justify-center h-10 w-10 text-gray-500 hover:bg-gray-50 rounded cursor-pointer"
            onClick={() => task.reset()}
          >
            <MdUpdate />
          </button>
        )}

        <button
          type="button"
          className="flex items-center justify-center h-10 w-10 text-gray-500 hover:bg-gray-50 rounded cursor-pointer"
          onClick={() => task.remove()}
        >
          <IoMdTrash />
        </button>
      </div>
    </div>
  )
})

const Task = observer(({ task, ...props }) => {
  const inputRef = useRef(null)
  const isFocused = useFocus(inputRef)
  const target = isFocused ? clone(task) : task

  useEnterKey(inputRef, () => {
    applySnapshot(task, target)
    inputRef.current?.blur()
  })

  useEscapeKey(inputRef, () => {
    inputRef.current?.blur()
  })

  return (
    <EditableTaskRow
      isFocused={isFocused}
      inputRef={inputRef}
      task={target}
      {...props}
    />
  )
})

const App = observer(() => {
  const store = useStore()
  const inputRef = useRef()

  const onChange = (e) => {
    const props = { [e.target.name]: e.target.value }
    store.input.task.update(props)
  }

  useEnterKey(inputRef, () => {
    const { task } = store.input

    if (task.isValid) {
      if (!task.isRecurring && task.dtstart) {
        const expression = [
          task.subject,
          store.formatDate(task.dtstart),
          "at",
          store.formatTime(task.dtstart),
        ].join(" ")

        task.update({
          expression,
        })
      }

      store.addTask(getSnapshot(task))

      store.input.task.update({ expression: "" })
    }
  })

  const doHighlight = (date) => {
    if (store.input.occurrences.some((o) => isSameDay(o, date)))
      return "outline-auto"

    const tasks = store.tasks.filter((t) =>
      t
        .occurrences(store.input.calendardtstart, store.input.calendarEnd)
        .some((o) => isSameDay(o, date)),
    )

    // bg-slate-500 bg-gray-500 bg-zinc-500 bg-neutral-500 bg-stone-500 bg-red-500 bg-orange-500 bg-amber-500 bg-yellow-500 bg-lime-500 bg-green-500 bg-emerald-500 bg-teal-500 bg-cyan-500 bg-sky-500 bg-blue-500 bg-indigo-500 bg-violet-500 bg-purple-500 bg-fuchsia-500 bg-pink-500 bg-rose-500
    if (tasks.length > 0) return `text-white bg-${tasks[0].highlightColor}-500`

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
        <div>
          {groups[group].map((t) => (
            <Task key={[t.subject, t.expression].join()} task={t} />
          ))}
        </div>
      </div>
    ))
  }

  let prevYear

  return (
    <div className="container mx-auto py-8 font-sans-serif">
      <div className="grid grid-cols-2 mb-8">
        <div>
          <input
            value={store.locale}
            onChange={(e) => store.setLocale(e.target.value)}
          />
        </div>
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
      </div>

      <div className="grid grid-cols-2">
        <div className="max-w-fit">
          <div className="grid flex-none grid-cols-3">
            {eachMonthOfInterval({
              dtstart: store.input.calendardtstart,
              end: store.input.calendarEnd,
            }).map((monthDate) => {
              const year = store.formatYear(monthDate)
              const component = (
                <div
                  key={monthDate.toISOString()}
                  className="flex flex-col m-2"
                >
                  <div className="flex items-center justify-between space-x-2">
                    <span>{store.formatMonth(monthDate)}</span>
                    {year !== prevYear && (
                      <span className="text-gray-500 text-xs">{year}</span>
                    )}
                  </div>
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
              )
              prevYear = year
              return component
            })}
          </div>
        </div>
        <div>{renderTasks()}</div>
      </div>
    </div>
  )
})

export default App
