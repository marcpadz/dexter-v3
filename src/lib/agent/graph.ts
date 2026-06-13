import { Annotation, StateGraph, END } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import type { RunnableConfig } from "@langchain/core/runnables";
import type { BaseMessage } from "@langchain/core/messages";
import { allTools } from "@/lib/daytona/tools";
import { getSupervisorModel } from "./nodes/supervisor";
import { router } from "./nodes/router";
import { researchSubgraph } from "./subgraphs/research";
import { codeSubgraph } from "./subgraphs/code";

// --- State definition using LangGraph Annotation API ---

const GraphState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (current, update) => current.concat(update),
    default: () => [],
  }),
  userId: Annotation<string>({
    reducer: (_, update) => update,
    default: () => "",
  }),
  model: Annotation<string>({
    reducer: (_, update) => update,
    default: () => "anthropic/claude-sonnet-4-20250514",
  }),
  conversationId: Annotation<string>({
    reducer: (_, update) => update,
    default: () => "",
  }),
  sandboxId: Annotation<string | null>({
    reducer: (_, update) => update,
    default: () => null,
  }),
  apiKeys: Annotation<Record<string, string>>({
    reducer: (_, update) => update,
    default: () => ({}),
  }),
});

type GraphStateType = typeof GraphState.State;

// --- Supervisor node ---

async function supervisor(
  state: GraphStateType,
  config: RunnableConfig
): Promise<Partial<GraphStateType>> {
  const model = (await getSupervisorModel(config)) as any;
  const modelWithTools = model.bindTools(allTools);
  const response = await modelWithTools.invoke(state.messages, config);
  return { messages: [response] };
}

// --- Tool node ---

const toolNode = new ToolNode(allTools);

// --- Build graph ---

const workflow = new StateGraph(GraphState)
  // Nodes
  .addNode("supervisor", supervisor)
  .addNode("tools", toolNode)
  .addNode("research_subgraph", researchSubgraph as any)
  .addNode("code_subgraph", codeSubgraph as any)

  // Entry point
  .addEdge("__start__", "supervisor")

  // Supervisor routes via router function
  .addConditionalEdges("supervisor", router, {
    tools: "tools",
    research_subgraph: "research_subgraph",
    code_subgraph: "code_subgraph",
    [END]: END,
  })

  // Tool results and sub-graph results return to supervisor
  .addEdge("tools", "supervisor")
  .addEdge("research_subgraph", "supervisor")
  .addEdge("code_subgraph", "supervisor");

/**
 * Static compiled graph instance for synchronous import (e.g., custom agent adapter).
 * Runs without checkpointer — persistence is available via createCompiledGraph().
 */
export const compiledGraph = workflow.compile();

/**
 * Async factory with PostgresSaver checkpointer.
 * Call at app startup for conversation persistence.
 */
export async function createCompiledGraph() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.warn("[graph] DATABASE_URL not set — running without checkpointer");
    return workflow.compile();
  }

  const checkpointer = PostgresSaver.fromConnString(connectionString);
  await checkpointer.setup(); // Ensure checkpoint tables exist
  return workflow.compile({ checkpointer });
}
