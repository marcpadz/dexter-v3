import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getOrCreateSandbox } from "@/lib/daytona/sandbox-manager";

export const gitClone = tool(
  async ({ url, path, branch, conversationId }) => {
    try {
      const sandbox = await getOrCreateSandbox(conversationId) as any;
      await sandbox.git.clone(url, path, branch);
      return JSON.stringify({ success: true, path });
    } catch (err: any) {
      return JSON.stringify({ success: false, error: err.message || "Git clone failed" });
    }
  },
  {
    name: "git_clone",
    description: "Clone a git repository into the sandbox.",
    schema: z.object({
      url: z.string().describe("The repository URL to clone"),
      path: z.string().describe("The path to clone into"),
      branch: z.string().optional().describe("Optional branch to clone"),
      conversationId: z.string().describe("The current conversation ID"),
    }),
  }
);

export const gitStatus = tool(
  async ({ path, conversationId }) => {
    try {
      const sandbox = await getOrCreateSandbox(conversationId) as any;
      const status = await sandbox.git.status(path);
      return JSON.stringify(status);
    } catch (err: any) {
      return JSON.stringify({ error: err.message || "Git status failed" });
    }
  },
  {
    name: "git_status",
    description: "Get git status of a repository in the sandbox.",
    schema: z.object({
      path: z.string().describe("The path of the git repository"),
      conversationId: z.string().describe("The current conversation ID"),
    }),
  }
);

export const gitCommit = tool(
  async ({ path, message, conversationId }) => {
    try {
      const sandbox = await getOrCreateSandbox(conversationId) as any;
      await sandbox.git.add(path, ["."]);
      const result = await sandbox.git.commit(path, message, "Dexter", "dexter@ai.dev", false);
      return JSON.stringify({ success: true, sha: result?.sha || "committed" });
    } catch (err: any) {
      return JSON.stringify({ success: false, error: err.message || "Git commit failed" });
    }
  },
  {
    name: "git_commit",
    description: "Stage and commit changes in a sandbox repository.",
    schema: z.object({
      path: z.string().describe("The path of the git repository"),
      message: z.string().describe("The commit message"),
      conversationId: z.string().describe("The current conversation ID"),
    }),
  }
);
