import classNames from "classnames"

export function Label({ children, className, icon: Icon, position = "left" }) {
  return (
    <span
      className={classNames(
        "inline-flex items-center space-x-1 whitespace-nowrap",
        className,
      )}
    >
      {Icon && position === "left" && <Icon />}
      <span>{children}</span>
      {Icon && position !== "left" && <Icon />}
    </span>
  )
}
