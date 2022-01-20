import { RefObject, useState } from "react";

import { useEventListener } from "./useEventListener";

export function useFocus(ref: RefObject<HTMLElement>, deps = []) {
  const [state, setState] = useState<boolean>(false);

  useEventListener(
    ref,
    "focus",
    () => {
      setState(true);
    },
    deps
  );

  useEventListener(
    ref,
    "blur",
    () => {
      setState(false);
    },
    deps
  );

  return state;
}
