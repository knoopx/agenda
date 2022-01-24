import classNames from "classnames";
import { forwardRef, HTMLAttributes } from "react";

const Indicator = forwardRef<
  HTMLDivElement,
  { color: string; size: number | string } & HTMLAttributes<HTMLDivElement>
>(({ color, size, className, style, ...props }, ref) => {
  return (
    <div
      {...props}
      ref={ref}
      className={classNames("rounded-full", className)}
      style={{
        ...style,
        backgroundColor: color,
        width: size,
        height: size,
      }}
    />
  );
});

export default Indicator;
