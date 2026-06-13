import { StateGraph, Annotation, END } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import type { BaseMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";
import { getSupervisorModel } from "./nodes/supervisor";
import { allTools } from "@/lib/daytona/tools";

const AgentStateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (current, update) => current.concat(update),
    default: () => [],
  }),
});

type AgentState = typeof AgentStateAnnotation.State;

async function supervisor(
  state: AgentState,
  config: RunnableConfig
): Promise<Partial<AgentState>> {
  const model = await getSupervisorModel(config) as any;
  const modelWithTools = model.bindTools(allTools);
  const response = await modelWithTools.invoke(state.messages, config);
  return { messages: [response] };
}

const toolNode = new ToolNode(allTools);

function shouldContinue(state: AgentState): "tools" | typeof END {
  const lastMessage = state.messages[state.messages.length - 1] as any;
  if (lastMessage && "tool_calls" in lastMessage && lastMessage.tool_calls?.length) {
    return "tools";
  }
  return END;
}

const graph = new StateGraph(AgentStateAnnotation)
  .addNode("supervisor", supervisor)
  .addNode("tools", toolNode)
  .addEdge("__start__", "supervisor")
  .addConditionalEdges("supervisor", shouldContinue)
  .addEdge("tools", "supervisor");

export const compiledGraph = graph.compile();
