# Sandbox Tool Contracts

**Date**: 2026-06-13 | **Spec**: [spec.md](../spec.md)

All tools are LangGraph.js `tool()` definitions called from the agent graph. Each tool receives a `conversationId` from the graph state to resolve the Daytona sandbox.

## Code Execution Tools

### `execute_code`

| Field | Value |
|-------|-------|
| **Name** | `execute_code` |
| **Description** | Execute code in the sandbox. Supports Python, JavaScript, TypeScript, and shell. |
| **Input** | `{ language: "python" \| "javascript" \| "typescript" \| "sh", code: string, timeout?: number }` |
| **Output** | `{ exitCode: number, stdout: string, stderr: string, artifacts?: { charts?: Chart[] } }` |
| **Daytona API** | `sandbox.process.codeRun(code)` for Python; `sandbox.process.executeCommand(cmd)` for others |
| **Error** | Timeout → `{ exitCode: 124, stderr: "Execution timed out" }` |

### `execute_command`

| Field | Value |
|-------|-------|
| **Name** | `execute_command` |
| **Description** | Execute a shell command in a persistent terminal session. State persists between calls. |
| **Input** | `{ command: string, sessionId?: string, cwd?: string, timeout?: number }` |
| **Output** | `{ sessionId: string, exitCode: number, stdout: string, stderr: string }` |
| **Daytona API** | `sandbox.process.createSession()` / `sandbox.process.executeSessionCommand()` |
| **Notes** | If `sessionId` not provided, creates a new session. Returns `sessionId` for reuse. |

## File System Tools

### `list_files`

| Field | Value |
|-------|-------|
| **Name** | `list_files` |
| **Description** | List files and directories at a path in the sandbox. |
| **Input** | `{ path: string }` |
| **Output** | `{ files: Array<{ name: string, isDir: boolean, size: number }> }` |
| **Daytona API** | `sandbox.fs.listFiles(path)` |

### `read_file`

| Field | Value |
|-------|-------|
| **Name** | `read_file` |
| **Description** | Read the contents of a file in the sandbox. |
| **Input** | `{ path: string }` |
| **Output** | `{ content: string, path: string }` |
| **Daytona API** | `sandbox.fs.downloadFile(path)` → Buffer → string |

### `write_file`

| Field | Value |
|-------|-------|
| **Name** | `write_file` |
| **Description** | Write content to a file in the sandbox. Creates parent directories if needed. |
| **Input** | `{ path: string, content: string }` |
| **Output** | `{ success: boolean, path: string, bytesWritten: number }` |
| **Daytona API** | `sandbox.fs.uploadFile(Buffer, path)` |

### `delete_file`

| Field | Value |
|-------|-------|
| **Name** | `delete_file` |
| **Description** | Delete a file or directory in the sandbox. |
| **Input** | `{ path: string, recursive?: boolean }` |
| **Output** | `{ success: boolean, path: string }` |
| **Daytona API** | `sandbox.fs.deleteFile(path, recursive)` |

## Git Tools

### `git_clone`

| Field | Value |
|-------|-------|
| **Name** | `git_clone` |
| **Description** | Clone a git repository into the sandbox. |
| **Input** | `{ url: string, path: string, branch?: string }` |
| **Output** | `{ success: boolean, path: string }` |
| **Daytona API** | `sandbox.git.clone(url, path, branch)` |

### `git_status`

| Field | Value |
|-------|-------|
| **Name** | `git_status` |
| **Description** | Get git status of a repository in the sandbox. |
| **Input** | `{ path: string }` |
| **Output** | `{ currentBranch: string, ahead: number, behind: number, fileStatus: FileStatus[] }` |
| **Daytona API** | `sandbox.git.status(path)` |

### `git_commit`

| Field | Value |
|-------|-------|
| **Name** | `git_commit` |
| **Description** | Stage and commit changes in a sandbox repository. |
| **Input** | `{ path: string, message: string, files?: string[] }` |
| **Output** | `{ sha: string }` |
| **Daytona API** | `sandbox.git.add()` + `sandbox.git.commit()` |

## Browser Tools

### `browse_url`

| Field | Value |
|-------|-------|
| **Name** | `browse_url` |
| **Description** | Open a URL in the sandbox browser and take a screenshot. |
| **Input** | `{ url: string, action?: "screenshot" \| "click" \| "type" \| "scroll", x?: number, y?: number, text?: string }` |
| **Output** | `{ url: string, screenshot: string (base64 JPEG), title?: string }` |
| **Daytona API** | `sandbox.computerUse.start()` + `sandbox.computerUse.keyboard/mouse/screenshot` |

### `take_screenshot`

| Field | Value |
|-------|-------|
| **Name** | `take_screenshot` |
| **Description** | Take a screenshot of the current browser state. |
| **Input** | `{ showCursor?: boolean }` |
| **Output** | `{ screenshot: string (base64), width: number, height: number }` |
| **Daytona API** | `sandbox.computerUse.screenshot.takeCompressed()` |

## Search Tool

### `web_search`

| Field | Value |
|-------|-------|
| **Name** | `web_search` |
| **Description** | Search the web for information. |
| **Input** | `{ query: string, maxResults?: number }` |
| **Output** | `{ results: Array<{ title: string, url: string, content: string }> }` |
| **Daytona API** | N/A — uses Tavily API directly |
