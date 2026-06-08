export type User = {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  role: string;
  premium: boolean;
  anonymous: boolean;
  favoriteModels: string[];
  systemPrompt: string;
  preferences: Record<string, unknown>;
};

export type Conversation = {
  id: string;
  userId: string;
  title: string;
  projectId: string | null;
  model: string | null;
  pinned: boolean;
  pinnedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  messageCount?: number;
};

export type Message = {
  id: string;
  conversationId: string;
  role: "system" | "user" | "assistant";
  content: string;
  parts?: unknown;
  annotations?: unknown;
  attachments?: unknown;
  messageGroupId: string;
  model: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Project = {
  id: string;
  userId: string;
  name: string;
  instructions: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Note = {
  id: string;
  userId: string;
  title: string;
  content: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type Task = {
  id: string;
  userId: string;
  title: string;
  completed: boolean;
  priority: string | null;
  dueDate: Date | null;
  assignee: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type KnowledgeBase = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ModelConfig = {
  id: string;
  modelId: string;
  provider: string;
  displayName: string;
  accessTier: string;
  enabled: boolean;
};

export type ProviderConfig = {
  id: string;
  providerType: string;
  name: string;
  enabled: boolean;
  sortOrder: number;
};

export type AttachmentMeta = {
  name?: string;
  contentType?: string;
  url: string;
  size?: number;
};
