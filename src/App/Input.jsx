import classNames from "classnames"
import { forwardRef, useRef } from "react"
import { getSnapshot } from "mobx-state-tree"
import { DateTime } from "luxon"
import { observer } from "mobx-react-lite"
import { MdUpdate } from "react-icons/md"
import { useFloating, shift, arrow, offset } from "@floating-ui/react-dom"
import { createPortal } from "react-dom"

import { useStore, useEnterKey, useEscapeKey, useFocus } from "../hooks"
import { TimeLabel, DurationLabel, DateLabel } from "../Agenda/Label"

const Arrow = forwardRef(({ placement, left, top }, ref) => {
  return (
    <div
      ref={ref}
      className={classNames("absolute border-[6px] border-transparent", {
        "border-t-neutral-200 -bottom-[12px]": placement === "top",
        "border-b-neutral-200 -top-[12px]": placement === "bottom",
        "border-l-neutral-200 -right-[12px]": placement === "left",
        "border-r-neutral-200 -left-[12px]": placement === "right",
      })}
      style={{
        ...(left && { left }),
        ...(top && { top }),
      }}
    />
  )
})

const Input = observer(() => {
  const inputRef = useRef(null)
  const arrowRef = useRef(null)
  const { input, addTask } = useStore()

  const isFocused = useFocus(inputRef)

  const {
    x,
    y,
    reference,
    floating,
    strategy,
    placement,
    middlewareData: { arrow: { x: arrowX, y: arrowY } = {} },
  } = useFloating({
    placement: "bottom",
    middleware: [offset(5), shift(), arrow({ element: arrowRef })],
  })

  useEscapeKey(inputRef, () => {
    input.setExpression("")
  })

  useEnterKey(inputRef, () => {
    let { expression } = getSnapshot(input)

    if (input.isValid) {
      if (!input.isRecurring && input.start) {
        expression = [
          expression.subject,
          expression.start.toLocaleString(),
          "at",
          expression.start.toLocaleString(DateTime.TIME_SIMPLE),
        ].join(" ")
      }

      addTask({ expression })

      input.setExpression("")
    }
  })

  const onChangeExpression = (e) => {
    input.setExpression(e.target.value)
  }

  return (
    <div
      ref={reference}
      className={classNames(
        "flex relative items-center px-4 py-2 space-x-2 bg-purple-600 rounded",
        {
          // "border border-red-500": !input.isValid,
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
          <MdUpdate />
        </span>
      )}

      <input
        ref={inputRef}
        autoComplete="off"
        autoFocus
        name="expression"
        className="flex-auto font-medium bg-transparent outline-none"
        type="text"
        value={input.expression}
        onChange={onChangeExpression}
      />

      {input.expression && input.error &&
        isFocused &&
        createPortal(
          <div
            ref={floating}
            className="px-4 py-2 text-red-500 text-xs bg-white rounded border shadow"
            style={{
              position: strategy,
              ...(y && { top: y }),
              ...(x && { left: x }),
            }}
          >
            {input.error}
            <Arrow
              ref={arrowRef}
              placement={placement}
              left={arrowX}
              top={arrowY}
            >
              <Arrow
                ref={arrowRef}
                placement={placement}
                left={arrowX}
                top={arrowY}
              />
            </Arrow>
          </div>,
          document.getElementById("root"),
        )}

      {input.nextAt && <DateLabel className="text-xs" date={input.nextAt} />}
    </div>
  )
})

export default Input
