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

      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, [visible, onClose]);

    if (!visible || items.length === 0) return null;

    return (
      <div
        ref={dropdownRef}
        className="absolute z-50 bg-base-02 border border-base-05 dark:border-base-04 rounded-md shadow-lg max-h-48 overflow-y-auto"
        style={{
          top: position.top,
          left: position.left,
          minWidth: "120px",
        }}
      >
        {items.map((item, index) => (
          <div
            key={`${item.type}${item.value}`}
            className={classNames(
              "px-3 py-2 cursor-pointer text-sm hover:bg-base-03",
              {
                "bg-base-04": index === selectedIndex,
              },
            )}
            onClick={() => onSelect(item)}
          >
            <span className="text-base-0B">{item.type}</span>
            {item.value}
          </div>
        ))}
      </div>
    );
  },
);
