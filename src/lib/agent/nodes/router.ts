import { END } from "@langchain/langgraph";

/**
 * Router function — determines the next step after the supervisor node.
 *
 * Decision logic:
 * - If last message has tool_calls → "tools" node for execution
 * - If a tool call has name "delegate_to_agent" with args.agent === "research" → "research_subgraph"
 * - If a tool call has name "delegate_to_agent" with args.agent === "code" → "code_subgraph"
 * - Otherwise → END (conversation complete)
 */
export function router(state: { messages: any[] }): "tools" | "research_subgraph" | "code_subgraph" | typeof END {
  const lastMessage = state.messages[state.messages.length - 1] as any;

  if (!lastMessage || !("tool_calls" in lastMessage) || !lastMessage.tool_calls?.length) {
    return END;
  }

  const toolCalls = lastMessage.tool_calls as Array<{ name: string; args?: Record<string, unknown> }>;

  // Check for delegation to sub-graphs
  const delegateCall = toolCalls.find((tc) => tc.name === "delegate_to_agent");
  if (delegateCall) {
    const targetAgent = String(delegateCall.args?.agent || "");
    if (targetAgent === "research") return "research_subgraph";
    if (targetAgent === "code") return "code_subgraph";
  }

  // Check for regular tool calls
  const hasToolCalls = toolCalls.some(
    (tc) => tc.name !== "delegate_to_agent"
  );

  if (hasToolCalls) return "tools";

  return END;
}
