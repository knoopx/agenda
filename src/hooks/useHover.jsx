import { useState } from "react"

import { useOnMouseOut } from "./useOnMouseOut"
import { useOnMouseOver } from "./useOnMouseOver"

export function useHover(ref) {
  const [state, setState] = useState()

  useOnMouseOver(ref, () => {
    setState(true)
  })

  useOnMouseOut(ref, () => {
    setState(false)
  })

  return state
}
