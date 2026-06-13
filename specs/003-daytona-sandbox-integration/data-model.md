# Data Model: Daytona Sandbox Integration

**Date**: 2026-06-13 | **Spec**: [spec.md](./spec.md)

## Entity Changes

### Conversation (MODIFY)

Add `sandboxId` field to track the Daytona sandbox associated with this conversation.

| Field | Type | Nullable | Default | Notes |
|-------|------|----------|---------|-------|
| `sandboxId` | `text` | YES | `null` | Daytona sandbox ID. Null until first tool use triggers sandbox creation. |

**Relationships**:
- A conversation has 0..1 active Daytona sandbox
- A sandbox belongs to 1 conversation
- When a conversation is deleted, its sandbox should be stopped and deleted via Daytona API (application-level cascade, not DB FK)

**State Transitions** (sandbox lifecycle per conversation):

```
null → [tool call] → sandboxId set (sandbox created/started)
sandboxId set + started → [idle 15min] → sandbox stopped (sandboxId remains)
sandboxId set + stopped → [new message] → sandbox restarted (same sandboxId)
sandboxId set + archived → [new message] → new sandbox created (sandboxId updated)
sandboxId set + any → [conversation deleted] → sandbox deleted (sandboxId cleared)
```

### No New Tables

Daytona sandbox state is managed by Daytona.io — we only store the `sandboxId` reference. Sandbox metadata (state, resources, etc.) is fetched from Daytona API as needed.

LangGraph checkpoint tables are managed by LangGraph.js's `PostgresSaver.setup()` and live in the same database under separate table names (e.g., `checkpoints`, `checkpoint_writes`, `checkpoint_blobs`).

## Drizzle Schema Change

```typescript
// src/lib/db/schema/conversations.ts — ADD sandboxId field

import { pgTable, text, timestamp, boolean, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";
import { projects } from "./projects";

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  model: text("model"),
  projectId: uuid("projectId").references(() => projects.id, { onDelete: "set null" }),
  pinned: boolean("pinned").notNull().default(false),
  threadId: text("threadId"),
  sandboxId: text("sandboxId"),  // NEW — Daytona sandbox reference
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});
```

## LangGraph Checkpoint Tables

Created automatically by `PostgresSaver.setup()`:

| Table | Purpose |
|-------|---------|
| `checkpoints` | Stores serialized graph state per thread |
| `checkpoint_writes` | Pending writes for interrupted executions |
| `checkpoint_blobs` | Large binary state blobs |

Thread ID = conversation ID. No schema definition needed — LangGraph manages these tables.

## Key Invariants

1. `sandboxId` is set on first tool invocation and persists across page reloads
2. `sandboxId` may reference a stopped or archived sandbox — callers must check state via Daytona API
3. One conversation → one sandbox (1:1 mapping)
4. Deleting a conversation MUST clean up its Daytona sandbox (app-level logic)
