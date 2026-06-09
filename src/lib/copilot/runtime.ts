import { CopilotRuntime } from "@copilotkit/runtime";

export const runtime = new CopilotRuntime({
  remoteEndpoints: [
    { url: process.env.AGENT_SERVICE_URL + "/api/agent" || "http://localhost:8000/api/agent" }
  ]
});
