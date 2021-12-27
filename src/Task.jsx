import { observer } from "mobx-react"
import { useRef } from "react"
import { applySnapshot, clone } from "mobx-state-tree"

import { useFocus, useEnterKey, useOnBlur, useEscapeKey } from "./hooks"
import { EditableTaskRow } from "./EditableTaskRow"

export const Task = observer(({ task, ...props }) => {
  const inputRef = useRef(null)
  const isFocused = useFocus(inputRef)
  const target = isFocused ? clone(task) : task

  const onSubmit = () => {
    if (target.isValid) {
      applySnapshot(task, target)
      inputRef.current?.blur()
    }
  }

  useEnterKey(inputRef, onSubmit, [target])
  useOnBlur(onSubmit)
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
