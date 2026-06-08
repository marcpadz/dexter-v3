import { describe, it, expect } from "vitest";
import { generateChatTitle } from "../shared/utils";

describe("generateChatTitle", () => {
  it("should truncate long messages", () => {
    const title = generateChatTitle("This is a very long message that should be truncated");
    expect(title.length).toBeLessThanOrEqual(60);
  });

  it("should return short messages as-is", () => {
    const title = generateChatTitle("Hello");
    expect(title).toBe("Hello");
  });

  it("should handle empty strings", () => {
    const title = generateChatTitle("");
    expect(title).toBe("New Chat");
  });
});
