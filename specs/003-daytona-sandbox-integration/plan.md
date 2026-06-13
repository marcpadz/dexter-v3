# Implementation Plan: Daytona Sandbox Integration

**Branch**: `003-daytona-sandbox-integration` | **Date**: 2026-06-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-daytona-sandbox-integration/spec.md`

## Summary

Replace the Python FastAPI agent service and all its stub tools with LangGraph.js + Daytona TypeScript SDK running in-process inside Next.js. LangGraph.js provides multi-agent orchestration, checkpointing, and sub-graph delegation. Daytona provides sandboxed code execution, file operations, git, terminal, and browser automation. CopilotKit bridges the agent to the React UI via AG-UI protocol and `useCopilotAction` hooks that populate the workspace panel surfaces.

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 22 / Next.js 16 (App Router)

**Primary Dependencies**:
- `@langchain/langgraph` ^1.4 — Multi-agent orchestration, sub-graphs, checkpointing
- `@langchain/core` ^1.1 — LangChain base (tool definitions, message types)
- `@langchain/anthropic` ^0.3 — Anthropic model provider
- `@daytonaio/sdk` ^0.187.0 — Daytona TypeScript SDK (sandbox, process, fs, git, computer-use)
- `@copilotkit/react-core` ^1.59, `@copilotkit/react-ui` ^1.59, `@copilotkit/runtime` ^1.59 — CopilotKit (AG-UI, chat UI, frontend tools)
- `@copilotkit/runtime/langgraph` — CopilotKit's LangGraph.js adapter
- `drizzle-orm` ^0.45 — Database access
- `zustand` ^5.0 — Workspace state management

**Storage**: Neon PostgreSQL (via Drizzle ORM) — conversations table gets `sandboxId` column; LangGraph checkpoint tables managed by PostgresSaver

**Testing**: Vitest (unit/integration)

**Target Platform**: Web (Next.js on Vercel or self-hosted)

**Performance Goals**: Code execution response in <5s (warm sandbox), <15s (cold start)

**Constraints**: Daytona API key must stay server-side; sandbox auto-stop after 15min idle

**Scale/Scope**: Per-conversation sandbox; multi-tenant via conversation-level tracking

**Project Type**: Web application (Next.js fullstack)

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. CopilotKit-First UI | ✅ PASS | CopilotChat, useCopilotAction, AG-UI protocol all preserved |
| II. Agent Tools Drive Workspace | ✅ PASS | LangGraph tools → Daytona → workspace surfaces via useCopilotAction |
| III. Drizzle Over Prisma | ✅ PASS | No Prisma changes, Drizzle used throughout |
| IV. Better Auth Over NextAuth | ✅ PASS | Better Auth retained, NextAuth removed |
| V. LangGraph Agent Backend | ⚠️ AMENDMENT | Constitution mandates Python LangGraph. **Amending to LangGraph.js (TypeScript).** See Complexity Tracking. |
| VI. Workspace as Surface Pattern | ✅ PASS | Surfaces unchanged, still communicate via Zustand store |
| VII. No Speculation | ✅ PASS | Only building what the spec describes |
| VIII. Test Critical Paths | ✅ PASS | Will test sandbox manager, tool handlers, auth, workspace transitions |

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Principle V: Python → TypeScript LangGraph | Daytona SDK is TypeScript. Calling it from Python would require an HTTP bridge or Python SDK (less mature). LangGraph.js runs in-process — no separate service to deploy/debug. Current Python service is 100% stubs with zero reusable code. | Keeping Python service: requires two languages, two deployments, HTTP bridge between TS Daytona SDK and Python agent, and maintaining code with no working functionality. |

**Constitution amendment required**: Principle V changes from "Python LangGraph service" to "LangGraph.js in-process." All other principles unchanged. Version bump: 2.0.0 → 3.0.0 (MAJOR — principle redefined).

## Architecture

### Target Architecture

```
┌───────────────────────────────────────────────────────────────┐
│  Next.js (single process — no separate Python service)         │
│                                                                │
│  <CopilotChat> ──→ CopilotRuntime (/api/copilotkit)            │
│                          │                                     │
│                   @copilotkit/runtime/langgraph adapter         │
│                          │                                     │
│                   LangGraph.js StateGraph                       │
│                   ┌──────────────────────┐                      │
│                   │  Supervisor (LLM)     │ ← routes to agents   │
│                   └──┬─────────┬─────────┘                      │
│                      │         │                                 │
│          ┌───────────┘         └──────────┐                      │
│          ▼                                ▼                      │
│   Research sub-graph              Code sub-graph                 │
│   - web_search                    - execute_code                 │
│   - browse_url                    - list/read/write_file          │
│   - take_screenshot               - git_clone/status/commit      │
│   - synthesize (LLM)              - execute_command               │
│          │                                │                      │
│          └──────────┬─────────────────────┘                      │
│                     ▼                                           │
│            Daytona SDK (TypeScript)                              │
│            sandbox.process / sandbox.fs / sandbox.git            │
│            sandbox.computerUse / sandbox.codeInterpreter         │
│                     │                                           │
│            PostgresSaver (checkpoints)                           │
│            Neon Postgres (data)                                  │
└───────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

1. **LangGraph.js runs in-process inside Next.js** — `@copilotkit/runtime/langgraph` adapter wraps the graph for CopilotKit
2. **One Daytona sandbox per conversation** — tracked via `sandboxId` on conversations table
3. **Sandbox lazy-created on first tool call** — not on page load
4. **All Daytona SDK calls happen server-side in LangGraph tool handlers** — client never touches Daytona API
5. **CopilotKit frontend actions (`useCopilotAction`) bridge tool results to workspace** — already implemented, just need the agent pipeline to trigger them
6. **Tool names in LangGraph must match frontend action names** — CopilotKit auto-bridges by name (e.g., LangGraph `browse_web` → frontend `browse_web`)

## Project Structure

### Documentation (this feature)

```text
specs/003-daytona-sandbox-integration/
├── plan.md              # This file
├── research.md          # SDK and integration research
├── data-model.md        # Schema changes (sandboxId on conversations)
├── quickstart.md        # Setup and validation guide
├── contracts/
│   ├── sandbox-tools.md    # LangGraph tool contracts
│   └── workspace-actions.md # CopilotKit frontend action contracts
└── tasks.md             # Implementation tasks (generated by /speckit-tasks)
```

### Source Code Changes

```text
src/
├── lib/
│   ├── daytona/                        # NEW — Daytona integration layer
│   │   ├── client.ts                   # Daytona singleton + config
│   │   ├── sandbox-manager.ts          # Create/get/stop sandbox per conversation
│   │   └── tools/                      # LangGraph tool definitions
│   │       ├── index.ts                # Barrel export of all tools
│   │       ├── execute-code.ts         # Code execution tool
│   │       ├── execute-command.ts      # Shell command tool (sessions)
│   │       ├── filesystem.ts           # File CRUD + list tools
│   │       ├── git.ts                  # Git operations tools
│   │       ├── browser.ts              # Browser/computer-use tools
│   │       └── search.ts              # Web search tool (Tavily)
│   ├── agent/                          # NEW — LangGraph.js agent graph
│   │   ├── graph.ts                    # StateGraph definition + compile
│   │   ├── state.ts                    # AgentState type
│   │   ├── nodes/
│   │   │   ├── supervisor.ts           # Main LLM node (routes to sub-agents)
│   │   │   └── router.ts              # Conditional edge logic
│   │   └── subgraphs/
│   │       ├── research.ts             # Research sub-graph (search → browse → synthesize)
│   │       └── code.ts                 # Code sub-graph (plan → generate → validate)
│   ├── copilot/
│   │   └── runtime.ts                  # REWRITE — LangGraphAgent + CopilotRuntime
│   ├── db/
│   │   └── schema/
│   │       └── conversations.ts        # MODIFY — add sandboxId column
│   └── auth/
│       └── session.ts                  # KEEP — auth works
│
├── components/
│   ├── copilot/
│   │   └── frontend-tools.ts           # KEEP — already wired to workspace store
│   └── workspace/
│       └── surfaces/                   # KEEP — all surfaces work
│
├── app/
│   ├── api/
│   │   └── copilotkit/
│   │       └── route.ts                # KEEP — CopilotRuntime endpoint
│   └── (app)/
│       └── chat/
│           └── page.tsx                # REWRITE — use <CopilotChat> instead of custom form
│
└── middleware.ts                        # REWRITE — re-enable auth

DELETE:
├── services/agent/                     # Entire Python service — GONE
├── src/lib/copilot/chat-adapter.ts     # Dead code — raw fetch adapter
├── src/lib/mcp/registry.ts             # Dead code — unplugged MCP
├── src/lib/mcp/client.ts               # Dead code — unplugged MCP
├── src/components/copilot/tool-renderers/ # Dead code — never imported
└── All ._* AppleDouble files
```

## Implementation Phases

### Phase 1: Foundation — Install, Config, Schema, Sandbox Manager

**Files**: `src/lib/daytona/client.ts`, `src/lib/daytona/sandbox-manager.ts`, conversations schema

1. Install new dependencies: `@daytonaio/sdk`, `@langchain/langgraph`, `@langchain/core`, `@langchain/anthropic`, `@langchain/openai`, `langgraph-checkpoint-postgres`
2. Add env vars: `DAYTONA_API_KEY`, `DAYTONA_API_URL`, `DAYTONA_TARGET`, `TAVILY_API_KEY`
3. Create Daytona client singleton (`src/lib/daytona/client.ts`)
4. Create sandbox manager (`src/lib/daytona/sandbox-manager.ts`) — `getOrCreateSandbox(conversationId)`, `stopSandbox(conversationId)`, `cleanupSandbox(conversationId)`
5. Add `sandboxId` to conversations schema
6. Run `drizzle-kit push`
7. `npm install` (fix all UNMET dependencies)
8. Delete AppleDouble files: `find . -name '._*' -delete`

### Phase 2: LangGraph.js Agent Graph

**Files**: `src/lib/agent/*.ts`

1. Define `AgentState` type (messages, userId, model, conversationId, sandboxId)
2. Build the main `StateGraph` with supervisor node + conditional routing
3. Define the supervisor LLM node — binds all tools, calls model
4. Define the router — routes to tools, research sub-graph, code sub-graph, or end
5. Implement research sub-graph (plan → search → browse → synthesize)
6. Implement code sub-graph (plan → execute → validate)
7. Compile graph with PostgresSaver checkpointer

### Phase 3: Daytona Tool Definitions

**Files**: `src/lib/daytona/tools/*.ts`

Each tool is a `@langchain/core/tool` `tool()` definition that:
1. Resolves the sandbox via `getOrCreateSandbox(conversationId)` from graph state
2. Calls the Daytona SDK method
3. Returns structured result

Tools: `execute_code`, `execute_command`, `list_files`, `read_file`, `write_file`, `delete_file`, `git_clone`, `git_status`, `git_commit`, `browse_url`, `take_screenshot`, `web_search`

### Phase 4: Wire CopilotKit Runtime

**Files**: `src/lib/copilot/runtime.ts` (REWRITE)

```typescript
import { CopilotRuntime } from "@copilotkit/runtime";
import { LangGraphAgent } from "@copilotkit/runtime/langgraph";
import { compiledGraph } from "@/lib/agent/graph";

const dexterAgent = new LangGraphAgent({
  graph: compiledGraph,
});

export const runtime = new CopilotRuntime({
  agents: { default: dexterAgent },
});
```

### Phase 5: Replace Custom Chat with CopilotChat

**File**: `src/app/(app)/chat/page.tsx` (REWRITE)

Replace the 80-line custom form with CopilotChat + useWorkspaceTools. This single change makes the entire agent→workspace pipeline functional.

### Phase 6: Delete Python Service & Dead Code

- `rm -rf services/agent/`
- Remove dead code: chat-adapter, MCP registry/client, tool-renderers
- Remove zombie deps from package.json: next-auth, @auth/prisma-adapter, @prisma/client, @prisma/adapter-pg, prisma

### Phase 7: Fix Build, Re-enable Auth, Clean Up

1. Fix Next.js build (turbopack root, etc.)
2. Re-enable auth middleware
3. Amend constitution (Principle V: Python → LangGraph.js)
4. Update AGENTS.md reference

## Environment Variables

```env
# Daytona
DAYTONA_API_KEY=your-api-key
DAYTONA_API_URL=https://app.daytona.io/api
DAYTONA_TARGET=us

# Web Search (optional)
TAVILY_API_KEY=your-key

# Existing (keep)
DATABASE_URL=postgres://...
BETTER_AUTH_SECRET=...
GOOGLE_CLIENT_ID=...
GITHUB_CLIENT_ID=...
```

## Dependency Changes

### Add
```json
"@daytonaio/sdk": "^0.187.0",
"@langchain/langgraph": "^1.4",
"@langchain/core": "^1.1",
"@langchain/anthropic": "^0.3",
"@langchain/openai": "^0.3",
"langgraph-checkpoint-postgres": "^0.1"
```

### Remove
```json
"next-auth": "^5.0.0-beta.31",
"@auth/prisma-adapter": "^2.11.2",
"@prisma/client": "^7.8.0",
"@prisma/adapter-pg": "^7.8.0",
"prisma": "^7.8.0"
```

### Keep
All `@copilotkit/*`, `@ai-sdk/*`, `drizzle-orm`, `zustand`, `react-resizable-panels`, `@tiptap/*`, `@xterm/*`
