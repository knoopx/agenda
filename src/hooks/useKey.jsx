import { useEventListener } from "./useEventListener"

export function useKey(inputRef, keyCodes, callback, deps = []) {
  keyCodes = Array.from(keyCodes)
  const listener = (e) => {
    if (keyCodes.includes(e.keyCode) || keyCodes.includes(e.code)) {
      e.preventDefault()
      callback(e)
    }
  }
  return useEventListener(inputRef, "keydown", listener, deps)
}
