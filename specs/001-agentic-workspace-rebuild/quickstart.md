# Quickstart Validation Guide: Dexter v3

**Phase**: 1 (Design) | **Date**: 2026-06-09 | **Spec**: [spec.md](./spec.md)

## Prerequisites

- **Node.js** 22+ with npm
- **Python** 3.11+ with uv or pip
- **PostgreSQL** 14+ with pgvector extension
- At least one LLM provider API key (e.g., Anthropic, OpenAI)

## Setup

### 1. Database

```bash
# Create database with pgvector
createdb dexter
psql dexter -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Run Drizzle migrations
npm run db:migrate
```

### 2. Frontend (Next.js)

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env: set DATABASE_URL, BETTER_AUTH_SECRET, AGENT_SERVICE_URL
```

### 3. Agent Service (Python)

```bash
cd services/agent

# Install dependencies
pip install -e ".[dev]"  # or: uv pip install -e ".[dev]"

# Configure environment
cp .env.example .env
# Edit .env: set DATABASE_URL, provider API keys

# Start agent service
uvicorn app.main:app --reload --port 8000
```

### 4. Start Frontend

```bash
# From project root
npm run dev
```

---

## Validation Scenarios

### Scenario 1: Authentication (P1)

**Validates**: User Story 5 — Better Auth sign-up, sign-in, session persistence

**Steps**:
1. Navigate to `http://localhost:3000`
2. Click "Sign Up"
3. Enter email and password, submit
4. Verify redirect to main chat page
5. Refresh the browser
6. Verify session persists (no redirect to sign-in)
7. Sign out, sign back in

**Expected**: Account created, session persists across refresh, all protected routes accessible.

**References**: [data-model.md](./data-model.md) — `users` table

---

### Scenario 2: Agent Conversation with Tool Calling (P1)

**Validates**: User Story 1 — Core agent loop with LangGraph backend

**Steps**:
1. Open a new conversation
2. Type: "Search the web for the latest React 19 features"
3. Verify streaming text response appears in CopilotChat
4. Verify tool execution status appears inline (search icon, "Searching...")
5. Verify search results appear as a card in chat
6. Verify agent incorporates search results into its response

**Expected**: Agent calls `search_web` tool, results stream back via AG-UI, response incorporates search data. Response begins within 3 seconds.

**References**: [contracts/agent-service.md](./contracts/agent-service.md) — AG-UI streaming, [contracts/agent-tools.md](./contracts/agent-tools.md) — `search_web` tool

---

### Scenario 3: Workspace Artifact Creation (P2)

**Validates**: User Story 2 — Agent-driven workspace artifacts

**Steps**:
1. In the chat, type: "Create an HTML page with a counter that starts at 0"
2. Verify the workspace panel opens automatically to the Artifacts tab
3. Verify an artifact card appears inline in chat with "Open in Workspace" button
4. Verify the HTML preview renders in the workspace panel
5. Type: "Change the counter to start at 10"
6. Verify the artifact updates in place

**Expected**: Workspace auto-opens, artifact renders, updates work without state loss.

**References**: [contracts/workspace-store.md](./contracts/workspace-store.md) — `addArtifact`, `updateArtifact`

---

### Scenario 4: Multi-Provider Model Switching (P2)

**Validates**: User Story 4 — Multi-provider model routing

**Steps**:
1. Configure API keys for at least 2 providers in Settings (e.g., Anthropic + OpenAI)
2. Open a new conversation
3. Verify the model selector shows both providers' models
4. Send a message with Provider A selected
5. Switch to Provider B in the model selector
6. Send another message
7. Verify the second response comes from Provider B

**Expected**: Model selector lists available providers, switching works mid-conversation, conversation context preserved.

**References**: [contracts/agent-service.md](./contracts/agent-service.md) — Provider resolution

---

### Scenario 5: Checkpoint Resume (P3)

**Validates**: User Story 7 — Persistent agent runs with checkpointing

**Steps**:
1. Start a long-running agent task (e.g., "Research the history of AI and write a detailed summary")
2. Wait for the agent to begin processing (streaming starts)
3. Close the browser tab
4. Reopen the browser and navigate to the same conversation
5. Verify the agent resumes from its last checkpoint

**Expected**: Agent state preserved across browser close, resume from last checkpoint within 5 seconds.

**References**: [contracts/agent-service.md](./contracts/agent-service.md) — PostgresSaver checkpointing

---

### Scenario 6: Agent Memory and Recall (P2)

**Validates**: User Story 9 — Agent memory across conversations

**Steps**:
1. In a conversation, type: "I prefer TypeScript over JavaScript for all projects"
2. Verify the agent acknowledges and saves the preference
3. Start a **new** conversation
4. Type: "Write a hello world program"
5. Verify the agent recalls your TypeScript preference and writes TypeScript

**Expected**: Agent saves memory via `save_memory` tool, recalls it via `recall_memory` in a new conversation using semantic search.

**References**: [contracts/agent-tools.md](./contracts/agent-tools.md) — `save_memory`, `recall_memory`; [data-model.md](./data-model.md) — `memories` table

---

### Scenario 7: Agent Service Health Check

**Validates**: Agent service connectivity

**Steps**:
1. Start the Python agent service
2. Navigate to `http://localhost:8000/health`
3. Verify JSON response with `"status": "healthy"`
4. Stop the agent service
5. Try to send a message in the chat
6. Verify error message indicating agent service is unreachable

**Expected**: Health check returns status. Frontend shows clear error when agent service is down.

**References**: [contracts/agent-service.md](./contracts/agent-service.md) — Health endpoint

---

### Scenario 8: Multi-Agent Delegation (P2)

**Validates**: User Story 8 — Sub-agent delegation via LangGraph sub-graphs

**Steps**:
1. Type: "Research the latest Next.js App Router patterns and write a sample page component"
2. Verify the agent delegates to the research sub-agent (brief "Researching..." status)
3. Verify the agent then delegates to the code sub-agent (brief "Generating code..." status)
4. Verify the final response incorporates both research findings and generated code

**Expected**: Task flows through research → code sub-graphs, final response is cohesive.

**References**: [contracts/agent-service.md](./contracts/agent-service.md) — Sub-graph delegation, [contracts/agent-tools.md](./contracts/agent-tools.md) — `delegate_to_agent`

---

## Running Tests

### Frontend Tests (Vitest)

```bash
npm test
```

Covers: server actions, auth flows, workspace state transitions.

### Agent Service Tests (pytest)

```bash
cd services/agent
pytest
```

Covers: graph structure, tool execution, checkpoint save/resume.

---

*Part of the quickstart validation guide for the LangGraph Python agent backend architecture.*
