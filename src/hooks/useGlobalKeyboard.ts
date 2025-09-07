import { useEffect } from "react";
import { useStore } from "./useStore";

export function useGlobalKeyboard() {
  const store = useStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" &&
        document.activeElement === store.mainInputRef
      ) {
        return;
      }

      switch (e.key) {
        case "Escape":
          e.preventDefault();
          // If editing a task, let the task's escape handler exit edit mode
          // Otherwise, let the browser handle focus naturally
          if (!store.editingTask) {
            store.focusMainInput();
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          store.navigateUp();
          break;
        case "ArrowDown":
          e.preventDefault();
          store.navigateDown();
          break;
        case "Enter":
          if (store.selectedTaskIndex >= 0 && !store.editingTask) {
            e.preventDefault();
            store.editSelectedTask();
          }
          break;
        case " ":
          if (store.selectedTaskIndex >= 0) {
            e.preventDefault();
            store.completeSelectedTask();
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [store]);
}
