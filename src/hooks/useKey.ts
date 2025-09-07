import { RefObject } from "react";
import { useEventListener } from "./useEventListener";

export function useKey(
  inputRef: RefObject<HTMLElement | null>,
  codes: string[] | number[] | number | string,
  callback: (e: KeyboardEvent) => boolean | void,
  deps: unknown[] = [],
) {
  const choices = [codes].flat();
  const listener = (e: KeyboardEvent) => {
    if (choices.includes(e.code) || choices.includes(e.key)) {
      // Only prevent default and stop propagation if the callback actually does something
      const result = callback(e);
      if (result !== false) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  };
  return useEventListener(inputRef, "keydown", listener, deps);
}
