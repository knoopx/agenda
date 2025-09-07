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
        "flex items-center justify-center w-8 h-8 text-base-04 hover:text-base-05 hover:bg-base-02/50 dark:hover:bg-base-03/50 rounded-lg cursor-pointer",
        className,
      )}
      {...props}
    />
  );
};
