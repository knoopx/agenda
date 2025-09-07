import { RefObject } from "react";
import { useKey } from "./useKey";

export function useEscapeKey(
  inputRef: RefObject<HTMLInputElement | null>,
  onSubmit: EventListener,
  deps = [],
) {
  const deferredOnSubmit = (e: KeyboardEvent) => {
    // Defer the callback to avoid setState during render
    setTimeout(() => onSubmit(e), 0);
  };
  return useKey(inputRef, "Escape", deferredOnSubmit, deps);
}
