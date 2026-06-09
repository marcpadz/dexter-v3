# Agent Service Contract: Dexter v3

**Layer**: Python Agent Service (FastAPI + LangGraph)  
**Location**: `services/agent/`

## Overview

The Python agent service is a FastAPI application that runs the LangGraph StateGraph and exposes it as an AG-UI endpoint via the CopilotKit Python SDK. It connects to the same PostgreSQL database as the Next.js frontend for checkpointing and memory storage.

---

## Service Configuration

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/dexter

# LLM Provider Keys (fallback, per-user keys take precedence)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GOOGLE_API_KEY=

# Service
PORT=8000
HOST=0.0.0.0
LOG_LEVEL=info

# Authentication (shared secret with CopilotKit runtime)
AGENT_SERVICE_SECRET=<generate-a-strong-random-secret>

# CopilotKit
COPILOT_CORS_ORIGINS=http://localhost:3000
```

### Dependencies (`pyproject.toml`)

```toml
[project]
name = "dexter-agent"
version = "0.1.0"
requires-python = ">=3.11"

dependencies = [
    "fastapi>=0.115.0",
    "uvicorn>=0.34.0",
    "copilotkit>=0.1.0",
    "langgraph>=0.4.0",
    "langgraph-checkpoint-postgres>=2.0.0",
    "langchain-core>=0.3.0",
    "langchain-anthropic>=0.3.0",
    "langchain-openai>=0.3.0",
    "langchain-google-genai>=2.0.0",
    "asyncpg>=0.30.0",
    "pydantic>=2.0.0",
    "structlog>=24.0.0",
    "composio-langgraph>=0.7.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.25.0",
    "httpx>=0.28.0",
]
```

---

## API Endpoints

### `POST /api/agent` — AG-UI Protocol Endpoint

The primary endpoint for all agent interactions. Uses the AG-UI protocol (SSE-based) for streaming.

**Request**: AG-UI protocol format (handled by CopilotKit Python SDK)

**Response**: SSE stream with AG-UI events:
- `agent_stream_start` — Agent begins processing
- `agent_stream_text` — Streaming text from LLM
- `agent_stream_tool_call` — Agent invokes a tool
- `agent_stream_tool_result` — Tool execution result
- `agent_stream_end` — Agent completes
- `agent_stream_interrupt` — Agent pauses for HITL approval

**Authentication**: User context passed from CopilotRuntime via AG-UI request headers.

---

### `GET /health` — Health Check

```json
{
  "status": "healthy",
  "version": "0.1.0",
  "checkpointer": "connected",
  "providers": ["anthropic", "openai", "google"]
}
```

---

## Authentication

The agent service is NOT publicly accessible. All requests must include a shared secret.

```python
# services/agent/app/main.py — auth middleware
from fastapi import FastAPI, Request, HTTPException
import os

AGENT_SERVICE_SECRET = os.environ["AGENT_SERVICE_SECRET"]

@app.middleware("http")
async def verify_service_secret(request: Request, call_next):
    if request.url.path == "/health":
        return await call_next(request)
    auth = request.headers.get("Authorization", "")
    if auth != f"Bearer {AGENT_SERVICE_SECRET}":
        raise HTTPException(status_code=401, detail="Invalid service secret")
    return await call_next(request)
```

**User identity**: The CopilotRuntime forwards `user_id` from the authenticated Next.js session via AG-UI request metadata. The Python service trusts this because the request is authenticated by the shared secret. All database writes scope to this `user_id`.

---

## CORS & Rate Limiting

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("COPILOT_CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_methods=["POST"],
    allow_headers=["Authorization", "Content-Type"],
)
```

In production, the Python service should NOT be exposed to the public internet — only reachable via internal network (same Docker network, sidecar, or reverse proxy). CORS is a defense-in-depth measure.

---

## Observability

```python
import structlog

log = structlog.get_logger()

# Log every agent invocation
log.info("agent_invocation", user_id=user_id, model=model_id, thread_id=thread_id)

# Log every tool call
log.info("tool_call", tool=tool_name, duration_ms=elapsed, success=True)

# Log checkpoint events
log.info("checkpoint_saved", thread_id=thread_id, step=step_number)
```

All logs are structured JSON to stdout. Container orchestrators ingest them directly.

---

## LangGraph Graph Structure

### Main Orchestrator Graph

```python
# services/agent/app/graph/builder.py
from langgraph.graph import StateGraph, END
from app.graph.state import AgentState
from app.graph.nodes.router import route_to_agent
from app.graph.nodes.llm import call_llm
from app.graph.nodes.tools import execute_tools
from app.graph.subgraphs.research import research_graph
from app.graph.subgraphs.code import code_graph

def build_agent_graph() -> CompiledGraph:
    graph = StateGraph(AgentState)
    
    # Core nodes
    graph.add_node("llm", call_llm)
    graph.add_node("tools", execute_tools)
    
    # Sub-graph nodes (specialist agents)
    graph.add_node("research", research_graph.compile())
    graph.add_node("code", code_graph.compile())
    
    # Edges
    graph.set_entry_point("llm")
    graph.add_conditional_edges("llm", route_after_llm, {
        "tools": "tools",
        "research": "research",
        "code": "code",
        "end": END,
    })
    graph.add_edge("tools", "llm")
    graph.add_edge("research", "llm")
    graph.add_edge("code", "llm")
    
    return graph.compile(checkpointer=checkpointer)
```

### Agent State

```python
# services/agent/app/graph/state.py
from typing import TypedDict, Annotated, Sequence
from langchain_core.messages import BaseMessage
import operator

class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]
    user_id: str
    model: str
    api_keys: dict[str, str]        # provider -> encrypted key (decrypted)
    mcp_tools: list[dict]            # MCP tool schemas from JS side
    active_artifacts: list[dict]     # Currently open workspace artifacts
    conversation_id: str
    thread_id: str
```

### Routing Logic

```python
# After LLM response, determine next step:
# - If LLM made tool calls → execute tools
# - If LLM response is final → END
#
# Delegation uses native LangGraph conditional routing.
# The LLM's structured output includes a `next` field when delegation is needed.
# This avoids a fake "delegation tool" that gets intercepted before execution.
def route_after_llm(state: AgentState) -> str:
    last_message = state["messages"][-1]
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"
    # Check for structured delegation output
    if hasattr(last_message, "additional_kwargs"):
        delegation = last_message.additional_kwargs.get("delegation")
        if delegation in ("research", "code"):
            return delegation
    return "end"
```

---

## PostgresSaver Checkpointing

### Configuration

```python
# services/agent/app/db/connection.py
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
import asyncpg

async def create_checkpointer(database_url: str) -> AsyncPostgresSaver:
    checkpointer = AsyncPostgresSaver.from_conn_string(database_url)
    await checkpointer.setup()  # Creates checkpoint tables
    return checkpointer
```

### Checkpoint Lifecycle

1. **Start**: New agent run creates first checkpoint with initial state
2. **Each step**: After LLM call and tool execution, checkpoint is saved
3. **Resume**: On reconnection, `graph.invoke(input, config={"configurable": {"thread_id": thread_id}})` resumes from last checkpoint
4. **Complete**: Final checkpoint preserved for audit trail

### Thread ID Mapping

- Each `conversation.id` maps to a LangGraph `thread_id`
- The mapping is stored in `conversations.thread_id` (Drizzle column)
- New conversations get a UUID thread_id on first message

---

## Provider Resolution

```python
# services/agent/app/models/providers.py
from langchain_anthropic import ChatAnthropic
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI

def resolve_model(model_id: str, api_key: str, base_url: str | None = None):
    provider, model_name = model_id.split(":", 1)
    
    match provider:
        case "openai":
            return ChatOpenAI(model=model_name, api_key=api_key)
        case "anthropic":
            return ChatAnthropic(model=model_name, api_key=api_key)
        case "google":
            return ChatGoogleGenerativeAI(model=model_name, api_key=api_key)
        case "groq":
            return ChatOpenAI(model=model_name, api_key=api_key, base_url="https://api.groq.com/openai/v1")
        case "mistral":
            return ChatOpenAI(model=model_name, api_key=api_key, base_url="https://api.mistral.ai/v1")
        case "xai":
            return ChatOpenAI(model=model_name, api_key=api_key, base_url="https://api.x.ai/v1")
        case "deepseek":
            return ChatOpenAI(model=model_name, api_key=api_key, base_url="https://api.deepseek.com/v1")
        case "openrouter":
            return ChatOpenAI(model=model_name, api_key=api_key, base_url="https://openrouter.ai/api/v1")
        case "ollama":
            return ChatOpenAI(
                model=model_name,
                api_key="dummy",
                base_url=base_url or "http://localhost:11434/v1",
            )
        case _:
            raise ValueError(f"Unknown provider: {provider}")
```

---

## Deployment

### Local Development

```bash
# Terminal 1: Next.js frontend
npm run dev

# Terminal 2: Python agent service
cd services/agent
uvicorn app.main:app --reload --port 8000
```

### Environment Configuration

```env
# .env (Next.js side)
AGENT_SERVICE_URL=http://localhost:8000
```

```env
# services/agent/.env (Python side)
DATABASE_URL=postgresql://user:pass@localhost:5432/dexter
PORT=8000
```

### Production

The Python agent service runs as a separate process/container alongside the Next.js frontend. Both connect to the same PostgreSQL instance.

---

*Part of the LangGraph Python agent backend contract definition.*
