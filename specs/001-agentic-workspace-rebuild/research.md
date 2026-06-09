# Research: Dexter v3 — Full Agentic Workspace Rebuild

**Phase**: 0 (Research) | **Date**: 2026-06-09 | **Spec**: [spec.md](./spec.md)

This document resolves all technical unknowns and records key decisions for the agentic workspace rebuild.

---

## 1. Agent Runtime: LangGraph Python Backend

### Decision

Use **LangGraph** (`langgraph`) as the agent runtime running in a separate **Python FastAPI service**. CopilotKit's Next.js runtime connects to the Python agent via the **AG-UI protocol**.

### Rationale

- Constitution Principle V mandates a LangGraph Python agent backend — no `BuiltInAgent`, no Inngest.
- CopilotKit was designed for this exact architecture: Frontend ←→ Runtime ←→ Agent Backend as three layers connected by AG-UI. The frontend code doesn't change.
- LangGraph provides capabilities that CopilotKit's `BuiltInAgent` lacks:
  - **Persistent state** via PostgresSaver checkpointing
  - **Multi-agent delegation** via sub-graphs
  - **Long-running task support** — agent runs survive crashes, restarts, browser closes
  - **Memory** — built-in checkpoint state + custom memory tools

### Alternatives Considered

1. **CopilotKit BuiltInAgent** — rejected by constitution; no persistence, no delegation, no checkpointing.
2. **Raw AI SDK v6 + custom agent loop** — rejected as it duplicates CopilotKit's capabilities and violates Principle I (CopilotKit-First UI).
3. **LangGraph + custom streaming (no CopilotKit)** — rejected as it requires rebuilding all chat UI, generative UI, HITL, and shared state that CopilotKit provides.

### Key Implementation Details

```python
# services/agent/app/main.py
from fastapi import FastAPI
from copilotkit.integrations.fastapi import add_fastapi_endpoint
from copilotkit import CopilotKitSDK, LangGraphAgent
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from app.graph.builder import build_agent_graph

app = FastAPI()

# Build the LangGraph graph
graph = build_agent_graph()

# Set up PostgresSaver checkpointer
checkpointer = AsyncPostgresSaver.from_conn_string(DATABASE_URL)
await checkpointer.setup()  # Creates checkpoint tables

# Expose as AG-UI endpoint via CopilotKit Python SDK
sdk = CopilotKitSDK(
    agents=[
        LangGraphAgent(
            name="dexter",
            graph=graph,
            checkpointer=checkpointer,
        ),
    ],
)

add_fastapi_endpoint(app, sdk, "/api/agent")
```

```typescript
// src/lib/copilot/runtime.ts — Next.js side
import { CopilotRuntime } from "@copilotkit/runtime";

const runtime = new CopilotRuntime({
  // No BuiltInAgent — forward to remote Python agent
  remoteAgents: [
    {
      name: "dexter",
      url: process.env.AGENT_SERVICE_URL + "/api/agent",
    },
  ],
});
```

---

## 2. Authentication: Better Auth Migration

### Decision

Replace **NextAuth v5** (`next-auth` + `@auth/prisma-adapter`) with **Better Auth**.

### Rationale

- Constitution Principle IV mandates Better Auth over NextAuth.
- NextAuth v5 is still in beta with breaking changes across releases.
- Better Auth offers stable API, better TypeScript support, simpler App Router integration.
- Better Auth handles email/password credentials, OAuth (Google, GitHub), and session management natively.

### Alternatives Considered

1. **Keep NextAuth v5** — rejected by constitution; beta status and Prisma coupling.
2. **Clerk** — rejected as third-party hosted auth adds vendor lock-in and cost.
3. **Lucia** — rejected as the project is archived; Better Auth is the spiritual successor.

### Key Implementation Details

- Configuration in `src/lib/auth/index.ts` using Better Auth's `createAuth()` with database adapter.
- Supports `emailPassword` provider and `google`/`github` OAuth providers.
- Session strategy: database sessions (not JWT-only) for Better Auth's built-in session management.
- Middleware in `src/middleware.ts` rewrites to use Better Auth's `authClient` for route protection.
- Remove: `next-auth`, `@auth/prisma-adapter`, `src/app/api/auth/[...nextauth]/route.ts`.
- Add: `better-auth` package, `src/app/api/auth/route.ts` (Better Auth handler).

---

## 3. Database: Drizzle ORM Migration

### Decision

Replace **Prisma** with **Drizzle ORM**. Consolidate from 20 Prisma models to 8 functional tables (7 app tables + memories table).

### Rationale

- Constitution Principle III mandates Drizzle over Prisma.
- Drizzle is SQL-first, zero-overhead, supports pgvector natively.
- Prisma's pgvector story requires adapters; Drizzle has native `vector` column type.
- Current Prisma schema has 20 models, many unused — consolidate to only what the spec requires.

### Alternatives Considered

1. **Keep Prisma** — rejected by constitution; heavy runtime engine, poor pgvector support.
2. **Kysely** — rejected as less ergonomic for schema definition.
3. **Raw SQL** — rejected as too error-prone for the scope of this project.

### Key Implementation Details

- Schema files in `src/lib/db/schema/` with per-table files.
- Drizzle client in `src/lib/db/index.ts` using `drizzle(pgPool)`.
- Migrations via `drizzle-kit generate` + `drizzle-kit migrate`.
- pgvector columns: `vector('embedding', { dimensions: 1536 })` in documents and memories tables.
- Remove: `prisma/` directory, `@prisma/client`, `@prisma/adapter-pg`, `prisma generate` from build.

### Tables (8)

1. `users` — id, email, name, image, role, password, createdAt, updatedAt
2. `conversations` — id, userId, title, model, projectId, pinned, createdAt, updatedAt
3. `messages` — id, conversationId, role, content, toolCalls, toolCallId, model, createdAt
4. `documents` — id, userId, type, title, content, metadata, embedding, createdAt, updatedAt
5. `projects` — id, userId, name, description, instructions, createdAt, updatedAt
6. `api_keys` — id, userId, provider, encryptedKey, createdAt
7. `mcp_servers` — id, userId, name, transportType, command, url, args, env, enabled, createdAt
8. `memories` — id, userId, content, embedding, tags, sourceConversationId, createdAt

---

## 4. Workspace Panel Architecture

### Decision

Implement six workspace surfaces (Artifacts, Browser, Document, Terminal, Files, Agent Output) as self-contained components communicating exclusively through a centralized Zustand store. Workspace state is driven exclusively by agent tool calls.

### Rationale

- Constitution Principle II mandates agent tools drive workspace state.
- Constitution Principle VI mandates surfaces are decoupled (no cross-surface imports, no prop drilling).
- WORKSPACE-ARCHITECTURE.md provides detailed architecture for each surface, the Zustand store, and the three-panel layout.

### Key Implementation Details

- **Layout**: Three-panel (sidebar, chat, workspace) with resizable divider using `react-resizable-panels`.
- **Zustand store**: `useWorkspaceStore` manages panel visibility, active tab, all surface data, and activity log.
- **Surfaces**: Each in `src/components/workspace/surfaces/<name>/`, subscribes to relevant store slices.
- **Tool renderers**: CopilotKit `useCopilotAction` definitions in `src/components/copilot/tool-renderers/` trigger workspace state mutations.
- **Frontend tools** receive tool call results from LangGraph via AG-UI → CopilotKit pipeline.

---

## 5. Multi-Provider Model Routing

### Decision

Use **LangChain provider packages** for model routing on the Python agent side. Each provider maps to a LangChain ChatModel instance. On the CopilotKit JS side, AI SDK v6 is used for any JS-side model configuration only.

### Rationale

- Constitution Principle V mandates LangGraph for the agent backend.
- LangChain provides first-class support for all required providers: OpenAI, Anthropic, Google, Groq, Mistral, xAI, DeepSeek, OpenRouter.
- Ollama is supported via `ChatOpenAI` with a custom base URL.
- API keys are stored encrypted in the `api_keys` table (Drizzle) and passed to the Python agent via AG-UI request context.

### Key Implementation Details

```python
# services/agent/app/models/providers.py
from langchain_anthropic import ChatAnthropic
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI

def resolve_provider(model_id: str, api_key: str, base_url: str | None = None):
    provider, model = model_id.split(":", 1)
    match provider:
        case "openai":
            return ChatOpenAI(model=model, api_key=api_key)
        case "anthropic":
            return ChatAnthropic(model=model, api_key=api_key)
        case "google":
            return ChatGoogleGenerativeAI(model=model, api_key=api_key)
        case "ollama":
            return ChatOpenAI(
                model=model,
                api_key="dummy",
                base_url=base_url or "http://localhost:11434/v1",
            )
        # ... etc.
```

---

## 6. MCP Client Integration

### Decision

Use the official `@modelcontextprotocol/sdk` TypeScript SDK to connect to user-configured MCP servers. MCP tool discovery stays in the Next.js layer. Discovered tool schemas are passed to the Python agent as part of the AG-UI request context.

### Rationale

- MCP SDKs are TypeScript-native. Running MCP client connections in Python would duplicate the ecosystem.
- The CopilotKit runtime in Next.js handles MCP tool discovery per-user.
- Tool schemas are serialized and passed to the LangGraph agent via AG-UI metadata.
- MCP tool executions are forwarded back to the Next.js side via AG-UI events.

### Alternatives Considered

1. **Python MCP client** — rejected as it duplicates the TypeScript ecosystem and adds complexity.
2. **Static tool definitions only** — rejected as it defeats the extensibility goal (User Story 6).
3. **Custom MCP implementation** — rejected as the official SDK is well-maintained.

---

## 7. Durable Agent Execution with LangGraph Checkpointing

### Decision

Use **LangGraph's PostgresSaver** for durable execution. Every agent step is persisted as a checkpoint. No Inngest.

### Rationale

- Constitution Principle V explicitly states: "Inngest is NOT used — LangGraph handles durability natively."
- PostgresSaver persists every agent step (LLM call, tool execution, state update) as a checkpoint in PostgreSQL.
- Agent runs survive crashes, server restarts, and browser closes — resuming from the last saved checkpoint.
- No external service needed — PostgresSaver uses the same Postgres instance (different tables).

### Alternatives Considered

1. **Inngest** — rejected by constitution; unnecessary with LangGraph checkpointing.
2. **Trigger.dev** — rejected as it adds an external service dependency.
3. **BullMQ + Redis** — rejected as it adds Redis infrastructure dependency.

### Key Implementation Details

```python
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

checkpointer = AsyncPostgresSaver.from_conn_string(DATABASE_URL)
await checkpointer.setup()  # Creates: checkpoints, checkpoint_writes, checkpoint_blobs

# Integrated into graph compilation
graph = builder.compile(checkpointer=checkpointer)
```

- Checkpoint tables are managed by PostgresSaver (not Drizzle).
- `checkpointer.setup()` creates the required tables on first run.
- Each agent run gets a `thread_id` that maps to a conversation.
- Resume: `graph.invoke(input, config={"configurable": {"thread_id": thread_id}})`

---

## 8. UI Component Strategy

### Decision

Keep existing Radix UI + Tailwind CSS primitives. Hand-roll compound components using CVA (class-variance-authority). No shadcn/ui CLI.

### Rationale

- Constitution Technology Constraints specify Radix UI primitives + Tailwind CSS, no shadcn/ui CLI.
- Existing `src/components/ui/` already has hand-rolled components using this pattern.
- New workspace surfaces will follow the same pattern.

---

## 9. Multi-Agent Delegation via LangGraph Sub-Graphs

### Decision

Define specialist sub-agents as **LangGraph sub-graphs**. The main orchestrator graph includes a router node that conditionally delegates to sub-graphs as nodes.

### Rationale

- Constitution Principle V mandates multi-agent delegation via LangGraph sub-graphs.
- LangGraph's sub-graph pattern allows the main graph to delegate to a sub-graph as a node.
- Sub-graphs have their own state (extending parent state), run their own LLM calls and tool executions, and return results to the parent.
- This is the idiomatic LangGraph pattern — no external orchestrator needed.

### Key Implementation Details

```python
# services/agent/app/graph/subgraphs/research.py
from langgraph.graph import StateGraph

research_graph = StateGraph(ResearchState)
research_graph.add_node("plan", plan_search)
research_graph.add_node("search", execute_search)
research_graph.add_node("synthesize", synthesize_results)
research_graph.add_edge("plan", "search")
research_graph.add_edge("search", "synthesize")

# services/agent/app/graph/builder.py — main graph
main_graph = StateGraph(AgentState)
main_graph.add_node("router", route_to_agent)
main_graph.add_node("llm", call_llm)
main_graph.add_node("tools", execute_tools)
main_graph.add_node("research", research_graph.compile())  # Sub-graph as node
main_graph.add_node("code", code_graph.compile())          # Sub-graph as node
```

---

## 10. Memory Tool with pgvector

### Decision

Implement `save_memory` and `recall_memory` LangGraph tools that write to and read from a `memories` Drizzle table with pgvector embedding columns.

### Rationale

- User Story 9 requires agent memory and recall across sessions.
- Using the same PostgreSQL + pgvector avoids additional infrastructure.
- The memory table is managed by Drizzle (schema migrations) but the Python agent reads/writes via direct SQL.

### Key Implementation Details

```python
# services/agent/app/tools/memory.py
from langchain_core.tools import tool
import asyncpg

@tool
async def save_memory(content: str, tags: list[str] = None) -> str:
    """Store important information for future recall."""
    embedding = await generate_embedding(content)
    async with pool.acquire() as conn:
        await conn.execute(
            """INSERT INTO memories (id, user_id, content, embedding, tags)
               VALUES ($1, $2, $3, $4, $5)""",
            str(uuid4()), user_id, content, embedding, json.dumps(tags or []),
        )
    return f"Memory saved: {content[:50]}..."

@tool
async def recall_memory(query: str, top_k: int = 5) -> list[dict]:
    """Recall relevant memories using semantic search."""
    query_embedding = await generate_embedding(query)
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT content, tags, created_at,
                      1 - (embedding <=> $1) as similarity
               FROM memories
               WHERE user_id = $2
               ORDER BY embedding <=> $1
               LIMIT $3""",
            query_embedding, user_id, top_k,
        )
    return [dict(r) for r in rows]
```

---

## 11. Migration Order

### Phase 0: Foundation Swaps (Days 1–2)
1. Replace Prisma → Drizzle (convert schema, migrate data, update all queries)
2. Replace NextAuth → Better Auth (rewrite auth config, update middleware, update UI)
3. Add `memories` table to Drizzle schema
4. Clean up AppleDouble files
5. Verify existing UI still works with new auth + DB layers

### Phase 1: Python Agent Service (Days 3–5)
1. Scaffold `services/agent/` with FastAPI + LangGraph
2. Build main agent graph (LLM node + tool execution node)
3. Implement core tools (search, artifacts, documents, browser, terminal, files)
4. Configure PostgresSaver checkpointer
5. Set up provider resolution for all model providers
6. Wire CopilotKit Python SDK AG-UI endpoint

### Phase 2: CopilotKit Runtime Bridge (Days 5–6)
1. Configure CopilotKit runtime to point to Python agent
2. Remove old `src/app/api/chat/route.ts`
3. Verify AG-UI streaming end-to-end

### Phase 3: Workspace Surfaces (Days 6–10)
1. Build three-panel layout with resizable divider
2. Implement Zustand workspace store
3. Build Artifacts surface
4. Build Document surface (TipTap)
5. Build Browser surface (screenshot-based)
6. Build Terminal surface (xterm.js)
7. Build Files surface (tree view)
8. Build Agent Output surface

### Phase 4: CopilotKit Frontend Tools (Days 10–11)
1. Register `useCopilotAction` hooks for workspace tools
2. Build generative UI renderers (inline tool cards)
3. Human-in-the-loop approval UI

### Phase 5: Multi-Provider + MCP (Days 11–13)
1. API key management UI and encrypted storage
2. Model selector component
3. MCP server configuration UI
4. MCP registry and dynamic tool loading
5. MCP → LangGraph tool schema bridge

### Phase 6: Sub-Agent Delegation + Memory (Days 13–15)
1. Define research and code sub-graphs
2. Implement router node for conditional delegation
3. Implement memory tools (save/recall with pgvector)
4. Memory management UI in settings

### Phase 7: Polish + Testing (Days 15–16)
1. Checkpoint recovery testing
2. Human-in-the-loop flow testing
3. End-to-end integration tests
4. Performance testing
5. Bug fixes

---

*Updated for LangGraph Python agent backend architecture — replaces BuiltInAgent + Inngest approach.*
