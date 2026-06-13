"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { useWorkspaceStore, ArtifactType } from "../workspace/workspace-store";
import { v4 as uuidv4 } from "uuid";

export function useWorkspaceTools() {
  const addArtifact = useWorkspaceStore((s) => s.addArtifact);
  const updateArtifactStore = useWorkspaceStore((s) => s.updateArtifact);
  const pushActivity = useWorkspaceStore((s) => s.pushActivity);
  const setDocumentId = useWorkspaceStore((s) => s.setDocumentId);
  const setDocumentTitle = useWorkspaceStore((s) => s.setDocumentTitle);
  const setDocumentContent = useWorkspaceStore((s) => s.setDocumentContent);
  const setActiveTab = useWorkspaceStore((s) => s.setActiveTab);
  const setBrowserUrl = useWorkspaceStore((s) => s.setBrowserUrl);
  const setBrowserScreenshot = useWorkspaceStore((s) => s.setBrowserScreenshot);
  const appendTerminalOutput = useWorkspaceStore((s) => s.appendTerminalOutput);
  const setFiles = useWorkspaceStore((s) => s.setFiles);
  const setSelectedFilePath = useWorkspaceStore((s) => s.setSelectedFilePath);

  useCopilotAction({
    name: "create_artifact",
    description: "Creates a new artifact to display in the user's workspace.",
    parameters: [
      {
        name: "type",
        type: "string",
        description:
          "The type of artifact ('code', 'html', 'svg', 'react', 'image', 'diff', 'mermaid').",
      },
      {
        name: "title",
        type: "string",
        description: "A brief title for the artifact.",
      },
      {
        name: "content",
        type: "string",
        description: "The actual content of the artifact.",
      },
      {
        name: "language",
        type: "string",
        description: "The programming language if type is 'code'.",
        required: false,
      },
    ],
    handler: async ({ type, title, content, language }: { type: string; title: string; content: string; language?: string }) => {
      const id = uuidv4();
      addArtifact({
        id,
        type: type as ArtifactType,
        title,
        content,
        language,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      pushActivity({
        kind: "success",
        title: `Created artifact: ${title}`,
      });
      return `Artifact '${title}' created successfully.`;
    },
  });

  useCopilotAction({
    name: "update_artifact",
    description: "Updates an existing artifact in the user's workspace.",
    parameters: [
      {
        name: "id",
        type: "string",
        description: "The ID of the artifact to update.",
      },
      { name: "content", type: "string", description: "The new content." },
    ],
    handler: async ({ id, content }: { id: string; content: string }) => {
      updateArtifactStore(id, content);
      pushActivity({
        kind: "success",
        title: `Updated artifact ${id}`,
      });
      return `Artifact ${id} updated successfully.`;
    },
  });

  useCopilotAction({
    name: "create_document",
    description: "Creates a new rich text document in the user's workspace.",
    parameters: [
      {
        name: "title",
        type: "string",
        description: "The title of the document.",
      },
      {
        name: "content",
        type: "string",
        description: "The HTML content of the document.",
      },
    ],
    handler: async ({ title, content }: { title: string; content: string }) => {
      const id = uuidv4();
      setDocumentId(id);
      setDocumentTitle(title);
      setDocumentContent(content);
      setActiveTab("document");
      pushActivity({
        kind: "success",
        title: `Created document: ${title}`,
      });
      return `Document '${title}' created successfully.`;
    },
  });

  useCopilotAction({
    name: "browse_web",
    description: "Browses the web and takes a screenshot.",
    parameters: [
      { name: "url", type: "string", description: "The URL to browse." },
      {
        name: "screenshot_base64",
        type: "string",
        description: "The base64 encoded screenshot of the page.",
      },
    ],
    handler: async (args: any) => {
      // Tool result comes as JSON string from the LangGraph tool
      const data = typeof args === "string" ? JSON.parse(args) : args;
      const url = data.url || "";
      const screenshot = data.screenshot_base64 || "";
      setBrowserUrl(url);
      setBrowserScreenshot(screenshot);
      setActiveTab("browser");
      pushActivity({
        kind: "info",
        title: `Browsed: ${url}`,
      });
      return `Successfully browsed ${url}.`;
    },
  });

  useCopilotAction({
    name: "execute_code",
    description: "Executes a command in the terminal.",
    parameters: [
      {
        name: "command",
        type: "string",
        description: "The command to execute.",
      },
      {
        name: "output",
        type: "string",
        description: "The output of the command execution.",
      },
    ],
    handler: async (args: any) => {
      // Tool result comes as JSON string from the LangGraph tool: { exitCode, stdout, stderr }
      const data = typeof args === "string" ? JSON.parse(args) : args;
      const command = data.command || "";
      const stdout = data.stdout || "";
      const stderr = data.stderr || "";
      const output = stdout + (stderr ? `\n${stderr}` : "");
      appendTerminalOutput(`$ ${command}\n${output}\n`);
      setActiveTab("terminal");
      pushActivity({
        kind: "action",
        title: `Executed: ${command}`,
      });
      return `Executed successfully.`;
    },
  });

  useCopilotAction({
    name: "list_files",
    description: "Lists files in a directory.",
    parameters: [
      {
        name: "path",
        type: "string",
        description: "The path to list files from.",
      },
      {
        name: "files",
        type: "object[]",
        description: "The files in the directory.",
      },
    ],
    handler: async (args: any) => {
      // Tool result comes as JSON string: { files: Array<{name, path, isDir, size}> }
      const data = typeof args === "string" ? JSON.parse(args) : args;
      const files = data.files || [];
      const path = data.path || "/";
      setFiles(files);
      setActiveTab("files");
      pushActivity({
        kind: "info",
        title: `Listed files in ${path}`,
      });
      return `Successfully listed files.`;
    },
  });

  useCopilotAction({
    name: "read_file",
    description: "Reads the contents of a file.",
    parameters: [
      {
        name: "path",
        type: "string",
        description: "The path of the file to read.",
      },
      {
        name: "content",
        type: "string",
        description: "The content of the file.",
      },
    ],
    handler: async (args: any) => {
      // Tool result comes as JSON string: { path, content }
      const data = typeof args === "string" ? JSON.parse(args) : args;
      const path = data.path || "";
      setSelectedFilePath(path);
      setActiveTab("files");
      pushActivity({
        kind: "info",
        title: `Read file: ${path}`,
      });
      return `Successfully read file ${path}.`;
    },
  });

  useCopilotAction({
    name: "write_file",
    description: "Writes content to a file. Requires user confirmation.",
    parameters: [
      {
        name: "path",
        type: "string",
        description: "The path of the file to write.",
      },
      { name: "content", type: "string", description: "The content to write." },
    ],
    handler: async ({ path, content }: { path: string; content: string }) => {
      pushActivity({
        kind: "success",
        title: `Wrote file: ${path}`,
      });
      return `Successfully wrote to file ${path}.`;
    },
  });

  // ── Chat-result tools (push activity, no panel update) ──

  useCopilotAction({
    name: "delete_file",
    description: "Deletes a file from the sandbox.",
    parameters: [{ name: "path", type: "string", description: "The path to delete." }],
    handler: async (args: any) => {
      pushActivity({ kind: "action", title: `Deleted file: ${typeof args === "string" ? JSON.parse(args).path : args.path}` });
      return `File deleted.`;
    },
  });

  useCopilotAction({
    name: "git_clone",
    description: "Clones a git repository into the sandbox.",
    parameters: [{ name: "url", type: "string", description: "The repository URL." }],
    handler: async (args: any) => {
      const data = typeof args === "string" ? JSON.parse(args) : args;
      pushActivity({ kind: "action", title: `Cloned: ${data.url || "repository"}` });
      return `Repository cloned.`;
    },
  });

  useCopilotAction({
    name: "git_status",
    description: "Shows git status of a repository.",
    parameters: [{ name: "path", type: "string", description: "The repository path." }],
    handler: async (_args: any) => {
      pushActivity({ kind: "info", title: "Checked git status" });
      return `Git status checked.`;
    },
  });

  useCopilotAction({
    name: "git_commit",
    description: "Stages and commits changes.",
    parameters: [{ name: "message", type: "string", description: "The commit message." }],
    handler: async (args: any) => {
      const data = typeof args === "string" ? JSON.parse(args) : args;
      pushActivity({ kind: "action", title: `Committed: ${(data.message || "").slice(0, 50)}` });
      return `Changes committed.`;
    },
  });

  useCopilotAction({
    name: "web_search",
    description: "Searches the web for information.",
    parameters: [{ name: "query", type: "string", description: "The search query." }],
    handler: async (args: any) => {
      const data = typeof args === "string" ? JSON.parse(args) : args;
      const results = data.results || [];
      pushActivity({ kind: "info", title: `Searched: ${data.query || "web"} (${results.length} results)` });
      return `Search complete.`;
    },
  });

  useCopilotAction({
    name: "take_screenshot",
    description: "Takes a screenshot of the current sandbox browser state.",
    parameters: [],
    handler: async () => {
      pushActivity({ kind: "action", title: "Took screenshot" });
      return `Screenshot taken.`;
    },
  });
}
