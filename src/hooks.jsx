import { useEffect, useState } from "react"

function useKeys(inputRef, keys, onSubmit, deps = []) {
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
  }, deps)
}
export function useEnterKey(inputRef, onSubmit, deps = []) {
  return useKeys(inputRef, ["Enter", "NumpadEnter"], onSubmit, deps)
}
export function useEscapeKey(inputRef, onSubmit) {
  return useKeys(inputRef, ["Escape"], onSubmit)
}
function useOnFocus(ref, onFocus) {
  const listener = (event) => {
    onFocus(event)
  }

  useEffect(() => {
    const node = ref.current
    node?.addEventListener("focus", listener)
    return () => {
      node?.removeEventListener("focus", listener)
    }
  })
}
export function useOnBlur(ref, onBlur) {
  const listener = (event) => {
    onBlur(event)
  }

  useEffect(() => {
    const node = ref.current
    node?.addEventListener("blur", listener)
    return () => {
      node?.removeEventListener("blur", listener)
    }
  })
}
export function useFocus(ref) {
  const [state, setState] = useState()

  useOnFocus(ref, () => {
    setState(true)
  })

  useOnBlur(ref, () => {
    setState(false)
  })

  return state
}
