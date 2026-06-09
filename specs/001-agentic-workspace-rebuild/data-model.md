# Data Model: Dexter v3 — Full Agentic Workspace Rebuild

**Phase**: 1 (Design) | **Date**: 2026-06-09 | **Spec**: [spec.md](./spec.md)

## Overview

The data model consists of **9 Drizzle-managed application tables** and **3 LangGraph-managed checkpoint tables**. All share the same PostgreSQL instance with pgvector extension.

- **Drizzle tables** — Managed by `drizzle-kit` migrations, accessed by the Next.js app via Drizzle ORM
- **LangGraph tables** — Managed by `PostgresSaver.setup()`, accessed by the Python agent service via asyncpg
- **Shared tables** — `memories` and `tasks` are managed by Drizzle (schema) but also written/read by the Python agent via direct SQL

---

## Entity Relationship Diagram

```
┌──────────┐
│   User   │──────────────────────────────────────────────┐
└────┬─────┘                                              │
     │ 1:N                                                │ 1:N
     ├─── ┌──────────────┐                                │
     │    │ Conversation │─── ┌─────────┐                 │
     │    └──────┬───────┘    │ Message │                 │
     │           │ 1:N        └─────────┘                 │
     │           │                                        │
     │           │ N:1        ┌──────────┐                │
     │           └───────────▶│ Project  │◀──┐            │
     │                        └──────────┘   │            │
     │                                       │            │
     ├─── ┌──────────┐    ┌──────────┐      │            │
     │    │  ApiKey  │    │ Document │──────┘            │
     │    └──────────┘    └──────────┘                   │
     │                                                    │
     ├─── ┌────────────┐                                 │
     │    │ McpServer  │                                 │
     │    └────────────┘                                 │
     │                                                    │
     └─── ┌──────────┐                                   │
          │  Memory   │◀─── Python agent reads/writes    │
          └──────────┘    via asyncpg (not Drizzle)      │


┌─── LangGraph Checkpoint Tables (managed by PostgresSaver) ───┐
│  checkpoints        │ checkpoint_writes  │ checkpoint_blobs  │
└─────────────────────┴────────────────────┴───────────────────┘
```

---

## Drizzle Application Tables

### 1. `users`

Represents a registered user. Core entity for all user-scoped data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | Unique user identifier |
| `email` | `text` | UNIQUE, NOT NULL | User email address |
| `name` | `text` | nullable | Display name |
| `email_verified` | `boolean` | default `false` | Email verification status |
| `image` | `text` | nullable | Avatar URL |
| `role` | `text` | default `'user'` | User role (user/admin) |
| `password` | `text` | nullable | Hashed password (null for OAuth-only users) |
| `created_at` | `timestamp` | default `now()` | Account creation time |
| `updated_at` | `timestamp` | default `now()` | Last profile update |

**Relationships**: Has many `conversations`, `documents`, `projects`, `api_keys`, `mcp_servers`, `memories`.

**Drizzle Schema**:
```typescript
// src/lib/db/schema/users.ts
import { pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').unique().notNull(),
  name: text('name'),
  emailVerified: boolean('email_verified').default(false),
  image: text('image'),
  role: text('role').default('user'),
  password: text('password'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

---

### 2. `conversations`

Represents a chat session between a user and the agent. Maps to a LangGraph `thread_id`.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | Unique conversation identifier |
| `user_id` | `uuid` | FK → `users.id`, ON DELETE CASCADE | Owning user |
| `title` | `text` | default `'New Chat'` | Conversation title (editable) |
| `model` | `text` | nullable | Selected model (e.g., `"anthropic:claude-sonnet-4"`) |
| `project_id` | `uuid` | FK → `projects.id`, nullable | Associated project |
| `pinned` | `boolean` | default `false` | Pinned in sidebar |
| `thread_id` | `text` | nullable | LangGraph thread ID for checkpoint mapping |
| `created_at` | `timestamp` | default `now()` | Creation time |
| `updated_at` | `timestamp` | default `now()` | Last activity time |

**Validation Rules**:
- `model` must match pattern `{provider}:{model_name}`
- `thread_id` is set when first message is sent and persists for the conversation's lifetime

---

### 3. `messages`

Represents a single message within a conversation. Includes both user and assistant messages, plus tool call results.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | Unique message identifier |
| `conversation_id` | `uuid` | FK → `conversations.id`, ON DELETE CASCADE | Parent conversation |
| `role` | `text` | NOT NULL | `'user'` \| `'assistant'` \| `'tool'` |
| `content` | `text` | default `''` | Message content (text or JSON for tool results) |
| `tool_calls` | `json` | nullable | Array of tool call objects (LangGraph format) |
| `tool_call_id` | `text` | nullable | ID linking tool result to originating tool call |
| `model` | `text` | nullable | Model used for this message (for multi-model conversations) |
| `created_at` | `timestamp` | default `now()` | Message timestamp |

**Validation Rules**:
- `role` must be one of `'user'`, `'assistant'`, `'tool'`
- When `role = 'tool'`, `tool_call_id` must be present
- When `role = 'assistant'`, `tool_calls` may contain tool call array
- `content` can be empty string for tool result messages (content is in the tool result JSON)

---

### 4. `documents`

Represents a rich-text document or artifact created or managed by the agent.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | Unique document identifier |
| `user_id` | `uuid` | FK → `users.id`, ON DELETE CASCADE | Owning user |
| `type` | `text` | NOT NULL | Document type (see below) |
| `title` | `text` | NOT NULL | Document title |
| `content` | `text` | default `''` | Document content (rich text, code, etc.) |
| `metadata` | `json` | nullable | Additional metadata (language, tags, etc.) |
| `project_id` | `uuid` | FK → `projects.id`, nullable | Associated project |
| `created_at` | `timestamp` | default `now()` | Creation time |
| `updated_at` | `timestamp` | default `now()` | Last update time |

**Document Types**: `'note'`, `'artifact'`, `'file'`, `'knowledge'`

**Validation Rules**:
- `type` must be one of the defined document types

---

### 5. `projects`

Represents a user's workspace project that groups related conversations, documents, and artifacts.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | Unique project identifier |
| `user_id` | `uuid` | FK → `users.id`, ON DELETE CASCADE | Owning user |
| `name` | `text` | NOT NULL | Project name |
| `description` | `text` | nullable | Project description |
| `instructions` | `text` | nullable | Custom agent instructions for this project |
| `created_at` | `timestamp` | default `now()` | Creation time |
| `updated_at` | `timestamp` | default `now()` | Last update time |

---

### 6. `api_keys`

Stores encrypted API keys for model providers. Per-user, one key per provider.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | Unique key identifier |
| `user_id` | `uuid` | FK → `users.id`, ON DELETE CASCADE | Owning user |
| `provider` | `text` | NOT NULL | Provider name (e.g., `'openai'`, `'anthropic'`) |
| `encrypted_key` | `text` | NOT NULL | AES-256 encrypted API key |
| `iv` | `text` | NOT NULL | Initialization vector for decryption |
| `created_at` | `timestamp` | default `now()` | Creation time |

**Validation Rules**:
- One key per `(user_id, provider)` — unique constraint
- `provider` must be one of: `'openai'`, `'anthropic'`, `'google'`, `'groq'`, `'mistral'`, `'xai'`, `'deepseek'`, `'openrouter'`, `'ollama'`
- `encrypted_key` is encrypted at rest using AES-256-GCM with a server-side secret

---

### 7. `mcp_servers`

Stores user-configured MCP server connections.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | Unique server identifier |
| `user_id` | `uuid` | FK → `users.id`, ON DELETE CASCADE | Owning user |
| `name` | `text` | NOT NULL | User-assigned server name |
| `transport_type` | `text` | default `'stdio'` | `'stdio'` \| `'sse'` \| `'streamable-http'` |
| `command` | `text` | nullable | Command for stdio transport (e.g., `'npx'`) |
| `url` | `text` | nullable | URL for SSE transport |
| `args` | `json` | nullable | Command arguments |
| `env` | `json` | nullable | Environment variables |
| `enabled` | `boolean` | default `true` | Whether server is active |
| `created_at` | `timestamp` | default `now()` | Creation time |

**Validation Rules**:
- When `transport_type = 'stdio'`, `command` must be present
- When `transport_type = 'sse'`, `url` must be present and valid URL

---

### 8. `memories` (NEW)

Stores agent memories for semantic recall across conversations. Managed by Drizzle (schema) but written/read by the Python agent via asyncpg.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | Unique memory identifier |
| `user_id` | `uuid` | FK → `users.id`, ON DELETE CASCADE | Owning user |
| `content` | `text` | NOT NULL | Memory content text |
| `embedding` | `vector(1536)` | nullable | Content embedding for cosine similarity search |
| `tags` | `json` | nullable | Tags for categorization |
| `source_conversation_id` | `uuid` | FK → `conversations.id`, nullable | Conversation where memory was created |
| `created_at` | `timestamp` | default `now()` | Memory creation time |

**Drizzle Schema**:
```typescript
// src/lib/db/schema/memories.ts
import { pgTable, uuid, text, json, timestamp, vector } from 'drizzle-orm/pg-core';
import { users } from './users';
import { conversations } from './conversations';

export const memories = pgTable('memories', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  embedding: vector('embedding', { dimensions: 1536 }),
  tags: json('tags'),
  sourceConversationId: uuid('source_conversation_id').references(() => conversations.id),
  createdAt: timestamp('created_at').defaultNow(),
});
```

**Validation Rules**:
- `user_id` must match the authenticated user (enforced at application level)
- `embedding` is generated by the Python agent using the LLM provider's embedding API
- `tags` is a string array, e.g., `["preference", "typescript"]`

**Python Agent Access** (not via Drizzle):
```python
# Python agent reads/writes via asyncpg
await conn.execute(
    "INSERT INTO memories (id, user_id, content, embedding, tags) VALUES ($1, $2, $3, $4, $5)",
    memory_id, user_id, content, embedding_vector, tags_json,
)

# Semantic search
rows = await conn.fetch(
    """SELECT content, tags, created_at, 1 - (embedding <=> $1) as similarity
       FROM memories WHERE user_id = $2
       ORDER BY embedding <=> $1 LIMIT $3""",
    query_embedding, user_id, top_k,
)
```

---

### 9. `tasks`

Represents a user's task or to-do item. Tasks can be created by the agent or the user. Stored locally in Postgres for cross-platform sync across web, desktop, and mobile clients.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | Unique task identifier |
| `user_id` | `uuid` | FK → `users.id`, ON DELETE CASCADE | Owning user |
| `title` | `text` | NOT NULL | Task title |
| `description` | `text` | nullable | Task description/details |
| `completed` | `boolean` | default `false` | Completion status |
| `priority` | `text` | nullable | Priority level (`low`, `medium`, `high`, `urgent`) |
| `due_date` | `timestamp` | nullable | Due date |
| `project_id` | `uuid` | FK → `projects.id`, nullable | Associated project |
| `source_conversation_id` | `uuid` | FK → `conversations.id`, nullable | Conversation where task was created |
| `created_at` | `timestamp` | default `now()` | Creation time |
| `updated_at` | `timestamp` | default `now()` | Last update time |

**Validation Rules**:
- `priority` must be one of: `low`, `medium`, `high`, `urgent` (or null)
- `user_id` must match the authenticated user (enforced at application level)

**Drizzle Schema**:
```typescript
// src/lib/db/schema/tasks.ts
import { pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';
import { projects } from './projects';
import { conversations } from './conversations';

export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  completed: boolean('completed').default(false),
  priority: text('priority'),
  dueDate: timestamp('due_date'),
  projectId: uuid('project_id').references(() => projects.id),
  sourceConversationId: uuid('source_conversation_id').references(() => conversations.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

**Python Agent Access** (via asyncpg, same pattern as memories):
```python
# Create task
await conn.execute(
    """INSERT INTO tasks (id, user_id, title, description, priority, due_date, project_id, source_conversation_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)""",
    task_id, user_id, title, description, priority, due_date, project_id, conversation_id,
)

# List tasks
rows = await conn.fetch(
    """SELECT id, title, description, completed, priority, due_date, project_id, created_at
       FROM tasks WHERE user_id = $1 AND completed = $2
       ORDER BY created_at DESC LIMIT $3""",
    user_id, False, limit,
)
```

---

## LangGraph Checkpoint Tables

These tables are managed by LangGraph's `PostgresSaver` (not Drizzle). They are created by `await checkpointer.setup()` on first run.

### `checkpoints`

Stores the state of each agent run at a specific step.

| Column | Type | Description |
|--------|------|-------------|
| `thread_id` | `text` | Maps to a conversation |
| `checkpoint_ns` | `text` | Namespace (default `""`) |
| `checkpoint_id` | `text` | Unique checkpoint identifier |
| `parent_checkpoint_id` | `text` | Previous checkpoint (for chain) |
| `type` | `text` | Checkpoint type |
| `checkpoint` | `jsonb` | Serialized agent state |
| `metadata` | `jsonb` | Checkpoint metadata |
| `created_at` | `timestamp` | Creation time |

### `checkpoint_writes`

Stores pending writes (tool call results) between checkpoints.

| Column | Type | Description |
|--------|------|-------------|
| `thread_id` | `text` | Maps to a conversation |
| `checkpoint_ns` | `text` | Namespace |
| `checkpoint_id` | `text` | Parent checkpoint |
| `task_id` | `text` | Task identifier |
| `idx` | `integer` | Write index |
| `channel` | `text` | State channel |
| `type` | `text` | Value type |
| `value` | `jsonb` | Serialized value |

### `checkpoint_blobs`

Stores large state blobs (base64 encoded).

| Column | Type | Description |
|--------|------|-------------|
| `thread_id` | `text` | Maps to a conversation |
| `checkpoint_ns` | `text` | Namespace |
| `channel` | `text` | State channel |
| `version` | `text` | Blob version |
| `type` | `text` | Blob type |
| `value` | `jsonb` | Serialized blob value |

---

## State Transitions

### Conversation State

```
[new] → [active] → [archived]
  │         │
  │         └── [active] (user sends another message)
  │
  └── Thread ID assigned on first message
```

### Memory Lifecycle

```
[created by agent] → [stored in DB with embedding] → [recalled via semantic search]
                                                        │
                                                        └── [used in agent context]
```

### LangGraph Checkpoint Flow

```
[Agent step begins]
      │
      ▼
[LLM call / tool execution]
      │
      ▼
[Checkpoint saved] ← PostgresSaver persists state
      │
      ├── [Next step] → repeat
      │
      └── [Agent complete] → final response to user
                            checkpoint preserved for resume
```

---

## Database Configuration

### Connection Details

- **Host**: Shared PostgreSQL instance (same for Next.js and Python agent)
- **Next.js connection**: Drizzle ORM via `postgres` driver (`src/lib/db/index.ts`)
- **Python agent connection**: asyncpg pool (`services/agent/app/db/connection.py`)
- **PostgresSaver connection**: asyncpg via `AsyncPostgresSaver.from_conn_string()`

### Extensions Required

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "vector";      -- pgvector for embeddings
```

### Migration Strategy

1. **Drizzle Kit** manages all application table migrations (`drizzle-kit generate` + `drizzle-kit migrate`)
2. **PostgresSaver.setup()** creates checkpoint tables on Python agent startup
3. The `memories` table is created by Drizzle Kit but the Python agent reads/writes via raw SQL

---

*Generated as part of Phase 1 design for the LangGraph Python agent backend architecture.*
