import { observer } from "mobx-react";
import { useStore } from "../hooks";

import EachMonth from "./EachMonth";
import Month from "./Month";

const Calendar = observer(({ className }: { className?: string }) => {
  const store = useStore();

  return (
    <div className={className}>
      <EachMonth start={store.calendarStart} end={store.calendarEnd}>
        {(interval) => {
          const monthStart = interval.start;
          return monthStart ? (
            <Month
              key={monthStart.toISODate()}
              start={monthStart}
            />
          ) : null;
        }}
      </EachMonth>
    </div>
  );
});

export default Calendar;
