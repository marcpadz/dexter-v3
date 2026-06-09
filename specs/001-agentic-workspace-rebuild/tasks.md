# Tasks: Dexter v3 — Full Agentic Workspace Rebuild

**Input**: Design documents from `/specs/001-agentic-workspace-rebuild/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Architecture**: Two-service — Next.js 16 frontend (CopilotKit, Drizzle, Better Auth) + Python agent service (FastAPI, LangGraph, PostgresSaver) connected via AG-UI protocol.

**Tests**: Included per Constitution Principle VIII — critical path tests for server actions, agent tools, auth flows, and workspace state transitions.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallelizable (different files, no blocking dependencies)
- **[Story]**: Maps to user story from spec.md (US1–US10)
- All file paths relative to repository root

---

## Phase 1: Setup — Dependency Swaps & Directory Structure

**Purpose**: Remove deprecated packages, install new dependencies, create directory skeleton for both services.

- [X] T001 Remove Prisma dependencies and files: delete `prisma/` directory, remove `@prisma/client` and `@prisma/adapter-pg` from `package.json`, remove `prisma generate` from build scripts
- [X] T002 Remove NextAuth dependencies and files: delete `src/app/api/auth/[...nextauth]/route.ts`, remove `next-auth` and `@auth/prisma-adapter` from `package.json`
- [X] T003 Remove old chat route: delete `src/app/api/chat/route.ts`
- [X] T004 Clean up AppleDouble files: run `find . -name '._*' -delete` from repo root
- [X] T005 Install new JavaScript dependencies: `@copilotkit/react-core`, `@copilotkit/react-ui`, `@copilotkit/runtime`, `drizzle-orm`, `drizzle-kit`, `better-auth`, `@modelcontextprotocol/sdk`, `@tiptap/react`, `@tiptap/starter-kit`, `@xterm/xterm`, `@xterm/addon-fit`, `postgres`, `react-resizable-panels`, `zustand`
- [X] T006 [P] Create Python agent service directory structure: `services/agent/app/`, `services/agent/app/graph/`, `services/agent/app/graph/nodes/`, `services/agent/app/graph/subgraphs/`, `services/agent/app/tools/`, `services/agent/app/models/`, `services/agent/app/db/`, `services/agent/app/prompts/`, `services/agent/tests/` with `__init__.py` files

---

## Phase 2: Foundational — Database, Auth Config, Agent Skeleton

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Drizzle ORM Setup

- [X] T007 Create Drizzle client instance in `src/lib/db/index.ts` — configure `drizzle(pgPool)` with connection from `DATABASE_URL` env var
- [X] T008 [P] Create `users` Drizzle schema in `src/lib/db/schema/users.ts` — id (uuid PK), email (unique), name, emailVerified, image, role, password, createdAt, updatedAt
- [X] T009 [P] Create `conversations` Drizzle schema in `src/lib/db/schema/conversations.ts` — id, userId FK, title, model, projectId FK, pinned, threadId, createdAt, updatedAt
- [X] T010 [P] Create `messages` Drizzle schema in `src/lib/db/schema/messages.ts` — id, conversationId FK, role, content, toolCalls (json), toolCallId, model, createdAt
- [X] T011 [P] Create `documents` Drizzle schema in `src/lib/db/schema/documents.ts` — id, userId FK, type, title, content, metadata (json), embedding (vector 1536), projectId FK, createdAt, updatedAt
- [X] T012 [P] Create `projects` Drizzle schema in `src/lib/db/schema/projects.ts` — id, userId FK, name, description, instructions, createdAt, updatedAt
- [X] T013 [P] Create `api_keys` Drizzle schema in `src/lib/db/schema/api-keys.ts` — id, userId FK, provider (unique per user), encryptedKey, iv, createdAt
- [X] T014 [P] Create `mcp_servers` Drizzle schema in `src/lib/db/schema/mcp-servers.ts` — id, userId FK, name, transportType, command, url, args (json), env (json), enabled, createdAt
- [X] T015 [P] Create `memories` Drizzle schema in `src/lib/db/schema/memories.ts` — id, userId FK, content, embedding (vector 1536), tags (json), sourceConversationId FK, createdAt
- [X] T015a [P] Create `tasks` Drizzle schema in `src/lib/db/schema/tasks.ts` — id, userId FK, title, description, completed (boolean), priority (text), dueDate (timestamp), projectId FK, sourceConversationId FK, createdAt, updatedAt
- [X] T016 Create Drizzle config in `drizzle.config.ts` at repo root — schema path `./src/lib/db/schema/`, output `./src/lib/db/migrations/`, pgvector enabled
- [X] T017 Generate and run initial Drizzle migration: `npx drizzle-kit generate` then `npx drizzle-kit migrate`

### Better Auth Configuration

- [X] T018 Create Better Auth configuration in `src/lib/auth/index.ts` — `createAuth()` with Drizzle adapter, emailPassword provider, Google and GitHub OAuth providers, database session strategy
- [X] T019 Create Better Auth route handler in `src/app/api/auth/route.ts` — export GET and POST handlers from Better Auth
- [X] T020 Create session helpers in `src/lib/auth/session.ts` — `getSession()`, `requireAuth()` wrappers for server components and actions

### Python Agent Service Skeleton

- [X] T021 Create `services/agent/pyproject.toml` — Python ≥3.11, dependencies: fastapi, uvicorn, copilotkit, langgraph, langgraph-checkpoint-postgres, langchain-core, langchain-anthropic, langchain-openai, langchain-google-genai, asyncpg, pydantic, structlog, composio-langgraph; dev deps: pytest, pytest-asyncio, httpx
- [X] T022 Create `services/agent/app/config.py` — environment configuration using pydantic-settings: DATABASE_URL, PORT, HOST, LOG_LEVEL, COPILOT_CORS_ORIGINS
- [X] T023 Create `services/agent/app/graph/state.py` — define `AgentState` TypedDict with messages (Annotated Sequence + operator.add), user_id, model, api_keys dict, mcp_tools list, active_artifacts list, conversation_id, thread_id
- [X] T024 Create `services/agent/app/db/connection.py` — asyncpg connection pool factory and `create_checkpointer()` function returning `AsyncPostgresSaver.from_conn_string()` with `await checkpointer.setup()`
- [X] T025 Create `services/agent/app/main.py` — FastAPI app, health check endpoint at `GET /health`, CopilotKit Python SDK AG-UI endpoint at `POST /api/agent` using `CopilotKitSDK(agents=[LangGraphAgent(...)])` with `add_fastapi_endpoint()`, startup event to initialize checkpointer
- [X] T025a Add shared secret auth middleware to `services/agent/app/main.py` — Bearer token validation using `AGENT_SERVICE_SECRET` env var, reject unauthenticated requests to `/api/agent`, forward `user_id` from AG-UI metadata
- [X] T025b Configure structured JSON logging in `services/agent/app/main.py` — `structlog` setup for request tracing, log every LLM call (model, latency, tokens), tool execution (name, duration, success/error), and checkpoint events

### CopilotKit Runtime Bridge (Thin Shim)

- [X] T026 Create CopilotKit runtime config in `src/lib/copilot/runtime.ts` — `new CopilotRuntime({ remoteAgents: [{ name: "dexter", url: AGENT_SERVICE_URL + "/api/agent" }] })`, no BuiltInAgent
- [X] T027 Create CopilotKit API route in `src/app/api/copilotkit/route.ts` — `copilotRuntimeNextJSAppRouterEndpoint({ runtime, endpoint: "/api/copilotkit" })`, export POST handler

### Shared Types

- [X] T028 Create shared TypeScript types in `src/lib/shared/types.ts` — WorkspaceTab, ArtifactType, Artifact, WorkspaceFile, WorkspaceActivity, Conversation, Message, Document, Project, ApiKey, McpServer, Memory interfaces

**Checkpoint**: Foundation ready — Drizzle tables exist, Better Auth configured, Python agent service skeleton runnable, CopilotKit runtime bridges to Python. User story implementation can now begin.

---

## Phase 3: User Story 5 — Authentication & User Management (Priority: P1)

**Goal**: Users can sign up, sign in, manage sessions, and access protected routes.

**Independent Test**: Sign up a new account, sign out, sign back in, verify session persists across refresh.

### Implementation

- [X] T029 [US5] Rewrite `src/middleware.ts` for Better Auth — use Better Auth's `authClient` for route protection, protect `/(app)/*` routes, allow `/(auth)/*` and `/api/auth/*` through
- [X] T030 [P] [US5] Create sign-up page in `src/app/(auth)/sign-up/page.tsx` — email/password registration form using Better Auth client, redirect to main app on success
- [X] T031 [P] [US5] Create sign-in page in `src/app/(auth)/login/page.tsx` — email/password + OAuth buttons (Google, GitHub) using Better Auth client, redirect to main app on success
- [X] T032 [US5] Create root layout update in `src/app/layout.tsx` — wrap app in Better Auth `AuthProvider` (or equivalent provider)
- [X] T033 [US5] Remove dead route directories: delete `src/app/notes/`, `src/app/tasks/`, `src/app/library/` (replaced by unified workspace surfaces)
- [X] T034 [US5] Create auth server actions in `src/lib/server/actions/auth.ts` — `signUp()`, `signIn()`, `signOut()`, `getSession()` wrapping Better Auth client calls

### Tests

- [X] T035 [US5] Create auth flow tests in `src/__tests__/auth.test.ts` — test sign-up validation, sign-in with email/password, session persistence, protected route access, sign-out (Vitest)

**Checkpoint**: Users can sign up, sign in, sessions persist across refreshes, protected routes enforce authentication.

---

## Phase 4: User Story 1 — Agent Conversation with Tool Calling (Priority: P1) 🎯 MVP

**Goal**: Users can have a tool-augmented conversation with the AI agent, streamed in real time through CopilotKit chat, with tool execution visible inline.

**Independent Test**: Start a conversation, ask the agent to "search for X", verify the tool executes, results render in chat, and conversation continues. Response begins within 3 seconds.

### Server Actions (Conversation Data)

- [ ] T036 [US1] Create conversation server actions in `src/lib/server/actions/conversations.ts` — `createConversation()`, `renameConversation()`, `deleteConversation()`, `getConversations()` scoped to authenticated user via Drizzle
- [ ] T037 [US1] Create message server actions in `src/lib/server/actions/messages.ts` — `getMessages(conversationId)`, `saveMessage()` scoped to authenticated user via Drizzle
- [ ] T038 [US1] Create shared utility helpers in `src/lib/shared/utils.ts` — `cn()` class merge helper, `formatDate()`, any shared formatting

### Frontend — App Shell & Chat

- [ ] T039 [US1] Create app layout in `src/app/(app)/layout.tsx` — wrap children in `CopilotKit` provider with `runtimeUrl="/api/copilotkit"`, render `<AppShell>` for three-panel structure
- [ ] T040 [US1] Create app shell component in `src/components/layout/app-shell.tsx` — three-panel layout using `react-resizable-panels`: sidebar (conversation list), center (chat), right (workspace panel, initially collapsed)
- [ ] T041 [P] [US1] Create header component in `src/components/layout/header.tsx` — top bar with logo, model selector placeholder, settings link, user menu
- [ ] T042 [US1] Create conversation sidebar in `src/components/layout/app-sidebar.tsx` — list conversations from server actions, "New Chat" button, rename/delete context menu, ordered by most recent activity
- [ ] T043 [US1] Create chat page in `src/app/(app)/chat/page.tsx` — render `<CopilotChat>` component with labels and initial message, integrated into app shell center panel
- [ ] T044 [US1] Create root page redirect in `src/app/page.tsx` — redirect authenticated users to `/chat`, unauthenticated to `/login`

### Python Agent — LangGraph Graph & Core Tools

- [ ] T045 [US1] Create system prompts in `services/agent/app/prompts/system.py` — main agent system prompt, sub-agent prompts (research, code), define agent personality and tool usage guidelines
- [ ] T046 [US1] Create provider resolution in `services/agent/app/models/providers.py` — `resolve_model(model_id, api_key, base_url)` mapping provider strings to LangChain ChatModel instances (openai, anthropic, google, groq, mistral, xai, deepseek, openrouter, ollama)
- [ ] T047 [US1] Create LLM node in `services/agent/app/graph/nodes/llm.py` — `call_llm(state)` function that resolves the model from state, binds tools, invokes LLM with message history, returns updated state
- [ ] T048 [US1] Create tool execution node in `services/agent/app/graph/nodes/tools.py` — `execute_tools(state)` function that iterates over pending tool calls from last AI message, executes each tool, returns tool result messages
- [ ] T049 [US1] Create routing logic in `services/agent/app/graph/nodes/router.py` — `route_after_llm(state)` conditional edge: if tool calls → "tools", if delegate_to_agent call → sub-graph name, else → END
- [ ] T050 [US1] Build main agent graph in `services/agent/app/graph/builder.py` — `build_agent_graph()` creating StateGraph with llm + tools nodes, entry point → llm, conditional edges from llm (tools/end), edge tools → llm, compile with PostgresSaver checkpointer
- [ ] T051 [US1] Register all tools in graph builder — import and collect all `@tool` decorated functions from `services/agent/app/tools/` into `ALL_TOOLS` list, bind to LLM in llm node

### Python Agent — Individual Tools

- [ ] T052 [P] [US1] Create `search_web` tool in `services/agent/app/tools/search.py` — accept query and max_results params, call search API, return list of `{title, url, snippet}` results
- [ ] T053 [P] [US1] Create `browse_web` tool in `services/agent/app/tools/browser.py` — accept url and action params, capture screenshot (base64), return `{url, title, screenshot, text_content}`
- [ ] T054 [P] [US1] Create `execute_code` tool in `services/agent/app/tools/terminal.py` — accept language, code, timeout params, execute in sandbox, return `{stdout, stderr, exit_code}`
- [ ] T055 [P] [US1] Create file tools in `services/agent/app/tools/files.py` — `list_files(path, recursive)`, `read_file(path)`, `write_file(path, content)` with HITL approval for writes
- [ ] T056 [P] [US1] Create delegate tool stub in `services/agent/app/tools/delegate.py` — placeholder `delegate_to_agent(agent, task, context)` returning not-implemented (fleshed out in US8)
- [ ] T056a [P] [US1] Create task management tools in `services/agent/app/tools/tasks.py` — `create_task(title, description, priority, due_date)`, `list_tasks(status, project_id)`, `update_task(task_id, title, description, completed, priority)`, `complete_task(task_id)` — all backed by local Postgres `tasks` table via asyncpg
- [ ] T056b [P] [US1] Create Composio toolset in `services/agent/app/tools/composio.py` — initialize `ComposioToolSet` from `composio-langgraph`, expose as optional tools for external app connections (Todoist, Notion, etc.), guarded by `COMPOSIO_API_KEY` env var

### Tests

- [ ] T057 [US1] Create server action tests in `src/__tests__/server-actions.test.ts` — test `createConversation`, `getConversations`, `saveMessage`, `getMessages` with auth scoping and validation (Vitest)
- [ ] T058 [US1] Create agent graph tests in `services/agent/tests/test_graph.py` — test graph structure (nodes, edges), routing logic (tools vs end), basic invocation with mock LLM (pytest)
- [ ] T059 [US1] Create agent tool tests in `services/agent/tests/test_tools.py` — test tool definitions, argument parsing, return payloads for search_web, execute_code, list_files, read_file (pytest)

**Checkpoint**: MVP complete — users can sign in, start a conversation, agent responds with streaming text, tools execute and return results inline via CopilotKit chat. This is the minimum viable product.

---

## Phase 5: User Story 2 — Agent-Driven Workspace Artifacts (Priority: P2)

**Goal**: Agent creates visual artifacts (code, HTML, SVG, React, diffs) that appear in a resizable workspace panel. User can iterate on artifacts by asking the agent to modify them.

**Independent Test**: Ask agent to "create an HTML counter page" — workspace panel opens, artifact renders with live preview. Ask "change the counter to start at 10" — artifact updates in place.

### Zustand Workspace Store

- [ ] T060 [US2] Create Zustand workspace store in `src/components/workspace/workspace-store.ts` — full state shape (isOpen, activeTab, panelSize, artifacts, browser*, document*, terminal*, files*, agentOutput*, activities), all actions from workspace-store contract (open, close, addArtifact, updateArtifact, pushActivity, etc.)
- [ ] T061 [US2] Create workspace store tests in `src/__tests__/workspace-store.test.ts` — test open/close/switch surface state transitions, addArtifact/updateArtifact, activity log FIFO at 50 entries (Vitest)

### Three-Panel Layout

- [ ] T062 [US2] Create resize handle component in `src/components/layout/resize-handle.tsx` — styled drag handle for panel divider, 60fps resize, min/max panel constraints (25-60%)
- [ ] T063 [US2] Update app shell in `src/components/layout/app-shell.tsx` — integrate `react-resizable-panels` with three panels (sidebar 20%, chat 45%, workspace 35% default), wire workspace panel visibility to Zustand store `isOpen`

### Workspace Panel & Tabs

- [ ] T064 [US2] Create workspace panel container in `src/components/workspace/workspace-panel.tsx` — render active surface based on Zustand `activeTab`, subscribe to `isOpen` for visibility
- [ ] T065 [US2] Create workspace tabs component in `src/components/workspace/workspace-tabs.tsx` — tab bar for surface switching (Artifacts, Browser, Document, Terminal, Files, Output), only show tabs with active content
- [ ] T066 [P] [US2] Create workspace header in `src/components/workspace/shared/workspace-header.tsx` — surface title and action buttons (close, fullscreen)
- [ ] T067 [P] [US2] Create workspace activity indicator in `src/components/workspace/shared/workspace-activity.tsx` — activity log display showing recent agent tool actions

### Artifacts Surface

- [ ] T068 [US2] Create artifact surface in `src/components/workspace/surfaces/artifacts/artifact-surface.tsx` — list artifacts from Zustand store, click to view, tab navigation for multiple artifacts
- [ ] T069 [US2] Create artifact viewer in `src/components/workspace/surfaces/artifacts/artifact-viewer.tsx` — render artifact by type: code (syntax highlighted), HTML (sandboxed iframe), SVG (inline), React (preview), diff (unified diff view), mermaid (diagram)

### Python Agent — Artifact Tools

- [ ] T070 [US2] Create artifact tools in `services/agent/app/tools/artifacts.py` — `create_artifact(type, title, content, language)` and `update_artifact(artifact_id, content)`, both trigger AG-UI tool events that flow to CopilotKit frontend

### CopilotKit Frontend Tools

- [ ] T071 [US2] Create frontend tool actions in `src/components/copilot/frontend-tools.ts` — `useCopilotAction` for `create_artifact` (calls `addArtifact` on store, opens workspace to artifacts tab) and `update_artifact` (calls `updateArtifact` on store)
- [ ] T072 [US2] Create artifact generative UI renderer in `src/components/copilot/tool-renderers/render-artifact.tsx` — inline card in chat showing artifact title, type, "Open in Workspace" button

**Checkpoint**: Workspace panel works with artifacts. Agent can create and update artifacts that render in the workspace. Panel resizes smoothly. Multiple artifacts display in tabs.

---

## Phase 6: User Story 4 — Multi-Provider Model Selection (Priority: P2)

**Goal**: Users configure API keys for multiple providers and select models per conversation. Provider routing works through LangChain on the Python agent side.

**Independent Test**: Configure two provider API keys, start a conversation with one model, switch to another, verify each responds from the correct provider.

### API Key Management

- [ ] T073 [US4] Create API key encryption helpers in `src/lib/auth/crypto.ts` — `encryptKey(plaintext)` and `decryptKey(cipher)` using AES-256-GCM with `BETTER_AUTH_SECRET` as key source
- [ ] T074 [US4] Create settings server actions in `src/lib/server/actions/settings.ts` — `saveApiKey(provider, key)`, `deleteApiKey(provider)`, `listApiKeys()` with encryption/decryption, scoped to authenticated user
- [ ] T075 [US4] Create settings page layout in `src/app/(app)/settings/page.tsx` — tabs or sections for API Keys, MCP Servers, Profile, Memory (placeholder for later)

### API Key Management UI

- [ ] T076 [US4] Create API key management section in `src/app/(app)/settings/page.tsx` — form per provider (openai, anthropic, google, groq, mistral, xai, deepseek, openrouter, ollama) with masked key display, add/remove actions, Ollama base URL field

### Model Selector

- [ ] T077 [US4] Create model selector component in `src/components/copilot/model-selector.tsx` — dropdown listing available providers and models based on configured API keys, persist selection per conversation via server action, include in chat header

### Agent-Side Provider Resolution

- [ ] T078 [US4] Wire provider resolution into agent graph — update `services/agent/app/graph/nodes/llm.py` to read `model` and `api_keys` from agent state, pass to `resolve_model()`, so per-conversation model selection flows from frontend → AG-UI → Python agent
- [ ] T079 [US4] Create provider resolution tests in `services/agent/tests/test_providers.py` — test `resolve_model()` for each provider, test Ollama base URL handling, test unknown provider error (pytest)

### Settings Server Actions

- [ ] T080 [US4] Add profile management to settings actions — `updateProfile(name, image)` in `src/lib/server/actions/settings.ts`

**Checkpoint**: Users can configure API keys, select models per conversation, agent routes to the correct provider. Model selection persists across messages.

---

## Phase 7: User Story 8 — Multi-Agent Delegation (Priority: P2)

**Goal**: Primary agent delegates specialized tasks to sub-agents (research, code) via LangGraph sub-graphs. User sees unified conversation with delegation status.

**Independent Test**: Ask "Research React patterns and write a component" — verify task flows through research sub-agent then code sub-agent, final result incorporates both.

### Sub-Graph Definitions

- [ ] T081 [US8] Create research sub-graph in `services/agent/app/graph/subgraphs/research.py` — StateGraph with plan → search → synthesize nodes, own state extending AgentState, returns synthesized research results
- [ ] T082 [US8] Create code sub-graph in `services/agent/app/graph/subgraphs/code.py` — StateGraph with plan → generate → validate nodes, own state extending AgentState, returns generated code

### Router & Delegation

- [ ] T083 [US8] Update router node in `services/agent/app/graph/nodes/router.py` — add conditional edges for "research" and "code" delegation targets, check for `delegate_to_agent` tool calls
- [ ] T084 [US8] Update graph builder in `services/agent/app/graph/builder.py` — add research and code sub-graphs as compiled nodes, add edges: llm → research → llm, llm → code → llm
- [ ] T085 [US8] Implement `delegate_to_agent` tool in `services/agent/app/tools/delegate.py` — accept agent name and task, invoke corresponding sub-graph node, return results to parent graph

### Tests

- [ ] T086 [US8] Create sub-graph tests in `services/agent/tests/test_subgraphs.py` — test research sub-graph execution, code sub-graph execution, delegation routing, error handling in sub-agents (pytest)

**Checkpoint**: Multi-agent delegation works. Complex tasks automatically route to specialist sub-agents. Results flow back to primary agent for cohesive response.

---

## Phase 8: User Story 9 — Agent Memory & Recall (Priority: P2)

**Goal**: Agent stores important information as memories and recalls them across conversations using semantic search. Users can manage memories in settings.

**Independent Test**: Tell agent "I prefer TypeScript", start new conversation, ask "write a hello world", verify agent recalls TypeScript preference.

### Memory Database Layer

- [ ] T087 [US9] Create memory DB helpers in `services/agent/app/db/memory.py` — asyncpg functions: `save_memory(conn, user_id, content, embedding, tags)`, `recall_memories(conn, user_id, query_embedding, top_k)` using pgvector cosine similarity (`embedding <=> $1`)

### Memory Tools

- [ ] T088 [US9] Create embedding helper in `services/agent/app/db/memory.py` — `generate_embedding(text, api_key)` using OpenAI or configured provider's embedding API, returns 1536-dimension vector
- [ ] T089 [US9] Create `save_memory` tool in `services/agent/app/tools/memory.py` — accept content and optional tags, generate embedding, store in memories table, return confirmation
- [ ] T090 [US9] Create `recall_memory` tool in `services/agent/app/tools/memory.py` — accept query and top_k, generate query embedding, pgvector cosine similarity search, return ranked memories

### Frontend Memory Management

- [ ] T091 [US9] Add memory server actions in `src/lib/server/actions/settings.ts` — `getMemories()` and `deleteMemory(id)` scoped to authenticated user, querying Drizzle `memories` table
- [ ] T092 [US9] Create memory management section in settings page — list stored memories with content preview, tags, timestamps, search input, delete button per memory

### Tests

- [ ] T093 [US9] Create memory tool tests in `services/agent/tests/test_memory.py` — test save_memory inserts with embedding, test recall_memory returns ranked results, test pgvector similarity ordering (pytest)

**Checkpoint**: Agent memory works. Agent automatically saves and recalls information across conversations. Users can view, search, and delete memories.

---

## Phase 9: User Story 3 — Document Editing Surface (Priority: P3)

**Goal**: Agent creates and edits rich-text documents in a WYSIWYG editor (TipTap). Users can also directly edit documents.

**Independent Test**: Ask agent to "write a meeting summary document" — Document surface opens with formatted content. Edit directly and ask agent to add a section.

### Document Surface

- [ ] T094 [US3] Create document surface in `src/components/workspace/surfaces/document/document-surface.tsx` — render active document from Zustand store, integrate TipTap editor
- [ ] T095 [US3] Create TipTap editor in `src/components/workspace/surfaces/document/tiptap-editor.tsx` — TipTap instance with starter-kit extensions (headings, bold, lists, code blocks), bidirectional sync with Zustand `documentContent`
- [ ] T096 [P] [US3] Create document toolbar in `src/components/workspace/surfaces/document/document-toolbar.tsx` — formatting buttons (bold, italic, heading, list, code), title editing

### Python Agent — Document Tool

- [ ] T097 [US3] Create `create_document` tool in `services/agent/app/tools/documents.py` — accept title, content (markdown/rich text), optional document_id for updates, trigger AG-UI event to open Document surface

### CopilotKit Frontend Tool

- [ ] T098 [US3] Register `create_document` useCopilotAction in `src/components/copilot/frontend-tools.ts` — handler sets document content and title in Zustand store, opens workspace to Document tab
- [ ] T099 [US3] Create document generative UI renderer in `src/components/copilot/tool-renderers/render-document.tsx` — inline card showing document title and "Open in Workspace" button

**Checkpoint**: Document surface works with TipTap rich text editing. Agent can create and edit documents. User can directly modify content.

---

## Phase 10: User Story 6 — MCP Server Configuration (Priority: P3)

**Goal**: Users configure MCP servers in settings. Agent discovers and uses MCP tools during conversations.

**Independent Test**: Configure a simple MCP server (e.g., filesystem), start a conversation, ask agent to use a tool from that server.

### MCP Client Infrastructure

- [ ] T100 [US6] Create MCP client factory in `src/lib/mcp/client.ts` — create MCP client connections per server config (stdio or SSE transport), using `@modelcontextprotocol/sdk`
- [ ] T101 [US6] Create MCP registry in `src/lib/mcp/registry.ts` — manage active MCP connections per user, `connect(serverConfig)`, `disconnect(serverId)`, `discoverTools(serverId)`, `executeTool(serverId, toolName, args)`

### MCP Server Configuration UI

- [ ] T102 [US6] Create MCP server server actions in `src/lib/server/actions/settings.ts` — `saveMcpServer()`, `toggleMcpServer()`, `deleteMcpServer()` scoped to authenticated user
- [ ] T103 [US6] Create MCP server management section in settings page — form for name, transport type (stdio/SSE), command or URL, args, env vars; server list with status (connected/disconnected/error), enable/disable toggle

### MCP → LangGraph Bridge

- [ ] T104 [US6] Implement MCP tool schema bridge — pass discovered MCP tool schemas from Next.js CopilotRuntime to Python agent via AG-UI request metadata, dynamically create LangGraph `Tool` instances in agent graph prefixed as `mcp__<server_id>__<tool_name>`
- [ ] T105 [US6] Implement MCP tool execution forwarding — when Python agent invokes an MCP tool, forward execution back to Next.js CopilotRuntime via AG-UI event, execute via MCP registry, return result

**Checkpoint**: MCP server configuration works. Agent can discover and use tools from user-configured MCP servers. Servers can be enabled/disabled independently.

---

## Phase 11: User Story 7 — Persistent Agent Runs with Checkpointing (Priority: P3)

**Goal**: Agent runs persist across browser closes and server restarts via PostgresSaver checkpoints. Users see progress and can resume interrupted tasks.

**Independent Test**: Start a long-running task, close browser, reopen, verify agent resumes from last checkpoint.

### Checkpoint Recovery Flow

- [ ] T106 [US7] Verify PostgresSaver checkpoint integration in `services/agent/app/main.py` — ensure `checkpointer.setup()` runs on startup, `thread_id` from conversation maps to LangGraph thread, `graph.invoke(input, config={"configurable": {"thread_id": ...}})` resumes correctly
- [ ] T107 [US7] Implement thread ID lifecycle in conversation flow — set `conversations.thread_id` on first message (UUID), pass thread_id from frontend → CopilotKit → AG-UI → Python agent for checkpoint resume

### Progress & Recovery UI

- [ ] T108 [US7] Add agent status indicators to chat UI — show "Agent is working..." with spinner for active runs, show "Resuming from checkpoint..." on reconnect
- [ ] T109 [US7] Create checkpoint tests in `services/agent/tests/test_checkpoint.py` — test checkpoint save after each step, test resume from last checkpoint, test resume after simulated crash (pytest)

**Checkpoint**: Persistent agent execution works. Tasks survive browser closes and server restarts. Users see progress and can resume.

---

## Phase 12: User Story 10 — Workspace Browser & Terminal Surfaces (Priority: P3)

**Goal**: Agent opens browser surface for web browsing (screenshot-based) and terminal surface for command execution. These surfaces appear in workspace panel on tool invocation.

**Independent Test**: Ask agent to "open example.com" (browser) or "run ls -la" (terminal) — verify surface opens and displays results.

### Browser Surface

- [ ] T110 [US10] Create browser surface in `src/components/workspace/surfaces/browser/browser-surface.tsx` — display browser screenshot from Zustand store, subscribe to `browserUrl`, `browserScreenshot`, `browserStatus`
- [ ] T111 [P] [US10] Create browser toolbar in `src/components/workspace/surfaces/browser/browser-toolbar.tsx` — URL bar, refresh button, status indicator
- [ ] T112 [P] [US10] Create browser preview in `src/components/workspace/surfaces/browser/browser-preview.tsx` — render base64 screenshot as image, responsive scaling

### Terminal Surface

- [ ] T113 [US10] Create terminal surface in `src/components/workspace/surfaces/terminal/terminal-surface.tsx` — display terminal output from Zustand store, auto-scroll on new output
- [ ] T114 [US10] Create xterm wrapper in `src/components/workspace/surfaces/terminal/xterm-wrapper.tsx` — xterm.js terminal emulator with fit addon, rendering streamed output from agent `execute_code` tool

### CopilotKit Frontend Tools

- [ ] T115 [US10] Register `browse_web` useCopilotAction in `src/components/copilot/frontend-tools.ts` — handler sets browser URL and screenshot in Zustand store, opens workspace to Browser tab
- [ ] T116 [US10] Register `execute_code` useCopilotAction in `src/components/copilot/frontend-tools.ts` — handler appends terminal output to Zustand store, opens workspace to Terminal tab
- [ ] T117 [US10] Create browser generative UI renderer in `src/components/copilot/tool-renderers/render-browser.tsx` — inline card showing URL and screenshot thumbnail
- [ ] T118 [US10] Create code execution generative UI renderer in `src/components/copilot/tool-renderers/render-code-execution.tsx` — inline card showing language, code snippet, and output

**Checkpoint**: Browser and terminal surfaces work. Agent can browse URLs (screenshot) and execute commands. Surfaces auto-open on tool invocation.

---

## Phase 13: Polish & Cross-Cutting Concerns

**Purpose**: Complete remaining surfaces, HITL flows, error handling, and end-to-end validation.

### Remaining Surfaces

- [ ] T119 [P] Create files surface in `src/components/workspace/surfaces/files/files-surface.tsx` — file tree view from Zustand store, click to preview
- [ ] T120 [P] Create file tree component in `src/components/workspace/surfaces/files/file-tree.tsx` — recursive tree rendering with expand/collapse, file type icons
- [ ] T121 [P] Create file preview in `src/components/workspace/surfaces/files/file-preview.tsx` — display file content with syntax highlighting for code files
- [ ] T122 [P] Create agent output surface in `src/components/workspace/surfaces/agent-output/agent-output-surface.tsx` — streaming markdown display from Zustand `agentOutputStream`
- [ ] T123 [P] Create streaming text component in `src/components/workspace/surfaces/agent-output/streaming-text.tsx` — markdown renderer with streaming text animation

### Frontend Tool Wiring

- [ ] T124 Register file tools useCopilotActions in `src/components/copilot/frontend-tools.ts` — `list_files` (sets files in store), `read_file` (sets file preview), `write_file` (with HITL confirmation)
- [ ] T125 Create search generative UI renderer in `src/components/copilot/tool-renderers/render-search.tsx` — inline card showing search results with title, URL, snippet

### Human-in-the-Loop

- [ ] T126 Implement HITL approval flow — configure `write_file` and other sensitive tools to require user confirmation via CopilotKit's action confirmation UI before execution in the LangGraph tool node

### Error Handling

- [ ] T127 Add agent service unreachability handling — CopilotRuntime error detection when Python service is down, show "Agent service is unreachable" message with retry button in chat
- [ ] T128 Add tool execution error handling — graceful error display in chat for failed tool calls, no conversation crash on tool failure

### Final Validation

- [ ] T129 Create projects page in `src/app/(app)/projects/page.tsx` — project list, create/update/delete via server actions in `src/lib/server/actions/projects.ts`
- [ ] T130 Create project server actions in `src/lib/server/actions/projects.ts` — `createProject()`, `updateProject()`, `deleteProject()` scoped to authenticated user
- [ ] T131 Run quickstart.md validation scenarios 1–8 end-to-end, fix any issues found

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational) ← BLOCKS ALL USER STORIES
    ↓
Phase 3 (US5 Auth) ← P1, prerequisite for all data-scoped stories
    ↓
Phase 4 (US1 Agent Conversation) ← P1, MVP CORE
    ↓
    ├── Phase 5 (US2 Workspace Artifacts) ← P2, needs US1 tools
    ├── Phase 6 (US4 Multi-Provider) ← P2, needs US5 auth + US1 agent
    ├── Phase 7 (US8 Multi-Agent Delegation) ← P2, needs US1 graph
    └── Phase 8 (US9 Agent Memory) ← P2, needs US1 agent
         ↓
    Phase 9 (US3 Document Surface) ← P3, needs US2 workspace panel
    Phase 10 (US6 MCP) ← P3, needs US1 agent
    Phase 11 (US7 Checkpointing) ← P3, needs US1 PostgresSaver
    Phase 12 (US10 Browser/Terminal) ← P3, needs US2 workspace panel
         ↓
    Phase 13 (Polish) ← after all desired stories complete
```

### User Story Dependencies

| Story | Depends On | Reason |
|-------|-----------|--------|
| US5 (Auth) | Phase 2 | Better Auth config + Drizzle users table |
| US1 (Agent Chat) | US5 | Conversations/messages are user-scoped |
| US2 (Artifacts) | US1 | Artifacts created by agent tool calls |
| US4 (Multi-Provider) | US5, US1 | API keys are user-scoped, model routing goes through agent |
| US8 (Delegation) | US1 | Sub-graphs are part of the LangGraph agent graph |
| US9 (Memory) | US1 | Memory tools execute within agent graph |
| US3 (Document) | US2 | Document surface lives in workspace panel |
| US6 (MCP) | US1 | MCP tools injected into agent graph |
| US7 (Checkpointing) | US1 | PostgresSaver configured as part of agent service |
| US10 (Browser/Terminal) | US2 | Browser/Terminal surfaces live in workspace panel |

### Parallel Opportunities

**After Phase 2 (Foundational) completes:**
- Phase 3 (US5) must complete first (auth is prerequisite)

**After Phase 4 (US1) completes:**
- Phase 5 (US2), Phase 6 (US4), Phase 7 (US8), Phase 8 (US9) can ALL run in parallel

**After Phase 5 (US2) completes:**
- Phase 9 (US3), Phase 12 (US10) can run in parallel

**Within each phase:**
- All tasks marked [P] can run in parallel (different files, no dependencies)
- Schema files (T008–T015) are all parallelizable
- Tool files (T052–T056) are all parallelizable
- Surface components within a phase are often parallelizable

---

## Parallel Example: Phase 4 (US1 — Agent Conversation)

```bash
# After T036-T044 (server actions + frontend) are done:

# Launch Python tools in parallel:
Task: "Create search_web tool in services/agent/app/tools/search.py"
Task: "Create browse_web tool in services/agent/app/tools/browser.py"
Task: "Create execute_code tool in services/agent/app/tools/terminal.py"
Task: "Create file tools in services/agent/app/tools/files.py"

# Then sequential graph wiring:
Task: "Create LLM node in services/agent/app/graph/nodes/llm.py"
Task: "Create tool execution node in services/agent/app/graph/nodes/tools.py"
Task: "Build main agent graph in services/agent/app/graph/builder.py"
```

---

## Implementation Strategy

### MVP First (User Stories 5 + 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks everything)
3. Complete Phase 3: US5 — Authentication
4. Complete Phase 4: US1 — Agent Conversation with Tool Calling
5. **STOP and VALIDATE**: Test the full agent conversation loop end-to-end
6. Deploy/demo if ready — this is the MVP

### Incremental Delivery

1. Setup + Foundational + US5 + US1 → **MVP** (auth + agent chat with tools)
2. Add US2 → Workspace panel with artifacts (P2 value)
3. Add US4 → Multi-provider model selection (P2 value)
4. Add US8 → Multi-agent delegation (P2 value)
5. Add US9 → Agent memory and recall (P2 value)
6. Add US3 + US10 → Document, Browser, Terminal surfaces (P3 value)
7. Add US6 → MCP server integration (P3 value)
8. Add US7 → Persistent checkpointing validation (P3 value)
9. Polish → Final integration and validation

### Two-Service Deployment

- **Next.js Frontend**: `npm run dev` on port 3000
- **Python Agent Service**: `cd services/agent && uvicorn app.main:app --reload --port 8000`
- **PostgreSQL**: Shared database with pgvector extension
- **Environment**: `AGENT_SERVICE_URL=http://localhost:8000` in Next.js `.env`

---

## Notes

- [P] tasks work on different files with no shared dependencies
- [Story] labels map tasks to spec.md user stories for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group using conventional commits
- Stop at any checkpoint to validate the story independently
- Python agent service uses the same PostgreSQL as Next.js (different tables)
- CopilotKit frontend code is unchanged by the Python backend swap
- PostgresSaver checkpoint tables are managed by LangGraph (not Drizzle)
- Memory table is managed by Drizzle (schema) but read/written by Python agent (asyncpg SQL)
