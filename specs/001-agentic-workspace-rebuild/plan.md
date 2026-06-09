# Implementation Plan: Dexter v3 — Full Agentic Workspace Rebuild

**Branch**: `001-agentic-workspace-rebuild` | **Date**: 2026-06-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-agentic-workspace-rebuild/spec.md`

## Summary

Rebuild Dexter v2 from a thin chat wrapper into a true agentic AI workspace. The core transformation introduces a **separate Python agent service** using **LangGraph StateGraph** for the agent backend, connected to the CopilotKit frontend via the **AG-UI protocol**. The agent runs as a FastAPI app in `services/agent/`, using **PostgresSaver** for persistent checkpointing (same Postgres database, different tables), **sub-graphs** for multi-agent delegation, and a **memory tool** that writes to a Drizzle `memories` table with embedding vectors for semantic recall.

The frontend is unchanged — all CopilotKit React code (`useCopilotChat`, `useCopilotAction`, `CopilotChat`, generative UI, human-in-the-loop) stays exactly the same. Foundation swaps replace Prisma with Drizzle ORM, NextAuth with Better Auth. Inngest is dropped entirely; LangGraph handles durability natively.

## Technical Context

**Language/Version**:
- **Frontend**: TypeScript 5.x strict mode, Node.js 22+
- **Agent Backend**: Python 3.11+, LangGraph, FastAPI

**Primary Dependencies**:

| Layer | Technology | Packages |
|-------|-----------|----------|
| **Framework** | Next.js 16 (App Router) | `next` — read `node_modules/next/dist/docs/` for breaking changes |
| **Agent Backend** | LangGraph StateGraph (Python) | `langgraph`, `langchain-core`, `langchain-anthropic`, `langchain-openai` |
| **Agent Server** | FastAPI (Python) | `fastapi`, `uvicorn`, `copilotkit` (Python SDK for AG-UI) |
| **Agent Checkpointing** | LangGraph PostgresSaver | `langgraph-checkpoint-postgres` |
| **Frontend Chat** | CopilotKit React | `@copilotkit/react-core`, `@copilotkit/react-ui` |
| **CopilotKit Runtime** | CopilotKit Runtime (Next.js) | `@copilotkit/runtime` — bridges frontend to AG-UI agent |
| **AI Providers (JS side)** | AI SDK v6 | `ai` ^6.0.198 (model routing on CopilotKit side only) |
| **AI Providers (Python side)** | LangChain providers | `langchain-anthropic`, `langchain-openai`, `langchain-google-genai` |
| **Database** | Drizzle ORM + PostgreSQL + pgvector | `drizzle-orm`, `drizzle-kit`, `postgres` |
| **Auth** | Better Auth | `better-auth` (replacing `next-auth` + `@auth/prisma-adapter`) |
| **MCP Client** | MCP SDK | `@modelcontextprotocol/sdk` (TypeScript, in Next.js layer) |
| **Rich Text** | TipTap | `@tiptap/react`, `@tiptap/starter-kit` |
| **State Management** | Zustand | `zustand` for workspace client state |
| **UI Primitives** | Radix UI + Tailwind CSS + CVA | Hand-rolled compound components, no shadcn/ui CLI |
| **Terminal** | xterm.js | `@xterm/xterm`, `@xterm/addon-fit` |
| **Testing** | Vitest (JS) + pytest (Python) | Server actions, tool execution, auth, workspace store, agent graph |

**Storage**: PostgreSQL with pgvector extension — shared between Next.js (Drizzle) and Python agent (PostgresSaver via asyncpg). Different table namespaces.

**Architecture**:
```
┌──────────────────────────────────────────────────────────────────┐
│  Browser (React)                                                 │
│                                                                  │
│  ┌──────────────┐  ┌──────────────────────────────────────────┐ │
│  │ CopilotKit    │  │ Workspace Panel (Zustand store)           │ │
│  │ <CopilotChat> │  │ ┌─────────┬─────────┬─────────┬───────┐ │ │
│  │ - Messages    │  │ │Artifact │Browser  │Document │Term...│ │ │
│  │ - Gen UI      │  │ └─────────┴─────────┴─────────┴───────┘ │ │
│  │ - HITL        │  │                                          │ │
│  └──────┬────────┘  └──────────────────────────────────────────┘ │
│         │                                                        │
│  CopilotKitProvider  runtimeUrl="/api/copilotkit"                │
└─────────┬────────────────────────────────────────────────────────┘
          │ AG-UI Protocol (SSE)
┌─────────▼────────────────────────────────────────────────────────┐
│  Next.js API Route: /api/copilotkit                               │
│                                                                   │
│  CopilotRuntime → forwards to AG-UI agent endpoint               │
│  (thin shim — no BuiltInAgent, no agent logic here)               │
│  Handles: auth context, MCP registry, user-scoped data            │
└─────────┬────────────────────────────────────────────────────────┘
          │ AG-UI Protocol (HTTP/SSE)
┌─────────▼────────────────────────────────────────────────────────┐
│  Python Agent Service (FastAPI) — services/agent/                 │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  LangGraph StateGraph                                        │ │
│  │                                                              │ │
│  │  ┌─────────┐    ┌──────────┐    ┌──────────┐               │ │
│  │  │  Router  │───▶│ Research │───▶│   Code   │  Sub-graphs  │ │
│  │  │  (main)  │    │  Agent   │    │  Agent   │               │ │
│  │  └─────────┘    └──────────┘    └──────────┘               │ │
│  │       │                                                      │ │
│  │       ▼                                                      │ │
│  │  ┌──────────────┐  ┌──────────────┐                         │ │
│  │  │  LLM Node    │  │  Tool Node   │  Core nodes             │ │
│  │  │  (ChatModel)  │  │  (execute)   │                         │ │
│  │  └──────────────┘  └──────────────┘                         │ │
│  │                                                              │ │
│  │  Tools: search, create_artifact, edit_document, browse_web, │ │
│  │         execute_code, manage_files, recall_memory,          │ │
│  │         save_memory, delegate_to_agent                      │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  PostgresSaver ──▶ same Postgres DB (checkpoint tables)           │
│  Memory Tool   ──▶ memories table (via SQL, Drizzle schema)      │
└───────────────────────────────────────────────────────────────────┘
          │
┌─────────▼────────────────────────────────────────────────────────┐
│  PostgreSQL + pgvector                                            │
│                                                                   │
│  Drizzle tables: users, conversations, messages, documents,       │
│                  projects, api_keys, mcp_servers, memories         │
│  LangGraph tables: checkpoints, checkpoint_writes,                │
│                    checkpoint_blobs (managed by PostgresSaver)     │
└───────────────────────────────────────────────────────────────────┘
```

**Target Platform**: Web application (desktop browsers 1280px+), deployed on Node.js 22+ (frontend) + Python 3.11+ (agent service) alongside PostgreSQL + pgvector.

**Performance Goals**:
- Agent responses begin streaming within 3 seconds (SC-002)
- Workspace surfaces render content within 2 seconds of tool invocation (SC-003)
- Panel resize at 60fps with no layout shift (SC-009)
- Conversation loading under 500ms for 50 conversations (SC-012)
- 95% of tool calls complete under 10 seconds (SC-006)
- Checkpoint resume within 5 seconds of reconnection (SC-008)

**Constraints**:
- Three-panel layout targets desktop 1280px+; graceful degradation on smaller screens, not mobile-optimized
- Multi-user collaboration is out of scope (private workspaces only)
- Browser surface is screenshot-based only (no live interactive browser in v3)
- Memory embedding uses pgvector — no additional vector DB infrastructure
- Users provide own API keys; Dexter does not bundle or resell access
- Sub-agent delegation patterns defined at design time in LangGraph graph structure
- Python agent service must be deployable as a single process (no distributed coordination needed)

**Scale/Scope**:
- Single-user private workspaces
- 8+ model providers with BYOK (routed through LangChain providers on Python side)
- 6 workspace surfaces
- Up to 50 conversations per user with 100+ messages each
- 10+ MCP servers per user without degradation (SC-007)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. CopilotKit-First UI** | ✅ PASS | All chat, generative UI, HITL, and shared state route through CopilotKit React components. No custom SSE wiring. No hand-rolled chat state. Frontend is unchanged from the CopilotKit perspective. |
| **II. Agent Tools Drive Workspace** | ✅ PASS | Workspace surfaces render in response to agent tool calls only. Zustand store is single source of truth; mutations flow through tool handlers registered via `useCopilotAction`. |
| **III. Drizzle Over Prisma** | ✅ PASS | All DB access via Drizzle ORM. Prisma removed. Schema in `src/db/schema/`. Migrations via Drizzle Kit. pgvector via native support. |
| **IV. Better Auth Over NextAuth** | ✅ PASS | Better Auth for all auth. `next-auth` and `@auth/prisma-adapter` removed. |
| **V. LangGraph Agent Backend** | ✅ PASS | Agent backend runs as a separate Python FastAPI service using LangGraph StateGraph. CopilotKit runtime connects via AG-UI protocol. PostgresSaver for checkpointing. Sub-graphs for multi-agent delegation. Memory tool writes to Drizzle `memories` table. No BuiltInAgent. No Inngest. |
| **VI. Workspace as Surface Pattern** | ✅ PASS | Each surface in `src/components/workspace/surfaces/`. Communication via Zustand store only. No cross-surface imports. |
| **VII. No Speculation** | ✅ PASS | Only building what the spec describes. No speculative features. Live browser interaction deferred. Multi-user collab deferred. |
| **VIII. Test Critical Paths** | ✅ PASS | Vitest for server actions, workspace state transitions, auth flows. pytest for agent graph, tool execution, checkpointing. UI components not tested unless non-trivial logic. |

**Gate Result**: ✅ ALL PRINCIPLES PASS — proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/001-agentic-workspace-rebuild/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── agent-tools.md       # LangGraph agent tool definitions
│   ├── agent-service.md     # Python agent service API (FastAPI + AG-UI)
│   ├── copilotkit-runtime.md # CopilotKit runtime configuration
│   └── workspace-store.md   # Workspace Zustand store API
└── tasks.md             # Phase 2 output (NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
services/
└── agent/                           # Python agent service (separate process)
    ├── pyproject.toml               # Python project config (uv/poetry)
    ├── requirements.txt             # Pinned dependencies
    ├── Dockerfile                   # Container build for agent service
    │
    ├── app/
    │   ├── __init__.py
    │   ├── main.py                  # FastAPI app entry point + AG-UI endpoint
    │   ├── config.py                # Environment configuration
    │   │
    │   ├── graph/
    │   │   ├── __init__.py
    │   │   ├── state.py             # LangGraph state definitions (TypedDict)
    │   │   ├── builder.py           # StateGraph construction (main orchestrator)
    │   │   ├── nodes/
    │   │   │   ├── __init__.py
    │   │   │   ├── router.py        # Router node — decides which sub-graph to use
    │   │   │   ├── llm.py           # LLM call node — invokes ChatModel
    │   │   │   └── tools.py         # Tool execution node — runs tool calls
    │   │   │
    │   │   └── subgraphs/
    │   │       ├── __init__.py
    │   │       ├── research.py      # Research sub-graph (search + synthesize)
    │   │       └── code.py          # Code generation sub-graph (plan + generate)
    │   │
    │   ├── tools/
    │   │   ├── __init__.py
    │   │   ├── search.py            # Web search tool
    │   │   ├── artifacts.py         # Create/update artifact tool
    │   │   ├── documents.py         # Document CRUD tool
    │   │   ├── browser.py           # Browser navigation + screenshot tool
    │   │   ├── terminal.py          # Terminal execution tool
    │   │   ├── files.py             # File system operations tool
    │   │   ├── memory.py            # Save/recall memory tool (pgvector)
    │   │   └── delegate.py          # Sub-agent delegation tool
    │   │
    │   ├── models/
    │   │   ├── __init__.py
    │   │   └── providers.py         # LangChain model provider resolution
    │   │
    │   ├── db/
    │   │   ├── __init__.py
    │   │   ├── connection.py        # AsyncPG connection pool
    │   │   └── memory.py            # Memory CRUD (reads/writes memories table)
    │   │
    │   └── prompts/
    │       ├── __init__.py
    │       └── system.py            # System prompts for agent and sub-agents
    │
    └── tests/
        ├── test_graph.py            # Graph structure and routing tests
        ├── test_tools.py            # Tool execution tests
        └── test_checkpoint.py       # PostgresSaver checkpoint tests

src/
├── app/
│   ├── api/
│   │   ├── copilotkit/
│   │   │   └── route.ts              # CopilotRuntime endpoint (AG-UI protocol)
│   │   │                             # Forwards to Python agent via AG-UI
│   │   ├── auth/
│   │   │   └── route.ts              # Better Auth handler (replaces [...nextauth])
│   │   └── health/
│   │       └── route.ts              # Health check (keep)
│   ├── (auth)/
│   │   ├── login/page.tsx            # Sign-in page (rewrite for Better Auth)
│   │   └── sign-up/page.tsx          # Registration page (rewrite for Better Auth)
│   ├── (app)/
│   │   ├── layout.tsx                # App shell with CopilotKitProvider + three-panel
│   │   ├── chat/
│   │   │   └── page.tsx              # Main chat page with <CopilotChat>
│   │   ├── settings/
│   │   │   └── page.tsx              # Settings (API keys, MCP servers, profile)
│   │   └── projects/
│   │       └── page.tsx              # Projects view
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Landing/redirect
│   └── not-found.tsx                 # 404 page
│
├── components/
│   ├── layout/
│   │   ├── app-shell.tsx             # Three-panel layout orchestrator
│   │   ├── resize-handle.tsx         # Styled resize handle for panel divider
│   │   ├── header.tsx                # Top bar (keep, adapt)
│   │   └── app-sidebar.tsx           # Conversation history sidebar (keep, adapt)
│   │
│   ├── workspace/
│   │   ├── workspace-panel.tsx       # Main panel container + tab router
│   │   ├── workspace-tabs.tsx        # Tab bar for surface switching
│   │   ├── workspace-store.ts        # Zustand store (single source of truth)
│   │   │
│   │   ├── surfaces/
│   │   │   ├── artifacts/
│   │   │   │   ├── artifact-surface.tsx
│   │   │   │   └── artifact-viewer.tsx
│   │   │   ├── browser/
│   │   │   │   ├── browser-surface.tsx
│   │   │   │   ├── browser-toolbar.tsx
│   │   │   │   └── browser-preview.tsx
│   │   │   ├── document/
│   │   │   │   ├── document-surface.tsx
│   │   │   │   ├── tiptap-editor.tsx
│   │   │   │   └── document-toolbar.tsx
│   │   │   ├── terminal/
│   │   │   │   ├── terminal-surface.tsx
│   │   │   │   └── xterm-wrapper.tsx
│   │   │   ├── files/
│   │   │   │   ├── files-surface.tsx
│   │   │   │   ├── file-tree.tsx
│   │   │   │   └── file-preview.tsx
│   │   │   └── agent-output/
│   │   │       ├── agent-output-surface.tsx
│   │   │       └── streaming-text.tsx
│   │   │
│   │   └── shared/
│   │       ├── workspace-header.tsx
│   │       └── workspace-activity.tsx
│   │
│   ├── copilot/
│   │   ├── tool-renderers/           # CopilotKit generative UI renderers
│   │   │   ├── render-artifact.tsx
│   │   │   ├── render-browser.tsx
│   │   │   ├── render-document.tsx
│   │   │   ├── render-search.tsx
│   │   │   └── render-code-execution.tsx
│   │   └── frontend-tools.ts         # useCopilotAction definitions
│   │
│   └── ui/                           # Radix + Tailwind primitives (keep existing)
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       └── ... (existing UI components)
│
├── lib/
│   ├── copilot/
│   │   ├── runtime.ts                # CopilotRuntime setup — forwards to AG-UI agent
│   │   └── providers.ts              # AI SDK provider resolution (JS-side routing)
│   │
│   ├── db/
│   │   ├── index.ts                  # Drizzle client instance
│   │   ├── schema/
│   │   │   ├── users.ts
│   │   │   ├── conversations.ts
│   │   │   ├── messages.ts
│   │   │   ├── documents.ts
│   │   │   ├── projects.ts
│   │   │   ├── api-keys.ts
│   │   │   ├── mcp-servers.ts
│   │   │   └── memories.ts           # NEW: Agent memory store (embedding vectors)
│   │   └── migrations/               # Drizzle Kit generated migrations
│   │
│   ├── auth/
│   │   ├── index.ts                  # Better Auth configuration
│   │   └── session.ts                # Session helpers
│   │
│   ├── mcp/
│   │   ├── registry.ts               # MCP server connection registry
│   │   └── client.ts                 # MCP client factory
│   │
│   ├── server/
│   │   └── actions/                  # Server actions (Drizzle-backed)
│   │       ├── conversations.ts
│   │       ├── messages.ts
│   │       ├── projects.ts
│   │       └── settings.ts
│   │
│   └── shared/
│       ├── types.ts                  # Shared TypeScript types
│       └── utils.ts                  # Shared utilities
│
├── middleware.ts                      # Auth middleware (rewrite for Better Auth)
│
└── __tests__/
    ├── agent-tools.test.ts           # Tool definitions and execution
    ├── auth.test.ts                  # Auth flows
    ├── workspace-store.test.ts       # Workspace state transitions
    └── server-actions.test.ts        # Server action validation
```

**Structure Decision**: Two-service architecture:

1. **Next.js Frontend** (monolithic App Router in `src/`) — handles UI, CopilotKit runtime (thin AG-UI bridge), Drizzle ORM for app data, Better Auth, MCP client registry, and server actions for non-agent data mutations.

2. **Python Agent Service** (`services/agent/`) — FastAPI app running LangGraph StateGraph with PostgresSaver checkpointing, LangChain providers for model routing, and a memory tool backed by the shared Postgres database.

The CopilotKit runtime in Next.js does NOT use `BuiltInAgent`. Instead, it configures a custom AG-UI agent endpoint that points to the Python service. The CopilotKit Python SDK (`copilotkit` package) exposes the LangGraph graph as an AG-UI endpoint on the FastAPI side. This is the architecture CopilotKit was designed for — Frontend ←→ Runtime ←→ Agent Backend as three separate layers connected by AG-UI.

The frontend React code is unchanged — CopilotKit's `useCopilotChat`, `useCopilotAction`, `CopilotChat`, generative UI, and HITL all work identically whether the agent backend is BuiltInAgent or a remote LangGraph service.

**Files to remove** (Prisma, NextAuth, dead code):
- `prisma/` directory (schema.prisma, migrations)
- `src/app/api/chat/route.ts` (replaced by CopilotKit runtime)
- `src/app/api/auth/[...nextauth]/route.ts` (replaced by Better Auth)
- `src/lib/db.ts` (replaced by `src/lib/db/index.ts`)
- `src/lib/auth.ts` (replaced by `src/lib/auth/index.ts`)
- `src/app/notes/`, `src/app/tasks/`, `src/app/library/` (replaced by unified workspace surfaces)
- All `._*` AppleDouble files

### Externalized v1 Features

The following v1 Prisma models are **not rebuilt** in v3. Each is either absorbed by a v3 feature, externalized to a plug-and-play integration, or dropped as dead weight:

| v1 Model | Disposition | Rationale |
|----------|------------|----------|
| `Note` | **Absorbed** → Document surface (US3) | v3's TipTap Document surface is a strict superset of v1's plain-text Notes. |
| `Task` | **Rebuilt** → local `tasks` table + agent tools | Task management rebuilt with local Postgres storage for cross-platform sync (web, desktop, mobile). Agent creates/manages tasks via native tools. Composio/MCP bridge to external task apps (Todoist, Linear) for import/export. |
| `KnowledgeBase`, `KnowledgeFile`, `KnowledgeChunk`, `ChatKnowledgeBase` | **Replaced** → Memory tool (US9) | v1's file-chunking RAG pipeline replaced by agent Memory tool with pgvector semantic recall. Simpler, more useful, no background pipeline. |
| `Attachment` | **Deferred** | File attachments in chat not in v3 spec. Can be added later via MCP or as a tool. |
| `Integration` | **Replaced** → Composio | v1 stored OAuth tokens for third-party services. v3 delegates this to Composio's managed OAuth. |
| `AppConfig` | **Dropped** | Admin-level system prompt and feature flags. Move to environment variables or project-level `instructions` field. |
| `ProviderConfig`, `ModelConfig` | **Dropped** | Admin-managed provider/model catalog. v3 uses BYOK — users bring their own keys, providers resolved dynamically at runtime. No admin catalog needed. |
| `Account`, `Session`, `VerificationToken` | **Replaced** → Better Auth | NextAuth adapter tables replaced by Better Auth's built-in session management. |

**Cross-Platform Data Strategy**: Core features (Notes, Tasks, Memories) store data in the local Postgres database — shared by web, desktop, and mobile clients. Composio and MCP provide bridges to external services for import/export, not primary storage.

1. **MCP Servers** (US6, FR-030–FR-034) — Users add MCP endpoints in Settings. Todoist (`https://ai.todoist.net/mcp`), Notion (`https://mcp.notion.com/mcp`), and 100+ community MCP servers available. Agent discovers and uses tools automatically.
2. **Composio** (`composio-langgraph`) — Optional integration providing 500+ app connections as native LangGraph tools with managed OAuth. Bridges to external services, not a replacement for local storage.

## Phase 0: Research

### Research Tasks

| # | Unknown | Research Task |
|---|---------|--------------|
| 1 | CopilotKit Python SDK + LangGraph integration pattern | How does CopilotKit's Python SDK expose a LangGraph graph as an AG-UI endpoint? What is the exact API? |
| 2 | PostgresSaver setup with shared database | How to configure PostgresSaver to use the same Postgres instance as the Next.js app? Table naming? Connection pooling? |
| 3 | LangGraph sub-graph delegation pattern | How to define sub-graphs in LangGraph and delegate from a main orchestrator graph? State passing? |
| 4 | AG-UI protocol between CopilotKit Runtime and Python agent | What is the AG-UI wire protocol? How does the CopilotKit JS runtime connect to a remote AG-UI endpoint? |
| 5 | LangGraph memory tool with pgvector | Best pattern for a LangGraph tool that writes/reads from a shared Postgres table with vector columns? |
| 6 | LangChain provider resolution (Python) | How to route to multiple LLM providers (OpenAI, Anthropic, Google, etc.) from LangChain in the Python agent? |
| 7 | MCP tools in LangGraph context | How to bridge MCP-discovered tools (from the JS side) to LangGraph tool nodes in the Python agent? |

### Key Decisions

#### Decision 1: CopilotKit ↔ LangGraph via AG-UI Protocol

**Decision**: Use CopilotKit's Python SDK to expose the LangGraph graph as an AG-UI endpoint. The Next.js CopilotRuntime configures the remote agent endpoint.

**Rationale**: CopilotKit was designed for this exact architecture — its docs show Frontend ←→ Runtime ←→ Agent Backend as three layers connected by AG-UI. The Python SDK (`copilotkit` package) provides a `copilotkit_exit` helper and FastAPI integration that wraps LangGraph graphs for AG-UI streaming. This means:
- Frontend code doesn't change at all
- The CopilotKit runtime in Next.js becomes a thin proxy
- Agent logic lives entirely in Python/LangGraph

#### Decision 2: PostgresSaver for Checkpointing

**Decision**: Use LangGraph's `PostgresSaver` (async variant) connected to the same PostgreSQL instance.

**Rationale**: PostgresSaver persists every agent step as a checkpoint in dedicated tables (`checkpoints`, `checkpoint_writes`, `checkpoint_blobs`). This provides:
- Crash recovery (resume from last checkpoint)
- Long-running task durability (survives browser closes, server restarts)
- No need for Inngest or any external durable execution service
- Same Postgres instance = simpler deployment, no additional infrastructure

The checkpoint tables are managed by LangGraph (created via `PostgresSaver.setup()`) and are separate from the Drizzle-managed application tables. No schema conflicts.

#### Decision 3: Sub-graph Multi-Agent Delegation (Native Routing)

**Decision**: Define specialist sub-agents as LangGraph sub-graphs (e.g., `research_subgraph`, `code_subgraph`). The main orchestrator graph uses **LangGraph's native conditional edges** to route to sub-graphs based on the LLM's structured output — not via a delegation tool.

**Rationale**: LangGraph's sub-graph pattern allows the main graph to delegate to a sub-graph as a node. The LLM outputs a routing decision (e.g., `{"next": "research"}`) via structured output, and conditional edges route accordingly. This avoids a `delegate_to_agent` tool that would be intercepted before execution — a confusing pattern where a "tool" never actually executes as a tool. Native conditional routing is the idiomatic LangGraph pattern for multi-agent systems.

#### Decision 4: Memory Tool with Embedding Vectors

**Decision**: The agent has a `save_memory` and `recall_memory` tool. Memories are stored in a `memories` Drizzle table with a `vector` column for embeddings. The `recall_memory` tool uses pgvector cosine similarity search.

**Rationale**: Using the same PostgreSQL + pgvector for memory storage avoids additional infrastructure (no Pinecone, no ChromaDB). The memory tool is a standard LangGraph tool that:
1. `save_memory(content, tags)` — generates embedding via the same LLM provider's embedding API, stores content + embedding in `memories` table
2. `recall_memory(query, top_k=5)` — generates query embedding, does cosine similarity search, returns top-k memories

The table is managed by Drizzle (part of the Next.js schema), but the Python agent reads/writes it directly via asyncpg SQL. This is safe because:
- Drizzle manages the schema (migrations)
- Python agent only does INSERT/SELECT on this table
- No ORM conflict — both sides use the same Postgres connection pool

#### Decision 5: No Inngest

**Decision**: Drop Inngest entirely. LangGraph's PostgresSaver + checkpointing handles all durability requirements.

**Rationale**: Inngest was previously needed because CopilotKit's BuiltInAgent has no persistent state. LangGraph's PostgresSaver provides:
- Step-level checkpointing (every tool call, every LLM response is saved)
- Crash recovery (resume from last checkpoint)
- Long-running task support (agent runs survive server restarts)
- Built into LangGraph — no external service, no webhook handlers, no step functions

This eliminates the `inngest` dependency, the `src/app/api/inngest/` route, and all Inngest client/function code.

#### Decision 7: Agent Service Authentication

**Decision**: The Python agent service (`/api/agent`) is NOT publicly accessible. It is called exclusively by the Next.js CopilotRuntime. Authentication is enforced via a shared secret (`AGENT_SERVICE_SECRET`) passed as a Bearer token in the AG-UI request from the CopilotRuntime to the Python service.

**Rationale**: The Python agent service has direct database access (asyncpg for memories, PostgresSaver for checkpoints) and executes tools with user-scoped permissions. If exposed without authentication, any client could impersonate any user. The shared secret ensures only the trusted CopilotRuntime can invoke the agent. User identity (`user_id`) is forwarded from the authenticated Next.js session via AG-UI request metadata — the Python service trusts it because the request is authenticated by the shared secret.

**Implementation**:
- CopilotRuntime adds `Authorization: Bearer $AGENT_SERVICE_SECRET` to AG-UI requests
- FastAPI middleware validates the Bearer token on every `/api/agent` request
- In production, the Python service should not be exposed to the public internet (internal network / same Docker network only)
- All database writes include `WHERE user_id = $verified_user_id` from the AG-UI metadata

#### Decision 8: Observability

**Decision**: The Python agent service uses structured JSON logging (`structlog`) with request tracing. Every agent invocation is logged with: request ID, user ID, model used, tool calls, step latencies, and errors.

**Rationale**: The agent service runs long-lived sessions with checkpointing. Without observability, failures in multi-step tool chains, slow LLM responses, and checkpoint corruption are invisible. Structured JSON logs to stdout are sufficient for v3 — container orchestrators (Docker, Railway, Fly.io) can ingest them directly.

**Implementation**:
- Add `structlog` to Python dependencies
- Log every LLM call (model, latency, token count)
- Log every tool execution (tool name, duration, success/error)
- Log checkpoint save/resume events
- Health endpoint (`/health`) includes readiness probe: DB connectivity + checkpointer status

#### Decision 6: MCP Tools Bridge (JS → Python)

**Decision**: MCP tool discovery and connection management stays in the Next.js layer (TypeScript). Discovered MCP tool schemas are passed to the Python agent as part of the AG-UI request context. The Python agent dynamically creates LangGraph `Tool` instances from the provided schemas and delegates execution back via AG-UI tool events.

**Rationale**: MCP SDKs are TypeScript-native. Running MCP client connections in Python would duplicate the TypeScript ecosystem. Instead:
1. Next.js CopilotRuntime loads MCP tools per-user (existing pattern)
2. Tool schemas are included in the AG-UI request metadata
3. Python agent sees MCP tools alongside its native tools
4. MCP tool executions are forwarded back to the Next.js side via AG-UI events

This keeps MCP integration in the TypeScript layer while making MCP tools available to the LangGraph agent.

### Dependencies — Add / Remove / Change

#### Add (Python)

| Package | Purpose |
|---------|---------|
| `langgraph` | LangGraph StateGraph for agent orchestration |
| `langgraph-checkpoint-postgres` | PostgresSaver for checkpointing |
| `langchain-core` | Base LangChain abstractions (tools, messages) |
| `langchain-anthropic` | Anthropic provider (ChatAnthropic) |
| `langchain-openai` | OpenAI provider (ChatOpenAI) |
| `langchain-google-genai` | Google provider |
| `fastapi` | Python agent service HTTP framework |
| `uvicorn` | ASGI server |
| `asyncpg` | Async PostgreSQL driver |
| `copilotkit` | CopilotKit Python SDK (AG-UI endpoint) |
| `pydantic` | Request/response validation |
| `structlog` | Structured JSON logging for agent service observability |
| `composio-langgraph` | Composio integration — 500+ app tools (Todoist, Notion, etc.) as native LangGraph tools |
| `pytest` | Testing framework |
| `pytest-asyncio` | Async test support |

#### Add (JavaScript)

| Package | Purpose |
|---------|---------|
| `@copilotkit/react-core` | CopilotKit React hooks and provider |
| `@copilotkit/react-ui` | CopilotKit chat UI components |
| `@copilotkit/runtime` | CopilotKit server runtime (AG-UI bridge) |
| `drizzle-orm` | Drizzle ORM |
| `drizzle-kit` | Drizzle migration tool (dev dependency) |
| `better-auth` | Better Auth authentication |
| `@modelcontextprotocol/sdk` | MCP client SDK |
| `@tiptap/react` | TipTap rich text editor |
| `@tiptap/starter-kit` | TipTap default extensions |
| `@xterm/xterm` | Terminal surface |
| `postgres` | PostgreSQL driver for Drizzle |
| `react-resizable-panels` | Three-panel resizable layout |

#### Remove

| Package | Reason |
|---------|--------|
| `@prisma/client` | Replaced by Drizzle ORM |
| `@prisma/adapter-pg` | Replaced by Drizzle ORM |
| `@auth/prisma-adapter` | Replaced by Better Auth |
| `next-auth` | Replaced by Better Auth |
| `inngest` | Dropped — LangGraph handles durability |
| `shadcn` | CLI tool incorrectly listed as runtime dependency; no shadcn/ui CLI per constitution |
| `nanoid` | Unused — all v3 IDs use Postgres `gen_random_uuid()` |
| `@base-ui/react` | Not referenced in v3 spec or plan |

#### Keep (unchanged)

| Package | Reason |
|---------|--------|
| `next` 16 | App Router framework |
| `react` 19 | UI library |
| `ai` ^6.0.198 | AI SDK for JS-side model routing |
| All `@ai-sdk/*` providers | Model routing on CopilotKit side |
| `@openrouter/ai-sdk-provider` | OpenRouter routing |
| `zustand` | Workspace state management |
| `lucide-react` | Icons |
| All `@radix-ui/*` | UI primitives |
| `react-markdown` + plugins | Markdown rendering |
| `sonner` | Toast notifications |
| `cmdk` | Command palette |
| `next-themes` | Dark mode |
| `date-fns` | Date formatting |
| `bcryptjs` | Password hashing |
| `uuid` | UUID generation |

## Phase 1: Design

### Data Model

See [data-model.md](./data-model.md) for full entity definitions. Key changes from v2:

1. **`memories` table** — NEW. Stores agent memories with embedding vectors for semantic recall. Fields: `id`, `userId`, `content`, `embedding` (vector 1536), `tags` (json), `sourceConversationId`, `createdAt`.

2. **LangGraph checkpoint tables** — Managed by PostgresSaver (not Drizzle). Tables: `checkpoints`, `checkpoint_writes`, `checkpoint_blobs`. Created via `PostgresSaver.setup()`.

3. **7 Drizzle application tables** — `users`, `conversations`, `messages`, `documents`, `projects`, `api_keys`, `mcp_servers` (consolidated from 20 Prisma models).

4. **`messages` table** — Now includes `toolCalls` (json) and `toolCallId` (text) columns for LangGraph tool call tracking.

### Contracts

See [contracts/](./contracts/) for detailed interface definitions:

- **[agent-tools.md](./contracts/agent-tools.md)** — LangGraph tool definitions (search, artifacts, documents, browser, terminal, files, memory, delegate)
- **[agent-service.md](./contracts/agent-service.md)** — Python agent service API (FastAPI endpoints, AG-UI protocol, health checks)
- **[copilotkit-runtime.md](./contracts/copilotkit-runtime.md)** — CopilotKit runtime configuration (AG-UI bridge to Python agent)
- **[workspace-store.md](./contracts/workspace-store.md)** — Zustand workspace store API (surfaces, artifacts, panel state)

### Quickstart Validation

See [quickstart.md](./quickstart.md) for runnable validation scenarios that prove the feature works end-to-end.

## Re-evaluate Constitution Check (Post-Design)

| Principle | Status | Post-Design Notes |
|-----------|--------|-------------------|
| **I. CopilotKit-First UI** | ✅ PASS | Frontend unchanged. CopilotKit React components drive all chat, generative UI, HITL. |
| **II. Agent Tools Drive Workspace** | ✅ PASS | Workspace state mutations triggered by LangGraph tool calls flowing through AG-UI → CopilotKit → Zustand store. |
| **III. Drizzle Over Prisma** | ✅ PASS | 8 Drizzle tables (7 app + memories). No Prisma. LangGraph checkpoint tables managed separately by PostgresSaver. |
| **IV. Better Auth Over NextAuth** | ✅ PASS | Better Auth for all authentication. No NextAuth. |
| **V. LangGraph Agent Backend** | ✅ PASS | Python FastAPI service running LangGraph StateGraph. PostgresSaver for checkpointing. Sub-graph delegation. Memory tool. No BuiltInAgent. No Inngest. AG-UI protocol. |
| **VI. Workspace as Surface Pattern** | ✅ PASS | Six surfaces, each self-contained, Zustand-only communication. |
| **VII. No Speculation** | ✅ PASS | Only spec-defined features. No live browser interaction, no multi-user collab, no RAG pipeline. |
| **VIII. Test Critical Paths** | ✅ PASS | Vitest (JS) + pytest (Python) covering agent graph, tools, checkpoints, auth, workspace state. |

**Post-Design Gate**: ✅ ALL PRINCIPLES PASS.

## Implementation Phases

### Phase 0: Foundation Swaps (Days 1–2)

1. **Replace Prisma → Drizzle ORM**
   - Convert 20 Prisma models → 8 Drizzle tables (7 app + memories)
   - Create schema files in `src/lib/db/schema/`
   - Set up Drizzle client in `src/lib/db/index.ts`
   - Run `drizzle-kit generate` and `drizzle-kit migrate`
   - Remove `prisma/` directory, `@prisma/client`, `@prisma/adapter-pg`

2. **Replace NextAuth → Better Auth**
   - Install `better-auth`, create config in `src/lib/auth/index.ts`
   - Rewrite `src/app/api/auth/` route handler
   - Rewrite `src/middleware.ts` for Better Auth
   - Remove `next-auth`, `@auth/prisma-adapter`

3. **Clean up AppleDouble files**
   - `find . -name '._*' -delete`

4. **Verify existing UI works** with new auth + DB layers

### Phase 1: Python Agent Service (Days 3–5)

1. **Scaffold `services/agent/`**
   - Create `pyproject.toml` with all Python dependencies
   - Create FastAPI app in `app/main.py`
   - Configure AG-UI endpoint using CopilotKit Python SDK

2. **Build LangGraph agent graph**
   - Define state in `app/graph/state.py`
   - Build main orchestrator graph in `app/graph/builder.py`
   - Implement LLM node and tool execution node
   - Configure PostgresSaver checkpointer

3. **Implement core agent tools**
   - `search.py` — Web search
   - `artifacts.py` — Create/update artifacts
   - `documents.py` — Document CRUD
   - `browser.py` — Browser navigation + screenshot
   - `terminal.py` — Terminal execution
   - `files.py` — File system operations
   - `memory.py` — Save/recall memories with pgvector
   - `tasks.py` — Task CRUD (create, list, update, complete) — local Postgres storage
   - `composio.py` — Composio integration for external app tools (optional)

4. **Set up provider resolution**
   - `app/models/providers.py` — Map model strings to LangChain ChatModel instances
   - Support OpenAI, Anthropic, Google, Groq, Mistral, xAI, DeepSeek, OpenRouter, Ollama

5. **Write Python tests**
   - Graph structure and routing
   - Tool execution
   - Checkpoint save/resume

### Phase 2: CopilotKit Runtime Bridge (Days 5–6)

1. **Configure CopilotKit runtime in Next.js**
   - `src/lib/copilot/runtime.ts` — CopilotRuntime pointing to Python agent AG-UI endpoint
   - `src/app/api/copilotkit/route.ts` — API route handler

2. **Remove old chat route**
   - Delete `src/app/api/chat/route.ts`

3. **Verify AG-UI streaming**
   - Test end-to-end: user message → CopilotKit → AG-UI → LangGraph → tool call → response

### Phase 3: Workspace Surfaces (Days 6–10)

1. **Three-panel layout** (`app-shell.tsx` with `react-resizable-panels`)
2. **Zustand workspace store** (`workspace-store.ts`)
3. **Artifacts surface** (code, HTML, SVG, React, diff viewers)
4. **Document surface** (TipTap rich text editor)
5. **Browser surface** (screenshot-based preview)
6. **Terminal surface** (xterm.js)
7. **Files surface** (tree view + preview)
8. **Agent Output surface** (streaming markdown)

### Phase 4: CopilotKit Frontend Tools (Days 10–11)

1. **Register `useCopilotAction` hooks** for workspace-driving tools
   - `createArtifact`, `updateArtifact`, `openBrowser`, `editDocument`, `streamToWorkspace`

2. **Build generative UI renderers**
   - Inline tool cards in chat (artifact card, browser card, document card)
   - Human-in-the-loop approval UI

### Phase 5: Multi-Provider + MCP (Days 11–13)

1. **API key management** UI and encrypted storage
2. **Model selector** component in chat header
3. **MCP server configuration** UI in settings
4. **MCP registry** — connect/discover/inject tools
5. **MCP → LangGraph bridge** — pass MCP tool schemas to Python agent

### Phase 6: Sub-Agent Delegation + Memory + External Integrations (Days 13–15)

1. **Define sub-graphs** (`research.py`, `code.py`)
2. **Implement native conditional routing** — LLM structured output routes to sub-graphs via LangGraph conditional edges (no delegation tool)
3. **Implement memory tools** — `save_memory`, `recall_memory` with pgvector
4. **Memory management UI** — view, search, delete memories in settings
5. **Configure Composio integration** — `composio-langgraph` toolset for external app connections (Todoist, Notion, etc.)

### Phase 7: Polish + Testing + Observability (Days 15–16)

1. **Agent service observability** — structured JSON logging (`structlog`), request tracing, tool call metrics
2. **Agent service security** — shared secret auth middleware, CORS configuration, rate limiting
3. **Checkpoint recovery testing** — verify resume after simulated crashes
4. **Human-in-the-loop flows** — approval UI for sensitive tool calls
5. **End-to-end integration tests**
6. **Performance testing** — streaming latency, panel resize, conversation loading
7. **Bug fixes**

## Complexity Tracking

> No constitution violations — all eight principles are satisfied by the plan.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (none)    | —          | —                                    |
