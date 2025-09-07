import classNames from "classnames";
import { observer } from "mobx-react";
import { forwardRef } from "react";
import { ITask } from "../../models/Task";

export const SubjectInput = observer(
  forwardRef<
    HTMLInputElement,
    {
      isFocused: boolean;
      task: ITask;
      isSelected?: boolean;
      onSubmit?: () => void;
    }
  >(({ isFocused, task, isSelected, onSubmit }, ref) => {
    const value = isFocused ? task.expression : task.subject;

    return (
      <input
        ref={ref}
        type="text"
        size={1}
        value={value || task.expression}
        className={classNames(
          "font-medium flex-auto bg-transparent outline-none appearance-none truncate",
          {
            "text-base-08": !task.isValid,
            "text-base-0D": isSelected,
            "line-through": task.isCompleted,
          },
        )}
        onChange={(e) => {
          task.update({ expression: e.target.value });
        }}
        onBlur={() => {
          // Call onSubmit when input loses focus
          if (isFocused && onSubmit) {
            onSubmit();
          }
        }}
      />
    );
  }),
);
