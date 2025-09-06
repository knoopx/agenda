import classNames from "classnames";
import { DateTime } from "luxon";
import { observer } from "mobx-react";
import { HTMLAttributes } from "react";

import { useStore } from "../../hooks";

import { Label } from "./Label";

export const TimeLabel = observer(
  ({
    date,
    className,
    isSelected,
  }: { date: DateTime; isSelected?: boolean } & HTMLAttributes<HTMLSpanElement>) => {
    const { locale } = useStore();

    if (date.hour === 0 && date.minute === 0) return null;

    return (
      <Label
        position="right"
        icon={IconMdiClockOutline}
        className={classNames(className, {
          "text-base-0D": isSelected,
        })}
      >
        {date.toLocaleString({ timeStyle: "short" }, { locale })}
      </Label>
    );
  }
);
