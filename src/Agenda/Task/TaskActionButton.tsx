import classNames from "classnames";
import { ButtonHTMLAttributes } from "react";

export const TaskActionButton = ({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) => {
  return (
    <button
      type="button"
      className={classNames(
        "flex items-center justify-center text-neutral-500 hover:text-black dark:hover:text-white rounded cursor-pointer",
        className
      )}
      {...props}
    />
  );
};
