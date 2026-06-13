import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getOrCreateSandbox } from "@/lib/daytona/sandbox-manager";

/**
 * WeakMap keyed by sandbox object + session ID string.
 * Entries are garbage-collected when the sandbox reference is dropped.
 * Bounded by the number of active sandboxes (one per conversation).
 */
const sandboxSessions = new WeakMap<object, Map<string, any>>();

export const executeCommand = tool(
  async ({ command, conversationId, sessionId }) => {
    try {
      const sandbox = await getOrCreateSandbox(conversationId);

      // Get or create per-sandbox session map (bounded by active sandboxes)
      let sessions = sandboxSessions.get(sandbox);
      if (!sessions) {
        sessions = new Map<string, any>();
        sandboxSessions.set(sandbox, sessions);
      }

      // Reuse session if sessionId provided and known, else create new
      const key = sessionId || "__default__";
      let session = sessions.get(key);
      if (!session) {
        session = await sandbox.process.createSession({} as any);
        const sid = session.sessionId || session.id;
        // Store by both the explicit key and the actual session ID
        sessions.set(key, session);
        sessions.set(sid, session);
      }

      const sid = session.sessionId || session.id;
      const result: any = await sandbox.process.executeSessionCommand(sid, {
        command,
      } as any);

      return JSON.stringify({
        sessionId: sid,
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
    description:
      "Execute a shell command in the sandbox terminal. Returns a sessionId for stateful multi-step commands.",
    schema: z.object({
      command: z.string().describe("The command to execute"),
      conversationId: z.string().describe("The current conversation ID"),
      sessionId: z.string().optional().describe("Optional session ID for persistent sessions"),
      cwd: z.string().optional().describe("Working directory for the command"),
    }),
  }
);
