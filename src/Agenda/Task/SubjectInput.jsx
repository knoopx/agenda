import classNames from "classnames"
import { observer } from "mobx-react"
import { forwardRef } from "react"

export const SubjectInput = observer(
  forwardRef(({ isFocused, task }, ref) => {
    const value = isFocused ? task.expression : task.subject

    return (
      <input
        ref={ref}
        type="text"
        size="1"
        value={value || task.expression}
        className={classNames(
          "font-medium flex-auto bg-transparent outline-none appearance-none",
          {
            "text-red-500": !task.isValid,
          },
        )}
        onChange={(e) => {
          task.update({ expression: e.target.value })
        }}
      />
    )
  }),
)
