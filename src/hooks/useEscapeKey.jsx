import { useKeys } from "./useKeys"

export function useEscapeKey(inputRef, onSubmit) {
  return useKeys(inputRef, ["Escape"], onSubmit)
}
