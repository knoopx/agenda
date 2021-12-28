import Interval from "./Interval"

export default function EachWeek({ start, ...props }) {
  return (
    <Interval
      className="table flex-auto border-collapse"
      start={start.startOf("month")}
      end={start.endOf("month")}
      splitBy={{ weeks: 1 }}
      {...props}
    />
  )
}
