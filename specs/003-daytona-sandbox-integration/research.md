# Research: Daytona Sandbox Integration

**Date**: 2026-06-13 | **Spec**: [spec.md](./spec.md)

## Decision 1: Agent SDK — LangGraph.js

**Chosen**: `@langchain/langgraph` ^1.4 running in-process inside Next.js

**Rationale**: 
- CopilotKit has a first-class LangGraph.js adapter at `@copilotkit/runtime/langgraph` export path
- LangGraph.js provides sub-graphs, supervisor pattern, checkpointing (PostgresSaver), and interrupt/HITL — all in TypeScript
- Daytona SDK calls are native TypeScript — no HTTP bridge between services
- Single language, single deployment, single process
- The Python service's stub tools, hardcoded sub-graphs, and mock memory have zero value to preserve

**Alternatives considered**:
- Python LangGraph (constitution mandate): Rejected — requires separate service, two languages, two deployments, and the current Python code is 100% stubs
- CopilotKit BuiltInAgent: Rejected — no checkpointing, no multi-agent delegation, no persistent state
- OpenAI Agents SDK: Rejected — locked to OpenAI models only; project needs multi-provider support (Anthropic, Google, Groq, Mistral, OpenRouter)

## Decision 2: CopilotKit + LangGraph.js Integration Pattern

**Chosen**: `@copilotkit/runtime/langgraph` adapter

**Pattern**:
```typescript
import { CopilotRuntime } from "@copilotkit/runtime";
import { LangGraphAgent } from "@copilotkit/runtime/langgraph";

const agent = new LangGraphAgent({
  graph: compiledGraph,        // LangGraph.js StateGraph.compile()
  modelName: "anthropic/claude-sonnet-4",
});

export const runtime = new CopilotRuntime({
  agents: { default: agent },
});
```

**Rationale**: CopilotKit's docs list `langgraph-typescript` as a known framework. The `@copilotkit/runtime/langgraph` export provides the adapter. This is the same pattern as the Python `LangGraphAGUIAgent` but in TypeScript.

**Alternatives considered**:
- Custom AG-UI adapter: Too much work, CopilotKit already provides one
- `remoteEndpoints` to a separate service: Defeats the purpose of removing Python

## Decision 3: Daytona SDK Tool Integration

**Chosen**: `@daytonaio/sdk` ^0.187.0 — direct calls from LangGraph tool handlers

**Rationale**: Daytona's TypeScript SDK provides everything needed:
- `Sandbox.process` — code execution (`codeRun`, `executeCommand`, `createSession`, `createPty`)
- `Sandbox.fs` — file operations (`listFiles`, `downloadFile`, `uploadFile`, `deleteFile`, `moveFiles`)
- `Sandbox.git` — git operations (`clone`, `status`, `add`, `commit`, `push`, `pull`)
- `Sandbox.computerUse` — browser automation (`start`, `screenshot`, `mouse`, `keyboard`)
- `Sandbox.codeInterpreter` — stateful Python execution with streaming output
- `Daytona` — lifecycle management (`create`, `get`, `start`, `stop`, `delete`)

**Alternatives considered**:
- Daytona REST API directly: SDK is cleaner, type-safe, and handles auth
- Daytona Python SDK: Would require keeping Python service

## Decision 4: Web Search Provider

**Chosen**: Tavily Search API

**Rationale**: 
- Tavily is purpose-built for AI/agent search with structured results
- Free tier: 1,000 searches/month
- Returns title, URL, content snippet — exactly what FR-008 requires
- LangChain has a `@langchain/community` Tavily tool integration

**Alternatives considered**:
- Brave Search API: Good but less agent-friendly output format
- Google Custom Search: Complex setup, quota limits
- Serper.dev: Good but another API key to manage

## Decision 5: Model Provider Resolution

**Chosen**: Use `@ai-sdk/*` providers via LangChain.js's `ChatOpenAI` compatible interface, resolved per-conversation from user settings

**Rationale**: 
- User API keys are encrypted in the `api_keys` table
- The model selector already exists in the UI (`model-selector.tsx`)
- LangChain.js supports OpenAI-compatible APIs — Groq, Mistral, OpenRouter all work through `ChatOpenAI` with custom `baseURL`
- Anthropic uses `ChatAnthropic` from `@langchain/anthropic`
- Google uses `ChatGoogleGenerativeAI` from `@langchain/google-genai`

## Decision 6: Checkpointing

**Chosen**: LangGraph.js `PostgresSaver` — same Neon Postgres database

**Rationale**:
- LangGraph.js supports `@langchain/langgraph-checkpoint-postgres`
- Uses the same `DATABASE_URL` connection
- Stores checkpoints in dedicated tables (not interfering with app tables)
- Enables resuming interrupted agent loops
- Thread ID = conversation ID for natural mapping

## Decision 7: Sandbox Lifecycle Strategy

**Chosen**: Lazy creation per conversation, auto-stop after 15min, auto-archive after 24h

**Rationale**:
- Daytona charges for running sandboxes — lazy creation minimizes costs
- Auto-stop at 15min (Daytona default) prevents idle waste
- Auto-archive at 24h preserves state for user return without running costs
- On conversation resume: check `sandboxId` → if stopped, call `sandbox.start()` → if archived, create new sandbox
- Sandbox `sandboxId` stored on conversations table (FR-013)

## Decision 8: Constitution Amendment Required

**Issue**: Constitution Principle V mandates Python LangGraph. This spec uses LangGraph.js.

**Amendment**: Change Principle V from "Python LangGraph" to "LangGraph.js (TypeScript)". Key changes:
- Agent backend runs as LangGraph.js inside Next.js process (not separate Python service)
- CopilotKit's `@copilotkit/runtime/langgraph` adapter replaces Python `LangGraphAGUIAgent`
- Daytona SDK is TypeScript — called directly from tool handlers
- Checkpointing still uses PostgresSaver (JS version)
- Multi-agent still uses sub-graphs (JS version)
- All other principles (CopilotKit-first, Drizzle, Better Auth, workspace as surface) unchanged
