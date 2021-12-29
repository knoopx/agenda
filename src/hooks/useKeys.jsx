import { useEffect } from "react"

export function useKeys(inputRef, keys, onSubmit, deps = []) {
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
