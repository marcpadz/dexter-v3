import type { BaseMessage } from "@langchain/core/messages";

export interface AgentState {
  messages: BaseMessage[];
  userId: string;
  model: string;
  conversationId: string;
  sandboxId: string | null;
  apiKeys: Record<string, string>;
}
