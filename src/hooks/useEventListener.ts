import { RefObject, useEffect } from "react";

export function useEventListener<
  K extends keyof HTMLElementEventMap,
  T extends HTMLElement
>(
  ref: RefObject<T | null>,
  eventName: K,
  listener: (event: HTMLElementEventMap[K]) => void,
  deps : any[] = []
) {
  return useEffect(() => {
    const node = ref.current;
    if (node) {
      node.addEventListener(eventName, listener);
      return () => {
        node.removeEventListener(eventName, listener);
      };
    }
  }, [ref.current, listener, ...deps]);
}
