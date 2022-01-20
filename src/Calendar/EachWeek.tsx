import Interval, { IntervalBlockProps } from "./Interval";

export default function EachWeek({
  start,
  ...props
}: Omit<IntervalBlockProps, "splitBy" | "end">) {
  return (
    <Interval
      {...props}
      className="table flex-auto overflow-hidden rounded-[4px]"
      style={{
        borderSpacing: "4px",
        aspectRatio: "1",
      }}
      start={start.startOf("month")}
      end={start.endOf("month")}
      splitBy={{ weeks: 1 }}
    />
  );
}
