# Feature Specification: Dexter v3 — Full Agentic Workspace Rebuild

**Feature Branch**: `001-agentic-workspace-rebuild`

**Created**: 2026-06-09

**Status**: Draft

**Updated**: 2026-06-09 (Architecture v2 — LangGraph Python agent backend)

**Input**: User description: "Rebuild Dexter v2 into a true agentic AI workspace with CopilotKit frontend integration (React chat UI, generative UI, workspace panel, human-in-the-loop, shared state) backed by a separate Python LangGraph agent service connected via AG-UI protocol. The agent backend uses LangGraph StateGraph with PostgresSaver checkpointing for persistent state, sub-graph multi-agent delegation, a memory tool with embedding search for semantic recall, and native long-running task support — replacing the previous BuiltInAgent and Inngest approach. Six workspace surfaces, multi-provider model support, Drizzle ORM migration, Better Auth migration, and MCP client integration remain core features."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Agent Conversation with Tool Calling (Priority: P1)

A user opens Dexter, selects a model provider (e.g., Claude, GPT-4o), and starts a conversation. The agent responds with text and can invoke tools — searching the web, reading documents, or creating artifacts — all streamed in real time through the CopilotKit chat interface. The user sees tool execution progress, results, and any generative UI rendered inline in the chat.

**Why this priority**: This is the foundational interaction loop. Without a working agent conversation with tool calling, no other feature can function. This is the minimum viable product that delivers value — users can have intelligent, tool-augmented conversations with their chosen AI model.

**Independent Test**: Can be fully tested by starting a conversation, asking the agent to perform a tool-using task (e.g., "search for X"), and verifying the tool executes, results render in chat, and the conversation continues naturally. Delivers immediate value as an AI chat assistant with tool capabilities.

**Acceptance Scenarios**:

1. **Given** a user has configured at least one model provider API key, **When** they open a new conversation and type a message, **Then** the agent responds with streamed text through the CopilotKit chat UI within 3 seconds of submission.
2. **Given** the agent determines a tool call is needed, **When** it invokes a tool (e.g., web search), **Then** the user sees tool execution status in the chat, the tool result appears inline, and the agent continues reasoning from the result.
3. **Given** a user wants to switch models mid-conversation, **When** they select a different provider/model from the dropdown, **Then** the next message uses the newly selected model while preserving conversation context.
4. **Given** a conversation has messages, **When** the user returns to the app later, **Then** the conversation is persisted and retrievable from the conversation history sidebar.

---

### User Story 2 - Agent-Driven Workspace Artifacts (Priority: P2)

During a conversation, the agent creates or updates artifacts — code snippets, HTML pages, SVG graphics, React components, or diffs — that appear in a resizable workspace panel to the right of the chat. The user can view, copy, or iterate on these artifacts by asking the agent to modify them. The workspace opens automatically when the agent invokes the artifact creation tool.

**Why this priority**: The workspace panel with artifacts is the key differentiator from a plain chat UI. It transforms Dexter from a chatbot into an agentic workspace where the agent produces tangible outputs alongside the conversation, similar to Claude's Artifacts or Gemini's Canvas.

**Independent Test**: Can be tested by asking the agent to "create an HTML page that shows a counter" — verifying the workspace panel opens, the artifact renders with a live HTML preview, and the user can ask the agent to modify it (e.g., "make the counter start at 10"). Delivers value as a creative/code workspace.

**Acceptance Scenarios**:

1. **Given** the user asks the agent to create an artifact (code, HTML, SVG, React component), **When** the agent invokes the artifact creation tool, **Then** the workspace panel opens automatically and the artifact renders in the appropriate viewer.
2. **Given** an artifact is displayed in the workspace, **When** the user asks the agent to modify it (e.g., "change the color to blue"), **Then** the artifact updates in place with a diff or version update visible.
3. **Given** multiple artifacts exist in the workspace, **When** the user clicks on different tabs, **Then** each artifact is displayed correctly without losing state of the others.
4. **Given** the workspace panel is open, **When** the user drags the panel divider, **Then** the panel resizes smoothly and content reflows responsively.

---

### User Story 3 - Document Editing Surface (Priority: P3)

The agent creates or edits rich-text documents that appear in the workspace panel's Document surface. Users see a WYSIWYG editor with formatting (headings, bold, lists, code blocks) that the agent can populate and modify. Users can also directly edit the document content.

**Why this priority**: Document creation/editing extends the workspace from code-focused to general-purpose content creation. This enables use cases like report writing, meeting summaries, and documentation generation — higher value than P3 but requires the artifact and chat foundation first.

**Independent Test**: Can be tested by asking the agent to "write a meeting summary document" — verifying the Document surface opens with formatted content, and the user can edit it directly or ask the agent to add sections. Delivers value as a collaborative writing tool.

**Acceptance Scenarios**:

1. **Given** the user asks the agent to create a document, **When** the agent invokes the document tool, **Then** the Document surface opens in the workspace with the agent's content rendered as formatted rich text.
2. **Given** a document is open in the workspace, **When** the user directly edits the content, **Then** changes persist and the agent can reference the updated content in subsequent turns.
3. **Given** the agent is asked to edit an existing document, **When** the agent invokes the document edit tool with changes, **Then** the document updates with the agent's modifications while preserving user edits made outside the changed regions.

---

### User Story 4 - Multi-Provider Model Selection (Priority: P2)

Users configure API keys for multiple AI providers (OpenAI, Anthropic, Google, Groq, Mistral, xAI, DeepSeek, OpenRouter, and local Ollama) in their settings. From any conversation, they select which provider and model to use. The system routes requests through the appropriate provider, and conversations remember the last-used model.

**Why this priority**: Multi-provider support is essential for flexibility and cost management. Users should be able to choose the best model for each task. This is P2 because P1 can function with a single provider, but multi-provider is a core differentiator.

**Independent Test**: Can be tested by configuring two different provider API keys, starting a conversation with one model, switching to another, and verifying each responds from the correct provider. Delivers value as provider-agnostic AI access.

**Acceptance Scenarios**:

1. **Given** a user has added API keys for multiple providers, **When** they open a new conversation, **Then** they see a model selector listing all available providers and models.
2. **Given** a user selects a specific model, **When** they send a message, **Then** the response comes from that provider/model and the selection persists for subsequent messages in that conversation.
3. **Given** a user adds a new provider API key in settings, **When** they return to a conversation, **Then** the new provider's models appear in the model selector.
4. **Given** a user has Ollama running locally, **When** they configure the Ollama endpoint in settings, **Then** local models appear alongside cloud providers in the model selector.

---

### User Story 5 - Authentication and User Management (Priority: P1)

New users sign up with email/password or OAuth (Google, GitHub). Returning users sign in and access their conversations, documents, and settings. Sessions persist across browser refreshes. Users can manage their profile and sign out.

**Why this priority**: Authentication is a prerequisite for all user-scoped data — conversations, API keys, documents, MCP server configurations. Without auth, there is no multi-user support and no data persistence tied to identity.

**Independent Test**: Can be tested by signing up a new account, signing out, signing back in, and verifying all user data (conversations, settings) persists. Delivers value as a multi-user application.

**Acceptance Scenarios**:

1. **Given** a new user visits the sign-up page, **When** they enter valid email and password, **Then** their account is created and they are redirected to the main application.
2. **Given** a user has an account, **When** they sign in via email/password or an OAuth provider, **Then** they access their existing conversations and settings.
3. **Given** an authenticated user, **When** they refresh the page or close and reopen the browser, **Then** their session persists and they remain signed in.
4. **Given** an authenticated user, **When** they navigate to a protected page, **Then** they can access it without being redirected to sign in.

---

### User Story 6 - MCP Server Configuration (Priority: P3)

Users configure external MCP (Model Context Protocol) servers in settings by providing a name, transport type (stdio or SSE), command/URL, and optional arguments. Once configured, the agent discovers available tools from the MCP server and can invoke them during conversations. Users see which MCP tools are available and can enable/disable individual servers.

**Why this priority**: MCP integration extends the agent's capabilities with user-defined tools, but it requires the core agent loop (P1) to be functional first. This is a power-user feature that adds significant extensibility.

**Independent Test**: Can be tested by configuring a simple MCP server (e.g., a filesystem server), starting a conversation, and asking the agent to use a tool from that server. Delivers value as an extensible agent platform.

**Acceptance Scenarios**:

1. **Given** a user navigates to MCP settings, **When** they add a new MCP server configuration with valid connection details, **Then** the server appears in the list with its status (connected/disconnected).
2. **Given** an MCP server is configured and connected, **When** the user starts a conversation, **Then** the agent has access to that server's tools and can invoke them when relevant.
3. **Given** multiple MCP servers are configured, **When** the user disables one, **Then** the agent can no longer access that server's tools but other servers remain active.
4. **Given** an MCP server connection fails, **When** the user views the server configuration, **Then** they see an error status and a retry option.

---

### User Story 7 - Persistent Agent Runs with Checkpointing (Priority: P3)

When the agent performs a long-running task (e.g., processing a large document, running a multi-step research workflow, or executing a chain of tool calls), the task runs persistently via LangGraph's checkpointer. Every step is saved as a checkpoint in the database. If the browser closes, the server restarts, or an error occurs, the agent resumes from the last checkpoint. The user sees progress updates in the chat and can continue the conversation while the task runs. When the task completes, results appear in the conversation.

**Why this priority**: Persistent execution via checkpointing prevents data loss on complex agent tasks and enables agents to run for hours. It is only needed once the core agent loop and basic tools are working. This is an infrastructure improvement that enhances reliability for power users.

**Independent Test**: Can be tested by triggering a long-running task, closing the browser mid-execution, reopening it, and verifying the task resumed from its checkpoint and completed successfully. Delivers value as a reliable agent for complex tasks that survives interruptions.

**Acceptance Scenarios**:

1. **Given** the agent starts a long-running task, **When** the task exceeds normal request timeout, **Then** the task continues executing persistently via checkpoints and the user sees a progress indicator in the chat.
2. **Given** a persistent task is running, **When** the user sends another message, **Then** the new message is processed independently without blocking the running task.
3. **Given** a persistent task completes, **When** the result is ready, **Then** the result appears in the conversation as if it were a normal agent response.
4. **Given** a persistent task is interrupted by a server restart or browser close, **When** the system recovers, **Then** the agent resumes from the last checkpoint without losing prior progress.
5. **Given** a persistent task fails, **When** the error occurs, **Then** the user sees a descriptive error message in the chat with an option to retry from the last checkpoint.

---

### User Story 8 - Multi-Agent Delegation (Priority: P2)

During a conversation, the primary agent delegates specialized sub-tasks to dedicated sub-agents — for example, delegating research to a research agent, code generation to a code agent, or document review to a review agent. Delegation happens seamlessly within the conversation: the user sees the primary agent hand off the task, the sub-agent works, and results flow back to the primary agent which presents the final answer. The user experience is a single unified conversation even though multiple agents collaborated behind the scenes.

**Why this priority**: Multi-agent delegation is what makes this a true "agentic workspace" rather than a single chatbot. Complex tasks benefit from specialist agents. This is P2 because it builds on the core agent loop (P1) and significantly enhances the range of tasks the system can handle.

**Independent Test**: Can be tested by asking a complex question that triggers delegation (e.g., "Research the latest React patterns and write a sample component"), verifying the task is delegated to the research agent first, then to the code agent, and the final result incorporates both sub-agents' work. Delivers value as a multi-specialist AI workspace.

**Acceptance Scenarios**:

1. **Given** the primary agent determines a sub-task requires specialist expertise, **When** it delegates to a sub-agent, **Then** the user sees a brief status indicating delegation (e.g., "Researching...") and the sub-agent processes the task.
2. **Given** a sub-agent completes its delegated task, **When** it returns results to the primary agent, **Then** the primary agent incorporates the results and presents a cohesive response to the user.
3. **Given** a sub-agent encounters an error, **When** it fails to complete its task, **Then** the primary agent handles the failure gracefully and informs the user with a meaningful explanation.
4. **Given** the user asks a follow-up question about a sub-agent's output, **When** the primary agent responds, **Then** it references the sub-agent's work accurately without re-delegating unnecessarily.

---

### User Story 9 - Agent Memory and Recall (Priority: P2)

During conversations, the agent stores important information as memories — user preferences, project context, past decisions, and key facts. In future conversations, the agent recalls relevant memories automatically using semantic search, so it remembers what the user discussed last time without the user needing to repeat context. Users can view, search, and manage their stored memories in a settings panel.

**Why this priority**: Memory transforms the agent from stateless to contextually aware across sessions. Users who return to Dexter should not have to re-establish context every time. This is P2 because it enhances the core experience significantly but requires the agent loop (P1) and persistent state to function.

**Independent Test**: Can be tested by having a conversation where the user states a preference (e.g., "I prefer TypeScript over JavaScript"), starting a new conversation, asking a relevant question, and verifying the agent recalls the preference. Delivers value as a personalized, context-aware AI assistant.

**Acceptance Scenarios**:

1. **Given** the user shares important information during a conversation, **When** the agent determines it is worth remembering, **Then** the agent stores it as a memory with relevant metadata.
2. **Given** the user starts a new conversation, **When** they ask a question related to past interactions, **Then** the agent retrieves relevant memories via semantic search and incorporates them into its response.
3. **Given** a user navigates to the memory management panel, **When** they view stored memories, **Then** they see a list of memories with content, timestamps, and the ability to delete individual memories.
4. **Given** the agent recalls a memory during a conversation, **When** it uses that memory in its response, **Then** the user can see that the agent referenced prior context (e.g., "Based on your preference for TypeScript...").

---

### User Story 10 - Workspace Browser and Terminal Surfaces (Priority: P3)

The agent opens a browser surface for web browsing/automation with screenshot preview, and a terminal surface for executing commands in a sandboxed environment. These surfaces appear in the workspace panel when the agent invokes the corresponding tools.

**Why this priority**: Browser and terminal are powerful agent capabilities but require sandbox infrastructure. They are valuable for research and development workflows but not essential for the core agent experience.

**Independent Test**: Can be tested by asking the agent to "open a browser and go to example.com" (browser) or "run ls -la in the terminal" (terminal), verifying the surface opens and results display. Delivers value as a full development/research workspace.

**Acceptance Scenarios**:

1. **Given** the agent invokes the browser tool with a URL, **When** the tool executes, **Then** the Browser surface opens in the workspace with a screenshot preview of the page.
2. **Given** the agent invokes the terminal tool with a command, **When** the tool executes, **Then** the Terminal surface opens in the workspace showing the command output in real time.
3. **Given** the Browser surface is open, **When** the agent navigates to a new page, **Then** the screenshot preview updates to reflect the new page state.

---

### Edge Cases

- What happens when a model provider API key is invalid or expired? The system should show a clear error message prompting the user to update their key, without crashing the conversation.
- What happens when the workspace panel is closed and the agent tries to create an artifact? The workspace should open automatically.
- How does the system handle concurrent tool calls from the agent? Each tool call should execute independently and results should stream back as they complete.
- What happens when an MCP server becomes unresponsive mid-conversation? The system should time out gracefully, inform the user, and allow the conversation to continue without that server's tools.
- What happens when a user's session expires during an active agent task? The persistent agent run should continue server-side with checkpoints preserved; the user should be able to resume seeing results after re-authentication.
- What happens when the database is temporarily unavailable? The system should show a degraded experience message and retry, rather than losing the conversation. The LangGraph checkpointer should also handle database reconnection.
- What happens when a user switches models while a tool call is in progress? The current tool call should complete before the model switch takes effect on the next message.
- What happens when a sub-agent delegation fails mid-task? The primary agent should receive an error from the sub-graph, handle it gracefully, and inform the user. The checkpoint should capture the state before the failure so the task can be retried.
- What happens when the LangGraph agent service becomes unavailable? The CopilotKit runtime should detect the connection failure via AG-UI protocol and show a clear error to the user indicating the agent service is unreachable, with a retry option.
- What happens when semantic memory search returns no relevant results? The agent should proceed without recalled memories rather than fabricating context, and inform the user if they explicitly ask about past interactions.
- What happens when a checkpoint is corrupted or unreadable? The system should fall back to the previous valid checkpoint and alert the user that some progress may have been lost.

## Requirements *(mandatory)*

### Functional Requirements

**Authentication & User Management**

- **FR-001**: System MUST allow new users to create accounts via email/password registration.
- **FR-002**: System MUST support OAuth sign-in with Google and GitHub providers.
- **FR-003**: System MUST maintain persistent sessions across browser refreshes using Better Auth.
- **FR-004**: System MUST protect all user-scoped routes and API endpoints, redirecting unauthenticated users to sign in.
- **FR-005**: System MUST allow users to manage their profile and sign out.

**Conversations & Messaging**

- **FR-006**: System MUST allow authenticated users to create new conversations.
- **FR-007**: System MUST persist all messages in a conversation and retrieve them on demand.
- **FR-008**: System MUST display a conversation history sidebar listing all user conversations ordered by most recent activity.
- **FR-009**: System MUST allow users to rename and delete conversations.
- **FR-010**: System MUST stream agent responses in real time to the chat interface.

**Agent Backend & Tool Calling**

- **FR-011**: System MUST execute agent conversations through a separate Python agent service using LangGraph StateGraph, connected to the CopilotKit frontend via the AG-UI protocol.
- **FR-012**: System MUST support multi-step agent tool loops where the agent can call tools and reason about results before responding.
- **FR-013**: System MUST render tool execution status and results inline in the chat via CopilotKit's generative UI.
- **FR-014**: System MUST support human-in-the-loop tool approvals for sensitive operations using LangGraph's interrupt mechanism combined with CopilotKit's approval UI.
- **FR-015**: System MUST allow users to configure which tools require approval versus execute automatically.

**Workspace Panel**

- **FR-016**: System MUST provide a resizable three-panel layout (sidebar, chat, workspace) where the workspace panel opens/closes based on agent tool calls.
- **FR-017**: System MUST support an Artifacts surface that renders code, HTML, SVG, React components, diffs, and diagrams created by the agent.
- **FR-018**: System MUST support a Document surface with a rich-text editor that the agent can create and edit.
- **FR-019**: System MUST support a Browser surface that displays web page screenshots from agent browsing sessions.
- **FR-020**: System MUST support a Terminal surface that displays command execution output from agent terminal sessions.
- **FR-021**: System MUST support a Files surface that shows a file explorer for the workspace sandbox.
- **FR-022**: System MUST support an Agent Output surface that streams long-form agent content directly to the workspace.
- **FR-023**: System MUST manage workspace state (active surfaces, content) through a centralized Zustand store updated exclusively by agent tool handlers.
- **FR-024**: System MUST allow multiple workspace surfaces to be open simultaneously with tab-based navigation.

**Multi-Provider Model Support**

- **FR-025**: System MUST support model routing to OpenAI, Anthropic, Google, Groq, Mistral, xAI, DeepSeek, OpenRouter, and Ollama providers.
- **FR-026**: System MUST allow users to configure and store API keys per provider in their settings.
- **FR-027**: System MUST display a model selector in the chat interface listing available providers and models based on configured keys.
- **FR-028**: System MUST persist the selected model per conversation and apply it to subsequent messages.
- **FR-029**: System MUST support local Ollama models via user-configured endpoint URL.

**MCP Client Integration**

- **FR-030**: System MUST allow users to configure MCP servers with name, transport type (stdio or SSE), connection command/URL, and optional arguments.
- **FR-031**: System MUST discover available tools from configured MCP servers and make them available to the agent.
- **FR-032**: System MUST allow users to enable/disable individual MCP servers.
- **FR-033**: System MUST display MCP server connection status (connected, disconnected, error) in settings.
- **FR-034**: System MUST handle MCP server failures gracefully, allowing the agent to continue without that server's tools.

**Persistent Agent Execution via Checkpointing**

- **FR-035**: System MUST persist every agent step as a checkpoint using LangGraph's PostgresSaver checkpointer, enabling crash recovery and run resumption.
- **FR-036**: System MUST allow agent runs to persist across browser closes, server restarts, and network interruptions, resuming from the last saved checkpoint.
- **FR-037**: System MUST stream progress updates for persistent agent runs back to the user's chat interface as each checkpoint is saved.
- **FR-038**: System MUST allow users to continue conversing while a persistent agent run executes in the background.
- **FR-039**: System MUST deliver persistent agent run results to the conversation upon completion.
- **FR-040**: System MUST report persistent agent run failures with descriptive messages and an option to retry from the last checkpoint.

**Multi-Agent Delegation**

- **FR-041**: System MUST support agent-to-agent delegation via LangGraph sub-graphs, where a primary agent delegates tasks to specialist sub-agents as graph nodes.
- **FR-042**: System MUST allow sub-agents to return results to the primary agent, which incorporates them into its response to the user.
- **FR-043**: System MUST handle sub-agent failures gracefully, returning errors to the primary agent rather than crashing the conversation.
- **FR-044**: System MUST preserve the user experience of a single unified conversation even when multiple agents collaborate behind the scenes.

**Agent Memory & Recall**

- **FR-045**: System MUST provide a memory tool that allows the agent to store important information (user preferences, context, decisions) in a dedicated memories store during conversations.
- **FR-046**: System MUST enable semantic search over stored memories so the agent can recall relevant past context in new conversations.
- **FR-047**: System MUST allow users to view, search, and delete their stored memories via a settings panel.
- **FR-048**: System MUST ensure memories are scoped per user and not shared across different users' conversations.

**Database**

- **FR-049**: System MUST store all persistent data using Drizzle ORM with PostgreSQL.
- **FR-050**: System MUST support vector columns for embedding storage and similarity search (for memory recall).
- **FR-051**: System MUST use Drizzle Kit for schema migrations.
- **FR-052**: System MUST remove all Prisma dependencies from the project.

### Key Entities

- **User**: Represents a registered user. Key attributes: email, display name, hashed password, OAuth provider links, created/updated timestamps. Owns conversations, documents, API keys, MCP server configurations, and memories.

- **Conversation**: Represents a chat session between a user and the agent. Key attributes: title, selected model/provider, creation/last-active timestamps, relationship to user and messages.

- **Message**: Represents a single message within a conversation. Key attributes: role (user, assistant, tool), content, tool call details, timestamps, relationship to conversation.

- **Document**: Represents a rich-text document created or managed by the agent. Key attributes: title, content (rich text), type (document, artifact, etc.), timestamps, relationship to user and optionally to conversation.

- **Project**: Represents a user's workspace project that groups related conversations, documents, and artifacts. Key attributes: name, description, timestamps, relationship to user.

- **API Key**: Represents a user-stored API key for a model provider. Key attributes: provider name, encrypted key value, timestamps, relationship to user.

- **MCP Server**: Represents a user-configured MCP server. Key attributes: name, transport type, connection details (command/URL), enabled status, timestamps, relationship to user.

- **Memory**: Represents a piece of information the agent has stored for future recall. Key attributes: content, embedding vector, metadata (tags, source conversation), timestamps, relationship to user.

- **Checkpoint**: Represents a saved state of an agent run at a specific step. Key attributes: run ID, step number, agent state snapshot, timestamps, relationship to conversation. Managed by the LangGraph PostgresSaver checkpointer.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete sign-up and start their first conversation within 60 seconds of visiting the application.
- **SC-002**: Agent responses begin streaming within 3 seconds of message submission for standard requests.
- **SC-003**: All six workspace surfaces (Artifacts, Browser, Document, Terminal, Files, Agent Output) render content within 2 seconds of the agent invoking the corresponding tool.
- **SC-004**: Users can switch between at least 3 different model providers in a single session without errors or data loss.
- **SC-005**: Conversations with 100+ messages load and scroll smoothly without noticeable lag.
- **SC-006**: 95% of tool calls execute and return results within the expected timeframe (under 10 seconds for standard tools, under 60 seconds for complex multi-step tools).
- **SC-007**: Users with 10+ configured MCP servers experience no degradation in conversation responsiveness.
- **SC-008**: Agent runs that are interrupted (browser close, server restart) resume from their last checkpoint and complete successfully, with no loss of prior steps.
- **SC-009**: The workspace panel resizes smoothly (60fps) when the user drags the panel divider, with no content layout shift.
- **SC-010**: Users can create, edit, and iterate on at least 5 artifacts in a single conversation without any artifact losing its state.
- **SC-011**: Authentication flows (sign up, sign in, sign out, session persistence) work correctly across all supported OAuth providers (Google, GitHub) and email/password.
- **SC-012**: Database queries for conversation loading return results in under 500ms for users with up to 50 conversations.
- **SC-013**: Multi-agent delegation completes sub-tasks correctly, with the primary agent incorporating sub-agent results into a cohesive response in over 90% of delegation scenarios.
- **SC-014**: The agent recalls relevant memories from past conversations in over 80% of cases where semantic similarity exists between the current query and stored memories.
- **SC-015**: Users can view and manage (search, delete) their stored memories without assistance, completing management tasks in under 30 seconds.

## Assumptions

- Users have stable internet connectivity for cloud model provider access; Ollama users have a locally running Ollama instance.
- The application will be deployed on infrastructure that supports Node.js 22+ (for the Next.js frontend) and Python 3.11+ (for the LangGraph agent service) alongside PostgreSQL with the pgvector extension.
- The LangGraph agent service runs as a separate FastAPI process, connected to the CopilotKit runtime via the AG-UI protocol.
- Users will obtain their own API keys for commercial model providers (OpenAI, Anthropic, etc.); Dexter does not bundle or resell API access.
- The workspace sandbox for file explorer and terminal surfaces will be scoped to a per-user or per-project container; the initial implementation may use a simplified sandbox model.
- Browser automation is screenshot-based in the initial release (no live interactive browser); the agent takes screenshots and the user views static previews.
- Multi-user collaboration (shared conversations, shared documents) is out of scope for v3; each user's workspace is private.
- Mobile-responsive design is secondary; the three-panel layout targets desktop browsers (1280px+ width). The app should degrade gracefully on smaller screens but is not optimized for mobile.
- The project will use the existing Next.js 16 App Router codebase as a starting point for the frontend, removing and replacing components rather than building from scratch.
- The LangGraph agent service shares the same PostgreSQL database as the Next.js frontend (using different tables for checkpoints), simplifying deployment and data consistency.
- Sub-agent delegation patterns will be defined in the LangGraph graph structure; the set of available sub-agents is determined at design time, not dynamically at runtime.
- Memory embedding generation uses the same PostgreSQL pgvector extension already required for the database, avoiding additional infrastructure dependencies.
