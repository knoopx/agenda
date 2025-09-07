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
    occurrences.map((occurrence) => occurrence.task.context),
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
        store.input.implicitEndAt,
      ).contains(start));

  return (
    <HoverCard.Root openDelay={0} closeDelay={0}>
      <HoverCard.Trigger
        ref={ref}
        className={classNames(
          "aspect-square flex flex-col justify-between text-xs p-2 leading-none rounded-lg min-h-[3rem]",
          {
            // "font-medium text-base-05": !isToday && isSameMonth,
            // "text-base-0D": !isSameMonth,
            "bg-base-01 dark:bg-base-01": isSameMonth && !isToday,
            "bg-base-03 dark:bg-base-03":
              isSameMonth && shouldHighlight && !isToday,
            "bg-base-03 dark:bg-base-03 font-bold ring-3 ring-base-0D": isToday,
          },
        )}
      >
         {(isSameMonth || isToday) && (
           <div className="flex flex-col h-full justify-between">
             <div className="text-left font-medium">{start.day}</div>
             <div className="flex flex-wrap gap-1 mt-1">
               {contexts.slice(0, 6).map((context, index) => (
                 <Indicator
                   key={`${context}-${index}`}
                   color={store.getContextColor(context)}
                   size={indicatorSize}
                   className={classNames(indicatorClassName, "shadow-sm")}
                 />
               ))}
               {contexts.length > 6 && (
                 <div className="text-xs text-base-04 ml-1">
                   +{contexts.length - 6}
                 </div>
               )}
             </div>
           </div>
         )}
         {!isSameMonth && !isToday && (
           <div className="text-center opacity-30">{start.day}</div>
         )}
      </HoverCard.Trigger>

      {isSameMonth && occurrences.length > 0 && (
        <HoverCard.Content
          side="top"
          className="max-w-xs px-4 py-3 text-xs bg-base-01 dark:bg-base-01 border border-base-04 rounded-md shadow-lg"
        >
          <HoverCard.Arrow className="fill-base-04 dark:fill-base-04" />
          <div className="space-y-2">
            <h4 className="font-medium text-base-05 mb-2">
              {occurrences.length} task{occurrences.length > 1 ? "s" : ""} on{" "}
              {start.toLocaleString({ month: "short", day: "numeric" })}
            </h4>
            <div className="space-y-1">
              {occurrences.slice(0, 5).map(({ date, task }) => (
                <div
                  key={task.id}
                  className="flex items-center py-1 px-2 space-x-2 rounded bg-base-02 dark:bg-base-02"
                >
                  <Indicator
                    color={store.getContextColor(task.context)}
                    size="0.375rem"
                    className="flex-shrink-0"
                  />
                  <div className="font-medium text-base-05 flex-1 truncate">
                    {task.subject}
                  </div>
                  <TimeLabel className="text-base-04" date={date} />
                </div>
              ))}
              {occurrences.length > 5 && (
                <div className="text-center text-base-04 py-1">
                  +{occurrences.length - 5} more task
                  {occurrences.length - 5 > 1 ? "s" : ""}
                </div>
              )}
            </div>
          </div>
        </HoverCard.Content>
      )}
    </HoverCard.Root>
  );
});

export default Day;
