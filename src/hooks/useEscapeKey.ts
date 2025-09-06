import { RefObject } from "react";
import { useKey } from "./useKey";

export function useEscapeKey(
  inputRef: RefObject<HTMLInputElement | null>,
  onSubmit: EventListener,
  deps = []
) {
  return useKey(inputRef, "Escape", onSubmit, deps);
}
