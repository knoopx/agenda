import classNames from "classnames";
import { ButtonHTMLAttributes } from "react";

export const TaskActionButton = ({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) => {
  return (
    <button
      type="button"
      tabIndex={-1}
      className={classNames(
        "flex items-center justify-center w-8 h-8 text-base-04 hover:text-base-05 hover:bg-base-02 dark:hover:bg-base-03 rounded-lg cursor-pointer",
        className,
      )}
      {...props}
    />
  );
};
