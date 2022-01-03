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
        value={value || task.expression}
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
    )
  }),
)
