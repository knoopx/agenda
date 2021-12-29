import { useEffect } from "react"

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
