# Tasks: Daytona Sandbox Bug Fixes & Hardening

**Input**: Health scan findings from `docs/findings/2026-06-13-pre-deployment-health-scan.md`

**Prerequisites**: @daytonaio/sdk installed, LangGraph.js runtime operational, Daytona sandbox integration functional

**Tests**: Included — bug fixes require regression tests to prevent re-occurrence

**Organization**: Tasks grouped by bug severity (P0 → P2 critical path first), then recommendations

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story / bug area this task belongs to
- Include exact file paths in descriptions

---

## Phase 1: Critical Bug Fixes (P0 — Blocks Deployment)

**Purpose**: Fix bugs that prevent the app from functioning correctly in production

- [ ] T001 [P0] Fix Data URI duplication in BrowserSurface — change `src/components/workspace/surfaces/browser-surface.tsx` line ~58 from `<img src={\`data:image/png;base64,${browserScreenshot}\`} />` to `<img src={browserScreenshot} />` since `browserScreenshot` already contains the `data:image/jpeg;base64,` prefix from the Daytona tool
- [ ] T002 [P0] Fix AG-UI Bridge tool result parsing in `src/components/copilot/frontend-tools.ts` — the `execute_code` frontend action handler destructures `{ command, output }` but the LangGraph tool returns a JSON string `{ exitCode, stdout, stderr }`. Update handlers to parse the content parameter as JSON. The AG-UI bridge delivers tool result content as a string, so each handler needs: `const data = JSON.parse(content);` before using the fields. Affected actions: `browse_web`, `execute_code`, `list_files`, `read_file`, `write_file`
- [ ] T003 [P0] Wire `conversationId` from frontend to agent runtime — modify `src/app/(app)/chat/page.tsx` to pass `conversationId` and `userId` via `CopilotKit`'s `runtimeProps` or as session attributes. Update `src/lib/agent/dexter-agent.ts` to extract `conversationId` from the correct runtime property path. The sandbox manager uses `conversationId` to track `sandboxId` — this must match the DB conversation ID, not an auto-generated CopilotKit thread ID
- [ ] T004 [P] [P0] Add regression tests for P0 fixes in `src/__tests__/browser-surface.test.ts` — test that the browser surface renders the screenshot src without double-encoding the data URI prefix
- [ ] T005 [P] [P0] Add regression test for AG-UI bridge in `src/__tests__/frontend-tools.test.ts` — test that `execute_code` handler correctly parses JSON tool result content and extracts stdout/stderr/exitCode

**Checkpoint**: All P0 bugs fixed — browser screenshots render, tool results appear in workspace panels, sandbox tracking uses correct conversation IDs

---

## Phase 2: High-Severity Bug Fixes (P1 — Functional Gaps)

**Purpose**: Fix bugs that cause incorrect behavior or degraded UX

- [ ] T006 [P1] Fix unbounded session map in `src/lib/daytona/tools/execute-command.ts` — the module-level `const sessions = new Map<string, any>()` grows unboundedly and does not survive serverless cold starts. Replace with Daytona session ID tracking (the session ID returned by `createSession` is the reference; no local cache needed since the sandbox already tracks it). Remove the local Map entirely and pass the `sessionId` to each `executeSessionCommand` call directly
- [ ] T007 [P] [P1] Add regression test for session management in `src/__tests__/daytona/tools/execute-command.test.ts` — test that `executeCommand` handles session re-creation when no sessionId is provided, and reuses an existing session when sessionId is given
- [ ] T008 [P1] Add missing frontend `useCopilotAction` hooks for tools that only return chat text — create frontend actions for `delete_file`, `git_clone`, `git_status`, `git_commit`, `web_search`, `take_screenshot` in `src/components/copilot/frontend-tools.ts` so the workspace activity log and panels reflect these operations

**Checkpoint**: All P1 bugs fixed — local state is bounded, session management works in serverless, all 14 tools have frontend feedback

---

## Phase 3: Polish & Hardening (P2 — Quality)

**Purpose**: Recommendations that improve code quality and deployment readiness

- [ ] T009 [P2] Fix `dev` script in `package.json` — change `"dev": "next build && next start --port 3001"` to `"dev": "next dev --port 3001"` for standard development workflow. Add a separate `"dev:prod": "next build && next start --port 3001"` script for production-like testing
- [ ] T010 [P2] Update `.env.example` — add missing env vars: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `BETTER_AUTH_SECRET` with clear placeholder values and comments explaining when each is needed
- [ ] T011 [P2] Add embedding provider guidance to `src/lib/agent/tools/memory.ts` — add a comment and console.warn message that guides users to set `OPENAI_API_KEY` for proper pgvector embeddings. Update the fallback embedding to log more clearly when operating in degraded mode
- [ ] T012 [P] [P2] Add frontend tool registration test in `src/__tests__/frontend-tools-registration.test.ts` — verify that every LangGraph tool name (from `src/lib/daytona/tools/index.ts`) has a corresponding `useCopilotAction` hook registered in `src/components/copilot/frontend-tools.ts`. This prevents silent name mismatches in the AG-UI bridge
- [ ] T013 [P] [P2] Audit `src/lib/agent/dexter-agent.ts` for CopilotKit AG-UI protocol changes — check if `@copilotkit/runtime` version `^1.59.5` supports `LangGraphAgent` from `@copilotkit/runtime/langgraph`. If yes, migrate from the custom `AbstractAgent` adapter to the official `LangGraphAgent({ graph: compiledGraph })` to reduce maintenance burden
- [ ] T014 [P2] Add structured logging throughout the agent pipeline — wrap key flows in `src/lib/agent/dexter-agent.ts`, `src/lib/daytona/sandbox-manager.ts`, and `src/lib/daytona/client.ts` with structured console.log that includes `[agent]`, `[sandbox]`, `[daytona]` prefixes and conversation IDs for debugging production issues

**Checkpoint**: All polish items complete — env vars documented, embedding fallback clear, tool names validated, agent adapter audited, logging structured

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (P0 fixes)**: No dependencies — start immediately
- **Phase 2 (P1 fixes)**: Depends on Phase 1 T001-T003 (the code fixes, not the tests) — the functional changes must be in place before adding session management fixes
- **Phase 3 (Polish)**: Depends on Phase 1 and Phase 2 — all bugs should be fixed before quality improvements

### Task Dependencies

- **T001 (browser surface fix)**: No dependencies — standalone 5-min fix
- **T002 (AG-UI bridge fix)**: No dependencies — standalone frontend fix
- **T003 (conversationId wiring)**: No dependencies — runtime wiring fix
- **T004, T005 (regression tests)**: Depend on T001, T002 respectively (code must be fixed first)
- **T006 (session map fix)**: No dependencies — standalone tool fix
- **T007 (session test)**: Depend on T006
- **T008 (missing frontend actions)**: No dependencies — new useCopilotAction hooks
- **T009-T014 (polish)**: No strict dependencies — can run after Phase 1

### Parallel Opportunities

- T001, T002, T003 can run in parallel (different files)
- T006 can run in parallel with T001-T003
- T008 can run in parallel with T001-T003
- T009-T014 can all run in parallel (different files)

---

## Parallel Example: Phase 1

```bash
# Launch all P0 fixes together:
T001: "Fix browser surface data URI duplication in browser-surface.tsx"
T002: "Fix AG-UI bridge tool result parsing in frontend-tools.ts"
T003: "Wire conversationId from frontend to agent in chat/page.tsx"
```

## Parallel Example: Phase 2

```bash
# Launch P1 fixes together:
T006: "Fix session map in execute-command.ts"
T008: "Add missing frontend actions in frontend-tools.ts"
```

---

## Implementation Strategy

### Critical Path First

1. Fix all P0 bugs (Phase 1 code fixes only): T001, T002, T003
2. Write regression tests: T004, T005
3. Fix P1 bugs: T006, T008
4. Write P1 tests: T007
5. Polish: T009, T010, T011, T012, T013, T014

### Validation Checkpoints

1. After T001: Open browser panel — screenshot should render correctly
2. After T002: Run `execute_code` tool — output should appear in terminal panel
3. After T003: Check database — sandboxId should map to conversation.id
4. After T006: Run multiple commands — session count should not grow unboundedly
5. After T012: Verify all 14 LangGraph tool names have matching frontend actions

---

## Notes

- [P] tasks = different files, no dependencies
- All P0 fixes must be deployed before the app can go to production
- The AG-UI bridge fix (T002) is the most impactful — without it, no workspace panels update
- T013 (LangGraphAgent migration) is optional — only do if CopilotKit 1.59.5 supports it
