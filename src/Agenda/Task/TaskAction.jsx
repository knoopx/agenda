import classNames from "classnames"

export function TaskAction({ className, ...props }) {
  return (
    <button
      type="button"
      className={classNames(
        "w-6 h-6 flex items-center justify-center text-neutral-500 hover:text-black rounded cursor-pointer",
        className,
      )}
      {...props}
    />
  )
}
