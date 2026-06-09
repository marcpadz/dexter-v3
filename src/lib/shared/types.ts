export type WorkspaceTab = "Artifacts" | "Browser" | "Document" | "Terminal" | "Files" | "Output";
export type ArtifactType = "code" | "html" | "svg" | "react" | "diff" | "mermaid";

export interface Artifact {
  id: string;
  type: ArtifactType;
  title: string;
  content: string;
  language?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceFile {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: WorkspaceFile[];
}

export interface WorkspaceActivity {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  status: "pending" | "success" | "error";
}

export interface Conversation {
  id: string;
  title: string;
  model: string | null;
  projectId: string | null;
  pinned: boolean;
  threadId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  role: string;
  content: string;
  toolCalls: any;
  toolCallId: string | null;
  model: string | null;
  createdAt: Date;
}

export interface Document {
  id: string;
  type: string;
  title: string;
  content: string;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  instructions: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiKey {
  id: string;
  provider: string;
  createdAt: Date;
}

export interface McpServer {
  id: string;
  name: string;
  transportType: string;
  command: string | null;
  url: string | null;
  args: any;
  env: any;
  enabled: boolean;
  createdAt: Date;
}

export interface Memory {
  id: string;
  content: string;
  tags: any;
  createdAt: Date;
}
