import { types } from "mobx-state-tree"
import { DateTime } from "luxon"

const DateTimeType = types.custom<string, DateTime>({
  name: "DateTime",

  isTargetType(value) {
    return !!(value instanceof DateTime || (value && typeof value === 'object' && 'ts' in value && 'zone' in value))
  },
  getValidationMessage(value: unknown) : string {
    if (value instanceof DateTime) {
      return value.isValid ? "" : "Invalid DateTime"
    }
    // Check if it's a DateTime-like object
    if (value && typeof value === 'object' && 'ts' in value && 'zone' in value) {
      return "" // Accept DateTime-like objects
    }
    if (typeof value === 'string') {
      return "" // Accept all strings, let fromSnapshot handle validation
    }
    if (typeof value === 'number') {
      return "" // Accept all numbers, let fromSnapshot handle validation
    }
    return "Expected DateTime, string, or number"
  },
  fromSnapshot(value: string | number) {
    if (typeof value === 'string') {
      const dt = DateTime.fromISO(value)
      if (dt.isValid) return dt
      // Try with setZone option
      const dtWithZone = DateTime.fromISO(value, { setZone: true })
      if (dtWithZone.isValid) return dtWithZone
      throw new Error(`Invalid DateTime string: ${value}`)
    } else {
      return DateTime.fromMillis(value)
    }
  },

  toSnapshot(value: DateTime) {
    return value.toISO()!
  },
})


export default DateTimeType