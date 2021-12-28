import { Interval } from "luxon"
import { observer } from "mobx-react-lite"
import { useMemo } from "react"

const IntervalBlock = observer(
  ({ start, end, splitBy, children, ...props }) => {
    const items = useMemo(() => {
      return Interval.fromDateTimes(start, end).splitBy(splitBy)
    }, [start, end, splitBy])

    return <div {...props}>{items.map(children)}</div>
  },
)

export default IntervalBlock
