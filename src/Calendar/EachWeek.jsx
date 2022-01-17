import Interval from "./Interval"

export default function EachWeek({ start, ...props }) {
  return (
    <Interval
      className="table flex-auto overflow-hidden rounded-[4px]"
      style={{
        borderSpacing: "4px",
        aspectRatio: "1",
      }}
      start={start.startOf("month")}
      end={start.endOf("month")}
      splitBy={{ weeks: 1 }}
      {...props}
    />
  )
}
