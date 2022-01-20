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
  ({ duration }: { duration: Duration }) => {
    if (duration.toMillis() === 0) return null;
    return (
      <Label position="right" icon={IconMdiTimerOutline}>
        {formatDuration(duration)}
      </Label>
    );
  }
);
