import { RefObject, useState } from "react";

import { useEventListener } from "./useEventListener";

export function useHover(ref: RefObject<HTMLElement>, deps = []) {
  const [state, setState] = useState<boolean>(false);

  useEventListener(
    ref,
    "mouseover",
    () => {
      setState(true);
    },
    deps,
  );

  useEventListener(
    ref,
    "mouseout",
    () => {
      setState(false);
    },
    deps,
  );

  return state;
}
