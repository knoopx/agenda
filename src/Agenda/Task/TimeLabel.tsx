import classNames from "classnames";
import { DateTime } from "luxon";
import { observer } from "mobx-react";
import { HTMLAttributes } from "react";

import { useStore } from "../../hooks";

import { Label } from "./Label";
import IconMdiClockOutline from "~icons/mdi/clock-outline.jsx";

export const TimeLabel = observer(
  ({
    date,
    className,
  }: {
    date: DateTime;
  } & HTMLAttributes<HTMLSpanElement>) => {
    const { locale } = useStore();

    if (date.hour === 0 && date.minute === 0) return null;

    return (
      <Label
        position="right"
        icon={IconMdiClockOutline}
        className={classNames(className, "group-focus-within:text-base-0D")}
      >
        {date.toLocaleString({ timeStyle: "short" }, { locale })}
      </Label>
    );
  },
);
