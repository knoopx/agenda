import { useEffect } from "react"

export function useOnMouseOut(ref, onMouseOut) {
  const listener = (event) => {
    onMouseOut(event)
  }

  useEffect(() => {
    const node = ref.current
    node?.addEventListener("mouseout", listener)
    return () => {
      node?.removeEventListener("mouseout", listener)
    }
  })
}
