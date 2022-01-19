import { useState } from "react"

import { useEventListener } from "./useEventListener"

export function useFocus(ref) {
  const [state, setState] = useState()

  useEventListener(ref, "focus", () => {
    setState(true)
  })

  useEventListener(ref, "blur", () => {
    setState(false)
  })

  return state
}
