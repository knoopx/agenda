import Interval, { IntervalBlockProps } from "./Interval";

export default function EachMonth({
  ...props
}: Omit<IntervalBlockProps, "splitBy">) {
  return (
    <Interval
      {...props}
      className="grid flex-none lg:grid-cols-2 xl:grid-cols-3 w-full"
      splitBy={{ months: 1 }}
    />
  );
}
