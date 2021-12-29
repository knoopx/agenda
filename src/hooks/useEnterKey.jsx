import { useKeys } from "./useKeys"

export function useEnterKey(inputRef, onSubmit, deps = []) {
  return useKeys(inputRef, ["Enter", "NumpadEnter"], onSubmit, deps)
}
