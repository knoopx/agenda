import classNames from "classnames";
import { Duration } from "luxon";
import { observer } from "mobx-react";

import { Label } from "./Label";
import { formatDuration } from "../../helpers";
import IconMdiTimerOutline from "~icons/mdi/timer-outline.jsx";

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
