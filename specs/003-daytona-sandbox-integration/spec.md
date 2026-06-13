# Feature Specification: Daytona Sandbox Integration

**Feature Branch**: `003-daytona-sandbox-integration`

**Created**: 2026-06-13

**Status**: Draft

**Input**: Replace all local/Python agent tools with Daytona.io sandbox + agent tools via their TypeScript SDK. Use Daytona sandboxes for code execution, file operations, terminal sessions, and browser automation. Simplify the app by removing the Python agent service and running Daytona API calls from the Next.js backend.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Execute Code in a Sandbox (Priority: P1)

A user asks Dexter to run code (Python, JavaScript, TypeScript, shell). The system creates or reuses a Daytona sandbox, executes the code inside it, and streams the output back to the chat and workspace terminal panel. The user sees the result in real time with stdout, stderr, and exit code.

**Why this priority**: Code execution is the core agentic capability. Without it, Dexter is just a chatbot. This unblocks the terminal workspace surface.

**Independent Test**: Can be fully tested by sending "Run this Python code: print('hello')" and verifying the output appears in chat and the terminal panel opens with the result.

**Acceptance Scenarios**:

1. **Given** a user is in a chat session, **When** they ask Dexter to execute code, **Then** a Daytona sandbox is created (or reused), the code runs inside it, and the output streams back to the user in chat and the terminal workspace panel
2. **Given** a sandbox is already running for the user, **When** they request another code execution, **Then** the existing sandbox is reused without creating a new one
3. **Given** code execution produces an error, **When** the process exits with a non-zero code, **Then** stderr is displayed prominently with the error details
4. **Given** code execution takes longer than the timeout, **When** the timeout is reached, **Then** the user sees a timeout message and the sandbox remains usable

---

### User Story 2 - Browse the Web via Sandbox (Priority: P2)

A user asks Dexter to browse a URL or take a screenshot of a website. The system uses Daytona's Computer Use API to open a browser in the sandbox, take a screenshot, and display it in the browser workspace panel.

**Why this priority**: Browser automation is the second most impactful agentic tool. It makes the browser workspace surface functional and enables research tasks.

**Independent Test**: Can be tested by asking "Take a screenshot of google.com" and verifying the screenshot appears in the browser panel.

**Acceptance Scenarios**:

1. **Given** a user asks to browse a URL, **When** Dexter processes the request, **Then** the sandbox starts computer use, navigates to the URL, takes a screenshot, and displays it in the browser workspace panel
2. **Given** a user asks to interact with a page element, **When** Dexter uses mouse/keyboard actions, **Then** the interaction is performed in the sandbox browser and a new screenshot confirms the result
3. **Given** a website is unreachable, **When** the browser fails to load, **Then** the user sees a clear error message in the browser panel

---

### User Story 3 - Manage Files in the Sandbox (Priority: P2)

A user asks Dexter to create, read, update, or delete files in the sandbox workspace. File operations go through Daytona's FileSystem API, and the files surface in the workspace panel shows the directory tree.

**Why this priority**: File operations are essential for any agentic workflow — writing code, editing configs, managing projects. This unblocks the files workspace surface.

**Independent Test**: Can be tested by asking "Create a file called hello.py with print('hello')" and verifying the file appears in the files panel with the correct content.

**Acceptance Scenarios**:

1. **Given** a user asks to create a file, **When** Dexter writes the file via Daytona FS API, **Then** the file appears in the workspace files panel
2. **Given** a user asks to list files in a directory, **When** Dexter calls the FS list API, **Then** the directory tree is rendered in the files panel with names, sizes, and types
3. **Given** a user asks to read a file, **When** Dexter downloads the file content, **Then** the content is displayed in the chat and/or workspace artifact viewer
4. **Given** a user asks to run a git operation, **When** Dexter uses the Daytona Git API, **Then** clone, status, add, commit, push operations work inside the sandbox

---

### User Story 4 - Search the Web (Priority: P3)

A user asks Dexter to search the web for information. The system executes a search tool and returns structured results (titles, URLs, snippets).

**Why this priority**: Search is useful for research but can be deferred in favor of core sandbox operations.

**Independent Test**: Can be tested by asking "Search for the latest Node.js version" and verifying structured results appear.

**Acceptance Scenarios**:

1. **Given** a user asks a question that requires web search, **When** Dexter invokes the search tool, **Then** structured results (title, URL, snippet) are returned and displayed in chat
2. **Given** a search returns no results, **When** the query is too specific, **Then** the user sees a helpful message suggesting broader terms

---

### User Story 5 - Sandbox Lifecycle Management (Priority: P3)

The system automatically creates a sandbox per user session, manages its lifecycle (auto-stop, auto-archive), and cleans up when the user is done. Users can see sandbox status in the workspace.

**Why this priority**: Lifecycle management is essential for production but can work with simple defaults initially.

**Independent Test**: Can be tested by starting a conversation, verifying a sandbox is created on first tool use, and confirming it auto-stops after the configured idle period.

**Acceptance Scenarios**:

1. **Given** a user starts a new conversation, **When** a tool requires a sandbox, **Then** one is automatically created with a sensible default configuration and its ID saved to the conversation record
2. **Given** a conversation's sandbox has been idle, **When** the auto-stop interval is reached, **Then** the sandbox stops automatically to save resources
3. **Given** a user returns to a conversation whose sandbox stopped, **When** they send a new message requiring tools, **Then** the sandbox is restarted automatically (or a new one created if the old one was archived)

---

### Edge Cases

- What happens when the Daytona API is unreachable or the API key is invalid? → The system falls back to a text-only response explaining the sandbox service is unavailable
- What happens when a sandbox creation times out? → The user sees a timeout error with a retry option
- What happens when multiple concurrent requests hit the same sandbox? → Daytona sessions handle concurrency; the system queues requests if needed
- What happens when a user tries to execute malicious code? → Daytona sandboxes are isolated by design; the code runs in a container with no access to the host
- What happens when sandbox resources (CPU, memory, disk) are exhausted? → The user sees a resource limit error; the system can optionally resize the sandbox

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST integrate Daytona TypeScript SDK (`@daytonaio/sdk`) into the Next.js backend to create and manage sandboxes
- **FR-002**: System MUST create one Daytona sandbox per conversation and reuse it for all tool calls within that conversation, tracked via `sandboxId` on the conversations table
- **FR-003**: System MUST provide a code execution tool that runs Python, JavaScript, TypeScript, and shell commands inside the Daytona sandbox via `sandbox.process.executeCommand()` and `sandbox.process.codeRun()`
- **FR-004**: System MUST provide a terminal tool that creates persistent PTY sessions inside the sandbox via `sandbox.process.createSession()` and `sandbox.process.executeSessionCommand()` for stateful multi-step commands
- **FR-005**: System MUST provide a file operations tool that reads, writes, lists, and deletes files inside the sandbox via `sandbox.fs` API
- **FR-006**: System MUST provide a git operations tool that clones, status checks, stages, commits, and pushes inside the sandbox via `sandbox.git` API
- **FR-007**: System MUST provide a browser/computer-use tool that takes screenshots, moves mouse, clicks, and types inside the sandbox via `sandbox.computerUse` API
- **FR-008**: System MUST provide a web search tool for retrieving search results from the internet
- **FR-009**: System MUST route all tool results back through CopilotKit's AG-UI protocol so that workspace panel surfaces (terminal, browser, files, artifacts) update in real time
- **FR-010**: System MUST replace the Python FastAPI agent service with LangGraph.js running in-process inside Next.js, orchestrated via CopilotKit's `LangGraphAGUIAgent` adapter. The Python service (`services/agent/`) is removed entirely.
- **FR-011**: System MUST store Daytona API credentials securely (API key in environment variables, not in client-side code)
- **FR-012**: System MUST handle sandbox lifecycle (create, start, stop, delete) automatically without user intervention
- **FR-013**: System MUST track the user's active sandbox ID in the database (conversations table) so it persists across page reloads
- **FR-014**: System MUST clean up orphaned sandboxes (auto-delete interval) to prevent resource waste

- **FR-015**: System MUST provide a memory tool that saves and recalls user-specific facts from a `memories` table using pgvector embeddings

### Key Entities

- **Sandbox**: A Daytona sandbox instance — has an ID, state (started/stopped/archived), resources (CPU, memory, disk), and belongs to a user. Tracked via `sandboxId` on the Conversation entity.
- **SandboxSession**: A logical session within a sandbox for multi-step terminal operations. Identified by `sessionId`, tracks commands executed.
- **ToolResult**: The structured output from a tool execution — includes stdout, stderr, exit code, screenshots (base64), file listings, or error messages. Displayed in both chat and workspace panels.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can execute code and see output within 5 seconds of asking (including sandbox warm-start time)
- **SC-002**: The browser panel displays real screenshots taken from within a Daytona sandbox
- **SC-003**: File operations (create, read, list) reflect in the workspace files panel immediately after the agent performs them
- **SC-004**: The Python agent service (`services/agent/`) is completely removed from the project with no loss of functionality
- **SC-005**: All six workspace surfaces (artifacts, browser, document, terminal, files, agent-output) receive data from agent tool calls routed through CopilotKit
- **SC-006**: A sandbox is created on first tool use and reused for subsequent operations within the same conversation
- **SC-007**: Idle sandboxes auto-stop within the configured interval, reducing costs when not in use

## Clarifications

### Session 2026-06-13

- Q: Should the Daytona integration bypass the LangGraph agent backend, and which agent SDK? → A: LangGraph.js (TypeScript) running in-process inside Next.js via CopilotKit's `LangGraphAGUIAgent` adapter. Python service removed. Daytona tools called directly via `@daytonaio/sdk` from LangGraph tool handlers. Constitution Principle V amended from Python LangGraph to LangGraph.js.
- Q: Should sandbox scope be per-user or per-conversation? → A: Per conversation — each conversation gets its own sandbox, aligned with LangGraph checkpointing and better isolation between conversations.
- Q: Should CopilotKit remain in the stack? → A: Yes — CopilotKit provides the chat UI, agent↔workspace bridge (useCopilotAction), generative UI, HITL, and AG-UI protocol handling. No reason to remove it.

## Assumptions

- Daytona.io cloud API is available at `https://app.daytona.io/api` (or self-hosted equivalent)
- A valid Daytona API key is available via `DAYTONA_API_KEY` environment variable
- Each conversation gets its own Daytona sandbox. A user may have multiple conversations with multiple sandboxes, but each conversation has at most one active sandbox.
- The agent orchestration uses LangGraph.js (`@langchain/langgraph`) running inside Next.js, connected to CopilotKit via `LangGraphAGUIAgent` adapter
- Daytona tools are called directly from LangGraph.js tool handlers via the TypeScript SDK — no HTTP bridge or separate service
- The existing CopilotKit runtime endpoint (`/api/copilotkit`) remains the chat pipeline entry point
- Daytona's default sandbox snapshot includes Python, Node.js, and basic Unix tools
- The sandbox auto-stop interval defaults to 15 minutes (Daytona default) and can be configured per conversation
- Browser/computer-use requires starting the desktop environment in the sandbox (Xvfb + noVNC), which adds a few seconds to first use
