# Dexter v3 — Implementation Plan

> Two architectural paths for building a true agentic workspace  
> Date: 2025-06-09

---

## Table of Contents

1. [The Problem (Why v2 Isn't Agentic)](#1-the-problem)
2. [Plan A: Vercel AI SDK v6 (Fixed)](#2-plan-a-vercel-ai-sdk-v6-fixed)
3. [Plan B: CopilotKit](#3-plan-b-copilotkit)
4. [Head-to-Head Comparison](#4-head-to-head-comparison)
5. [Recommendation](#5-recommendation)
6. [Migration Strategy](#6-migration-strategy)
7. [Shared Foundation (Both Plans)](#7-shared-foundation-both-plans)
8. [Appendix: Dependency Audit](#8-dependency-audit)

---

## 1. The Problem

### Why v2 feels like "not an agent"

The current `src/app/api/chat/route.ts` is **140 lines of provider routing** that calls `streamText()` with:
- ❌ Zero tools
- ❌ Zero agent loop
- ❌ Zero MCP integration
- ❌ Zero background task execution
- ❌ Zero tool progress streaming to the frontend

It's a **chat wrapper**, not an agent. The fix isn't necessarily a new SDK — it's using the SDK correctly.

### Key insight

> **The Vercel AI SDK v6 actually supports agents now.** Your v2 is on `ai@6.0.198` but uses none of the agent features. The `ToolLoopAgent` class, `stopWhen` for multi-step loops, `onStepFinish` for lifecycle hooks, subagents, and MCP support were all added in v6.

---

## 2. Plan A: Vercel AI SDK v6 (Fixed)

### The approach

Keep the AI SDK you already have, but use it as an **agent framework** instead of a streaming chat wrapper. Add Inngest for durable execution on long-running tasks.

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Next.js Frontend (App Router)                           │
│                                                          │
│  ┌──────────────────┐  ┌───────────────────────────┐    │
│  │ Chat UI           │  │ useAgentChat() hook        │    │
│  │ - Messages        │  │ - SSE stream consumption   │    │
│  │ - Tool progress   │  │ - Tool call rendering      │    │
│  │ - Attachments     │  │ - Step-by-step status      │    │
│  └──────────────────┘  └───────────────────────────┘    │
└────────────────────────┬────────────────────────────────┘
                         │ SSE / fetch
┌────────────────────────▼────────────────────────────────┐
│  Next.js API Routes (or Hono sub-router)                 │
│                                                          │
│  // The agent — this replaces the entire route.ts        │
│  const agent = new ToolLoopAgent({                       │
│    model: gateway("anthropic/claude-sonnet-4"),          │
│    tools: {                                              │
│      searchWeb,       // web search tool                 │
│      readDocument,    // RAG retrieval                   │
│      executeCode,     // sandboxed code execution        │
│      queryDatabase,   // direct DB queries               │
│      manageFiles,     // file CRUD operations            │
│      ...mcpTools,     // dynamically loaded MCP tools    │
│    },                                                    │
│    instructions: systemPrompt,                           │
│    stopWhen: stepCountIs(25),                            │
│    onStepFinish: ({ stepNumber, toolCalls, usage }) => { │
│      // Stream step progress to client                   │
│      // Log usage for billing                            │
│    },                                                    │
│  });                                                     │
│                                                          │
│  // Generate (fire-and-forget) or Stream (SSE)           │
│  const result = await agent.stream({ prompt });          │
│  return result.toDataStreamResponse();                   │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│  Inngest (Durable Execution Layer)                       │
│                                                          │
│  - Agent tasks that exceed serverless timeout (>30s)     │
│  - Retry logic with exponential backoff                  │
│  - Background embedding/RAG indexing                     │
│  - Scheduled tasks (daily message resets, cleanup)       │
│  - Observability and step-by-step logging                │
└─────────────────────────────────────────────────────────┘
```

### New dependencies

```jsonc
// Keep (already installed)
"ai": "^6.0.198",                    // Core agent framework
"@ai-sdk/anthropic": "^3.0.81",      // Anthropic provider
"@ai-sdk/openai": "^3.0.68",         // OpenAI provider
"@ai-sdk/google": "^3.0.80",         // Google provider
"@ai-sdk/groq": "^3.0.39",           // Groq provider
"@openrouter/ai-sdk-provider": "^2.9.0", // OpenRouter

// Add new
"inngest": "^4.5.0",                 // Durable execution
"@ai-sdk/mcp": "^2.0.0",             // MCP client for tool discovery
"@modelcontextprotocol/sdk": "^1.0.0", // MCP protocol types

// Swap (recommended from architecture review)
"drizzle-orm": "^0.44.0",            // Replace Prisma
"better-auth": "^1.2.0",             // Replace NextAuth v5 beta
```

### File structure changes

```
src/
├── app/
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.ts          // REWRITE: ToolLoopAgent + stream
│   │   ├── inngest/
│   │   │   └── route.ts          // NEW: Inngest webhook handler
│   │   └── ...
│   └── ...
├── lib/
│   ├── agent/
│   │   ├── index.ts              // NEW: ToolLoopAgent factory
│   │   ├── tools/
│   │   │   ├── search.ts         // NEW: Web search tool
│   │   │   ├── documents.ts      // NEW: RAG retrieval tool
│   │   │   ├── code.ts           // NEW: Code execution tool
│   │   │   ├── database.ts       // NEW: DB query tool
│   │   │   └── mcp.ts            // NEW: Dynamic MCP tool loader
│   │   ├── prompts.ts            // NEW: System prompts by mode
│   │   └── providers.ts          // REWRITE: Clean provider resolution
│   ├── db/
│   │   ├── index.ts              // REWRITE: Drizzle instead of Prisma
│   │   └── schema.ts             // NEW: Drizzle schema (7 tables)
│   ├── auth.ts                   // REWRITE: Better Auth
│   └── inngest/
│       ├── client.ts             // NEW: Inngest client
│       └── functions/
│           ├── agent-task.ts     // NEW: Durable agent execution
│           ├── embed-docs.ts     // NEW: Background embedding
│           └── cleanup.ts        // NEW: Scheduled cleanup
└── hooks/
    └── useAgentChat.ts           // NEW: Custom hook (replaces useChat)
```

### Core implementation — Agent route (replacement for current route.ts)

```typescript
// src/lib/agent/index.ts
import { ToolLoopAgent, stepCountIs, tool } from 'ai';
import { gateway } from 'ai';
import { resolveModel } from './providers';
import { searchWeb, readDocument, executeCode, queryDatabase, manageFiles } from './tools';
import { loadMcpTools } from './tools/mcp';

export async function createAgent({
  userId,
  model,
  systemPrompt,
  conversationId,
  mcpServers,
}: AgentConfig) {
  // Load dynamic MCP tools from user-configured servers
  const mcpTools = mcpServers?.length
    ? await loadMcpTools(mcpServers)
    : {};

  return new ToolLoopAgent({
    model: resolveModel(model),
    instructions: systemPrompt,
    tools: {
      searchWeb,
      readDocument,
      executeCode,
      queryDatabase,
      manageFiles,
      ...mcpTools,
    },
    stopWhen: stepCountIs(25),
    onStepFinish: async ({ stepNumber, toolCalls, usage }) => {
      // Log to DB for billing/audit
      await logAgentStep(conversationId, stepNumber, toolCalls, usage);
    },
  });
}
```

```typescript
// src/app/api/chat/route.ts — COMPLETE REWRITE (from 140 lines to ~40)
import { createAgent } from '@/lib/agent';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { messages, model, conversationId, systemPrompt, mcpServerIds } = await req.json();

  // Load user's MCP server configs
  const mcpServers = mcpServerIds?.length
    ? await db.query.mcpServers.findMany({
        where: (s, { eq, and }) => and(
          eq(s.userId, session.user.id),
          // only enabled servers
        ),
      })
    : [];

  const agent = await createAgent({
    userId: session.user.id,
    model,
    systemPrompt,
    conversationId,
    mcpServers,
  });

  // For short tasks: stream directly
  // For long tasks: dispatch to Inngest, return a task ID
  const isLongRunning = false; // heuristic: message count, tool complexity, etc.

  if (isLongRunning) {
    const taskId = await inngest.send({
      name: 'agent/run',
      data: { userId: session.user.id, messages, model, conversationId },
    });
    return Response.json({ taskId, status: 'running' });
  }

  const result = agent.stream({
    prompt: messages,
  });

  return result.toDataStreamResponse();
}
```

### Core implementation — Inngest durable agent

```typescript
// src/lib/inngest/functions/agent-task.ts
import { inngest } from '../client';
import { createAgent } from '@/lib/agent';

export const runAgentTask = inngest.createFunction(
  {
    id: 'run-agent',
    retries: 3,
    timeout: '10m',           // Agent can run for up to 10 minutes
    concurrency: { limit: 5 }, // Max 5 concurrent agent runs per user
  },
  { event: 'agent/run' },
  async ({ event, step }) => {
    const { userId, messages, model, conversationId } = event.data;

    // Each agent step is a durable step — survives crashes/restarts
    const agent = await step.run('create-agent', async () => {
      return createAgent({ userId, model, conversationId });
    });

    const result = await step.run('execute-agent', async () => {
      return agent.generate({ prompt: messages });
    });

    // Save final result to DB
    await step.run('save-result', async () => {
      await saveAgentResult(conversationId, result);
    });

    return { success: true, conversationId };
  }
);
```

### Core implementation — Custom useAgentChat hook

```typescript
// src/hooks/useAgentChat.ts
// Replaces the Vercel useChat() hook with agent-aware streaming
'use client';

import { useState, useCallback, useRef } from 'react';

interface AgentStep {
  stepNumber: number;
  type: 'thinking' | 'tool_call' | 'tool_result' | 'text';
  content: string;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  result?: unknown;
}

export function useAgentChat({ conversationId, model }: AgentChatConfig) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(async (content: string) => {
    setIsRunning(true);
    setSteps([]);
    abortRef.current = new AbortController();

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content }]);

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [...messages, { role: 'user', content }],
        model,
        conversationId,
      }),
      signal: abortRef.current.signal,
    });

    // Check if dispatched to background
    if (response.headers.get('content-type')?.includes('application/json')) {
      const { taskId } = await response.json();
      // Poll for background task status
      pollTaskStatus(taskId, setMessages, setSteps, setIsRunning);
      return;
    }

    // Consume SSE stream with step events
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    // ... parse SSE events, update steps/messages in real-time

    setIsRunning(false);
  }, [messages, model, conversationId]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setIsRunning(false);
  }, []);

  return { messages, steps, isRunning, send, stop };
}
```

### Pros & Cons

| ✅ Pros | ❌ Cons |
|---------|---------|
| Minimal migration — you're already on AI SDK v6 | No built-in generative UI (you build it) |
| Smallest dependency footprint (4 core deps) | Durable execution requires Inngest (external service) |
| Full control over agent behavior and streaming | No built-in human-in-the-loop protocol |
| Best provider ecosystem (10+ official) | You write the frontend agent state management |
| `ToolLoopAgent` handles multi-round loops natively | No built-in cross-platform (web only, unless you build it) |
| MCP support via `@ai-sdk/mcp` | |
| Lightest weight — no vendor lock-in | |

---

## 3. Plan B: CopilotKit

### The approach

Replace the entire frontend-chat-to-backend pipeline with CopilotKit, which provides a **full-stack agent framework**: React components, agent runtime, AG-UI protocol, shared state, generative UI, human-in-the-loop, and MCP — all out of the box.

### Architecture

```
┌──────────────────────────────────────────────────────────┐
│  CopilotKit Frontend (React)                              │
│                                                           │
│  ┌────────────────────────┐  ┌─────────────────────────┐ │
│  │ <CopilotChat>           │  │ <CopilotKitProvider>     │ │
│  │  - Prebuilt chat UI     │  │  - Shared state          │ │
│  │  - Tool call rendering  │  │  - Frontend tools        │ │
│  │  - Generative UI        │  │  - Agent context         │ │
│  │  - Human-in-the-loop    │  │  - Thread management     │ │
│  └────────────────────────┘  └─────────────────────────┘ │
└────────────────────┬──────────────────────────────────────┘
                     │ AG-UI Protocol (SSE events)
┌────────────────────▼──────────────────────────────────────┐
│  CopilotRuntime (Next.js API route)                        │
│                                                            │
│  const runtime = new CopilotRuntime({                      │
│    agents: {                                               │
│      default: new BuiltInAgent({                           │
│        model: "openai:gpt-4o",                            │
│        tools: [search, readDB, execute, mcpTools],        │
│        maxSteps: 25,                                       │
│      }),                                                   │
│      // Or: LangGraph agent, CrewAI agent, etc.            │
│      research: langGraphAgent,                             │
│      code: copilotAgent,                                   │
│    },                                                      │
│  });                                                       │
│                                                            │
│  // AG-UI protocol handles:                                │
│  // - Agent ↔ UI state sync                                │
│  // - Tool call → render UI in client                      │
│  // - Human-in-the-loop interrupts                          │
│  // - Multi-step streaming with intermediate results        │
└───────────────────────────────────────────────────────────┘
```

### New dependencies

```jsonc
// Add
"@copilotkit/react-core": "^2",       // React provider + hooks
"@copilotkit/react-ui": "^2",          // Prebuilt chat components
"@copilotkit/runtime": "^2",           // Server-side runtime
"@copilotkit/runtime-client": "^2",    // Client runtime bindings

// Optional (CopilotKit integrates with these)
"@langchain/langgraph": "^1.3.7",      // If using LangGraph agents
// OR use BuiltInAgent (simpler, no LangGraph needed)

// Keep for provider flexibility
"@ai-sdk/openai": "^3.0.68",           // Still used under the hood
"@ai-sdk/anthropic": "^3.0.81",

// Swap (same as Plan A)
"drizzle-orm": "^0.44.0",              // Replace Prisma
"better-auth": "^1.2.0",               // Replace NextAuth
```

### File structure changes

```
src/
├── app/
│   ├── api/
│   │   ├── copilotkit/
│   │   │   └── route.ts          // NEW: CopilotRuntime endpoint
│   │   └── ...
│   ├── (app)/
│   │   ├── layout.tsx            // MODIFY: Wrap in CopilotKitProvider
│   │   └── chat/
│   │       └── page.tsx          // REWRITE: Use <CopilotChat>
│   └── ...
├── lib/
│   ├── copilot/
│   │   ├── tools.ts              // NEW: defineTool() for all tools
│   │   ├── agents.ts             // NEW: Agent configurations
│   │   └── mcp.ts                // NEW: MCP server connections
│   ├── db/
│   │   ├── index.ts              // REWRITE: Drizzle
│   │   └── schema.ts             // NEW: Drizzle schema
│   └── auth.ts                   // REWRITE: Better Auth
└── components/
    └── copilot/
        ├── agent-chat.tsx        // NEW: Custom chat wrapper
        ├── tool-renderers/       // NEW: Generative UI components
        │   ├── search-result.tsx
        │   ├── code-execution.tsx
        │   └── document-viewer.tsx
        └── human-approval.tsx    // NEW: Human-in-the-loop UI
```

### Core implementation — CopilotRuntime

```typescript
// src/app/api/copilotkit/route.ts
import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { BuiltInAgent } from "@copilotkit/runtime/v2";
import { defineTool } from "@copilotkit/runtime/v2";
import { z } from "zod";
import { NextRequest } from "next/server";

// Define server-side tools
const searchWeb = defineTool({
  name: "searchWeb",
  description: "Search the web for information",
  parameters: z.object({
    query: z.string().describe("Search query"),
  }),
  execute: async ({ query }) => {
    const results = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    return results.json();
  },
});

const readDocument = defineTool({
  name: "readDocument",
  description: "Read a document from the knowledge base",
  parameters: z.object({
    documentId: z.string(),
    query: z.string().describe("What to look for"),
  }),
  execute: async ({ documentId, query }) => {
    // RAG retrieval from pgvector
    return await retrieveRelevantChunks(documentId, query);
  },
});

const executeCode = defineTool({
  name: "executeCode",
  description: "Execute code in a sandboxed environment",
  parameters: z.object({
    language: z.enum(["javascript", "python", "shell"]),
    code: z.string(),
  }),
  execute: async ({ language, code }) => {
    return await runInSandbox(language, code);
  },
});

const queryDatabase = defineTool({
  name: "queryDatabase",
  description: "Query the user's data (conversations, notes, tasks)",
  parameters: z.object({
    query: z.string().describe("Natural language query about user data"),
    dataType: z.enum(["conversations", "notes", "tasks", "documents"]),
  }),
  execute: async ({ query, dataType }, context) => {
    // Uses Drizzle ORM, scoped to current user
    return await queryUserData(context.userId, dataType, query);
  },
});

// Create the agent with multi-step capability
const dexterAgent = new BuiltInAgent({
  model: "openrouter:auto",  // or "anthropic:claude-sonnet-4", etc.
  tools: [searchWeb, readDocument, executeCode, queryDatabase],
  maxSteps: 25,
});

const runtime = new CopilotRuntime({
  agents: {
    default: dexterAgent,
    // Could add specialized agents:
    // research: researchAgent,
    // code: codeAgent,
  },
});

export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    endpoint: "/api/copilotkit",
  });
  return handleRequest(req);
};
```

### Core implementation — Frontend

```tsx
// src/app/(app)/layout.tsx — Wrap app in CopilotKitProvider
import { CopilotKit } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";

export default function AppLayout({ children }) {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit">
      <CopilotSidebar
        labels={{ title: "Dexter", initial: "How can I help?" }}
        defaultOpen={false}
      >
        {children}
      </CopilotSidebar>
    </CopilotKit>
  );
}
```

```tsx
// Or: Full-page chat with custom tool renderers
// src/app/(app)/chat/page.tsx
"use client";

import { CopilotChat } from "@copilotkit/react-ui";
import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import "@copilotkit/react-ui/styles.css";

export default function ChatPage() {
  // Frontend tools — agent can directly manipulate UI
  useCopilotAction({
    name: "createNote",
    description: "Create a new note",
    parameters: [
      { name: "title", type: "string", required: true },
      { name: "content", type: "string", required: true },
    ],
    handler: async ({ title, content }) => {
      await fetch("/api/notes", {
        method: "POST",
        body: JSON.stringify({ title, content }),
      });
    },
    render: ({ status, args, result }) => (
      <NoteCreationCard status={status} title={args.title} />
    ),
  });

  // Share state with the agent
  useCopilotReadable({
    description: "Current project context",
    value: currentProject,
  });

  return (
    <CopilotChat
      className="h-full"
      labels={{ title: "Dexter", initial: "What are we working on?" }}
      instructions={systemPrompt}
    />
  );
}
```

### Generative UI — Tool renderers

```tsx
// src/components/copilot/tool-renderers/search-result.tsx
// The agent calls a tool and the result renders as a React component

import { useCopilotAction } from "@copilotkit/react-core";

export function SearchToolRenderer() {
  useCopilotAction({
    name: "searchWeb",
    // ... parameters, handler ...
    render: ({ status, args, result }) => {
      if (status === "inProgress") {
        return (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <Spinner />
            <span>Searching for "{args.query}"...</span>
          </div>
        );
      }

      if (status === "complete") {
        return (
          <div className="space-y-2">
            <h4 className="font-medium">Search Results for "{args.query}"</h4>
            {result?.map((r: SearchResult) => (
              <SearchResultCard key={r.url} result={r} />
            ))}
          </div>
        );
      }
    },
  });
}
```

### Human-in-the-Loop

```typescript
// CopilotKit has first-class HITL support
const approveAction = defineTool({
  name: "executeApprovedAction",
  description: "Execute an action that requires user approval",
  parameters: z.object({
    action: z.string(),
    details: z.string(),
  }),
  // The tool pauses and waits for user input before executing
  // This is handled natively by CopilotKit's AG-UI protocol
});
```

### Pros & Cons

| ✅ Pros | ❌ Cons |
|---------|---------|
| **Generative UI** — tools render as React components in the chat | More opinionated — less control over internals |
| **Human-in-the-loop** built in | New dependency with its own abstraction model |
| **Shared state** between agent and UI | BuiltInAgent routes through Copilot's runtime (vendor lock-in) |
| **AG-UI Protocol** — standard for agent↔UI communication | Less control over streaming format |
| **Prebuilt chat components** — ship fast | Uses AI SDK under the hood anyway (double abstraction) |
| **Multi-platform** — same agent on web, mobile, Slack | Enterprise features (self-hosted intelligence) are paid |
| **Cross-agent** — integrates with LangGraph, CrewAI, Mastra | Heavier bundle (CopilotKit + its deps) |
| **Threads** built in — persistent conversation state | Less community traction than Vercel AI SDK |
| **Inspector** — visual debugging of agent steps | Version v2 is relatively new (migration from v1) |

---

## 4. Head-to-Head Comparison

| Feature | Plan A: AI SDK v6 | Plan B: CopilotKit |
|---------|-------------------|---------------------|
| **Agent loop** | `ToolLoopAgent` — native | `BuiltInAgent` — wraps AI SDK |
| **Multi-step tools** | `stopWhen: stepCountIs(N)` | `maxSteps: N` |
| **MCP integration** | `@ai-sdk/mcp` | Native MCP server support |
| **Subagents** | ✅ Built-in | ✅ Multi-agent support |
| **Streaming** | Full SSE control | AG-UI protocol (opinionated) |
| **Generative UI** | ❌ Build yourself | ✅ First-class (React components) |
| **Human-in-the-loop** | ❌ Build yourself | ✅ First-class (interrupts + approval) |
| **Shared state** | ❌ Build yourself | ✅ `useCopilotReadable` |
| **Frontend tools** | ❌ Build yourself | ✅ `useCopilotAction` |
| **Prebuilt chat UI** | ❌ Build yourself | ✅ `<CopilotChat>` / `<CopilotSidebar>` |
| **Durable execution** | ❌ Add Inngest ($0–$50/mo) | ⚠️ Thread persistence built in; long tasks still need external |
| **Provider breadth** | ✅ 10+ official | ✅ Same (uses AI SDK underneath) |
| **Custom model router** | ✅ Full control | ⚠️ Model selection config |
| **Cross-platform** | ❌ Web only | ✅ Web + React Native + Angular + Vue |
| **Bundle size** | 🟢 ~50KB | 🟡 ~200KB+ |
| **Complexity** | 🟢 Low — you control everything | 🟡 Medium — learn CopilotKit's model |
| **Vendor lock-in** | 🟢 None | 🟡 Moderate — CopilotKit abstractions |
| **Plugin ecosystem** | 🟢 Best — any `@ai-sdk/*` | 🟡 Good — LangGraph, CrewAI, MCP |
| **Debugging** | DevTools (experimental) | Inspector (built-in) |
| **Open source** | ✅ Apache-2.0 | ✅ MIT |
| **Long-term maintenance** | Vercel-backed, very active | VC-backed, very active |

---

## 5. Recommendation

### 🥇 **Plan A (AI SDK v6 + Inngest)** — if you want maximum control

**Choose this when:**
- You want the lightest possible dependency tree
- You're comfortable building your own chat UI components
- You want full control over streaming, tool execution, and state management
- You don't need generative UI or human-in-the-loop out of the box
- You want zero vendor lock-in

**The honest truth:** Your v2 implementation was the problem, not the AI SDK. `ToolLoopAgent` + `stopWhen` + MCP tools + `onStepFinish` gives you a real agent loop. The AI SDK v6 docs now have a whole "Agents" section with subagents, workflow patterns, loop control, and memory — it's a different SDK from what v5 was.

### 🥈 **Plan B (CopilotKit)** — if you want to ship fast with agentic UX

**Choose this when:**
- You want **generative UI** (tools render as React components in the chat)
- You want **human-in-the-loop** approval flows without building them
- You want **shared state** between agent and UI
- You want a prebuilt chat interface with tool call visualization
- You might go multi-platform (mobile, Slack) later
- You're OK with a more opinionated framework

**The caveat:** CopilotKit's `BuiltInAgent` uses the Vercel AI SDK under the hood anyway. You're adding a layer on top. But that layer gives you AG-UI protocol, generative UI, HITL, and shared state for free.

### 🎯 **The hybrid option (Best of both)**

Use **Plan B for the frontend** (CopilotKit's chat UI, generative tool renderers, shared state, HITL) + **Plan A for the backend** (AI SDK `ToolLoopAgent` as the actual agent engine, registered as a custom agent in CopilotKit's runtime).

```typescript
// Use CopilotKit's UI layer but your own AI SDK agent
import { CopilotRuntime } from "@copilotkit/runtime";

// Your AI SDK agent, wrapped for CopilotKit
const myAgent = new ToolLoopAgent({
  model: gateway("anthropic/claude-sonnet-4"),
  tools: { search, code, db },
  stopWhen: stepCountIs(25),
});

const runtime = new CopilotRuntime({
  agents: { default: myAgent }, // CopilotKit wraps it with AG-UI
});
```

This gives you CopilotKit's UI superpowers without losing AI SDK's agent control.

---

## 6. Migration Strategy

### Phase 0: Foundation swaps (1-2 days) — Both Plans

These are shared regardless of which plan you pick:

1. **Replace Prisma → Drizzle ORM**
   - Convert 20 models → 7 functional tables
   - Remove `prisma generate` from build pipeline
   - Native pgvector support (no `Unsupported("vector")` hacks)

2. **Replace NextAuth v5 beta → Better Auth**
   - Stable API, simpler setup
   - Works with both Next.js and Hono

3. **Clean up AppleDouble files**
   ```bash
   find . -name '._*' -delete
   ```

### Phase 1A: Plan A implementation (3-5 days)

1. **Day 1:** Create `ToolLoopAgent` factory + provider resolution
2. **Day 2:** Implement core tools (search, documents, database)
3. **Day 3:** MCP client integration + custom `useAgentChat` hook
4. **Day 4:** Inngest setup + durable agent function
5. **Day 5:** Frontend tool progress rendering + testing

### Phase 1B: Plan B implementation (2-4 days)

1. **Day 1:** Install CopilotKit, set up runtime + provider
2. **Day 2:** Define server tools + agent configuration
3. **Day 3:** Frontend integration (chat UI + generative tool renderers)
4. **Day 4:** MCP servers + human-in-the-loop + testing

### Phase 2: Advanced features (1-2 weeks) — Both Plans

1. Subagent delegation (research agent → code agent → review agent)
2. RAG pipeline (document upload → chunk → embed → pgvector)
3. Memory/conversation summarization
4. Background task monitoring UI
5. Multi-model routing (cheap model for simple tasks, powerful for complex)

---

## 7. Shared Foundation (Both Plans)

### Drizzle Schema (7 tables)

```typescript
// src/lib/db/schema.ts
import { pgTable, text, timestamp, boolean, json, integer, uuid, vector } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').unique(),
  name: text('name'),
  role: text('role').default('user'),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const conversations = pgTable('conversations', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').default('New Chat'),
  projectId: uuid('project_id'),
  model: text('model'),
  pinned: boolean('pinned').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversationId: uuid('conversation_id').references(() => conversations.id, { onDelete: 'cascade' }),
  role: text('role'),  // 'user' | 'assistant' | 'tool'
  content: text('content').default(''),
  toolCalls: json('tool_calls'),   // Agent tool calls
  toolCallId: text('tool_call_id'), // For tool result messages
  model: text('model'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const documents = pgTable('documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  type: text('type'),  // 'note' | 'task' | 'file' | 'knowledge'
  title: text('title'),
  content: text('content').default(''),
  metadata: json('metadata'),
  embedding: vector('embedding', { dimensions: 1536 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name: text('name'),
  instructions: text('instructions'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider'),
  encryptedKey: text('encrypted_key'),
  iv: text('iv'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const mcpServers = pgTable('mcp_servers', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name: text('name'),
  transport: text('transport').default('stdio'),  // 'stdio' | 'sse' | 'streamable-http'
  command: text('command'),
  args: json('args'),
  env: json('env'),
  url: text('url'),
  enabled: boolean('enabled').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});
```

---

## 8. Dependency Audit

### Current v2 dependencies — Keep / Swap / Drop

| Package | Action | Reason |
|---------|--------|--------|
| `ai` | **KEEP** | Core agent framework (use ToolLoopAgent) |
| `@ai-sdk/*` (all 8) | **KEEP** | Provider integrations |
| `@openrouter/ai-sdk-provider` | **KEEP** | OpenRouter routing |
| `next` 16.2.7 | **KEEP** | App Router |
| `react` 19 | **KEEP** | |
| `next-auth` v5 beta | **SWAP → better-auth** | Beta for 2+ years |
| `@prisma/client` + `@auth/prisma-adapter` | **SWAP → drizzle-orm** | Simpler, native pgvector |
| `@prisma/adapter-pg` | **DROP** | No longer needed |
| `pg` | **KEEP** | Drizzle uses pg under the hood |
| `zustand` | **KEEP** | Client state management |
| `lucide-react` | **KEEP** | Icons |
| `shadcn` + all `@radix-ui/*` | **KEEP** | UI components |
| `react-markdown` + plugins | **KEEP** | Markdown rendering |
| `sonner` | **KEEP** | Toast notifications |
| `cmdk` | **KEEP** | Command palette |
| `next-themes` | **KEEP** | Dark mode |
| `date-fns` | **KEEP** | Date formatting |
| `bcryptjs` | **KEEP** | Password hashing (used by Better Auth too) |
| `nanoid` | **KEEP** | ID generation |
| `uuid` | **KEEP** | UUID generation |

### New dependencies by plan

| Plan A additions | Plan B additions |
|------------------|------------------|
| `inngest` | `@copilotkit/react-core` |
| `@ai-sdk/mcp` | `@copilotkit/react-ui` |
| `@modelcontextprotocol/sdk` | `@copilotkit/runtime` |
| `drizzle-orm` | `drizzle-orm` |
| `better-auth` | `better-auth` |

---

## Decision Matrix

| I want... | Choose |
|-----------|--------|
| Maximum control, minimum deps | **Plan A** |
| To ship an agentic chat UI fast | **Plan B** |
| Generative UI (tools render as React components) | **Plan B** |
| Human-in-the-loop approval flows | **Plan B** |
| Zero vendor lock-in | **Plan A** |
| Multi-platform (mobile + web) | **Plan B** |
| Best long-term maintainability | **Plan A** |
| Best demo-ability for investors/users | **Plan B** (or Hybrid) |
| Both | **Hybrid** (Plan B frontend + Plan A agent engine) |

---

*Generated by Pi • Context-aware analysis of v2 codebase + architecture review + SDK research*
