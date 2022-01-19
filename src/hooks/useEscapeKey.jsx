import { useKey } from "./useKey"

export function useEscapeKey(inputRef, onSubmit) {
  return useKey(inputRef, "Escape", onSubmit)
}
