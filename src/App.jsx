import { MdUpdate } from "react-icons/md"
import { observer } from "mobx-react"
import { useRef } from "react"
import { getSnapshot } from "mobx-state-tree"
import classNames from "classnames"
import { DateTime } from "luxon"

import { useStore } from "./store"
import { useEnterKey } from "./hooks"
import { Agenda } from "./Agenda"
import { TimeLabel, DurationLabel, DateLabel } from "./Label"
import Calendar from "./Calendar"

const App = observer(() => {
  const store = useStore()
  const inputRef = useRef()

  const onChange = (e) => {
    store.input.setExpression(e.target.value)
  }

  useEnterKey(inputRef, () => {
    let { expression } = getSnapshot(store.input)

    if (store.input.isValid) {
      if (!store.input.isRecurring && store.input.dtstart) {
        expression = [
          expression.subject,
          expression.dtstart.toLocaleString(),
          "at",
          expression.dtstart.toLocaleString(DateTime.TIME_SIMPLE),
        ].join(" ")
      }

      store.addTask({ expression })

      store.input.setExpression("")
    }
  })

  return (
    <div className="container mx-auto py-8 font-sans-serif">
      <div className="grid grid-cols-2 gap-16 mb-8">
        <div className="flex flex-col justify-between">
          <div className="space-x-4">
            <select
              value={store.locale}
              onChange={(e) => store.setLocale(e.target.value)}
              className="font-medium bg-transparent"
            >
              <option value="en-US">en-US</option>
              <option value="es-ES">es-ES</option>
            </select>

            <select
              value={store.timeZone}
              onChange={(e) => store.setTimeZone(e.target.value)}
              className="font-medium bg-transparent"
            >
              <option value="UTC">UTC</option>
              <option value="Europe/Madrid">Europe/Madrid</option>
            </select>
          </div>
          <h1 className="font-bold text-xl">
            {DateTime.now().toLocaleString(DateTime.DATE_FULL)}
          </h1>
        </div>
        <div className="space-y-2">
          <input
            ref={inputRef}
            autoComplete="off"
            autoFocus
            name="expression"
            className={classNames(
              "w-full bg-gray-100 outline-none py-2 rounded b px-2",
              {
                "outline-red-500": !store.input.isValid,
              },
            )}
            type="text"
            value={store.input.expression}
            onChange={onChange}
          />
          {!store.input.isValid && (
            <div className="mt-2 text-red-500 text-xs">{store.input.error}</div>
          )}
          {store.input.isValid && (
            <div className="flex space-x-2 text-xs">
              {store.input.nextAt && <TimeLabel date={store.input.nextAt} />}
              {store.input.duration && (
                <DurationLabel time={store.input.duration} />
              )}

              <span className="flex flex-auto space-x-2">
                <span className="font-bold">{store.input.subject}</span>
                {store.input.freq && (
                  <span className="flex items-center">
                    <MdUpdate />
                    &nbsp;
                    {store.input.freq}
                  </span>
                )}
              </span>

              {store.input.nextAt && <DateLabel date={store.input.nextAt} />}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-16">
        <div>
          <Calendar />
        </div>
        <div>
          <Agenda />
        </div>
      </div>
    </div>
  )
})

export default App
