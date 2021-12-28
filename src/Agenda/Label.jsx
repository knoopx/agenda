import { MdTimer } from "react-icons/md"
import { IoMdCalendar, IoMdTime } from "react-icons/io"
import { observer } from "mobx-react"
import classNames from "classnames"
import { DateTime } from "luxon"

import { useStore } from "../Store"
import { formatDistance, formatDuration } from "../helpers"

const { now } = DateTime

const Label = ({ className, icon: Icon, children }) => {
  return (
    <span className={classNames("flex items-center space-x-2", className)}>
      {Icon && <Icon />}
      <span>{children}</span>
    </span>
  )
}

export const DistanceLabel = observer(({ date }) => {
  const { timeZone } = useStore()
  return (
    <Label
      className={classNames({
        "text-red-500": date - now() < 0,
      })}
    >
      {formatDistance(date, now(), timeZone)}
    </Label>
  )
})

export const TimeLabel = observer(({ date, className }) => {
  return (
    <Label icon={IoMdTime} className={className}>
      {date.toLocaleString({ timeStyle: "short" })}
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

export const DurationLabel = observer(({ time }) => {
  return <Label icon={MdTimer}>{formatDuration(time)}</Label>
})

export default Label
