import classNames from "classnames";
import { observer } from "mobx-react";
import { DateTime } from "luxon";

import { now, toDistanceExpr } from "../../helpers";

import { Label } from "./Label";
import { HTMLAttributes } from "react";

export const DistanceLabel = observer(
  ({
    className,
    date,
    isSelected,
  }: { date: DateTime; isSelected?: boolean } & HTMLAttributes<HTMLSpanElement>) => {
    const isDue = date.toMillis() - DateTime.now().toMillis() < 0;

    return (
      <Label
        className={classNames(className, {
          "text-base-08": isDue && !isSelected,
          "text-base-0D": isSelected,
        })}
      >
        {toDistanceExpr(now(5 * 1000), date)}
      </Label>
    );
  }
);
