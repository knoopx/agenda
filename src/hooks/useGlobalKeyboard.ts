import { useEffect } from "react";
import { useStore } from "./useStore";

export function useGlobalKeyboard() {
  const store = useStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement;

      // Check if we're in an input and handle different cases
      if (activeElement?.tagName === "INPUT") {
        const isMainInput = (activeElement as HTMLInputElement).tabIndex === 1;
        const isTaskInput = (activeElement as HTMLInputElement).tabIndex > 1;

        // For arrow keys, allow navigation if:
        // 1. We're in the main input (so user can navigate to tasks)
        // 2. We're in a task input (so user can navigate between tasks)
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          if (isMainInput || isTaskInput) {
            // Let the arrow keys work for navigation
            // But check if main input or task input is showing completions first
            if (isMainInput || isTaskInput) {
              const completionDropdown = document.querySelector(
                '[class*="absolute z-50"]',
              );
              if (completionDropdown) {
                // Completions are showing, don't interfere
                return;
              }
            }
          } else {
            // Other inputs (not main or task), don't interfere
            return;
          }
        } else {
          // For non-arrow keys, don't interfere with any input except for specific shortcuts
          // Allow Ctrl+R (sync) and Delete (delete task) to work even in inputs
          if ((e.ctrlKey && e.key === "r") || e.key === "Delete") {
            // Let these shortcuts pass through to the switch statement
          } else {
            return;
          }
        }
      }

      switch (e.key) {
        case "Escape":
          e.preventDefault();
          // Only focus main input if not editing a task
          if (!store.editingTask) {
            store.focusMainInput();
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          focusPreviousElement();
          break;
        case "ArrowDown":
          e.preventDefault();
          focusNextElement();
          break;
        case "Enter":
          // Only handle Enter if a task is selected and not editing
          if (store.selectedTaskIndex >= 0 && !store.editingTask) {
            e.preventDefault();
            store.editSelectedTask();
          }
          break;
        case " ":
          // Only handle space if a task is selected and not editing
          if (store.selectedTaskIndex >= 0 && !store.editingTask) {
            e.preventDefault();
            store.completeSelectedTask();
            completeCurrentlyFocusedTask();
          }
          break;
        case "r":
          // Ctrl+R to trigger sync
          if (e.ctrlKey) {
            e.preventDefault();
            store.syncWebDAV();
          }
          break;
        case "Delete":
          // Delete key to delete focused task
          if (
            store.selectedTaskIndex >= 0 &&
            store.selectedTaskIndex < store.filteredTasks.length &&
            !store.editingTask
          ) {
            e.preventDefault();
            const selectedTask = store.filteredTasks[store.selectedTaskIndex];
            store.removeTask(selectedTask);
          }
          break;
      }
    };

    const focusPreviousElement = () => {
      const activeElement = document.activeElement as HTMLElement;
      const allFocusable = Array.from(
        document.querySelectorAll("[tabindex]"),
      ).filter((el) => (el as HTMLElement).tabIndex >= 0) as HTMLElement[];

      const currentIndex = allFocusable.indexOf(activeElement);
      if (currentIndex > 0) {
        allFocusable[currentIndex - 1].focus();
      } else if (allFocusable.length > 0) {
        // Cycle to last element
        allFocusable[allFocusable.length - 1].focus();
      }
    };

    const focusNextElement = () => {
      const activeElement = document.activeElement as HTMLElement;
      const allFocusable = Array.from(
        document.querySelectorAll("[tabindex]"),
      ).filter((el) => (el as HTMLElement).tabIndex >= 0) as HTMLElement[];

      const currentIndex = allFocusable.indexOf(activeElement);
      if (currentIndex >= 0 && currentIndex < allFocusable.length - 1) {
        allFocusable[currentIndex + 1].focus();
      } else if (allFocusable.length > 0) {
        // Cycle to first element
        allFocusable[0].focus();
      }
    };

    const completeCurrentlyFocusedTask = () => {
      const activeElement = document.activeElement as HTMLInputElement;
      if (activeElement?.tagName === "INPUT" && activeElement.tabIndex > 1) {
        // Find the task row element and simulate clicking the checkbox
        const taskRow = activeElement.closest("tr");
        if (taskRow) {
          const checkbox = taskRow.querySelector(
            'input[type="checkbox"]',
          ) as HTMLInputElement;
          if (checkbox) {
            checkbox.click();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [store]);
}
