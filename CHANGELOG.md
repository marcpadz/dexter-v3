# Changelog

All notable changes to the Dexter v3 project will be documented in this file.

Format: ISO date, author, summary with links to GitHub issues/PRs.

---

## 2026-06-13 — Daytona Sandbox Integration

- Replaced Python FastAPI agent service with LangGraph.js in-process inside Next.js
- Added Daytona SDK sandbox integration (`src/lib/daytona/`)
- Created LangGraph.js agent graph with supervisor node (`src/lib/agent/`)
- Implemented 12 Daytona tools: code execution, shell commands, file CRUD, git ops, browser, web search
- Rewrote CopilotKit runtime to use custom AG-UI AbstractAgent bridge
- Replaced custom chat UI with `<CopilotChat>` from `@copilotkit/react-ui`
- Re-enabled auth middleware using Better Auth
- Added `sandboxId` column to conversations schema
- Implemented lazy sandbox creation with auto-stop after 15min, auto-archive after 24h
- Sandbox lifecycle: create on first tool call, restart stopped, recreate archived
- Deleted dead code: Python service, MCP registry/client, chat-adapter, tool-renderers
- Removed zombie deps: next-auth, @auth/prisma-adapter, @prisma/client, @prisma/adapter-pg, prisma
- Amended constitution Principle V: Python LangGraph → LangGraph.js (TypeScript), v3.0.0
- Added research and code sub-graphs for multi-agent delegation
- Build passes green

---

## 2026-06-10 — Repo Scan & Process Setup

**Author:** pi (graphify + codegraph scan)

- **Diagnostics:** Ran full repo scan with graphify (1,312 nodes, 1,618 edges) and codegraph (823 nodes, 1,458 edges)
- **Bugs found:** 6 issues filed ([#5](https://github.com/marcpadz/dexter-v3/issues/5)–[#10](https://github.com/marcpadz/dexter-v3/issues/10))
- **Process:** Established docs/ structure, CHANGELOG.md, and code hygiene rules in AGENTS.md
- **Diagnostics report:** `docs/findings/2026-06-10-repo-scan.md`

---

## 2026-06-09 — Initial Dexter v3 Implementation

**Author:** Jules (136-task bulk implementation via 4 sessions)

- 14 Drizzle tables + pgvector migrated to Neon cloud Postgres
- CopilotKit frontend with ChatPage, AppShell, 3-panel layout
- 8 CopilotKit actions defined (create_artifact, browse_web, execute_code, etc.)
- 6 workspace surface components (artifact, browser, document, terminal, files, agent-output)
- Python agent service skeleton (FastAPI + LangGraph + PostgresSaver)
- Better Auth with Drizzle adapter
- Settings page with API key management
- MCP client & registry
- All Codex v2 legacy removed

**Known issues (from June 10 scan):**
- `useWorkspaceTools()` defined but never called in ChatPage
- Python agent has no AG-UI endpoint
- `tools_node` is a mock
- Runtime.ts has operator precedence bug
- Checkpointer not passed to graph compile

## 2024-06-14 Code Health Improvement
- **WorkspacePanel**: Removed unused `WorkspaceTab` import and refactored the `TABS` array type annotation. Cast in `onValueChange` is now done implicitly leveraging TypeScript `Parameters` inference (`Parameters<typeof setActiveTab>[0]`) to maintain type-safety without external dependencies.
