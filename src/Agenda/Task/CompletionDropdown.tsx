import classNames from "classnames";
import { observer } from "mobx-react";
import { useEffect, useRef } from "react";

export interface CompletionItem {
  value: string;
  type: "@" | "#";
}

interface CompletionDropdownProps {
  items: CompletionItem[];
  selectedIndex: number;
  onSelect: (item: CompletionItem) => void;
  onClose: () => void;
  position: { top: number; left: number };
  visible: boolean;
}

export const CompletionDropdown = observer(
  ({
    items,
    selectedIndex,
    onSelect,
    onClose,
    position,
    visible,
  }: CompletionDropdownProps) => {
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!visible) return;

      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          onClose();
        }
      };

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onClose();
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }, [visible, onClose]);

    if (!visible || items.length === 0) return null;

    return (
      <>
        <div
          className="absolute z-50 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-base-04 dark:border-b-base-04"
          style={{
            top: position.top - 4,
            left: position.left + 10,
          }}
        />
        <div
          ref={dropdownRef}
          className="absolute z-50 bg-base-01 dark:bg-base-01 border border-base-04 rounded-md shadow-lg max-h-48 overflow-y-auto"
          style={{
            top: position.top,
            left: position.left,
            minWidth: "120px",
          }}
        >
          {items.map((item, index) => (
            <div
              key={`${item.type}${item.value}`}
              role="listitem"
              className={classNames("px-3 py-2 cursor-pointer text-sm", {
                "bg-base-03 dark:bg-base-03 text-base-05 font-bold":
                  index === selectedIndex,
              })}
              onClick={() => onSelect(item)}
            >
              <span className={"text-base-04 font-medium mr-0.5"}>
                {item.type}
              </span>
              {item.value}
            </div>
          ))}
        </div>
      </>
    );
  },
);
