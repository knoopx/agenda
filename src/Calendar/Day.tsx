import classNames from "classnames";
import { observer } from "mobx-react";
import { useRef } from "react";
import _ from "lodash";

import * as HoverCard from "@radix-ui/react-hover-card";
import { useStore } from "../hooks";
import { now } from "../helpers";
import { TimeLabel } from "../Agenda/Task/TimeLabel";

import Indicator from "./Indicator";
import { DateTime, Interval } from "luxon";
import { IntervalBlockProps } from "./Interval";

type DayProps = {
  start: DateTime;
  isSameMonth: boolean;
} & Omit<IntervalBlockProps, "splitBy" | "children">;

const Day = observer(({ start, isSameMonth }: DayProps) => {
  const ref = useRef<HTMLAnchorElement>(null);
  const store = useStore();

  const occurrences = store.getOccurrencesAtDay(start);
  const contexts = _.uniq(
    occurrences.map((occurrence) => occurrence.task.context)
  );
  const contextColors = _.uniq(
    contexts.map((context) => store.getContextColor(context))
  );

  const isToday = now(5000).hasSame(start, "day");

  const indicatorSize = store.isCalendarSingleMonth ? "0.5rem" : "0.25rem";
  const indicatorClassName = store.isCalendarSingleMonth
    ? "m-[.1rem]"
    : "m-[.05rem]";

  const shouldHighlight =
    store.input.occurrencesAtDay(start) > 0 ||
    (store.input.implicitEndAt &&
      Interval.fromDateTimes(
        store.input.implicitStart,
        store.input.implicitEndAt
      ).contains(start));

  return (
    <HoverCard.Root openDelay={0} closeDelay={0}>
      <HoverCard.Trigger
        ref={ref}
        className={classNames(
          "table-cell text-right text-xs p-1 leading-none rounded-[2px] w-[calc(100%/7)] h-[calc(100%/5)]",
          {
            "font-bold": isToday,
            "font-light": !shouldHighlight && !isToday,
            "bg-neutral-50 dark:bg-[#292929]": isSameMonth,
            "bg-[#eee] dark:bg-[#313131]": isSameMonth && shouldHighlight,
          }
        )}
      >
        {isSameMonth && (
          <div className="flex flex-col items-between space-y-1">
            <h6>{start.day}</h6>
            <div className="flex flex-auto flex-wrap">
              {contextColors.map((color) => (
                <Indicator
                  key={color}
                  color={color}
                  size={indicatorSize}
                  className={indicatorClassName}
                />
              ))}
            </div>
          </div>
        )}
      </HoverCard.Trigger>

      {isSameMonth && occurrences.length > 0 && (
        <HoverCard.Content
          side="top"
          className="table px-4 py-2 text-xs bg-white rounded border border-neutral-300 shadow"
        >
          <HoverCard.Arrow className="fill-neutral-300" />
          <div className="divide-y">
            {occurrences.map(({ date, task }) => (
              <div key={task.id} className="flex items-center py-1 space-x-2">
                <Indicator
                  color={store.getContextColor(task.context)}
                  size={indicatorSize}
                  className={indicatorClassName}
                />
                <div className="font-medium">{task.subject}</div>
                <TimeLabel date={date} />
              </div>
            ))}
          </div>
        </HoverCard.Content>
      )}
    </HoverCard.Root>
  );
});

export default Day;
