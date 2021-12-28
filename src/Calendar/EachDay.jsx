import Interval from "./Interval"

export default function EachDay({ start, ...props }) {
  return (
    <Interval
      className="table-row"
      start={start.startOf("week")}
      end={start.endOf("week")}
      splitBy={{ days: 1 }}
      {...props}
    />
  )
}
