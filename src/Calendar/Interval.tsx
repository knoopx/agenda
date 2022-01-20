import { DateTime, DurationLike, Interval } from "luxon";
import { observer } from "mobx-react-lite";
import { HTMLAttributes, useMemo } from "react";

export type IntervalBlockProps = {
  start: DateTime;
  end: DateTime;
  splitBy: DurationLike;
  children: (interval: Interval) => React.ReactNode;
} & HTMLAttributes<HTMLDivElement>;

const IntervalBlock = observer(
  ({ start, end, splitBy, children, ...props }: IntervalBlockProps) => {
    const items = useMemo(() => {
      return Interval.fromDateTimes(start, end).splitBy(splitBy);
    }, [start, end, splitBy]);

    return <div {...props}>{items.map(children)}</div>;
  }
);

export default IntervalBlock;
