import { types } from "mobx-state-tree";
import { DateTime } from "luxon";

const DateTimeType = types.custom<string, DateTime>({
  name: "DateTime",

  isTargetType(value) {
    return value instanceof DateTime;
  },
  getValidationMessage(value: unknown): string {
    if (value instanceof DateTime) {
      return value.isValid ? "" : "Invalid DateTime";
    }
    // Check if it's a DateTime-like object
    if (
      value &&
      typeof value === "object" &&
      "ts" in value &&
      "zone" in value
    ) {
      return ""; // Accept DateTime-like objects
    }
    if (typeof value === "string") {
      return ""; // Accept all strings, let fromSnapshot handle validation
    }
    if (typeof value === "number") {
      return ""; // Accept all numbers, let fromSnapshot handle validation
    }
    return "Expected DateTime, DateTime-like object, string, or number";
  },
  fromSnapshot(value: string | number | { ts: number; zone: string }) {
    if (typeof value === "string") {
      const dt = DateTime.fromISO(value);
      if (dt.isValid) return dt;
      // Try with setZone option
      const dtWithZone = DateTime.fromISO(value, { setZone: true });
      if (dtWithZone.isValid) return dtWithZone;
      throw new Error(`Invalid DateTime string: ${value}`);
    } else if (typeof value === "number") {
      return DateTime.fromMillis(value);
    } else {
      // Handle DateTime-like objects
      return DateTime.fromMillis(value.ts, { zone: value.zone });
    }
  },

  toSnapshot(value: DateTime) {
    return value.toISO()!;
  },
});

export default DateTimeType;
