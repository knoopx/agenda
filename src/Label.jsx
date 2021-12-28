import { MdTimer } from "react-icons/md"
import { IoMdCalendar, IoMdTime } from "react-icons/io"
import { observer } from "mobx-react"
import classNames from "classnames"
import { DateTime } from "luxon"

import { useStore } from "./store"
import {
  formatDistance,
  formatTime,
  formatDate,
  formatDuration,
} from "./helpers"

const { now } = DateTime

export default function Label({ className, icon: Icon, children }) {
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
  const { locale, timeZone } = useStore()

  return (
    <Label icon={IoMdTime} className={className}>
      {formatTime(date, locale, timeZone)}
    </Label>
  )
})
export const DateLabel = observer(({ date, className }) => {
  const { locale, timeZone } = useStore()

  return (
    <Label icon={IoMdCalendar} className={className}>
      {formatDate(date, locale, timeZone)}
    </Label>
  )
})

export const DurationLabel = observer(({ time }) => {
  return <Label icon={MdTimer}>{formatDuration(time)}</Label>
})
