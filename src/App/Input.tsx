import classNames from "classnames";
import { ChangeEvent, useRef, useEffect } from "react";
import { getSnapshot } from "mobx-state-tree";
import { observer } from "mobx-react-lite";

import { useStore, useEnterKey, useEscapeKey } from "../hooks";
import { TimeLabel } from "../Agenda/Task/TimeLabel";
import { DurationLabel } from "../Agenda/Task/DurationLabel";
import { DateLabel } from "../Agenda/Task/DateLabel";
import Indicator from "../Calendar/Indicator";

const Input = observer(() => {
  const store = useStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const { input, addTask } = useStore();

  useEffect(() => {
    store.setMainInputRef(inputRef.current);
  }, [store]);

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
          "flex flex-auto items-center px-4 py-3 space-x-3 bg-base-01/80 dark:bg-base-02/80 rounded-lg border border-base-02/50 dark:border-base-03/50 backdrop-blur-sm",
          {
            "border-base-08/50 ring-2 ring-base-08/20": !input.isBlank && !input.isValid,
          }
        )}
      >
        {input.context && (
          <Indicator
            size="0.5rem"
            color={store.getContextColor(input.context)}
          />
        )}

        {store.displayEmoji &&
          input.emojis.map((char) => <span key={char}>{char}</span>)}

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
          className="flex-auto font-medium placeholder:italic placeholder-base-04 bg-transparent outline-none"
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
