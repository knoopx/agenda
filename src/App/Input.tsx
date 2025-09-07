import classNames from "classnames";
import { ChangeEvent, useRef, useEffect, useState } from "react";
import { getSnapshot } from "mobx-state-tree";
import { observer } from "mobx-react-lite";

import { useStore, useEnterKey, useEscapeKey } from "../hooks";
import IconMdiUpdate from "~icons/mdi/update.jsx";
import { TimeLabel } from "../Agenda/Task/TimeLabel";
import { DurationLabel } from "../Agenda/Task/DurationLabel";
import { DateLabel } from "../Agenda/Task/DateLabel";
import Indicator from "../Calendar/Indicator";
import { CompletionDropdown } from "../Agenda/Task";
import type { CompletionItem } from "../Agenda/Task";

const Input = observer(() => {
  const store = useStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const { input, addTask } = useStore();

  const [showCompletions, setShowCompletions] = useState(false);
  const [completionItems, setCompletionItems] = useState<CompletionItem[]>([]);
  const [selectedCompletionIndex, setSelectedCompletionIndex] = useState(0);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [currentTrigger, setCurrentTrigger] = useState<"@" | "#" | null>(null);
  const [triggerPosition, setTriggerPosition] = useState(0);

  useEffect(() => {
    store.setMainInputRef(inputRef.current);
  }, [store]);

  useEscapeKey(inputRef, () => {
    if (!showCompletions) {
      input.setExpression("");
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
    setShowCompletions(false);
  });

  useEnterKey(inputRef, () => {
    if (input.isValid && !showCompletions) {
      input.finalizeExpression();
      const { expression } = getSnapshot(input);
      addTask({ expression });

      input.setExpression("");
      setShowCompletions(false);
      if (inputRef.current) {
        inputRef.current.focus();
      }
      return true; // Event was handled
    }
    return false; // Event was not handled
  });

  const getCompletions = (
    trigger: "@" | "#",
    query: string,
  ): CompletionItem[] => {
    const items = trigger === "@" ? store.contexts : store.tags;
    return items
      .filter((item) => item.toLowerCase().startsWith(query.toLowerCase()))
      .map((item) => ({ value: item, type: trigger }));
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
    const currentValue = input.expression;
    const beforeTrigger = currentValue.substring(0, triggerPosition);

    // Find the end of the current word (next space or end of text)
    const textFromTrigger = currentValue.substring(triggerPosition + 1);
    const spaceIndex = textFromTrigger.indexOf(" ");
    const query =
      spaceIndex >= 0
        ? textFromTrigger.substring(0, spaceIndex)
        : textFromTrigger;
    const afterQuery =
      spaceIndex >= 0 ? textFromTrigger.substring(spaceIndex) : "";

    const newValue = `${beforeTrigger}${item.type}${item.value} ${afterQuery}`;
    input.setExpression(newValue);

    setShowCompletions(false);

    // Focus back to input and set cursor position
    if (inputRef.current) {
      inputRef.current.focus();
      const newCursorPos =
        triggerPosition + item.type.length + item.value.length + 1;
      inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
    }
  };

  const onChangeExpression = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    input.setExpression(newValue);

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
          setCompletionItems(completions);
          setSelectedCompletionIndex(0);
          setCurrentTrigger(trigger);
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

    setShowCompletions(false);
  };

  return (
    <div className="flex">
      <div className="md:flex justify-end w-16 hidden mr-4">
        {input.nextAt || input.duration ? (
          <div className="flex flex-col items-end justify-center text-xs">
            {input.nextAt && <TimeLabel date={input.nextAt} />}
            {input.duration && <DurationLabel duration={input.duration} />}
          </div>
        ) : null}
      </div>

        <div
          className={classNames(
            "flex flex-auto items-center px-4 py-3 space-x-3 bg-base-01 dark:bg-base-02 rounded-lg backdrop-blur-sm focus-within:ring-2 focus-within:ring-base-0D",
            {
              "border-base-08 ring-2 ring-base-08":
                !input.isBlank && !input.isValid,
            },
          )}
        >
        {input.context && (
          <Indicator
            size="0.5rem"
            color={store.getContextColor(input.context)}
          />
        )}

        {store.displayEmoji &&
          input.emojis.map((char, index) => (
            <span key={`${char}-${index}`}>{char}</span>
          ))}

        {input.isRecurring && (
          <span className="flex items-center">
            <IconMdiUpdate className="w-4 h-4" />
          </span>
        )}

        <input
          ref={inputRef}
          autoComplete="off"
          autoFocus
          tabIndex={1}
          name="expression"
          className="flex-auto font-medium placeholder:italic placeholder-base-04 bg-transparent outline-none"
          type="text"
          value={input.expression}
          onChange={onChangeExpression}
          onKeyDown={(e) => {
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
                  if (completionItems[selectedCompletionIndex]) {
                    handleCompletionSelect(
                      completionItems[selectedCompletionIndex],
                    );
                  }
                  break;
                case "Escape":
                  e.preventDefault();
                  e.stopPropagation();
                  setShowCompletions(false);
                  return; // Prevent further handling (do not reset input)
              }
              return; // Early return when completions are showing
            }
          }}
          onBlur={() => {
            // Delay hiding completions to allow for clicks
            setTimeout(() => setShowCompletions(false), 150);
          }}
          placeholder="filter or add a task..."
        />

        {input.nextAt && <DateLabel className="text-xs" date={input.nextAt} />}
      </div>

      <CompletionDropdown
        items={completionItems}
        selectedIndex={selectedCompletionIndex}
        onSelect={handleCompletionSelect}
        onClose={() => setShowCompletions(false)}
        position={dropdownPosition}
        visible={showCompletions}
      />
    </div>
  );
});

export default Input;
