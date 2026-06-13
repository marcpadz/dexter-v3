import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSandbox = vi.hoisted(() => ({
  id: "sandbox-test-123",
  process: {
    createSession: vi.fn(),
    executeSessionCommand: vi.fn(),
    codeRun: vi.fn(),
    executeCommand: vi.fn(),
  },
}));

vi.mock("@/lib/daytona/sandbox-manager", () => ({
  getOrCreateSandbox: vi.fn(() => Promise.resolve(mockSandbox)),
}));

describe("executeCommand session management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset modules to clear the module-scoped WeakMap between tests
    vi.resetModules();
  });

  it("should create a new session when none exists", async () => {
    const { executeCommand } = await import(
      "@/lib/daytona/tools/execute-command"
    );

    mockSandbox.process.createSession.mockResolvedValueOnce({
      sessionId: "session-abc-123",
      id: "session-abc-123",
    });
    mockSandbox.process.executeSessionCommand.mockResolvedValueOnce({
      exitCode: 0,
      artifacts: { stdout: "hello\n", stderr: "" },
    });

    const result = await executeCommand.invoke({
      command: "echo hello",
      conversationId: "conv-1",
    });

    const parsed = JSON.parse(result);
    expect(parsed.sessionId).toBe("session-abc-123");
    expect(parsed.exitCode).toBe(0);
    expect(mockSandbox.process.createSession).toHaveBeenCalledTimes(1);
    expect(mockSandbox.process.executeSessionCommand).toHaveBeenCalledWith(
      "session-abc-123",
      { command: "echo hello" }
    );
  });

  it("should reuse session for repeated calls with same conversationId", async () => {
    const { executeCommand } = await import(
      "@/lib/daytona/tools/execute-command"
    );

    mockSandbox.process.createSession.mockResolvedValue({
      sessionId: "session-abc-123",
      id: "session-abc-123",
    });
    mockSandbox.process.executeSessionCommand.mockResolvedValue({
      exitCode: 0,
      artifacts: { stdout: "ok\n", stderr: "" },
    });

    // First call creates session
    await executeCommand.invoke({
      command: "echo first",
      conversationId: "conv-same",
    });

    // Second call with same conversationId reuses session
    await executeCommand.invoke({
      command: "echo second",
      conversationId: "conv-same",
    });

    // createSession should only be called once
    expect(mockSandbox.process.createSession).toHaveBeenCalledTimes(1);
  });

  it("should handle session creation failure gracefully", async () => {
    const { executeCommand } = await import(
      "@/lib/daytona/tools/execute-command"
    );

    mockSandbox.process.createSession.mockRejectedValueOnce(
      new Error("Sandbox unreachable")
    );

    const result = await executeCommand.invoke({
      command: "echo fail",
      conversationId: "conv-fail",
    });

    const parsed = JSON.parse(result);
    expect(parsed.exitCode).toBe(1);
    expect(parsed.stderr).toContain("Sandbox unreachable");
  });
});
