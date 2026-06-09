export interface WorkspaceTab {
  id: string;
  label: string;
  isActive: boolean;
}

export type ArtifactType =
  | "code"
  | "html"
  | "svg"
  | "react"
  | "diff"
  | "mermaid";

export interface Artifact {
  id: string;
  type: ArtifactType;
  title: string;
  content: string;
  language?: string;
}

export interface WorkspaceFile {
  path: string;
  content: string;
  type: "file" | "directory";
}

export interface WorkspaceActivity {
  id: string;
  toolName: string;
  status: "in_progress" | "completed" | "failed";
  timestamp: Date;
  details?: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  model: string;
  projectId?: string;
  pinned: boolean;
  threadId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  role: string;
  content: string;
  toolCalls?: any;
  toolCallId?: string;
  model?: string;
  createdAt: Date;
}

export interface Document {
  id: string;
  userId: string;
  type: string;
  title: string;
  content: string;
  metadata?: any;
  embedding?: any;
  projectId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  instructions?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiKey {
  id: string;
  userId: string;
  provider: string;
  encryptedKey: string;
  iv: string;
  createdAt: Date;
}

export interface McpServer {
  id: string;
  userId: string;
  name: string;
  transportType: string;
  command?: string;
  url?: string;
  args?: any;
  env?: any;
  enabled: boolean;
  createdAt: Date;
}

export interface Memory {
  id: string;
  userId: string;
  content: string;
  embedding?: any;
  tags?: any;
  sourceConversationId?: string;
  createdAt: Date;
}
