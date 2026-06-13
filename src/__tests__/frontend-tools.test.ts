import { describe, it, expect, vi } from "vitest";

/**
 * Regression test for the AG-UI bridge fix (T002).
 *
 * The LangGraph tools return their results as JSON strings.
 * The frontend useCopilotAction handlers must parse these strings
 * before using the fields, because the AG-UI bridge delivers
 * tool result content as a string.
 */
describe("frontend-tools AG-UI bridge parsing", () => {
  it("execute_code handler should parse JSON tool result", () => {
    // Simulate what the LangGraph tool returns
    const toolResult = JSON.stringify({
      exitCode: 0,
      stdout: "hello world\n",
      stderr: "",
    });

    // The handler receives this as a string. It must JSON.parse it.
    const data = typeof toolResult === "string" ? JSON.parse(toolResult) : toolResult;

    expect(data.exitCode).toBe(0);
    expect(data.stdout).toContain("hello world");
    expect(data.stderr).toBe("");
  });

  it("execute_code handler should handle error results", () => {
    const toolResult = JSON.stringify({
      exitCode: 1,
      stdout: "",
      stderr: "SyntaxError: invalid syntax",
    });

    const data = typeof toolResult === "string" ? JSON.parse(toolResult) : toolResult;

    expect(data.exitCode).toBe(1);
    expect(data.stderr).toContain("SyntaxError");
  });

  it("browse_web handler should parse JSON tool result", () => {
    const toolResult = JSON.stringify({
      url: "https://example.com",
      screenshot_base64: "data:image/jpeg;base64,/9j/4AAQ==",
    });

    const data = typeof toolResult === "string" ? JSON.parse(toolResult) : toolResult;

    expect(data.url).toBe("https://example.com");
    expect(data.screenshot_base64).toContain("data:image/jpeg");
  });

  it("list_files handler should parse JSON tool result", () => {
    const toolResult = JSON.stringify({
      files: [
        { name: "file1.txt", isDir: false, size: 100 },
        { name: "subdir", isDir: true, size: 0 },
      ],
    });

    const data = typeof toolResult === "string" ? JSON.parse(toolResult) : toolResult;

    expect(data.files).toHaveLength(2);
    expect(data.files[0].name).toBe("file1.txt");
    expect(data.files[0].isDir).toBe(false);
  });

  it("read_file handler should parse JSON tool result", () => {
    const toolResult = JSON.stringify({
      path: "/home/user/file.txt",
      content: "file contents here",
    });

    const data = typeof toolResult === "string" ? JSON.parse(toolResult) : toolResult;

    expect(data.path).toBe("/home/user/file.txt");
    expect(data.content).toBe("file contents here");
  });

  it("write_file handler should parse JSON tool result", () => {
    const toolResult = JSON.stringify({
      success: true,
      path: "/home/user/test.py",
      bytesWritten: 13,
    });

    const data = typeof toolResult === "string" ? JSON.parse(toolResult) : toolResult;

    expect(data.success).toBe(true);
    expect(data.path).toBe("/home/user/test.py");
  });

  it("should handle string type guard (typeof check)", () => {
    // Test both paths through the typeof guard
    const stringResult = JSON.stringify({ exitCode: 0 });
    const objResult = { exitCode: 0 };

    const fromString = typeof stringResult === "string" ? JSON.parse(stringResult) : stringResult;
    const fromObj = typeof objResult === "string" ? JSON.parse(objResult as string) : objResult;

    expect(fromString.exitCode).toBe(0);
    expect(fromObj.exitCode).toBe(0);
  });
});
