import { describe, it, expect } from "vitest";
import { emojiFromKeyword } from "./emojiFromKeyword";

describe("emojiFromKeyword", () => {
  it("returns custom emoji for work-related keywords", () => {
    expect(emojiFromKeyword("work")).toBe("💼");
    expect(emojiFromKeyword("office")).toBe("🏢");
    expect(emojiFromKeyword("meeting")).toBe("📅");
  });

  it("returns custom emoji for personal-related keywords", () => {
    expect(emojiFromKeyword("home")).toBe("🏠");
    expect(emojiFromKeyword("family")).toBe("👨‍👩‍👧‍👦");
    expect(emojiFromKeyword("vacation")).toBe("🌴");
  });

  it("returns custom emoji for daily life keywords", () => {
    expect(emojiFromKeyword("shopping")).toBe("🛒");
    expect(emojiFromKeyword("cooking")).toBe("🍳");
    expect(emojiFromKeyword("exercise")).toBe("🏋️");
  });

  it("is case insensitive", () => {
    expect(emojiFromKeyword("WORK")).toBe("💼");
    expect(emojiFromKeyword("Home")).toBe("🏠");
    expect(emojiFromKeyword("ShOpPiNg")).toBe("🛒");
  });

  it("returns emoji from emojilib when not in custom map", () => {
    // Test some common emojis that should be in emojilib
    const result = emojiFromKeyword("smile");
    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
  });

  it("returns undefined for unknown keywords", () => {
    expect(emojiFromKeyword("nonexistentkeyword")).toBeUndefined();
    expect(emojiFromKeyword("xyz123")).toBeUndefined();
  });

  it("handles empty string", () => {
    expect(emojiFromKeyword("")).toBeUndefined();
  });

  it("handles special characters and numbers", () => {
    expect(emojiFromKeyword("test123")).toBeUndefined();
    expect(emojiFromKeyword("hello-world")).toBeUndefined();
  });

  it("prioritizes custom map over emojilib", () => {
    // If there's a conflict, custom map should win
    // This is hard to test without knowing emojilib contents,
    // but we can test that our custom mappings work
    expect(emojiFromKeyword("work")).toBe("💼");
  });
});