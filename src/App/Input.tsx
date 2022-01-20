import classNames from "classnames";
import { ChangeEvent, useRef } from "react";
import { getSnapshot } from "mobx-state-tree";
import { observer } from "mobx-react-lite";

import { useStore, useEnterKey, useEscapeKey, useFocus } from "../hooks";
import { TimeLabel } from "../Agenda/Task/TimeLabel";
import { DurationLabel } from "../Agenda/Task/DurationLabel";
import { DateLabel } from "../Agenda/Task/DateLabel";

const Input = observer(() => {
  const inputRef = useRef(null);
  const { input, addTask } = useStore();

  const isFocused = useFocus(inputRef);

  useEscapeKey(inputRef, () => {
    input.setExpression("");
  });

  useEnterKey(inputRef, () => {
    const { expression } = getSnapshot(input);

    if (input.isValid) {
      addTask({ expression });

      input.setExpression("");
    }
  });

  const onChangeExpression = (e: ChangeEvent<HTMLInputElement>) => {
    input.setExpression(e.target.value);
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
          "flex flex-auto items-center px-4 py-2 space-x-2 bg-neutral-100 dark:bg-[#333] rounded",
          {
            "underline": !input.isBlank && !input.isValid,
          }
        )}
      >
        {input.isRecurring && (
          <span className="flex items-center">
            <IconMdiUpdate />
          </span>
        )}

        <input
          ref={inputRef}
          autoComplete="off"
          autoFocus
          name="expression"
          className="flex-auto font-medium placeholder:italic placeholder-neutral-400 bg-transparent outline-none"
          type="text"
          value={input.expression}
          onChange={onChangeExpression}
          placeholder="filter or add a task..."
        />

        {input.nextAt && <DateLabel className="text-xs" date={input.nextAt} />}
      </div>
    </div>
  );
});

export default Input;
