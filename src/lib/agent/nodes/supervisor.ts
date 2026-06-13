import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { RunnableConfig } from "@langchain/core/runnables";
import { resolveModel } from "@/lib/agent/providers";

export async function getSupervisorModel(
  config: RunnableConfig
): Promise<BaseChatModel> {
  const modelString =
    (config.configurable as any)?.model || "anthropic/claude-sonnet-4-20250514";

  const apiKeys: Record<string, string> =
    (config.configurable as any)?.apiKeys || {};

  return resolveModel(String(modelString), apiKeys);
}
