"use client";

// TODO: When CopilotKit is available, import useCopilotAction
// import { useCopilotAction } from "@copilotkit/react-core";
import { useWorkspaceStore, ArtifactType } from "../workspace/workspace-store";
import { v4 as uuidv4 } from "uuid";

// Mock hook since CopilotKit isn't fully installed yet according to dependencies
// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
const useCopilotAction = (params: any) => {
  // Mock implementation
  return null;
};

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handler: async ({ type, title, content, language }: any) => {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handler: async ({ id, content }: any) => {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handler: async ({ title, content }: any) => {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handler: async ({ url, screenshot_base64 }: any) => {
      setBrowserUrl(url);
      setBrowserScreenshot(screenshot_base64);
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handler: async ({ command, output }: any) => {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handler: async ({ path, files }: any) => {
      setFiles(files);
      setActiveTab("files");
      pushActivity({
        kind: "info",
        title: `Listed files in ${path || "/"}`,
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    handler: async ({ path, content }: any) => {
      // In a real app we'd load the content into the file object
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    handler: async ({ path, content }: any) => {
      pushActivity({
        kind: "success",
        title: `Wrote file: ${path}`,
      });
      return `Successfully wrote to file ${path}.`;
    },
  });
}
