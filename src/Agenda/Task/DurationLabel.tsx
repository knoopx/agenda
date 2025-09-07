import classNames from "classnames";
import { Duration, DurationObjectUnits } from "luxon";
import { observer } from "mobx-react";

import { Label } from "./Label";
import IconMdiTimerOutline from "~icons/mdi/timer-outline.jsx";

export const formatDuration = (duration: Duration): string => {
  const obj = duration.shiftTo('years', 'months', 'weeks', 'days', 'hours', 'minutes', 'seconds').toObject();
  return Object.keys(obj)
    .map((key) => {
      const value = obj[key as keyof DurationObjectUnits];
      const unit = key[0];
      return `${value}${unit}`;
    })
    .join(" ");
};

export const DurationLabel = observer(
  ({ duration, className }: { duration: Duration; className?: string }) => {
    if (duration.toMillis() === 0) return null;
    return (
      <Label
        position="right"
        icon={IconMdiTimerOutline}
        className={classNames(className, "group-focus-within:text-base-0D")}
      >
        {formatDuration(duration)}
      </Label>
    );
  },
);
