import { useKey } from "./useKey"

export function useEnterKey(inputRef, onSubmit, deps = []) {
  return useKey(inputRef, 13, onSubmit, deps)
}
