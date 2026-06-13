import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getOrCreateSandbox } from "@/lib/daytona/sandbox-manager";

const sessions = new Map<string, any>();

export const executeCommand = tool(
  async ({ command, conversationId, sessionId, cwd }) => {
    try {
      const sandbox = await getOrCreateSandbox(conversationId);
      let session = sessionId ? sessions.get(sessionId) : null;

      if (!session) {
        session = await sandbox.process.createSession({} as any);
        sessions.set(session.sessionId || session.id, session);
      }

      const result: any = await sandbox.process.executeSessionCommand(
        session.sessionId || session.id,
        { command } as any
      );

      return JSON.stringify({
        sessionId: session.sessionId || session.id,
        exitCode: result.exitCode ?? 0,
        stdout: result.artifacts?.stdout ?? result.result ?? "",
        stderr: result.artifacts?.stderr ?? "",
      });
    } catch (err: any) {
      return JSON.stringify({
        sessionId: sessionId || "",
        exitCode: 1,
        stdout: "",
        stderr: err.message || "Command execution error",
      });
    }
  },
  {
    name: "execute_command",
    description: "Execute a shell command in a persistent terminal session.",
    schema: z.object({
      command: z.string().describe("The command to execute"),
      conversationId: z.string().describe("The current conversation ID"),
      sessionId: z.string().optional().describe("Optional session ID for persistent sessions"),
      cwd: z.string().optional().describe("Working directory for the command"),
    }),
  }
);
