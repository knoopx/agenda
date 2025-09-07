import { describe, it, expect } from "vitest";
import { DateTime } from "luxon";
import { now } from "./now";

describe("now", () => {
  it("returns a DateTime object", () => {
    const result = now();
    expect(result).toBeInstanceOf(DateTime);
  });

  it("returns current time in local timezone", () => {
    const result = now();
    const nowTime = DateTime.now().toLocal();

    // Should be very close to current time (within 1 second)
    const diff = Math.abs(result.toMillis() - nowTime.toMillis());
    expect(diff).toBeLessThan(1000);
  });

  it("accepts custom interval parameter", () => {
    // Test that function accepts different interval values
    expect(() => now(500)).not.toThrow();
    expect(() => now(1000)).not.toThrow();
    expect(() => now(5000)).not.toThrow();
  });

  it("returns DateTime with local timezone", () => {
    const result = now();
    // Luxon's toLocal() converts to the system's local timezone
    expect(result.zoneName).toBeDefined();
    expect(result.zoneName).not.toBeNull();
    expect(typeof result.zoneName).toBe("string");
    expect(result.zoneName!.length).toBeGreaterThan(0);
  });

  it("returns valid timestamp", () => {
    const result = now();
    const timestamp = result.toMillis();
    expect(timestamp).toBeGreaterThan(0);
    expect(typeof timestamp).toBe("number");
  });
});