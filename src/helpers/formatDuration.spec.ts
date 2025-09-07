import { describe, it, expect } from "vitest";
import { Duration } from "luxon";
import { formatDuration } from "./formatDuration";

describe("formatDuration", () => {
  it("formats duration with single unit", () => {
    const duration = Duration.fromObject({ hours: 2 });
    expect(formatDuration(duration)).toBe("2h");
  });

  it("formats duration with multiple units", () => {
    const duration = Duration.fromObject({ hours: 1, minutes: 30 });
    expect(formatDuration(duration)).toBe("1h 30m");
  });

  it("formats complex duration", () => {
    const duration = Duration.fromObject({
      days: 1,
      hours: 2,
      minutes: 30,
      seconds: 45,
    });
    expect(formatDuration(duration)).toBe("1d 2h");
  });

  it("handles zero values", () => {
    const duration = Duration.fromObject({ hours: 0, minutes: 5, seconds: 0 });
    expect(formatDuration(duration)).toBe("5m");
  });

  it("rounds seconds with floating point precision", () => {
    // Create a duration that would result in floating point seconds
    const duration = Duration.fromMillis(22 * 60 * 60 * 1000 + 30 * 60 * 1000 + 26.103 * 1000);
    expect(formatDuration(duration)).toBe("22h 30m");
  });

  it("returns '0s' for zero duration", () => {
    const duration = Duration.fromObject({ hours: 0, minutes: 0, seconds: 0 });
    expect(formatDuration(duration)).toBe("0s");
  });

  it("returns '0s' for empty duration", () => {
    const duration = Duration.fromObject({});
    expect(formatDuration(duration)).toBe("0s");
  });


});