import classNames from "classnames";
import { DateTime } from "luxon";
import { observer } from "mobx-react";
import { HTMLAttributes } from "react";

import { useStore } from "../hooks";

import EachMonth from "./EachMonth";
import Month from "./Month";

const Calendar = observer(({ className }: HTMLAttributes<HTMLDivElement>) => {
  const store = useStore();

  let prevYear: number | undefined;

  return (
    <div
      className={classNames("flex flex-col overflow-y-auto -m-2", className)}
    >
      <EachMonth start={store.calendarStart} end={store.calendarEnd}>
        {({ start: monthStart }) => {
          const shouldDisplayYear = monthStart.year !== prevYear;
          prevYear = monthStart.year;
          return (
            <Month
              key={monthStart.toISODate()}
              start={monthStart}
            />
          );
        }}
      </EachMonth>
    </div>
  );
});

export default Calendar;
