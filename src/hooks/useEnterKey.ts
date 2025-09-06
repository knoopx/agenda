import { RefObject } from "react";
import { useKey } from "./useKey";

export function useEnterKey(
  inputRef: RefObject<HTMLInputElement | null>,
  onSubmit: EventListener,
  deps: any[] = []
) {
  return useKey(inputRef, 'Enter', onSubmit, deps);
}
