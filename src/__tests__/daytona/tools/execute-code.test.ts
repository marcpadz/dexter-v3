import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSandbox = vi.hoisted(() => ({
  id: "sandbox-test-123",
  process: {
    codeRun: vi.fn(),
    executeCommand: vi.fn(),
    createSession: vi.fn(),
    executeSessionCommand: vi.fn(),
  },
}));

vi.mock("@/lib/daytona/sandbox-manager", () => ({
  getOrCreateSandbox: vi.fn(() => Promise.resolve(mockSandbox)),
}));

describe("execute_code tool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should execute Python code and return stdout", async () => {
    const { executeCode } = await import(
      "@/lib/daytona/tools/execute-code"
    );

    mockSandbox.process.codeRun.mockResolvedValueOnce({
      exitCode: 0,
      artifacts: { stdout: "hello world\n", stderr: "" },
    });

    const result = await executeCode.invoke({
      language: "python",
      code: "print('hello world')",
      conversationId: "conv-1",
    });

    const parsed = JSON.parse(result);
    expect(parsed.exitCode).toBe(0);
    expect(parsed.stdout).toContain("hello world");
    expect(mockSandbox.process.codeRun).toHaveBeenCalledWith(
      "print('hello world')"
    );
  });

  it("should execute JavaScript code via node", async () => {
    const { executeCode } = await import(
      "@/lib/daytona/tools/execute-code"
    );

    mockSandbox.process.executeCommand.mockResolvedValueOnce({
      exitCode: 0,
      artifacts: { stdout: "42\n", stderr: "" },
    });

    const result = await executeCode.invoke({
      language: "javascript",
      code: "console.log(42)",
      conversationId: "conv-1",
    });

    const parsed = JSON.parse(result);
    expect(parsed.exitCode).toBe(0);
    expect(parsed.stdout).toContain("42");
    expect(mockSandbox.process.executeCommand).toHaveBeenCalled();
  });

  it("should capture stderr on execution failure", async () => {
    const { executeCode } = await import(
      "@/lib/daytona/tools/execute-code"
    );

    mockSandbox.process.codeRun.mockResolvedValueOnce({
      exitCode: 1,
      artifacts: { stdout: "", stderr: "SyntaxError: invalid syntax" },
    });

    const result = await executeCode.invoke({
      language: "python",
      code: "print(", // Invalid syntax
      conversationId: "conv-1",
    });

    const parsed = JSON.parse(result);
    expect(parsed.exitCode).toBe(1);
    expect(parsed.stderr).toContain("SyntaxError");
  });

  it("should handle sandbox execution errors gracefully", async () => {
    const { executeCode } = await import(
      "@/lib/daytona/tools/execute-code"
    );

    mockSandbox.process.codeRun.mockRejectedValueOnce(
      new Error("Sandbox timeout")
    );

    const result = await executeCode.invoke({
      language: "python",
      code: "import time; time.sleep(100)",
      conversationId: "conv-1",
    });

    const parsed = JSON.parse(result);
    expect(parsed.exitCode).toBe(1);
    expect(parsed.stderr).toContain("Sandbox timeout");
  });

  it("should execute shell commands", async () => {
    const { executeCode } = await import(
      "@/lib/daytona/tools/execute-code"
    );

    mockSandbox.process.executeCommand.mockResolvedValueOnce({
      exitCode: 0,
      artifacts: { stdout: "Linux\n", stderr: "" },
    });

    const result = await executeCode.invoke({
      language: "sh",
      code: "uname -s",
      conversationId: "conv-1",
    });

    const parsed = JSON.parse(result);
    expect(parsed.exitCode).toBe(0);
  });
});
