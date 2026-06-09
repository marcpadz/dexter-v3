# API Routes Contract: Dexter v3

**Layer**: Next.js App Router API Routes  
**Location**: `src/app/api/`

## Overview

Next.js API routes handle the CopilotKit runtime bridge, Better Auth, and server actions for non-agent data mutations. Agent logic lives entirely in the Python service.

---

## Routes

### `POST /api/copilotkit` — CopilotKit Runtime (AG-UI Bridge)

Forwards agent requests to the Python agent service via AG-UI protocol. This is the primary chat endpoint.

**Request**: CopilotKit AG-UI format
**Response**: SSE stream (AG-UI events)

**See**: [contracts/copilotkit-runtime.md](./copilotkit-runtime.md)

---

### `GET/POST /api/auth/*` — Better Auth Handler

All authentication routes handled by Better Auth.

**Covers**: Sign up, sign in, sign out, OAuth callbacks, session management.

---

### Server Actions (`src/lib/server/actions/`)

Non-agent data mutations use Next.js server actions:

| Action | File | Description |
|--------|------|-------------|
| `createConversation` | `conversations.ts` | Create new conversation |
| `renameConversation` | `conversations.ts` | Rename conversation title |
| `deleteConversation` | `conversations.ts` | Delete conversation and messages |
| `getConversations` | `conversations.ts` | List user conversations |
| `getMessages` | `messages.ts` | Load messages for a conversation |
| `saveMessage` | `messages.ts` | Persist a message to DB |
| `createProject` | `projects.ts` | Create a new project |
| `updateProject` | `projects.ts` | Update project details |
| `deleteProject` | `projects.ts` | Delete project |
| `saveApiKey` | `settings.ts` | Store encrypted API key |
| `deleteApiKey` | `settings.ts` | Remove API key |
| `saveMcpServer` | `settings.ts` | Store MCP server config |
| `toggleMcpServer` | `settings.ts` | Enable/disable MCP server |
| `deleteMcpServer` | `settings.ts` | Remove MCP server config |
| `getMemories` | `settings.ts` | List user memories (for management) |
| `deleteMemory` | `settings.ts` | Delete a specific memory |

All server actions require authenticated session and scope queries to `session.user.id`.

---

*Part of the LangGraph Python agent backend contract definition.*
