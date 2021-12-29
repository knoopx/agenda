import classNames from "classnames"
import { useRef } from "react"
import { getSnapshot } from "mobx-state-tree"
import { DateTime } from "luxon"
import { observer } from "mobx-react-lite"

import { useStore } from "../Store"
import { useEnterKey, useEscapeKey } from "../hooks"

import { Output } from "./Output"

const Input = observer(() => {
  const store = useStore()

  const onChange = (e) => {
    store.input.setExpression(e.target.value)
  }

  const inputRef = useRef()

  useEscapeKey(inputRef, () => {
    store.input.setExpression("")
  })

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

      {store.input.isValid && <Output input={store.input} />}
    </div>
  )
})

export default Input
