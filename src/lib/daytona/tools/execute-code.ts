import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getOrCreateSandbox } from "@/lib/daytona/sandbox-manager";

export const executeCode = tool(
  async ({ language, code, conversationId }) => {
    try {
      const sandbox = await getOrCreateSandbox(conversationId);

      if (language === "python") {
        const result: any = await sandbox.process.codeRun(code);
        return JSON.stringify({
          exitCode: result.exitCode ?? 0,
          stdout: result.artifacts?.stdout ?? result.result ?? "",
          stderr: result.artifacts?.stderr ?? "",
        });
      }

      let command: string;
      if (language === "javascript" || language === "typescript") {
        command = `node -e ${JSON.stringify(code)}`;
      } else {
        command = code;
      }

      const result: any = await sandbox.process.executeCommand(command);
      return JSON.stringify({
        exitCode: result.exitCode ?? 0,
        stdout: result.artifacts?.stdout ?? result.result ?? "",
        stderr: result.artifacts?.stderr ?? "",
      });
    } catch (err: any) {
      return JSON.stringify({
        exitCode: 1,
        stdout: "",
        stderr: err.message || "Sandbox execution error",
      });
    }
  },
  {
    name: "execute_code",
    description: "Execute code in a sandbox. Supports Python, JavaScript, TypeScript, and shell.",
    schema: z.object({
      language: z.enum(["python", "javascript", "typescript", "sh"]).describe("The programming language"),
      code: z.string().describe("The code to execute"),
      conversationId: z.string().describe("The current conversation ID"),
    }),
  }
);
