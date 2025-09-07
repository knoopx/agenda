import { DateTime } from "luxon";
import { observer } from "mobx-react-lite";

import Day from "./Day";

const Month = observer(({ start: monthStart }: { start: DateTime }) => {
  const currentYear = DateTime.now().year;
  const shouldShowYear = monthStart.year !== currentYear;

  // Generate all days for the calendar month view
  const startOfMonth = monthStart.startOf("month");
  const endOfMonth = monthStart.endOf("month");
  const startOfCalendar = startOfMonth.startOf("week");
  const endOfCalendar = endOfMonth.endOf("week");

  const days = [];
  let current = startOfCalendar;

  while (current <= endOfCalendar) {
    days.push(current);
    current = current.plus({ days: 1 });
  }

  return (
    <div className="flex flex-col m-2 bg-base-01 dark:bg-base-01 rounded-xl p-2 h-fit">
      <div className="flex items-center justify-center mb-3 pb-2">
        <h2 className="text-center text-base-05 font-medium text-lg">
          {monthStart.monthLong}
          {shouldShowYear && (
            <span className="ml-2 text-base-04 text-sm font-normal">
              {monthStart.year}
            </span>
          )}
        </h2>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-base-04 py-1"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((dayStart) => (
          <div key={dayStart.toMillis()} className="w-full">
            <Day
              start={dayStart.startOf("day")}
              end={dayStart.endOf("day")}
              isSameMonth={dayStart.hasSame(monthStart, "month")}
            />
          </div>
        ))}
      </div>
    </div>
  );
});

export default Month;
