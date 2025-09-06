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
    }
  >(({ isFocused, task }, ref) => {
    const value = isFocused ? task.expression : task.subject;

    return (
      <input
        ref={ref}
        type="text"
        size={1}
        value={value || task.expression}
        className={classNames(
          "font-medium flex-auto bg-transparent outline-none appearance-none",
          {
            "text-base-08": !task.isValid,
          }
        )}
        onChange={(e) => {
          task.update({ expression: e.target.value });
        }}
      />
    );
  })
);
