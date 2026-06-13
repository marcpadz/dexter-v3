import { StateGraph, Annotation, END } from "@langchain/langgraph";
import type { BaseMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";
import { getSupervisorModel } from "../nodes/supervisor";
import { webSearch } from "@/lib/daytona/tools/search";
import { browseWeb } from "@/lib/daytona/tools/browser";

const ResearchState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (current, update) => current.concat(update),
    default: () => [],
  }),
  researchComplete: Annotation<boolean>({
    reducer: (_, update) => update,
    default: () => false,
  }),
});

type RState = typeof ResearchState.State;

async function plan(state: RState, config: RunnableConfig): Promise<Partial<RState>> {
  const model = (await getSupervisorModel(config)) as any;
  const response = await model.invoke(
    [
      ...state.messages,
      { role: "system", content: "You are a research planner. Create a brief plan for the research task. If the plan is complete, respond with 'PLAN_COMPLETE'." },
    ],
    config
  );
  return { messages: [response], researchComplete: String(response.content || "").includes("PLAN_COMPLETE") };
}

async function search(state: RState, config: RunnableConfig): Promise<Partial<RState>> {
  const lastMessage = state.messages[state.messages.length - 1];
  const model = (await getSupervisorModel(config)) as any;
  const query = String((lastMessage as any).content || "latest developments");
  const result = await webSearch.invoke({ query }, config);
  return { messages: [{ role: "tool", content: result, name: "web_search" } as any] };
}

async function browse(state: RState, config: RunnableConfig): Promise<Partial<RState>> {
  const lastMessage = state.messages[state.messages.length - 1];
  const model = (await getSupervisorModel(config)) as any;
  const url = String((lastMessage as any).content || "https://example.com");
  const result = await browseWeb.invoke({ url, action: "screenshot", conversationId: (config.configurable as any)?.conversationId }, config);
  return { messages: [{ role: "tool", content: result, name: "browse_web" } as any] };
}

async function synthesize(state: RState, config: RunnableConfig): Promise<Partial<RState>> {
  const model = (await getSupervisorModel(config)) as any;
  const response = await model.invoke(
    [
      ...state.messages,
      { role: "system", content: "Synthesize the research findings into a clear summary." },
    ],
    config
  );
  return { messages: [response] };
}

function researchRouter(state: RState): string {
  if (state.researchComplete) return "synthesize";
  const lastMsg = state.messages[state.messages.length - 1] as any;
  if (lastMsg?.name === "web_search") return "browse";
  return "search";
}

export const researchSubgraph = new StateGraph(ResearchState)
  .addNode("plan", plan)
  .addNode("search", search)
  .addNode("browse", browse)
  .addNode("synthesize", synthesize)
  .addEdge("__start__", "plan")
  .addConditionalEdges("plan", (s) => s.researchComplete ? "synthesize" : "search")
  .addEdge("search", "browse")
  .addEdge("browse", "plan")
  .addEdge("synthesize", END)
  .compile();
