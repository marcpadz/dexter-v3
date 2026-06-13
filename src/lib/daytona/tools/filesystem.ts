import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getOrCreateSandbox } from "@/lib/daytona/sandbox-manager";

export const listFiles = tool(
  async ({ path, conversationId }) => {
    try {
      const sandbox = await getOrCreateSandbox(conversationId);
      const files = await sandbox.fs.listFiles(path || "/");
      return JSON.stringify({ files });
    } catch (err: any) {
      return JSON.stringify({ error: err.message || "Failed to list files" });
    }
  },
  {
    name: "list_files",
    description: "List files and directories at a path in the sandbox.",
    schema: z.object({
      path: z.string().describe("The path to list files from"),
      conversationId: z.string().describe("The current conversation ID"),
    }),
  }
);

export const readFile = tool(
  async ({ path, conversationId }) => {
    try {
      const sandbox = await getOrCreateSandbox(conversationId);
      const buffer = await sandbox.fs.downloadFile(path);
      const content = buffer instanceof Buffer ? buffer.toString("utf-8") : String(buffer);
      return JSON.stringify({ path, content });
    } catch (err: any) {
      return JSON.stringify({ path, error: err.message || "Failed to read file" });
    }
  },
  {
    name: "read_file",
    description: "Read the contents of a file in the sandbox.",
    schema: z.object({
      path: z.string().describe("The path of the file to read"),
      conversationId: z.string().describe("The current conversation ID"),
    }),
  }
);

export const writeFile = tool(
  async ({ path, content, conversationId }) => {
    try {
      const sandbox = await getOrCreateSandbox(conversationId);
      const buffer = Buffer.from(content, "utf-8");
      await sandbox.fs.uploadFile(buffer, path);
      return JSON.stringify({ success: true, path, bytesWritten: buffer.length });
    } catch (err: any) {
      return JSON.stringify({ success: false, path, error: err.message || "Failed to write file" });
    }
  },
  {
    name: "write_file",
    description: "Write content to a file in the sandbox. Creates parent directories if needed.",
    schema: z.object({
      path: z.string().describe("The path of the file to write"),
      content: z.string().describe("The content to write"),
      conversationId: z.string().describe("The current conversation ID"),
    }),
  }
);

export const deleteFile = tool(
  async ({ path, conversationId, recursive }) => {
    try {
      const sandbox = await getOrCreateSandbox(conversationId);
      await sandbox.fs.deleteFile(path, recursive || false);
      return JSON.stringify({ success: true, path });
    } catch (err: any) {
      return JSON.stringify({ success: false, path, error: err.message || "Failed to delete file" });
    }
  },
  {
    name: "delete_file",
    description: "Delete a file or directory in the sandbox.",
    schema: z.object({
      path: z.string().describe("The path to delete"),
      conversationId: z.string().describe("The current conversation ID"),
      recursive: z.boolean().optional().describe("Delete directories recursively"),
    }),
  }
);
