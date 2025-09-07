import { describe, it, expect } from "vitest";
import { Frequency } from "./types";

describe("Frequency", () => {
  describe("fromUnit", () => {
    it("returns MINUTELY for minute", () => {
      expect(Frequency.fromUnit("minute")).toBe(Frequency.MINUTELY);
    });

    it("returns HOURLY for hour", () => {
      expect(Frequency.fromUnit("hour")).toBe(Frequency.HOURLY);
    });

    it("returns DAILY for day", () => {
      expect(Frequency.fromUnit("day")).toBe(Frequency.DAILY);
    });

    it("returns WEEKLY for week", () => {
      expect(Frequency.fromUnit("week")).toBe(Frequency.WEEKLY);
    });

    it("returns MONTHLY for month", () => {
      expect(Frequency.fromUnit("month")).toBe(Frequency.MONTHLY);
    });

    it("returns YEARLY for year", () => {
      expect(Frequency.fromUnit("year")).toBe(Frequency.YEARLY);
    });

    it("returns undefined for unsupported unit", () => {
      expect(Frequency.fromUnit("second")).toBeUndefined();
      expect(Frequency.fromUnit("millisecond")).toBeUndefined();
      expect(Frequency.fromUnit("quarter")).toBeUndefined();
    });
  });
});
