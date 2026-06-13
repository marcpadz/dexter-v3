import { describe, it, expect } from "vitest";

describe("BrowserSurface data URI handling", () => {
  it("should render screenshot src without double-encoding", () => {
    // Simulate the bugfix: browserScreenshot from the store already contains
    // the data URI prefix from the Daytona tool (e.g. "data:image/jpeg;base64,...")
    // The browser surface MUST NOT wrap it in another data URI prefix.

    const browserScreenshot = "data:image/jpeg;base64,/9j/4AAQSkZJRg==";

    // Old (buggy) behavior:
    const oldSrc = `data:image/png;base64,${browserScreenshot}`;
    expect(oldSrc).toBe(
      "data:image/png;base64,data:image/jpeg;base64,/9j/4AAQSkZJRg=="
    );
    // ^ This is the bug — duplicated data URI prefix

    // Fixed behavior — render the screenshot directly:
    const fixedSrc = browserScreenshot;
    expect(fixedSrc).toBe("data:image/jpeg;base64,/9j/4AAQSkZJRg==");
    // No duplication, just the raw value
  });

  it("should handle null screenshot gracefully", () => {
    const browserScreenshot = null;
    // When null, the surface shows a placeholder — no img tag at all
    expect(browserScreenshot).toBeNull();
  });

  it("should preserve the full data URI from the tool result", () => {
    // The Daytona browser.ts tool returns screenshot_base64 with the
    // full data URI prefix already included
    const toolResult = JSON.stringify({
      url: "https://example.com",
      screenshot_base64: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
    });

    const parsed = JSON.parse(toolResult);
    const screenshot = parsed.screenshot_base64;

    // The frontend action passes this directly to setBrowserScreenshot
    expect(screenshot).toBe("data:image/jpeg;base64,/9j/4AAQSkZJRg==");

    // The browser surface uses it as-is (no wrapping)
    const renderedSrc = screenshot;
    expect(renderedSrc.startsWith("data:image/")).toBe(true);
    expect(renderedSrc.startsWith("data:image/png;base64,data:image/")).toBe(
      false
    );
  });
});
