import classNames from "classnames"
import { observer } from "mobx-react"
import { DateTime } from "luxon"

import { now, toDistanceExpr } from "../helpers"
import { useStore } from "../hooks"

function Label({ children, className, icon: Icon, position = "left" }) {
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

export const DistanceLabel = observer(({ className, date }) => {
  const { timeZone } = useStore() // todo: needed?
  const isDue = date - DateTime.now() < 0
  return (
    <Label
      className={classNames(className, {
        "text-red-500": isDue,
      })}
    >
      {toDistanceExpr(now(5 * 1000), date, timeZone)}
    </Label>
  )
})

export const TimeLabel = observer(({ date, className }) => {
  const { locale } = useStore()
  return (
    <Label position="right" icon={IconMdiClockOutline} className={className}>
      {date.toLocaleString({ timeStyle: "short" }, { locale })}
    </Label>
  )
})
export const DateLabel = observer(({ date, className }) => {
  return (
    <Label icon={IconMdiCalendarBlank} className={className}>
      {date.toLocaleString({
        weekday: "short",
        month: "short",
        day: "numeric",
      })}
    </Label>
  )
})

const formatDuration = (duration) => {
  const obj = duration.normalize().toObject()
  return Object.keys(obj)
    .map((key) => `${obj[key]}${key[0]}`)
    .join(" ")
}

export const DurationLabel = observer(({ duration }) => {
  return (
    <Label position="right" icon={IconMdiTimerOutline}>
      {formatDuration(duration)}
    </Label>
  )
})

export default Label
