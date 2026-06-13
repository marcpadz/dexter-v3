import { CopilotRuntime } from "@copilotkit/runtime";
import { dexterAgent } from "@/lib/agent/dexter-agent";

export const runtime = new CopilotRuntime({
  agents: { default: dexterAgent },
});
