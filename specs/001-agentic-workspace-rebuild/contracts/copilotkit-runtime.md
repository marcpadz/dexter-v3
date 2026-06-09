# CopilotKit Runtime Contract: Dexter v3

**Layer**: Next.js CopilotKit Runtime (AG-UI Bridge)  
**Location**: `src/lib/copilot/runtime.ts`, `src/app/api/copilotkit/route.ts`

## Overview

The CopilotKit runtime in Next.js acts as a **thin bridge** between the React frontend and the Python agent service. It does NOT use `BuiltInAgent`. Instead, it configures a `remoteAgents` endpoint that forwards all agent interactions to the Python FastAPI service via AG-UI protocol.

---

## Runtime Configuration

```typescript
// src/lib/copilot/runtime.ts
import { CopilotRuntime } from "@copilotkit/runtime";

const AGENT_SERVICE_URL = process.env.AGENT_SERVICE_URL || "http://localhost:8000";

export const runtime = new CopilotRuntime({
  // No BuiltInAgent — forward to remote Python agent
  remoteAgents: [
    {
      name: "dexter",
      url: `${AGENT_SERVICE_URL}/api/agent`,
    },
  ],
});
```

**Key Point**: The runtime has NO agent logic. It's purely a protocol bridge. All agent intelligence lives in the Python LangGraph service.

---

## API Route

```typescript
// src/app/api/copilotkit/route.ts
import {
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { NextRequest } from "next/server";
import { runtime } from "@/lib/copilot/runtime";

const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
  runtime,
  endpoint: "/api/copilotkit",
});

export const POST = async (req: NextRequest) => {
  return handleRequest(req);
};
```

---

## Data Flow

```
User types message in <CopilotChat>
      │
      ▼
CopilotKit React hooks prepare AG-UI request
(includes: messages, model selection, user context, MCP tool schemas)
      │
      ▼
POST /api/copilotkit (Next.js)
      │
      ▼
CopilotRuntime forwards to remoteAgents[0].url
      │
      ▼
POST /api/agent (Python FastAPI)
      │
      ▼
CopilotKit Python SDK → LangGraph graph.invoke()
      │
      ├── Agent streams text → AG-UI event → CopilotKit → <CopilotChat>
      ├── Agent calls tool → AG-UI event → CopilotKit → useCopilotAction handler
      │     ├── Tool updates Zustand store → workspace panel renders
      │     └── Tool result returned to agent → next step
      ├── Agent delegates to sub-graph → sub-graph executes → results flow back
      └── Agent completes → final AG-UI event → chat updates
```

---

## Authentication Context

User authentication context is passed from the Next.js session to the Python agent via AG-UI request headers:

```typescript
// The CopilotRuntime automatically injects auth context
// The Python agent reads user_id from the AG-UI request metadata
```

The Python agent uses `user_id` to:
1. Scope all database queries (memories, conversations)
2. Select the correct API key for model routing
3. Track checkpoint thread ownership

---

## MCP Tool Bridge

MCP tool schemas discovered in the Next.js layer are passed to the Python agent via AG-UI request metadata:

```typescript
// MCP tools are discovered per-user in the Next.js layer
// Their schemas are included in the AG-UI request
// The Python agent dynamically creates LangGraph Tool instances

// When an MCP tool is invoked by the agent:
// 1. Python agent sends tool call event via AG-UI
// 2. CopilotRuntime intercepts and routes to the MCP client
// 3. MCP client executes the tool
// 4. Result flows back to Python agent via AG-UI
```

---

## Model Selection

Model selection is passed from the frontend to the Python agent:

1. User selects a model in the chat UI (e.g., `"anthropic:claude-sonnet-4"`)
2. The selected model is included in the AG-UI request properties
3. The Python agent reads the model from the request and resolves it via `resolve_model()`
4. API keys are fetched from the `api_keys` table (decrypted) and passed to the model provider

---

## CopilotKit React Configuration

The frontend CopilotKit configuration remains unchanged regardless of the agent backend:

```typescript
// src/app/(app)/layout.tsx
import { CopilotKit } from "@copilotkit/react-core";

export default function AppLayout({ children }) {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit">
      {children}
    </CopilotKit>
  );
}
```

```typescript
// Chat page uses standard CopilotKit components
<CopilotChat
  labels={{ title: "Dexter", initial: "What are we working on?" }}
/>
```

---

## Error Handling

### Agent Service Unreachable

If the Python agent service is down:
1. CopilotRuntime detects connection failure
2. Frontend shows error message: "Agent service is unreachable"
3. User sees retry option
4. No data loss — checkpoints preserved in Postgres

### Checkpoint Resume

If the user reconnects after interruption:
1. Frontend sends message with existing `thread_id`
2. Python agent resumes from last checkpoint
3. User sees continued response from where it left off

---

*Part of the LangGraph Python agent backend contract definition.*
