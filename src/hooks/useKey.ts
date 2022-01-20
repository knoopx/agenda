import { RefObject } from "react";
import { useEventListener } from "./useEventListener";

export function useKey(
  inputRef: RefObject<HTMLElement>,
  codes: string[] | number[] | number | string,
  callback: EventListener,
  deps: any[] = []
) {
  const choices = [codes].flat();
  const listener = (e: KeyboardEvent) => {
    if (choices.includes(e.keyCode) || choices.includes(e.code)) {
      e.preventDefault();
      callback(e);
    }
  };
  return useEventListener(inputRef, "keydown", listener, deps);
}
