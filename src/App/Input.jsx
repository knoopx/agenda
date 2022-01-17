import classNames from "classnames"
import { useRef } from "react"
import { getSnapshot } from "mobx-state-tree"
import { observer } from "mobx-react-lite"

import { useStore, useEnterKey, useEscapeKey, useFocus } from "../hooks"
import { TimeLabel, DurationLabel, DateLabel } from "../Agenda/Label"

const Input = observer(() => {
  const inputRef = useRef(null)
  const { input, addTask } = useStore()

  const isFocused = useFocus(inputRef)

  useEscapeKey(inputRef, () => {
    input.setExpression("")
  })

  useEnterKey(inputRef, () => {
    const { expression } = getSnapshot(input)

    if (input.isValid) {
      addTask({ expression })

      input.setExpression("")
    }
  })

  const onChangeExpression = (e) => {
    input.setExpression(e.target.value)
  }

  return (
    <div>
      <div
        className={classNames(
          "flex items-center px-4 py-2 space-x-2 bg-neutral-100 rounded",
          {
            "outline outline-red-500": !input.isBlank && !input.isValid,
          },
        )}
      >
        {(input.nextAt || input.duration) && (
          <div className="flex flex-col items-end justify-center text-xs">
            {input.nextAt && <TimeLabel date={input.nextAt} />}
            {input.duration && <DurationLabel duration={input.duration} />}
          </div>
        )}

        {input.isRecurring && (
          <span className="flex items-center">
            <IconMdiUpdate />
          </span>
        )}

        <input
          ref={inputRef}
          autoComplete="off"
          autoFocus
          name="expression"
          className="flex-auto font-medium placeholder:italic placeholder-neutral-400 bg-transparent outline-none"
          type="text"
          value={input.expression}
          onChange={onChangeExpression}
          placeholder="add a task..."
        />

        {input.nextAt && <DateLabel className="text-xs" date={input.nextAt} />}
      </div>
      {input.expression && input.error && isFocused && (
        <div className="absolute -ml-[1px] px-2 py-1 text-white text-xs bg-red-500 rounded rounded-b shadow">
          {input.error}
        </div>
      )}
    </div>
  )
})

export default Input
