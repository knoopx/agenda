import { Interval } from "luxon"

const IntervalBlock = ({ start, end, splitBy, children, ...props }) => {
  return (
    <div {...props}>
      {Interval.fromDateTimes(start, end).splitBy(splitBy).map(children)}
    </div>
  )
}
export default IntervalBlock
