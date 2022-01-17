import classNames from "classnames"

export function TaskActionButton({ className, ...props }) {
  return (
    <button
      type="button"
      className={classNames(
        "flex items-center justify-center text-neutral-500 hover:text-black rounded cursor-pointer",
        className,
      )}
      {...props}
    />
  )
}
