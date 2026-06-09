import { CopilotRuntime } from "@copilotkit/runtime";

// Extract thread ID logic and agent URL construction here
export function createCopilotRuntime() {
    const agentUrl = process.env.AGENT_SERVICE_URL || "http://localhost:8000";

    return new CopilotRuntime({
        remoteEndpoints: [
            {
                url: `${agentUrl}/api/agent`,
            }
        ]
    });
}
