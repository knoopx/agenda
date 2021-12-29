import Interval from "./Interval"

export default function EachWeek({ start, ...props }) {
  return (
    <Interval
      className="table flex-auto overflow-hidden bg-neutral-100 rounded"
      style={{ borderSpacing: "2px" }}
      start={start.startOf("month")}
      end={start.endOf("month")}
      splitBy={{ weeks: 1 }}
      {...props}
    />
  )
}
