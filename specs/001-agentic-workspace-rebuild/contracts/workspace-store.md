# Workspace Store Contract: Dexter v3

**Layer**: Frontend (React + Zustand)  
**Location**: `src/components/workspace/workspace-store.ts`

## Overview

The workspace store is a Zustand store that manages all workspace panel state. It is the **single source of truth** for which surfaces are active, what content they display, and the panel's visual state. All mutations flow through agent tool handlers registered via `useCopilotAction`.

---

## State Shape

```typescript
interface WorkspaceState {
  // Panel state
  isOpen: boolean;
  activeTab: WorkspaceTab;
  panelSize: number;  // percentage (25-60%)

  // Artifacts
  artifacts: Artifact[];
  activeArtifactId: string | null;

  // Browser
  browserUrl: string;
  browserStatus: 'idle' | 'loading' | 'ready' | 'error';
  browserScreenshot: string | null;  // base64 JPEG

  // Document
  documentContent: string;
  documentTitle: string;
  documentId: string | null;

  // Terminal
  terminalSessionId: string | null;
  terminalOutput: string;

  // Files
  files: WorkspaceFile[];
  currentPath: string | null;
  selectedFilePath: string | null;

  // Agent Output
  agentOutputStream: string;
  agentOutputMetadata: Record<string, unknown>;

  // Activity log
  activities: WorkspaceActivity[];
}
```

---

## Types

```typescript
export type WorkspaceTab =
  | 'artifacts'
  | 'browser'
  | 'document'
  | 'terminal'
  | 'files'
  | 'agent-output';

export type ArtifactType =
  | 'code'
  | 'html'
  | 'svg'
  | 'react'
  | 'image'
  | 'diff'
  | 'mermaid';

export interface Artifact {
  id: string;
  type: ArtifactType;
  title: string;
  content: string;
  language?: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface WorkspaceFile {
  name: string;
  path: string;
  isDir: boolean;
  size: number;
  modifiedAt: string;
}

export interface WorkspaceActivity {
  id: string;
  kind: 'info' | 'success' | 'error' | 'action';
  title: string;
  detail?: string;
  timestamp: number;
}
```

---

## Actions (API)

### Panel Control

| Action | Signature | Description |
|--------|-----------|-------------|
| `open` | `(tab?: WorkspaceTab) => void` | Open workspace panel, optionally to a specific tab |
| `close` | `() => void` | Close workspace panel |
| `setActiveTab` | `(tab: WorkspaceTab) => void` | Switch active tab |
| `setPanelSize` | `(size: number) => void` | Set panel width percentage (25-60) |

### Artifacts

| Action | Signature | Description |
|--------|-----------|-------------|
| `addArtifact` | `(artifact: Artifact) => void` | Add artifact, auto-open to artifacts tab |
| `removeArtifact` | `(id: string) => void` | Remove artifact by ID |
| `updateArtifact` | `(id: string, content: string) => void` | Update artifact content |
| `setActiveArtifact` | `(id: string) => void` | Focus a specific artifact |

### Browser

| Action | Signature | Description |
|--------|-----------|-------------|
| `setBrowserUrl` | `(url: string) => void` | Set browser URL |
| `setBrowserStatus` | `(status: BrowserStatus) => void` | Set browser loading status |
| `setBrowserScreenshot` | `(screenshot: string \| null) => void` | Set browser screenshot (base64) |

### Document

| Action | Signature | Description |
|--------|-----------|-------------|
| `setDocumentContent` | `(content: string) => void` | Set document rich text content |
| `setDocumentTitle` | `(title: string) => void` | Set document title |
| `setDocumentId` | `(id: string \| null) => void` | Set active document ID |

### Terminal

| Action | Signature | Description |
|--------|-----------|-------------|
| `setTerminalSessionId` | `(id: string \| null) => void` | Set terminal session ID |
| `appendTerminalOutput` | `(output: string) => void` | Append to terminal output stream |

### Files

| Action | Signature | Description |
|--------|-----------|-------------|
| `setFiles` | `(files: WorkspaceFile[]) => void` | Set file listing |
| `setCurrentPath` | `(path: string \| null) => void` | Set current directory |
| `setSelectedFilePath` | `(path: string \| null) => void` | Set selected file for preview |

### Agent Output

| Action | Signature | Description |
|--------|-----------|-------------|
| `appendAgentOutput` | `(content: string) => void` | Append to agent output stream |
| `clearAgentOutput` | `() => void` | Clear agent output stream |

### Activity Log

| Action | Signature | Description |
|--------|-----------|-------------|
| `pushActivity` | `(entry: Omit<WorkspaceActivity, 'id' \| 'timestamp'>) => void` | Add activity entry (max 50, FIFO) |

---

## Mutation Contract

### Only agent tools may mutate workspace state

Workspace state mutations are triggered exclusively by agent tool calls flowing through the AG-UI → CopilotKit → `useCopilotAction` pipeline:

```typescript
// src/components/copilot/frontend-tools.ts
export function useWorkspaceTools() {
  const addArtifact = useWorkspaceStore((s) => s.addArtifact);
  
  useCopilotAction({
    name: 'create_artifact',  // Matches Python tool name
    parameters: [/* ... */],
    handler: async ({ type, title, content, language }) => {
      // This is the ONLY way artifacts get added to the store
      addArtifact({
        id: crypto.randomUUID(),
        type,
        title,
        content,
        language,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    },
  });
}
```

**Invariant**: `useWorkspaceStore.setState()` must never be called directly from UI components outside of tool action handlers. UI components only read from the store.

---

## Selectors

Surfaces subscribe to relevant slices only to prevent unnecessary re-renders:

```typescript
// Artifact surface subscribes only to artifact data
const artifacts = useWorkspaceStore((s) => s.artifacts);
const activeArtifactId = useWorkspaceStore((s) => s.activeArtifactId);

// Browser surface subscribes only to browser data
const browserUrl = useWorkspaceStore((s) => s.browserUrl);
const browserScreenshot = useWorkspaceStore((s) => s.browserScreenshot);
```

---

*Part of the workspace panel architecture contract definition.*
