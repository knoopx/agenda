import { DateTime } from "luxon"
import { observer } from "mobx-react"

import { Label } from "./Label"

export const DateLabel = observer(({ date, className } : { date: DateTime, className: string}) => {
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
