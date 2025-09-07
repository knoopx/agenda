import classNames from "classnames";
import { useStore } from "../hooks";
import Interval, { IntervalBlockProps } from "./Interval";

export default function EachMonth({
  ...props
}: Omit<IntervalBlockProps, "splitBy">) {
  const store = useStore();

  return (
    <Interval
      {...props}
      className={classNames(
        "flex-none w-full h-fit",
        {
          "grid grid-cols-2 gap-1": !store.isCalendarSingleMonth,
        },
        props.className,
      )}
      splitBy={{ months: 1 }}
    />
  );
}
