import { observer } from "mobx-react";
import { HTMLAttributes } from "react";

import { useStore } from "../hooks";

import EachMonth from "./EachMonth";
import Month from "./Month";

const Calendar = observer(({ className }: HTMLAttributes<HTMLDivElement>) => {
  const store = useStore();

  let prevYear: number | undefined;

  return (
    <EachMonth start={store.calendarStart} end={store.calendarEnd}>
      {(interval) => {
        const monthStart = interval.start;
        const shouldDisplayYear = monthStart?.year !== prevYear;
        prevYear = monthStart?.year;
        return monthStart ? (
          <Month
            key={monthStart.toISODate()}
            start={monthStart}
          />
        ) : null;
      }}
    </EachMonth>
  );
});

export default Calendar;
