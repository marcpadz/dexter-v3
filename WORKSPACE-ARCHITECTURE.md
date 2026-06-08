# Dexter v3 — Workspace Panel Architecture

> The third panel: multipurpose canvas for artifacts, browser, editor, terminal, and agent output  
> Integrates with CopilotKit's generative UI + AG-UI protocol

---

## 1. Layout Architecture

### Three-panel layout

```
┌──────────┬─────────────────────────────────┬─────────────────────────┐
│          │                                 │                         │
│  Sidebar │     Chat Panel (Center)         │   Workspace Panel       │
│  (Nav)   │     CopilotChat                 │   (Resizable, Slidable) │
│          │     - Messages                   │                         │
│  240px   │     - Tool call rendering        │   Tabbed content:       │
│  fixed   │     - Generative UI              │   ┌──────────────────┐  │
│          │     - Human-in-the-loop          │   │ ○ Artifacts      │  │
│          │                                 │   │ ○ Browser        │  │
│          │     Agent streams here           │   │ ○ Document       │  │
│          │     Tools render inline          │   │ ○ Terminal       │  │
│          │                                 │   │ ○ Files          │  │
│          │                                 │   └──────────────────┘  │
│          │                                 │                         │
│          │                                 │   Content area:         │
│          │                                 │   - Artifact viewer     │
│          │                                 │   - Live browser        │
│          │                                 │   - Rich text editor    │
│          │                                 │   - Terminal iframe     │
│          │                                 │   - File explorer       │
│          │                                 │   - Agent output stream │
│          │                                 │                         │
└──────────┴─────────────────────────────────┴─────────────────────────┘
```

### Interaction model

```
User types message
      │
      ▼
Agent processes ──────── Agent calls tool ──────── Agent streams response
      │                        │                           │
      │                        ▼                           │
      │              Tool decides: render where?           │
      │               ┌──────┴──────┐                     │
      │               │             │                      │
      │               ▼             ▼                      │
      │          Inline in     Open in Workspace            │
      │          Chat Panel    Panel (right)                │
      │               │             │                      │
      │               │             ▼                      │
      │               │      Workspace auto-opens          │
      │               │      to the correct tab            │
      │               │             │                      │
      ▼               ▼             ▼                      ▼
   Chat updates   Chat shows    Workspace shows         Chat shows
   with agent     inline tool   full artifact /         final text
   response       result card   browser / editor        response
```

---

## 2. Workspace Panel — Component Architecture

### File structure

```
src/
├── components/
│   ├── layout/
│   │   ├── app-shell.tsx              # Three-panel layout orchestrator
│   │   └── resize-handle.tsx          # Styled resize handle
│   │
│   ├── workspace/
│   │   ├── workspace-panel.tsx        # Main panel container + tab router
│   │   ├── workspace-tabs.tsx         # Tab bar component
│   │   ├── workspace-store.ts         # Zustand store for workspace state
│   │   │
│   │   ├── surfaces/                  # Each tab is a "surface"
│   │   │   ├── artifacts/
│   │   │   │   ├── artifact-surface.tsx      # Artifact tab content
│   │   │   │   ├── artifact-viewer.tsx       # Universal viewer (code, html, svg, etc)
│   │   │   │   ├── artifact-document.tsx     # Rich document editor surface
│   │   │   │   └── artifact-browser.tsx      # Browser artifact surface
│   │   │   │
│   │   │   ├── browser/
│   │   │   │   ├── browser-surface.tsx       # Browser tab content
│   │   │   │   ├── browser-toolbar.tsx       # URL bar + controls
│   │   │   │   ├── browser-preview.tsx       # noVNC iframe or screenshot-based
│   │   │   │   └── browser-store.ts          # Browser state
│   │   │   │
│   │   │   ├── document/
│   │   │   │   ├── document-surface.tsx      # Document editor tab
│   │   │   │   ├── tiptap-editor.tsx         # TipTap rich text editor
│   │   │   │   └── document-toolbar.tsx      # Formatting controls
│   │   │   │
│   │   │   ├── terminal/
│   │   │   │   ├── terminal-surface.tsx      # Terminal tab content
│   │   │   │   └── xterm-wrapper.tsx         # xterm.js wrapper
│   │   │   │
│   │   │   ├── files/
│   │   │   │   ├── files-surface.tsx         # File explorer tab
│   │   │   │   ├── file-tree.tsx             # Tree view component
│   │   │   │   └── file-preview.tsx          # File content preview
│   │   │   │
│   │   │   └── agent-output/
│   │   │       ├── agent-output-surface.tsx  # Live agent output stream
│   │   │       └── streaming-text.tsx        # Real-time text renderer
│   │   │
│   │   └── shared/
│   │       ├── workspace-header.tsx          # Panel header with title + controls
│   │       └── workspace-activity.tsx        # Activity log display
│   │
│   └── copilot/
│       ├── tool-renderers/                   # CopilotKit generative UI renderers
│       │   ├── render-artifact.tsx           # Opens artifact in workspace
│       │   ├── render-browser.tsx            # Opens browser in workspace
│       │   ├── render-document.tsx           # Opens document in workspace
│       │   ├── render-search.tsx             # Search results (inline or workspace)
│       │   └── render-code-execution.tsx     # Code execution (inline or workspace)
│       │
│       └── frontend-tools.ts                 # useCopilotAction definitions
```

---

## 3. Workspace Store

```typescript
// src/components/workspace/workspace-store.ts
import { create } from 'zustand';

export type WorkspaceTab =
  | 'artifacts'     // Code, HTML, SVG, React components, presentations
  | 'browser'       // Live Chromium browser (noVNC or screenshot-based)
  | 'document'      // Rich text / markdown editor
  | 'terminal'      // Web terminal (xterm.js)
  | 'files'         // File explorer for workspace/sandbox
  | 'agent-output'  // Direct agent output stream (like a canvas)

export type ArtifactType =
  | 'code'          // Any code with syntax highlighting
  | 'html'          // Rendered HTML preview
  | 'svg'           // SVG preview
  | 'react'         // Live React component preview
  | 'document'      // Rich text document
  | 'presentation'  // Slides
  | 'image'         // Image viewer
  | 'diff'          // Code diff view
  | 'mermaid'       // Mermaid diagram

export interface Artifact {
  id: string
  type: ArtifactType
  title: string
  content: string
  language?: string
  metadata?: Record<string, unknown>
  createdAt: number
  updatedAt: number
}

export interface WorkspaceActivity {
  id: string
  kind: 'info' | 'success' | 'error' | 'action'
  title: string
  detail?: string
  timestamp: number
}

interface WorkspaceState {
  // Panel state
  isOpen: boolean
  activeTab: WorkspaceTab
  panelSize: number  // percentage (20-50%)

  // Artifacts
  artifacts: Artifact[]
  activeArtifactId: string | null

  // Browser
  browserUrl: string
  browserStatus: 'idle' | 'loading' | 'ready' | 'error'
  browserScreenshot: string | null  // base64 JPEG

  // Document
  documentContent: string
  documentTitle: string

  // Terminal
  terminalSessionId: string | null

  // Files
  files: WorkspaceFile[]
  currentPath: string | null
  selectedFilePath: string | null

  // Agent output
  agentOutputStream: string  // Accumulated streaming text
  agentOutputMetadata: Record<string, unknown>

  // Activity log
  activities: WorkspaceActivity[]

  // Actions
  open: (tab?: WorkspaceTab) => void
  close: () => void
  setActiveTab: (tab: WorkspaceTab) => void
  setPanelSize: (size: number) => void

  addArtifact: (artifact: Artifact) => void
  removeArtifact: (id: string) => void
  updateArtifact: (id: string, content: string) => void
  setActiveArtifact: (id: string) => void

  setBrowserUrl: (url: string) => void
  setBrowserStatus: (status: WorkspaceState['browserStatus']) => void
  setBrowserScreenshot: (screenshot: string | null) => void

  setDocumentContent: (content: string) => void

  pushActivity: (entry: Omit<WorkspaceActivity, 'id' | 'timestamp'>) => void
}

export interface WorkspaceFile {
  name: string
  path: string
  isDir: boolean
  size: number
  modifiedAt: string
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  isOpen: false,
  activeTab: 'artifacts',
  panelSize: 40,
  artifacts: [],
  activeArtifactId: null,
  browserUrl: 'https://',
  browserStatus: 'idle',
  browserScreenshot: null,
  documentContent: '',
  documentTitle: 'Untitled',
  terminalSessionId: null,
  files: [],
  currentPath: null,
  selectedFilePath: null,
  agentOutputStream: '',
  agentOutputMetadata: {},
  activities: [],

  open: (tab) => set({ isOpen: true, ...(tab ? { activeTab: tab } : {}) }),
  close: () => set({ isOpen: false }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setPanelSize: (panelSize) => set({ panelSize }),

  addArtifact: (artifact) =>
    set((s) => ({
      artifacts: [...s.artifacts, artifact],
      activeArtifactId: artifact.id,
      isOpen: true,
      activeTab: 'artifacts',
    })),

  removeArtifact: (id) =>
    set((s) => ({
      artifacts: s.artifacts.filter((a) => a.id !== id),
      activeArtifactId: s.activeArtifactId === id
        ? (s.artifacts.find((a) => a.id !== id)?.id ?? null)
        : s.activeArtifactId,
    })),

  updateArtifact: (id, content) =>
    set((s) => ({
      artifacts: s.artifacts.map((a) =>
        a.id === id ? { ...a, content, updatedAt: Date.now() } : a
      ),
    })),

  setActiveArtifact: (id) => set({ activeArtifactId: id }),

  setBrowserUrl: (url) => set({ browserUrl: url }),
  setBrowserStatus: (status) => set({ browserStatus: status }),
  setBrowserScreenshot: (screenshot) => set({ browserScreenshot: screenshot }),

  setDocumentContent: (content) => set({ documentContent: content }),

  pushActivity: (entry) =>
    set((s) => ({
      activities: [
        { ...entry, id: crypto.randomUUID(), timestamp: Date.now() },
        ...s.activities,
      ].slice(0, 50),
    })),
}));
```

---

## 4. App Shell — Three-Panel Layout

```tsx
// src/components/layout/app-shell.tsx
"use client";

import { useRef } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { CopilotKit } from '@copilotkit/react-core';
import { CopilotChat } from '@copilotkit/react-ui';
import '@copilotkit/react-ui/styles.css';

import { AppSidebar } from './app-sidebar';
import { WorkspacePanel } from '@/components/workspace/workspace-panel';
import { useWorkspaceStore } from '@/components/workspace/workspace-store';

export function AppShell({ children }: { children: React.ReactNode }) {
  const workspaceOpen = useWorkspaceStore((s) => s.isOpen);

  return (
    <CopilotKit runtimeUrl="/api/copilotkit">
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        {/* Left: Sidebar (fixed 240px) */}
        <AppSidebar />

        {/* Center + Right: Resizable panels */}
        <PanelGroup direction="horizontal" className="flex-1">
          {/* Center: Chat */}
          <Panel defaultSize={workspaceOpen ? 45 : 80} minSize={30}>
            <div className="flex h-full flex-col">
              {/* Chat panel */}
              <CopilotChat
                className="flex-1"
                labels={{
                  title: 'Dexter',
                  initial: 'What are we working on today?',
                }}
              />
            </div>
          </Panel>

          {/* Resize handle */}
          {workspaceOpen && (
            <PanelResizeHandle className="w-1.5 bg-border hover:bg-primary/20 transition-colors" />
          )}

          {/* Right: Workspace */}
          {workspaceOpen && (
            <Panel defaultSize={40} minSize={25} maxSize={60}>
              <WorkspacePanel />
            </Panel>
          )}
        </PanelGroup>
      </div>
    </CopilotKit>
  );
}
```

---

## 5. Workspace Panel

```tsx
// src/components/workspace/workspace-panel.tsx
"use client";

import { useWorkspaceStore, type WorkspaceTab } from './workspace-store';
import { WorkspaceTabs } from './workspace-tabs';
import { ArtifactSurface } from './surfaces/artifacts/artifact-surface';
import { BrowserSurface } from './surfaces/browser/browser-surface';
import { DocumentSurface } from './surfaces/document/document-surface';
import { TerminalSurface } from './surfaces/terminal/terminal-surface';
import { FilesSurface } from './surfaces/files/files-surface';
import { AgentOutputSurface } from './surfaces/agent-output/agent-output-surface';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SURFACES: Record<WorkspaceTab, React.ComponentType> = {
  artifacts: ArtifactSurface,
  browser: BrowserSurface,
  document: DocumentSurface,
  terminal: TerminalSurface,
  files: FilesSurface,
  'agent-output': AgentOutputSurface,
};

export function WorkspacePanel() {
  const activeTab = useWorkspaceStore((s) => s.activeTab);
  const close = useWorkspaceStore((s) => s.close);

  const Surface = SURFACES[activeTab];

  return (
    <div className="flex h-full flex-col border-l bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <WorkspaceTabs />
        <Button variant="ghost" size="icon" onClick={close} className="h-8 w-8">
          <X className="size-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Surface />
      </div>
    </div>
  );
}
```

---

## 6. How Agent Tools Drive the Workspace

This is the critical integration — **CopilotKit tools that open workspace surfaces**:

```tsx
// src/components/copilot/frontend-tools.ts
"use client";

import { useCopilotAction, useCopilotReadable } from '@copilotkit/react-core';
import { useWorkspaceStore, type ArtifactType } from '@/components/workspace/workspace-store';

/**
 * These hooks are registered in the chat page component.
 * When the agent calls these tools, the workspace panel opens
 * and shows the appropriate content.
 */
export function useWorkspaceTools() {
  const addArtifact = useWorkspaceStore((s) => s.addArtifact);
  const setActiveTab = useWorkspaceStore((s) => s.setActiveTab);
  const setBrowserUrl = useWorkspaceStore((s) => s.setBrowserUrl);
  const open = useWorkspaceStore((s) => s.open);
  const setDocumentContent = useWorkspaceStore((s) => s.setDocumentContent);

  // Tool 1: Create an artifact (code, HTML, SVG, React component, etc.)
  useCopilotAction({
    name: 'createArtifact',
    description: 'Create a visual artifact that the user can see and interact with',
    parameters: [
      { name: 'type', type: 'string', required: true,
        description: 'Artifact type: code | html | svg | react | document | presentation | image | diff | mermaid' },
      { name: 'title', type: 'string', required: true },
      { name: 'content', type: 'string', required: true },
      { name: 'language', type: 'string', required: false },
    ],
    handler: async ({ type, title, content, language }) => {
      const artifact = {
        id: crypto.randomUUID(),
        type: type as ArtifactType,
        title,
        content,
        language,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      addArtifact(artifact);
      // Workspace auto-opens to artifacts tab (handled in addArtifact)
    },
    // Render: shows inline in chat as a card with "Open in Workspace" button
    render: ({ status, args, result }) => (
      <ArtifactCard
        status={status}
        title={args.title}
        type={args.type}
        onOpenInWorkspace={() => {
          // The artifact is already added; just open the panel
          open('artifacts');
        }}
      />
    ),
  });

  // Tool 2: Update an existing artifact (agent edits in real-time)
  useCopilotAction({
    name: 'updateArtifact',
    description: 'Update the content of an existing artifact',
    parameters: [
      { name: 'artifactId', type: 'string', required: true },
      { name: 'content', type: 'string', required: true },
    ],
    handler: async ({ artifactId, content }) => {
      useWorkspaceStore.getState().updateArtifact(artifactId, content);
    },
  });

  // Tool 3: Open browser
  useCopilotAction({
    name: 'openBrowser',
    description: 'Open a URL in the workspace browser panel',
    parameters: [
      { name: 'url', type: 'string', required: true },
    ],
    handler: async ({ url }) => {
      setBrowserUrl(url);
      open('browser');
    },
    render: ({ status, args }) => (
      <BrowserCard status={status} url={args.url} />
    ),
  });

  // Tool 4: Create/edit document
  useCopilotAction({
    name: 'editDocument',
    description: 'Create or edit a rich text document in the workspace',
    parameters: [
      { name: 'title', type: 'string', required: true },
      { name: 'content', type: 'string', required: true,
        description: 'Markdown or rich text content' },
    ],
    handler: async ({ title, content }) => {
      setDocumentContent(content);
      useWorkspaceStore.getState().open('document');
    },
    render: ({ status, args }) => (
      <DocumentCard status={status} title={args.title} />
    ),
  });

  // Tool 5: Stream agent output to workspace
  useCopilotAction({
    name: 'streamToWorkspace',
    description: 'Stream output directly to the workspace panel (for long-form content)',
    parameters: [
      { name: 'content', type: 'string', required: true },
    ],
    handler: async ({ content }) => {
      const state = useWorkspaceStore.getState();
      useWorkspaceStore.setState({
        agentOutputStream: state.agentOutputStream + content,
      });
      open('agent-output');
    },
  });
}
```

### Server-side tools that trigger workspace

```typescript
// src/app/api/copilotkit/route.ts
// Server tools can also open the workspace by returning artifact data

import { defineTool } from '@copilotkit/runtime/v2';
import { z } from 'zod';

const generateCode = defineTool({
  name: 'generateCode',
  description: 'Generate code and show it as an artifact in the workspace',
  parameters: z.object({
    filename: z.string(),
    language: z.string(),
    code: z.string(),
  }),
  execute: async ({ filename, language, code }) => {
    // The result is sent to the client via AG-UI protocol
    // The frontend tool renderer catches it and opens the workspace
    return {
      type: 'code' as const,
      title: filename,
      content: code,
      language,
    };
  },
});

const browseWeb = defineTool({
  name: 'browseWeb',
  description: 'Browse a website and show it in the workspace browser',
  parameters: z.object({
    url: z.string().url(),
    action: z.enum(['navigate', 'screenshot', 'extract']).default('navigate'),
  }),
  execute: async ({ url, action }) => {
    // Use Playwright/headless browser on the server
    const result = await browserService.execute({ url, action });
    return {
      url,
      screenshot: result.screenshot, // base64
      title: result.title,
      content: result.textContent,
    };
  },
});

const executeCode = defineTool({
  name: 'executeCode',
  description: 'Execute code in a sandboxed environment and show results',
  parameters: z.object({
    language: z.enum(['javascript', 'python', 'shell']),
    code: z.string(),
  }),
  execute: async ({ language, code }) => {
    // Sandbox execution (Daytona, Docker, or WebContainer)
    const result = await sandbox.execute(language, code);
    return {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      artifacts: result.artifacts, // files, plots, etc.
    };
  },
});
```

---

## 7. Each Workspace Surface

### Artifacts Surface

Reuses v1's `ArtifactWorkspace` pattern but rebuilt:

| Artifact Type | Viewer | Editor | Preview |
|---|---|---|---|
| `code` | Syntax-highlighted code block (Shiki) | Monaco Editor | — |
| `html` | Sandboxed iframe preview | Code editor | Live reload |
| `svg` | Rendered SVG image | Code editor | Live reload |
| `react` | Live React preview (error boundary) | Monaco Editor | Hot reload |
| `document` | TipTap rich text editor | TipTap (WYSIWYG) | Print/PDF |
| `presentation` | Slide viewer (full-screen) | Markdown editor | Slide preview |
| `image` | Image viewer with zoom | — | — |
| `diff` | Side-by-side diff view | — | — |
| `mermaid` | Rendered diagram | Code editor | Live reload |

```tsx
// src/components/workspace/surfaces/artifacts/artifact-surface.tsx
export function ArtifactSurface() {
  const artifacts = useWorkspaceStore((s) => s.artifacts);
  const activeArtifactId = useWorkspaceStore((s) => s.activeArtifactId);
  const setActiveArtifact = useWorkspaceStore((s) => s.setActiveArtifact);
  const updateArtifact = useWorkspaceStore((s) => s.updateArtifact);
  const removeArtifact = useWorkspaceStore((s) => s.removeArtifact);

  const active = artifacts.find((a) => a.id === activeArtifactId) ?? artifacts[0];

  if (artifacts.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <p className="text-muted-foreground text-sm">No artifacts yet</p>
          <p className="text-muted-foreground/70 mt-1 text-xs">
            Ask the agent to create code, documents, or visualizations
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Artifact tabs */}
      <ScrollArea className="border-b px-2">
        <div className="flex gap-1 py-2">
          {artifacts.map((a) => (
            <ArtifactTab
              key={a.id}
              artifact={a}
              active={a.id === active?.id}
              onSelect={() => setActiveArtifact(a.id)}
              onClose={() => removeArtifact(a.id)}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Artifact content */}
      {active && (
        <ArtifactViewer
          artifact={active}
          onUpdate={(content) => updateArtifact(active.id, content)}
        />
      )}
    </div>
  );
}
```

### Browser Surface

Three modes (from v1's design spec):
1. **Screenshot-based** — agent takes screenshots, user can click to interact
2. **noVNC iframe** — full interactive Chromium via WebSocket (for self-hosted)
3. **Embedded** — simple iframe for whitelisted URLs

```tsx
// src/components/workspace/surfaces/browser/browser-surface.tsx
export function BrowserSurface() {
  const url = useWorkspaceStore((s) => s.browserUrl);
  const setUrl = useWorkspaceStore((s) => s.setBrowserUrl);
  const status = useWorkspaceStore((s) => s.browserStatus);
  const screenshot = useWorkspaceStore((s) => s.browserScreenshot);

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <Globe className="size-4 text-muted-foreground shrink-0" />
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter URL..."
          className="h-8 text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              // Navigate (agent tool or direct iframe)
            }
          }}
        />
        <Button size="sm" variant="secondary">Go</Button>
        <Button size="sm" variant="ghost">
          <ArrowClockwise className="size-4" />
        </Button>
      </div>

      {/* Browser content */}
      {status === 'idle' ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground text-sm">
            Enter a URL or ask the agent to browse
          </p>
        </div>
      ) : screenshot ? (
        // Screenshot-based preview (lighter weight)
        <div className="flex-1 p-4">
          <img
            src={`data:image/jpeg;base64,${screenshot}`}
            alt="Browser preview"
            className="max-h-full max-w-full rounded-lg border shadow-sm"
          />
        </div>
      ) : (
        // Full interactive iframe (noVNC or direct)
        <iframe
          src={url}
          className="flex-1 w-full"
          sandbox="allow-same-origin allow-scripts allow-forms"
        />
      )}
    </div>
  );
}
```

### Document Surface

```tsx
// src/components/workspace/surfaces/document/document-surface.tsx
// Uses TipTap for rich text editing — agent can stream content here
export function DocumentSurface() {
  const content = useWorkspaceStore((s) => s.documentContent);
  const setContent = useWorkspaceStore((s) => s.setDocumentContent);
  const title = useWorkspaceStore((s) => s.documentTitle);

  return (
    <div className="flex h-full flex-col">
      {/* Document header */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <input
          value={title}
          onChange={(e) => useWorkspaceStore.getState().documentTitle = e.target.value}
          className="text-sm font-medium bg-transparent border-none outline-none"
          placeholder="Document title"
        />
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost">
            <Download className="size-4" />
          </Button>
          <Button size="sm" variant="ghost">
            <Printer className="size-4" />
          </Button>
        </div>
      </div>

      {/* TipTap editor */}
      <div className="flex-1 overflow-auto">
        <TipTapEditor
          content={content}
          onChange={setContent}
          placeholder="Start writing or ask the agent to draft..."
        />
      </div>
    </div>
  );
}
```

### Agent Output Surface

This is the "canvas" mode — agent streams long-form output directly:

```tsx
// src/components/workspace/surfaces/agent-output/agent-output-surface.tsx
export function AgentOutputSurface() {
  const stream = useWorkspaceStore((s) => s.agentOutputStream);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-2">
        <span className="text-sm font-medium">Agent Output</span>
        <span className="text-muted-foreground text-xs ml-2">Live stream</span>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown
            children={stream}
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              // Custom renderers for code blocks, tables, etc.
              code: ({ children, className }) => (
                <CodeBlock language={className?.replace('language-', '')}>
                  {children}
                </CodeBlock>
              ),
            }}
          />
        </div>
      </div>
    </div>
  );
}
```

---

## 8. How CopilotKit Generative UI Integrates

The key pattern: **CopilotKit tool renders bridge to workspace**.

```tsx
// src/components/copilot/tool-renderers/render-artifact.tsx
// This renders INLINE in the chat when the agent creates an artifact

export function ArtifactCard({ status, title, type, onOpenInWorkspace }: {
  status: 'inProgress' | 'complete' | 'error';
  title: string;
  type: string;
  onOpenInWorkspace: () => void;
}) {
  return (
    <Card className="my-2 overflow-hidden">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {status === 'inProgress' ? (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            ) : (
              <CheckCircle2 className="size-4 text-green-500" />
            )}
            <div>
              <p className="text-sm font-medium">{title}</p>
              <p className="text-xs text-muted-foreground">
                {type} artifact
              </p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={onOpenInWorkspace}>
            <PanelRight className="size-3.5 mr-1" />
            Open in Workspace
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

When the agent calls `createArtifact`:
1. The **handler** adds it to the workspace store → workspace panel auto-opens to artifacts tab
2. The **render** shows an inline card in chat with a button to focus the workspace
3. The user sees the artifact appear in the right panel in real-time

This is exactly how Claude's artifacts work — but powered by CopilotKit's AG-UI protocol.

---

## 9. Human-in-the-Loop Integration

CopilotKit has first-class HITL support. Here's how it integrates with the workspace:

```typescript
// The agent can ask for approval before taking actions
// that affect the workspace (file writes, code execution, etc.)

// In the CopilotKit agent config:
const dexterAgent = new BuiltInAgent({
  model: "openrouter:auto",
  tools: [
    // Tools that require approval
    defineTool({
      name: "writeFile",
      description: "Write content to a file",
      parameters: z.object({
        path: z.string(),
        content: z.string(),
      }),
      // CopilotKit will pause execution and show approval UI
      // before calling execute()
      execute: async ({ path, content }) => {
        return await fileService.write(path, content);
      },
    }),
  ],
  maxSteps: 25,
});

// Frontend: Approval UI renders in the workspace
useCopilotAction({
  name: 'writeFile',
  // ... parameters, handler ...
  render: ({ status, args, result }) => {
    if (status === 'inProgress') {
      return (
        <Card className="border-yellow-500/50">
          <CardContent className="p-3">
            <p className="text-sm font-medium">📁 Write file: {args.path}</p>
            <pre className="mt-2 text-xs bg-muted p-2 rounded max-h-32 overflow-auto">
              {args.content.slice(0, 500)}...
            </pre>
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="default">Approve</Button>
              <Button size="sm" variant="outline">Reject</Button>
              <Button size="sm" variant="ghost">Edit in Workspace</Button>
            </div>
          </CardContent>
        </Card>
      );
    }
  },
});
```

---

## 10. Dependencies for Workspace

```jsonc
{
  // Core workspace
  "react-resizable-panels": "^2.1.0",   // Three-panel resizable layout
  "zustand": "^5.0.14",                 // Workspace state management

  // Artifact viewers
  "shiki": "^1.22.0",                   // Syntax highlighting (code artifacts)
  "@monaco-editor/react": "^4.6.0",     // Code editor (artifact editing)

  // Document editor
  "@tiptap/react": "^2.10.0",           // Rich text editor
  "@tiptap/starter-kit": "^2.10.0",     // Basic extensions
  "@tiptap/extension-markdown": "^2.10.0", // Markdown support

  // Terminal
  "@xterm/xterm": "^5.5.0",             // Terminal emulator
  "@xterm/addon-fit": "^0.10.0",        // Auto-resize

  // Browser
  // (noVNC is loaded via iframe, no npm dep needed)

  // Rendering
  "react-markdown": "^10.1.0",          // Already in v2
  "mermaid": "^11.0.0",                 // Diagram rendering

  // CopilotKit (Plan B)
  "@copilotkit/react-core": "^2",
  "@copilotkit/react-ui": "^2",
  "@copilotkit/runtime": "^2",
}
```

---

## 11. Implementation Order

### Phase 1: Foundation (Day 1-2)
1. Install `react-resizable-panels` + create `AppShell` with three-panel layout
2. Create `workspace-store.ts` (Zustand)
3. Create `WorkspacePanel` with tab bar (empty surfaces)
4. Wire CopilotKit chat in center panel

### Phase 2: Artifact Surface (Day 2-3)
1. Build `ArtifactSurface` with tab management
2. Build `ArtifactViewer` for code, HTML, SVG types
3. Register `createArtifact` + `updateArtifact` as CopilotKit frontend tools
4. Wire agent tool calls → workspace auto-open

### Phase 3: Browser Surface (Day 3-4)
1. Build `BrowserSurface` with URL bar
2. Screenshot-based preview (server sends base64 via tool result)
3. Register `openBrowser` / `browseWeb` as tools
4. (Later) Wire noVNC for interactive mode

### Phase 4: Document Surface (Day 4-5)
1. Install TipTap, build `DocumentSurface`
2. Register `editDocument` as tool
3. Agent can create/edit documents that appear in workspace

### Phase 5: Terminal + Files (Day 5-6)
1. Build `TerminalSurface` with xterm.js
2. Build `FilesSurface` with tree view
3. Wire to sandbox/workspace service

### Phase 6: Agent Output Surface (Day 6)
1. Build `AgentOutputSurface` for streaming markdown
2. Register `streamToWorkspace` tool
3. Long-form agent responses go to workspace instead of chat

---

*Generated by Pi • Workspace architecture informed by v1's ArtifactWorkspace, BrowserCanvas, and Daytona integration*
