# Agent Tools Contract: Dexter v3

**Layer**: Python Agent Service (LangGraph)  
**Location**: `services/agent/app/tools/`

## Overview

Agent tools are LangGraph `@tool` decorated functions defined in the Python agent service. They execute within the LangGraph tool execution node and interact with external services, the database, and the workspace via AG-UI protocol events.

Tools are registered in the LangGraph graph's tool node and are available to the LLM for invocation during conversation turns.

---

## Core Tools

### `search_web`

Search the web for information using a search API.

```python
@tool
async def search_web(query: str, max_results: int = 5) -> list[SearchResult]:
    """Search the web for information.
    
    Args:
        query: Search query string
        max_results: Maximum number of results (default 5, max 10)
    
    Returns:
        List of search results with title, url, and snippet
    """
```

**Returns**: `list[SearchResult]` where `SearchResult = {title: str, url: str, snippet: str}`

---

### `create_artifact`

Create a visual artifact that appears in the workspace panel.

```python
@tool
async def create_artifact(
    type: str,       # "code" | "html" | "svg" | "react" | "image" | "diff" | "mermaid"
    title: str,
    content: str,
    language: str | None = None,
) -> ArtifactResult:
    """Create a visual artifact in the workspace panel.
    
    Args:
        type: Artifact type (code, html, svg, react, image, diff, mermaid)
        title: Artifact title
        content: Artifact content (code, HTML, SVG, etc.)
        language: Programming language for code artifacts
    
    Returns:
        Artifact result with ID and workspace tab activation
    """
```

**Side effects**: Triggers AG-UI tool event → CopilotKit → `useWorkspaceStore.addArtifact()` → workspace panel opens to Artifacts tab.

**Returns**: `ArtifactResult = {id: str, type: str, title: str}`

---

### `update_artifact`

Update the content of an existing artifact.

```python
@tool
async def update_artifact(
    artifact_id: str,
    content: str,
) -> ArtifactResult:
    """Update the content of an existing artifact.
    
    Args:
        artifact_id: ID of the artifact to update
        content: New content for the artifact
    
    Returns:
        Updated artifact result
    """
```

**Side effects**: Triggers AG-UI tool event → `useWorkspaceStore.updateArtifact()`.

---

### `create_document`

Create or edit a rich-text document in the workspace.

```python
@tool
async def create_document(
    title: str,
    content: str,  # Markdown or rich text content
    document_id: str | None = None,  # None = create new, string = update existing
) -> DocumentResult:
    """Create or edit a rich text document in the workspace.
    
    Args:
        title: Document title
        content: Markdown or rich text content
        document_id: Existing document ID to update (None creates new)
    
    Returns:
        Document result with ID and content
    """
```

**Side effects**: Triggers AG-UI tool event → workspace panel opens to Document tab.

---

### `browse_web`

Navigate to a URL and capture a screenshot.

```python
@tool
async def browse_web(
    url: str,
    action: str = "screenshot",  # "screenshot" | "extract" | "navigate"
) -> BrowseResult:
    """Browse a website and capture content.
    
    Args:
        url: URL to browse
        action: Action to perform (screenshot, extract text, navigate)
    
    Returns:
        Browse result with screenshot (base64), title, and text content
    """
```

**Returns**: `BrowseResult = {url: str, title: str, screenshot: str (base64), text_content: str}`

**Side effects**: Triggers AG-UI tool event → workspace panel opens to Browser tab with screenshot preview.

---

### `execute_code`

Execute code in a sandboxed environment.

```python
@tool
async def execute_code(
    language: str,  # "javascript" | "python" | "shell"
    code: str,
    timeout: int = 30,  # seconds
) -> ExecutionResult:
    """Execute code in a sandboxed environment.
    
    Args:
        language: Programming language (javascript, python, shell)
        code: Code to execute
        timeout: Execution timeout in seconds (default 30, max 120)
    
    Returns:
        Execution result with stdout, stderr, and exit code
    """
```

**Returns**: `ExecutionResult = {stdout: str, stderr: str, exit_code: int, artifacts: list[str]}`

---

### `list_files`

List files in the workspace sandbox directory.

```python
@tool
async def list_files(
    path: str = "/",  # Relative path from workspace root
    recursive: bool = False,
) -> list[FileInfo]:
    """List files in the workspace sandbox.
    
    Args:
        path: Relative path from workspace root
        recursive: Whether to list recursively
    
    Returns:
        List of files with name, path, is_dir, size, modified_at
    """
```

**Returns**: `list[FileInfo]` where `FileInfo = {name: str, path: str, is_dir: bool, size: int, modified_at: str}`

---

### `read_file`

Read file content from the workspace sandbox.

```python
@tool
async def read_file(path: str) -> FileContent:
    """Read file content from the workspace sandbox.
    
    Args:
        path: Relative path to the file
    
    Returns:
        File content with path, content, and size
    """
```

---

### `write_file`

Write content to a file in the workspace sandbox. **Requires HITL approval**.

```python
@tool
async def write_file(
    path: str,
    content: str,
    create_dirs: bool = True,
) -> FileResult:
    """Write content to a file in the workspace sandbox.
    
    REQUIRES USER APPROVAL before execution.
    
    Args:
        path: Relative path to the file
        content: File content
        create_dirs: Whether to create parent directories
    
    Returns:
        File write result
    """
```

**HITL**: This tool requires user approval via CopilotKit's confirmation UI before execution.

---

### `save_memory`

Store important information for future recall across conversations.

```python
@tool
async def save_memory(
    content: str,
    tags: list[str] | None = None,
) -> str:
    """Store important information for future recall.
    
    Use this to remember user preferences, project context, past decisions,
    and key facts that should persist across conversations.
    
    Args:
        content: Information to remember
        tags: Optional categorization tags
    
    Returns:
        Confirmation message
    """
```

**Side effects**: Generates embedding, inserts into `memories` table via asyncpg.

---

### `recall_memory`

Recall relevant memories using semantic search.

```python
@tool
async def recall_memory(
    query: str,
    top_k: int = 5,
) -> list[MemoryResult]:
    """Recall relevant memories from past conversations using semantic search.
    
    Args:
        query: Query to search for relevant memories
        top_k: Number of results to return (default 5, max 20)
    
    Returns:
        List of relevant memories with content, tags, similarity score, and timestamp
    """
```

**Returns**: `list[MemoryResult]` where `MemoryResult = {content: str, tags: list[str], similarity: float, created_at: str}`

**Implementation**: Uses pgvector cosine similarity search (`embedding <=> query_embedding`).

---

## Task Management Tools

### `create_task`

Create a new task. Stored locally in Postgres for cross-platform sync.

```python
@tool
async def create_task(
    title: str,
    description: str | None = None,
    priority: str | None = None,  # "low" | "medium" | "high" | "urgent"
    due_date: str | None = None,  # ISO 8601
    project_id: str | None = None,
) -> dict:
    """Create a new task for the user.
    
    Args:
        title: Task title
        description: Optional task description
        priority: Priority level (low, medium, high, urgent)
        due_date: Due date in ISO 8601 format
        project_id: Optional project to associate with
    
    Returns:
        Created task object with id
    """
```

**Frontend rendering**: CopilotKit tool renderer shows inline task card in chat with title, priority badge, and due date.

### `list_tasks`

List the user's tasks with optional filters.

```python
@tool
async def list_tasks(
    completed: bool | None = None,
    priority: str | None = None,
    project_id: str | None = None,
    limit: int = 20,
) -> list[dict]:
    """List tasks with optional filters.
    
    Args:
        completed: Filter by completion status (default: incomplete only)
        priority: Filter by priority level
        project_id: Filter by project
        limit: Maximum number of tasks to return
    
    Returns:
        List of task objects
    """
```

### `update_task`

Update an existing task. Supports partial updates — only provided fields are changed.

```python
@tool
async def update_task(
    task_id: str,
    title: str | None = None,
    description: str | None = None,
    completed: bool | None = None,
    priority: str | None = None,
    due_date: str | None = None,
) -> dict:
    """Update a task's fields. Only provided fields are updated.
    
    Args:
        task_id: ID of the task to update
        title: New title
        description: New description
        completed: New completion status (set True to complete)
        priority: New priority level
        due_date: New due date in ISO 8601 format
    
    Returns:
        Updated task object
    """
```

**Implementation**: All task tools use asyncpg to read/write the `tasks` Drizzle table directly (same pattern as memory tools). All queries scoped by `WHERE user_id = $verified_user_id`.

---

## Multi-Agent Delegation

Delegation to specialist sub-agents (research, code) is handled via **LangGraph's native conditional routing**, not via a tool. The LLM's structured output includes a routing decision, and LangGraph conditional edges dispatch to the appropriate sub-graph.

This means delegation is invisible to the tool registry — the LLM decides to delegate, and the graph routes accordingly. See [agent-service.md](./agent-service.md) for routing logic.

**Available sub-agents**:
- `research` — Web research, information gathering, source synthesis
- `code` — Code generation, review, debugging

---

## Tool Registration

Tools are registered in the LangGraph graph builder:

```python
# services/agent/app/graph/builder.py
from langchain_core.tools import BaseTool
from app.tools.search import search_web
from app.tools.artifacts import create_artifact, update_artifact
from app.tools.documents import create_document
from app.tools.browser import browse_web
from app.tools.terminal import execute_code
from app.tools.files import list_files, read_file, write_file
from app.tools.memory import save_memory, recall_memory
from app.tools.tasks import create_task, list_tasks, update_task

ALL_TOOLS: list[BaseTool] = [
    search_web,
    create_artifact,
    update_artifact,
    create_document,
    browse_web,
    execute_code,
    list_files,
    read_file,
    write_file,
    save_memory,
    recall_memory,
    create_task,
    list_tasks,
    update_task,
]
```

---

## MCP Tools (Dynamic)

MCP tool schemas are passed from the Next.js CopilotRuntime to the Python agent via AG-UI request metadata. The Python agent dynamically creates LangGraph `Tool` instances for each MCP tool.

MCP tool names are prefixed: `mcp__<server_id>__<tool_name>`

MCP tool executions are forwarded back to the Next.js side for actual execution (since MCP connections are managed in TypeScript).

---

## Composio Tools (Optional)

Composio provides 500+ pre-built app integrations as native LangGraph tools. Users connect apps (Todoist, Notion, Google Tasks, Linear, Jira, Trello, Gmail, Slack, etc.) via Composio's managed OAuth, and the agent automatically gets tools for those apps.

```python
# services/agent/app/tools/composio.py
from composio_langgraph import ComposioToolSet

def get_composio_tools(user_id: str) -> list:
    """Load Composio tools for the authenticated user."""
    toolset = ComposioToolSet(entity_id=user_id)
    return toolset.get_tools()  # Returns LangGraph-compatible tools
```

Composio tools are merged with native tools and MCP tools in the graph builder. They appear alongside other tools to the LLM.

**Key benefit**: Notes and Tasks are handled by external apps via Composio — no custom note/task code to build or maintain. Users choose their preferred apps.

---

*Part of the LangGraph Python agent backend contract definition.*
