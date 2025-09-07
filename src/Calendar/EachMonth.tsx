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
        "flex-none w-full",
        {
          "grid grid-cols-2 gap-4": !store.isCalendarSingleMonth,
        },
        props.className,
      )}
      splitBy={{ months: 1 }}
    />
  );
}
