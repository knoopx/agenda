import Interval from "./Interval"

export default function EachMonth({ ...props }) {
  return (
    <Interval
      className="grid flex-none lg:grid-cols-2 xl:grid-cols-3 w-full"
      splitBy={{ months: 1 }}
      {...props}
    />
  )
}
