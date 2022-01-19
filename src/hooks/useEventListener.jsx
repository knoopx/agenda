import { useEffect } from "react"

export function useEventListener(ref, eventName, listener, deps = []) {
  return useEffect(() => {
    const node = ref.current
    node?.addEventListener(eventName, listener)
    return () => {
      node?.removeEventListener(eventName, listener)
    }
  }, [listener, ...deps])
}
