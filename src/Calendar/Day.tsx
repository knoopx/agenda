import classNames from "classnames";
import { observer } from "mobx-react";
import { useRef } from "react";
import _ from "lodash";

import * as HoverCard from "@radix-ui/react-hover-card";
import { useStore } from "../hooks";
import { now } from "../helpers";
import { TimeLabel } from "../Agenda/Task/TimeLabel";

import Indicator from "./Indicator";
import { DateTime } from "luxon";
import { IntervalBlockProps } from "./Interval";

type DayProps = {
  start: DateTime;
  isSameMonth: boolean;
} & Omit<IntervalBlockProps, "splitBy" | "children">;

const Day = observer(({ start, isSameMonth }: DayProps) => {
  const ref = useRef<HTMLAnchorElement>(null);
  const store = useStore();

  const contexts = store.getContextsAtDay(start);
  const occurrences = _.sortBy(store.getOccurrencesAtDay(start), "date");
  const isToday = now(5000).hasSame(start, "day");

  const shouldHighlight = store.input.occurrencesAtDay(start) > 0;

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
            // "opacity-60": !isSameMonth || start < now(5000),
            "border border-black dark:border-neutral-400": isSameMonth && shouldHighlight,
          }
        )}
      >
        {isSameMonth && (
          <div className="flex flex-col items-between space-y-1">
            <h6>{start.day}</h6>
            <div className="flex flex-auto flex-wrap">
              {contexts.map((context) => (
                <Indicator
                  key={context}
                  color={store.getContextColor(context)}
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
                <div className="flex justify-end w-12">
                  <TimeLabel date={date} />
                </div>
                <Indicator color={store.getContextColor(task.context)} />
                <div className="font-medium">{task.subject}</div>
              </div>
            ))}
          </div>
        </HoverCard.Content>
      )}
    </HoverCard.Root>
  );
});

export default Day;
