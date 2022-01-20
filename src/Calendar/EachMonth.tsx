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
      className={classNames("flex-none w-full", {
        "grid lg:grid-cols-2 xl:grid-cols-3":
          !store.isCalendarSingleMonth,
      })}
      splitBy={{ months: 1 }}
    />
  );
}
