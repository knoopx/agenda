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
  }: {
    date: DateTime;
  } & HTMLAttributes<HTMLSpanElement>) => {
    const isDue = date.toMillis() - DateTime.now().toMillis() < 0;

    return (
      <Label
        className={classNames(
          className,
          {
            "text-base-08": isDue,
          },
          "group-focus-within:text-base-0D",
        )}
      >
        {toDistanceExpr(now(5 * 1000), date)}
      </Label>
    );
  },
);
