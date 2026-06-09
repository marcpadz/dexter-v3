# Changelog

All notable changes to the Dexter v3 project will be documented in this file.

Format: ISO date, author, summary with links to GitHub issues/PRs.

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
