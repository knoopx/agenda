import classNames from "classnames";
import { Duration, DurationObjectUnits } from "luxon";
import { observer } from "mobx-react";

import { Label } from "./Label";

export const formatDuration = (duration: Duration): string => {
  const obj = duration.normalize().toObject();
  return Object.keys(obj)
    .map((key) => {
      return `${obj[key as keyof DurationObjectUnits]}${key[0]}`;
    })
    .join(" ");
};

export const DurationLabel = observer(
  ({ duration, isSelected, className }: { duration: Duration; isSelected?: boolean; className?: string }) => {
    if (duration.toMillis() === 0) return null;
    return (
      <Label
        position="right"
        icon={IconMdiTimerOutline}
        className={classNames(className, {
          "text-base-0D": isSelected,
        })}
      >
        {formatDuration(duration)}
      </Label>
    );
  }
);
