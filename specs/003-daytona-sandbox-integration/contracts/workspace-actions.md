# Workspace Action Contracts

**Date**: 2026-06-13 | **Spec**: [spec.md](../spec.md)

These are the CopilotKit `useCopilotAction` hooks registered in `src/components/copilot/frontend-tools.ts`. They are the bridge between agent tool results and workspace panel surfaces. **No changes needed** — these already exist and work. Documenting for contract completeness.

## Terminal Actions

### `execute_code` (frontend action)

Triggered when the agent calls the `execute_code` tool. Appends output to the terminal surface.

| Field | Value |
|-------|-------|
| **Action Name** | `execute_code` |
| **Parameters** | `{ command: string, output: string }` |
| **Handler** | Appends `$ {command}\n{output}\n` to `workspaceStore.terminalOutput`, sets activeTab to "terminal" |
| **Workspace Effect** | Terminal surface shows the command output |

### `execute_command` (frontend action)

Same as `execute_code` — appends to terminal output.

## Browser Actions

### `browse_web` (frontend action)

Triggered when the agent calls the `browse_url` tool. Displays screenshot in browser surface.

| Field | Value |
|-------|-------|
| **Action Name** | `browse_web` |
| **Parameters** | `{ url: string, screenshot_base64: string }` |
| **Handler** | Sets `workspaceStore.browserUrl` and `browserScreenshot`, sets activeTab to "browser" |
| **Workspace Effect** | Browser surface renders the base64 screenshot |

## File Actions

### `list_files` (frontend action)

| Field | Value |
|-------|-------|
| **Action Name** | `list_files` |
| **Parameters** | `{ path: string, files: Array<{ name, path, isDir, size, modifiedAt }> }` |
| **Handler** | Sets `workspaceStore.files`, sets activeTab to "files" |
| **Workspace Effect** | Files surface shows the directory tree |

### `read_file` (frontend action)

| Field | Value |
|-------|-------|
| **Action Name** | `read_file` |
| **Parameters** | `{ path: string, content: string }` |
| **Handler** | Sets `workspaceStore.selectedFilePath`, sets activeTab to "files" |
| **Workspace Effect** | Files surface highlights the selected file |

### `write_file` (frontend action)

| Field | Value |
|-------|-------|
| **Action Name** | `write_file` |
| **Parameters** | `{ path: string, content: string }` |
| **Handler** | Pushes activity log entry |
| **Workspace Effect** | Activity log shows write confirmation |

## Artifact Actions

### `create_artifact` (frontend action)

| Field | Value |
|-------|-------|
| **Action Name** | `create_artifact` |
| **Parameters** | `{ type: ArtifactType, title: string, content: string, language?: string }` |
| **Handler** | Adds to `workspaceStore.artifacts`, opens workspace to artifacts tab |
| **Workspace Effect** | Artifacts surface shows the new artifact |

### `update_artifact` (frontend action)

| Field | Value |
|-------|-------|
| **Action Name** | `update_artifact` |
| **Parameters** | `{ id: string, content: string }` |
| **Handler** | Updates artifact content in store |
| **Workspace Effect** | Active artifact re-renders with new content |

## Document Actions

### `create_document` (frontend action)

| Field | Value |
|-------|-------|
| **Action Name** | `create_document` |
| **Parameters** | `{ title: string, content: string }` |
| **Handler** | Sets `workspaceStore.documentTitle`, `documentContent`, opens document tab |
| **Workspace Effect** | Document surface shows the TipTap editor with content |

## Key Flow: Agent Tool → Frontend Action → Workspace

```
1. User sends message via <CopilotChat>
2. CopilotRuntime routes to LangGraphAgent
3. LangGraph.js graph executes, calls a tool (e.g., execute_code)
4. Tool handler calls Daytona SDK (e.g., sandbox.process.codeRun)
5. Tool result returns to the graph
6. CopilotKit AG-UI protocol streams tool call + result to frontend
7. The matching useCopilotAction handler fires in the React component
8. Handler updates Zustand workspace store
9. Workspace surface re-renders with the new data
```

The critical piece is that the **agent tool name must match the frontend action name** for CopilotKit to auto-bridge them. Current frontend actions in `frontend-tools.ts` use snake_case names (`create_artifact`, `browse_web`, etc.) — the LangGraph tool definitions must use the same names.
