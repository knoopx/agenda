import { RefObject, useEffect } from "react";

export function useEventListener<
  K extends keyof HTMLElementEventMap,
  T extends HTMLElement
>(
  ref: RefObject<T>,
  eventName: K,
  listener: (event: HTMLElementEventMap[K]) => void,
  deps : any[] = []
) {
  return useEffect(() => {
    const node = ref.current;
    node?.addEventListener(eventName, listener);
    return () => {
      node?.removeEventListener(eventName, listener);
    };
  }, [listener, ...deps]);
}
