import { RefObject } from "react";
import { useEventListener } from "./useEventListener";

export function useKey(
  inputRef: RefObject<HTMLElement | null>,
  codes: string[] | number[] | number | string,
  callback: EventListener,
  deps: unknown[] = []
) {
  const choices = [codes].flat();
  const listener = (e: KeyboardEvent) => {
    if (choices.includes(e.code) || choices.includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
      callback(e);
    }
  };
  return useEventListener(inputRef, "keydown", listener, deps);
}
