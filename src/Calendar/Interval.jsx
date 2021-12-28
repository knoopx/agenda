import { Interval } from "luxon"
import { observer } from "mobx-react"

const IntervalBlock = observer(
  ({ start, end, splitBy, children, ...props }) => (
    <div {...props} key={[start, end]}>
      {Interval.fromDateTimes(start, end).splitBy(splitBy).map(children)}
    </div>
  ),
)

export default IntervalBlock
