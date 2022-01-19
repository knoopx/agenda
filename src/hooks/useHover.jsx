import { useState } from "react"

import { useEventListener } from "./useEventListener"

export function useHover(ref) {
  const [state, setState] = useState()

  useEventListener(ref, "mouseover", () => {
    setState(true)
  })

  useEventListener(ref, "mouseout", () => {
    setState(false)
  })

  return state
}
