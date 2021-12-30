import classNames from "classnames"
import { MdTimer } from "react-icons/md"
import { IoMdCalendar, IoMdTime } from "react-icons/io"
import { observer } from "mobx-react"

import { now, formatDistance } from "../helpers"
import { useStore } from "../hooks"

const Label = ({ children, className, icon: Icon, position = "left" }) => {
  return (
    <span className={classNames("flex items-center space-x-1", className)}>
      {Icon && position === "left" && <Icon />}
      <span>{children}</span>
      {Icon && position !== "left" && <Icon />}
    </span>
  )
}

export const DistanceLabel = observer(({ className, date }) => {
  const { timeZone } = useStore()
  return (
    <Label
      className={classNames(className, {
        "text-red-500": date - now(5 * 1000) < 0,
      })}
    >
      {formatDistance(now(5 * 1000), date, timeZone)}
    </Label>
  )
})

export const TimeLabel = observer(({ date, className }) => {
  const { locale } = useStore()
  return (
    <Label position="right" icon={IoMdTime} className={className}>
      {date.toLocaleString({ timeStyle: "short" }, { locale })}
    </Label>
  )
})
export const DateLabel = observer(({ date, className }) => {
  return (
    <Label icon={IoMdCalendar} className={className}>
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
    <Label position="right" icon={MdTimer}>
      {formatDuration(duration)}
    </Label>
  )
})

export default Label
