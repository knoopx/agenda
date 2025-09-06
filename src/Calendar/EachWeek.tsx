import Interval, { IntervalBlockProps } from "./Interval";

export default function EachWeek({
  start,
  ...props
}: Omit<IntervalBlockProps, "splitBy" | "end">) {
  return (
    <Interval
      {...props}
      className="contents"
      start={start.startOf("month")}
      end={start.endOf("month").endOf("week")}
      splitBy={{ weeks: 1 }}
    />
  );
}
