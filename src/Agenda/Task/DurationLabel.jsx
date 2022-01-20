import { observer } from "mobx-react"

import { Label } from "./Label"

export const formatDuration = (duration) => {
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
