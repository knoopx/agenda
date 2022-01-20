import { RefObject } from "react";
import { useKey } from "./useKey";

export function useEnterKey(
  inputRef: RefObject<HTMLInputElement>,
  onSubmit: EventListener,
  deps: any[] = []
) {
  return useKey(inputRef, 13, onSubmit, deps);
}
