import { StateGraph, Annotation, END } from "@langchain/langgraph";
import type { BaseMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";
import { getSupervisorModel } from "../nodes/supervisor";
import { executeCode } from "@/lib/daytona/tools/execute-code";
import { executeCommand } from "@/lib/daytona/tools/execute-command";

const CodeState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (current, update) => current.concat(update),
    default: () => [],
  }),
  codeComplete: Annotation<boolean>({
    reducer: (_, update) => update,
    default: () => false,
  }),
});

type CState = typeof CodeState.State;

async function plan(state: CState, config: RunnableConfig): Promise<Partial<CState>> {
  const model = (await getSupervisorModel(config)) as any;
  const response = await model.invoke(
    [
      ...state.messages,
      { role: "system", content: "Plan the code implementation. When the code is complete and validated, respond with 'CODE_COMPLETE'." },
    ],
    config
  );
  return { messages: [response], codeComplete: String(response.content || "").includes("CODE_COMPLETE") };
}

async function execute(state: CState, config: RunnableConfig): Promise<Partial<CState>> {
  const model = (await getSupervisorModel(config)) as any;
  const conversationId = (config.configurable as any)?.conversationId || "default";
  const lastMessage = state.messages[state.messages.length - 1];
  const content = String((lastMessage as any).content || "");

  const codeMatch = content.match(/```(?:python|javascript|typescript|sh)?\n?([\s\S]*?)```/);
  if (codeMatch) {
    const code = codeMatch[1].trim();
    const langMatch = content.match(/```(python|javascript|typescript|sh)/);
    const language = langMatch?.[1] || "python";
    const result = await executeCode.invoke({ language: language as any, code, conversationId }, config);
    return { messages: [{ role: "tool", content: result, name: "execute_code" } as any] };
  }

  return { messages: [{ role: "tool", content: "No code block found to execute.", name: "execute_code" } as any] };
}

async function validate(state: CState, config: RunnableConfig): Promise<Partial<CState>> {
  const model = (await getSupervisorModel(config)) as any;
  const response = await model.invoke(
    [
      ...state.messages,
      { role: "system", content: "Validate the executed code results. Check for errors and suggest fixes if needed." },
    ],
    config
  );
  return { messages: [response] };
}

function codeRouter(state: CState): string {
  if (state.codeComplete) return "validate";
  const lastMsg = state.messages[state.messages.length - 1] as any;
  if (lastMsg?.name === "execute_code") return "plan";
  return "execute";
}

export const codeSubgraph = new StateGraph(CodeState)
  .addNode("plan", plan)
  .addNode("execute", execute)
  .addNode("validate", validate)
  .addEdge("__start__", "plan")
  .addConditionalEdges("plan", (s) => s.codeComplete ? "validate" : "execute")
  .addEdge("execute", "plan")
  .addEdge("validate", END)
  .compile();
