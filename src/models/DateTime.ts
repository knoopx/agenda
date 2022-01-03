import { types } from "mobx-state-tree"
import { DateTime } from "luxon"

const DateTimeType = types.custom<number, DateTime>({
  name: "DateTime",

  isTargetType(value) {
    return value instanceof DateTime
  },
  getValidationMessage(value: number) : string {
    const date = DateTime.fromMillis(value)
    if (date.isValid) return ""
    return date.invalidExplanation!
  },
  fromSnapshot(value: number) {
    return DateTime.fromMillis(value)
  },
  toSnapshot(value: DateTime) {
    return value.toMillis()
  },
})


export default DateTimeType