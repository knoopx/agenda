import { DateTime } from "luxon";
import { observer } from "mobx-react-lite";

import Day from "./Day";
import EachDay from "./EachDay";
import EachWeek from "./EachWeek";

const Month = observer(({ start: monthStart }: { start: DateTime }) => {
  return (
    <div className="flex flex-col m-2">
      <span className="mb-1 text-center text-neutral-500 text-sm">
        {monthStart.monthLong}
      </span>
      <EachWeek start={monthStart}>
        {({ start: weekStart }) => (
          <EachDay key={weekStart.toMillis()} start={weekStart}>
            {({ start: dayStart }) => (
              <Day
                key={dayStart.toMillis()}
                start={dayStart.startOf("day")}
                end={dayStart.endOf("day")}
                isSameMonth={dayStart.hasSame(monthStart, "month")}
              />
            )}
          </EachDay>
        )}
      </EachWeek>
    </div>
  );
});

export default Month;
