import classNames from "classnames";
import { observer } from "mobx-react";
import { forwardRef, useState, useEffect, useRef } from "react";
import { ITask } from "../../models/Task";
import { CompletionDropdown } from "./CompletionDropdown";
import type { CompletionItem } from "./CompletionDropdown";
import { useStore } from "../../hooks";

export const SubjectInput = observer(
  forwardRef<
    HTMLInputElement,
    {
      isFocused: boolean;
      task: ITask;
      onSubmit?: () => void;
      onCancel?: () => void;
      tabIndex?: number;
    }
  >(({ isFocused, task, onSubmit, onCancel, tabIndex }, ref) => {
    const store = useStore();
    const [showCompletions, setShowCompletions] = useState(false);
    const [completionItems, setCompletionItems] = useState<CompletionItem[]>(
      [],
    );
    const [selectedCompletionIndex, setSelectedCompletionIndex] = useState(0);
    const [dropdownPosition, setDropdownPosition] = useState({
      top: 0,
      left: 0,
    });

    const [triggerPosition, setTriggerPosition] = useState(0);

    const inputRef = useRef<HTMLInputElement>(null);
    const [localExpression, setLocalExpression] = useState(task.expression);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isMountedRef = useRef(true);

    const value = isFocused ? localExpression : task.subjectWithoutUrls;

    // Forward ref to inputRef
    useEffect(() => {
      if (ref) {
        if (typeof ref === "function") {
          ref(inputRef.current);
        } else {
          ref.current = inputRef.current;
        }
      }
    }, [ref]);

    // Sync local expression when task changes
    useEffect(() => {
      setLocalExpression(task.expression);
    }, [task.expression]);

    // Cleanup timeouts on unmount
    useEffect(() => {
      return () => {
        isMountedRef.current = false;
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);

    const getCompletions = (
      trigger: "@" | "#",
      query: string,
    ): CompletionItem[] => {
      const items = trigger === "@" ? store.contexts : store.tags;
      return items
        .filter((item) => item.toLowerCase().startsWith(query.toLowerCase()))
        .map((item) => ({ value: item, type: trigger }));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setLocalExpression(newValue);
      // Sync to MobX model immediately for live updates
      task.update({ expression: newValue });

      // Check for completion triggers
      const cursorPosition = e.target.selectionStart || 0;
      const textBeforeCursor = newValue.substring(0, cursorPosition);

      // Find the last @ or # before cursor
      const lastAtIndex = textBeforeCursor.lastIndexOf("@");
      const lastHashIndex = textBeforeCursor.lastIndexOf("#");

      let trigger: "@" | "#" | null = null;
      let triggerIndex = -1;

      if (lastAtIndex > lastHashIndex) {
        trigger = "@";
        triggerIndex = lastAtIndex;
      } else if (lastHashIndex > lastAtIndex) {
        trigger = "#";
        triggerIndex = lastHashIndex;
      }

      if (trigger && triggerIndex >= 0) {
        // Find the end of the current word (next space or end of text)
        const textFromTrigger = textBeforeCursor.substring(triggerIndex + 1);
        const spaceIndex = textFromTrigger.indexOf(" ");
        const query =
          spaceIndex >= 0
            ? textFromTrigger.substring(0, spaceIndex)
            : textFromTrigger;

        // Only show completions if there's no space immediately after the trigger
        const charAfterTrigger = newValue[triggerIndex + 1];
        if (charAfterTrigger !== " ") {
          const completions = getCompletions(trigger, query);
          if (completions.length > 0) {
            const queryStart = triggerIndex + 1;

            // More lenient cursor position check for test environments
            if (
              cursorPosition >= queryStart ||
              cursorPosition === newValue.length
            ) {
              setCompletionItems(completions);
              // Select the first completion that exactly matches the query, or default to 0
              const exactMatchIndex = completions.findIndex(
                (item) => item.value.toLowerCase() === query.toLowerCase(),
              );
              setSelectedCompletionIndex(
                exactMatchIndex >= 0 ? exactMatchIndex : 0,
              );

              setTriggerPosition(triggerIndex);

              setShowCompletions(true);

              // Calculate dropdown position
              if (inputRef.current) {
                const rect = inputRef.current.getBoundingClientRect();
                const textMetrics = getTextWidth(
                  textBeforeCursor,
                  inputRef.current,
                );
                setDropdownPosition({
                  top: rect.bottom + 2,
                  left: rect.left + textMetrics,
                });
              }
              return;
            }
          }
        }
      }

      // Only hide completions if we're not in the middle of typing a completion
      // Check if the current text still contains a valid completion pattern
      const hasActiveCompletion = (() => {
        const atIndex = newValue.lastIndexOf("@");
        const hashIndex = newValue.lastIndexOf("#");
        const lastTriggerIndex = Math.max(atIndex, hashIndex);

        if (lastTriggerIndex >= 0) {
          const triggerChar = newValue[lastTriggerIndex];
          const textAfterTrigger = newValue.substring(lastTriggerIndex + 1);
          const spaceIndex = textAfterTrigger.indexOf(" ");

          // If there's no space after the trigger, we might still be completing
          if (spaceIndex === -1 || spaceIndex > 0) {
            const query =
              spaceIndex >= 0
                ? textAfterTrigger.substring(0, spaceIndex)
                : textAfterTrigger;
            if (query.length > 0) {
              const completions = getCompletions(
                triggerChar as "@" | "#",
                query,
              );
              return completions.length > 0;
            }
          }
        }
        return false;
      })();

      if (!hasActiveCompletion) {
        setShowCompletions(false);
      }
    };

    const getTextWidth = (text: string, element: HTMLElement): number => {
      // For testing environments where canvas is not available
      try {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (context) {
          const computedStyle = window.getComputedStyle(element);
          context.font = `${computedStyle.fontSize} ${computedStyle.fontFamily}`;
          return context.measureText(text).width;
        }
      } catch (e) {
        // Canvas not available in test environment
        return text.length * 8; // Rough approximation for testing
      }
      return text.length * 8; // Fallback for any other case
    };

    const handleCompletionSelect = (item: CompletionItem) => {
      const currentValue = localExpression;
      // Find the trigger and query
      let beforeTrigger = currentValue.substring(0, triggerPosition);

      // If the character before the trigger is a space, remove it (completion "eats" the space)
      if (triggerPosition > 0 && currentValue[triggerPosition - 1] === " ") {
        beforeTrigger = beforeTrigger.slice(0, -1); // Remove trailing space
      }
      // Always ensure a space before the trigger (unless at start)
      if (
        beforeTrigger.length > 0 &&
        beforeTrigger[beforeTrigger.length - 1] !== " "
      ) {
        beforeTrigger = beforeTrigger.replace(/([^ ])$/, "$1 ");
      }

      const textFromTrigger = currentValue.substring(triggerPosition + 1);
      const spaceIndex = textFromTrigger.indexOf(" ");
      const afterQuery =
        spaceIndex >= 0 ? textFromTrigger.substring(spaceIndex) : "";

      // Construct new value: before trigger + trigger + completion value + space + after query
      const newValue = `${beforeTrigger}${item.type}${item.value} ${afterQuery}`;
      setLocalExpression(newValue);
      task.update({ expression: newValue });
      setShowCompletions(false);

      // Focus back to input and set cursor position
      if (inputRef.current) {
        inputRef.current.focus();
        const newCursorPos =
          beforeTrigger.length + item.type.length + item.value.length + 1; // +1 for space
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          if (isMountedRef.current && inputRef.current) {
            inputRef.current.setSelectionRange(newCursorPos, newCursorPos);

          }
        }, 0);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (showCompletions) {
        switch (e.key) {
          case "ArrowDown":
            e.preventDefault();
            setSelectedCompletionIndex((prev) =>
              prev < completionItems.length - 1 ? prev + 1 : 0,
            );
            break;
          case "ArrowUp":
            e.preventDefault();
            setSelectedCompletionIndex((prev) =>
              prev > 0 ? prev - 1 : completionItems.length - 1,
            );
            break;
          case "Enter":
          case "Tab":
            e.preventDefault();
            e.stopPropagation();
            if (completionItems[selectedCompletionIndex]) {
              handleCompletionSelect(completionItems[selectedCompletionIndex]);
            }
            return; // Early return to prevent further handling
          case "Escape":
            e.preventDefault();
            e.stopPropagation();
            setShowCompletions(false);
            return; // Prevent further handling (do not exit editing)
          default:
            // Allow other keys to propagate when completions are showing
            break;
        }
        return; // Early return when completions are showing
      }

      // Handle Enter for editing
      if (e.key === "Enter" && isFocused && onSubmit) {
        onSubmit();
        // Blur the input to exit edit mode
        inputRef.current?.blur();
      }
      // Don't handle Escape here - let Task component handle it
    };

    return (
      <>
        <input
          ref={inputRef}
          type="text"
          size={1}
          tabIndex={tabIndex}
          value={value || (isFocused ? task.expression : "")}
          className={classNames(
            "task-input font-medium flex-auto bg-transparent outline-none appearance-none truncate focus:text-base-0D",
            {
              "text-base-08": !task.isValid,
              "line-through": task.isCompleted,
            },
          )}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            // Delay hiding completions to allow for clicks
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(() => {
              if (isMountedRef.current) {
                setShowCompletions(false);
              }
            }, 150);
            // Call onSubmit when input loses focus, but defer it to avoid conflicts
            if (isFocused && onSubmit) {
              // Defer onSubmit to avoid conflicts with completion selection
              setTimeout(() => {
                if (isMountedRef.current && onSubmit) {
                  onSubmit();
                }
              }, 200); // Longer delay to allow completion selection
            }
          }}
        />
        <CompletionDropdown
          items={completionItems}
          selectedIndex={selectedCompletionIndex}
          onSelect={handleCompletionSelect}
          onClose={() => setShowCompletions(false)}
          position={dropdownPosition}
          visible={showCompletions}
        />
      </>
    );
  }),
);
