import Interval from "./Interval"

export default function EachMonth({ ...props }) {
  return (
    <Interval
      className="grid flex-none grid-cols-3"
      splitBy={{ months: 1 }}
      {...props}
    />
  )
}
