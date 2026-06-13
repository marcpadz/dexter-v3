# Tasks: Daytona Sandbox Integration

**Input**: Design documents from `/specs/003-daytona-sandbox-integration/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Constitution Principle VIII mandates automated tests for server actions, agent tool execution, auth flows, and workspace state transitions. Test tasks included as Phase 10.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies, configure environment, clean up dead code, fix build

- [X] T001 Install new dependencies: `npm install @daytonaio/sdk @langchain/langgraph @langchain/core @langchain/anthropic @langchain/openai langgraph-checkpoint-postgres` and run `npm install` to resolve all UNMET dependencies
- [X] T002 [P] Add environment variables to `.env.example`: `DAYTONA_API_KEY`, `DAYTONA_API_URL`, `DAYTONA_TARGET`, `TAVILY_API_KEY`
- [X] T003 [P] Delete all AppleDouble files: `find . -name '._*' -delete`
- [X] T004 Remove zombie dependencies from `package.json`: `next-auth`, `@auth/prisma-adapter`, `@prisma/client`, `@prisma/adapter-pg`, `prisma`
- [X] T005 Delete dead code: `rm src/lib/copilot/chat-adapter.ts`, `rm src/lib/mcp/registry.ts`, `rm src/lib/mcp/client.ts`, `rm -rf src/components/copilot/tool-renderers/`
- [X] T006 Delete entire Python agent service: `rm -rf services/agent/`
- [X] T007 Fix Next.js build: add `turbopack.root` to `next.config.ts` if needed, verify `npm run build` passes

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T008 Add `sandboxId` column to conversations schema in `src/lib/db/schema/conversations.ts` (nullable text field, no default)
- [X] T009 Run `npx drizzle-kit push` to apply the migration
- [X] T010 Create Daytona client singleton in `src/lib/daytona/client.ts` — initialize `new Daytona({ apiKey, apiUrl })` from env vars, export singleton
- [X] T011 Create sandbox manager in `src/lib/daytona/sandbox-manager.ts` — implement `getOrCreateSandbox(conversationId)`, `stopSandbox(conversationId)`, `deleteSandbox(conversationId)` with lazy creation, auto-stop 15min, state checking via Daytona API, and `sandboxId` persistence to conversations table
- [X] T012 Create LangGraph agent state type in `src/lib/agent/state.ts` — `AgentState` with `messages`, `userId`, `model`, `conversationId`, `sandboxId`, `apiKeys`
- [X] T013 Create model provider resolver in `src/lib/agent/providers.ts` — resolve model string (e.g., "anthropic/claude-sonnet-4") to LangChain `BaseChatModel` instance using user's decrypted API keys from the `api_keys` table (call crypto helper from `src/lib/auth/crypto.ts`)
- [X] T014 REWRITE `src/lib/copilot/runtime.ts` — replace `remoteEndpoints` to Python service with `LangGraphAgent` from `@copilotkit/runtime/langgraph` + `CopilotRuntime({ agents: { default: agent } })`
- [X] T015 REWRITE `src/app/(app)/chat/page.tsx` — replace custom form with `<CopilotChat>` from `@copilotkit/react-ui` + `useWorkspaceTools()` hook call. Import `@copilotkit/react-ui/styles.css`
- [X] T016 REWRITE `src/middleware.ts` — re-enable auth checks using `auth.api.getSession()`, redirect unauthenticated users to `/auth/login`

**Checkpoint**: Foundation ready — Daytona client works, LangGraph runtime wired, CopilotChat renders, auth gates active

---

## Phase 3: User Story 1 - Execute Code in a Sandbox (Priority: P1) 🎯 MVP

**Goal**: Users can ask Dexter to run code and see the output in chat and terminal workspace panel

**Independent Test**: Send "Run this Python code: print('hello')" → output appears in chat + terminal panel opens

### Implementation for User Story 1

- [X] T017 [P] [US1] Create code execution tool in `src/lib/daytona/tools/execute-code.ts` — `tool("execute_code", ...)` wrapping `sandbox.process.codeRun()` for Python and `sandbox.process.executeCommand()` for JS/TS/shell. Returns `{ exitCode, stdout, stderr }`
- [X] T018 [P] [US1] Create shell command tool in `src/lib/daytona/tools/execute-command.ts` — `tool("execute_command", ...)` wrapping `sandbox.process.createSession()` + `sandbox.process.executeSessionCommand()` for stateful multi-step commands. Returns `{ sessionId, exitCode, stdout, stderr }`. Note: PTY WebSocket integration for xterm.js is deferred; see task notes.
- [X] T019 [US1] Create tool barrel export in `src/lib/daytona/tools/index.ts` — export array of all tools for the agent graph
- [X] T020 [US1] Build LangGraph supervisor node in `src/lib/agent/nodes/supervisor.ts` — LLM node that binds all Daytona tools, calls model with messages, returns AI message with tool calls
- [X] T021 [US1] Build LangGraph agent graph in `src/lib/agent/graph.ts` — `StateGraph(AgentState)` with supervisor node, tool node, conditional edges (tools → supervisor → end). Compile with `PostgresSaver` checkpointer using `DATABASE_URL`, thread_id = conversationId
- [X] T022 [US1] Wire graph into CopilotKit runtime — update `src/lib/copilot/runtime.ts` to import compiled graph and pass to `LangGraphAgent({ graph })`
- [X] T023 [US1] Add error handling in sandbox manager — catch Daytona API errors (unreachable, invalid key, timeout), return user-friendly error messages, ensure sandbox remains usable after errors

**Checkpoint**: User Story 1 works — code execution flows through CopilotChat → LangGraph → Daytona → workspace terminal

---

## Phase 4: User Story 2 - Browse the Web via Sandbox (Priority: P2)

**Goal**: Users can ask Dexter to browse URLs and see screenshots in the browser workspace panel

**Independent Test**: Ask "Take a screenshot of google.com" → screenshot appears in browser panel

### Implementation for User Story 2

- [X] T024 [US2] Create browser tools in `src/lib/daytona/tools/browser.ts` — `tool("browse_web", ...)` that calls `sandbox.computerUse.start()`, navigates via keyboard (`ctrl+l` → type URL → enter), waits for load, calls `screenshot.takeCompressed()`. Returns `{ url, screenshot_base64 }`. Also `tool("take_screenshot", ...)` for standalone screenshots
- [X] T025 [US2] Add browser tools to barrel export in `src/lib/daytona/tools/index.ts`
- [X] T026 [US2] Add browser tools to supervisor node's tool list in `src/lib/agent/nodes/supervisor.ts`
- [X] T026.5 [US2] Add mouse/keyboard action tools (`click_element`, `type_text`, `scroll_page`) to `src/lib/daytona/tools/browser.ts` and update `contracts/sandbox-tools.md` — enables the agent to interact with pages beyond navigation

**Checkpoint**: Browser panel shows real Daytona sandbox screenshots

---

## Phase 5: User Story 3 - Manage Files in the Sandbox (Priority: P2)

**Goal**: Users can create, read, list, and delete files in the sandbox via the workspace files panel

**Independent Test**: Ask "Create a file called hello.py with print('hello')" → file appears in files panel

### Implementation for User Story 3

- [X] T027 [P] [US3] Create filesystem tools in `src/lib/daytona/tools/filesystem.ts` — four tools: `tool("list_files", ...)` wrapping `sandbox.fs.listFiles()`, `tool("read_file", ...)` wrapping `sandbox.fs.downloadFile()`, `tool("write_file", ...)` wrapping `sandbox.fs.uploadFile()`, `tool("delete_file", ...)` wrapping `sandbox.fs.deleteFile()`
- [X] T028 [P] [US3] Create git tools in `src/lib/daytona/tools/git.ts` — three tools: `tool("git_clone", ...)` wrapping `sandbox.git.clone()`, `tool("git_status", ...)` wrapping `sandbox.git.status()`, `tool("git_commit", ...)` wrapping `sandbox.git.add()` + `sandbox.git.commit()`
- [X] T029 [US3] Add filesystem and git tools to barrel export in `src/lib/daytona/tools/index.ts`
- [X] T030 [US3] Add filesystem and git tools to supervisor node's tool list in `src/lib/agent/nodes/supervisor.ts`

**Checkpoint**: Files and git operations work — workspace files panel shows sandbox directory tree

---

## Phase 6: User Story 4 - Search the Web (Priority: P3)

**Goal**: Users can ask Dexter to search the web and get structured results

**Independent Test**: Ask "Search for the latest Node.js version" → structured results appear in chat

### Implementation for User Story 4

- [X] T031 [US4] Create web search tool in `src/lib/daytona/tools/search.ts` — `tool("web_search", ...)` calling Tavily API (or fallback: `sandbox.process.executeCommand("curl ...")` if no Tavily key). Returns `{ results: Array<{ title, url, content }> }`
- [X] T032 [US4] Add search tool to barrel export in `src/lib/daytona/tools/index.ts`
- [X] T033 [US4] Add search tool to supervisor node's tool list in `src/lib/agent/nodes/supervisor.ts`

**Checkpoint**: Web search returns structured results in chat

---

## Phase 7: User Story 5 - Sandbox Lifecycle Management (Priority: P3)

**Goal**: Sandboxes are created automatically, tracked per conversation, auto-stopped when idle, and cleaned up on conversation delete

**Independent Test**: Start conversation → sandbox created → wait idle → sandbox auto-stops → return → sandbox restarts

### Implementation for User Story 5

- [X] T034 [US5] Add sandbox cleanup to conversation delete action in `src/lib/server/actions/conversations.ts` — before deleting a conversation, call `sandboxManager.deleteSandbox(conversationId)` to stop and remove the Daytona sandbox
- [X] T035 [US5] Add sandbox restart logic to sandbox manager in `src/lib/daytona/sandbox-manager.ts` — when `getOrCreateSandbox()` finds a stopped sandbox, call `sandbox.start()`. When it finds an archived sandbox, create a new one and update `sandboxId`
- [ ] T036 [US5] Set sandbox auto-stop interval on creation — pass `autoStopInterval: 15` to `daytona.create()`. Set `autoArchiveInterval: 1440` (24h). Set `autoDeleteInterval: 10080` (7 days — conversation-level cleanup handles earlier deletion)

**Checkpoint**: Sandbox lifecycle is fully automated — no manual intervention needed

---

## Phase 8: Multi-Agent Sub-Graphs (Enhancement)

**Purpose**: Add research and code sub-graphs for complex multi-step workflows

- [X] T037 [P] Create research sub-graph in `src/lib/agent/subgraphs/research.ts` — `StateGraph` with plan → search → browse → synthesize nodes. Supervisor delegates to this sub-graph when user asks for research tasks
- [X] T038 [P] Create code sub-graph in `src/lib/agent/subgraphs/code.ts` — `StateGraph` with plan → execute_code → validate nodes. Supervisor delegates for complex coding tasks
- [X] T039 Create router node in `src/lib/agent/nodes/router.ts` — conditional edge logic after supervisor: if tool calls → tools node, if `delegate_to_agent("research")` → research sub-graph, if `delegate_to_agent("code")` → code sub-graph, else → end
- [X] T040 Update graph definition in `src/lib/agent/graph.ts` — add sub-graphs as nodes, wire router edges, recompile with checkpointer
- [X] T040.5 Create memory tool in `src/lib/agent/tools/memory.ts` — `tool("save_memory", ...)` writes facts with embeddings to the `memories` table; `tool("recall_memory", ...)` queries pgvector by cosine similarity. Add to graph tool list (Constitution Principle V)

**Checkpoint**: Agent can delegate complex tasks to specialized sub-graphs

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T041 [P] Verify constitution Principle V in `.specify/memory/constitution.md` — wording references `LangGraphAgent` from `@copilotkit/runtime/langgraph`; version is 3.0.0; Sync Impact Report is present
- [X] T042 [P] Update `CHANGELOG.md` with Daytona integration session entry
- [X] T043 Run full quickstart.md validation — execute all 6 validation scenarios from `specs/003-daytona-sandbox-integration/quickstart.md` and verify each passes
- [X] T044 [P] Add logging throughout `src/lib/daytona/` — structured logging for sandbox creation, reuse, errors, and lifecycle events using `console.log` with conversation context
- [X] T045 Security audit — verify Daytona API key never exposed client-side, verify sandbox isolation, verify auth middleware gates all tool-triggering routes

---

## Phase 10: Tests (Constitution Principle VIII)

**Purpose**: Constitution VIII mandates automated tests for server actions, agent tool execution, auth flows, and workspace state transitions

- [ ] T046 [P] Test sandbox manager in `src/__tests__/daytona/sandbox-manager.test.ts` — test `getOrCreateSandbox()` lazy creation, reuse of existing sandbox, restart of stopped sandbox, error handling for Daytona API failures
- [ ] T047 [P] Test Daytona tool handlers in `src/__tests__/daytona/tools/execute-code.test.ts` — test `execute_code` tool with Python/JS/shell, timeout handling, stderr capture, exit code propagation
- [ ] T048 [P] Test Daytona tool handlers in `src/__tests__/daytona/tools/filesystem.test.ts` — test `list_files`, `read_file`, `write_file`, `delete_file` tool definitions, parameter validation, return payload shape
- [ ] T049 [P] Test auth middleware in `src/__tests__/auth/middleware.test.ts` — test session check, redirect to `/auth/login` for unauthenticated users, passthrough for auth routes
- [ ] T050 [P] Test workspace store transitions in `src/__tests__/workspace-store.test.ts` — test `open/close`, `setActiveTab`, `addArtifact/removeArtifact`, `appendTerminalOutput`, state isolation between conversations

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 — core code execution (MVP)
- **US2 (Phase 4)**: Depends on Phase 2 — can start in parallel with US3, US4
- **US3 (Phase 5)**: Depends on Phase 2 — can start in parallel with US2, US4
- **US4 (Phase 6)**: Depends on Phase 2 — can start in parallel with US2, US3
- **US5 (Phase 7)**: Depends on Phase 2 — can start in parallel with US2-US4
- **Sub-Graphs (Phase 8)**: Depends on US1 (needs working tools first)
- **Polish (Phase 9)**: Depends on all desired user stories being complete
- **Tests (Phase 10)**: Depends on Phases 2–8 — tests validate foundational code and user stories (per Constitution VIII)

### User Story Dependencies

- **US1 (P1)**: After Phase 2 — no dependencies on other stories
- **US2 (P2)**: After Phase 2 — independent of US1 (different tools, same graph)
- **US3 (P2)**: After Phase 2 — independent of US1/US2
- **US4 (P3)**: After Phase 2 — independent (uses external search API, not Daytona)
- **US5 (P3)**: After Phase 2 — independent (lifecycle is sandbox manager concern)

### Parallel Opportunities

- T002, T003 can run in parallel (env vars, cleanup)
- T017, T018 can run in parallel (different tool files)
- T027, T028 can run in parallel (filesystem vs git tools)
- Phase 4 (US2), Phase 5 (US3), Phase 6 (US4), Phase 7 (US5) can all run in parallel after Phase 3 completes
- T037, T038 can run in parallel (different sub-graphs)

---

## Parallel Example: Phase 2 (Foundational)

```bash
# After Phase 1 completes, launch these in parallel:
T008: "Add sandboxId column to conversations schema"
T010: "Create Daytona client singleton"
T012: "Create LangGraph agent state type"
T013: "Create model provider resolver"
```

## Parallel Example: User Stories (after Foundation)

```bash
# After Phase 3 (US1) completes, launch these in parallel:
T024: "Create browser tools (US2)"
T027: "Create filesystem tools (US3)"
T028: "Create git tools (US3)"
T031: "Create web search tool (US4)"
T034: "Add sandbox cleanup to conversation delete (US5)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (clean up, install deps)
2. Complete Phase 2: Foundational (Daytona client, LangGraph graph, CopilotChat, auth)
3. Complete Phase 3: User Story 1 (code execution tools)
4. **STOP and VALIDATE**: Send "Run print('hello')" and verify output in chat + terminal panel
5. Deploy/demo if ready

### Incremental Delivery

1. Phase 1+2 → Foundation ready
2. + Phase 3 (US1) → Code execution works → **MVP!**
3. + Phase 4 (US2) → Browser screenshots work
4. + Phase 5 (US3) → File operations work
5. + Phase 6 (US4) → Web search works
6. + Phase 7 (US5) → Lifecycle automated
7. + Phase 8 → Multi-agent sub-graphs
8. + Phase 9 → Production polish
9. + Phase 10 → Automated tests (Constitution VIII)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- The CopilotKit frontend actions in `src/components/copilot/frontend-tools.ts` are already implemented — we only need the server-side agent pipeline to trigger them
- Tool names in LangGraph tool definitions MUST match the frontend action names in `frontend-tools.ts` for CopilotKit's auto-bridge to work (e.g., `execute_code`, `browse_web`, `list_files`)
