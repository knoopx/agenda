import { useEffect } from "react"

export function useOnFocus(ref, onFocus) {
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
