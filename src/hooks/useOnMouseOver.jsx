import { useEffect } from "react"

export function useOnMouseOver(ref, onHover) {
  const listener = (event) => {
    onHover(event)
  }

  useEffect(() => {
    const node = ref.current
    node?.addEventListener("mouseover", listener)
    return () => {
      node?.removeEventListener("mouseover", listener)
    }
  })
}
