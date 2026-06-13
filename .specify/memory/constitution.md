<!--
  ═══════════════════════════════════════════════════════════════════════
  SYNC IMPACT REPORT
  ═══════════════════════════════════════════════════════════════════════
  Version change: 2.0.0 -> 3.0.0
  Modified principles:
    - V. LangGraph Agent Backend: Python -> LangGraph.js (TypeScript) in-process
    - Technology Constraints: Agent Backend -> LangGraph.js in Next.js
  Added sections: None
  Removed sections: None
  Impact: Python FastAPI service deleted. Agent runs as LangGraph.js in-process
           inside Next.js. Daytona SDK called directly from TypeScript tools.
           CopilotKit runtime connects via custom AbstractAgent adapter.
  Templates requiring updates:
    - specs/003-daytona-sandbox-integration/spec.md    current feature
    - specs/003-daytona-sandbox-integration/plan.md    current feature
    - specs/003-daytona-sandbox-integration/tasks.md   current feature
    - .specify/templates/plan-template.md              compatible
    - .specify/templates/spec-template.md              compatible
    - .specify/templates/tasks-template.md             compatible
  Follow-up TODOs: None — implementation complete.
-->

# Dexter v3 Constitution

## Core Principles

### I. CopilotKit-First UI

All chat interfaces, generative UI, human-in-the-loop flows, and
agent-to-client shared state MUST route through CopilotKit's React
components and hooks (`useCopilotChat`, `useCopilotAction`,
`CopilotPopup`, etc.).

- No custom SSE/EventSource wiring for chat streaming.
- No hand-rolled chat state management — use CopilotKit's
  `useCopilotChat` state.
- Generative UI MUST use CopilotKit's render infrastructure.
- Human-in-the-loop MUST use CopilotKit's action confirmation flow.

**Rationale**: CopilotKit provides a battle-tested chat runtime with
built-in generative UI, shared state, and action execution.
Reimplementing any of these layers introduces bugs, diverges from
upstream fixes, and doubles maintenance burden.

### II. Agent Tools Drive Workspace

The workspace panel (artifacts, browser, document editor, terminal,
files, agent-output) is driven entirely by agent tool calls. The agent
decides which surface to open, close, or update. UI code MUST NOT
imperatively manage workspace state outside of responding to tool
invocations.

- Workspace surfaces render in response to tool-call payloads.
- Closing or switching tabs is triggered by agent action, not by
  user-clicked imperative code bypassing the tool layer.
- The Zustand workspace store is the single source of truth for which
  surfaces are active, but mutations flow through agent tool handlers.

**Rationale**: Centralising workspace control in the agent loop makes
behaviour reproducible, auditable, and testable. UI-driven workspace
mutations create hidden state paths that break agent reasoning.

### III. Drizzle Over Prisma

All database access MUST use Drizzle ORM. Prisma MUST NOT be used
anywhere in the project.

- Schema definitions live in `src/db/schema/` using Drizzle's
  `pgTable` builder.
- Queries use Drizzle's query builder or SQL-like API.
- Migrations use Drizzle Kit (`drizzle-kit generate`, `drizzle-kit
  migrate`).
- pgvector columns use Drizzle's native vector type support.

**Rationale**: Drizzle is SQL-first, zero-overhead, supports pgvector
natively, and produces leaner bundles. Prisma adds a heavy runtime
engine and its pgvector story requires adapters. The codebase currently
has Prisma dependencies — these MUST be removed during the rebuild.

### IV. Better Auth Over NextAuth

Authentication MUST use Better Auth. NextAuth v5 (Auth.js) MUST NOT be
used.

- Better Auth handles session management, OAuth providers, and
  credential flows.
- `next-auth` and `@auth/prisma-adapter` packages MUST be removed.
- Auth configuration lives in a dedicated Better Auth config file.

**Rationale**: NextAuth v5 is still in beta with breaking changes across
releases. Better Auth offers a stable API, better TypeScript support,
and simpler integration with modern Next.js App Router patterns.

### V. LangGraph.js Agent Backend

The agent backend MUST run as LangGraph.js (TypeScript) in-process
inside Next.js. CopilotKit's Next.js runtime connects to it via the
`LangGraphAgent` adapter from `@copilotkit/runtime/langgraph`.

- The agent graph is defined in TypeScript using LangGraph.js `StateGraph`.
- Persistent state uses LangGraph.js `PostgresSaver` checkpointer —
  same Postgres database as the app, different tables.
- Multi-agent delegation uses LangGraph.js sub-graphs.
- Long-running tasks survive crashes via checkpointing.
- Human-in-the-loop uses LangGraph.js `interrupt()` + CopilotKit's
  approval UI.
- Memory uses checkpoint state + a dedicated memory tool that writes
  to a `memories` table.
- Daytona SDK calls happen directly in TypeScript tool handlers — no
  HTTP bridge between services.
- Single language, single deployment, single process.
- CopilotKit's `BuiltInAgent` is NOT used — it lacks persistence,
  multi-agent delegation, and checkpointing.
- Inngest is NOT used — LangGraph.js handles durability natively.

**Rationale**: LangGraph.js provides sub-graphs, supervisor pattern,
checkpointing, and interrupt/HITL — all in TypeScript. Daytona SDK
calls are native TypeScript — no HTTP bridge needed. Single language,
single deployment, single process eliminates the operational complexity
of managing a separate Python service.

### VI. Workspace as Surface Pattern

Every workspace tab (artifacts, browser, document editor, terminal,
files, agent-output) is a self-contained surface component. Surfaces
communicate exclusively through the Zustand workspace store — no prop
drilling, no cross-surface direct imports.

- Each surface lives in its own directory under `src/components/
  workspace/surfaces/`.
- Surfaces subscribe to relevant slices of the Zustand workspace store.
- Surface-to-surface data flow goes through the store, never through
  props or context.
- Surfaces MUST NOT import other surface components.

**Rationale**: Decoupled surfaces prevent cascading re-renders, enable
independent testing, and make it trivial to add or remove workspace
tabs without touching neighbouring code.

### VII. No Speculation

Only build what the current spec and task list describe. No speculative
features, no "nice to have" additions, no preemptive abstractions
without an explicit task.

- If a feature is not in the spec, do not build it.
- If an abstraction is not required by current tasks, do not create it.
- When in doubt, stop and ask for clarification rather than assuming.
- "We might need this later" is not a valid reason to build something
  now.

**Rationale**: Speculative code accumulates as unmaintained, untested
dead weight. It increases bundle size, review burden, and cognitive
load without delivering user value.

### VIII. Test Critical Paths

Server actions, agent tool execution, authentication flows, and
workspace state transitions MUST have automated tests. UI components do
not require tests unless they contain non-trivial logic.

- Server actions: test input validation, error handling, and database
  side-effects.
- Tool execution: test tool definitions, argument parsing, and return
  payloads.
- Auth: test sign-up, sign-in, session creation, and protected-route
  access.
- Workspace store: test state transitions (open/close/switch surface).
- UI components: test only if they contain logic beyond rendering
  props.

**Rationale**: Testing every UI component yields diminishing returns.
Focusing tests on critical paths catches regressions where they cause
the most damage: data corruption, auth bypass, agent malfunction, and
workspace state desync.

## Technology Constraints

- **Framework**: Next.js 16 (App Router). Read `node_modules/next/
  dist/docs/` before writing code — this version has breaking changes
  from earlier Next.js releases.
- **Runtime**: Node.js 22+ with TypeScript strict mode.
- **Database**: PostgreSQL with pgvector extension, accessed via Drizzle
  ORM.
- **Auth**: Better Auth (not NextAuth).
- **Agent Backend**: LangGraph.js (TypeScript) running in-process inside
  Next.js, connected to CopilotKit via the `LangGraphAgent` adapter from
  `@copilotkit/runtime/langgraph`.
- **Agent Models**: ChatAnthropic, ChatOpenAI via LangChain.js. Multi-provider
  resolution from user-configured API keys in the `api_keys` table.
- **State Management**: Zustand for client-side workspace state.
- **UI Components**: Radix UI primitives + Tailwind CSS. No shadcn/ui
  CLI — hand-roll compound components with CVA.
- **Testing**: Vitest for server-side and store tests.
- **Package Manager**: npm (as established by existing `package-lock.json`).

## Development Workflow

1. **Spec-driven**: Every feature starts with a spec in `specs/`. No code
   without a spec.
2. **Plan then build**: Specs are planned, reviewed, then broken into
   tasks before implementation begins.
3. **Constitution Check**: Every plan MUST pass a constitution compliance
   gate before implementation. If a principle is violated, the plan
   MUST be amended or the violation MUST be explicitly justified in the
   plan's Complexity Tracking table.
4. **Commit discipline**: Commit after each task or logical group. Use
   conventional commit messages (`feat:`, `fix:`, `docs:`, `chore:`,
  `refactor:`).
5. **No orphan code**: Every file must be reachable from the app entry
  point or from a test. Dead code MUST be removed, not commented out.

## Governance

This constitution is the authoritative source for architectural
decisions in the Dexter v3 project. It supersedes informal conventions,
prior version habits, and individual preferences.

### Amendment Procedure

1. Propose amendment with written justification.
2. Review impact on existing specs, tasks, and in-progress work.
3. Update constitution version per semantic versioning:
   - **MAJOR**: Principle removed or redefined in a backward-incompatible
     way.
   - **MINOR**: New principle added or existing principle materially
     expanded.
   - **PATCH**: Clarifications, wording fixes, non-semantic changes.
4. Propagate changes to all dependent templates and active specs.
5. Commit with message: `docs: amend constitution to vX.Y.Z (summary)`.

### Compliance Review

- Every implementation plan MUST include a Constitution Check section.
- Code reviews SHOULD flag principle violations.
- Complexity Tracking MUST document any justified violations.

### Versioning Policy

Constitution follows semver. The version is recorded in the footer of
this file. Any change to the file MUST be accompanied by a version bump
and a Sync Impact Report comment at the top of the file.

**Version**: 3.0.0 | **Ratified**: 2026-06-09 | **Last Amended**: 2026-06-13
