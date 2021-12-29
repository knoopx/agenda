import { useState } from "react"

import { useOnBlur } from "./useOnBlur"
import { useOnFocus } from "./useOnFocus"

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
