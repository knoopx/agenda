import classNames from "classnames"
import { observer } from "mobx-react"
import { DateTime } from "luxon"

import { now, toDistanceExpr } from "../../helpers"
import { useStore } from "../../hooks"

import { Label } from "./Label"

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
